import React from 'react';
import { Activity, ShieldAlert, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface EmptyStateProps {
  type?: 'sessions' | 'alerts' | 'patients';
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'sessions',
  title,
  description,
  actionText,
  onAction
}) => {
  const { t } = useLanguage();

  const getIcon = () => {
    switch (type) {
      case 'sessions':
        return <Activity className="w-12 h-12 text-teal-400 animate-pulse" />;
      case 'alerts':
        return <ShieldAlert className="w-12 h-12 text-emerald-400" />;
      default:
        return <Sparkles className="w-12 h-12 text-blue-400" />;
    }
  };

  const defaultTitle = title || (type === 'sessions' ? t('empty.no_sessions_title') : t('empty.no_alerts_title'));
  const defaultDesc = description || (type === 'sessions' ? t('empty.no_sessions_desc') : t('empty.no_alerts_desc'));

  return (
    <div className="flex flex-col items-center justify-center p-10 bg-slate-800/40 border border-slate-700/60 rounded-2xl text-center backdrop-blur-sm">
      <div className="p-4 bg-slate-800 border border-slate-700 rounded-full shadow-inner mb-4">
        {getIcon()}
      </div>
      <h3 className="text-lg font-bold text-slate-100 mb-2">{defaultTitle}</h3>
      <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
        {defaultDesc}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg shadow-md transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
