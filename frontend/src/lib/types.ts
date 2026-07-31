// Frontend type definitions mirroring backend DTOs.
// Keep in sync with backend/src DTOs.

export type Role =
  | "INTAKE_OFFICER"
  | "ADMIN_OFFICER"
  | "SCHEDULE_OFFICER"
  | "ASSISTANT_DIRECTOR"
  | "DEPUTY_DIRECTOR"
  | "DIRECTOR"
  | "PERMANENT_SECRETARY"
  | "COMMISSIONER"
  | "SUPER_ADMIN"
  | "AUDITOR";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  designation?: string | null;
  phone?: string | null;
  departmentId?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
}

/** Staff user (admin user-management view). Never includes password. */
export interface StaffUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  designation?: string | null;
  phone?: string | null;
  departmentId?: string | null;
  department?: { id: string; name: string; code: string } | null;
  isActive: boolean;
  lastLoginAt?: string | null;
}

export interface Ticket {
  id: string;
  ticketCode: string;
  status: string;
  category?: string | null;
  priority?: string | null;
  sensitivity?: string;
  subject: string;
  description: string;
  channel: string;
  lga?: string | null;
  departmentId?: string | null;
  assignedOfficerId?: string | null;
  awaiting?: string;
  // SLA snapshot fields (M4).
  slaStartedAt?: string | null;
  slaTargetHours?: number | null;
  slaDueAt?: string | null;
  slaBreached?: boolean;
  slaRemainingHours?: number | null;
  createdAt: string;
  updatedAt?: string | null;
  citizen?: { name?: string | null; email: string; phone?: string | null };
  department?: { id: string; name: string; code: string } | null;
  assignedOfficer?: {
    id: string;
    fullName: string;
    role?: string;
    designation?: string | null;
  } | null;
  // Investigation artefacts (staff detail view).
  minutes?: Minute[];
  movements?: (TimelineEntry & {
    fromUser?: { fullName: string; role: string } | null;
    toUser?: { fullName: string; role: string } | null;
  })[];
  approvalRequests?: ApprovalRequest[];
}

/** An append-only investigation minute (digital minute sheet). */
export interface Minute {
  id: string;
  body: string;
  isInternal: boolean;
  isResolutionDraft?: boolean;
  createdAt: string;
  author?: {
    id: string;
    fullName: string;
    role: string;
    designation?: string | null;
  } | null;
}

/** An in-flight approval request along the HOD → PS → Commissioner chain. */
export interface ApprovalRequest {
  id: string;
  status: string;
  approverRole?: string;
  currentApproverId?: string | null;
  decision?: string | null;
  referredBody?: string | null;
  note?: string | null;
  createdAt: string;
  decidedAt?: string | null;
  ticket?: {
    id: string;
    ticketCode: string;
    subject: string;
    priority?: string | null;
    status: string;
    department?: { name: string } | null;
    assignedOfficer?: { fullName: string } | null;
    minutes?: { body: string }[];
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RoutingRule {
  id: string;
  category: string;
  priority?: string | null;
  lga?: string | null;
  departmentId: string;
  department?: { id: string; name: string; code: string };
  defaultOfficerId?: string | null;
  priorityRank: number;
  isActive: boolean;
}

export interface TimelineEntry {
  id: string;
  type: string;
  note?: string | null;
  createdAt: string;
  fromUserId?: string | null;
  toUserId?: string | null;
}
