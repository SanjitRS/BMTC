import { Request, Response } from 'express';
import { SyncQueueItem, GameSession, GeofenceEvent, ReminderAck } from '../shared/contract';
import { centralStore } from '../services/store.service';
import { alertDeduplicationService } from '../services/deduplication.service';

export class SimulatorController {
  /**
   * Helper to simulate receiving a batch of test data directly
   */
  public async generateSimulatedSync(req: Request, res: Response) {
    const { patientId, type, count = 1 } = req.body;
    const patient = centralStore.getPatientById(patientId || 'pat_001');

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const generatedItems: SyncQueueItem[] = [];

    if (type === 'game_session' || !type) {
      const gameTypes: ('memory' | 'attention' | 'routine' | 'pattern')[] = ['memory', 'attention', 'routine', 'pattern'];
      for (let i = 0; i < count; i++) {
        const accuracy = Math.floor(Math.random() * 35) + 65; // 65-100%
        const score = Math.floor(accuracy * 0.95);
        const latency = Math.floor(Math.random() * 2000) + 2500;
        const gType = gameTypes[Math.floor(Math.random() * gameTypes.length)];

        const session: GameSession = {
          id: 'sim_gs_' + Math.random().toString(36).substr(2, 9),
          patientId: patient.patientId,
          gameType: gType,
          startedAt: new Date(Date.now() - 180000).toISOString(),
          endedAt: new Date().toISOString(),
          score,
          accuracy,
          avgResponseTimeMs: latency,
          errorTypes: accuracy < 75 ? ['omission'] : [],
          difficultyLevel: Math.floor(Math.random() * 3) + 2,
          moodAfter: 'very_happy',
          synced: true
        };

        centralStore.addGameSession(session);
        generatedItems.push({
          id: 'sim_queue_' + session.id,
          entityType: 'game_session',
          payload: session,
          createdAt: new Date().toISOString(),
          synced: true,
          retryCount: 0
        });
      }
    }

    if (type === 'geofence_breach') {
      const geo: GeofenceEvent = {
        id: 'sim_geo_' + Math.random().toString(36).substr(2, 9),
        patientId: patient.patientId,
        zoneId: patient.safeZones?.[0]?.id || 'zone_home_1',
        eventType: 'exit',
        lat: (patient.safeZones?.[0]?.centerLat || 26.1368) + 0.0035,
        lng: (patient.safeZones?.[0]?.centerLng || 91.7928) + 0.0030,
        timestamp: new Date().toISOString(),
        synced: true
      };
      centralStore.addGeofenceEvent(geo);
      alertDeduplicationService.processGeofenceEvent(geo, patient);
      generatedItems.push({
        id: 'sim_queue_' + geo.id,
        entityType: 'geofence_event',
        payload: geo,
        createdAt: new Date().toISOString(),
        synced: true,
        retryCount: 0
      });
    }

    if (type === 'missed_medication') {
      const ack: ReminderAck = {
        id: 'sim_rem_' + Math.random().toString(36).substr(2, 9),
        patientId: patient.patientId,
        reminderType: 'medicine',
        scheduledAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        ackedAt: null,
        status: 'missed',
        notes: 'Simulated missed dose reminder',
        synced: true
      };
      centralStore.addReminderAck(ack);
      alertDeduplicationService.processReminderAck(ack, patient);
      generatedItems.push({
        id: 'sim_queue_' + ack.id,
        entityType: 'reminder_ack',
        payload: ack,
        createdAt: new Date().toISOString(),
        synced: true,
        retryCount: 0
      });
    }

    return res.json({
      message: `Successfully generated and ingested ${generatedItems.length} simulated sync items for ${patient.name}.`,
      items: generatedItems
    });
  }
}

export const simulatorController = new SimulatorController();
