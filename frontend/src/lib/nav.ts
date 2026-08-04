import type { Permission, Role, User } from "./types";

export interface NavItem {
  label: string;
  href: string;
  /** Icon key in the ICONS map. */
  icon: string;
  /** Section this item belongs to. */
  section: string;
}

export interface NavSection {
  key: string;
  label: string;
}

/**
 * Section definitions in display order.
 */
export const NAV_SECTIONS: NavSection[] = [
  { key: "main", label: "Main" },
  { key: "work", label: "Work" },
  { key: "management", label: "Management" },
  { key: "monitoring", label: "Monitoring" },
  { key: "configuration", label: "Configuration" },
];

/**
 * Role → landing route. `/dashboard` redirects by role, but we keep explicit
 * per-role defaults so login can deep-link straight to the right module.
 */
export const ROLE_LANDING_ROUTE: Partial<Record<Role, string>> = {
  DEPARTMENT_STAFF: "/dashboard/queue",
  DEPARTMENT_HOD: "/dashboard/complaints",
  PERMANENT_SECRETARY: "/dashboard/approvals",
  COMMISSIONER: "/dashboard/approvals",
  ADMIN: "/dashboard",
  AUDITOR: "/dashboard/reports",
};

/**
 * Internal nav model. Each item lists the roles allowed to see it and an
 * optional module permission (only enforced for ADMIN users). Non-ADMIN roles
 * pass the role check; ADMIN users additionally need the permission.
 */
interface NavSpec extends NavItem {
  roles: Role[];
  permission?: Permission;
}

const NAV_ITEMS: NavSpec[] = [
  // ── Main ──
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "dashboard",
    section: "main",
    // Admin overview dashboard. Staff/HOD land directly on their work views;
    // PS/Commissioner land on approvals; Auditor on reports.
    roles: ["ADMIN"],
  },
  {
    label: "All Complaints",
    href: "/dashboard/complaints",
    icon: "clipboard",
    section: "main",
    // Admin oversight + read-only audit roles. HOD/Staff see their own scoped views below.
    roles: ["ADMIN", "PERMANENT_SECRETARY", "COMMISSIONER", "AUDITOR"],
    permission: "COMPLAINTS",
  },
  {
    label: "My Work",
    href: "/dashboard/queue",
    icon: "clipboard",
    section: "main",
    roles: ["DEPARTMENT_STAFF"],
  },
  {
    label: "Dept Complaints",
    href: "/dashboard/complaints",
    icon: "clipboard",
    section: "main",
    roles: ["DEPARTMENT_HOD"],
  },
  {
    label: "Timeline Audit",
    href: "/dashboard/timeline",
    icon: "scroll",
    section: "main",
    roles: ["ADMIN", "AUDITOR"],
    permission: "AUDIT",
  },

  // ── Work ──
  {
    label: "Intake",
    href: "/dashboard/intake",
    icon: "inbox",
    section: "work",
    roles: ["ADMIN"],
    permission: "INTAKE",
  },
  {
    label: "Classify & Review",
    href: "/dashboard/triage",
    icon: "inbox",
    section: "work",
    roles: ["ADMIN"],
    permission: "SCHEDULE",
  },
  {
    label: "Approvals Inbox",
    href: "/dashboard/approvals",
    icon: "checkCircle",
    section: "work",
    // Approvers + admin oversight. Staff do NOT see approvals.
    roles: ["DEPARTMENT_HOD", "PERMANENT_SECRETARY", "COMMISSIONER"],
  },

  // ── Management ──
  {
    label: "Users",
    href: "/dashboard/users",
    icon: "users",
    section: "management",
    roles: ["ADMIN"],
    permission: "USERS",
  },
  {
    label: "Departments",
    href: "/dashboard/departments",
    icon: "building",
    section: "management",
    roles: ["ADMIN"],
    permission: "DEPARTMENTS",
  },
  {
    label: "Reopened",
    href: "/dashboard/reopened",
    icon: "refresh",
    section: "management",
    roles: ["ADMIN"],
    permission: "COMPLAINTS",
  },
  {
    label: "Archive",
    href: "/dashboard/archive",
    icon: "archive",
    section: "management",
    roles: ["ADMIN", "AUDITOR"],
  },

  // ── Monitoring ──
  {
    label: "Deadlines",
    href: "/dashboard/sla",
    icon: "clock",
    section: "monitoring",
    roles: ["ADMIN", "AUDITOR"],
    permission: "SLA",
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: "chart",
    section: "monitoring",
    roles: ["ADMIN", "AUDITOR"],
    permission: "REPORTS",
  },
  {
    label: "Audit Log",
    href: "/dashboard/logs",
    icon: "scroll",
    section: "monitoring",
    roles: ["AUDITOR", "ADMIN"],
    permission: "AUDIT",
  },

  // ── Configuration ──
  {
    label: "Routing Rules",
    href: "/dashboard/routing",
    icon: "route",
    section: "configuration",
    roles: ["ADMIN"],
    permission: "ROUTING",
  },
  {
    label: "Deadline Config",
    href: "/dashboard/sla-config",
    icon: "settings",
    section: "configuration",
    roles: ["ADMIN"],
    permission: "SLA",
  },
];

/** Resolve the visible nav items for a user (role + permission filtered). */
export function getNavItems(user: User | null | undefined): NavItem[] {
  if (!user) return [];
  const hasAll = user.isSuperAdmin || user.permissions?.includes("ALL");
  return NAV_ITEMS.filter((item) => {
    if (!item.roles.includes(user.role)) return false;
    // Non-admin roles don't need a permission check.
    if (user.role !== "ADMIN") return true;
    if (hasAll) return true;
    if (!item.permission) return true;
    return user.permissions?.includes(item.permission) ?? false;
  }).map(({ roles, permission, ...rest }) => rest);
}

/** Legacy per-role nav map, kept for the Sidebar's current contract. */
export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  DEPARTMENT_STAFF: [
    { label: "My Work", href: "/dashboard/queue", icon: "clipboard", section: "main" },
  ],
  DEPARTMENT_HOD: [
    { label: "Dept Complaints", href: "/dashboard/complaints", icon: "clipboard", section: "main" },
    { label: "Approvals", href: "/dashboard/approvals", icon: "checkCircle", section: "work" },
  ],
  PERMANENT_SECRETARY: [
    { label: "Approvals Inbox", href: "/dashboard/approvals", icon: "inbox", section: "work" },
  ],
  COMMISSIONER: [
    { label: "Approvals Inbox", href: "/dashboard/approvals", icon: "inbox", section: "work" },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard", section: "main" },
    { label: "All Complaints", href: "/dashboard/complaints", icon: "clipboard", section: "main" },
  ],
  AUDITOR: [
    { label: "Timeline Audit", href: "/dashboard/timeline", icon: "scroll", section: "main" },
    { label: "Audit Log", href: "/dashboard/logs", icon: "scroll", section: "work" },
    { label: "Reports", href: "/dashboard/reports", icon: "chart", section: "monitoring" },
  ],
};

export const ROLE_LABELS: Record<Role, string> = {
  DEPARTMENT_STAFF: "Department Staff",
  DEPARTMENT_HOD: "Department HOD",
  PERMANENT_SECRETARY: "Permanent Secretary",
  COMMISSIONER: "Commissioner",
  ADMIN: "Administrator",
  AUDITOR: "Auditor",
};

/**
 * Map a pathname to a page title for breadcrumbs.
 */
export function getPageTitle(pathname: string): string {
  const allItems = Object.values(NAV_BY_ROLE).flat();
  const match = allItems.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );
  if (match) return match.label;
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "Dashboard";
  const last = segments[segments.length - 1];
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, " ");
}
