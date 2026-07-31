"use client";

import { ApprovalInbox } from "@/components/ApprovalInbox";

/** Commissioner inbox — COMMISSIONER tier: Policy decision / Return / Refer. */
export default function CommissionerInboxPage() {
  return (
    <ApprovalInbox
      tier="COMMISSIONER"
      title="Commissioner — Inbox"
      inboxRoute="/commissioner/inbox"
    />
  );
}
