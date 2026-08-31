import React, { useState } from 'react';
import { X, Send, Database, CheckCircle2, ShieldAlert, BrainCircuit, Activity, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { praveenCognitiveEngine } from '@shared/praveenSeam';
import { sanjitSyncEngine } from '@shared/sanjitSeam';

interface IngestionSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const IngestionSimulatorModal: React.FC<IngestionSimulatorModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [patientId, setPatientId] = useState('pat_001');
  const [itemType, setItemType] = useState<'game_session' | 'geofence_breach' | 'missed_medication'>('game_session');
  const [batchCount, setBatchCount] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(false);
  const [responseLog, setResponseLog] = useState<any>(null);

  if (!isOpen) return null;

  const handleSimulateDirectBatch = async () => {
    setLoading(true);
    setResponseLog(null);
    try {
      const res = await api.generateSyncBatch(patientId, itemType, batchCount);
      setResponseLog(res);
      onSuccess();
    } catch (err: any) {
      setResponseLog({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTestSharedSeams = async () => {
    setLoading(true);
    setResponseLog(null);
    try {
      // 1. Praveen generates a session
      const session = await praveenCognitiveEngine.submitSession(
        patientId,
        'pattern',
        92,
        95,
        2800,
        [],
        3,
        'very_happy'
      );

      // 2. Sanjit flushes queue to Central Ingestion Pipeline
      const flushResult = await sanjitSyncEngine.flushQueue();

      setResponseLog({
        message: 'Successfully tested Praveen -> Sanjit -> Nischal Central Pipeline integration seam!',
        generatedSession: session,
        sanjitFlushResult: flushResult,
        sanjitQueueStatus: sanjitSyncEngine.getSyncStatus()
      });
      onSuccess();
    } catch (err: any) {
      setResponseLog({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Central Ingestion Pipeline & Sync Simulator
              </h2>
              <p className="text-xs text-slate-400">
                Test incoming <span className="text-indigo-400 font-mono">SyncQueueItem[]</span> batches from Praveen & Sanjit
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

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="bg-indigo-950/40 border border-indigo-500/30 p-4 rounded-xl text-xs text-indigo-200 leading-relaxed">
            <strong>Integration Seam Validation:</strong> Simulates client devices operating in offline-first mode writing to Sanjit's <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300">SyncQueueItem</code> and flushing to Nischal's ingestion endpoint <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300">POST /api/sync/batch</code>.
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Patient
              </label>
              <select
                value={patientId}
                onChange={e => setPatientId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="pat_001">Pranab Saikia (pat_001)</option>
                <option value="pat_002">Nirmala Devi Ningombam (pat_002)</option>
                <option value="pat_003">Harish Chandra Bose (pat_003)</option>
                <option value="pat_005">Bhabani Baruah - Empty State Test (pat_005)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Payload Entity Type
              </label>
              <select
                value={itemType}
                onChange={e => setItemType(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="game_session">GameSession (Cognitive Therapy)</option>
                <option value="geofence_breach">GeofenceEvent (Boundary Breach)</option>
                <option value="missed_medication">ReminderAck (Missed Medication)</option>
              </select>
            </div>
          </div>

          {itemType === 'game_session' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Batch Count (Number of Sessions)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={batchCount}
                onChange={e => setBatchCount(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleSimulateDirectBatch}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Dispatch Simulated Batch to Pipeline
            </button>

            <button
              onClick={handleTestSharedSeams}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              <BrainCircuit className="w-4 h-4" />
              Test Seams (Praveen ➔ Sanjit ➔ Nischal)
            </button>
          </div>

          {/* Response log */}
          {responseLog && (
            <div className="border border-slate-800 rounded-xl overflow-hidden mt-4">
              <div className="bg-slate-850 px-4 py-2 text-xs font-semibold text-slate-300 border-b border-slate-800 flex items-center justify-between">
                <span>Ingestion Ingestion Response Output</span>
                <span className="text-[10px] text-emerald-400 font-mono">Status: 200 OK</span>
              </div>
              <pre className="p-4 text-xs font-mono text-emerald-300 bg-slate-950 overflow-x-auto max-h-48 rounded-b-xl">
                {JSON.stringify(responseLog, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
