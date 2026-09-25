import { Complaint, ComplaintPriority, ComplaintStatus } from '../types';

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function formatRelativeTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (3600 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 3600 * 1000));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(isoString);
  } catch {
    return isoString;
  }
}

export function getStatusInfo(status: ComplaintStatus): {
  label: string;
  bg: string;
  text: string;
  border: string;
  dotColor: string;
} {
  switch (status) {
    case 'submitted':
      return {
        label: 'Submitted',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dotColor: 'bg-blue-500',
      };
    case 'under_review':
      return {
        label: 'Under Review',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        dotColor: 'bg-purple-500',
      };
    case 'in_progress':
      return {
        label: 'In Progress',
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        dotColor: 'bg-amber-500',
      };
    case 'resolved':
      return {
        label: 'Resolved',
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
        dotColor: 'bg-emerald-500',
      };
    case 'rejected':
      return {
        label: 'Rejected',
        bg: 'bg-zinc-100',
        text: 'text-zinc-600',
        border: 'border-zinc-300',
        dotColor: 'bg-zinc-400',
      };
  }
}

export function getPriorityInfo(priority: ComplaintPriority): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (priority) {
    case 'critical':
      return {
        label: 'Critical',
        bg: 'bg-rose-100',
        text: 'text-rose-800',
        border: 'border-rose-300',
      };
    case 'high':
      return {
        label: 'High',
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
      };
    case 'medium':
      return {
        label: 'Medium',
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
      };
    case 'low':
      return {
        label: 'Low',
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
      };
  }
}

export function getSlaStatus(deadlineIso: string, status: ComplaintStatus): {
  isOverdue: boolean;
  text: string;
  isUrgent: boolean;
} {
  if (status === 'resolved' || status === 'rejected') {
    return { isOverdue: false, text: 'SLA Fulfilled', isUrgent: false };
  }

  const deadline = new Date(deadlineIso).getTime();
  const now = Date.now();
  const diffHours = (deadline - now) / (3600 * 1000);

  if (diffHours < 0) {
    const overdueHours = Math.abs(Math.round(diffHours));
    return {
      isOverdue: true,
      text: `SLA Overdue (${overdueHours}h)`,
      isUrgent: true,
    };
  }

  if (diffHours < 12) {
    return {
      isOverdue: false,
      text: `${Math.round(diffHours)}h SLA left`,
      isUrgent: true,
    };
  }

  const days = Math.round(diffHours / 24);
  return {
    isOverdue: false,
    text: days <= 1 ? `${Math.round(diffHours)}h remaining` : `${days}d remaining`,
    isUrgent: false,
  };
}

export function exportComplaintsToCSV(complaints: Complaint[]): void {
  const headers = [
    'Complaint ID',
    'Date Submitted',
    'Category',
    'Department',
    'Priority',
    'Status',
    'Title',
    'Location',
    'Complainant Name',
    'Complainant Phone',
    'Complainant Email',
    'Assigned Officer',
    'Resolved Date',
    'Citizen Rating',
  ];

  const rows = complaints.map((c) => [
    `"${c.id}"`,
    `"${formatDate(c.createdAt)}"`,
    `"${c.category}"`,
    `"${c.department}"`,
    `"${c.priority.toUpperCase()}"`,
    `"${c.status.toUpperCase()}"`,
    `"${c.title.replace(/"/g, '""')}"`,
    `"${c.location.replace(/"/g, '""')}"`,
    `"${c.complainant.isAnonymous ? 'Anonymous' : c.complainant.name.replace(/"/g, '""')}"`,
    `"${c.complainant.phone || ''}"`,
    `"${c.complainant.email || ''}"`,
    `"${c.assignedOfficer?.name || 'Unassigned'}"`,
    `"${c.resolution ? formatDate(c.resolution.resolvedAt) : 'N/A'}"`,
    `"${c.feedback ? c.feedback.rating + '/5' : 'N/A'}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `complaints_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
