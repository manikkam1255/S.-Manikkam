import React, { useState, useMemo } from 'react';
import {
  Shield,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  Building2,
  MapPin,
  ExternalLink,
  ChevronRight,
  LogOut,
  X,
  Send,
  Edit3,
  UserPlus,
  FileSpreadsheet,
  Layers,
  ArrowUpDown,
  Lock,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  SessionState,
  AssignedOfficer,
} from '../types';
import {
  formatDate,
  formatRelativeTime,
  getStatusInfo,
  getPriorityInfo,
  getSlaStatus,
  exportComplaintsToCSV,
} from '../utils/formatters';
import { updateComplaintStatus, assignComplaintOfficer } from '../utils/storage';
import { DEPARTMENT_OPTIONS } from '../data/initialComplaints';

interface AdminPortalProps {
  complaints: Complaint[];
  session: SessionState;
  onLogin: (user: string, pass: string) => Promise<boolean>;
  onLogout: () => void;
  onRefreshComplaints: () => void;
}

const OFFICER_DIRECTORY: AssignedOfficer[] = [
  {
    name: 'Eng. Rajesh Kumar',
    department: 'Municipal Water Supply & Sewerage Board',
    designation: 'Senior Municipal Engineer',
    contactEmail: 'r.kumar@citygov.org',
  },
  {
    name: 'Arthur Vance',
    department: 'Department of Public Works & Highways',
    designation: 'Field Superintendent',
    contactEmail: 'a.vance@citygov.org',
  },
  {
    name: 'Clara Oswald',
    department: 'Urban Lighting & Electrical Utility',
    designation: 'Electrical Inspector',
    contactEmail: 'c.oswald@citygov.org',
  },
  {
    name: 'Marcus Brody',
    department: 'Department of Sanitation & Waste Management',
    designation: 'Divisional Sanitation Supervisor',
    contactEmail: 'm.brody@citygov.org',
  },
  {
    name: 'Jessica Ramos',
    department: 'Municipal Revenue & Utility Billing Division',
    designation: 'Senior Billing Auditor',
    contactEmail: 'j.ramos@citygov.org',
  },
  {
    name: 'Dr. Aris Thorne',
    department: 'Public Health & Environmental Safety',
    designation: 'Chief Environmental Inspector',
    contactEmail: 'a.thorne@citygov.org',
  },
];

export const AdminPortal: React.FC<AdminPortalProps> = ({
  complaints,
  session,
  onLogin,
  onLogout,
  onRefreshComplaints,
}) => {
  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Table filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  // Selected Complaint for Drawer/Modal
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Status update form inside modal
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('in_progress');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState<string | null>(null);

  // Assignment state inside modal
  const [selectedOfficerIndex, setSelectedOfficerIndex] = useState<number>(0);
  const [isAssigning, setIsAssigning] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    const ok = await onLogin(username, password);
    setIsLoggingIn(false);
    if (!ok) {
      setLoginError('Invalid Administrator credentials. Use admin / admin123');
    }
  };

  const handleQuickFillValid = () => {
    setUsername('admin');
    setPassword('admin123');
    setLoginError(null);
  };

  // Metrics computation
  const metrics = useMemo(() => {
    const total = complaints.length;
    const submitted = complaints.filter((c) => c.status === 'submitted').length;
    const underReview = complaints.filter((c) => c.status === 'under_review').length;
    const inProgress = complaints.filter((c) => c.status === 'in_progress').length;
    const resolved = complaints.filter((c) => c.status === 'resolved').length;
    const overdue = complaints.filter((c) => {
      const sla = getSlaStatus(c.slaDeadline, c.status);
      return sla.isOverdue;
    }).length;

    return {
      total,
      pending: submitted + underReview,
      inProgress,
      resolved,
      overdue,
    };
  }, [complaints]);

  // Filtered complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;

      if (onlyOverdue) {
        const sla = getSlaStatus(c.slaDeadline, c.status);
        if (!sla.isOverdue) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = c.id.toLowerCase().includes(q);
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesLocation = c.location.toLowerCase().includes(q);
        const matchesCitizen = c.complainant.name.toLowerCase().includes(q);
        const matchesDept = c.department.toLowerCase().includes(q);
        if (!matchesId && !matchesTitle && !matchesLocation && !matchesCitizen && !matchesDept) {
          return false;
        }
      }

      return true;
    });
  }, [complaints, statusFilter, categoryFilter, priorityFilter, onlyOverdue, searchQuery]);

  const openDrawer = (c: Complaint) => {
    setSelectedComplaint(c);
    setNewStatus(c.status);
    setStatusRemarks('');
    setActionTaken('');
    setUpdateSuccessMsg(null);
  };

  const handleUpdateStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setIsUpdatingStatus(true);
    setTimeout(() => {
      const updated = updateComplaintStatus(
        selectedComplaint.id,
        newStatus,
        session.user || 'Officer Administrator',
        statusRemarks.trim(),
        newStatus === 'resolved'
          ? {
              actionTaken: actionTaken.trim() || 'Comprehensive repair & inspection completed.',
              resolutionNotes: statusRemarks.trim(),
            }
          : undefined
      );

      if (updated) {
        setSelectedComplaint(updated);
        onRefreshComplaints();
        setUpdateSuccessMsg(`Status updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
        setTimeout(() => setUpdateSuccessMsg(null), 3000);
      }
      setIsUpdatingStatus(false);
    }, 400);
  };

  const handleAssignOfficerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    const officer = OFFICER_DIRECTORY[selectedOfficerIndex];
    if (!officer) return;

    setIsAssigning(true);
    setTimeout(() => {
      const updated = assignComplaintOfficer(
        selectedComplaint.id,
        officer,
        session.user || 'Grievance Administrator'
      );

      if (updated) {
        setSelectedComplaint(updated);
        onRefreshComplaints();
        setUpdateSuccessMsg(`Assigned to ${officer.name}`);
        setTimeout(() => setUpdateSuccessMsg(null), 3000);
      }
      setIsAssigning(false);
    }, 400);
  };

  // If not logged in, show Officer Login Form
  if (!session.admin) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#171010] rounded-2xl border border-[#382222] shadow-2xl p-6 sm:p-8"
        >
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-[#2d1b1b]">
            <div className="w-11 h-11 rounded-xl bg-[#2a1313] text-[#fca58f] border border-[#4d2525] flex items-center justify-center shadow-[0_0_15px_rgba(200,58,42,0.3)]">
              <Shield className="w-6 h-6 text-[#c83a2a]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#fbf3f2]">
                Officer Triage Portal
              </h1>
              <p className="text-xs text-[#c2a8a5]">
                Authorized Campus & Redressal Access
              </p>
            </div>
          </div>

          {loginError && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#331414] border border-[#5c2424] text-[#fca58f] text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#c83a2a] shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-username"
                className="block text-xs font-semibold uppercase tracking-wider text-[#eed9d6] mb-1.5"
              >
                Officer ID / Username
              </label>
              <input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username (e.g. admin)"
                required
                className="w-full px-3.5 py-2.5 bg-[#100a0a] border border-[#382222] rounded-xl text-xs sm:text-sm text-[#fbf3f2] placeholder-[#7d6562] focus:outline-hidden focus:border-[#c83a2a] focus:ring-1 focus:ring-[#c83a2a] transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold uppercase tracking-wider text-[#eed9d6] mb-1.5"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (e.g. admin123)"
                required
                className="w-full px-3.5 py-2.5 bg-[#100a0a] border border-[#382222] rounded-xl text-xs sm:text-sm text-[#fbf3f2] placeholder-[#7d6562] focus:outline-hidden focus:border-[#c83a2a] focus:ring-1 focus:ring-[#c83a2a] transition-all"
              />
            </div>

            <button
              id="admin-login-btn"
              type="submit"
              disabled={isLoggingIn}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-[#c83a2a] hover:bg-[#db4837] disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-[0_0_15px_rgba(200,58,42,0.4)] cursor-pointer"
            >
              {isLoggingIn ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In to Officer Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-[#2d1b1b]">
            <div className="flex items-center justify-between text-xs text-[#c2a8a5] mb-2">
              <span className="font-semibold text-[#eed9d6] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#c83a2a]" />
                Quick Test Credentials
              </span>
            </div>
            <button
              type="button"
              onClick={handleQuickFillValid}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-xl bg-[#241515] text-[#fca58f] hover:bg-[#301c1c] border border-[#482828] transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fill Default: admin / admin123</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-10 px-4 sm:px-6 space-y-6">
      {/* Top Banner & Session Control */}
      <div className="bg-[#171010] rounded-2xl border border-[#382222] p-6 sm:p-7 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-[#0f241a] text-emerald-300 border border-[#1d4d38] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Nodal Officer Active
            </span>
            <span className="text-xs font-mono text-[#8f7471]">
              User: {session.user || 'admin'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#fbf3f2] mt-1">
            Grievance Redressal & Triage Console
          </h1>
          <p className="text-xs text-[#c2a8a5] mt-0.5">
            Oversee, inspect, allocate field staff, and approve resolutions for citizen complaints.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="export-csv-btn"
            onClick={() => exportComplaintsToCSV(filteredComplaints)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#241515] hover:bg-[#301c1c] text-[#fbf3f2] border border-[#482828] transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#fca58f]" />
            <span>Export CSV ({filteredComplaints.length})</span>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#fca58f] bg-[#2d1515] hover:bg-[#3d1a1a] border border-[#5c2424] transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-[#171010] p-4 rounded-xl border border-[#382222] shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8f7471] block">
            Total Filed
          </span>
          <span className="text-2xl font-extrabold text-[#fbf3f2] mt-1 block">
            {metrics.total}
          </span>
          <span className="text-[10px] text-[#c2a8a5]">Across all sectors</span>
        </div>

        <div className="bg-[#171010] p-4 rounded-xl border border-[#4d2828] shadow-sm bg-[#221212]/40">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#fca58f] block">
            Pending Triage
          </span>
          <span className="text-2xl font-extrabold text-[#ffd6cc] mt-1 block">
            {metrics.pending}
          </span>
          <span className="text-[10px] text-[#e08e7e]">Submitted & In Review</span>
        </div>

        <div className="bg-[#171010] p-4 rounded-xl border border-[#52331c] shadow-sm bg-[#221710]/40">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
            In Progress
          </span>
          <span className="text-2xl font-extrabold text-amber-300 mt-1 block">
            {metrics.inProgress}
          </span>
          <span className="text-[10px] text-amber-500/80">Field work active</span>
        </div>

        <div className="bg-[#171010] p-4 rounded-xl border border-[#1d4d38] shadow-sm bg-[#0e2118]/40">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
            Resolved
          </span>
          <span className="text-2xl font-extrabold text-emerald-300 mt-1 block">
            {metrics.resolved}
          </span>
          <span className="text-[10px] text-emerald-500/80">Sign-off certified</span>
        </div>

        <div className="bg-[#171010] p-4 rounded-xl border border-[#5c2424] shadow-sm bg-[#2e1313]/40">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#c83a2a] block">
            SLA Overdue
          </span>
          <span className="text-2xl font-extrabold text-[#fca58f] mt-1 block">
            {metrics.overdue}
          </span>
          <span className="text-[10px] text-[#f87171]">Requires escalation</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#171010] rounded-2xl border border-[#382222] p-4 sm:p-5 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7d6562]">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="admin-search-complaints"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, keyword, citizen name, location, department..."
              className="w-full pl-9 pr-3.5 py-2 bg-[#100a0a] border border-[#382222] rounded-xl text-xs text-[#fbf3f2] placeholder-[#7d6562] focus:outline-hidden focus:border-[#c83a2a] focus:ring-1 focus:ring-[#c83a2a] transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-56">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#100a0a] border border-[#382222] rounded-xl text-xs text-[#fbf3f2] focus:outline-hidden focus:border-[#c83a2a]"
            >
              <option value="all">All Categories</option>
              <option value="Municipal Services">Municipal Services</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Electricity & Power">Electricity & Power</option>
              <option value="Roads & Infrastructure">Roads & Infrastructure</option>
              <option value="Waste Management">Waste Management</option>
              <option value="Public Safety">Public Safety</option>
              <option value="Billing & Accounts">Billing & Accounts</option>
              <option value="Healthcare & Sanitation">Healthcare & Sanitation</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="w-full md:w-36">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#100a0a] border border-[#382222] rounded-xl text-xs text-[#fbf3f2] focus:outline-hidden focus:border-[#c83a2a]"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* SLA Overdue checkbox */}
          <label className="flex items-center gap-2 text-xs font-semibold text-[#eed9d6] px-3 py-2 rounded-xl bg-[#120a0a] border border-[#382222] cursor-pointer select-none shrink-0">
            <input
              type="checkbox"
              checked={onlyOverdue}
              onChange={(e) => setOnlyOverdue(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#c83a2a] rounded cursor-pointer"
            />
            <span className="text-[#fca58f] font-bold">Only Overdue SLA</span>
          </label>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#2d1b1b] text-xs">
          <span className="text-[#8f7471] font-medium mr-1 text-[11px] uppercase tracking-wider">
            Status:
          </span>
          {[
            { id: 'all', label: 'All' },
            { id: 'submitted', label: 'Submitted' },
            { id: 'under_review', label: 'Under Review' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'resolved', label: 'Resolved' },
            { id: 'rejected', label: 'Rejected' },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#c83a2a] text-white font-semibold shadow-[0_0_10px_rgba(200,58,42,0.4)]'
                    : 'bg-[#201313] hover:bg-[#2c1919] text-[#eed9d6] border border-[#382222]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-[#171010] rounded-2xl border border-[#382222] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#100a0a] border-b border-[#2d1b1b] text-[#8f7471] uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Tracking ID</th>
                <th className="py-3 px-4">Grievance Subject</th>
                <th className="py-3 px-4">Category / Dept</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Officer</th>
                <th className="py-3 px-4">SLA Deadline</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#261616]">
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#7d6562] font-mono">
                    No grievances found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((complaint) => {
                  const statusInfo = getStatusInfo(complaint.status);
                  const prioInfo = getPriorityInfo(complaint.priority);
                  const sla = getSlaStatus(complaint.slaDeadline, complaint.status);

                  return (
                    <tr
                      key={complaint.id}
                      onClick={() => openDrawer(complaint)}
                      className="hover:bg-[#201313] cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#fca58f] whitespace-nowrap">
                        {complaint.id}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-[#fbf3f2] truncate">
                          {complaint.title}
                        </div>
                        <div className="text-[11px] text-[#8f7471] truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#7d6562] shrink-0" />
                          <span>{complaint.location}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-[180px]">
                        <div className="font-medium text-[#eed9d6] truncate">
                          {complaint.category}
                        </div>
                        <div className="text-[10px] text-[#8f7471] truncate">
                          {complaint.department}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${prioInfo.bg} ${prioInfo.text} ${prioInfo.border}`}
                        >
                          {prioInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border flex items-center gap-1.5 w-fit ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#c2a8a5] whitespace-nowrap">
                        {complaint.assignedOfficer ? (
                          <span className="font-medium text-[#eed9d6]">{complaint.assignedOfficer.name}</span>
                        ) : (
                          <span className="text-[#634c4a] italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                        <span
                          className={
                            sla.isOverdue
                              ? 'text-[#fca58f] font-bold'
                              : sla.isUrgent
                              ? 'text-amber-400 font-semibold'
                              : 'text-[#8f7471]'
                          }
                        >
                          {sla.text}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDrawer(complaint);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#241515] hover:bg-[#331c1c] text-[#fca58f] border border-[#422525] font-medium text-[11px] transition-colors cursor-pointer"
                        >
                          Triage & Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer / Triage Modal */}
      <AnimatePresence>
        {selectedComplaint && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl bg-[#171010] border-l border-[#382222] min-h-screen shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-y-auto text-[#fbf3f2]"
            >
              {/* Drawer Top */}
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#2d1b1b]">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-mono font-bold text-[#fca58f] bg-[#2a1313] px-2.5 py-0.5 rounded border border-[#522525]">
                      {selectedComplaint.id}
                    </span>
                    {(() => {
                      const statusInfo = getStatusInfo(selectedComplaint.status);
                      return (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          {statusInfo.label}
                        </span>
                      );
                    })()}
                  </div>

                  <button
                    onClick={() => setSelectedComplaint(null)}
                    className="p-1.5 rounded-lg text-[#8f7471] hover:text-[#fbf3f2] hover:bg-[#281515] transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {updateSuccessMsg && (
                  <div className="p-3 rounded-xl bg-[#0f241a] border border-[#1d4d38] text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{updateSuccessMsg}</span>
                  </div>
                )}

                {/* Grievance Core Info */}
                <div>
                  <h2 className="text-lg font-bold text-[#fbf3f2] leading-snug">
                    {selectedComplaint.title}
                  </h2>
                  <p className="text-xs text-[#c2a8a5] mt-1 font-mono">
                    Registered: {formatDate(selectedComplaint.createdAt)} • Category: {selectedComplaint.category}
                  </p>
                </div>

                {/* Complainant & Location details */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-[#100a0a] p-4 rounded-xl border border-[#301c1c]">
                  <div>
                    <span className="text-[#8f7471] font-mono uppercase text-[10px] block">Citizen / Complainant</span>
                    <span className="font-semibold text-[#fbf3f2] block mt-0.5">
                      {selectedComplaint.complainant.isAnonymous ? 'Anonymous' : selectedComplaint.complainant.name}
                    </span>
                    {selectedComplaint.complainant.phone && (
                      <span className="text-[#c2a8a5] block">{selectedComplaint.complainant.phone}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[#8f7471] font-mono uppercase text-[10px] block">Location</span>
                    <span className="font-semibold text-[#fbf3f2] block mt-0.5">
                      {selectedComplaint.location}
                    </span>
                    {selectedComplaint.landmark && (
                      <span className="text-[#c2a8a5] block">Near: {selectedComplaint.landmark}</span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#eed9d6] block mb-1.5">
                    Grievance Statement
                  </span>
                  <div className="p-3.5 bg-[#100a0a] border border-[#301c1c] rounded-xl text-xs text-[#fbf3f2] leading-relaxed whitespace-pre-line">
                    {selectedComplaint.description}
                  </div>
                </div>

                {/* Status Triage Form */}
                <div className="bg-[#120a0a] border border-[#301c1c] rounded-xl p-4 sm:p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#eed9d6] flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-[#c83a2a]" />
                    Update Case Status & Official Remarks
                  </h3>

                  <form onSubmit={handleUpdateStatusSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {(['under_review', 'in_progress', 'resolved', 'rejected'] as ComplaintStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setNewStatus(st)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold capitalize transition-all border cursor-pointer ${
                            newStatus === st
                              ? 'bg-[#c83a2a] text-white border-[#db4837] shadow-[0_0_10px_rgba(200,58,42,0.4)]'
                              : 'bg-[#1e1212] text-[#eed9d6] border-[#382222] hover:bg-[#2c1818]'
                          }`}
                        >
                          {st.replace('_', ' ')}
                        </button>
                      ))}
                    </div>

                    {newStatus === 'resolved' && (
                      <div>
                        <label className="block text-xs font-semibold text-[#eed9d6] mb-1">
                          Action Taken by Field Personnel: <span className="text-[#c83a2a]">*</span>
                        </label>
                        <input
                          type="text"
                          value={actionTaken}
                          onChange={(e) => setActionTaken(e.target.value)}
                          placeholder="e.g., Replacement of damaged pipe section; pressure verified normal."
                          className="w-full px-3 py-2 bg-[#171010] border border-[#382222] rounded-lg text-xs text-[#fbf3f2] focus:outline-hidden focus:border-[#c83a2a]"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-[#eed9d6] mb-1">
                        Official Officer Remarks / Citizen Notification Note:
                      </label>
                      <textarea
                        rows={2}
                        value={statusRemarks}
                        onChange={(e) => setStatusRemarks(e.target.value)}
                        placeholder="Log internal update or message sent to citizen..."
                        className="w-full px-3 py-2 bg-[#171010] border border-[#382222] rounded-lg text-xs text-[#fbf3f2] focus:outline-hidden focus:border-[#c83a2a]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isUpdatingStatus}
                      className="w-full py-2.5 rounded-xl bg-[#c83a2a] hover:bg-[#db4837] disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-[0_0_15px_rgba(200,58,42,0.3)] cursor-pointer"
                    >
                      {isUpdatingStatus ? 'Saving Status Update...' : 'Commit Status Change'}
                    </button>
                  </form>
                </div>

                {/* Officer Allocation */}
                <div className="bg-[#120a0a] border border-[#301c1c] rounded-xl p-4 sm:p-5 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#eed9d6] flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-[#c83a2a]" />
                    Assign Field Officer / Engineer
                  </h3>

                  <form onSubmit={handleAssignOfficerSubmit} className="space-y-3">
                    <select
                      value={selectedOfficerIndex}
                      onChange={(e) => setSelectedOfficerIndex(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#171010] border border-[#382222] rounded-lg text-xs text-[#fbf3f2] focus:outline-hidden focus:border-[#c83a2a]"
                    >
                      {OFFICER_DIRECTORY.map((officer, i) => (
                        <option key={officer.name} value={i} className="bg-[#171010] text-[#fbf3f2]">
                          {officer.name} — {officer.designation} ({officer.department})
                        </option>
                      ))}
                    </select>

                    <button
                      type="submit"
                      disabled={isAssigning}
                      className="w-full py-2.5 rounded-xl bg-[#241515] hover:bg-[#331c1c] disabled:opacity-50 text-[#fca58f] border border-[#482828] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {isAssigning ? 'Assigning Officer...' : 'Assign Field Officer'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Drawer Bottom Close */}
              <div className="pt-6 border-t border-[#2d1b1b] mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#c2a8a5] hover:text-[#fbf3f2] hover:bg-[#251515] border border-[#382222] transition-colors cursor-pointer"
                >
                  Close Drawer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
