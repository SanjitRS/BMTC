import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Stethoscope, HeartHandshake, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const LoginView: React.FC = () => {
  const { login, switchRole, isLoading } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('admin@gurugale.org');
  const [password, setPassword] = useState('admin123');

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl -top-40 -left-40 pointer-events-none"></div>
      <div className="absolute w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl -bottom-40 -right-40 pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-3xl mx-auto shadow-xl shadow-teal-500/20">
            🧠
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">
            Gurugale Admin
          </h1>
          <p className="text-xs text-slate-400">
            Elderly Dementia Care & Ingestion Pipeline (Nischal Module)
          </p>
        </div>

        {/* Quick 1-Click Role Switcher Demo */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Quick Role Demo Access (RBAC)
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => switchRole('admin')}
              className="p-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl text-center transition-all group"
            >
              <ShieldCheck className="w-5 h-5 text-purple-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold text-purple-300 block">Admin</span>
            </button>

            <button
              onClick={() => switchRole('healthcare_worker')}
              className="p-3 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 rounded-xl text-center transition-all group"
            >
              <Stethoscope className="w-5 h-5 text-teal-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold text-teal-300 block">Doctor</span>
            </button>

            <button
              onClick={() => switchRole('caregiver')}
              className="p-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-center transition-all group"
            >
              <HeartHandshake className="w-5 h-5 text-amber-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold text-amber-300 block">Caregiver</span>
            </button>
          </div>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">or custom email</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleCustomLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-teal-500"
              placeholder="admin@gurugale.org"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In to Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
