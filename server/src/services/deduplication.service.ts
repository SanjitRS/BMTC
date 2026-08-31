import { GeofenceEvent, ReminderAck, DeduplicatedAlert, PatientRecord } from '../shared/contract';
import { centralStore } from './store.service';

export class AlertDeduplicationService {
  private slidingWindowMs = 5 * 60 * 1000; // 5 minutes

  /**
   * Evaluates incoming GeofenceEvent and either updates an existing summarized alert
   * or creates a new one if outside the sliding window.
   */
  public processGeofenceEvent(event: GeofenceEvent, patient: PatientRecord): DeduplicatedAlert | null {
    if (event.eventType === 'enter') {
      // Patient returned to safe zone: check if there's an active breach alert to resolve or update
      const activeAlerts = centralStore.getAlerts(patient.patientId).filter(
        a => a.alertType === 'geofence_breach' && a.status === 'active'
      );
      if (activeAlerts.length > 0) {
        const topAlert = activeAlerts[0];
        topAlert.summary += ` | Patient re-entered safe zone at ${new Date(event.timestamp).toLocaleTimeString()}`;
        topAlert.occurrencesCount += 1;
        topAlert.lastTriggeredAt = event.timestamp;
        topAlert.rawEventIds.push(event.id);
        centralStore.saveAlert(topAlert);
        return topAlert;
      }
      return null;
    }

    // Event is 'exit' (Breach)
    const eventTime = new Date(event.timestamp).getTime();
    const existingBreachAlerts = centralStore.getAlerts(patient.patientId).filter(
      a => a.alertType === 'geofence_breach' && a.status === 'active'
    );

    // Check for existing active alert within sliding window
    const recentAlert = existingBreachAlerts.find(a => {
      const alertTime = new Date(a.lastTriggeredAt).getTime();
      return (eventTime - alertTime) <= this.slidingWindowMs;
    });

    if (recentAlert) {
      // DE-DUPLICATE & BATCH: Do not spam new rows
      recentAlert.occurrencesCount += 1;
      recentAlert.lastTriggeredAt = event.timestamp;
      recentAlert.rawEventIds.push(event.id);
      recentAlert.title = `Boundary Oscillation: ${patient.name} (${recentAlert.occurrencesCount} exits in 5m)`;
      recentAlert.summary = `Patient crossed boundary ${recentAlert.occurrencesCount} times within 5 minutes. Last seen coordinates: [${event.lat.toFixed(4)}, ${event.lng.toFixed(4)}].`;
      recentAlert.severity = recentAlert.occurrencesCount >= 3 ? 'critical' : 'high';
      
      centralStore.saveAlert(recentAlert);
      return recentAlert;
    }

    // Outside sliding window or first breach -> create fresh alert
    const newAlert: DeduplicatedAlert = {
      id: 'alt_' + Math.random().toString(36).substr(2, 9),
      patientId: patient.patientId,
      patientName: patient.name,
      alertType: 'geofence_breach',
      severity: 'high',
      title: `Geofence Exit: ${patient.name}`,
      summary: `Patient stepped outside designated safe boundary (${event.zoneId}) at ${new Date(event.timestamp).toLocaleTimeString()}. Coordinates: [${event.lat.toFixed(4)}, ${event.lng.toFixed(4)}].`,
      occurrencesCount: 1,
      firstTriggeredAt: event.timestamp,
      lastTriggeredAt: event.timestamp,
      status: 'active',
      rawEventIds: [event.id],
      suggestedAction: `Check patient's live location and notify assigned caregiver ${patient.assignedCaregiverName || 'on duty'}.`
    };

    centralStore.saveAlert(newAlert);
    return newAlert;
  }

  /**
   * Evaluates ReminderAck. If status is 'missed', deduplicates or raises clinical alert.
   */
  public processReminderAck(ack: ReminderAck, patient: PatientRecord): DeduplicatedAlert | null {
    if (ack.status !== 'missed') {
      return null;
    }

    const scheduledTime = new Date(ack.scheduledAt).getTime();
    const existingMissed = centralStore.getAlerts(patient.patientId).filter(
      a => (a.alertType === 'missed_medication' || a.alertType === 'missed_hydration') && a.status === 'active'
    );

    const match = existingMissed.find(a => {
      const t = new Date(a.firstTriggeredAt).getTime();
      return Math.abs(scheduledTime - t) < (30 * 60 * 1000); // 30 min window for same schedule
    });

    if (match) {
      match.occurrencesCount += 1;
      match.lastTriggeredAt = new Date().toISOString();
      match.rawEventIds.push(ack.id);
      centralStore.saveAlert(match);
      return match;
    }

    const isMed = ack.reminderType === 'medicine';
    const alert: DeduplicatedAlert = {
      id: 'alt_' + Math.random().toString(36).substr(2, 9),
      patientId: patient.patientId,
      patientName: patient.name,
      alertType: isMed ? 'missed_medication' : 'missed_hydration',
      severity: isMed ? 'high' : 'medium',
      title: isMed ? `Missed Medication Reminder: ${patient.name}` : `Missed Hydration Reminder: ${patient.name}`,
      summary: `Patient failed to acknowledge scheduled ${ack.reminderType} reminder (${new Date(ack.scheduledAt).toLocaleTimeString()}). ${ack.notes || ''}`,
      occurrencesCount: 1,
      firstTriggeredAt: ack.scheduledAt,
      lastTriggeredAt: new Date().toISOString(),
      status: 'active',
      rawEventIds: [ack.id],
      suggestedAction: isMed 
        ? `Contact caregiver to administer vital dose directly.`
        : `Offer fresh water or electrolyte beverage to prevent dehydration delirium.`
    };

    centralStore.saveAlert(alert);
    return alert;
  }
}

export const alertDeduplicationService = new AlertDeduplicationService();
