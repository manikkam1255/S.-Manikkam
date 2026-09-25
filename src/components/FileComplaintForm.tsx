import React, { useState, useMemo, useRef } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Upload,
  Copy,
  Check,
  ArrowRight,
  AlertCircle,
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Flame,
} from 'lucide-react';
import { Complaint, ComplaintCategory } from '../types';
import {
  analyzeComplaintText,
  CATEGORY_OPTIONS,
  SAMPLE_PROMPTS,
} from '../utils/aiDetection';
import { addComplaint } from '../utils/storage';
import { useSpeechRecognition } from '../utils/useSpeechRecognition';

interface FileComplaintFormProps {
  onComplaintSubmitted: (complaint: Complaint) => void;
  onTrackSubmittedComplaint: (complaintId: string) => void;
}

export const FileComplaintForm: React.FC<FileComplaintFormProps> = ({
  onComplaintSubmitted,
  onTrackSubmittedComplaint,
}) => {
  // Form fields
  const [studentName, setStudentName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [complaintText, setComplaintText] = useState('');

  // Photo upload
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);

  // Submission & Result state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{
    id: string;
    category: ComplaintCategory;
    department: string;
    title: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Name Voice Input State
  const [isListeningName, setIsListeningName] = useState(false);

  // Main Speech Recognition hook for Complaint Text
  const {
    isListening,
    interimTranscript,
    error: speechError,
    startListening,
    stopListening,
    speakText,
    isSpeaking,
    stopSpeaking,
  } = useSpeechRecognition((finalTranscript) => {
    setComplaintText((prev) => {
      const cleanPrev = prev.trim();
      const cleanNew = finalTranscript.trim();
      if (!cleanPrev) return cleanNew;
      if (!cleanPrev.endsWith(cleanNew)) {
        return `${cleanPrev} ${cleanNew}`;
      }
      return cleanPrev;
    });
  });

  // Name Speech Recognition helper
  const nameRecognitionRef = useRef<any>(null);

  const startNameListening = () => {
    const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechAPI) {
      setErrorMsg('Voice input not supported in this browser.');
      return;
    }
    try {
      if (nameRecognitionRef.current) {
        try {
          nameRecognitionRef.current.abort();
        } catch {}
      }
      const rec = new SpeechAPI();
      nameRecognitionRef.current = rec;
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => setIsListeningName(true);
      rec.onresult = (e: any) => {
        const spoken = e.results[0][0].transcript;
        if (spoken) {
          const cleaned = spoken.replace(/^(my name is|i am|this is)\s*/i, '').trim();
          setStudentName(cleaned);
        }
        setIsListeningName(false);
      };
      rec.onerror = () => setIsListeningName(false);
      rec.onend = () => setIsListeningName(false);
      rec.start();
    } catch {
      setIsListeningName(false);
    }
  };

  const stopNameListening = () => {
    if (nameRecognitionRef.current) {
      try {
        nameRecognitionRef.current.stop();
      } catch {}
    }
    setIsListeningName(false);
  };

  // Real-time AI Category Analysis
  const aiAnalysis = useMemo(() => {
    return analyzeComplaintText(complaintText);
  }, [complaintText]);

  // Effective category and department
  const effectiveCategory: ComplaintCategory = (selectedCategory as ComplaintCategory) || aiAnalysis.category;
  const effectiveDepartment = useMemo(() => {
    if (selectedCategory) {
      const match = CATEGORY_OPTIONS.find((c) => c.label === selectedCategory);
      return match ? match.department : 'Administration';
    }
    return aiAnalysis.department;
  }, [selectedCategory, aiAnalysis]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoFileName(null);
  };

  const handleApplySample = (sample: (typeof SAMPLE_PROMPTS)[0]) => {
    setStudentName(sample.name);
    setEmail(sample.email);
    setSelectedCategory('');
    setComplaintText(sample.text);
    setErrorMsg(null);
  };

  const handleReadInstructions = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speakText(
        'Welcome to the Red Mist complaint portal. Click the glowing red microphone button to speak your grievance, and our system will transcribe it into text automatically. You can also attach a photo and track your issue.'
      );
    }
  };

  const handleReadComplaintAloud = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else if (complaintText.trim()) {
      speakText(complaintText);
    } else {
      speakText('Please speak or type your complaint first.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (isListening) stopListening();

    const nameTrim = studentName.trim();
    const emailTrim = email.trim();
    const textTrim = complaintText.trim();

    if (!nameTrim || !emailTrim || !textTrim) {
      setErrorMsg('Please fill in Student Name, Email, and What happened.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      if (effectiveCategory === 'Safety' || textTrim.toLowerCase().includes('spark') || textTrim.toLowerCase().includes('burst')) {
        priority = 'critical';
      } else if (effectiveCategory === 'Electrical' || effectiveCategory === 'Examination') {
        priority = 'high';
      }

      const created = addComplaint({
        title: textTrim.length > 60 ? `${textTrim.substring(0, 60)}...` : textTrim,
        description: textTrim,
        category: effectiveCategory,
        department: effectiveDepartment,
        priority,
        status: 'submitted',
        location: 'Campus Facilities',
        complainant: {
          name: nameTrim,
          email: emailTrim,
          phone: '+1 (555) 000-0000',
          isAnonymous: false,
        },
        attachments: photoFileName
          ? [
              {
                id: `att-${Date.now()}`,
                name: photoFileName,
                size: '1.2 MB',
                type: 'image/jpeg',
                previewUrl: photoPreview || undefined,
              },
            ]
          : [],
      });

      onComplaintSubmitted(created);
      setSubmittedResult({
        id: created.id,
        category: created.category,
        department: created.department,
        title: created.title,
      });
      setIsSubmitting(false);

      speakText(
        `Your complaint has been submitted under ID ${created.id}. It has been categorized as ${created.category} and routed to ${created.department}.`
      );
    }, 450);
  };

  const handleCopyId = () => {
    if (submittedResult) {
      navigator.clipboard.writeText(submittedResult.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResetForm = () => {
    setSubmittedResult(null);
    setStudentName('');
    setEmail('');
    setSelectedCategory('');
    setComplaintText('');
    setPhotoPreview(null);
    setPhotoFileName(null);
    setErrorMsg(null);
  };

  // Result Card in Red Mist theme
  if (submittedResult) {
    return (
      <div className="w-full max-w-xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
        <div id="result" className="bg-[#171010] rounded-2xl p-8 sm:p-10 shadow-2xl border border-[#3d2424] text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#2c1313] text-[#fca58f] border border-[#5c2424] flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(200,58,42,0.3)]">
            <CheckCircle2 className="w-9 h-9 text-[#c83a2a]" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-[#fbf3f2]">Complaint Registered!</h2>
            <p className="text-sm text-[#c2a8a5] mt-1">
              Your grievance has been safely logged in the central Red Mist registry.
            </p>
          </div>

          {/* Large Complaint ID Banner in Red Mist theme */}
          <div className="relative group">
            <div
              id="complaintId"
              className="bg-[#2a1313] text-[#ffd6cc] py-4 px-6 rounded-xl font-mono text-2xl font-extrabold tracking-wider border-2 border-[#5e2626] shadow-[0_0_25px_rgba(200,58,42,0.25)] flex items-center justify-center gap-3"
            >
              <span>{submittedResult.id}</span>
              <button
                type="button"
                onClick={handleCopyId}
                title="Copy Complaint ID"
                className="p-1.5 rounded-lg hover:bg-[#3d1c1c] text-[#fca58f] transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            {copied && (
              <p className="text-xs text-emerald-400 font-semibold mt-1 animate-fade-in">
                Complaint ID copied to clipboard!
              </p>
            )}
          </div>

          {/* Details Table */}
          <div className="bg-[#120b0b] rounded-xl p-4 border border-[#382222] text-sm text-left space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#261717]">
              <span className="text-[#c2a8a5] font-medium">Category:</span>
              <span id="resultCategory" className="font-bold text-[#fbf3f2] bg-[#241515] px-2.5 py-0.5 rounded border border-[#472727]">
                {submittedResult.category}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#c2a8a5] font-medium">Assigned Department:</span>
              <span id="department" className="font-bold text-[#fca58f] bg-[#241515] px-2.5 py-0.5 rounded border border-[#472727]">
                {submittedResult.department}
              </span>
            </div>
          </div>

          {/* Voice readback button */}
          <button
            type="button"
            onClick={() =>
              speakText(
                `Your complaint ID is ${submittedResult.id}. Assigned department is ${submittedResult.department}.`
              )
            }
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#fca58f] hover:text-white bg-[#261414] hover:bg-[#361c1c] px-3 py-1.5 rounded-lg border border-[#4a2424] transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            <span>🔊 Listen to Confirmation</span>
          </button>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              id="result-track-btn"
              onClick={() => onTrackSubmittedComplaint(submittedResult.id)}
              className="flex-1 bg-[#c83a2a] hover:bg-[#db4837] text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(200,58,42,0.35)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>📍 Track Complaint</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleResetForm}
              className="bg-[#241717] hover:bg-[#301e1e] text-[#eed9d6] font-semibold py-3.5 px-5 rounded-xl text-sm transition-all border border-[#422727] cursor-pointer"
            >
              ➕ Lodge Another Grievance
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-8 sm:py-12 px-4 sm:px-6 space-y-6">
      <div id="complaint" className="bg-[#171010] rounded-2xl p-6 sm:p-10 shadow-2xl border border-[#382222] space-y-6">
        {/* Header with Read Aloud Help */}
        <div className="border-b border-[#2d1b1b] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📝</span>
              <h2 className="text-2xl font-bold tracking-tight text-[#fbf3f2]">New Complaint</h2>
            </div>
            <p className="text-xs text-[#c2a8a5] mt-1">
              Speak or write your issue. Red Mist AI will detect the department automatically.
            </p>
          </div>

          {/* Accessible Audio Assistance button */}
          <button
            type="button"
            onClick={handleReadInstructions}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isSpeaking
                ? 'bg-[#401616] text-[#ffd6cc] border-[#7d2c2c] animate-pulse'
                : 'bg-[#221313] hover:bg-[#2e1919] text-[#fca58f] border-[#422222]'
            }`}
            title="Read instructions aloud for users who prefer listening"
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isSpeaking ? 'Stop Reading' : '🔊 Listen to Help'}</span>
          </button>
        </div>

        {/* Big Accessibility Voice Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-[#281313] to-[#1e0f0f] border border-[#4a2424] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#3d1a1a] text-[#fca58f] border border-[#5e2828] flex items-center justify-center shrink-0 mt-0.5">
              <Mic className="w-5 h-5 text-[#c83a2a]" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#fbf3f2] uppercase tracking-wide">
                Voice Complaint Feature Active
              </h3>
              <p className="text-xs text-[#c2a8a5] leading-relaxed">
                Difficulty typing or reading? Click the <strong>microphone button</strong> below to speak your complaint. The system automatically converts voice into text.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Fill Samples */}
        <div>
          <span className="text-xs font-bold text-[#c2a8a5] uppercase tracking-wider block mb-2">
            ⚡ Quick Test Samples (Click to auto-fill)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_PROMPTS.map((sample) => (
              <button
                key={sample.title}
                type="button"
                onClick={() => handleApplySample(sample)}
                className="px-2.5 py-1 rounded-lg bg-[#221616] hover:bg-[#301e1e] hover:text-[#fca58f] hover:border-[#5a2828] border border-[#3a2323] text-xs font-medium text-[#eed9d6] transition-colors cursor-pointer"
              >
                {sample.title}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-[#331414] border border-[#5c2424] text-[#fca58f] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#c83a2a] shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {speechError && (
          <div className="p-3.5 rounded-xl bg-[#362214] border border-[#633b1e] text-[#fcd38f] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#e0892b] shrink-0" />
            <span>{speechError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Student Name with Voice Input Option */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-[#eed9d6]">
                Student Name <span className="text-[#c83a2a]">*</span>
              </label>
              <button
                type="button"
                onClick={isListeningName ? stopNameListening : startNameListening}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 transition-all ${
                  isListeningName
                    ? 'bg-[#c83a2a] text-white animate-pulse'
                    : 'text-[#fca58f] hover:bg-[#2d1818] bg-[#221414] border border-[#472626]'
                }`}
                title="Speak your name"
              >
                <Mic className="w-3 h-3" />
                <span>{isListeningName ? 'Listening...' : 'Speak Name'}</span>
              </button>
            </div>
            <input
              type="text"
              id="name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter your name (e.g. Rahul Sharma)"
              required
              className="w-full px-3.5 py-2.5 bg-[#100a0a] border border-[#382222] rounded-xl text-sm text-[#fbf3f2] placeholder-[#7d6562] focus:outline-hidden focus:border-[#c83a2a] focus:ring-1 focus:ring-[#c83a2a] transition-all"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-[#eed9d6] mb-1.5">
              Email <span className="text-[#c83a2a]">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email (e.g. student@college.edu)"
              required
              className="w-full px-3.5 py-2.5 bg-[#100a0a] border border-[#382222] rounded-xl text-sm text-[#fbf3f2] placeholder-[#7d6562] focus:outline-hidden focus:border-[#c83a2a] focus:ring-1 focus:ring-[#c83a2a] transition-all"
            />
          </div>

          {/* Category Select */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-[#eed9d6]">
                Complaint Category
              </label>
              {selectedCategory === '' && (
                <span className="text-[11px] font-semibold text-[#fca58f] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#c83a2a]" />
                  AI Auto-Detection Active
                </span>
              )}
            </div>

            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#100a0a] border border-[#382222] rounded-xl text-sm text-[#fbf3f2] focus:outline-hidden focus:border-[#c83a2a] focus:ring-1 focus:ring-[#c83a2a] transition-all font-medium"
            >
              <option value="">-- AI will detect automatically --</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.label} value={c.label} className="bg-[#171010] text-[#fbf3f2]">
                  {c.label} ({c.department})
                </option>
              ))}
            </select>
          </div>

          {/* COMPLAINT TEXT AREA WITH PROMINENT MICROPHONE BUTTON */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="complaintText" className="text-xs font-bold uppercase tracking-wider text-[#eed9d6] flex items-center gap-1.5">
                <span>What happened?</span>
                <span className="text-[#c83a2a]">*</span>
              </label>

              {/* Action buttons beside label */}
              <div className="flex items-center gap-2">
                {complaintText.trim() && (
                  <button
                    type="button"
                    onClick={handleReadComplaintAloud}
                    className="text-[11px] font-semibold text-[#fca58f] hover:text-white flex items-center gap-1 bg-[#241515] hover:bg-[#331c1c] px-2 py-1 rounded-lg border border-[#452727] transition-colors cursor-pointer"
                    title="Read back my complaint aloud"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Read Aloud</span>
                  </button>
                )}

                {complaintText && (
                  <button
                    type="button"
                    onClick={() => setComplaintText('')}
                    className="text-[11px] text-[#8f7471] hover:text-[#fca58f] font-medium"
                  >
                    Clear text
                  </button>
                )}
              </div>
            </div>

            {/* Container with Textarea & Integrated Microphone Button */}
            <div className="relative">
              <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                <div className="relative flex-1">
                  <textarea
                    id="complaintText"
                    rows={4}
                    value={complaintText}
                    onChange={(e) => setComplaintText(e.target.value)}
                    placeholder="Example: Hostel room fan is not working and making sparking noise... (Or click the microphone to speak)"
                    required
                    className={`w-full px-3.5 py-3 bg-[#100a0a] border rounded-xl text-sm text-[#fbf3f2] placeholder-[#7d6562] focus:outline-hidden transition-all leading-relaxed ${
                      isListening
                        ? 'border-[#c83a2a] ring-2 ring-[#c83a2a]/40 bg-[#1e1010]'
                        : 'border-[#382222] focus:border-[#c83a2a] focus:ring-1 focus:ring-[#c83a2a]'
                    }`}
                  />

                  {/* Interim speech ghost text overlay */}
                  {isListening && interimTranscript && (
                    <div className="px-3.5 py-1.5 text-xs text-[#fca58f] italic bg-[#261313] rounded-b-lg border-t border-[#4a2424]">
                      Hearing: "{interimTranscript}"
                    </div>
                  )}
                </div>

                {/* THE PROMINENT MICROPHONE BUTTON IN RED MIST STYLING */}
                <div className="flex sm:flex-col items-center justify-center gap-2 shrink-0">
                  <button
                    id="voice-complaint-btn"
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className={`w-full sm:w-28 p-3 rounded-xl font-bold text-xs flex sm:flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg ${
                      isListening
                        ? 'bg-[#c83a2a] text-white ring-4 ring-[#db4837]/50 shadow-[0_0_25px_rgba(200,58,42,0.6)] animate-pulse scale-102'
                        : 'bg-[#281515] hover:bg-[#381c1c] text-[#fca58f] border-2 border-[#5c2828] hover:border-[#803838]'
                    }`}
                    title={isListening ? 'Click to stop recording' : 'Click to speak your complaint using microphone'}
                  >
                    {isListening ? (
                      <>
                        <div className="w-8 h-8 rounded-full bg-white text-[#c83a2a] flex items-center justify-center">
                          <MicOff className="w-5 h-5 animate-spin" />
                        </div>
                        <span className="font-extrabold text-[11px] uppercase tracking-wider">
                          Stop
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-full bg-[#c83a2a] text-white flex items-center justify-center shadow-[0_0_12px_rgba(200,58,42,0.5)]">
                          <Mic className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-[11px] leading-tight text-center">
                          🎙️ Speak Here
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Visual Listening Waves / Indicator when active */}
            {isListening && (
              <div className="mt-2.5 p-3 rounded-xl bg-[#2b1313] border border-[#5a2424] flex items-center justify-between gap-3 text-xs text-[#fce8e6] animate-fade-in shadow-md">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c83a2a] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#db4837]"></span>
                  </span>
                  <span className="font-bold">
                    Listening now... Speak your complaint clearly into the microphone.
                  </span>
                </div>

                {/* Animated sound wave bars */}
                <div className="flex items-end gap-1 h-5">
                  <span className="w-1 bg-[#c83a2a] rounded-full h-2 animate-pulse" />
                  <span className="w-1 bg-[#fca58f] rounded-full h-5 animate-bounce" />
                  <span className="w-1 bg-[#c83a2a] rounded-full h-3 animate-pulse" />
                  <span className="w-1 bg-[#fca58f] rounded-full h-4 animate-bounce" />
                  <span className="w-1 bg-[#c83a2a] rounded-full h-2 animate-pulse" />
                </div>
              </div>
            )}

            {/* Live AI Category Detection Feedback Badge in Red Mist theme */}
            {complaintText.trim().length > 3 && (
              <div className="mt-2.5 p-3 rounded-xl bg-[#221313] border border-[#472525] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#c83a2a] shrink-0" />
                  <div>
                    <span className="font-semibold text-[#c2a8a5]">
                      {selectedCategory ? 'Manual Override:' : 'AI Predicted Category:'}
                    </span>{' '}
                    <span className="font-bold text-[#fca58f]">{effectiveCategory}</span>
                    <span className="text-[#694d4a] mx-1.5">•</span>
                    <span className="text-[#c2a8a5]">Routes to:</span>{' '}
                    <span className="font-bold text-[#fbf3f2]">{effectiveDepartment}</span>
                  </div>
                </div>

                {aiAnalysis.matchedKeywords.length > 0 && !selectedCategory && (
                  <div className="text-[11px] text-[#fca58f] font-mono">
                    Keywords: {aiAnalysis.matchedKeywords.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upload Photo */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#eed9d6] mb-1.5">
              Upload Photo (Optional)
            </label>

            {!photoPreview ? (
              <label
                htmlFor="photo"
                className="border-2 border-dashed border-[#422727] hover:border-[#c83a2a] bg-[#120a0a] hover:bg-[#1f1212] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors"
              >
                <Upload className="w-6 h-6 text-[#c83a2a] mb-1" />
                <span className="text-xs font-semibold text-[#eed9d6]">
                  Click to choose a photo or drag & drop
                </span>
                <span className="text-[10px] text-[#8f7471] mt-0.5">
                  PNG, JPG, or JPEG up to 5MB
                </span>
                <input
                  type="file"
                  id="photo"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative rounded-xl border border-[#482828] bg-[#1a0f0f] p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={photoPreview}
                    alt="Uploaded proof"
                    className="w-12 h-12 object-cover rounded-lg border border-[#482828]"
                  />
                  <div>
                    <span className="text-xs font-semibold text-[#fbf3f2] block truncate max-w-xs">
                      {photoFileName}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Photo attached
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="p-1.5 rounded-lg text-[#8f7471] hover:text-[#c83a2a] hover:bg-[#2c1515] transition-colors cursor-pointer"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Submit Button in Red Mist theme */}
          <button
            id="complaint-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#c83a2a] hover:bg-[#db4837] disabled:opacity-60 text-white font-bold py-3.5 px-6 rounded-xl text-sm sm:text-base transition-all shadow-[0_0_20px_rgba(200,58,42,0.4)] hover:shadow-[0_0_30px_rgba(200,58,42,0.6)] flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Registering Grievance...</span>
              </>
            ) : (
              <>
                <span>Submit Grievance</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
