// Frontend type definitions mirroring backend DTOs.
// Keep in sync with backend/src DTOs.

export type Role =
  | "DEPARTMENT_STAFF"
  | "DEPARTMENT_HOD"
  | "PERMANENT_SECRETARY"
  | "COMMISSIONER"
  | "ADMIN"
  | "AUDITOR";

/**
 * Granular module permissions assignable to ADMIN users. A Super Admin (ADMIN
 * with isSuperAdmin = true) bypasses all checks; ALL grants every module.
 */
export type Permission =
  | "ALL"
  | "INTAKE"
  | "SCHEDULE"
  | "COMPLAINTS"
  | "REPORTS"
  | "USERS"
  | "DEPARTMENTS"
  | "ROUTING"
  | "SLA"
  | "AUDIT"
  | "APPROVALS";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  designation?: string | null;
  phone?: string | null;
  departmentId?: string | null;
  isActive: boolean;
  isSuperAdmin: boolean;
  permissions: Permission[];
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
  isSuperAdmin: boolean;
  permissions: Permission[];
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
  closedAt?: string | null;
  closedReason?: string | null;
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
  feedback?: { satisfied: boolean; createdAt?: string | null } | null;
  // Investigation artefacts (staff detail view).
  minutes?: Minute[];
  movements?: (TimelineEntry & {
    fromUser?: { fullName: string; role: string } | null;
    toUser?: { fullName: string; role: string } | null;
  })[];
  approvalRequests?: ApprovalRequest[];
  // Attached evidence/resolution documents (staff detail view).
  attachments?: TicketAttachment[];
}

/** An uploaded file attached to a ticket (evidence or resolution). */
export interface TicketAttachment {
  id: string;
  filename: string;
  storedPath: string;
  url?: string;
  mimetype: string;
  sizeBytes?: number;
  kind?: string;
  uploadedAt?: string;
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
