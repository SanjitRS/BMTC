import React from "react";
import {
  Shield,
  Brain,
  Building,
  Database,
  GitMerge,
  ArrowRight,
  Layers,
  Code,
  Server,
  Smartphone,
  Cpu,
  CheckCircle2
} from "lucide-react";

export const ArchitectureOverview: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Section 0 Data Contract Certified</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            Gurugale 3-Tier Modular Architecture
          </h2>
          <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
            The platform is cleanly partitioned into 3 equal, standalone yet seamlessly integrated modules adhering strictly to the Section 0 Shared Data Contract. Telemetry, cognitive exercises, and medical records stream through Sanjit's offline sync queue directly into Nischal's central ingestion pipeline.
          </p>
        </div>
      </div>

      {/* 3 Modular Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Section 1: Praveen */}
        <div className="bg-slate-900/80 border border-purple-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">SECTION 1</span>
              <h3 className="text-lg font-bold text-white">Praveen: Cognitive Lab</h3>
            </div>
          </div>

          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">•</span>
              <span><strong>4 Therapy Engines:</strong> Memory card matrix, Selective attention, Daily routine organizer, Cultural pattern synthesis.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">•</span>
              <span><strong>Adaptive Difficulty Matrix (Levels 1–5):</strong> Dynamically scales based on accuracy, reaction time latency, and omission vs commission errors.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">•</span>
              <span><strong>Regional Content:</strong> NER cultural themes (Assam, Nagaland, Manipur, Meghalaya) + Hindi + English.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 font-bold">•</span>
              <span><strong>Direct Write Seam:</strong> Emits <code className="text-purple-300">GameSession</code> & <code className="text-purple-300">ReminderAck</code> straight into Sanjit's <code className="text-blue-300">syncEngine.enqueue()</code>.</span>
            </li>
          </ul>
        </div>

        {/* Section 2: Sanjit (Featured) */}
        <div className="bg-slate-900/80 border border-blue-500/40 rounded-2xl p-6 space-y-4 shadow-xl relative ring-2 ring-blue-500/20">
          <div className="absolute top-3 right-3 px-2 py-0.5 bg-blue-500/20 border border-blue-500/40 rounded text-[10px] font-bold text-blue-300 uppercase">
            Core Seam
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">SECTION 2</span>
              <h3 className="text-lg font-bold text-white">Sanjit: Geofence & Sync</h3>
            </div>
          </div>

          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span><strong>Geofencing & Safe Zones Core:</strong> Haversine boundary crossing detection with configurable safe zones (Home 150m, Clinic 100m, Park 300m).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span><strong>GPS Telemetry & Battery Modes:</strong> Power-efficient polling (High 1s, Balanced 3s, Saver 8s) + live walking simulator.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span><strong>5-Min Sliding Window Debounce:</strong> Automatically collapses rapid boundary oscillations into 1 consolidated alert summary.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span><strong>Offline Sync Engine:</strong> Central write seam holding items in IndexedDB with exponential backoff retries & LWW conflict resolution.</span>
            </li>
          </ul>
        </div>

        {/* Section 3: Nischal */}
        <div className="bg-slate-900/80 border border-orange-500/30 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl text-orange-400">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">SECTION 3</span>
              <h3 className="text-lg font-bold text-white">Nischal: Admin Pipeline</h3>
            </div>
          </div>

          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-orange-400 font-bold">•</span>
              <span><strong>Central Ingestion Pipeline:</strong> Single REST ingestion truth receiving sync batches at <code className="text-orange-300">POST /api/sync/batch</code>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400 font-bold">•</span>
              <span><strong>Clinical Scorecards:</strong> Recharts trend telemetry for score, accuracy, streak, and latency.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400 font-bold">•</span>
              <span><strong>Versioned Audit Trail:</strong> Medical profile editor ($v1 \rightarrow v2 \rightarrow v3$) preserving complete prior state history and diffs.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400 font-bold">•</span>
              <span><strong>Security & GDPR:</strong> Revocable GPS tracking consent and permanent verified hard-delete path.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Contract Specification Card */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-white text-sm font-sans flex items-center gap-2">
            <Code className="w-4 h-4 text-emerald-400" />
            Section 0 Shared Data Contract (<span className="text-emerald-400">src/shared/contract.ts</span>)
          </h4>
          <span className="text-slate-500">TypeScript Type Definitions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
            <span className="text-blue-400 font-bold block">GameSession</span>
            <pre className="text-[11px] text-slate-400 overflow-x-auto">
{`{
  id: string;
  patientId: string;
  gameType: "memory"|"attention"|"routine"|"pattern";
  startedAt: string;
  endedAt: string;
  score: number;
  accuracy: number;
  avgResponseTimeMs: number;
  errorTypes: string[];
  difficultyLevel: number;
  moodAfter?: string;
  synced: boolean;
}`}
            </pre>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
            <span className="text-emerald-400 font-bold block">GeofenceEvent & SyncQueueItem</span>
            <pre className="text-[11px] text-slate-400 overflow-x-auto">
{`{
  id: string;
  patientId: string;
  zoneId: string;
  eventType: "enter" | "exit";
  lat: number;
  lng: number;
  timestamp: string;
  synced: boolean;
}

SyncQueueItem: {
  id, entityType, payload, createdAt, synced, retryCount
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
