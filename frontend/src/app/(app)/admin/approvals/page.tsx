"use client";

import { ApprovalInbox } from "@/components/ApprovalInbox";

/**
 * SUPER_ADMIN approvals inbox — multi-tier oversight.
 * Renders three ApprovalInbox components stacked (one per tier) so the
 * Super Admin can step in at any level: HOD (Director), PS, or Commissioner.
 */
export default function AdminApprovalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-800">
          All Approvals
        </h1>
        <p className="text-sm text-neutral-500">
          Multi-tier approval oversight — Director, Permanent Secretary, and
          Commissioner queues.
        </p>
      </div>

      <ApprovalInbox
        tier="DIRECTOR"
        title="Director (HOD) Approvals"
        inboxRoute="/admin/approvals"
      />

      <ApprovalInbox
        tier="PERMANENT_SECRETARY"
        title="Permanent Secretary Approvals"
        inboxRoute="/admin/approvals"
      />

      <ApprovalInbox
        tier="COMMISSIONER"
        title="Commissioner Approvals"
        inboxRoute="/admin/approvals"
      />
    </div>
  );
}
