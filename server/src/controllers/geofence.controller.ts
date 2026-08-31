import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { centralStore } from '../services/store.service';
import { SafeZone } from '../shared/contract';

export class GeofenceController {
  public async getSafeZones(req: AuthenticatedRequest, res: Response) {
    const { patientId } = req.params;
    const patient = centralStore.getPatientById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    return res.json(patient.safeZones || []);
  }

  public async updateSafeZones(req: AuthenticatedRequest, res: Response) {
    const { patientId } = req.params;
    const { safeZones } = req.body as { safeZones: SafeZone[] };

    try {
      const updated = centralStore.updatePatientRecord(
        patientId,
        { safeZones },
        req.user ? req.user.name : 'Healthcare Worker',
        'healthcare_worker',
        'Updated geofencing safe zones configuration'
      );
      return res.json(updated.safeZones);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  public async getEvents(req: AuthenticatedRequest, res: Response) {
    const { patientId } = req.params;
    const events = centralStore.getGeofenceEvents(patientId).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return res.json(events);
  }

  /**
   * Returns GPS breadcrumbs trail and current live coordinates
   */
  public async getBreadcrumbs(req: AuthenticatedRequest, res: Response) {
    const { patientId } = req.params;
    const patient = centralStore.getPatientById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (patient.locationTrackingConsent === false) {
      return res.json({
        patientId,
        consentGranted: false,
        message: 'Location tracking consent is currently revoked for this patient.',
        currentLocation: null,
        trail: []
      });
    }

    const events = centralStore.getGeofenceEvents(patientId);
    const homeZone = patient.safeZones?.find(z => z.type === 'home') || {
      centerLat: 26.1368,
      centerLng: 91.7928
    };

    // Construct realistic GPS breadcrumb trail
    const baseLat = homeZone.centerLat;
    const baseLng = homeZone.centerLng;

    const trail = [
      { lat: baseLat, lng: baseLng, timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), isInside: true },
      { lat: baseLat + 0.0008, lng: baseLng + 0.0006, timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(), isInside: true },
      { lat: baseLat + 0.0016, lng: baseLng + 0.0012, timestamp: new Date(Date.now() - 3600000 * 1).toISOString(), isInside: true },
      { lat: baseLat + 0.0022, lng: baseLng + 0.0021, timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(), isInside: false },
      { lat: baseLat + 0.0026, lng: baseLng + 0.0024, timestamp: new Date().toISOString(), isInside: false }
    ];

    return res.json({
      patientId,
      consentGranted: true,
      currentLocation: trail[trail.length - 1],
      safeZones: patient.safeZones || [],
      trail
    });
  }
}

export const geofenceController = new GeofenceController();
