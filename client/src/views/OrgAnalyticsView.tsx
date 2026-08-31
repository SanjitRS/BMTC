import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  Activity, 
  ShieldCheck, 
  FileDown, 
  CheckCircle2,
  PieChart as PieIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

interface OrgAnalyticsViewProps {
  onSelectPatient: (patientId: string) => void;
}

export const OrgAnalyticsView: React.FC<OrgAnalyticsViewProps> = ({ onSelectPatient }) => {
  const { t } = useLanguage();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    api.getOrgAnalytics()
      .then(setAnalytics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleExportReport = async () => {
    try {
      const data = await api.getComplianceReport();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Gurugale_Clinical_Report_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center p-20 text-slate-400">
        <span className="text-sm font-semibold">Generating Population Analytics & Risk Indicators...</span>
      </div>
    );
  }

  const trajectoryData = [
    { name: 'Improving', value: analytics.cognitiveDistribution.improving, color: '#10b981' },
    { name: 'Stable', value: analytics.cognitiveDistribution.stable, color: '#3b82f6' },
    { name: 'Declining (Flagged)', value: analytics.cognitiveDistribution.declining, color: '#ef4444' }
  ];

  const stageData = [
    { stage: 'Early Stage', count: analytics.diagnosisStageDistribution.early },
    { stage: 'Moderate Stage', count: analytics.diagnosisStageDistribution.moderate },
    { stage: 'Severe Stage', count: analytics.diagnosisStageDistribution.severe }
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-slate-850 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100">{t('nav.analytics')}</h2>
              <p className="text-xs text-slate-400">
                Population cognitive monitoring, engagement rates, and automated early warning flags.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleExportReport}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-teal-300 border border-teal-500/40 rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-2"
        >
          <FileDown className="w-4 h-4 text-teal-400" />
          <span>Export Clinical Compliance Report</span>
        </button>
      </div>

      {exportSuccess && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>HIPAA compliance report successfully downloaded.</span>
        </div>
      )}

      {/* Flagged At-Risk / Declining Patients */}
      <div className="bg-slate-850 border border-rose-500/40 rounded-2xl shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-rose-300">
            <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-100">
              Flagged At-Risk Patients (Requires Clinical Intervention)
            </h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold">
            {analytics.flaggedAtRiskPatients.length} Patients Flagged
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics.flaggedAtRiskPatients.map((p: any) => (
            <div
              key={p.patientId}
              onClick={() => onSelectPatient(p.patientId)}
              className="p-4 bg-slate-900/90 border border-slate-800 hover:border-rose-500/60 rounded-xl cursor-pointer transition-all shadow-md space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-100 group-hover:text-rose-300 transition-colors">
                  {p.name}
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-rose-300 border border-rose-500/30">
                  {p.diagnosisStage} Stage
                </span>
              </div>

              <p className="text-xs text-rose-300/90 font-medium">
                ⚠️ {p.reason}
              </p>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                <span>Avg Accuracy: <strong className="text-slate-200">{p.averageAccuracy}%</strong></span>
                <span>Adherence: <strong className="text-slate-200">{p.adherenceRatePercent}%</strong></span>
                <span className="text-teal-400 font-semibold group-hover:underline">View Scorecard →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Population Visual Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cognitive Trajectory Distribution Pie Chart */}
        <div className="bg-slate-850 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-teal-400" />
              <span>Cognitive Trajectory Breakdown</span>
            </h3>
            <p className="text-xs text-slate-400">
              Percentage of patient population categorized by longitudinal progression
            </p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={trajectoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({ name, value }) => `${name}: ${value}`}
                  fontSize={11}
                >
                  {trajectoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Diagnosis Stage Distribution Bar Chart */}
        <div className="bg-slate-850 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>Dementia Stage Distribution</span>
            </h3>
            <p className="text-xs text-slate-400">
              Active patient count across Early, Moderate, and Severe classifications
            </p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="stage" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                <Bar dataKey="count" name="Patient Count" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
