import { Router, Request, Response } from "express";
import { syncRelay } from "../sanjit/syncRelay";
import { geofenceRelay } from "../sanjit/geofenceRelay";
import { SyncQueueItem, PatientRecord } from "../../shared/contract";

export const nishRouter = Router();

// 1. Central Batch Ingestion Pipeline
nishRouter.post("/sync/batch", (req: Request, res: Response) => {
  try {
    const { items } = req.body as { items: SyncQueueItem[] };

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid batch payload. 'items' array required." });
    }

    const result = syncRelay.processBatch(items);
    return res.status(200).json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Sync processing failed" });
  }
});

// 2. Patient Roster & Drill-Down
nishRouter.get("/patients", (_req: Request, res: Response) => {
  const patients = syncRelay.getAllPatientRecords();
  return res.json({ patients });
});

nishRouter.get("/patients/:id", (req: Request, res: Response) => {
  const patient = syncRelay.getPatientRecord(req.params.id);
  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }
  return res.json({ patient });
});

nishRouter.put("/patients/:id", (req: Request, res: Response) => {
  const patient = req.body as PatientRecord;
  patient.patientId = req.params.id;
  const updated = syncRelay.updatePatientRecord(patient);
  return res.json({ success: true, patient: updated });
});

nishRouter.get("/patients/:id/sessions", (req: Request, res: Response) => {
  const sessions = syncRelay.getGameSessions(req.params.id);
  return res.json({ sessions });
});

nishRouter.get("/patients/:id/reminders", (req: Request, res: Response) => {
  const reminders = syncRelay.getReminderAcks(req.params.id);
  return res.json({ reminders });
});

// 3. Organization-Wide Analytics
nishRouter.get("/analytics/org", (_req: Request, res: Response) => {
  const patients = syncRelay.getAllPatientRecords();
  const allSessions = syncRelay.getGameSessions();
  const debouncedAlerts = geofenceRelay.getDebouncedAlerts();

  const totalPatients = patients.length;
  const earlyCount = patients.filter((p) => p.diagnosisStage === "early").length;
  const moderateCount = patients.filter((p) => p.diagnosisStage === "moderate").length;
  const severeCount = patients.filter((p) => p.diagnosisStage === "severe").length;

  const avgAccuracy =
    allSessions.length > 0
      ? Math.round(allSessions.reduce((acc, s) => acc + s.accuracy, 0) / allSessions.length)
      : 0;

  return res.json({
    totalPatients,
    stageDistribution: {
      early: earlyCount,
      moderate: moderateCount,
      severe: severeCount,
    },
    totalGameSessions: allSessions.length,
    avgOrgAccuracy: avgAccuracy,
    activeAlertsCount: debouncedAlerts.filter((a) => a.currentStatus === "outside").length,
    totalOscillationsRecorded: debouncedAlerts.reduce((sum, a) => sum + a.oscillationCount, 0),
  });
});

// 4. Alert Center & Clinician Dispatch
nishRouter.get("/alerts", (_req: Request, res: Response) => {
  const alerts = geofenceRelay.getDebouncedAlerts();
  return res.json({ alerts });
});

// 5. GDPR & Consent Management
nishRouter.post("/security/consent", (req: Request, res: Response) => {
  const { patientId, gpsConsent, consentGivenBy } = req.body;
  return res.json({
    success: true,
    patientId,
    gpsConsent,
    consentGivenBy,
    updatedAt: new Date().toISOString(),
  });
});

nishRouter.delete("/security/gdpr-delete/:patientId", (req: Request, res: Response) => {
  const { patientId } = req.params;
  syncRelay.deletePatientData(patientId);
  return res.json({
    success: true,
    message: `All records and telemetry for patient ${patientId} have been permanently deleted in accordance with GDPR right-to-be-forgotten.`,
    deletedAt: new Date().toISOString(),
  });
});
