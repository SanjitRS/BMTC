import { Request, Response } from 'express';
import { SyncQueueItem, GameSession, GeofenceEvent, ReminderAck, PatientRecord } from '../shared/contract';
import { centralStore } from '../services/store.service';
import { alertDeduplicationService } from '../services/deduplication.service';

export class SyncController {
  /**
   * POST /api/sync/batch
   * Ingests array of SyncQueueItem records from external patient devices & GPS engine
   */
  public async ingestBatch(req: Request, res: Response) {
    const { items } = req.body as { items: SyncQueueItem[] };

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Payload must include an "items" array of SyncQueueItem objects' });
    }

    const ingestedIds: string[] = [];
    const errors: { id: string; error: string }[] = [];

    for (const item of items) {
      try {
        if (!item.id || !item.entityType || !item.payload) {
          throw new Error('Invalid SyncQueueItem shape. Missing id, entityType, or payload');
        }

        switch (item.entityType) {
          case 'game_session': {
            const session = item.payload as GameSession;
            if (!session.patientId || session.score === undefined || !session.gameType) {
              throw new Error('Malformed GameSession payload');
            }
            centralStore.addGameSession(session);
            ingestedIds.push(item.id);
            break;
          }

          case 'geofence_event': {
            const geoEvent = item.payload as GeofenceEvent;
            if (!geoEvent.patientId || !geoEvent.zoneId || !geoEvent.eventType) {
              throw new Error('Malformed GeofenceEvent payload');
            }

            const patient = centralStore.getPatientById(geoEvent.patientId);
            if (patient) {
              // Respect revocable consent: if revoked, skip logging location coordinates
              if (patient.locationTrackingConsent !== false) {
                centralStore.addGeofenceEvent(geoEvent);
                // Trigger 5-min sliding window deduplication engine
                alertDeduplicationService.processGeofenceEvent(geoEvent, patient);
              }
            } else {
              centralStore.addGeofenceEvent(geoEvent);
            }
            ingestedIds.push(item.id);
            break;
          }

          case 'reminder_ack': {
            const ack = item.payload as ReminderAck;
            if (!ack.patientId || !ack.reminderType) {
              throw new Error('Malformed ReminderAck payload');
            }
            centralStore.addReminderAck(ack);
            const patient = centralStore.getPatientById(ack.patientId);
            if (patient) {
              alertDeduplicationService.processReminderAck(ack, patient);
            }
            ingestedIds.push(item.id);
            break;
          }

          case 'patient_record': {
            const record = item.payload as PatientRecord;
            if (!record.patientId || !record.name) {
              throw new Error('Malformed PatientRecord payload');
            }
            // Conflict resolution: if server record exists, perform versioned merge
            const existing = centralStore.getPatientById(record.patientId);
            if (existing) {
              centralStore.updatePatientRecord(
                record.patientId,
                record,
                record.updatedBy || 'Client Sync',
                'healthcare_worker',
                'Synced patient record update from device'
              );
            } else {
              centralStore.createPatient(record);
            }
            ingestedIds.push(item.id);
            break;
          }

          default:
            throw new Error(`Unknown entityType: ${(item as any).entityType}`);
        }
      } catch (err: any) {
        errors.push({ id: item.id, error: err.message || 'Ingestion failed' });
      }
    }

    return res.json({
      success: true,
      receivedCount: items.length,
      ingestedCount: ingestedIds.length,
      ingestedIds,
      errors: errors.length > 0 ? errors : undefined,
      serverTime: new Date().toISOString()
    });
  }

  /**
   * GET /api/sync/status
   */
  public async getStatus(req: Request, res: Response) {
    const totalSessions = centralStore.getGameSessions().length;
    const totalGeofence = centralStore.getGeofenceEvents().length;
    const totalReminders = centralStore.getReminderAcks().length;
    const totalPatients = centralStore.getPatients().length;

    return res.json({
      pipelineStatus: 'operational',
      databaseVersion: '2.0.0',
      totalEntities: {
        patients: totalPatients,
        gameSessions: totalSessions,
        geofenceEvents: totalGeofence,
        reminderAcks: totalReminders
      },
      lastSyncTimestamp: new Date().toISOString()
    });
  }
}

export const syncController = new SyncController();
