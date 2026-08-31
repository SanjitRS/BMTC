export type GameType = "memory" | "attention" | "routine" | "pattern";
export type DiagnosisStage = "early" | "moderate" | "severe";
export type ReminderType = "medicine" | "hydration" | "activity" | "appointment";
export type ReminderStatus = "acknowledged" | "snoozed" | "missed";
export type GeofenceEventType = "enter" | "exit";
export type EntityType = "game_session" | "geofence_event" | "reminder_ack" | "patient_record";

export interface GameSession {
  id: string;
  patientId: string;
  gameType: GameType;
  startedAt: string;
  endedAt: string;
  score: number;
  accuracy: number;
  avgResponseTimeMs: number;
  errorTypes: string[];
  difficultyLevel: number;
  moodAfter?: string;
  synced: boolean;
}

export interface GeofenceEvent {
  id: string;
  patientId: string;
  zoneId: string;
  eventType: GeofenceEventType;
  lat: number;
  lng: number;
  timestamp: string;
  synced: boolean;
}

export interface ReminderAck {
  id: string;
  patientId: string;
  reminderType: ReminderType;
  scheduledAt: string;
  ackedAt: string | null;
  status: ReminderStatus;
  synced: boolean;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  schedule: string;
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
  isPrimary: boolean;
}

export interface PatientRecord {
  patientId: string;
  name: string;
  age: number;
  diagnosisStage: DiagnosisStage;
  medications: Medication[];
  emergencyContacts: EmergencyContact[];
  updatedBy: string;
  updatedAt: string;
  version: number;
  history?: Array<{
    version: number;
    updatedAt: string;
    updatedBy: string;
    changes: Record<string, any>;
  }>;
}

export interface SyncQueueItem {
  id: string;
  entityType: EntityType;
  payload: any;
  createdAt: string;
  synced: boolean;
  retryCount: number;
}

export interface SafeZone {
  id: string;
  name: string;
  type: "home" | "clinic" | "park" | "custom";
  lat: number;
  lng: number;
  radiusMeters: number;
  color: string;
}

export interface DebouncedAlert {
  id: string;
  patientId: string;
  zoneId: string;
  zoneName: string;
  firstTriggeredAt: string;
  lastTriggeredAt: string;
  oscillationCount: number;
  currentStatus: "inside" | "outside";
  severity: "critical" | "warning" | "info";
  summary: string;
  dispatched: boolean;
}

export interface SyncStatus {
  totalPending: number;
  totalSynced: number;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  lastError: string | null;
}
