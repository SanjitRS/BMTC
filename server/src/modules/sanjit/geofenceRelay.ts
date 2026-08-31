import { GeofenceEvent, SafeZone, DebouncedAlert } from "../../shared/contract";

// Haversine distance calculation in meters
export function calculateHaversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Default Safe Zones (Home 150m, Clinic 100m, Park 300m) - Guwahati NER Coordinates as baseline
export const defaultSafeZones: SafeZone[] = [
  {
    id: "zone-home",
    name: "Patient Residence (Guwahati)",
    type: "home",
    lat: 26.1445,
    lng: 91.7362,
    radiusMeters: 150,
    color: "#10b981", // Emerald
  },
  {
    id: "zone-clinic",
    name: "Regional Geriatric Clinic",
    type: "clinic",
    lat: 26.152,
    lng: 91.745,
    radiusMeters: 100,
    color: "#3b82f6", // Blue
  },
  {
    id: "zone-park",
    name: "Nehru Botanical Park",
    type: "park",
    lat: 26.148,
    lng: 91.731,
    radiusMeters: 300,
    color: "#8b5cf6", // Purple
  },
];

class GeofenceRelayStore {
  private safeZones: SafeZone[] = [...defaultSafeZones];
  private rawEvents: GeofenceEvent[] = [];
  private debouncedAlerts: Map<string, DebouncedAlert> = new Map();
  private subscribers: Array<(alert: DebouncedAlert) => void> = [];

  public getSafeZones(): SafeZone[] {
    return this.safeZones;
  }

  public updateSafeZones(zones: SafeZone[]): void {
    this.safeZones = zones;
  }

  public addSafeZone(zone: SafeZone): void {
    this.safeZones.push(zone);
  }

  public getRawEvents(): GeofenceEvent[] {
    return [...this.rawEvents].reverse();
  }

  public getDebouncedAlerts(): DebouncedAlert[] {
    return Array.from(this.debouncedAlerts.values()).reverse();
  }

  public subscribe(cb: (alert: DebouncedAlert) => void) {
    this.subscribers.push(cb);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== cb);
    };
  }

  // 5-Minute Sliding Window Debouncing Engine
  public processGeofenceEvent(event: GeofenceEvent): {
    event: GeofenceEvent;
    debouncedAlert: DebouncedAlert | null;
    isOscillation: boolean;
  } {
    this.rawEvents.push(event);

    const zone = this.safeZones.find((z) => z.id === event.zoneId) || {
      id: event.zoneId,
      name: "Unknown Safe Zone",
      type: "custom",
      lat: event.lat,
      lng: event.lng,
      radiusMeters: 150,
      color: "#f59e0b",
    };

    const windowMs = 5 * 60 * 1000; // 5 minutes window
    const now = new Date(event.timestamp).getTime();
    const alertKey = `${event.patientId}_${event.zoneId}`;

    const existing = this.debouncedAlerts.get(alertKey);

    let isOscillation = false;
    let alert: DebouncedAlert;

    if (existing && now - new Date(existing.lastTriggeredAt).getTime() <= windowMs) {
      // Rapid oscillation inside sliding window! Debounce and aggregate.
      isOscillation = true;
      existing.oscillationCount += 1;
      existing.lastTriggeredAt = event.timestamp;
      existing.currentStatus = event.eventType === "enter" ? "inside" : "outside";
      existing.severity = existing.oscillationCount > 3 ? "critical" : "warning";
      existing.summary = `Boundary oscillation detected at ${zone.name}: ${existing.oscillationCount} crossings in 5-min window. Current status: ${existing.currentStatus.toUpperCase()}.`;
      alert = existing;
    } else {
      // New or expired window -> Create fresh alert
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
            : `Patient safely entered perimeter: ${zone.name}`,
        dispatched: false,
      };
      this.debouncedAlerts.set(alertKey, alert);
    }

    // Notify listeners
    this.subscribers.forEach((cb) => cb(alert));

    return {
      event,
      debouncedAlert: alert,
      isOscillation,
    };
  }
}

export const geofenceRelay = new GeofenceRelayStore();
