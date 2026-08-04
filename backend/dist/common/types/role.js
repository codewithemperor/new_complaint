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
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Role", {
    enumerable: true,
    get: function() {
        return Role;
    }
});
var Role = /*#__PURE__*/ function(Role) {
    Role["DEPARTMENT_STAFF"] = "DEPARTMENT_STAFF";
    Role["DEPARTMENT_HOD"] = "DEPARTMENT_HOD";
    Role["PERMANENT_SECRETARY"] = "PERMANENT_SECRETARY";
    Role["COMMISSIONER"] = "COMMISSIONER";
    Role["ADMIN"] = "ADMIN";
    Role["AUDITOR"] = "AUDITOR";
    return Role;
}({});

//# sourceMappingURL=role.js.map