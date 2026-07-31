import type { Role } from "./types";

export interface NavItem {
  label: string;
  href: string;
  /** Icon name referencing a key in ICONS map */
  icon: string;
  /** Section this item belongs to */
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
 * Role → landing route redirect mapping (planning/02-roles-rbac.md §5).
 */
export const ROLE_LANDING_ROUTE: Partial<Record<Role, string>> = {
  INTAKE_OFFICER: "/intake/dashboard",
  ADMIN_OFFICER: "/admin/dashboard",
  SCHEDULE_OFFICER: "/officer/dashboard",
  ASSISTANT_DIRECTOR: "/officer/dashboard",
  DEPUTY_DIRECTOR: "/officer/dashboard",
  DIRECTOR: "/hod/dashboard",
  PERMANENT_SECRETARY: "/ps/dashboard",
  COMMISSIONER: "/commissioner/dashboard",
  SUPER_ADMIN: "/admin/dashboard",
  AUDITOR: "/auditor/dashboard",
};

/**
 * Sidebar nav items per role, grouped by section.
 */
export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  INTAKE_OFFICER: [
    { label: "Dashboard", href: "/intake/dashboard", icon: "dashboard", section: "main" },
    { label: "Complaints", href: "/intake", icon: "clipboard", section: "main" },
  ],
  ADMIN_OFFICER: [
    { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard", section: "main" },
    { label: "Classify & Review", href: "/admin/triage", icon: "inbox", section: "work" },
    { label: "Reopened", href: "/admin/reopened", icon: "refresh", section: "management" },
    { label: "Archive", href: "/admin/archive", icon: "archive", section: "management" },
    { label: "Deadlines", href: "/admin/sla", icon: "clock", section: "monitoring" },
  ],
  SCHEDULE_OFFICER: [
    { label: "Dashboard", href: "/officer/dashboard", icon: "dashboard", section: "main" },
    { label: "My Work", href: "/officer/queue", icon: "clipboard", section: "work" },
  ],
  ASSISTANT_DIRECTOR: [
    { label: "Dashboard", href: "/officer/dashboard", icon: "dashboard", section: "main" },
    { label: "My Work", href: "/officer/queue", icon: "clipboard", section: "work" },
  ],
  DEPUTY_DIRECTOR: [
    { label: "Dashboard", href: "/officer/dashboard", icon: "dashboard", section: "main" },
    { label: "My Work", href: "/officer/queue", icon: "clipboard", section: "work" },
  ],
  DIRECTOR: [
    { label: "Dashboard", href: "/hod/dashboard", icon: "dashboard", section: "main" },
    { label: "Dept Complaints", href: "/hod/complaints", icon: "clipboard", section: "main" },
    { label: "Approvals", href: "/hod/approvals", icon: "checkCircle", section: "work" },
  ],
  PERMANENT_SECRETARY: [
    { label: "Dashboard", href: "/ps/dashboard", icon: "dashboard", section: "main" },
    { label: "Approvals Inbox", href: "/ps/inbox", icon: "inbox", section: "work" },
  ],
  COMMISSIONER: [
    { label: "Dashboard", href: "/commissioner/dashboard", icon: "dashboard", section: "main" },
    { label: "Approvals Inbox", href: "/commissioner/inbox", icon: "inbox", section: "work" },
  ],
  SUPER_ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard", section: "main" },
    { label: "All Complaints", href: "/admin/complaints", icon: "clipboard", section: "main" },
    { label: "Timeline Audit", href: "/admin/timeline", icon: "scroll", section: "main" },
    { label: "Classify & Review", href: "/admin/triage", icon: "inbox", section: "work" },
    { label: "Approvals Inbox", href: "/admin/approvals", icon: "checkCircle", section: "work" },
    { label: "Users", href: "/admin/users", icon: "users", section: "management" },
    { label: "Departments", href: "/admin/departments", icon: "building", section: "management" },
    { label: "Reopened", href: "/admin/reopened", icon: "refresh", section: "management" },
    { label: "Archive", href: "/admin/archive", icon: "archive", section: "management" },
    { label: "Deadlines", href: "/admin/sla", icon: "clock", section: "monitoring" },
    { label: "Reports", href: "/auditor/reports", icon: "chart", section: "monitoring" },
    { label: "Routing Rules", href: "/settings/routing", icon: "route", section: "configuration" },
    { label: "Deadline Config", href: "/settings/sla", icon: "settings", section: "configuration" },
  ],
  AUDITOR: [
    { label: "Dashboard", href: "/auditor/dashboard", icon: "dashboard", section: "main" },
    { label: "Timeline Audit", href: "/admin/timeline", icon: "scroll", section: "work" },
    { label: "Audit Log", href: "/auditor/logs", icon: "scroll", section: "work" },
    { label: "Reports", href: "/auditor/reports", icon: "chart", section: "monitoring" },
  ],
};

export const ROLE_LABELS: Record<Role, string> = {
  INTAKE_OFFICER: "Intake Officer",
  ADMIN_OFFICER: "Admin Officer",
  SCHEDULE_OFFICER: "Schedule Officer",
  ASSISTANT_DIRECTOR: "Assistant Director",
  DEPUTY_DIRECTOR: "Deputy Director",
  DIRECTOR: "Director (HOD)",
  PERMANENT_SECRETARY: "Permanent Secretary",
  COMMISSIONER: "Hon. Commissioner",
  SUPER_ADMIN: "Super Admin",
  AUDITOR: "Auditor",
};

/**
 * Map page title from pathname for breadcrumbs.
 */
export function getPageTitle(pathname: string): string {
  // Find a matching nav item across all roles
  for (const items of Object.values(NAV_BY_ROLE)) {
    const match = items.find(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    );
    if (match) return match.label;
  }
  // Fallback: derive from last path segment
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "Dashboard";
  const last = segments[segments.length - 1];
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, " ");
}
