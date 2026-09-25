export type ComplaintCategory =
  | 'Electrical'
  | 'Water & Plumbing'
  | 'Internet & Network'
  | 'Hostel Maintenance'
  | 'Cleaning'
  | 'Transport'
  | 'Fees & Finance'
  | 'Examination'
  | 'Safety'
  | 'General'
  | 'Municipal Services'
  | 'Water Supply'
  | 'Electricity & Power'
  | 'Roads & Infrastructure'
  | 'Waste Management'
  | 'Public Safety'
  | 'Billing & Accounts'
  | 'Healthcare & Sanitation'
  | 'Other';

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'critical';

export type ComplaintStatus =
  | 'submitted'
  | 'under_review'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  status: ComplaintStatus;
  actor: 'Citizen' | 'Grievance Officer' | 'Department Head' | 'System';
  actorName?: string;
  message: string;
  type: 'status_change' | 'comment' | 'assignment' | 'resolution' | 'reopened';
  attachmentName?: string;
}

export interface ComplaintAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  previewUrl?: string;
}

export interface ResolutionDetails {
  resolvedAt: string;
  resolvedBy: string;
  department: string;
  actionTaken: string;
  resolutionNotes: string;
  evidencePhoto?: string;
}

export interface CitizenFeedback {
  rating: number; // 1 to 5
  comment: string;
  submittedAt: string;
}

export interface ComplainantInfo {
  name: string;
  email: string;
  phone: string;
  isAnonymous: boolean;
  address?: string;
  city?: string;
}

export interface AssignedOfficer {
  name: string;
  department: string;
  designation: string;
  contactEmail: string;
}

export interface Complaint {
  id: string; // e.g. CMS-2026-4029
  title: string;
  description: string;
  category: ComplaintCategory;
  department: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  location: string;
  landmark?: string;
  createdAt: string;
  updatedAt: string;
  slaDeadline: string; // ISO string
  complainant: ComplainantInfo;
  assignedOfficer?: AssignedOfficer;
  attachments: ComplaintAttachment[];
  timeline: TimelineEvent[];
  resolution?: ResolutionDetails;
  feedback?: CitizenFeedback;
}

export interface SessionState {
  admin: boolean;
  user?: string;
  role?: string;
  department?: string;
  loginTime?: string;
  sessionId?: string;
}

export interface AuthLog {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST';
  path: string;
  status: number;
  statusText: string;
  details: string;
  success: boolean;
}

export interface ComplaintFilters {
  search: string;
  status: string; // 'all' | ComplaintStatus
  category: string; // 'all' | ComplaintCategory
  priority: string; // 'all' | ComplaintPriority
  department: string; // 'all' | specific
}
