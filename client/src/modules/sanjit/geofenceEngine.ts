import { GeofenceEvent, SafeZone } from "../../shared/contract";

// Haversine formula to compute exact distance in meters between two lat/lng points
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius of the Earth in meters
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

export const INITIAL_SAFE_ZONES: SafeZone[] = [
  {
    id: "zone-home",
    name: "Patient Home (Guwahati)",
    type: "home",
    lat: 26.1445,
    lng: 91.7362,
    radiusMeters: 150,
    color: "#10b981", // Emerald green
  },
  {
    id: "zone-clinic",
    name: "Regional Geriatric Care Center",
    type: "clinic",
    lat: 26.152,
    lng: 91.745,
    radiusMeters: 100,
    color: "#3b82f6", // Blue
  },
  {
    id: "zone-park",
    name: "Nehru Botanical Safe Garden",
    type: "park",
    lat: 26.148,
    lng: 91.731,
    radiusMeters: 300,
    color: "#8b5cf6", // Purple
  },
];

export interface ZoneEvaluation {
  isInsideAnySafeZone: boolean;
  activeZone: SafeZone | null;
  distanceToNearestSafeZoneMeters: number;
  nearestZone: SafeZone;
  zoneDistances: Array<{ zone: SafeZone; distanceMeters: number; isInside: boolean }>;
}

export class GeofenceEngine {
  private safeZones: SafeZone[];
  private lastKnownZoneStatus: Map<string, boolean> = new Map(); // zoneId -> isInside
  // Hysteresis margin (in meters) to prevent rapid jitter toggling directly at the perimeter border
  private hysteresisBufferMeters = 5;

  constructor(initialZones: SafeZone[] = INITIAL_SAFE_ZONES) {
    this.safeZones = [...initialZones];
    this.safeZones.forEach((z) => this.lastKnownZoneStatus.set(z.id, true));
  }

  public getZones(): SafeZone[] {
    return [...this.safeZones];
  }

  public setZones(zones: SafeZone[]) {
    this.safeZones = [...zones];
  }

  public addZone(zone: SafeZone) {
    this.safeZones.push(zone);
    this.lastKnownZoneStatus.set(zone.id, false);
  }

  public updateZoneRadius(zoneId: string, radiusMeters: number) {
    this.safeZones = this.safeZones.map((z) =>
      z.id === zoneId ? { ...z, radiusMeters } : z
    );
  }

  // Evaluates current coordinate against all safe zones
  public evaluatePosition(lat: number, lng: number): ZoneEvaluation {
    const zoneDistances = this.safeZones.map((zone) => {
      const distanceMeters = haversineDistanceMeters(lat, lng, zone.lat, zone.lng);
      return {
        zone,
        distanceMeters,
        isInside: distanceMeters <= zone.radiusMeters,
      };
    });

    // Find if inside any zone
    const insideZones = zoneDistances.filter((zd) => zd.isInside);
    const activeZone = insideZones.length > 0 ? insideZones[0].zone : null;

    // Find nearest safe zone
    zoneDistances.sort((a, b) => a.distanceMeters - b.distanceMeters);
    const nearest = zoneDistances[0] || {
      zone: this.safeZones[0],
      distanceMeters: 0,
      isInside: false,
    };

    return {
      isInsideAnySafeZone: insideZones.length > 0,
      activeZone,
      distanceToNearestSafeZoneMeters: Math.round(nearest.distanceMeters),
      nearestZone: nearest.zone,
      zoneDistances,
    };
  }

  // Detects state transitions (Enter / Exit) with hysteresis
  public checkTransitions(
    patientId: string,
    lat: number,
    lng: number,
    timestamp: string = new Date().toISOString()
  ): GeofenceEvent[] {
    const events: GeofenceEvent[] = [];

    for (const zone of this.safeZones) {
      const dist = haversineDistanceMeters(lat, lng, zone.lat, zone.lng);
      const wasInside = this.lastKnownZoneStatus.get(zone.id) ?? false;

      // Apply hysteresis:
      // To ENTER, distance must be <= radius
      // To EXIT, distance must be > radius + hysteresisBufferMeters
      if (!wasInside && dist <= zone.radiusMeters) {
        this.lastKnownZoneStatus.set(zone.id, true);
        events.push({
          id: `geo-enter-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          patientId,
          zoneId: zone.id,
          eventType: "enter",
          lat,
          lng,
          timestamp,
          synced: false,
        });
      } else if (wasInside && dist > zone.radiusMeters + this.hysteresisBufferMeters) {
        this.lastKnownZoneStatus.set(zone.id, false);
        events.push({
          id: `geo-exit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          patientId,
          zoneId: zone.id,
          eventType: "exit",
          lat,
          lng,
          timestamp,
          synced: false,
        });
      }
    }

    return events;
  }
}

export const geofenceEngine = new GeofenceEngine();
