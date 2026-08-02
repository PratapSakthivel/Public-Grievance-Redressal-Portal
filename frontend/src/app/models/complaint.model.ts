export type ComplaintStatus = 'FILED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'REOPENED' | 'CLOSED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TimelineEntry {
  id: number;
  oldStatus?: ComplaintStatus;
  newStatus: ComplaintStatus;
  remarks: string;
  actorId: number;
  actorName: string;
  actorRole: string;
  createdAt: string;
}

export interface Complaint {
  id: number;
  title: string;
  description: string;
  category: string;
  pincode: string;
  areaName?: string;
  status: ComplaintStatus;
  priority: Priority;
  upvoteCount: number;
  hasUpvoted: boolean;
  citizenId: number;
  citizenName: string;
  departmentId: number;
  departmentName: string;
  assignedOfficerId?: number;
  assignedOfficerName?: string;
  createdAt: string;
  updatedAt: string;
  timeline?: TimelineEntry[];
}
