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
    Role["INTAKE_OFFICER"] = "INTAKE_OFFICER";
    Role["ADMIN_OFFICER"] = "ADMIN_OFFICER";
    Role["SCHEDULE_OFFICER"] = "SCHEDULE_OFFICER";
    Role["ASSISTANT_DIRECTOR"] = "ASSISTANT_DIRECTOR";
    Role["DEPUTY_DIRECTOR"] = "DEPUTY_DIRECTOR";
    Role["DIRECTOR"] = "DIRECTOR";
    Role["PERMANENT_SECRETARY"] = "PERMANENT_SECRETARY";
    Role["COMMISSIONER"] = "COMMISSIONER";
    Role["SUPER_ADMIN"] = "SUPER_ADMIN";
    Role["AUDITOR"] = "AUDITOR";
    return Role;
}({});

//# sourceMappingURL=role.js.map