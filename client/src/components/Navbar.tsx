import React, { useState, useEffect } from "react";
import {
  Radio,
  Brain,
  Building,
  Layers,
  Wifi,
  WifiOff,
  Globe,
  Database,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { Language, translations } from "../locales/i18n";
import { syncEngine } from "../modules/sanjit/syncEngine";
import { SyncStatus } from "../shared/contract";

interface NavbarProps {
  currentModule: "sanjit" | "praveen" | "nish" | "architecture";
  onModuleChange: (mod: "sanjit" | "praveen" | "nish" | "architecture") => void;
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentModule,
  onModuleChange,
  currentLang,
  onLanguageChange,
}) => {
  const t = translations[currentLang] || translations.en;
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncEngine.getSyncStatus());

  useEffect(() => {
    const unsub = syncEngine.subscribe((status) => {
      setSyncStatus(status);
    });
    return () => unsub();
  }, []);

  const languages: Array<{ code: Language; label: string; region: string }> = [
    { code: "en", label: "English", region: "Global" },
    { code: "hi", label: "हिंदी", region: "National" },
    { code: "as", label: "অসমীয়া", region: "Assam" },
    { code: "mn", label: "মৈতৈলোন্", region: "Manipur" },
    { code: "bn", label: "বাংলা", region: "Bengal/Tripura" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Platform Tag */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-xl font-black text-white tracking-tighter">G</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-white text-base tracking-tight">{t.appName}</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/40">
                  v2.0 Modular
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:block truncate max-w-[280px]">
                Dementia Care Ecosystem
              </span>
            </div>
          </div>

          {/* Module Switcher Tabs */}
          <nav className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
            {/* Sanjit Tab */}
            <button
              onClick={() => onModuleChange("sanjit")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentModule === "sanjit"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Sanjit: Geofence & Sync</span>
            </button>

            {/* Praveen Tab */}
            <button
              onClick={() => onModuleChange("praveen")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentModule === "praveen"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Praveen: Cognitive</span>
            </button>

            {/* Nischal Tab */}
            <button
              onClick={() => onModuleChange("nish")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentModule === "nish"
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Nischal: Admin</span>
            </button>

            {/* Architecture Overview */}
            <button
              onClick={() => onModuleChange("architecture")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentModule === "architecture"
                  ? "bg-slate-700 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Architecture</span>
            </button>
          </nav>

          {/* Right Controls: Sync Queue Status, Network State, Language */}
          <div className="flex items-center space-x-3">
            {/* Live Sync Status Indicator */}
            <button
              onClick={() => onModuleChange("sanjit")}
              className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs"
              title="Click to view Sanjit's Sync Queue Inspector"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span
                className={`font-mono font-bold ${
                  syncStatus.totalPending > 0 ? "text-amber-400 animate-pulse" : "text-emerald-400"
                }`}
              >
                {syncStatus.totalPending > 0 ? `${syncStatus.totalPending} Queued` : "All Synced"}
              </span>
            </button>

            {/* Simulated Online/Offline Toggle */}
            <button
              onClick={() => syncEngine.toggleOnlineMode()}
              className={`p-2 rounded-xl border text-xs transition-colors ${
                syncStatus.isOnline
                  ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/40"
                  : "bg-rose-950/60 border-rose-500/40 text-rose-400 hover:bg-rose-900/40"
              }`}
              title={syncStatus.isOnline ? "Network is Online (Click to simulate offline)" : "Network is Offline (Click to restore)"}
            >
              {syncStatus.isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </button>

            {/* Language Selector */}
            <div className="relative flex items-center">
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <select
                value={currentLang}
                onChange={(e) => onLanguageChange(e.target.value as Language)}
                className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label} ({lang.region})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
