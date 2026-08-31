import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, Activity, CheckCircle, Clock, Zap, AlertCircle } from "lucide-react";
import { GameSession } from "../../shared/contract";

interface TherapyScorecardProps {
  sessions: GameSession[];
  patientName: string;
}

export const TherapyScorecard: React.FC<TherapyScorecardProps> = ({ sessions, patientName }) => {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-slate-600 mx-auto" />
        <h4 className="text-base font-bold text-white">No Cognitive Sessions Recorded Yet</h4>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {patientName} has not completed any cognitive therapy sessions yet. Switch to Section 1 (Praveen) to complete a therapy exercise and stream real-time telemetry.
        </p>
      </div>
    );
  }

  // Format session data for Recharts
  const chartData = sessions.map((s, idx) => ({
    session: `#${idx + 1}`,
    score: s.score,
    accuracy: s.accuracy,
    latency: s.avgResponseTimeMs,
    gameType: s.gameType,
    date: new Date(s.endedAt).toLocaleDateString(),
  }));

  const avgAccuracy = Math.round(
    sessions.reduce((acc, s) => acc + s.accuracy, 0) / sessions.length
  );
  const avgLatency = Math.round(
    sessions.reduce((acc, s) => acc + s.avgResponseTimeMs, 0) / sessions.length
  );

  const cognitiveTrend =
    avgAccuracy >= 80 ? "Improving & Stable" : avgAccuracy >= 60 ? "Moderate Fluctuation" : "Declining - Attention Required";

  return (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block font-semibold">Total Completed Exercises</span>
          <span className="text-2xl font-bold font-mono text-white">{sessions.length}</span>
          <span className="text-[11px] text-emerald-400 block mt-1">Active daily therapy adherence</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block font-semibold">Average Accuracy</span>
          <span className="text-2xl font-bold font-mono text-emerald-400">{avgAccuracy}%</span>
          <span className="text-[11px] text-slate-400 block mt-1">Across memory & attention</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block font-semibold">Average Response Latency</span>
          <span className="text-2xl font-bold font-mono text-purple-400">{avgLatency}ms</span>
          <span className="text-[11px] text-slate-400 block mt-1">Cognitive processing speed</span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 block font-semibold">Cognitive Clinical Trajectory</span>
          <span
            className={`text-sm font-bold block mt-1 ${
              avgAccuracy >= 80 ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {cognitiveTrend}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Assessed by adaptive matrix</span>
        </div>
      </div>

      {/* Accuracy & Score Trend Graph */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Accuracy (%) & Score Trajectory Trend
          </h4>
          <span className="text-xs text-slate-400 font-mono">Recharts Telemetry Feed</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="session" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
              />
              <Area
                type="monotone"
                dataKey="accuracy"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#accGrad)"
                name="Accuracy (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Response Time Latency Graph */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-400" />
          Average Response Latency (Milliseconds)
        </h4>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="session" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
              />
              <Bar dataKey="latency" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Latency (ms)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
