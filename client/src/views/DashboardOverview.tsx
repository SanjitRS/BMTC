import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldAlert, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  Clock, 
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import { api } from '../api/client';
import { PatientRecord, DeduplicatedAlert } from '../types/contract';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface DashboardOverviewProps {
  onSelectPatient: (patientId: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onSelectPatient, onNavigateTab }) => {
  const { t } = useLanguage();
  const { role } = useAuth();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [alerts, setAlerts] = useState<DeduplicatedAlert[]>([]);
  const [orgStats, setOrgStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [patList, alertList, org] = await Promise.all([
        api.getPatients(),
        api.getAlerts({ status: 'active' }),
        api.getOrgAnalytics()
      ]);
      setPatients(patList);
      setAlerts(alertList);
      setOrgStats(org);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.patientId.includes(searchQuery);
    const matchesStage = stageFilter === 'all' || p.diagnosisStage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high');

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-850 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <span>Dementia Clinical Operations & Oversight</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono">
              Live Pipeline Active
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Continuous ingestion of cognitive therapy scores, geofence boundary events, and medication adherence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('alerts')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-2"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Alert Center ({alerts.length})</span>
          </button>
          <button
            onClick={() => onNavigateTab('analytics')}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            <span>Org Analytics</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div className="bg-slate-850 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('stats.total_patients')}</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-100">{patients.length}</div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">100%</span> active monitoring
          </div>
        </div>

        {/* Active Safety Alerts */}
        <div className="bg-slate-850 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('stats.active_alerts')}</span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400">{alerts.length}</div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <span className="text-rose-400 font-semibold">{criticalAlerts.length} high priority</span> requiring clinician review
          </div>
        </div>

        {/* Average Cognitive Accuracy */}
        <div className="bg-slate-850 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('stats.avg_accuracy')}</span>
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-400">{orgStats?.orgAverageAccuracy || 82}%</div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-teal-300 font-semibold">+4.2%</span> vs last week baseline
          </div>
        </div>

        {/* Total Therapy Sessions */}
        <div className="bg-slate-850 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('stats.total_sessions')}</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-300">{orgStats?.totalCognitiveSessions || 14}</div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <span>Across 4 therapy game modalities</span>
          </div>
        </div>
      </div>

      {/* Urgent Alerts Banner (if any) */}
      {criticalAlerts.length > 0 && (
        <div className="bg-rose-950/40 border border-rose-500/50 p-4 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-rose-300 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
              <span>Urgent Clinical Safety & Wandering Alerts</span>
            </div>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-xs text-rose-400 hover:text-rose-300 underline font-semibold"
            >
              View all {criticalAlerts.length} alerts →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {criticalAlerts.slice(0, 2).map(alert => (
              <div key={alert.id} className="bg-slate-900/90 border border-rose-500/40 p-3.5 rounded-xl flex items-start justify-between">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                    <span className="text-rose-400">{alert.patientName}</span>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded uppercase">
                      {alert.alertType.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-snug">{alert.summary}</p>
                </div>
                <button
                  onClick={() => {
                    api.acknowledgeAlert(alert.id).then(() => loadData());
                  }}
                  className="ml-3 px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded-lg shrink-0 transition-colors"
                >
                  {t('btn.acknowledge')}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patient Roster Overview Table */}
      <div className="bg-slate-850 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Table Controls */}
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-400" />
              <span>{t('nav.patients')}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Active patient clinical tracking and cognitive trajectory summary
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search patient..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-100 pl-9 pr-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-teal-500 w-44 sm:w-56"
              />
            </div>

            {/* Stage Filter */}
            <select
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Stages</option>
              <option value="early">Early Stage</option>
              <option value="moderate">Moderate Stage</option>
              <option value="severe">Severe Stage</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-5">{t('table.patient_name')}</th>
                <th className="py-3 px-4">{t('table.stage')}</th>
                <th className="py-3 px-4">{t('table.cognitive_status')}</th>
                <th className="py-3 px-4">{t('table.accuracy')}</th>
                <th className="py-3 px-4">{t('table.streak')}</th>
                <th className="py-3 px-4">Safety Status</th>
                <th className="py-3 px-5 text-right">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredPatients.map(patient => {
                const summary = patient.scorecardSummary;
                const isDeclining = summary?.cognitiveStatus === 'declining';
                const isImproving = summary?.cognitiveStatus === 'improving';
                const hasZeroSessions = summary?.totalSessions === 0;

                return (
                  <tr 
                    key={patient.patientId}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectPatient(patient.patientId)}
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-teal-300">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-100 group-hover:text-teal-300 transition-colors">
                            {patient.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {patient.patientId} • Age {patient.age} • Lang: <span className="uppercase">{patient.primaryLanguage}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        patient.diagnosisStage === 'early'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : patient.diagnosisStage === 'moderate'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {patient.diagnosisStage}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {hasZeroSessions ? (
                        <span className="text-slate-500 italic text-[11px]">No sessions yet</span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 font-semibold text-xs ${
                          isImproving ? 'text-emerald-400' : isDeclining ? 'text-rose-400 font-bold' : 'text-blue-400'
                        }`}>
                          {isImproving && <TrendingUp className="w-3.5 h-3.5" />}
                          {isDeclining && <TrendingDown className="w-3.5 h-3.5" />}
                          {!isImproving && !isDeclining && <Activity className="w-3.5 h-3.5" />}
                          {t(`status.${summary?.cognitiveStatus || 'stable'}`)}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {hasZeroSessions ? (
                        <span className="text-slate-500">—</span>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                (summary?.avgAccuracy || 0) >= 80 ? 'bg-teal-400' : (summary?.avgAccuracy || 0) >= 60 ? 'bg-amber-400' : 'bg-rose-500'
                              }`} 
                              style={{ width: `${summary?.avgAccuracy || 0}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-200">{summary?.avgAccuracy}%</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-300">
                        {summary?.streakDays || 0} days
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {patient.hasCriticalAlert ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                          Active Alert
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400">
                          Safe Zone
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPatient(patient.patientId);
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-teal-600 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1"
                      >
                        <span>{t('btn.view_scorecard')}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
