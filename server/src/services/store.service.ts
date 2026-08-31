import fs from 'fs';
import path from 'path';
import { 
  PatientRecord, 
  GameSession, 
  GeofenceEvent, 
  ReminderAck, 
  DeduplicatedAlert, 
  AuthUser,
  PatientRecordVersion 
} from '../shared/contract';
import { 
  seedPatients, 
  seedGameSessions, 
  seedGeofenceEvents, 
  seedReminderAcks, 
  seedAlerts, 
  seedUsers 
} from '../data/seedData';

export class CentralStoreService {
  private patients: Map<string, PatientRecord> = new Map();
  private gameSessions: Map<string, GameSession> = new Map();
  private geofenceEvents: Map<string, GeofenceEvent> = new Map();
  private reminderAcks: Map<string, ReminderAck> = new Map();
  private alerts: Map<string, DeduplicatedAlert> = new Map();
  private users: Map<string, AuthUser & { passwordHash: string }> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    seedUsers.forEach(u => this.users.set(u.id, { ...u }));
    seedPatients.forEach(p => this.patients.set(p.patientId, JSON.parse(JSON.stringify(p))));
    seedGameSessions.forEach(gs => this.gameSessions.set(gs.id, { ...gs }));
    seedGeofenceEvents.forEach(ge => this.geofenceEvents.set(ge.id, { ...ge }));
    seedReminderAcks.forEach(ra => this.reminderAcks.set(ra.id, { ...ra }));
    seedAlerts.forEach(a => this.alerts.set(a.id, { ...a }));
  }

  // --- Users & Auth ---
  public getUserByEmail(email: string) {
    return Array.from(this.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string) {
    return this.users.get(id);
  }

  public getAllUsers() {
    return Array.from(this.users.values()).map(({ passwordHash, ...safe }) => safe);
  }

  // --- Patients ---
  public getPatients(): PatientRecord[] {
    return Array.from(this.patients.values());
  }

  public getPatientById(patientId: string): PatientRecord | undefined {
    return this.patients.get(patientId);
  }

  public createPatient(patient: PatientRecord): PatientRecord {
    const existing = this.patients.get(patient.patientId);
    if (existing) {
      throw new Error(`Patient with ID ${patient.patientId} already exists.`);
    }
    this.patients.set(patient.patientId, patient);
    return patient;
  }

  /**
   * Versioned update: increments version, records audit history snapshot, never silently overwrites
   */
  public updatePatientRecord(
    patientId: string, 
    updates: Partial<PatientRecord>, 
    updatedBy: string, 
    updatedByRole: 'admin' | 'healthcare_worker' | 'caregiver',
    changesSummary: string = 'Clinical record update'
  ): PatientRecord {
    const current = this.patients.get(patientId);
    if (!current) {
      throw new Error(`Patient ${patientId} not found`);
    }

    const previousSnapshot = JSON.parse(JSON.stringify(current));
    const newVersion = (current.version || 1) + 1;
    const historyEntry: PatientRecordVersion = {
      version: current.version || 1,
      updatedBy,
      updatedByRole,
      updatedAt: new Date().toISOString(),
      changesSummary,
      previousSnapshot
    };

    const history = current.history ? [...current.history, historyEntry] : [historyEntry];

    const updatedRecord: PatientRecord = {
      ...current,
      ...updates,
      patientId, // immutable
      version: newVersion,
      updatedBy,
      updatedAt: new Date().toISOString(),
      history
    };

    this.patients.set(patientId, updatedRecord);
    return updatedRecord;
  }

  /**
   * Toggle location tracking consent
   */
  public setLocationConsent(patientId: string, consent: boolean, modifiedBy: string): PatientRecord {
    const current = this.patients.get(patientId);
    if (!current) throw new Error('Patient not found');

    return this.updatePatientRecord(
      patientId,
      {
        locationTrackingConsent: consent,
        consentRevokedAt: consent ? null : new Date().toISOString()
      },
      modifiedBy,
      'admin',
      consent ? 'Location tracking consent granted by guardian' : 'Location tracking consent explicitly revoked'
    );
  }

  /**
   * PERMANENT GDPR / RIGHT-TO-BE-FORGOTTEN HARD DELETION
   * Completely purges the patient profile, all game sessions, geofence logs, alerts, and reminder history
   */
  public purgePatientDataPermanently(patientId: string): { purgedCount: number; patientId: string } {
    if (!this.patients.has(patientId)) {
      throw new Error(`Patient ${patientId} does not exist`);
    }

    let purgedCount = 0;

    // Purge Patient Record
    this.patients.delete(patientId);
    purgedCount++;

    // Purge Game Sessions
    for (const [id, session] of this.gameSessions.entries()) {
      if (session.patientId === patientId) {
        this.gameSessions.delete(id);
        purgedCount++;
      }
    }

    // Purge Geofence Events
    for (const [id, geo] of this.geofenceEvents.entries()) {
      if (geo.patientId === patientId) {
        this.geofenceEvents.delete(id);
        purgedCount++;
      }
    }

    // Purge Reminder Acks
    for (const [id, rem] of this.reminderAcks.entries()) {
      if (rem.patientId === patientId) {
        this.reminderAcks.delete(id);
        purgedCount++;
      }
    }

    // Purge Alerts
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.patientId === patientId) {
        this.alerts.delete(id);
        purgedCount++;
      }
    }

    return { purgedCount, patientId };
  }

  // --- Game Sessions ---
  public getGameSessions(patientId?: string): GameSession[] {
    const all = Array.from(this.gameSessions.values());
    if (patientId) {
      return all.filter(s => s.patientId === patientId);
    }
    return all;
  }

  public addGameSession(session: GameSession): GameSession {
    this.gameSessions.set(session.id, { ...session, synced: true });
    return session;
  }

  // --- Geofence Events ---
  public getGeofenceEvents(patientId?: string): GeofenceEvent[] {
    const all = Array.from(this.geofenceEvents.values());
    if (patientId) {
      return all.filter(g => g.patientId === patientId);
    }
    return all;
  }

  public addGeofenceEvent(event: GeofenceEvent): GeofenceEvent {
    this.geofenceEvents.set(event.id, { ...event, synced: true });
    return event;
  }

  // --- Reminder Acks ---
  public getReminderAcks(patientId?: string): ReminderAck[] {
    const all = Array.from(this.reminderAcks.values());
    if (patientId) {
      return all.filter(r => r.patientId === patientId);
    }
    return all;
  }

  public addReminderAck(ack: ReminderAck): ReminderAck {
    this.reminderAcks.set(ack.id, { ...ack, synced: true });
    return ack;
  }

  // --- Alerts ---
  public getAlerts(patientId?: string): DeduplicatedAlert[] {
    const all = Array.from(this.alerts.values()).sort(
      (a, b) => new Date(b.lastTriggeredAt).getTime() - new Date(a.lastTriggeredAt).getTime()
    );
    if (patientId) {
      return all.filter(a => a.patientId === patientId);
    }
    return all;
  }

  public saveAlert(alert: DeduplicatedAlert): DeduplicatedAlert {
    this.alerts.set(alert.id, alert);
    return alert;
  }

  public updateAlertStatus(
    alertId: string, 
    status: 'acknowledged' | 'resolved', 
    byUser: string
  ): DeduplicatedAlert {
    const alert = this.alerts.get(alertId);
    if (!alert) throw new Error('Alert not found');

    const updated: DeduplicatedAlert = {
      ...alert,
      status,
      acknowledgedBy: byUser,
      acknowledgedAt: new Date().toISOString()
    };
    this.alerts.set(alertId, updated);
    return updated;
  }
}

export const centralStore = new CentralStoreService();
