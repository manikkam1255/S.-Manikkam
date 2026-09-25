import { Complaint, ComplaintStatus, TimelineEvent, CitizenFeedback, ResolutionDetails, AssignedOfficer } from '../types';
import { INITIAL_COMPLAINTS } from '../data/initialComplaints';

const STORAGE_KEY = 'cms_complaints_v1';
const SESSION_KEY = 'cms_admin_session_v1';

export function loadComplaints(): Complaint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMPLAINTS));
      return INITIAL_COMPLAINTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_COMPLAINTS;
  } catch (e) {
    console.error('Failed to load complaints from localStorage', e);
    return INITIAL_COMPLAINTS;
  }
}

export function saveComplaints(complaints: Complaint[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
  } catch (e) {
    console.error('Failed to persist complaints', e);
  }
}

export function generateComplaintId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `#CMP${randomNum}`;
}

export function findComplaintById(searchId: string, list?: Complaint[]): Complaint | undefined {
  const complaints = list || loadComplaints();
  if (!searchId || !searchId.trim()) return undefined;

  const normalized = searchId.trim().toUpperCase().replace(/^#/, '');

  return complaints.find((c) => {
    const cId = c.id.toUpperCase().replace(/^#/, '');
    if (cId === normalized) return true;
    if (c.id.toUpperCase() === searchId.trim().toUpperCase()) return true;
    // Also match if user just entered the digits
    const digitsOnlySearch = searchId.replace(/\D/g, '');
    const digitsOnlyId = c.id.replace(/\D/g, '');
    if (digitsOnlySearch && digitsOnlyId && digitsOnlySearch === digitsOnlyId) return true;
    return false;
  });
}

export function addComplaint(
  newComplaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'timeline' | 'slaDeadline'> & {
    slaDeadline?: string;
  }
): Complaint {
  const complaints = loadComplaints();
  const id = generateComplaintId();
  const now = new Date().toISOString();

  // Standard SLA: 48 hours for normal, 24 for high, 12 for critical
  let slaHours = 48;
  if (newComplaint.priority === 'critical') slaHours = 12;
  else if (newComplaint.priority === 'high') slaHours = 24;
  else if (newComplaint.priority === 'low') slaHours = 72;

  const slaDeadline = new Date(Date.now() + slaHours * 3600 * 1000).toISOString();

  const initialTimelineEvent: TimelineEvent = {
    id: `evt-${Date.now()}`,
    timestamp: now,
    status: 'submitted',
    actor: 'Citizen',
    actorName: newComplaint.complainant.isAnonymous ? 'Anonymous Citizen' : newComplaint.complainant.name,
    message: 'Grievance submitted through the Citizen Online Redressal Portal.',
    type: 'status_change',
  };

  const createdComplaint: Complaint = {
    ...newComplaint,
    id,
    createdAt: now,
    updatedAt: now,
    slaDeadline: newComplaint.slaDeadline || slaDeadline,
    timeline: [initialTimelineEvent],
  };

  const updatedList = [createdComplaint, ...complaints];
  saveComplaints(updatedList);
  return createdComplaint;
}

export function updateComplaintStatus(
  complaintId: string,
  newStatus: ComplaintStatus,
  actorName: string,
  officerRemarks: string,
  resolutionDetails?: Partial<ResolutionDetails>
): Complaint | null {
  const complaints = loadComplaints();
  const index = complaints.findIndex((c) => c.id === complaintId);
  if (index === -1) return null;

  const complaint = { ...complaints[index] };
  const now = new Date().toISOString();

  const timelineEvent: TimelineEvent = {
    id: `evt-${Date.now()}`,
    timestamp: now,
    status: newStatus,
    actor: 'Grievance Officer',
    actorName: actorName || 'Grievance Officer',
    message: officerRemarks || `Complaint status updated to "${newStatus.replace('_', ' ').toUpperCase()}".`,
    type: newStatus === 'resolved' ? 'resolution' : 'status_change',
  };

  complaint.status = newStatus;
  complaint.updatedAt = now;
  complaint.timeline = [...complaint.timeline, timelineEvent];

  if (newStatus === 'resolved') {
    complaint.resolution = {
      resolvedAt: now,
      resolvedBy: actorName || 'Grievance Redressal Officer',
      department: complaint.department,
      actionTaken: resolutionDetails?.actionTaken || 'Action completed in accordance with municipal standards.',
      resolutionNotes: resolutionDetails?.resolutionNotes || officerRemarks || 'Issue resolved successfully.',
      evidencePhoto: resolutionDetails?.evidencePhoto,
    };
  }

  complaints[index] = complaint;
  saveComplaints(complaints);
  return complaint;
}

export function assignComplaintOfficer(
  complaintId: string,
  officer: AssignedOfficer,
  assignedByName: string
): Complaint | null {
  const complaints = loadComplaints();
  const index = complaints.findIndex((c) => c.id === complaintId);
  if (index === -1) return null;

  const complaint = { ...complaints[index] };
  const now = new Date().toISOString();

  const timelineEvent: TimelineEvent = {
    id: `evt-${Date.now()}`,
    timestamp: now,
    status: complaint.status === 'submitted' ? 'in_progress' : complaint.status,
    actor: 'Department Head',
    actorName: assignedByName,
    message: `Assigned grievance to ${officer.name} (${officer.designation}, ${officer.department}).`,
    type: 'assignment',
  };

  complaint.assignedOfficer = officer;
  if (complaint.status === 'submitted') {
    complaint.status = 'in_progress';
  }
  complaint.updatedAt = now;
  complaint.timeline = [...complaint.timeline, timelineEvent];

  complaints[index] = complaint;
  saveComplaints(complaints);
  return complaint;
}

export function addCitizenComment(
  complaintId: string,
  message: string,
  citizenName: string
): Complaint | null {
  const complaints = loadComplaints();
  const index = complaints.findIndex((c) => c.id === complaintId);
  if (index === -1) return null;

  const complaint = { ...complaints[index] };
  const now = new Date().toISOString();

  const timelineEvent: TimelineEvent = {
    id: `evt-${Date.now()}`,
    timestamp: now,
    status: complaint.status,
    actor: 'Citizen',
    actorName: citizenName || 'Complainant',
    message,
    type: 'comment',
  };

  complaint.updatedAt = now;
  complaint.timeline = [...complaint.timeline, timelineEvent];

  complaints[index] = complaint;
  saveComplaints(complaints);
  return complaint;
}

export function submitCitizenFeedback(
  complaintId: string,
  feedback: CitizenFeedback
): Complaint | null {
  const complaints = loadComplaints();
  const index = complaints.findIndex((c) => c.id === complaintId);
  if (index === -1) return null;

  const complaint = { ...complaints[index] };
  const now = new Date().toISOString();

  complaint.feedback = feedback;
  complaint.updatedAt = now;

  const timelineEvent: TimelineEvent = {
    id: `evt-${Date.now()}`,
    timestamp: now,
    status: complaint.status,
    actor: 'Citizen',
    actorName: 'Complainant',
    message: `Citizen submitted feedback (${feedback.rating}/5 stars): "${feedback.comment || 'No comment provided'}"`,
    type: 'comment',
  };

  complaint.timeline = [...complaint.timeline, timelineEvent];

  complaints[index] = complaint;
  saveComplaints(complaints);
  return complaint;
}

export function resetToSampleComplaints(): Complaint[] {
  saveComplaints(INITIAL_COMPLAINTS);
  return INITIAL_COMPLAINTS;
}
