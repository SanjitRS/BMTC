import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Key, 
  FileCheck, 
  Users,
  RefreshCw
} from 'lucide-react';
import { api } from '../api/client';
import { PatientRecord } from '../types/contract';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface ConsentSecurityViewProps {
  onRefreshData: () => void;
}

export const ConsentSecurityView: React.FC<ConsentSecurityViewProps> = ({ onRefreshData }) => {
  const { t } = useLanguage();
  const { role, user } = useAuth();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Deletion state
  const [purgeTargetId, setPurgeTargetId] = useState<string | null>(null);
  const [confirmationInput, setConfirmationInput] = useState<string>('');
  const [isPurging, setIsPurging] = useState<boolean>(false);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const list = await api.getPatients();
      setPatients(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleToggleConsent = async (patientId: string, currentConsent: boolean) => {
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await api.setLocationConsent(patientId, !currentConsent);
      setActionSuccess(res.message);
      await loadPatients();
      onRefreshData();
    } catch (err: any) {
      setActionError(err.response?.data?.error || err.message || 'Failed to update consent');
    }
  };

  const handleExecuteGdprPurge = async () => {
    if (!purgeTargetId || confirmationInput !== 'PERMANENT_DELETE') return;
    setIsPurging(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await api.purgePatientGdpr(purgeTargetId, 'PERMANENT_DELETE');
      setActionSuccess(`GDPR Erasure Complete: ${res.message} (${res.purgedEntitiesCount} total entities purged).`);
      setPurgeTargetId(null);
      setConfirmationInput('');
      await loadPatients();
      onRefreshData();
    } catch (err: any) {
      setActionError(err.response?.data?.error || err.message || 'Failed to execute GDPR hard delete');
    } finally {
      setIsPurging(false);
    }
  };

  const isAdmin = role === 'admin';

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-slate-850 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100">{t('nav.consent')}</h2>
              <p className="text-xs text-slate-400">
                HIPAA & GDPR Compliance, Revocable GPS Consent, and Verified Data Erasure.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-mono font-bold">
            RBAC Active: {user?.role.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Action Messages */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl flex items-center gap-3 text-emerald-200 text-xs shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="font-medium">{actionSuccess}</div>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-950/40 border border-rose-500/50 rounded-2xl flex items-center gap-3 text-rose-200 text-xs shadow-lg animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="font-medium">{actionError}</div>
        </div>
      )}

      {/* Section 1: Revocable GPS Consent Management */}
      <div className="bg-slate-850 border border-slate-800 rounded-2xl shadow-xl p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Eye className="w-4 h-4 text-teal-400" />
            <span>Explicit Revocable Location Tracking Consent</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Patients and legal guardians retain the absolute right to revoke GPS geofencing telemetry at any time. Revocation immediately ceases coordinate ingestion.
          </p>
        </div>

        <div className="space-y-3">
          {patients.map(p => {
            const hasConsent = p.locationTrackingConsent !== false;
            return (
              <div
                key={p.patientId}
                className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center space-x-2 font-bold text-slate-200 text-sm">
                    <span>{p.name}</span>
                    <span className="text-xs text-slate-500 font-mono">({p.patientId})</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Consent Status:{' '}
                    {hasConsent ? (
                      <span className="text-emerald-400 font-semibold">Active (Tracking Permitted)</span>
                    ) : (
                      <span className="text-rose-400 font-semibold">
                        Explicitly Revoked ({p.consentRevokedAt ? new Date(p.consentRevokedAt).toLocaleDateString() : 'Active'})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleConsent(p.patientId, hasConsent)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      hasConsent
                        ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40'
                        : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {hasConsent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{hasConsent ? t('btn.revoke_consent') : t('btn.grant_consent')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: GDPR Right to be Forgotten (Permanent Hard Data Erasure) */}
      <div className="bg-slate-850 border border-rose-500/30 rounded-2xl shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>GDPR Right-to-be-Forgotten (Verified Permanent Deletion)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Permanently purges patient profile, all cognitive session records, geofence event logs, reminder history, and sync items from database storage (Not a soft-delete flag).
            </p>
          </div>
          <span className="text-xs bg-rose-500/20 text-rose-300 font-mono px-2 py-0.5 rounded uppercase font-bold">
            Admin Privilege Only
          </span>
        </div>

        {!isAdmin ? (
          <div className="p-4 bg-slate-900 rounded-xl text-xs text-slate-400 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Only Clinical Administrators can trigger GDPR hard deletions. Switch role in the top navbar to test this functionality.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {patients.map(p => (
              <div
                key={p.patientId}
                className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-200 text-xs">{p.name} ({p.patientId})</div>
                  <div className="text-[11px] text-slate-400">Diagnosis: {p.diagnosisStage} • Version v{p.version}</div>
                </div>

                <button
                  onClick={() => {
                    setPurgeTargetId(p.patientId);
                    setConfirmationInput('');
                  }}
                  className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('btn.gdpr_delete')}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Permanent Deletion Safety Lock Modal */}
      {purgeTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
              <h3 className="text-base font-bold text-slate-100">
                Confirm Permanent Hard Deletion
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are about to permanently erase all records for patient <strong className="text-rose-400 font-mono">{purgeTargetId}</strong>. This action is <strong>IRREVERSIBLE</strong> and wipes all cognitive scores, geofence coordinates, and clinical logs in accordance with GDPR Right-to-be-Forgotten.
            </p>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Type <strong className="text-rose-400 font-mono">PERMANENT_DELETE</strong> to confirm safety lock:
              </label>
              <input
                type="text"
                value={confirmationInput}
                onChange={e => setConfirmationInput(e.target.value)}
                placeholder="PERMANENT_DELETE"
                className="w-full bg-slate-800 border border-slate-700 text-rose-300 font-mono rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setPurgeTargetId(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-750"
              >
                {t('btn.cancel')}
              </button>
              <button
                onClick={handleExecuteGdprPurge}
                disabled={confirmationInput !== 'PERMANENT_DELETE' || isPurging}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-40"
              >
                {isPurging ? 'Purging...' : 'Execute Irreversible Erasure'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
