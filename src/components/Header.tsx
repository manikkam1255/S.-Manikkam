import React from 'react';
import {
  RotateCcw,
  Shield,
  Mic,
  Sparkles,
  Flame,
} from 'lucide-react';
import { SessionState } from '../types';

interface HeaderProps {
  activeTab: 'home' | 'complaint' | 'track' | 'admin';
  setActiveTab: (tab: 'home' | 'complaint' | 'track' | 'admin') => void;
  session: SessionState;
  onLogout: () => void;
  onResetData: () => void;
  complaintCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  session,
  onResetData,
  complaintCount,
}) => {
  return (
    <header className="bg-[#140c0c]/95 backdrop-blur-md text-[#fbf3f2] shadow-xl sticky top-0 z-40 border-b border-[#362121]">
      {/* Top Red Mist Ember Accent Bar */}
      <div className="bg-gradient-to-r from-[#3b1212] via-[#c83a2a] to-[#3b1212] text-[#fce8e6] text-[11px] py-1 px-4 sm:px-8 border-b border-[#522222]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#fca58f] animate-ping" />
            <span className="font-semibold text-white tracking-wide">
              Online Grievance Redressal System
            </span>
            <span className="hidden md:inline text-[#f5cac3] font-light">
              • 🎙️ Voice Dictation & Red Mist Intelligent Triage
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[#f5cac3] hidden sm:inline text-[11px]">
              Active Tickets: <strong className="text-white font-mono">{complaintCount}</strong>
            </span>
            <button
              onClick={onResetData}
              title="Reset complaints to initial sample dataset"
              className="hover:text-white text-[#f5cac3] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Logo / Title */}
        <div
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c83a2a] to-[#501717] flex items-center justify-center text-white shadow-[0_0_15px_rgba(200,58,42,0.4)] group-hover:scale-105 transition-transform">
            <Flame className="w-5 h-5 text-[#fca58f]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#fbf3f2] leading-tight">
                Complaint System
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#331414] text-[#fca58f] border border-[#5a2525]">
                Red Mist
              </span>
            </div>
            <p className="text-[11px] text-[#c2a8a5] hidden sm:block">
              Online Grievance Management • Voice & Text Redressal
            </p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            id="nav-home"
            onClick={() => setActiveTab('home')}
            className={`border px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'home'
                ? 'bg-[#c83a2a] text-white border-[#db4837] shadow-[0_0_15px_rgba(200,58,42,0.4)]'
                : 'bg-[#1b1212] hover:bg-[#261818] text-[#eed9d6] border-[#382222]'
            }`}
          >
            Home
          </button>

          <button
            id="nav-complaint"
            onClick={() => setActiveTab('complaint')}
            className={`border px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'complaint'
                ? 'bg-[#c83a2a] text-white border-[#db4837] shadow-[0_0_15px_rgba(200,58,42,0.4)]'
                : 'bg-[#1b1212] hover:bg-[#261818] text-[#eed9d6] border-[#382222]'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-[#fca58f]" />
            <span>New Complaint</span>
          </button>

          <button
            id="nav-track"
            onClick={() => setActiveTab('track')}
            className={`border px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'track'
                ? 'bg-[#c83a2a] text-white border-[#db4837] shadow-[0_0_15px_rgba(200,58,42,0.4)]'
                : 'bg-[#1b1212] hover:bg-[#261818] text-[#eed9d6] border-[#382222]'
            }`}
          >
            Track
          </button>

          <button
            id="nav-admin"
            onClick={() => setActiveTab('admin')}
            className={`border px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-[#c83a2a] text-white border-[#db4837] shadow-[0_0_15px_rgba(200,58,42,0.4)]'
                : 'bg-[#1b1212] hover:bg-[#261818] text-[#c2a8a5] border-[#382222]'
            }`}
            title="Admin & Officer Triage Portal"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
            {session.admin && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
