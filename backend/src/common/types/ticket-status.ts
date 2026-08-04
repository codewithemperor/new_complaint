/**
 * Ticket status enum — local reflection-friendly copy.
 * Mirrors the Prisma-generated TicketStatus enum (generated/prisma/enums).
 *
 * Same rationale as Role: the Prisma 7 generated client is TS-source, and
 * importing its enum into DTOs confuses Swagger metadata reflection under SWC.
 * Kept in sync manually with the Prisma enum.
 *
 * See planning/03-ticket-workflow.md for the full transition table.
 */
export enum TicketStatus {
  SUBMITTED = 'SUBMITTED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  TRIAGED = 'TRIAGED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REOPENED = 'REOPENED',
  ESCALATED = 'ESCALATED',
  REFERRED = 'REFERRED',
}

export enum Channel {
  WEB = 'WEB',
  WALK_IN = 'WALK_IN',
  PHONE = 'PHONE',
  LETTER = 'LETTER',
  EMAIL = 'EMAIL',
}

export enum Priority {
  P1 = 'P1',
  P2 = 'P2',
  P3 = 'P3',
  P4 = 'P4',
}

export enum Sensitivity {
  NORMAL = 'NORMAL',
  SENSITIVE = 'SENSITIVE',
  CONFIDENTIAL = 'CONFIDENTIAL',
}

export enum MovementType {
  SUBMITTED = 'SUBMITTED',
  ROUTED = 'ROUTED',
  ASSIGNED = 'ASSIGNED',
  REASSIGNED = 'REASSIGNED',
  RETURNED = 'RETURNED',
  ESCALATED = 'ESCALATED',
  APPROVED = 'APPROVED',
  REFERRED = 'REFERRED',
  REOPENED = 'REOPENED',
  CLOSED = 'CLOSED',
  AUTO_ESCALATED = 'AUTO_ESCALATED',
}

/** What the ticket is currently waiting on (controls SLA pause). Mirrors Prisma enum. */
export enum AwaitingState {
  NONE = 'NONE',
  CITIZEN = 'CITIZEN',
  DEPARTMENT = 'DEPARTMENT',
  APPROVAL = 'APPROVAL',
}

/** The approval tier currently holding a request. Mirrors Prisma enum. */
export enum ApproverRole {
  DEPARTMENT_HOD = 'DEPARTMENT_HOD',
  PERMANENT_SECRETARY = 'PERMANENT_SECRETARY',
  COMMISSIONER = 'COMMISSIONER',
}

/** Decision recorded on an approval request. Mirrors Prisma enum. */
export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  RETURNED = 'RETURNED',
  ESCALATED = 'ESCALATED',
  REFERRED = 'REFERRED',
}
