import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  Flame, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  PieChart as PieIcon,
  Shield,
  Layers,
  ArrowLeft,
  ChevronDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { api } from '../api/client';
import { PatientRecord, CognitiveTrendScorecard } from '../types/contract';
import { useLanguage } from '../context/LanguageContext';
import { EmptyState } from '../components/EmptyState';

interface PatientDetailViewProps {
  selectedPatientId: string;
  onBackToRoster: () => void;
  onSelectPatient: (id: string) => void;
  onOpenRecordEditor: () => void;
}

export const PatientDetailView: React.FC<PatientDetailViewProps> = ({
  selectedPatientId,
  onBackToRoster,
  onSelectPatient,
  onOpenRecordEditor
}) => {
  const { t } = useLanguage();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [scorecard, setScorecard] = useState<CognitiveTrendScorecard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getPatients().then(setPatients).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      setLoading(true);
      Promise.all([
        api.getPatientById(selectedPatientId),
        api.getPatientScorecard(selectedPatientId)
      ])
        .then(([pat, sc]) => {
          setPatient(pat);
          setScorecard(sc);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedPatientId]);

  if (loading || !scorecard || !patient) {
    return (
      <div className="flex items-center justify-center p-20 text-slate-400">
        <Activity className="w-8 h-8 animate-spin text-teal-400 mr-3" />
        <span className="text-sm font-semibold">Loading Therapy Scorecard & Cognitive Analytics...</span>
      </div>
    );
  }

  const isImproving = scorecard.cognitiveStatus === 'improving';
  const isDeclining = scorecard.cognitiveStatus === 'declining';
  const hasZeroSessions = scorecard.totalSessions === 0;

  const COLORS = ['#0d9488', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Top Patient Bar */}
      <div className="bg-slate-850 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToRoster}
            className="p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl transition-colors"
            title="Back to Roster"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-teal-500/20">
            {patient.name.charAt(0)}
          </div>

          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-black text-slate-100">{patient.name}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                patient.diagnosisStage === 'early'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : patient.diagnosisStage === 'moderate'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                {patient.diagnosisStage} Stage
              </span>
              <span className="text-xs text-slate-400 font-mono">
                v{patient.version}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Patient ID: <span className="font-mono text-slate-300">{patient.patientId}</span> • Age: {patient.age} • Primary Language: <span className="uppercase text-teal-400 font-semibold">{patient.primaryLanguage}</span> • Caregiver: {patient.assignedCaregiverName || 'Rita Gogoi'}
            </p>
          </div>
        </div>

        {/* Patient Switcher & Action */}
        <div className="flex items-center gap-3">
          <select
            value={selectedPatientId}
            onChange={e => onSelectPatient(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-teal-500"
          >
            {patients.map(p => (
              <option key={p.patientId} value={p.patientId}>
                {p.name} ({p.patientId}) {p.patientId === 'pat_005' ? '— (Empty State)' : ''}
              </option>
            ))}
          </select>

          <button
            onClick={onOpenRecordEditor}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
          >
            {t('btn.edit_record')}
          </button>
        </div>
      </div>

      {/* Cognitive Scorecard Header Metric Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cognitive Trajectory */}
        <div className={`border p-5 rounded-2xl shadow-md ${
          isImproving
            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
            : isDeclining
            ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
            : 'bg-blue-950/20 border-blue-500/40 text-blue-300'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cognitive Trajectory</span>
            {isImproving && <TrendingUp className="w-5 h-5 text-emerald-400" />}
            {isDeclining && <TrendingDown className="w-5 h-5 text-rose-400 animate-pulse" />}
            {!isImproving && !isDeclining && <Activity className="w-5 h-5 text-blue-400" />}
          </div>
          <div className="text-2xl font-black capitalize">
            {hasZeroSessions ? 'Baseline Pending' : t(`status.${scorecard.cognitiveStatus}`)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {hasZeroSessions 
              ? 'New patient awaiting first battery' 
              : isImproving 
              ? 'Positive trajectory on routine & memory' 
              : isDeclining 
              ? 'Latency slowdown flagged over 5 days' 
              : 'Consistent response parameters'}
          </p>
        </div>

        {/* Average Accuracy */}
        <div className="bg-slate-850 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Accuracy</span>
            <Activity className="w-5 h-5 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-teal-400">
            {hasZeroSessions ? '—' : `${scorecard.averageAccuracy}%`}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {hasZeroSessions ? '0 game sessions completed' : `Average across ${scorecard.totalSessions} sessions`}
          </p>
        </div>

        {/* Therapy Streak */}
        <div className="bg-slate-850 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Therapy Streak</span>
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            {scorecard.currentStreakDays} Days
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Consistent daily cognitive stimulation
          </p>
        </div>

        {/* Average Latency */}
        <div className="bg-slate-850 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mean Response Latency</span>
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300">
            {hasZeroSessions ? '—' : `${(scorecard.averageResponseTimeMs / 1000).toFixed(2)}s`}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {hasZeroSessions ? 'Pending session telemetry' : `${scorecard.averageResponseTimeMs} ms per cognitive decision`}
          </p>
        </div>
      </div>

      {/* Main Scorecard Charts OR Empty State */}
      {hasZeroSessions ? (
        <EmptyState
          type="sessions"
          title={`No Cognitive Game Sessions Recorded for ${patient.name}`}
          description={`Patient ${patient.name} (${patient.patientId}) was recently registered. As soon as the patient engages with the 4 cognitive games (Memory, Attention, Daily Routine, Regional Pattern Recall) on their tablet, this section will automatically populate with longitudinal accuracy trend lines, response latency curves, and error diagnostics.`}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Longitudinal Accuracy & Score Progression Chart */}
          <div className="bg-slate-850 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-400" />
                  <span>{t('chart.score_accuracy')}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Daily accuracy percentage vs composite score over time
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-teal-300 font-mono font-semibold">
                N={scorecard.totalSessions} Sessions
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scorecard.accuracyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="accuracy" name="Accuracy (%)" stroke="#14b8a6" strokeWidth={3} dot={{ r: 4, fill: '#14b8a6' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="score" name="Score" stroke="#818cf8" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3, fill: '#818cf8' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Average Response Latency Trend Chart */}
          <div className="bg-slate-850 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>{t('chart.latency')}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Response latency tracking in milliseconds (detects processing slowdown)
                </p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-purple-300 font-mono font-semibold">
                Reaction Velocity
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scorecard.accuracyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="responseTimeMs" name="Latency (ms)" stroke="#c084fc" strokeWidth={3} dot={{ r: 4, fill: '#c084fc' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance by Game Modality Bar Chart */}
          <div className="bg-slate-850 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>{t('chart.game_performance')}</span>
              </h3>
              <p className="text-xs text-slate-400">
                Cognitive domain breakdown (Memory, Attention, Routine sequencing, NER Pattern)
              </p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scorecard.gameTypePerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="gameType" stroke="#94a3b8" fontSize={11} textAnchor="middle" />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  />
                  <Bar dataKey="avgAccuracy" name="Avg Accuracy (%)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Error Diagnostics & Adherence */}
          <div className="bg-slate-850 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-amber-400" />
                <span>{t('chart.error_distribution')} & Adherence</span>
              </h3>
              <p className="text-xs text-slate-400">
                Omission vs Commission vs Timeout error taxonomy
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {scorecard.errorBreakdown.length > 0 ? (
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={scorecard.errorBreakdown}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                        fontSize={10}
                      >
                        {scorecard.errorBreakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="p-4 bg-slate-800/60 rounded-xl text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                  Zero critical error events recorded!
                </div>
              )}

              {/* Adherence Card */}
              <div className="p-4 bg-slate-800/80 border border-slate-700/60 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Reminder Adherence</span>
                  <span className="font-bold text-teal-400 font-mono">{scorecard.adherenceRatePercent}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-teal-500 h-full rounded-full" 
                    style={{ width: `${scorecard.adherenceRatePercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-tight pt-1">
                  Medications, hydration checks, and physical activities acknowledged on schedule.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
