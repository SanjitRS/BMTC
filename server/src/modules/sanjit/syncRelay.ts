import { SyncQueueItem, GameSession, GeofenceEvent, ReminderAck, PatientRecord } from "../../shared/contract";
import { geofenceRelay } from "./geofenceRelay";

class SyncRelayStore {
  private processedQueue: Map<string, SyncQueueItem> = new Map();
  private gameSessions: GameSession[] = [];
  private reminderAcks: ReminderAck[] = [];
  private patientRecords: Map<string, PatientRecord> = new Map();

  constructor() {
    this.seedSampleData();
  }

  private seedSampleData() {
    const defaultPatient: PatientRecord = {
      patientId: "patient-101",
      name: "Dharmananda Baruah",
      age: 73,
      diagnosisStage: "moderate",
      medications: [
        { id: "med-1", name: "Donepezil", dosage: "10mg", schedule: "08:00 AM Daily" },
        { id: "med-2", name: "Memantine", dosage: "5mg", schedule: "08:00 PM Daily" },
        { id: "med-3", name: "Omega-3 EPA/DHA", dosage: "1000mg", schedule: "12:00 PM Daily" },
      ],
      emergencyContacts: [
        { name: "Ananya Baruah", relation: "Daughter / Primary Caregiver", phone: "+91 98640 12345", isPrimary: true },
        { name: "Dr. B. K. Sarma", relation: "Consultant Neurologist", phone: "+91 94350 67890", isPrimary: false },
      ],
      updatedBy: "Dr. B. K. Sarma",
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      version: 1,
      history: [
        {
          version: 1,
          updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          updatedBy: "Dr. B. K. Sarma",
          changes: { note: "Initial diagnosis and medication regimen recorded." },
        },
      ],
    };
    this.patientRecords.set(defaultPatient.patientId, defaultPatient);

    // Initial game sessions
    this.gameSessions.push(
      {
        id: "sess-001",
        patientId: "patient-101",
        gameType: "memory",
        startedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        endedAt: new Date(Date.now() - 86400000 * 2 + 180000).toISOString(),
        score: 850,
        accuracy: 85,
        avgResponseTimeMs: 1420,
        errorTypes: ["omission"],
        difficultyLevel: 2,
        moodAfter: "happy",
        synced: true,
      },
      {
        id: "sess-002",
        patientId: "patient-101",
        gameType: "attention",
        startedAt: new Date(Date.now() - 86400000).toISOString(),
        endedAt: new Date(Date.now() - 86400000 + 210000).toISOString(),
        score: 720,
        accuracy: 78,
        avgResponseTimeMs: 1680,
        errorTypes: ["commission", "timeout"],
        difficultyLevel: 2,
        moodAfter: "calm",
        synced: true,
      }
    );
  }

  public processBatch(items: SyncQueueItem[]): {
    receivedCount: number;
    processedIds: string[];
    errors: Array<{ id: string; error: string }>;
  } {
    const processedIds: string[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const item of items) {
      try {
        // Idempotency check: if already processed, mark as success
        if (this.processedQueue.has(item.id)) {
          processedIds.push(item.id);
          continue;
        }

        // Route by entity type
        switch (item.entityType) {
          case "geofence_event": {
            const geofenceEvent = item.payload as GeofenceEvent;
            geofenceEvent.synced = true;
            geofenceRelay.processGeofenceEvent(geofenceEvent);
            break;
          }

          case "game_session": {
            const session = item.payload as GameSession;
            session.synced = true;
            // Last-Write-Wins (LWW) / Upsert
            const idx = this.gameSessions.findIndex((s) => s.id === session.id);
            if (idx >= 0) {
              this.gameSessions[idx] = session;
            } else {
              this.gameSessions.push(session);
            }
            break;
          }

          case "reminder_ack": {
            const reminder = item.payload as ReminderAck;
            reminder.synced = true;
            const idx = this.reminderAcks.findIndex((r) => r.id === reminder.id);
            if (idx >= 0) {
              this.reminderAcks[idx] = reminder;
            } else {
              this.reminderAcks.push(reminder);
            }
            break;
          }

          case "patient_record": {
            const record = item.payload as PatientRecord;
            const existing = this.patientRecords.get(record.patientId);

            if (!existing || record.version > existing.version) {
              // Valid version bump
              this.patientRecords.set(record.patientId, record);
            } else if (record.version === existing.version && record.updatedAt > existing.updatedAt) {
              // Concurrent version resolution with audit note
              record.version = existing.version + 1;
              if (!record.history) record.history = existing.history || [];
              record.history.push({
                version: record.version,
                updatedAt: record.updatedAt,
                updatedBy: record.updatedBy,
                changes: { conflictResolved: "Auto-merged concurrent update" },
              });
              this.patientRecords.set(record.patientId, record);
            }
            break;
          }

          default:
            console.warn(`[SyncRelay] Unknown entity type: ${item.entityType}`);
        }

        item.synced = true;
        this.processedQueue.set(item.id, item);
        processedIds.push(item.id);
      } catch (err: any) {
        errors.push({ id: item.id, error: err?.message || "Ingestion error" });
      }
    }

    return {
      receivedCount: items.length,
      processedIds,
      errors,
    };
  }

  public getGameSessions(patientId?: string): GameSession[] {
    if (patientId) {
      return this.gameSessions.filter((s) => s.patientId === patientId);
    }
    return this.gameSessions;
  }

  public getReminderAcks(patientId?: string): ReminderAck[] {
    if (patientId) {
      return this.reminderAcks.filter((r) => r.patientId === patientId);
    }
    return this.reminderAcks;
  }

  public getPatientRecord(patientId: string): PatientRecord | undefined {
    return this.patientRecords.get(patientId);
  }

  public getAllPatientRecords(): PatientRecord[] {
    return Array.from(this.patientRecords.values());
  }

  public updatePatientRecord(record: PatientRecord): PatientRecord {
    const existing = this.patientRecords.get(record.patientId);
    const newVersion = (existing?.version || 0) + 1;
    const history = existing?.history ? [...existing.history] : [];
    
    history.push({
      version: newVersion,
      updatedAt: new Date().toISOString(),
      updatedBy: record.updatedBy,
      changes: {
        medications: record.medications,
        emergencyContacts: record.emergencyContacts,
        diagnosisStage: record.diagnosisStage,
      },
    });

    const updatedRecord: PatientRecord = {
      ...record,
      version: newVersion,
      updatedAt: new Date().toISOString(),
      history,
    };

    this.patientRecords.set(record.patientId, updatedRecord);
    return updatedRecord;
  }

  public deletePatientData(patientId: string): boolean {
    this.patientRecords.delete(patientId);
    this.gameSessions = this.gameSessions.filter((s) => s.patientId !== patientId);
    this.reminderAcks = this.reminderAcks.filter((r) => r.patientId !== patientId);
    return true;
  }
}

export const syncRelay = new SyncRelayStore();
