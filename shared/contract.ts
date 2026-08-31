/**
 * SECTION 0: SHARED DATA CONTRACT
 * Gurugale Elderly Dementia Care Platform
 * 
 * Strict contract shared across all modules:
 * - Praveen (Patient App & Cognitive Engine)
 * - Sanjit (Geofencing, GPS & Offline Sync Engine)
 * - Nischal (Admin Pipeline, Clinical Dashboard & Security)
 */

export interface GameSession {
  id: string;
  patientId: string;
  gameType: 'memory' | 'attention' | 'routine' | 'pattern';
  startedAt: string; // ISO 8601 string
  endedAt: string;   // ISO 8601 string
  score: number;     // 0 - 100
  accuracy: number;  // percentage (0 - 100)
  avgResponseTimeMs: number;
  errorTypes: string[]; // e.g. ["omission", "commission", "timeout", "spatial_disorientation"]
  difficultyLevel: number; // 1 to 5
  moodAfter?: 'very_happy' | 'calm' | 'neutral' | 'confused' | 'agitated';
  synced: boolean;
}

export interface GeofenceEvent {
  id: string;
  patientId: string;
  zoneId: string; // e.g. "home_zone", "clinic_zone", "park_zone"
  eventType: 'enter' | 'exit';
  lat: number;
  lng: number;
  timestamp: string; // ISO 8601 string
  synced: boolean;
}

export interface ReminderAck {
  id: string;
  patientId: string;
  reminderType: 'medicine' | 'hydration' | 'activity' | 'appointment';
  scheduledAt: string; // ISO 8601 string
  ackedAt: string | null; // ISO 8601 string if acknowledged, null if missed
  status?: 'acknowledged' | 'snoozed' | 'missed';
  notes?: string;
  synced: boolean;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  scheduledTimes: string[]; // ["08:00", "13:00", "20:00"]
  purpose: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
}

export interface SafeZone {
  id: string;
  patientId: string;
  name: string;
  type: 'home' | 'clinic' | 'park' | 'community_center';
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  color: string;
}

export interface PatientRecordVersion {
  version: number;
  updatedBy: string;
  updatedByRole: 'admin' | 'healthcare_worker' | 'caregiver';
  updatedAt: string;
  changesSummary: string;
  previousSnapshot: Partial<PatientRecord>;
}

export interface PatientRecord {
  patientId: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  photoUrl?: string;
  diagnosisStage: 'early' | 'moderate' | 'severe';
  primaryLanguage: 'en' | 'hi' | 'as' | 'mn' | 'bn';
  medications: Medication[];
  emergencyContacts: EmergencyContact[];
  safeZones?: SafeZone[];
  locationTrackingConsent: boolean;
  consentRevokedAt?: string | null;
  updatedBy: string;
  updatedAt: string;
  version: number;
  history?: PatientRecordVersion[];
  notes?: string;
  assignedCaregiverId?: string;
  assignedCaregiverName?: string;
}

export type EntityType = 
  | 'game_session' 
  | 'geofence_event' 
  | 'reminder_ack' 
  | 'patient_record'
  | 'mood_checkin';

export interface SyncQueueItem {
  id: string;
  entityType: EntityType;
  payload: GameSession | GeofenceEvent | ReminderAck | PatientRecord | any;
  createdAt: string;
  synced: boolean;
  retryCount: number;
  status?: 'pending' | 'syncing' | 'failed' | 'synced';
  lastError?: string;
}

export interface DeduplicatedAlert {
  id: string;
  patientId: string;
  patientName: string;
  alertType: 'geofence_breach' | 'missed_medication' | 'missed_hydration' | 'cognitive_decline_warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  summary: string;
  occurrencesCount: number;
  firstTriggeredAt: string;
  lastTriggeredAt: string;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  rawEventIds: string[];
  suggestedAction: string;
}

export type UserRole = 'admin' | 'healthcare_worker' | 'caregiver' | 'patient';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  assignedPatientIds?: string[];
}

export interface CognitiveTrendScorecard {
  patientId: string;
  patientName: string;
  diagnosisStage: 'early' | 'moderate' | 'severe';
  cognitiveStatus: 'improving' | 'stable' | 'declining';
  totalSessions: number;
  averageAccuracy: number;
  averageScore: number;
  averageResponseTimeMs: number;
  currentStreakDays: number;
  accuracyTrend: { date: string; accuracy: number; score: number; responseTimeMs: number; gameType: string }[];
  errorBreakdown: { type: string; count: number; percentage: number }[];
  gameTypePerformance: { gameType: string; sessions: number; avgAccuracy: number; avgScore: number }[];
  adherenceRatePercent: number;
}
