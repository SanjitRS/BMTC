import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { centralStore } from '../services/store.service';
import { analyticsService } from '../services/analytics.service';
import { PatientRecord } from '../shared/contract';

export class PatientController {
  public async getRoster(req: AuthenticatedRequest, res: Response) {
    const { stage, search, risk } = req.query as { stage?: string; search?: string; risk?: string };
    let patients = centralStore.getPatients();

    // RBAC filtering: Caregivers see assigned patients or all
    if (req.user && req.user.role === 'caregiver' && req.user.assignedPatientIds && req.user.assignedPatientIds.length > 0) {
      patients = patients.filter(p => req.user!.assignedPatientIds!.includes(p.patientId));
    }

    if (stage) {
      patients = patients.filter(p => p.diagnosisStage === stage);
    }

    if (search) {
      const q = search.toLowerCase();
      patients = patients.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.patientId.toLowerCase().includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q))
      );
    }

    // Enrich roster with quick clinical status
    const enriched = patients.map(patient => {
      const scorecard = analyticsService.getPatientScorecard(patient.patientId);
      const activeAlerts = centralStore.getAlerts(patient.patientId).filter(a => a.status === 'active');
      const hasCritical = activeAlerts.some(a => a.severity === 'critical' || a.severity === 'high');

      return {
        ...patient,
        scorecardSummary: {
          cognitiveStatus: scorecard.cognitiveStatus,
          avgAccuracy: scorecard.averageAccuracy,
          totalSessions: scorecard.totalSessions,
          streakDays: scorecard.currentStreakDays,
          adherenceRate: scorecard.adherenceRatePercent
        },
        activeAlertsCount: activeAlerts.length,
        hasCriticalAlert: hasCritical
      };
    });

    return res.json(enriched);
  }

  public async getPatientById(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const patient = centralStore.getPatientById(id);
    if (!patient) {
      return res.status(404).json({ error: `Patient with ID ${id} not found` });
    }
    return res.json(patient);
  }

  public async getPatientScorecard(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const patient = centralStore.getPatientById(id);
    if (!patient) {
      return res.status(404).json({ error: `Patient with ID ${id} not found` });
    }
    const scorecard = analyticsService.getPatientScorecard(id);
    return res.json(scorecard);
  }

  public async createPatient(req: AuthenticatedRequest, res: Response) {
    const data = req.body as Partial<PatientRecord>;
    if (!data.name || !data.diagnosisStage) {
      return res.status(400).json({ error: 'Patient name and diagnosisStage are required' });
    }

    const patientId = data.patientId || 'pat_' + Math.random().toString(36).substr(2, 6);
    const newPatient: PatientRecord = {
      patientId,
      name: data.name,
      age: data.age || 70,
      gender: data.gender || 'male',
      diagnosisStage: data.diagnosisStage || 'early',
      primaryLanguage: data.primaryLanguage || 'en',
      locationTrackingConsent: data.locationTrackingConsent !== false,
      medications: data.medications || [],
      emergencyContacts: data.emergencyContacts || [],
      safeZones: data.safeZones || [],
      updatedBy: req.user ? req.user.name : 'Clinical Admin',
      updatedAt: new Date().toISOString(),
      version: 1,
      notes: data.notes || ''
    };

    const created = centralStore.createPatient(newPatient);
    return res.status(201).json(created);
  }

  /**
   * Versioned Medical Record Update (Admin & Healthcare Worker only)
   * Automatically bumps version and stores previous snapshot in audit history
   */
  public async updateMedicalRecord(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { medications, diagnosisStage, notes, emergencyContacts, changesSummary } = req.body;

    try {
      const updated = centralStore.updatePatientRecord(
        id,
        {
          ...(medications && { medications }),
          ...(diagnosisStage && { diagnosisStage }),
          ...(notes !== undefined && { notes }),
          ...(emergencyContacts && { emergencyContacts })
        },
        req.user ? req.user.name : 'Clinical User',
        req.user ? req.user.role as any : 'healthcare_worker',
        changesSummary || 'Updated medication schedule and clinical notes'
      );

      return res.json({
        message: 'Patient record successfully updated with version bump',
        patient: updated,
        currentVersion: updated.version
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  /**
   * Audit History log for a patient's medical records
   */
  public async getAuditHistory(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const patient = centralStore.getPatientById(id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    return res.json({
      patientId: id,
      patientName: patient.name,
      currentVersion: patient.version,
      updatedAt: patient.updatedAt,
      updatedBy: patient.updatedBy,
      history: patient.history || []
    });
  }

  /**
   * Toggle location tracking consent
   */
  public async setLocationConsent(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { consent } = req.body as { consent: boolean };

    try {
      const updated = centralStore.setLocationConsent(
        id,
        consent,
        req.user ? req.user.name : 'System Admin'
      );
      return res.json({
        message: consent ? 'Location consent enabled' : 'Location consent revoked',
        patient: updated
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  /**
   * GDPR / Right to be Forgotten Hard Deletion
   */
  public async purgePatientGdpr(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { confirmation } = req.body;

    if (confirmation !== 'PERMANENT_DELETE') {
      return res.status(400).json({ 
        error: 'Safety lock: Please provide confirmation="PERMANENT_DELETE" to execute permanent erasure.' 
      });
    }

    try {
      const result = await centralStore.purgePatientDataPermanently(id);
      return res.json({
        message: `Successfully executed GDPR right-to-be-forgotten deletion for patient ${id}.`,
        purgedEntitiesCount: result.purgedCount,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}

export const patientController = new PatientController();
