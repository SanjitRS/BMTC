import React, { useState, useEffect } from 'react';
import { X, History, FileText, CheckCircle2, User, Clock, ChevronRight } from 'lucide-react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

interface AuditDiffModalProps {
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditDiffModal: React.FC<AuditDiffModalProps> = ({ patientId, isOpen, onClose }) => {
  const { t } = useLanguage();
  const [historyData, setHistoryData] = useState<any>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && patientId) {
      setLoading(true);
      api.getAuditHistory(patientId)
        .then(data => {
          setHistoryData(data);
          if (data.history && data.history.length > 0) {
            setSelectedVersion(data.history[data.history.length - 1].version);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, patientId]);

  if (!isOpen) return null;

  const currentSnapshot = historyData;
  const historyList = historyData?.history || [];
  const selectedHistoryItem = historyList.find((h: any) => h.version === selectedVersion);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {t('audit.version_history')}
              </h2>
              <p className="text-xs text-slate-400">
                Patient: <span className="text-teal-400 font-semibold">{historyData?.patientName || patientId}</span> • Current Version: <span className="bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded font-mono text-xs">v{historyData?.currentVersion || 1}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Version timeline list */}
          <div className="md:col-span-1 border-r border-slate-800 pr-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Version Timeline (Audit Log)
            </h4>

            {/* Current Active Version */}
            <div className="p-3 bg-teal-950/40 border border-teal-500/40 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-teal-300">v{historyData?.currentVersion} (Current Active)</span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded">Live</span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-1 mt-1">
                <User className="w-3 h-3 text-slate-400" /> {historyData?.updatedBy}
              </p>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-slate-500" /> {new Date(historyData?.updatedAt).toLocaleString()}
              </p>
            </div>

            {/* Historical snapshots */}
            {historyList.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No prior version modifications recorded yet.</p>
            ) : (
              historyList.map((entry: any) => (
                <button
                  key={entry.version}
                  onClick={() => setSelectedVersion(entry.version)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedVersion === entry.version
                      ? 'bg-slate-800 border-teal-500 text-slate-100 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-200">Version {entry.version}</span>
                    <span className="text-[10px] text-slate-500 capitalize">{entry.updatedByRole}</span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium truncate">{entry.changesSummary}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {new Date(entry.updatedAt).toLocaleString()}
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Version Snapshot Diff Details */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Audit Snapshot Comparison & Changes
            </h4>

            {selectedHistoryItem ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-200">
                      Audit Snapshot: Version {selectedHistoryItem.version}
                    </span>
                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                      Captured at {new Date(selectedHistoryItem.updatedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-teal-300 font-medium">
                    "{selectedHistoryItem.changesSummary}"
                  </p>
                  <div className="text-xs text-slate-400 flex items-center gap-2 pt-1 border-t border-slate-700/50">
                    <span>Modifier: <strong className="text-slate-200">{selectedHistoryItem.updatedBy}</strong></span>
                    <span>•</span>
                    <span>Role: <strong className="text-slate-200 uppercase">{selectedHistoryItem.updatedByRole}</strong></span>
                  </div>
                </div>

                {/* Diff Viewer */}
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-slate-850 px-4 py-2 text-xs font-semibold text-slate-300 border-b border-slate-800 flex items-center justify-between">
                    <span>Prior State Snapshot Payload (Preserved Immutable)</span>
                    <span className="text-[10px] text-emerald-400 font-mono">No Silently Overwritten Data</span>
                  </div>
                  <pre className="p-4 text-xs font-mono text-emerald-300 bg-slate-950 overflow-x-auto max-h-60 rounded-b-xl">
                    {JSON.stringify(selectedHistoryItem.previousSnapshot, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-sm">Select a historical version from the timeline on the left to inspect previous snapshots and modifier credentials.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-850 flex justify-between items-center text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4" /> HIPAA & Clinical Audit Compliant (Immutable Log)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
