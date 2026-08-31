/**
 * SECTION 0: SHARED DATA CONTRACT
 * Gurugale Elderly Dementia Care Platform
 */

export interface GameSession {
  id: string;
  patientId: string;
  gameType: 'memory' | 'attention' | 'routine' | 'pattern';
  startedAt: string;
  endedAt: string;
  score: number;
  accuracy: number;
  avgResponseTimeMs: number;
  errorTypes: string[];
  difficultyLevel: number;
  moodAfter?: 'very_happy' | 'calm' | 'neutral' | 'confused' | 'agitated';
  synced: boolean;
}

export interface GeofenceEvent {
  id: string;
  patientId: string;
  zoneId: string;
  eventType: 'enter' | 'exit';
  lat: number;
  lng: number;
  timestamp: string;
  synced: boolean;
}

export interface ReminderAck {
  id: string;
  patientId: string;
  reminderType: 'medicine' | 'hydration' | 'activity' | 'appointment';
  scheduledAt: string;
  ackedAt: string | null;
  status?: 'acknowledged' | 'snoozed' | 'missed';
  notes?: string;
  synced: boolean;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  scheduledTimes: string[];
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
