import { GeofenceEvent, DebouncedAlert, SafeZone } from "../../shared/contract";

export class AlertDeduplicator {
  private windowDurationMs: number = 5 * 60 * 1000; // 5-minute sliding window
  private debouncedAlerts: Map<string, DebouncedAlert> = new Map();
  private rawEventLog: Array<{ event: GeofenceEvent; debouncedAlertId: string; isOscillation: boolean }> = [];
  private listeners: Array<(alerts: DebouncedAlert[]) => void> = [];

  constructor(windowMinutes: number = 5) {
    this.windowDurationMs = windowMinutes * 60 * 1000;
  }

  public getAlerts(): DebouncedAlert[] {
    return Array.from(this.debouncedAlerts.values()).reverse();
  }

  public getRawEventLog() {
    return [...this.rawEventLog].reverse();
  }

  public subscribe(cb: (alerts: DebouncedAlert[]) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    const alerts = this.getAlerts();
    this.listeners.forEach((cb) => cb(alerts));
  }

  public processEvent(
    event: GeofenceEvent,
    zones: SafeZone[]
  ): { debouncedAlert: DebouncedAlert; isOscillation: boolean } {
    const zone = zones.find((z) => z.id === event.zoneId) || {
      id: event.zoneId,
      name: "Safe Zone",
      type: "custom",
      lat: event.lat,
      lng: event.lng,
      radiusMeters: 150,
      color: "#10b981",
    };

    const alertKey = `${event.patientId}_${event.zoneId}`;
    const now = new Date(event.timestamp).getTime();
    const existing = this.debouncedAlerts.get(alertKey);

    let isOscillation = false;
    let alert: DebouncedAlert;

    if (existing && now - new Date(existing.lastTriggeredAt).getTime() <= this.windowDurationMs) {
      // Event falls within existing 5-minute sliding window -> Aggregate & Debounce
      isOscillation = true;
      existing.oscillationCount += 1;
      existing.lastTriggeredAt = event.timestamp;
      existing.currentStatus = event.eventType === "enter" ? "inside" : "outside";

      const elapsedSec = Math.round((now - new Date(existing.firstTriggeredAt).getTime()) / 1000);
      const minutes = Math.floor(elapsedSec / 60);
      const seconds = elapsedSec % 60;
      const durationStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

      if (existing.oscillationCount >= 3) {
        existing.severity = "critical";
        existing.summary = `Boundary oscillation alert: Patient crossed ${zone.name} boundary ${existing.oscillationCount} times within ${durationStr}. Currently: ${existing.currentStatus.toUpperCase()}.`;
      } else {
        existing.severity = existing.currentStatus === "outside" ? "warning" : "info";
        existing.summary = `Repeated boundary activity (${existing.oscillationCount}x) at ${zone.name} in ${durationStr}. Current: ${existing.currentStatus}.`;
      }

      alert = existing;
    } else {
      // New window or expired sliding window -> Create fresh alert
      alert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        patientId: event.patientId,
        zoneId: event.zoneId,
        zoneName: zone.name,
        firstTriggeredAt: event.timestamp,
        lastTriggeredAt: event.timestamp,
        oscillationCount: 1,
        currentStatus: event.eventType === "enter" ? "inside" : "outside",
        severity: event.eventType === "exit" ? "warning" : "info",
        summary:
          event.eventType === "exit"
            ? `Patient departed safe perimeter: ${zone.name}`
            : `Patient safely re-entered perimeter: ${zone.name}`,
        dispatched: false,
      };
      this.debouncedAlerts.set(alertKey, alert);
    }

    this.rawEventLog.push({
      event,
      debouncedAlertId: alert.id,
      isOscillation,
    });

    this.notify();

    return { debouncedAlert: alert, isOscillation };
  }

  public dispatchAlert(alertId: string) {
    const alert = Array.from(this.debouncedAlerts.values()).find((a) => a.id === alertId);
    if (alert) {
      alert.dispatched = true;
      this.notify();
    }
  }

  public clearAll() {
    this.debouncedAlerts.clear();
    this.rawEventLog = [];
    this.notify();
  }
}

export const alertDeduplicator = new AlertDeduplicator(5);
