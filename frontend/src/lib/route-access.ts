import type { Permission, Role, User } from "./types";

/**
 * Route → access specification.
 *
 * Each dashboard sub-path declares the roles allowed and, for ADMIN users, the
 * module permission required. Used by the client-side RouteGuard to block deep
 * links a role/permission shouldn't reach (the backend already enforces this on
 * the API; this prevents the page from rendering at all).
 */
interface RouteAccess {
  /** Roles permitted to view the route. Empty = all authenticated. */
  roles?: Role[];
  /** Module permission required (only enforced for ADMIN users). */
  permission?: Permission;
}

/** Prefix match: the longest matching prefix wins. */
const ROUTE_ACCESS: Record<string, RouteAccess> = {
  "/dashboard/complaints": {
    roles: ["ADMIN", "DEPARTMENT_HOD", "PERMANENT_SECRETARY", "COMMISSIONER", "AUDITOR"],
    permission: "COMPLAINTS",
  },
  "/dashboard/queue": { roles: ["DEPARTMENT_STAFF"] },
  "/dashboard/intake": { roles: ["ADMIN"], permission: "INTAKE" },
  "/dashboard/triage": { roles: ["ADMIN"], permission: "SCHEDULE" },
  "/dashboard/approvals": {
    roles: ["DEPARTMENT_HOD", "PERMANENT_SECRETARY", "COMMISSIONER"],
  },
  "/dashboard/users": { roles: ["ADMIN"], permission: "USERS" },
  "/dashboard/departments": { roles: ["ADMIN"], permission: "DEPARTMENTS" },
  "/dashboard/reopened": { roles: ["ADMIN"], permission: "COMPLAINTS" },
  "/dashboard/archive": { roles: ["ADMIN", "AUDITOR"] },
  "/dashboard/sla": { roles: ["ADMIN", "AUDITOR"] },
  "/dashboard/sla-config": { roles: ["ADMIN"], permission: "SLA" },
  "/dashboard/reports": { roles: ["ADMIN", "AUDITOR"], permission: "REPORTS" },
  "/dashboard/logs": { roles: ["AUDITOR", "ADMIN"], permission: "AUDIT" },
  "/dashboard/timeline": { roles: ["ADMIN", "AUDITOR"], permission: "AUDIT" },
  "/dashboard/routing": { roles: ["ADMIN"], permission: "ROUTING" },
  "/dashboard/profile": {}, // any authenticated user
};

/** Returns true if the user may view the given pathname. */
export function canAccessRoute(user: User | null | undefined, pathname: string): boolean {
  if (!user) return false;
  // Find the longest matching access rule.
  let match: RouteAccess | undefined;
  let matchLen = -1;
  for (const [prefix, spec] of Object.entries(ROUTE_ACCESS)) {
    if (pathname.startsWith(prefix) && prefix.length > matchLen) {
      match = spec;
      matchLen = prefix.length;
    }
  }
  if (!match) return true; // /dashboard itself or unknown → allow (page decides).

  // Role gate.
  if (match.roles && match.roles.length > 0 && !match.roles.includes(user.role)) {
    return false;
  }
  // Permission gate (ADMIN only; super admin bypasses).
  if (match.permission && user.role === "ADMIN") {
    if (user.isSuperAdmin) return true;
    if (user.permissions?.includes("ALL")) return true;
    if (!user.permissions?.includes(match.permission)) return false;
  }
  return true;
}
