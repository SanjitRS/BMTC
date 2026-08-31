import { PatientRecord, GameSession, GeofenceEvent } from "../../shared/contract";

export interface ConflictLog {
  id: string;
  timestamp: string;
  entityType: string;
  entityId: string;
  strategy: "LWW" | "VERSIONED_MERGE" | "AUDIT_APPEND";
  localVersion?: number;
  remoteVersion?: number;
  resolutionNote: string;
}

export class ConflictResolver {
  private conflictLogs: ConflictLog[] = [];
  private listeners: Array<(logs: ConflictLog[]) => void> = [];

  public getConflictLogs(): ConflictLog[] {
    return [...this.conflictLogs].reverse();
  }

  public subscribe(cb: (logs: ConflictLog[]) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private logConflict(log: ConflictLog) {
    this.conflictLogs.push(log);
    this.listeners.forEach((cb) => cb(this.getConflictLogs()));
  }

  // 1. Last-Write-Wins (LWW) for Game Sessions
  public resolveGameSessionConflict(local: GameSession, remote: GameSession): GameSession {
    const localTime = new Date(local.endedAt).getTime();
    const remoteTime = new Date(remote.endedAt).getTime();

    if (localTime >= remoteTime) {
      this.logConflict({
        id: `conf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        entityType: "game_session",
        entityId: local.id,
        strategy: "LWW",
        resolutionNote: `Local session retained (${local.accuracy}% acc) as it is newer than remote session.`,
      });
      return local;
    } else {
      this.logConflict({
        id: `conf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        entityType: "game_session",
        entityId: remote.id,
        strategy: "LWW",
        resolutionNote: `Remote session accepted (${remote.accuracy}% acc) over stale local copy.`,
      });
      return remote;
    }
  }

  // 2. Last-Write-Wins (LWW) for Geofence Events
  public resolveGeofenceConflict(local: GeofenceEvent, remote: GeofenceEvent): GeofenceEvent {
    const isLocalNewer = new Date(local.timestamp).getTime() >= new Date(remote.timestamp).getTime();
    const chosen = isLocalNewer ? local : remote;
    this.logConflict({
      id: `conf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      entityType: "geofence_event",
      entityId: chosen.id,
      strategy: "LWW",
      resolutionNote: `LWW applied: ${chosen.eventType.toUpperCase()} event at ${chosen.timestamp} preserved.`,
    });
    return chosen;
  }

  // 3. Versioned 3-Way Merge for Patient Medical Records
  public resolvePatientRecordConflict(
    base: PatientRecord | null,
    local: PatientRecord,
    remote: PatientRecord
  ): PatientRecord {
    // If local version is strictly higher, local wins
    if (local.version > remote.version) {
      this.logConflict({
        id: `conf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        entityType: "patient_record",
        entityId: local.patientId,
        strategy: "VERSIONED_MERGE",
        localVersion: local.version,
        remoteVersion: remote.version,
        resolutionNote: `Local record (v${local.version}) supersedes remote (v${remote.version}).`,
      });
      return local;
    }

    if (remote.version > local.version) {
      this.logConflict({
        id: `conf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        entityType: "patient_record",
        entityId: remote.patientId,
        strategy: "VERSIONED_MERGE",
        localVersion: local.version,
        remoteVersion: remote.version,
        resolutionNote: `Remote record (v${remote.version}) accepted over stale local (v${local.version}).`,
      });
      return remote;
    }

    // Version collision (both modified v1 to v2 offline!)
    // Perform field-level 3-way merge and create v3 with combined audit history
    const mergedVersion = Math.max(local.version, remote.version) + 1;
    const history = [
      ...(local.history || []),
      ...(remote.history || []).filter(
        (rh) => !(local.history || []).some((lh) => lh.version === rh.version && lh.updatedAt === rh.updatedAt)
      ),
    ];

    // Combine medication lists by unique name
    const medMap = new Map();
    local.medications.forEach((m) => medMap.set(m.name, m));
    remote.medications.forEach((m) => medMap.set(m.name, m));
    const mergedMedications = Array.from(medMap.values());

    // Combine emergency contacts by phone
    const contactMap = new Map();
    local.emergencyContacts.forEach((c) => contactMap.set(c.phone, c));
    remote.emergencyContacts.forEach((c) => contactMap.set(c.phone, c));
    const mergedContacts = Array.from(contactMap.values());

    history.push({
      version: mergedVersion,
      updatedAt: new Date().toISOString(),
      updatedBy: "Gurugale Conflict Resolver (Automated 3-Way Merge)",
      changes: {
        resolution: "Merged concurrent offline updates from clinician & caregiver.",
        medicationsCount: mergedMedications.length,
        contactsCount: mergedContacts.length,
      },
    });

    const mergedRecord: PatientRecord = {
      patientId: local.patientId,
      name: local.name,
      age: local.age,
      diagnosisStage: local.updatedAt >= remote.updatedAt ? local.diagnosisStage : remote.diagnosisStage,
      medications: mergedMedications,
      emergencyContacts: mergedContacts,
      updatedBy: `Merged [${local.updatedBy} + ${remote.updatedBy}]`,
      updatedAt: new Date().toISOString(),
      version: mergedVersion,
      history,
    };

    this.logConflict({
      id: `conf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      entityType: "patient_record",
      entityId: local.patientId,
      strategy: "AUDIT_APPEND",
      localVersion: local.version,
      remoteVersion: remote.version,
      resolutionNote: `Version collision on v${local.version}. Created merged v${mergedVersion} preserving full audit trail.`,
    });

    return mergedRecord;
  }
}

export const conflictResolver = new ConflictResolver();
