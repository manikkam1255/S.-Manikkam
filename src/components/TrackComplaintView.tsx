import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  Send,
  User,
  Mail,
  Building2,
  Calendar,
  AlertCircle,
  Check,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FileCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Complaint, ComplaintStatus } from '../types';
import { findComplaintById, updateComplaintStatus, addCitizenComment } from '../utils/storage';
import { formatDate } from '../utils/formatters';

interface TrackComplaintViewProps {
  complaints: Complaint[];
  selectedComplaintId?: string | null;
  onRefreshComplaints: () => void;
}

interface StepDefinition {
  status: ComplaintStatus;
  stepNum: number;
  label: string;
  description: string;
}

const STEPS: StepDefinition[] = [
  {
    status: 'submitted',
    stepNum: 1,
    label: 'Submitted',
    description: 'Complaint received',
  },
  {
    status: 'under_review',
    stepNum: 2,
    label: 'Under Review',
    description: 'Admin checking',
  },
  {
    status: 'in_progress',
    stepNum: 3,
    label: 'In Progress',
    description: 'Action started',
  },
  {
    status: 'resolved',
    stepNum: 4,
    label: 'Resolved',
    description: 'Problem solved',
  },
];

function getStepIndex(status: ComplaintStatus): number {
  switch (status) {
    case 'submitted':
      return 0;
    case 'under_review':
      return 1;
    case 'in_progress':
      return 2;
    case 'resolved':
      return 3;
    default:
      return 0;
  }
}

export const TrackComplaintView: React.FC<TrackComplaintViewProps> = ({
  complaints,
  selectedComplaintId,
  onRefreshComplaints,
}) => {
  const [trackIdInput, setTrackIdInput] = useState(selectedComplaintId || '');
  const [trackedComplaint, setTrackedComplaint] = useState<Complaint | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [notFoundError, setNotFoundError] = useState(false);

  // Audio speech status readout
  const [isSpeakingStatus, setIsSpeakingStatus] = useState(false);

  // Follow-up comment state
  const [inquiryText, setInquiryText] = useState('');
  const [isSendingInquiry, setIsSendingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  // Status simulation updating
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (selectedComplaintId) {
      setTrackIdInput(selectedComplaintId);
      const found = findComplaintById(selectedComplaintId, complaints);
      if (found) {
        setTrackedComplaint(found);
        setSearchAttempted(true);
        setNotFoundError(false);
      }
    } else if (!trackedComplaint && complaints.length > 0) {
      setTrackedComplaint(complaints[0]);
      setTrackIdInput(complaints[0].id);
      setSearchAttempted(true);
    }
  }, [selectedComplaintId, complaints]);

  const handleTrackSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setNotFoundError(false);
    setSearchAttempted(true);

    const query = trackIdInput.trim();
    if (!query) {
      setNotFoundError(true);
      return;
    }

    const found = findComplaintById(query, complaints);
    if (found) {
      setTrackedComplaint(found);
      setNotFoundError(false);
    } else {
      setTrackedComplaint(null);
      setNotFoundError(true);
    }
  };

  const handleReadStatusAloud = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !trackedComplaint) return;
    if (isSpeakingStatus) {
      window.speechSynthesis.cancel();
      setIsSpeakingStatus(false);
    } else {
      window.speechSynthesis.cancel();
      const statusText = trackedComplaint.status.replace('_', ' ');
      const message = `Complaint ID ${trackedComplaint.id} is currently ${statusText}. Categorized under ${trackedComplaint.category} for the ${trackedComplaint.department}. Reported issue: ${trackedComplaint.title}.`;
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.95;
      utterance.onstart = () => setIsSpeakingStatus(true);
      utterance.onend = () => setIsSpeakingStatus(false);
      utterance.onerror = () => setIsSpeakingStatus(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAdvanceStatus = (newStatus: ComplaintStatus) => {
    if (!trackedComplaint) return;
    setIsSimulating(true);

    setTimeout(() => {
      const updated = updateComplaintStatus(
        trackedComplaint.id,
        newStatus,
        'Red Mist Administrator',
        `Milestone transitioned to ${newStatus.replace('_', ' ').toUpperCase()} by testing console.`,
        newStatus === 'resolved'
          ? {
              actionTaken: 'Standard inspection and maintenance repairs executed successfully.',
              resolutionNotes: 'Problem resolved and verified operational.',
            }
          : undefined
      );

      if (updated) {
        setTrackedComplaint(updated);
        onRefreshComplaints();
      }
      setIsSimulating(false);
    }, 250);
  };

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackedComplaint || !inquiryText.trim()) return;

    setIsSendingInquiry(true);
    setTimeout(() => {
      const updated = addCitizenComment(
        trackedComplaint.id,
        inquiryText.trim(),
        trackedComplaint.complainant.name || 'Student'
      );
      if (updated) {
        setTrackedComplaint(updated);
        onRefreshComplaints();
        setInquiryText('');
        setInquirySuccess(true);
        setTimeout(() => setInquirySuccess(false), 3000);
      }
      setIsSendingInquiry(false);
    }, 300);
  };

  const currentStepIdx = trackedComplaint ? getStepIndex(trackedComplaint.status) : 0;

  return (
    <div className="w-full max-w-3xl mx-auto py-8 sm:py-12 px-4 sm:px-6 space-y-6">
      {/* Search Card in Red Mist theme */}
      <div id="track" className="bg-[#171010] rounded-2xl p-6 sm:p-8 shadow-2xl border border-[#382222] space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📍</span>
            <h2 className="text-2xl font-bold tracking-tight text-[#fbf3f2]">Track Complaint</h2>
          </div>
          <p className="text-xs text-[#c2a8a5] mt-1">
            Enter your Complaint Tracking ID (e.g. #CMP4829) to monitor live milestone progress.
          </p>
        </div>

        <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            id="trackId"
            value={trackIdInput}
            onChange={(e) => setTrackIdInput(e.target.value)}
            placeholder="Enter Complaint ID (e.g. #CMP4829)"
            className="flex-1 px-4 py-3 bg-[#100a0a] border border-[#382222] rounded-xl text-sm font-mono text-[#fbf3f2] placeholder-[#7d6562] focus:outline-hidden focus:border-[#c83a2a] focus:ring-1 focus:ring-[#c83a2a] transition-all"
          />

          <button
            id="track-btn"
            type="submit"
            className="bg-[#c83a2a] hover:bg-[#db4837] text-white font-bold px-8 py-3 rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(200,58,42,0.35)] shrink-0 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Track</span>
          </button>
        </form>

        {/* Quick Sample IDs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-[#c2a8a5]">
          <span className="font-semibold text-[#eed9d6]">Quick Track:</span>
          {complaints.slice(0, 5).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setTrackIdInput(c.id);
                setTrackedComplaint(c);
                setSearchAttempted(true);
                setNotFoundError(false);
              }}
              className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all border cursor-pointer ${
                trackedComplaint?.id === c.id
                  ? 'bg-[#c83a2a] text-white border-[#db4837] shadow-[0_0_12px_rgba(200,58,42,0.4)]'
                  : 'bg-[#221515] hover:bg-[#2d1b1b] hover:text-[#fca58f] text-[#eed9d6] border-[#3d2424]'
              }`}
            >
              {c.id}
            </button>
          ))}
        </div>

        {/* Not Found Alert */}
        {notFoundError && (
          <div className="p-4 rounded-xl bg-[#331414] border border-[#5c2424] text-[#fca58f] text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-[#c83a2a] shrink-0" />
            <span>Complaint not found. Please verify and enter the correct Complaint ID.</span>
          </div>
        )}
      </div>

      {/* Result Container */}
      {trackedComplaint && (
        <div id="trackResult" className="space-y-6">
          {/* Status Stepper Card in Red Mist theme */}
          <div className="bg-[#171010] rounded-2xl p-6 sm:p-8 shadow-2xl border border-[#382222] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#2d1b1b]">
              <div className="flex items-center gap-3">
                <span className="font-mono font-extrabold text-base sm:text-lg text-[#fca58f] bg-[#2a1313] px-3 py-1 rounded-lg border border-[#502424]">
                  {trackedComplaint.id}
                </span>
                <span className="text-xs font-semibold text-[#c2a8a5]">
                  Filed: {formatDate(trackedComplaint.createdAt)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Audio readout button for non-readers */}
                <button
                  type="button"
                  onClick={handleReadStatusAloud}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSpeakingStatus
                      ? 'bg-[#401616] text-[#ffd6cc] border-[#7d2c2c] animate-pulse'
                      : 'bg-[#241515] hover:bg-[#331b1b] text-[#fca58f] border-[#472626]'
                  }`}
                  title="Listen to status update aloud"
                >
                  {isSpeakingStatus ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isSpeakingStatus ? 'Stop Voice' : '🔊 Listen to Status'}</span>
                </button>

                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#241515] text-[#eed9d6] border border-[#422525]">
                  {trackedComplaint.department}
                </span>
              </div>
            </div>

            {/* Stepper Heading */}
            <h3 className="text-base font-bold text-[#fbf3f2] flex items-center gap-2">
              <span>Complaint Status</span>
            </h3>

            {/* 4-Step Visual Stepper in Red Mist Theme */}
            <div className="relative pt-2 pb-4">
              {/* Connecting progress bar */}
              <div className="hidden sm:block absolute top-[28px] left-[10%] right-[10%] h-1 bg-[#2b1818] -z-0">
                <div
                  className="h-full bg-[#c83a2a] shadow-[0_0_10px_rgba(200,58,42,0.6)] transition-all duration-500"
                  style={{ width: `${(currentStepIdx / 3) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                {STEPS.map((step, idx) => {
                  const isCompleted = idx < currentStepIdx;
                  const isCurrent = idx === currentStepIdx;

                  return (
                    <div key={step.status} className="text-center flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm mb-2 shadow-sm transition-all ${
                          isCompleted
                            ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                            : isCurrent
                            ? 'bg-[#c83a2a] text-white ring-4 ring-[#db4837]/40 shadow-[0_0_15px_rgba(200,58,42,0.6)]'
                            : 'bg-[#221414] text-[#7d6562] border border-[#382222]'
                        }`}
                      >
                        {isCompleted ? '✓' : step.stepNum}
                      </div>

                      <span
                        className={`text-xs font-bold block ${
                          isCurrent
                            ? 'text-[#fca58f]'
                            : isCompleted
                            ? 'text-emerald-400'
                            : 'text-[#8f7471]'
                        }`}
                      >
                        {step.label}
                      </span>

                      <p className="text-[11px] text-[#7d6562] mt-0.5">
                        {step.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Admin Simulator Bar in Red Mist style */}
            <div className="p-3.5 rounded-xl bg-[#201313] border border-[#3d2424] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-[#eed9d6] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#c83a2a]" />
                <span>Simulate Stage Advancement:</span>
              </span>

              <div className="flex flex-wrap items-center gap-1.5">
                {(['submitted', 'under_review', 'in_progress', 'resolved'] as ComplaintStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleAdvanceStatus(st)}
                    disabled={isSimulating}
                    className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-all border text-xs cursor-pointer ${
                      trackedComplaint.status === st
                        ? 'bg-[#c83a2a] text-white border-[#db4837] shadow-[0_0_12px_rgba(200,58,42,0.4)]'
                        : 'bg-[#180e0e] text-[#eed9d6] border-[#382222] hover:bg-[#261616] hover:text-[#fca58f]'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grievance Details Card */}
          <div className="bg-[#171010] rounded-2xl p-6 sm:p-8 shadow-2xl border border-[#382222] space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#c2a8a5] border-b border-[#2d1b1b] pb-2">
              Complaint Record & Information
            </h3>

            {/* Complainant & Category Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#120a0a] p-3.5 rounded-xl border border-[#301c1c] space-y-1">
                <span className="text-[#8f7471] font-semibold uppercase text-[10px] block">Student / Complainant</span>
                <span className="font-bold text-[#fbf3f2] text-sm block">
                  {trackedComplaint.complainant.name}
                </span>
                <span className="text-[#c2a8a5] block flex items-center gap-1">
                  <Mail className="w-3 h-3 text-[#8f7471]" />
                  {trackedComplaint.complainant.email}
                </span>
              </div>

              <div className="bg-[#120a0a] p-3.5 rounded-xl border border-[#301c1c] space-y-1">
                <span className="text-[#8f7471] font-semibold uppercase text-[10px] block">Category & Routing</span>
                <span className="font-bold text-[#fbf3f2] text-sm block">
                  {trackedComplaint.category}
                </span>
                <span className="text-[#fca58f] font-semibold block flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-[#c83a2a]" />
                  {trackedComplaint.department}
                </span>
              </div>
            </div>

            {/* Description Statement */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#eed9d6] block mb-1.5">
                Issue Description
              </span>
              <div className="p-4 bg-[#100a0a] border border-[#301c1c] rounded-xl text-xs sm:text-sm text-[#fbf3f2] leading-relaxed whitespace-pre-line">
                {trackedComplaint.description}
              </div>
            </div>

            {/* Photo Attachment if present */}
            {trackedComplaint.attachments && trackedComplaint.attachments.length > 0 && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#eed9d6] block mb-2">
                  Attached Photo Evidence
                </span>
                <div className="flex flex-wrap gap-3">
                  {trackedComplaint.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-3 bg-[#120a0a] border border-[#301c1c] rounded-xl flex items-center gap-3"
                    >
                      {att.previewUrl ? (
                        <img
                          src={att.previewUrl}
                          alt={att.name}
                          className="w-16 h-16 object-cover rounded-lg border border-[#382222]"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-[#251313] text-[#fca58f] rounded-lg flex items-center justify-center font-bold text-xs border border-[#482424]">
                          PHOTO
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-bold text-[#fbf3f2] block truncate max-w-xs">
                          {att.name}
                        </span>
                        <span className="text-[11px] text-[#8f7471]">{att.size}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolution Details Card if resolved */}
            {trackedComplaint.status === 'resolved' && (
              <div className="p-4 rounded-xl bg-[#0f241a] border border-[#1d4d38] text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Official Resolution Certified</span>
                </div>
                <p className="text-emerald-100 leading-relaxed">
                  {trackedComplaint.resolution?.actionTaken || 'Action completed by designated campus technician.'}
                </p>
                {trackedComplaint.resolution?.resolutionNotes && (
                  <p className="text-emerald-300 text-[11px] italic">
                    Note: {trackedComplaint.resolution.resolutionNotes}
                  </p>
                )}
              </div>
            )}

            {/* Citizen Inquiries / Follow-up thread */}
            <div className="pt-3 border-t border-[#2d1b1b] space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#eed9d6] block">
                Post Follow-Up Query or Note
              </span>

              {inquirySuccess && (
                <div className="p-2.5 rounded-lg bg-[#0f241a] border border-[#1d4d38] text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Your follow-up note was logged into the case record.</span>
                </div>
              )}

              <form onSubmit={handleSendInquiry} className="flex gap-2">
                <input
                  type="text"
                  value={inquiryText}
                  onChange={(e) => setInquiryText(e.target.value)}
                  placeholder="Need updates or have questions regarding this complaint?"
                  className="flex-1 px-3.5 py-2.5 bg-[#100a0a] border border-[#382222] rounded-xl text-xs sm:text-sm text-[#fbf3f2] placeholder-[#7d6562] focus:outline-hidden focus:border-[#c83a2a] focus:ring-1 focus:ring-[#c83a2a] transition-all"
                />
                <button
                  type="submit"
                  disabled={isSendingInquiry || !inquiryText.trim()}
                  className="bg-[#c83a2a] hover:bg-[#db4837] disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-[0_0_12px_rgba(200,58,42,0.3)]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Note</span>
                </button>
              </form>

              {/* Timeline events */}
              {trackedComplaint.timeline && trackedComplaint.timeline.length > 0 && (
                <div className="mt-3 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8f7471] block">
                    Case Activity Log
                  </span>
                  <div className="space-y-1.5">
                    {trackedComplaint.timeline.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-2.5 rounded-lg bg-[#120a0a] border border-[#2e1c1c] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                      >
                        <div className="space-y-0.5">
                          <span className="font-semibold text-[#eed9d6]">
                            {evt.actorName || evt.actor}:
                          </span>{' '}
                          <span className="text-[#c2a8a5]">{evt.message}</span>
                        </div>
                        <span className="text-[10px] text-[#8f7471] font-mono shrink-0">
                          {formatDate(evt.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
