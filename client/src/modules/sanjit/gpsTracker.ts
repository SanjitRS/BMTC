export type BatteryMode = "high_accuracy" | "balanced" | "power_saver";

export interface GPSCoordinate {
  lat: number;
  lng: number;
  accuracyMeters: number;
  speedKmh: number;
  headingDeg: number;
  timestamp: string;
}

export interface RouteWaypoint {
  lat: number;
  lng: number;
  name: string;
}

// Preset Simulation Routes in Guwahati NER
export const PRESET_ROUTES: Record<string, { name: string; description: string; waypoints: RouteWaypoint[] }> = {
  safe_stroll: {
    name: "Safe Daily Walk (Home -> Nehru Park)",
    description: "Patient walks within safe corridors between residence and Nehru Park.",
    waypoints: [
      { lat: 26.1445, lng: 91.7362, name: "Home Residence" },
      { lat: 26.1455, lng: 91.7350, name: "Residential Lane" },
      { lat: 26.1468, lng: 91.7335, name: "Park Approach" },
      { lat: 26.1480, lng: 91.7310, name: "Nehru Botanical Park" },
      { lat: 26.1472, lng: 91.7328, name: "Park Return Path" },
      { lat: 26.1450, lng: 91.7358, name: "Home Perimeter" },
      { lat: 26.1445, lng: 91.7362, name: "Home Residence" },
    ],
  },
  wandering_breach: {
    name: "Perimeter Breach & Wandering Scenario",
    description: "Patient strays away from safe zone into unmonitored arterial road.",
    waypoints: [
      { lat: 26.1445, lng: 91.7362, name: "Home Residence" },
      { lat: 26.1460, lng: 91.7380, name: "Boundary Edge (140m)" },
      { lat: 26.1475, lng: 91.7405, name: "Safe Zone Exit Boundary (260m)" },
      { lat: 26.1500, lng: 91.7430, name: "Busy Commercial Junction (Breach 600m)" },
      { lat: 26.1530, lng: 91.7470, name: "Disoriented Wandering Area (1.2km)" },
      { lat: 26.1550, lng: 91.7500, name: "Highway Perimeter" },
    ],
  },
  rapid_oscillation: {
    name: "Boundary Oscillation (Stress Debounce)",
    description: "Rapidly crosses the 150m boundary 8 times to test the 5-min sliding window filter.",
    waypoints: [
      { lat: 26.1445, lng: 91.7362, name: "Home Center (0m)" },
      { lat: 26.1458, lng: 91.7362, name: "Boundary Border (145m - Inside)" },
      { lat: 26.1461, lng: 91.7362, name: "Outside Border (178m - Exit)" },
      { lat: 26.1457, lng: 91.7362, name: "Inside Border (135m - Enter)" },
      { lat: 26.1462, lng: 91.7362, name: "Outside Border (189m - Exit)" },
      { lat: 26.1456, lng: 91.7362, name: "Inside Border (122m - Enter)" },
      { lat: 26.1463, lng: 91.7362, name: "Outside Border (200m - Exit)" },
      { lat: 26.1445, lng: 91.7362, name: "Return to Home (0m - Enter)" },
    ],
  },
  clinic_transit: {
    name: "Scheduled Clinic Visit",
    description: "Patient travels from Home to Regional Geriatric Care Center.",
    waypoints: [
      { lat: 26.1445, lng: 91.7362, name: "Home Residence" },
      { lat: 26.1470, lng: 91.7390, name: "Transit Avenue" },
      { lat: 26.1495, lng: 91.7420, name: "Hospital Approach" },
      { lat: 26.1520, lng: 91.7450, name: "Geriatric Care Center Safe Zone" },
    ],
  },
};

export class GPSTracker {
  private currentMode: BatteryMode = "balanced";
  private currentPosition: GPSCoordinate;
  private isSimulating: boolean = false;
  private simulationTimer: any = null;
  private selectedRouteKey: string = "safe_stroll";
  private routeWaypoints: RouteWaypoint[] = PRESET_ROUTES.safe_stroll.waypoints;
  private currentWaypointIndex: number = 0;
  private stepFraction: number = 0;
  private speedMultiplier: number = 1;
  private listeners: Array<(pos: GPSCoordinate) => void> = [];

  constructor() {
    this.currentPosition = {
      lat: 26.1445,
      lng: 91.7362,
      accuracyMeters: 8,
      speedKmh: 0,
      headingDeg: 0,
      timestamp: new Date().toISOString(),
    };
  }

  public getBatteryIntervalMs(): number {
    switch (this.currentMode) {
      case "high_accuracy":
        return 1000;
      case "balanced":
        return 3000;
      case "power_saver":
        return 8000;
    }
  }

  public setBatteryMode(mode: BatteryMode) {
    this.currentMode = mode;
    if (this.isSimulating) {
      this.pauseSimulation();
      this.startSimulation();
    }
  }

  public getBatteryMode(): BatteryMode {
    return this.currentMode;
  }

  public setSpeedMultiplier(mult: number) {
    this.speedMultiplier = mult;
  }

  public getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }

  public getCurrentPosition(): GPSCoordinate {
    return { ...this.currentPosition };
  }

  public setPosition(lat: number, lng: number) {
    this.currentPosition = {
      lat,
      lng,
      accuracyMeters: 5 + Math.random() * 5,
      speedKmh: 3.5,
      headingDeg: Math.floor(Math.random() * 360),
      timestamp: new Date().toISOString(),
    };
    this.notifyListeners();
  }

  public setRoute(routeKey: string) {
    if (PRESET_ROUTES[routeKey]) {
      this.selectedRouteKey = routeKey;
      this.routeWaypoints = PRESET_ROUTES[routeKey].waypoints;
      this.resetSimulation();
    }
  }

  public getSelectedRouteKey(): string {
    return this.selectedRouteKey;
  }

  public subscribe(cb: (pos: GPSCoordinate) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb(this.currentPosition));
  }

  public startSimulation() {
    if (this.isSimulating) return;
    this.isSimulating = true;

    const interval = Math.max(200, this.getBatteryIntervalMs() / this.speedMultiplier);

    this.simulationTimer = setInterval(() => {
      this.stepSimulation();
    }, interval);
  }

  public pauseSimulation() {
    this.isSimulating = false;
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }
  }

  public isRunning(): boolean {
    return this.isSimulating;
  }

  public resetSimulation() {
    this.pauseSimulation();
    this.currentWaypointIndex = 0;
    this.stepFraction = 0;
    if (this.routeWaypoints.length > 0) {
      this.setPosition(this.routeWaypoints[0].lat, this.routeWaypoints[0].lng);
    }
  }

  public stepForward() {
    this.stepSimulation();
  }

  private stepSimulation() {
    if (this.routeWaypoints.length < 2) return;

    // Interpolate between current waypoint and next waypoint
    const nextIndex = (this.currentWaypointIndex + 1) % this.routeWaypoints.length;
    const startWp = this.routeWaypoints[this.currentWaypointIndex];
    const endWp = this.routeWaypoints[nextIndex];

    const stepIncrement = 0.15 * this.speedMultiplier;
    this.stepFraction += stepIncrement;

    if (this.stepFraction >= 1) {
      this.stepFraction = 0;
      this.currentWaypointIndex = nextIndex;
    }

    const currentLat = startWp.lat + (endWp.lat - startWp.lat) * this.stepFraction;
    const currentLng = startWp.lng + (endWp.lng - startWp.lng) * this.stepFraction;

    // Add slight realistic GPS jitter (0.00002 deg ~ 2 meters)
    const jitterLat = (Math.random() - 0.5) * 0.00003;
    const jitterLng = (Math.random() - 0.5) * 0.00003;

    this.currentPosition = {
      lat: Number((currentLat + jitterLat).toFixed(6)),
      lng: Number((currentLng + jitterLng).toFixed(6)),
      accuracyMeters: this.currentMode === "high_accuracy" ? 4 : this.currentMode === "balanced" ? 10 : 25,
      speedKmh: Number((3.2 + Math.random() * 0.8).toFixed(1)),
      headingDeg: Math.round(
        (Math.atan2(endWp.lng - startWp.lng, endWp.lat - startWp.lat) * 180) / Math.PI + 360
      ) % 360,
      timestamp: new Date().toISOString(),
    };

    this.notifyListeners();
  }
}

export const gpsTracker = new GPSTracker();
