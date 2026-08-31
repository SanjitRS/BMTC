import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  MapPin,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Radio,
  RefreshCw,
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  AlertTriangle,
  Send,
  Sliders,
  CheckCircle2,
  Clock,
  Layers,
  Database,
  GitMerge,
  Eye,
  Info,
  Navigation,
  Activity,
  Maximize2
} from "lucide-react";
import { geofenceEngine, ZoneEvaluation, haversineDistanceMeters } from "./geofenceEngine";
import { gpsTracker, GPSCoordinate, PRESET_ROUTES, BatteryMode } from "./gpsTracker";
import { alertDeduplicator } from "./alertDeduplicator";
import { syncEngine } from "./syncEngine";
import { conflictResolver, ConflictLog } from "./conflictResolver";
import { SafeZone, DebouncedAlert, SyncQueueItem, SyncStatus, GeofenceEvent } from "../../shared/contract";
import { Language, translations } from "../../locales/i18n";

interface SanjitSectionViewProps {
  currentLang: Language;
  patientId?: string;
}

export const SanjitSectionView: React.FC<SanjitSectionViewProps> = ({
  currentLang,
  patientId = "patient-101",
}) => {
  const t = translations[currentLang] || translations.en;

  // GPS & Geofence States
  const [position, setPosition] = useState<GPSCoordinate>(gpsTracker.getCurrentPosition());
  const [safeZones, setSafeZones] = useState<SafeZone[]>(geofenceEngine.getZones());
  const [evaluation, setEvaluation] = useState<ZoneEvaluation>(
    geofenceEngine.evaluatePosition(position.lat, position.lng)
  );
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ lat: number; lng: number; isInside: boolean; time: string }>>([]);

  // Simulation Controls
  const [isSimulating, setIsSimulating] = useState<boolean>(gpsTracker.isRunning());
  const [selectedRoute, setSelectedRoute] = useState<string>(gpsTracker.getSelectedRouteKey());
  const [batteryMode, setBatteryMode] = useState<BatteryMode>(gpsTracker.getBatteryMode());
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(gpsTracker.getSpeedMultiplier());
  const [customLat, setCustomLat] = useState<string>(position.lat.toString());
  const [customLng, setCustomLng] = useState<string>(position.lng.toString());

  // Alerts & Deduplication
  const [debouncedAlerts, setDebouncedAlerts] = useState<DebouncedAlert[]>(alertDeduplicator.getAlerts());
  const [rawEventLog, setRawEventLog] = useState(alertDeduplicator.getRawEventLog());

  // Sync Queue State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncEngine.getSyncStatus());
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>(syncEngine.getAllItems());
  const [selectedItemPayload, setSelectedItemPayload] = useState<SyncQueueItem | null>(null);
  const [isForceFailure, setIsForceFailure] = useState<boolean>(syncEngine.isForceFailureActive());

  // Conflict Logs
  const [conflictLogs, setConflictLogs] = useState<ConflictLog[]>(conflictResolver.getConflictLogs());
  const [activeTab, setActiveTab] = useState<"map" | "dedup" | "sync" | "conflict">("map");

  // Map Canvas & Zoom Ref
  const mapSvgRef = useRef<SVGSVGElement | null>(null);

  // Subscribe to GPS updates & process Geofence boundary triggers
  useEffect(() => {
    const unsubGps = gpsTracker.subscribe((newPos) => {
      setPosition(newPos);
      const evalResult = geofenceEngine.evaluatePosition(newPos.lat, newPos.lng);
      setEvaluation(evalResult);

      setBreadcrumbs((prev) => {
        const next = [...prev, { lat: newPos.lat, lng: newPos.lng, isInside: evalResult.isInsideAnySafeZone, time: new Date().toLocaleTimeString() }];
        return next.slice(-60); // Keep last 60 points
      });

      // Check transitions and generate GeofenceEvent
      const transitionEvents = geofenceEngine.checkTransitions(patientId, newPos.lat, newPos.lng, newPos.timestamp);
      for (const ev of transitionEvents) {
        // 1. Process with 5-minute sliding window deduplicator
        alertDeduplicator.processEvent(ev, safeZones);

        // 2. Enqueue in Sanjit's offline sync engine
        syncEngine.enqueue("geofence_event", ev, true);
      }
    });

    const unsubAlerts = alertDeduplicator.subscribe((alerts) => {
      setDebouncedAlerts([...alerts]);
      setRawEventLog(alertDeduplicator.getRawEventLog());
    });

    const unsubSync = syncEngine.subscribe((status, items) => {
      setSyncStatus(status);
      setQueueItems([...items]);
    });

    const unsubConflicts = conflictResolver.subscribe((logs) => {
      setConflictLogs([...logs]);
    });

    return () => {
      unsubGps();
      unsubAlerts();
      unsubSync();
      unsubConflicts();
    };
  }, [patientId, safeZones]);

  // Simulation handlers
  const handleToggleSimulation = () => {
    if (isSimulating) {
      gpsTracker.pauseSimulation();
      setIsSimulating(false);
    } else {
      gpsTracker.startSimulation();
      setIsSimulating(true);
    }
  };

  const handleResetSimulation = () => {
    gpsTracker.resetSimulation();
    setIsSimulating(false);
    setBreadcrumbs([]);
  };

  const handleStepForward = () => {
    gpsTracker.stepForward();
  };

  const handleRouteChange = (key: string) => {
    setSelectedRoute(key);
    gpsTracker.setRoute(key);
    setBreadcrumbs([]);
    setIsSimulating(false);
  };

  const handleBatteryModeChange = (mode: BatteryMode) => {
    setBatteryMode(mode);
    gpsTracker.setBatteryMode(mode);
  };

  const handleSpeedChange = (mult: number) => {
    setSpeedMultiplier(mult);
    gpsTracker.setSpeedMultiplier(mult);
  };

  const handleTeleport = () => {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      gpsTracker.setPosition(lat, lng);
    }
  };

  const handleFlushQueue = async () => {
    await syncEngine.flushQueue();
  };

  const handleToggleNetwork = () => {
    syncEngine.toggleOnlineMode();
  };

  const handleToggleForceFailure = () => {
    const next = !isForceFailure;
    setIsForceFailure(next);
    syncEngine.setForceFailure(next);
  };

  // Map Coordinate Normalizer (SVG projection around Guwahati bounds)
  // Center: ~26.148, 91.738. Span: ~0.02 deg lat, ~0.03 deg lng
  const mapBounds = {
    minLat: 26.138,
    maxLat: 26.158,
    minLng: 91.724,
    maxLng: 91.756,
  };

  const projectToSvg = (lat: number, lng: number, width: number = 800, height: number = 500) => {
    const x = ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * width;
    const y = ((mapBounds.maxLat - lat) / (mapBounds.maxLat - mapBounds.minLat)) * height;
    return { x, y };
  };

  // Compute radius in SVG pixels for meters
  const metersToSvgPixels = (meters: number, height: number = 500) => {
    const totalLatDegrees = mapBounds.maxLat - mapBounds.minLat;
    const totalMeters = totalLatDegrees * 111000;
    return (meters / totalMeters) * height;
  };

  // Manual map click to position patient
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!mapSvgRef.current) return;
    const rect = mapSvgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = rect.width;
    const height = rect.height;

    const lng = mapBounds.minLng + (clickX / width) * (mapBounds.maxLng - mapBounds.minLng);
    const lat = mapBounds.maxLat - (clickY / height) * (mapBounds.maxLat - mapBounds.minLat);

    gpsTracker.setPosition(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
    setCustomLat(lat.toFixed(6));
    setCustomLng(lng.toFixed(6));
  };

  return (
    <div className="space-y-6">
      {/* Top Telemetry & Status Ribbon */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Section Identity */}
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-md">
                  SECTION 2: SANJIT
                </span>
                <span className="text-xs text-slate-400">Geofence, GPS & Offline Sync Queue</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                {t.geofence.title}
              </h2>
            </div>
          </div>

          {/* Real-time Status Pills */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Geofence Status Indicator */}
            <div
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl border font-semibold text-sm transition-all duration-300 ${
                evaluation.isInsideAnySafeZone
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                  : "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.3)]"
              }`}
            >
              {evaluation.isInsideAnySafeZone ? (
                <>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>{t.geofence.insideSafeZone}</span>
                  {evaluation.activeZone && (
                    <span className="text-xs bg-emerald-950/80 px-2 py-0.5 rounded text-emerald-200 border border-emerald-600/40">
                      {evaluation.activeZone.name}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <ShieldAlert className="w-5 h-5 text-rose-400 animate-bounce" />
                  <span>{t.geofence.outsideSafeZone}</span>
                  <span className="text-xs bg-rose-950/80 px-2 py-0.5 rounded text-rose-200 border border-rose-600/40">
                    +{evaluation.distanceToNearestSafeZoneMeters}m from {evaluation.nearestZone?.name}
                  </span>
                </>
              )}
            </div>

            {/* Network State Simulator */}
            <button
              onClick={handleToggleNetwork}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                syncStatus.isOnline
                  ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/30"
                  : "bg-amber-950/40 border-amber-500/30 text-amber-400 hover:bg-amber-900/30"
              }`}
              title="Click to toggle simulated online/offline state"
            >
              {syncStatus.isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span>{syncStatus.isOnline ? "ONLINE" : "OFFLINE (Queuing)"}</span>
            </button>

            {/* Sync Queue Counter Badge */}
            <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700 px-3 py-2 rounded-xl text-xs">
              <Database className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-300">Queue:</span>
              <span
                className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                  syncStatus.totalPending > 0
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                    : "bg-slate-700 text-slate-300"
                }`}
              >
                {syncStatus.totalPending} pending
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400 font-mono">{syncStatus.totalSynced} synced</span>
            </div>
          </div>
        </div>

        {/* Breach Alert Banner if Outside Safe Zone */}
        {!evaluation.isInsideAnySafeZone && (
          <div className="mt-4 p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl flex items-center justify-between text-rose-200 text-sm animate-pulse">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span>
                <strong>CRITICAL TELEMETRY ALERT:</strong> Patient Dharmananda is outside all safe zones. Distance to nearest perimeter ({evaluation.nearestZone.name}):{" "}
                <strong>{evaluation.distanceToNearestSafeZoneMeters} meters</strong>.
              </span>
            </div>
            <button
              onClick={() => setActiveTab("dedup")}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors"
            >
              View Deduplicated Alerts ({debouncedAlerts.length})
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-1">
        <button
          onClick={() => setActiveTab("map")}
          className={`flex items-center space-x-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "map"
              ? "border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Interactive Geofence & GPS Map</span>
        </button>
        <button
          onClick={() => setActiveTab("dedup")}
          className={`flex items-center space-x-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "dedup"
              ? "border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>5-Min Alert Deduplicator</span>
          {debouncedAlerts.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full font-mono">
              {debouncedAlerts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("sync")}
          className={`flex items-center space-x-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "sync"
              ? "border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Offline Sync Queue Inspector</span>
          {syncStatus.totalPending > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full font-mono">
              {syncStatus.totalPending}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("conflict")}
          className={`flex items-center space-x-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "conflict"
              ? "border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <GitMerge className="w-4 h-4" />
          <span>Conflict Resolver & LWW Logs</span>
        </button>
      </div>

      {/* TAB 1: INTERACTIVE GEOFENCE MAP & GPS SIMULATOR */}
      {activeTab === "map" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Map Viewport (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">Guwahati Regional Geofence Monitor</h3>
                <span className="text-xs text-slate-400 font-mono">(Click anywhere on map to teleport patient)</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Home (150m)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> Clinic (100m)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-purple-500 inline-block"></span> Botanical Park (300m)
                </span>
              </div>
            </div>

            {/* SVG Visual Map Surface */}
            <div className="relative w-full h-[460px] bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden select-none cursor-crosshair">
              {/* Subtle Grid Lines */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-40"></div>

              <svg
                ref={mapSvgRef}
                onClick={handleMapClick}
                className="w-full h-full"
                viewBox="0 0 800 500"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Radar Pulse Gradient */}
                  <radialGradient id="patientRadar" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                    <stop offset="60%" stopColor="#0284c7" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#0369a1" stopOpacity="0" />
                  </radialGradient>

                  {/* Safe Zone Gradients */}
                  <radialGradient id="gradHome" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                  </radialGradient>
                  <radialGradient id="gradClinic" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                  </radialGradient>
                  <radialGradient id="gradPark" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
                  </radialGradient>
                </defs>

                {/* Safe Zones Concentric Circles */}
                {safeZones.map((zone) => {
                  const center = projectToSvg(zone.lat, zone.lng, 800, 500);
                  const radiusPixels = metersToSvgPixels(zone.radiusMeters, 500);
                  const gradId = zone.type === "home" ? "url(#gradHome)" : zone.type === "clinic" ? "url(#gradClinic)" : "url(#gradPark)";

                  return (
                    <g key={zone.id}>
                      {/* Filled Safe Area */}
                      <circle
                        cx={center.x}
                        cy={center.y}
                        r={radiusPixels}
                        fill={gradId}
                        stroke={zone.color}
                        strokeWidth="2"
                        strokeDasharray="4 2"
                        className="transition-all duration-500"
                      />

                      {/* Zone Center Anchor */}
                      <circle cx={center.x} cy={center.y} r="4" fill={zone.color} />

                      {/* Zone Label */}
                      <text
                        x={center.x}
                        y={center.y - radiusPixels - 8}
                        textAnchor="middle"
                        fill={zone.color}
                        fontSize="11"
                        fontWeight="700"
                        className="pointer-events-none drop-shadow"
                      >
                        {zone.name} ({zone.radiusMeters}m)
                      </text>
                    </g>
                  );
                })}

                {/* Breadcrumb Trail */}
                {breadcrumbs.length > 1 && (
                  <g>
                    {breadcrumbs.map((pt, idx) => {
                      if (idx === 0) return null;
                      const p1 = projectToSvg(breadcrumbs[idx - 1].lat, breadcrumbs[idx - 1].lng, 800, 500);
                      const p2 = projectToSvg(pt.lat, pt.lng, 800, 500);
                      return (
                        <line
                          key={`bc-${idx}`}
                          x1={p1.x}
                          y1={p1.y}
                          x2={p2.x}
                          y2={p2.y}
                          stroke={pt.isInside ? "#10b981" : "#f43f5e"}
                          strokeWidth="2.5"
                          strokeOpacity={0.4 + (idx / breadcrumbs.length) * 0.6}
                          strokeDasharray={pt.isInside ? "none" : "3 3"}
                        />
                      );
                    })}
                  </g>
                )}

                {/* Patient Live GPS Marker */}
                {(() => {
                  const pt = projectToSvg(position.lat, position.lng, 800, 500);
                  const isSafe = evaluation.isInsideAnySafeZone;
                  return (
                    <g transform={`translate(${pt.x}, ${pt.y})`}>
                      {/* Radar Pulse Wave */}
                      <circle
                        r={isSafe ? "30" : "45"}
                        fill="url(#patientRadar)"
                        className="radar-wave"
                      />

                      {/* Accuracy Ring */}
                      <circle
                        r={metersToSvgPixels(position.accuracyMeters, 500)}
                        fill="none"
                        stroke={isSafe ? "#38bdf8" : "#f43f5e"}
                        strokeWidth="1"
                        strokeOpacity="0.5"
                      />

                      {/* Central Glowing Pin */}
                      <circle
                        r="9"
                        fill={isSafe ? "#0284c7" : "#e11d48"}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        className="drop-shadow-lg"
                      />

                      {/* Heading Arrow */}
                      <polygon
                        points="0,-16 5,-8 -5,-8"
                        fill="#ffffff"
                        transform={`rotate(${position.headingDeg})`}
                      />

                      {/* Patient Name Badge Floating */}
                      <g transform="translate(0, 22)">
                        <rect
                          x="-50"
                          y="-10"
                          width="100"
                          height="20"
                          rx="4"
                          fill="#0f172a"
                          stroke={isSafe ? "#0ea5e9" : "#f43f5e"}
                          strokeWidth="1.5"
                          opacity="0.95"
                        />
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="10"
                          fontWeight="700"
                        >
                          Dharmananda (73)
                        </text>
                      </g>
                    </g>
                  );
                })()}
              </svg>

              {/* Real-time Map HUD Overlay */}
              <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-lg text-xs font-mono text-slate-300 backdrop-blur-md flex items-center space-x-4 shadow-lg">
                <div>
                  <span className="text-slate-500">LAT:</span> {position.lat.toFixed(5)}°N
                </div>
                <div>
                  <span className="text-slate-500">LNG:</span> {position.lng.toFixed(5)}°E
                </div>
                <div>
                  <span className="text-slate-500">SPD:</span> {position.speedKmh} km/h
                </div>
                <div>
                  <span className="text-slate-500">ACC:</span> ±{position.accuracyMeters}m
                </div>
              </div>
            </div>
          </div>

          {/* Right Controller Panel: Simulation & Battery Modes (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* GPS Route Simulator Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-400" />
                  GPS Route Simulator
                </h4>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                    isSimulating
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {isSimulating ? "RUNNING" : "PAUSED"}
                </span>
              </div>

              {/* Route Presets Selector */}
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Simulation Preset:</label>
                <select
                  value={selectedRoute}
                  onChange={(e) => handleRouteChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {Object.entries(PRESET_ROUTES).map(([key, r]) => (
                    <option key={key} value={key}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1 italic">
                  {PRESET_ROUTES[selectedRoute]?.description}
                </p>
              </div>

              {/* Play / Pause / Step Controls */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleToggleSimulation}
                  className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                    isSimulating
                      ? "bg-amber-600 hover:bg-amber-500 text-white"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  }`}
                >
                  {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isSimulating ? "Pause" : "Start Walk"}</span>
                </button>

                <button
                  onClick={handleStepForward}
                  disabled={isSimulating}
                  className="flex items-center justify-center space-x-1 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>Step</span>
                </button>

                <button
                  onClick={handleResetSimulation}
                  className="flex items-center justify-center space-x-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Speed Multiplier */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
                  <span>Simulation Speed:</span>
                  <span className="text-blue-400 font-mono">{speedMultiplier}x Real-Time</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 5, 10].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => handleSpeedChange(spd)}
                      className={`py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                        speedMultiplier === spd
                          ? "bg-blue-600 text-white border border-blue-400"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Battery-Conscious Polling Mode */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                  <span className="flex items-center gap-1.5">
                    <BatteryCharging className="w-4 h-4 text-emerald-400" />
                    {t.geofence.batteryMode}:
                  </span>
                  <span className="font-mono text-emerald-400">
                    {batteryMode === "high_accuracy" ? "1s Polling" : batteryMode === "balanced" ? "3s Polling" : "8s Polling"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["high_accuracy", "balanced", "power_saver"] as BatteryMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleBatteryModeChange(mode)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all text-center ${
                        batteryMode === mode
                          ? "bg-emerald-600 text-white border border-emerald-400 shadow-md"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"
                      }`}
                    >
                      {mode === "high_accuracy" ? "High (1s)" : mode === "balanced" ? "Balanced" : "Saver (8s)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Coordinate Teleport */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="text-xs text-slate-400 font-semibold block">Manual Coordinate Teleport:</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    placeholder="Latitude"
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={customLng}
                    onChange={(e) => setCustomLng(e.target.value)}
                    placeholder="Longitude"
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={handleTeleport}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 font-semibold text-xs rounded-lg border border-blue-500/30 transition-colors"
                >
                  Teleport to Coordinates
                </button>
              </div>
            </div>

            {/* Configured Safe Zones List */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
                  {t.geofence.safeZones} ({safeZones.length})
                </h4>
              </div>
              <div className="space-y-2">
                {safeZones.map((zone) => {
                  const dist = haversineDistanceMeters(position.lat, position.lng, zone.lat, zone.lng);
                  const isCurrent = dist <= zone.radiusMeters;
                  return (
                    <div
                      key={zone.id}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isCurrent
                          ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                          : "bg-slate-950/60 border-slate-800 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: zone.color }}></span>
                          {zone.name}
                        </span>
                        <span className="font-mono text-xs text-slate-400">{zone.radiusMeters}m radius</span>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs text-slate-500 font-mono">
                        <span>Distance to patient:</span>
                        <span className={isCurrent ? "text-emerald-400 font-bold" : "text-slate-400"}>
                          {Math.round(dist)} meters {isCurrent ? "(INSIDE)" : ""}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 5-MINUTE SLIDING WINDOW ALERT DEDUPLICATOR */}
      {activeTab === "dedup" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  5-Minute Sliding Window Alert Deduplication
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Debounces rapid perimeter oscillations into consolidated clinician alerts to prevent alarm fatigue.
                </p>
              </div>
              <button
                onClick={() => alertDeduplicator.clearAll()}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
              >
                Clear Log
              </button>
            </div>

            {/* Deduplication Metric Callout */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block">Raw Boundary Crossings</span>
                <span className="text-2xl font-bold font-mono text-blue-400">{rawEventLog.length}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block">Consolidated Alerts</span>
                <span className="text-2xl font-bold font-mono text-emerald-400">{debouncedAlerts.length}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block">Alarm Noise Reduction</span>
                <span className="text-2xl font-bold font-mono text-purple-400">
                  {rawEventLog.length > 0
                    ? `${Math.round(((rawEventLog.length - debouncedAlerts.length) / rawEventLog.length) * 100)}%`
                    : "0%"}
                </span>
              </div>
            </div>

            {/* Consolidated Alerts Feed */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Consolidated Sliding Window Alert Stream
              </h4>
              {debouncedAlerts.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-500 text-sm">
                  No boundary violations or oscillations detected in the current 5-minute sliding window.
                </div>
              ) : (
                debouncedAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border transition-all ${
                      alert.severity === "critical"
                        ? "bg-rose-950/30 border-rose-500/50 text-rose-100"
                        : alert.severity === "warning"
                        ? "bg-amber-950/30 border-amber-500/50 text-amber-100"
                        : "bg-emerald-950/30 border-emerald-500/50 text-emerald-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 text-xs font-bold uppercase rounded ${
                            alert.severity === "critical"
                              ? "bg-rose-600 text-white"
                              : alert.severity === "warning"
                              ? "bg-amber-600 text-white"
                              : "bg-emerald-600 text-white"
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="font-bold text-sm">{alert.zoneName}</span>
                      </div>
                      <span className="font-mono text-xs opacity-75">
                        {alert.oscillationCount > 1 && (
                          <span className="mr-2 bg-slate-800 px-2 py-0.5 rounded text-amber-300 border border-amber-500/30">
                            ⚡ {alert.oscillationCount} crossings in 5m
                          </span>
                        )}
                        {new Date(alert.lastTriggeredAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-xs mt-2 opacity-90">{alert.summary}</p>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        First Triggered: {new Date(alert.firstTriggeredAt).toLocaleTimeString()}
                      </span>
                      <button
                        onClick={() => alertDeduplicator.dispatchAlert(alert.id)}
                        disabled={alert.dispatched}
                        className={`px-3 py-1 rounded-lg font-semibold flex items-center space-x-1 transition-colors ${
                          alert.dispatched
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-500 text-white shadow-md"
                        }`}
                      >
                        <Send className="w-3 h-3" />
                        <span>{alert.dispatched ? "Dispatched" : "1-Click Dispatch"}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Raw Boundary Crossings Log (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              Raw Perimeter Event Ingestion Log
            </h4>
            <p className="text-xs text-slate-400">
              Granular enter/exit telemetry before deduplication aggregation.
            </p>

            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {rawEventLog.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No raw boundary events logged yet. Walk across a safe zone boundary to generate events.
                </div>
              ) : (
                rawEventLog.map((item, idx) => (
                  <div
                    key={`raw-${idx}`}
                    className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
                      item.isOscillation
                        ? "bg-slate-950/80 border-amber-500/30 text-amber-300"
                        : "bg-slate-950/50 border-slate-800 text-slate-300"
                    }`}
                  >
                    <div>
                      <span
                        className={`font-bold mr-2 uppercase ${
                          item.event.eventType === "enter" ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {item.event.eventType}
                      </span>
                      <span className="text-slate-400">{item.event.zoneId}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.isOscillation && (
                        <span className="text-[10px] bg-amber-950 px-1.5 py-0.5 rounded text-amber-200 border border-amber-600/40">
                          DEBOUNCED
                        </span>
                      )}
                      <span className="text-slate-500">
                        {new Date(item.event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OFFLINE SYNC QUEUE INSPECTOR */}
      {activeTab === "sync" && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Database className="w-5 h-5 text-cyan-400" />
                  {t.sync.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Central write seam holding offline telemetry, cognitive game scores, reminder acks, and patient records.
                </p>
              </div>

              {/* Sync Actions */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleToggleForceFailure}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    isForceFailure
                      ? "bg-rose-950/60 border-rose-500/50 text-rose-300 animate-pulse"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                  }`}
                  title="Simulate 500 error to test exponential backoff retry"
                >
                  {isForceFailure ? "Simulated Server Error: ACTIVE" : "Simulate Server Failure"}
                </button>

                <button
                  onClick={handleFlushQueue}
                  disabled={syncStatus.isSyncing || syncStatus.totalPending === 0 || !syncStatus.isOnline}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg transition-all shadow-blue-500/20"
                >
                  <RefreshCw className={`w-4 h-4 ${syncStatus.isSyncing ? "animate-spin" : ""}`} />
                  <span>{syncStatus.isSyncing ? "Flushing Batch..." : t.sync.flushNow}</span>
                </button>
              </div>
            </div>

            {/* Sync Queue Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block font-semibold">{t.sync.pending}</span>
                <span className="text-2xl font-bold font-mono text-amber-400">{syncStatus.totalPending}</span>
                <span className="text-[11px] text-slate-500 block mt-1">Items waiting for server sync</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block font-semibold">{t.sync.synced}</span>
                <span className="text-2xl font-bold font-mono text-emerald-400">{syncStatus.totalSynced}</span>
                <span className="text-[11px] text-slate-500 block mt-1">Confirmed in central database</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block font-semibold">Network State</span>
                <div className="flex items-center space-x-1.5 mt-1">
                  {syncStatus.isOnline ? (
                    <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                      <Wifi className="w-4 h-4" /> ONLINE
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-amber-400 flex items-center gap-1">
                      <WifiOff className="w-4 h-4" /> OFFLINE
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  {syncStatus.isOnline ? "Auto-sync on enqueue" : "Queuing to IndexedDB"}
                </span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block font-semibold">Last Flush</span>
                <span className="text-xs font-mono text-slate-300 block mt-1">
                  {syncStatus.lastSyncTime ? new Date(syncStatus.lastSyncTime).toLocaleTimeString() : "None yet"}
                </span>
                {syncStatus.lastError && (
                  <span className="text-[11px] text-rose-400 block mt-1 truncate" title={syncStatus.lastError}>
                    ⚠️ {syncStatus.lastError}
                  </span>
                )}
              </div>
            </div>

            {/* Sync Queue Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Sync Queue Items ({queueItems.length})
                </span>
                {syncStatus.totalSynced > 0 && (
                  <button
                    onClick={() => syncEngine.clearSyncedItems()}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Clear Synced Items
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Status</th>
                      <th className="p-3">Queue ID</th>
                      <th className="p-3">Entity Type</th>
                      <th className="p-3">Created At</th>
                      <th className="p-3">Retries</th>
                      <th className="p-3">Payload Summary</th>
                      <th className="p-3 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {queueItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                          Queue is currently empty. Trigger a GPS boundary crossing or play a cognitive game to enqueue items.
                        </td>
                      </tr>
                    ) : (
                      queueItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3">
                            {item.synced ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/40 font-bold">
                                SYNCED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-700/40 font-bold animate-pulse">
                                PENDING
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-400">{item.id}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700/40 uppercase text-[10px]">
                              {item.entityType}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400">{new Date(item.createdAt).toLocaleTimeString()}</td>
                          <td className="p-3">
                            {item.retryCount > 0 ? (
                              <span className="text-amber-400 font-bold">{item.retryCount}x backoff</span>
                            ) : (
                              <span className="text-slate-500">0</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-400 truncate max-w-[200px]">
                            {JSON.stringify(item.payload)}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setSelectedItemPayload(item)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-xs transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 inline mr-1" /> View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* JSON Payload Inspection Modal */}
          {selectedItemPayload && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-400" />
                    Sync Queue Payload ({selectedItemPayload.entityType})
                  </h4>
                  <button
                    onClick={() => setSelectedItemPayload(null)}
                    className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded-lg"
                  >
                    Close
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto max-h-72">
                  {JSON.stringify(selectedItemPayload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CONFLICT RESOLUTION & LWW LOGS */}
      {activeTab === "conflict" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-blue-400" />
                Conflict Resolution & Last-Write-Wins (LWW) Engine
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically resolves concurrent offline modifications: LWW for telemetry / game sessions and 3-way versioned audit merges for patient medical records.
              </p>
            </div>

            {/* Simulate Conflict Test Button */}
            <button
              onClick={() => {
                const sampleBase = {
                  patientId: "patient-101",
                  name: "Dharmananda Baruah",
                  age: 73,
                  diagnosisStage: "moderate" as const,
                  medications: [{ id: "m1", name: "Donepezil", dosage: "10mg", schedule: "Daily" }],
                  emergencyContacts: [{ name: "Ananya Baruah", relation: "Daughter", phone: "+91 98640 12345", isPrimary: true }],
                  updatedBy: "Base",
                  updatedAt: new Date(Date.now() - 3600000).toISOString(),
                  version: 1,
                };
                const sampleLocal = {
                  ...sampleBase,
                  diagnosisStage: "moderate" as const,
                  medications: [
                    ...sampleBase.medications,
                    { id: "m2", name: "Memantine", dosage: "5mg", schedule: "Nightly" },
                  ],
                  updatedBy: "Caregiver App (Offline)",
                  updatedAt: new Date().toISOString(),
                  version: 2,
                };
                const sampleRemote = {
                  ...sampleBase,
                  emergencyContacts: [
                    ...sampleBase.emergencyContacts,
                    { name: "Dr. Sarma", relation: "Doctor", phone: "+91 94350 67890", isPrimary: false },
                  ],
                  updatedBy: "Clinic Portal (Offline)",
                  updatedAt: new Date().toISOString(),
                  version: 2,
                };
                conflictResolver.resolvePatientRecordConflict(sampleBase, sampleLocal, sampleRemote);
              }}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl transition-colors shadow-md shadow-purple-500/20"
            >
              Simulate Medical Record Version Collision
            </button>
          </div>

          <div className="space-y-3">
            {conflictLogs.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-500 text-sm">
                No conflict events recorded yet. Click "Simulate Medical Record Version Collision" to test 3-way merge logic.
              </div>
            ) : (
              conflictLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          log.strategy === "LWW"
                            ? "bg-blue-950 text-blue-300 border border-blue-700/40"
                            : "bg-purple-950 text-purple-300 border border-purple-700/40"
                        }`}
                      >
                        {log.strategy}
                      </span>
                      <span className="text-slate-300 font-semibold">{log.entityType}</span>
                    </div>
                    <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-300 font-sans text-xs">{log.resolutionNote}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
