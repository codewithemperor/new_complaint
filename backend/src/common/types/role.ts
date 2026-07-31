/**
 * Staff roles enum. Mirrors the Prisma `Role` enum (generated/prisma/client).
 *
 * Duplicated here as a stable, reflection-friendly source because the Prisma 7
 * generated client is emitted as TS source (not compiled JS), and importing its
 * enum into DTOs confuses Swagger/class-validator metadata reflection. This
 * local enum is what DTOs and decorators reference; the Prisma enum is what the
 * DB stores. They are kept in sync manually (one value per role).
 *
 * See planning/02-roles-rbac.md for the full role-action matrix.
 */
export enum Role {
  INTAKE_OFFICER = 'INTAKE_OFFICER',
  ADMIN_OFFICER = 'ADMIN_OFFICER',
  SCHEDULE_OFFICER = 'SCHEDULE_OFFICER',
  ASSISTANT_DIRECTOR = 'ASSISTANT_DIRECTOR',
  DEPUTY_DIRECTOR = 'DEPUTY_DIRECTOR',
  DIRECTOR = 'DIRECTOR',
  PERMANENT_SECRETARY = 'PERMANENT_SECRETARY',
  COMMISSIONER = 'COMMISSIONER',
  SUPER_ADMIN = 'SUPER_ADMIN',
  AUDITOR = 'AUDITOR',
}
