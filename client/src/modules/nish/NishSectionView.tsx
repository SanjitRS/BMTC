import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  FileText,
  AlertTriangle,
  Lock,
  RefreshCw,
  Search,
  CheckCircle2,
  PhoneCall,
  Send,
  Building
} from "lucide-react";
import { ingestionPipelineClient } from "./ingestionPipeline";
import { TherapyScorecard } from "./therapyScorecard";
import { PatientRecordsAudit } from "./patientRecordsAudit";
import { SecurityConsent } from "./securityConsent";
import { PatientRecord, GameSession, DebouncedAlert } from "../../shared/contract";
import { alertDeduplicator } from "../sanjit/alertDeduplicator";
import { syncEngine } from "../sanjit/syncEngine";
import { Language, translations } from "../../locales/i18n";

interface NishSectionViewProps {
  currentLang: Language;
}

export const NishSectionView: React.FC<NishSectionViewProps> = ({ currentLang }) => {
  const t = translations[currentLang] || translations.en;

  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("patient-101");
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [alerts, setAlerts] = useState<DebouncedAlert[]>(alertDeduplicator.getAlerts());
  const [orgAnalytics, setOrgAnalytics] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"scorecard" | "audit" | "alerts" | "security">("scorecard");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const patientList = await ingestionPipelineClient.getPatients();
      setPatients(patientList);
      if (patientList.length > 0 && !selectedPatientId) {
        setSelectedPatientId(patientList[0].patientId);
      }

      const patientSessions = await ingestionPipelineClient.getPatientSessions(selectedPatientId || "patient-101");
      setSessions(patientSessions);

      const analytics = await ingestionPipelineClient.getOrgAnalytics();
      setOrgAnalytics(analytics);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const unsubAlerts = alertDeduplicator.subscribe((newAlerts) => {
      setAlerts([...newAlerts]);
    });

    const unsubSync = syncEngine.subscribe(() => {
      // Whenever sync engine processes items, refresh patient sessions
      loadData();
    });

    return () => {
      unsubAlerts();
      unsubSync();
    };
  }, [selectedPatientId]);

  const selectedPatient = patients.find((p) => p.patientId === selectedPatientId) || patients[0];

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patientId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl text-orange-400">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-md">
                  SECTION 3: NISCHAL
                </span>
                <span className="text-xs text-slate-400">Admin Pipeline, Clinical Roster & Security</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                {t.admin.title}
              </h2>
            </div>
          </div>

          <button
            onClick={loadData}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Server Pipeline</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Patient Roster (4 cols) & Drilldown Suite (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Patient Roster Card */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-400" />
              {t.admin.roster} ({patients.length})
            </h3>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient name or ID..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Patient Items List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredPatients.map((p) => {
              const isSelected = p.patientId === selectedPatientId;
              return (
                <div
                  key={p.patientId}
                  onClick={() => setSelectedPatientId(p.patientId)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-orange-950/40 border-orange-500 text-white shadow-md shadow-orange-500/10"
                      : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{p.name}</span>
                    <span
                      className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${
                        p.diagnosisStage === "early"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-700/40"
                          : p.diagnosisStage === "moderate"
                          ? "bg-amber-950 text-amber-300 border border-amber-700/40"
                          : "bg-rose-950 text-rose-300 border border-rose-700/40"
                      }`}
                    >
                      {p.diagnosisStage}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 font-mono">
                    <span>ID: {p.patientId}</span>
                    <span>v{p.version}.0</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Drill-Down Suite Card */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          {/* Sub-tab Switcher */}
          <div className="flex border-b border-slate-800 space-x-2">
            <button
              onClick={() => setActiveTab("scorecard")}
              className={`flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === "scorecard"
                  ? "border-orange-500 text-orange-400 bg-orange-500/10 rounded-t-lg"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{t.admin.scorecard}</span>
            </button>

            <button
              onClick={() => setActiveTab("audit")}
              className={`flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === "audit"
                  ? "border-orange-500 text-orange-400 bg-orange-500/10 rounded-t-lg"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t.admin.recordsAudit}</span>
            </button>

            <button
              onClick={() => setActiveTab("alerts")}
              className={`flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === "alerts"
                  ? "border-orange-500 text-orange-400 bg-orange-500/10 rounded-t-lg"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{t.admin.alertCenter}</span>
              {alerts.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-mono font-bold">
                  {alerts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === "security"
                  ? "border-orange-500 text-orange-400 bg-orange-500/10 rounded-t-lg"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{t.admin.gdprSecurity}</span>
            </button>
          </div>

          {/* Sub-tab Content */}
          {selectedPatient && (
            <div>
              {activeTab === "scorecard" && (
                <TherapyScorecard sessions={sessions} patientName={selectedPatient.name} />
              )}

              {activeTab === "audit" && (
                <PatientRecordsAudit
                  patient={selectedPatient}
                  onRecordUpdated={(updated) => {
                    setPatients((prev) =>
                      prev.map((p) => (p.patientId === updated.patientId ? updated : p))
                    );
                  }}
                />
              )}

              {activeTab === "alerts" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm">Active Clinician Alert Stream</h4>
                    <span className="text-xs text-slate-400 font-mono">Deduplicated Feed</span>
                  </div>

                  <div className="space-y-3">
                    {alerts.length === 0 ? (
                      <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-500 text-xs">
                        No active safety alerts. All patients within designated safe perimeters.
                      </div>
                    ) : (
                      alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-rose-400 uppercase">
                              ⚠️ {alert.severity} • {alert.zoneName}
                            </span>
                            <span className="font-mono text-xs text-slate-500">
                              {new Date(alert.lastTriggeredAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300">{alert.summary}</p>
                          <div className="flex justify-end space-x-2 pt-2">
                            <button
                              onClick={() => alertDeduplicator.dispatchAlert(alert.id)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg flex items-center space-x-1"
                            >
                              <PhoneCall className="w-3 h-3" />
                              <span>{t.admin.emergencyDispatch}</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <SecurityConsent
                  patientId={selectedPatient.patientId}
                  onPatientDeleted={() => {
                    setPatients((prev) => prev.filter((p) => p.patientId !== selectedPatient.patientId));
                    setSelectedPatientId("");
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
