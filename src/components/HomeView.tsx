import React from 'react';
import {
  FileText,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  Shield,
  ArrowRight,
  Zap,
  Building,
  UploadCloud,
  ChevronRight,
  Mic,
  Volume2,
  VolumeX,
  Flame,
} from 'lucide-react';
import { Complaint } from '../types';
import { getStatusInfo } from '../utils/formatters';

interface HomeViewProps {
  onNavigate: (tab: 'home' | 'complaint' | 'track' | 'admin') => void;
  onTrackComplaint: (id: string) => void;
  recentComplaints: Complaint[];
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onTrackComplaint,
  recentComplaints,
}) => {
  const [quickTrackId, setQuickTrackId] = React.useState('');
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTrackId.trim()) {
      onTrackComplaint(quickTrackId.trim());
    } else if (recentComplaints.length > 0) {
      onTrackComplaint(recentComplaints[0].id);
    }
  };

  const handleListenOverview = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const text =
        'Welcome to the Online Complaint Management System. You can submit your complaint easily by speaking into your microphone or typing. Our smart system will detect your complaint category and route it to the right department. You can also track your complaint in four easy steps.';
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6 space-y-8">
      {/* Primary Hero Card in Red Mist theme */}
      <div className="bg-gradient-to-b from-[#241313] via-[#1a1010] to-[#140c0c] rounded-2xl p-8 sm:p-12 shadow-2xl border border-[#3d2424] text-center relative overflow-hidden">
        {/* Glowing atmospheric red mist background effect */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-gradient-to-b from-[#c83a2a]/20 via-[#631c1c]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#0e0808]/80 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-5">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#311515] border border-[#5a2525] text-[#fca58f] text-xs font-semibold shadow-xs">
              <Flame className="w-3.5 h-3.5 text-[#c83a2a]" />
              <span>Red Mist System • Voice Complaint Enabled</span>
            </div>

            <button
              type="button"
              onClick={handleListenOverview}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                isSpeaking
                  ? 'bg-[#471919] text-[#ffd6cc] border-[#8a3333] animate-pulse'
                  : 'bg-[#211515] hover:bg-[#2d1b1b] text-[#eed9d6] border-[#3d2424]'
              }`}
              title="Listen to audio overview"
            >
              {isSpeaking ? (
                <VolumeX className="w-3.5 h-3.5 text-[#fca58f]" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-[#fca58f]" />
              )}
              <span>{isSpeaking ? 'Stop Audio' : '🔊 Listen to Overview'}</span>
            </button>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#fbf3f2] leading-tight">
            Online Complaint Management System
          </h1>

          <p className="text-sm sm:text-base text-[#c2a8a5] leading-relaxed max-w-xl mx-auto">
            Submit your grievances effortlessly using voice or text. Our intelligent system analyzes your complaint, detects the department automatically, and provides transparent milestone tracking.
          </p>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="hero-submit-complaint-btn"
              onClick={() => onNavigate('complaint')}
              className="w-full sm:w-auto bg-[#c83a2a] hover:bg-[#db4837] text-white font-bold py-3.5 px-8 rounded-xl text-sm transition-all shadow-[0_0_25px_rgba(200,58,42,0.4)] hover:shadow-[0_0_35px_rgba(200,58,42,0.6)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Mic className="w-4 h-4 text-[#ffd6cc]" />
              <span>Submit Complaint (Voice or Text)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-track-btn"
              onClick={() => onNavigate('track')}
              className="w-full sm:w-auto bg-[#241717] hover:bg-[#301e1e] text-[#fbf3f2] font-semibold py-3.5 px-6 rounded-xl text-sm transition-all border border-[#482929] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>📍 Track Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* Voice Feature Callout Card in Red Mist palette */}
      <div className="bg-gradient-to-r from-[#211414] via-[#1a1010] to-[#211414] rounded-2xl p-5 sm:p-6 border border-[#402626] shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c83a2a] to-[#601919] text-white flex items-center justify-center shadow-[0_0_20px_rgba(200,58,42,0.4)] shrink-0">
            <Mic className="w-6 h-6 text-[#ffd6cc]" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-[#fbf3f2]">
              Simple Voice-to-Text Support for Everyone
            </h2>
            <p className="text-xs text-[#c2a8a5]">
              Difficulty typing or reading? Click the microphone button and speak your issue. The system converts your speech to text and can read it back aloud.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('complaint')}
          className="bg-[#2d1818] hover:bg-[#3d2020] text-[#fca58f] border border-[#5c2828] font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <span>Try Voice Mode</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Track Bar Card */}
      <div className="bg-[#171010] rounded-2xl p-6 shadow-xl border border-[#382222]">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#c2a8a5] mb-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-[#c83a2a]" />
          <span>Quick Status Lookup</span>
        </h2>

        <form onSubmit={handleQuickTrack} className="flex flex-col sm:flex-row gap-2.5">
          <input
            id="home-quick-track-input"
            type="text"
            value={quickTrackId}
            onChange={(e) => setQuickTrackId(e.target.value)}
            placeholder="Enter Complaint ID (e.g. #CMP4829, #CMP3210)"
            className="flex-1 px-4 py-3 bg-[#100a0a] border border-[#382222] rounded-xl text-sm text-[#fbf3f2] placeholder-[#7d6562] focus:outline-hidden focus:border-[#c83a2a] focus:ring-1 focus:ring-[#c83a2a] transition-all font-mono"
          />
          <button
            id="home-quick-track-submit"
            type="submit"
            className="bg-[#c83a2a] hover:bg-[#db4837] text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(200,58,42,0.3)] shrink-0 cursor-pointer"
          >
            Track Status
          </button>
        </form>

        {/* Quick Sample IDs */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#c2a8a5]">
          <span className="font-semibold text-[#eed9d6]">Sample Tickets:</span>
          {recentComplaints.slice(0, 4).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onTrackComplaint(c.id)}
              className="px-2.5 py-1 rounded-lg bg-[#251717] hover:bg-[#331e1e] text-[#fca58f] font-mono font-bold border border-[#482828] transition-colors cursor-pointer"
            >
              {c.id}
            </button>
          ))}
        </div>
      </div>

      {/* System Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#171010] p-6 rounded-2xl border border-[#382222] shadow-md space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#2b1414] text-[#c83a2a] flex items-center justify-center font-bold border border-[#482424]">
            <Mic className="w-5 h-5 text-[#fca58f]" />
          </div>
          <h3 className="font-bold text-[#fbf3f2] text-sm">Voice Dictation & Speech</h3>
          <p className="text-xs text-[#c2a8a5] leading-relaxed">
            Record grievances verbally with Web Speech Recognition and listen to audio feedback anytime.
          </p>
        </div>

        <div className="bg-[#171010] p-6 rounded-2xl border border-[#382222] shadow-md space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#2b1414] text-[#c83a2a] flex items-center justify-center font-bold border border-[#482424]">
            <Zap className="w-5 h-5 text-[#fca58f]" />
          </div>
          <h3 className="font-bold text-[#fbf3f2] text-sm">AI Category Detection</h3>
          <p className="text-xs text-[#c2a8a5] leading-relaxed">
            Automatically maps grievance keywords (fans, water, network, hostel, exams) to proper departments.
          </p>
        </div>

        <div className="bg-[#171010] p-6 rounded-2xl border border-[#382222] shadow-md space-y-2">
          <div className="w-10 h-10 rounded-xl bg-[#2b1414] text-[#c83a2a] flex items-center justify-center font-bold border border-[#482424]">
            <CheckCircle2 className="w-5 h-5 text-[#fca58f]" />
          </div>
          <h3 className="font-bold text-[#fbf3f2] text-sm">4-Step Live Stepper</h3>
          <p className="text-xs text-[#c2a8a5] leading-relaxed">
            Track transparent progress through Submitted → Under Review → In Progress → Resolved milestones.
          </p>
        </div>
      </div>

      {/* Recent Grievances Strip */}
      <div className="bg-[#171010] rounded-2xl p-6 border border-[#382222] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#fbf3f2]">Recent Campus Grievances</h2>
            <p className="text-xs text-[#c2a8a5]">Live feed of public issues registered in the portal</p>
          </div>
          <button
            onClick={() => onNavigate('track')}
            className="text-xs font-bold text-[#fca58f] hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-[#261818]">
          {recentComplaints.slice(0, 3).map((c) => {
            const statusInfo = getStatusInfo(c.status);
            return (
              <div
                key={c.id}
                onClick={() => onTrackComplaint(c.id)}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#201414] -mx-2 px-2 rounded-xl cursor-pointer transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#fca58f] bg-[#2d1515] px-2 py-0.5 rounded border border-[#4d2525]">
                      {c.id}
                    </span>
                    <span className="text-xs font-semibold text-[#fbf3f2] line-clamp-1">
                      {c.title}
                    </span>
                  </div>
                  <p className="text-xs text-[#c2a8a5] flex items-center gap-2">
                    <span>{c.category}</span>
                    <span>•</span>
                    <span>{c.department}</span>
                    <span>•</span>
                    <span className="font-mono text-[11px] text-[#eed9d6]">{c.complainant.name}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border flex items-center gap-1.5 ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
                    {statusInfo.label}
                  </span>
                  <span className="text-[#fca58f] text-xs font-semibold">Track →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
