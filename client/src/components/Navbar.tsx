import React, { useState } from 'react';
import { 
  Shield, 
  Bell, 
  Globe, 
  UserCheck, 
  Sparkles, 
  Cpu, 
  ChevronDown,
  Activity,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types/contract';
import { SupportedLanguage } from '../locales/i18n';

interface NavbarProps {
  activeAlertsCount: number;
  onOpenSimulator: () => void;
  onNavigateAlerts: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeAlertsCount, 
  onOpenSimulator,
  onNavigateAlerts
}) => {
  const { user, role, switchRole } = useAuth();
  const { currentLanguage, setLanguage, languages, t } = useLanguage();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const getRoleBadgeColor = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'healthcare_worker':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      case 'caregiver':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const getRoleLabel = (r: UserRole) => {
    switch (r) {
      case 'admin': return t('role.admin');
      case 'healthcare_worker': return t('role.healthcare_worker');
      case 'caregiver': return t('role.caregiver');
      default: return r;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex items-center justify-between shadow-lg">
      {/* Brand & Module indicator */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
          <span className="text-xl">🧠</span>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-extrabold text-slate-100 tracking-tight">
              Gurugale
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-wide">
              Nischal Module
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Clinical Administration & Central Ingestion
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Sync Simulator Quick Launch */}
        <button
          onClick={onOpenSimulator}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-semibold transition-all shadow-sm"
          title="Simulate incoming SyncQueue batches from Praveen & Sanjit"
        >
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>{t('nav.simulator')}</span>
        </button>

        {/* Live Alerts Bell */}
        <button
          onClick={onNavigateAlerts}
          className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          title="View Active Deduplicated Alerts"
        >
          <Bell className="w-5 h-5" />
          {activeAlertsCount > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse shadow-md">
              {activeAlertsCount}
            </span>
          )}
        </button>

        {/* Multilingual Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">
              {languages.find(l => l.code === currentLanguage)?.flag} {languages.find(l => l.code === currentLanguage)?.nativeName}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-850 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 animate-fadeIn">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                Select Language (NER + Hindi + EN)
              </div>
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setShowLangMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-750 transition-colors ${
                    currentLanguage === lang.code ? 'text-teal-300 font-bold bg-teal-500/10' : 'text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{lang.nativeName}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RBAC Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all ${getRoleBadgeColor(role)}`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{getRoleLabel(role)}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-850 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-fadeIn">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                Switch Role (RBAC Demo)
              </div>
              <button
                onClick={() => { switchRole('admin'); setShowRoleMenu(false); }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-750 transition-colors ${
                  role === 'admin' ? 'text-purple-300 font-bold bg-purple-500/10' : 'text-slate-300'
                }`}
              >
                <div className="font-semibold">{t('role.admin')}</div>
                <div className="text-[10px] text-slate-500">Full system oversight & GDPR deletion</div>
              </button>
              <button
                onClick={() => { switchRole('healthcare_worker'); setShowRoleMenu(false); }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-750 transition-colors ${
                  role === 'healthcare_worker' ? 'text-teal-300 font-bold bg-teal-500/10' : 'text-slate-300'
                }`}
              >
                <div className="font-semibold">{t('role.healthcare_worker')}</div>
                <div className="text-[10px] text-slate-500">Edit versioned records & safe zones</div>
              </button>
              <button
                onClick={() => { switchRole('caregiver'); setShowRoleMenu(false); }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-750 transition-colors ${
                  role === 'caregiver' ? 'text-amber-300 font-bold bg-amber-500/10' : 'text-slate-300'
                }`}
              >
                <div className="font-semibold">{t('role.caregiver')}</div>
                <div className="text-[10px] text-slate-500">Patient scorecards, geofence & alerts</div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
