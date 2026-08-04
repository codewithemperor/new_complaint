"use client";

import { ApprovalInbox } from "@/components/ApprovalInbox";
import { useSession } from "@/lib/session";

/**
 * Unified Approvals Inbox.
 *
 *  - DEPARTMENT_HOD / PERMANENT_SECRETARY / COMMISSIONER: their own tier only.
 *  - Super Admin: a single inbox spanning all tiers (one API call).
 *  - Other roles (including ADMIN without APPROVALS): no access message.
 */
export default function ApprovalsPage() {
  const { user } = useSession();

  // Super Admin sees every tier in one call.
  if (user?.isSuperAdmin) {
    return (
      <ApprovalInbox
        tier="DEPARTMENT_HOD"
        allTiers
        title="All Approvals"
        inboxRoute="/dashboard/approvals"
      />
    );
  }

  // HOD / PS / Commissioner see only their tier.
  if (user?.role === "DEPARTMENT_HOD") {
    return (
      <ApprovalInbox
        tier="DEPARTMENT_HOD"
        title="Department HOD Approvals"
        inboxRoute="/dashboard/approvals"
      />
    );
  }
  if (user?.role === "PERMANENT_SECRETARY") {
    return (
      <ApprovalInbox
        tier="PERMANENT_SECRETARY"
        title="Permanent Secretary Approvals"
        inboxRoute="/dashboard/approvals"
      />
    );
  }
  if (user?.role === "COMMISSIONER") {
    return (
      <ApprovalInbox
        tier="COMMISSIONER"
        title="Commissioner Approvals"
        inboxRoute="/dashboard/approvals"
      />
    );
  }

  return (
    <div className="p-6 text-sm text-muted-foreground">
      You do not have access to approvals.
    </div>
  );
}
