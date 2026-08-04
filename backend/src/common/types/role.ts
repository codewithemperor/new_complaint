/**
 * Staff roles enum. Mirrors the Prisma `Role` enum (generated/prisma/client).
 *
 * Duplicated here as a stable, reflection-friendly source because the Prisma 7
 * generated client is emitted as TS source (not compiled JS), and importing its
 * enum into DTOs confuses Swagger/class-validator metadata reflection. This
 * local enum is what DTOs and decorators reference; the Prisma enum is what the
 * DB stores. They are kept in sync manually (one value per role).
 *
 * Simplified role model:
 *  - ADMIN handles intake, scheduling, and general admin. Granular module
 *    access is controlled via the Permission enum + UserPermission rows.
 *  - A Super Admin is an ADMIN user with isSuperAdmin = true (bypasses all
 *    permission checks). There is no separate SUPER_ADMIN role.
 *
 * Escalation hierarchy (top-down):
 *   1. ADMIN → 2. DEPARTMENT_STAFF → 3. DEPARTMENT_HOD →
 *   4. PERMANENT_SECRETARY → 5. COMMISSIONER
 * AUDITOR has read-only access to all complaints and escalations.
 */
export enum Role {
  DEPARTMENT_STAFF = 'DEPARTMENT_STAFF',
  DEPARTMENT_HOD = 'DEPARTMENT_HOD',
  PERMANENT_SECRETARY = 'PERMANENT_SECRETARY',
  COMMISSIONER = 'COMMISSIONER',
  ADMIN = 'ADMIN',
  AUDITOR = 'AUDITOR',
}
