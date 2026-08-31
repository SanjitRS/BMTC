import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  Clock, 
  PhoneCall, 
  Filter, 
  RefreshCw, 
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client';
import { DeduplicatedAlert } from '../types/contract';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/EmptyState';

interface AlertCenterViewProps {
  onRefreshAlertsCount: () => void;
}

export const AlertCenterView: React.FC<AlertCenterViewProps> = ({ onRefreshAlertsCount }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<DeduplicatedAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [dispatchModalAlert, setDispatchModalAlert] = useState<DeduplicatedAlert | null>(null);
  const [caregiverName, setCaregiverName] = useState('Rita Gogoi');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [dispatching, setDispatching] = useState(false);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.getAlerts({
        status: statusFilter === 'all' ? undefined : statusFilter,
        severity: severityFilter === 'all' ? undefined : severityFilter
      });
      setAlerts(data);
      onRefreshAlertsCount();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [statusFilter, severityFilter]);

  const handleAcknowledge = async (id: string) => {
    try {
      await api.acknowledgeAlert(id);
      await loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await api.resolveAlert(id);
      await loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmDispatch = async () => {
    if (!dispatchModalAlert) return;
    setDispatching(true);
    try {
      await api.dispatchCaregiver(dispatchModalAlert.id, {
        caregiverName,
        contactNumber: '+91 94350 67890',
        notes: dispatchNotes
      });
      setDispatchModalAlert(null);
      await loadAlerts();
    } catch (err) {
      console.error(err);
    } finally {
      setDispatching(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
      case 'high':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'medium':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-slate-850 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
                <span>{t('nav.alerts')}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  Deduplicated Sliding Window (5m)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Aggregates rapid geofence boundary oscillations and missed medication alerts without notification spam.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-teal-500"
          >
            <option value="active">Active Alerts Only</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
            <option value="all">All Statuses</option>
          </select>

          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>

          <button
            onClick={loadAlerts}
            className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl transition-colors"
            title="Refresh feed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alerts Feed */}
      {alerts.length === 0 ? (
        <EmptyState
          type="alerts"
          title="No Alerts Matching Current Filter"
          description="All dementia patients are currently within their designated safe zone perimeters and adhering to medication schedules."
        />
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-5 rounded-2xl border transition-all shadow-xl bg-slate-850 ${
                alert.severity === 'critical'
                  ? 'border-rose-500/50'
                  : alert.severity === 'high'
                  ? 'border-amber-500/40'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getSeverityBadge(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <h3 className="text-sm font-bold text-slate-100">{alert.title}</h3>
                  {alert.occurrencesCount > 1 && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold">
                      {alert.occurrencesCount} Aggregated Events
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Last Seen: {new Date(alert.lastTriggeredAt).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Body */}
              <div className="py-3 text-xs text-slate-300 space-y-2">
                <p className="leading-relaxed">{alert.summary}</p>
                <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80 text-teal-300 flex items-center gap-2">
                  <span className="font-semibold text-slate-400">Suggested Clinical Action:</span>
                  <span>{alert.suggestedAction}</span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="text-[11px] text-slate-500">
                  {alert.status === 'acknowledged' && alert.acknowledgedBy && (
                    <span className="text-teal-400">
                      ✓ Acknowledged by {alert.acknowledgedBy} at {new Date(alert.acknowledgedAt || '').toLocaleTimeString()}
                    </span>
                  )}
                  {alert.status === 'resolved' && (
                    <span className="text-emerald-400">
                      ✓ Resolved and closed in clinical record
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {alert.status === 'active' && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl font-semibold transition-all"
                    >
                      {t('btn.acknowledge')}
                    </button>
                  )}

                  {alert.status !== 'resolved' && (
                    <button
                      onClick={() => setDispatchModalAlert(alert)}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{t('btn.dispatch')}</span>
                    </button>
                  )}

                  {alert.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all"
                    >
                      {t('btn.resolve')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Caregiver Dispatch Modal */}
      {dispatchModalAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-teal-400">
              <PhoneCall className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-100">
                Dispatch Emergency Caregiver Response
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Initiate immediate on-site caregiver dispatch for <strong className="text-teal-300">{dispatchModalAlert.patientName}</strong> regarding <span className="text-slate-200">"{dispatchModalAlert.title}"</span>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Assigned Caregiver On-Duty
                </label>
                <input
                  type="text"
                  value={caregiverName}
                  onChange={e => setCaregiverName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Dispatch Instructions / Perimeter Focus
                </label>
                <textarea
                  rows={3}
                  value={dispatchNotes}
                  onChange={e => setDispatchNotes(e.target.value)}
                  placeholder="e.g. Check outer garden boundary or north-east gate first..."
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDispatchModalAlert(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-750"
              >
                {t('btn.cancel')}
              </button>
              <button
                onClick={handleConfirmDispatch}
                disabled={dispatching}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                {dispatching ? 'Broadcasting...' : 'Confirm Dispatch & Notify'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
