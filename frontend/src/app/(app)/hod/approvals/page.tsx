"use client";

import { ApprovalInbox } from "@/components/ApprovalInbox";

/** HOD approvals inbox — DIRECTOR tier: Approve / Return / Escalate to PS. */
export default function HodApprovalsPage() {
  return (
    <ApprovalInbox
      tier="DIRECTOR"
      title="Departmental Approvals"
      inboxRoute="/hod/approvals"
    />
  );
}
