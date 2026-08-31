import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  MapPin, 
  FileSpreadsheet, 
  ShieldAlert, 
  BarChart3, 
  Lock,
  Cpu
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export type AdminTab = 
  | 'overview' 
  | 'roster' 
  | 'scorecard' 
  | 'geofence' 
  | 'records' 
  | 'alerts' 
  | 'analytics' 
  | 'security';

interface SidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  activeAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, activeAlertsCount }) => {
  const { t } = useLanguage();

  const navItems = [
    { id: 'overview' as AdminTab, label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'roster' as AdminTab, label: t('nav.patients'), icon: Users },
    { id: 'scorecard' as AdminTab, label: t('nav.scorecard'), icon: Activity },
    { id: 'geofence' as AdminTab, label: t('nav.geofence'), icon: MapPin },
    { id: 'records' as AdminTab, label: t('nav.records'), icon: FileSpreadsheet },
    { 
      id: 'alerts' as AdminTab, 
      label: t('nav.alerts'), 
      icon: ShieldAlert,
      badge: activeAlertsCount > 0 ? activeAlertsCount : null
    },
    { id: 'analytics' as AdminTab, label: t('nav.analytics'), icon: BarChart3 },
    { id: 'security' as AdminTab, label: t('nav.consent'), icon: Lock }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between py-5 px-3 min-h-[calc(100vh-65px)]">
      <div className="space-y-1">
        <div className="px-3 pb-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Admin Portal Modules
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                  isActive ? 'bg-white text-teal-700' : 'bg-rose-500 text-white'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Integration Seam Status Indicator */}
      <div className="p-3.5 bg-slate-850 border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Pipeline Status</span>
          <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Online
          </span>
        </div>
        <div className="text-[11px] text-slate-500 leading-tight">
          Ingesting Section 0 packets (<code className="text-slate-400 font-mono">SyncQueueItem</code>) from Praveen & Sanjit
        </div>
      </div>
    </aside>
  );
};
