import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { FileComplaintForm } from './components/FileComplaintForm';
import { TrackComplaintView } from './components/TrackComplaintView';
import { AdminPortal } from './components/AdminPortal';
import { Complaint, SessionState } from './types';
import { loadComplaints, resetToSampleComplaints } from './utils/storage';
import { CheckCircle2, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'complaint' | 'track' | 'admin'>('home');
  const [complaints, setComplaints] = useState<Complaint[]>(() => loadComplaints());
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  // Admin Session
  const [session, setSession] = useState<SessionState>(() => {
    try {
      const saved = localStorage.getItem('cms_admin_session_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return { admin: false };
  });

  // Global Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Persist session
  useEffect(() => {
    try {
      localStorage.setItem('cms_admin_session_v1', JSON.stringify(session));
    } catch (e) {
      console.error(e);
    }
  }, [session]);

  const refreshComplaints = () => {
    const updated = loadComplaints();
    setComplaints(updated);
  };

  const handleComplaintSubmitted = (newComplaint: Complaint) => {
    refreshComplaints();
    showToast(`Complaint #${newComplaint.id} submitted successfully!`);
  };

  const handleTrackSubmittedComplaint = (complaintId: string) => {
    setSelectedTrackId(complaintId);
    setActiveTab('track');
  };

  const handleAdminLogin = async (username: string, password: string): Promise<boolean> => {
    // Auth simulation
    await new Promise((resolve) => setTimeout(resolve, 250));

    if (username === 'admin' && password === 'admin123') {
      const newSession: SessionState = {
        admin: true,
        user: 'admin',
        role: 'Grievance Officer',
        department: 'Campus Administration',
        loginTime: new Date().toLocaleTimeString(),
        sessionId: `sess_${Math.random().toString(36).substring(2, 9)}`,
      };
      setSession(newSession);
      showToast('Authenticated as Grievance Administrator', 'success');
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    setSession({ admin: false });
    showToast('Signed out of Administrator Portal', 'info');
  };

  const handleResetData = () => {
    const reset = resetToSampleComplaints();
    setComplaints(reset);
    setSelectedTrackId(reset[0]?.id || null);
    showToast('Reset complaints database to initial dataset', 'info');
  };

  return (
    <div className="min-h-screen bg-[#faf5f5] text-zinc-900 flex flex-col font-sans selection:bg-[#dc2626] selection:text-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'track' && !selectedTrackId && complaints.length > 0) {
            setSelectedTrackId(complaints[0].id);
          }
        }}
        session={session}
        onLogout={handleAdminLogout}
        onResetData={handleResetData}
        complaintCount={complaints.length}
      />

      {/* Main Content View */}
      <main className="flex-1 w-full">
        {activeTab === 'home' && (
          <HomeView
            onNavigate={(tab) => {
              setActiveTab(tab);
              if (tab === 'track' && !selectedTrackId && complaints.length > 0) {
                setSelectedTrackId(complaints[0].id);
              }
            }}
            onTrackComplaint={(id) => {
              setSelectedTrackId(id);
              setActiveTab('track');
            }}
            recentComplaints={complaints}
          />
        )}

        {activeTab === 'complaint' && (
          <FileComplaintForm
            onComplaintSubmitted={handleComplaintSubmitted}
            onTrackSubmittedComplaint={handleTrackSubmittedComplaint}
          />
        )}

        {activeTab === 'track' && (
          <TrackComplaintView
            complaints={complaints}
            selectedComplaintId={selectedTrackId}
            onRefreshComplaints={refreshComplaints}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPortal
            complaints={complaints}
            session={session}
            onLogin={handleAdminLogin}
            onLogout={handleAdminLogout}
            onRefreshComplaints={refreshComplaints}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-rose-100 bg-white py-6 px-4 sm:px-6 text-xs text-zinc-500 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-zinc-800">
              📢 Online Complaint Management System
            </span>
            <span className="text-zinc-300">|</span>
            <span>Accessible Voice & Text Grievance Redressal</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-mono">
            <span>🎙️ Voice-to-Text Support</span>
            <span>•</span>
            <span>Automated AI Department Dispatch</span>
          </div>
        </div>
      </footer>

      {/* Global Notification Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm"
          >
            <div
              className={`p-4 rounded-xl border shadow-lg flex items-center gap-3 text-xs font-semibold ${
                toast.type === 'success'
                  ? 'bg-zinc-900 text-white border-zinc-800'
                  : 'bg-white text-zinc-800 border-zinc-200'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-blue-500 shrink-0" />
              )}
              <span className="flex-1">{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="text-zinc-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
