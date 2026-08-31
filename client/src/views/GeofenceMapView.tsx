import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  ShieldCheck, 
  ShieldAlert, 
  Navigation, 
  Clock, 
  AlertTriangle, 
  Layers, 
  Eye, 
  EyeOff,
  RefreshCw,
  Send
} from 'lucide-react';
import { api } from '../api/client';
import { PatientRecord, GeofenceEvent, SafeZone } from '../types/contract';
import { useLanguage } from '../context/LanguageContext';

interface GeofenceMapViewProps {
  selectedPatientId: string;
  onSelectPatient: (id: string) => void;
}

export const GeofenceMapView: React.FC<GeofenceMapViewProps> = ({ selectedPatientId, onSelectPatient }) => {
  const { t } = useLanguage();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [currentPatient, setCurrentPatient] = useState<PatientRecord | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<any>(null);
  const [events, setEvents] = useState<GeofenceEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [simulatingBreach, setSimulatingBreach] = useState<boolean>(false);

  const loadData = async (patId: string) => {
    setLoading(true);
    try {
      const [patList, pat, bc, evList] = await Promise.all([
        api.getPatients(),
        api.getPatientById(patId),
        api.getBreadcrumbs(patId),
        api.getGeofenceEvents(patId)
      ]);
      setPatients(patList);
      setCurrentPatient(pat);
      setBreadcrumbs(bc);
      setEvents(evList);
    } catch (err) {
      console.error('Failed to load geofence data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedPatientId || 'pat_001');
  }, [selectedPatientId]);

  const handleSimulateBreach = async () => {
    setSimulatingBreach(true);
    try {
      await api.generateSyncBatch(currentPatient?.patientId || 'pat_001', 'geofence_breach');
      await loadData(currentPatient?.patientId || 'pat_001');
    } catch (err) {
      console.error(err);
    } finally {
      setSimulatingBreach(false);
    }
  };

  if (loading || !currentPatient) {
    return (
      <div className="flex items-center justify-center p-20 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-400 mr-3" />
        <span className="text-sm font-semibold">Loading Geofence Surveillance & GPS telemetry...</span>
      </div>
    );
  }

  const safeZones: SafeZone[] = currentPatient.safeZones || [];
  const isConsentRevoked = currentPatient.locationTrackingConsent === false;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-850 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-xl">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
                <span>Geofencing & Real-Time Safety Surveillance</span>
              </h2>
              <p className="text-xs text-slate-400">
                Safe zone perimeter detection, wandering vector analysis, and alert debouncing.
              </p>
            </div>
          </div>
        </div>

        {/* Patient Switcher & Breach Simulator */}
        <div className="flex items-center gap-3">
          <select
            value={currentPatient.patientId}
            onChange={e => onSelectPatient(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-teal-500"
          >
            {patients.map(p => (
              <option key={p.patientId} value={p.patientId}>
                {p.name} ({p.patientId}) {p.locationTrackingConsent === false ? '• [Consent Revoked]' : ''}
              </option>
            ))}
          </select>

          <button
            onClick={handleSimulateBreach}
            disabled={simulatingBreach || isConsentRevoked}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            title="Simulate patient crossing outer boundary to test alert engine"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Simulate Breach</span>
          </button>
        </div>
      </div>

      {/* Consent Revoked Warning Banner (if applicable) */}
      {isConsentRevoked && (
        <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex items-center gap-3 text-amber-200 text-xs">
          <EyeOff className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <strong>Location Tracking Consent is Currently Revoked:</strong> GPS telemetry ingestion is paused in compliance with patient privacy rights. Safe zone tracking will resume once consent is granted.
          </div>
        </div>
      )}

      {/* Main Map + Event Stream Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Map Visualizer */}
        <div className="lg:col-span-2 bg-slate-850 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Live Geofence Radar ({safeZones.length} Safe Zones Configured)
              </span>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              Center: {safeZones[0]?.name || 'Guwahati / Assam'}
            </span>
          </div>

          {/* Map canvas simulation with SVG overlay for crisp guaranteed rendering */}
          <div className="relative w-full h-[420px] bg-slate-950 p-4 flex items-center justify-center overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]"></div>

            {/* Simulated Geographic Roads & City Map Representation */}
            <svg className="w-full h-full absolute inset-0 text-slate-800 opacity-40" viewBox="0 0 800 500">
              <path d="M 50 150 Q 250 80 450 120 T 750 100" fill="none" stroke="#475569" strokeWidth="6" />
              <path d="M 120 450 Q 300 350 480 380 T 700 420" fill="none" stroke="#475569" strokeWidth="4" />
              <path d="M 400 30 L 400 470" fill="none" stroke="#475569" strokeWidth="5" />
              <path d="M 180 80 L 180 420" fill="none" stroke="#334155" strokeWidth="3" />
              <path d="M 620 60 L 620 440" fill="none" stroke="#334155" strokeWidth="3" />
            </svg>

            {/* Safe Zone Boundary Rings */}
            {safeZones.map((zone, idx) => {
              const offsets = [
                { cx: '50%', cy: '50%', r: 110, color: 'border-emerald-500/50 bg-emerald-500/10' },
                { cx: '30%', cy: '35%', r: 70, color: 'border-blue-500/50 bg-blue-500/10' },
                { cx: '70%', cy: '65%', r: 85, color: 'border-purple-500/50 bg-purple-500/10' }
              ];
              const pos = offsets[idx % offsets.length];
              return (
                <div
                  key={zone.id}
                  className={`absolute rounded-full border-2 border-dashed ${pos.color} flex items-center justify-center shadow-lg transition-all`}
                  style={{
                    width: `${pos.r * 2}px`,
                    height: `${pos.r * 2}px`,
                    left: `calc(${pos.cx} - ${pos.r}px)`,
                    top: `calc(${pos.cy} - ${pos.r}px)`
                  }}
                >
                  <span className="text-[10px] font-bold text-slate-200 bg-slate-900/80 px-2 py-0.5 rounded shadow border border-slate-700/80">
                    {zone.name.split('(')[0]} ({zone.radiusMeters}m)
                  </span>
                </div>
              );
            })}

            {/* Breadcrumbs Trail & Live Patient Marker */}
            {!isConsentRevoked && (
              <div className="absolute z-10 flex flex-col items-center animate-bounce" style={{ top: '46%', left: '52%' }}>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-teal-500/30 animate-ping absolute -top-1 -left-1"></div>
                  <div className="w-8 h-8 rounded-full bg-teal-500 border-2 border-white flex items-center justify-center text-white font-bold text-xs shadow-xl">
                    {currentPatient.name.charAt(0)}
                  </div>
                </div>
                <div className="mt-1 bg-slate-900/90 border border-teal-500 text-teal-300 font-mono text-[10px] px-2 py-0.5 rounded shadow-lg">
                  {currentPatient.name} (Live)
                </div>
              </div>
            )}

            {/* Map Legend */}
            <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 p-3 rounded-xl shadow-xl text-[11px] space-y-1.5 z-20 backdrop-blur-sm">
              <div className="font-bold text-slate-300 border-b border-slate-800 pb-1">Legend</div>
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Primary Safe Zone (Home)
              </div>
              <div className="flex items-center gap-2 text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Medical Clinic Zone
              </div>
              <div className="flex items-center gap-2 text-teal-400">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span> Live GPS Patient Coordinate
              </div>
            </div>
          </div>
        </div>

        {/* Geofence Events Feed & Safe Zone Parameters */}
        <div className="space-y-6">
          {/* Safe Zones List */}
          <div className="bg-slate-850 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Configured Safe Zones</span>
            </h3>

            {safeZones.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No safe zones defined for this patient.</p>
            ) : (
              safeZones.map(zone => (
                <div key={zone.id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{zone.name}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-300">
                      {zone.type}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Radius: <strong className="text-slate-200">{zone.radiusMeters}m</strong></span>
                    <span className="font-mono text-[10px] text-slate-500">
                      [{zone.centerLat.toFixed(3)}, {zone.centerLng.toFixed(3)}]
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Geofence Event History Log */}
          <div className="bg-slate-850 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Geofence Event Log ({events.length})</span>
              </h3>
              <span className="text-[10px] text-slate-500">Section 0 Schema</span>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {events.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No geofence events logged yet.</p>
              ) : (
                events.map(ev => (
                  <div 
                    key={ev.id} 
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                      ev.eventType === 'exit' 
                        ? 'bg-rose-950/30 border-rose-500/40 text-rose-200' 
                        : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${
                          ev.eventType === 'exit' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {ev.eventType}
                        </span>
                        <span className="text-slate-200">{ev.zoneId}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        [{ev.lat.toFixed(4)}, {ev.lng.toFixed(4)}]
                      </div>
                    </div>

                    <div className="text-right text-[10px] text-slate-400">
                      {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
