/**
 * Module permissions enum. Mirrors the Prisma `Permission` enum.
 *
 * Granular module access assignable to ADMIN users by a Super Admin. A Super
 * Admin (an ADMIN with isSuperAdmin = true) bypasses all permission checks.
 * An ADMIN granted ALL effectively has every permission.
 *
 * Duplicated here for the same reflection/SWC reason as Role (see role.ts).
 */
export enum Permission {
  ALL = 'ALL',
  INTAKE = 'INTAKE',
  SCHEDULE = 'SCHEDULE',
  COMPLAINTS = 'COMPLAINTS',
  REPORTS = 'REPORTS',
  USERS = 'USERS',
  DEPARTMENTS = 'DEPARTMENTS',
  ROUTING = 'ROUTING',
  SLA = 'SLA',
  AUDIT = 'AUDIT',
  APPROVALS = 'APPROVALS',
}
