"use client";

import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { ApprovalRequest, PaginatedResponse } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600";

/** Which decision buttons to show, keyed by tier. */
export type Tier = "DEPARTMENT_HOD" | "PERMANENT_SECRETARY" | "COMMISSIONER";

const TIER_ACTIONS: Record<
  Tier,
  { label: string; value: "approve" | "return" | "escalate" | "refer" }[]
> = {
  DEPARTMENT_HOD: [
    { label: "Approve", value: "approve" },
    { label: "Return", value: "return" },
    { label: "Escalate to PS", value: "escalate" },
  ],
  PERMANENT_SECRETARY: [
    { label: "Approve", value: "approve" },
    { label: "Return", value: "return" },
    { label: "Escalate to Commissioner", value: "escalate" },
    { label: "Refer Externally", value: "refer" },
  ],
  COMMISSIONER: [
    { label: "Approve (Policy Decision)", value: "approve" },
    { label: "Return", value: "return" },
    { label: "Refer Externally", value: "refer" },
  ],
};

/**
 * ApprovalInbox — shared inbox + decision modal for HOD / PS / Commissioner.
 *
 * The tier controls which actions are available. Each decision posts to the
 * corresponding backend endpoint with the comment/directive captured here.
 */
export function ApprovalInbox({
  tier,
  title,
  inboxRoute,
  allTiers = false,
}: {
  tier: Tier;
  title: string;
  inboxRoute: string;
  /** When true, fetch all pending approvals across every tier (Super Admin). */
  allTiers?: boolean;
}) {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<ApprovalRequest | null>(null);
  const [comment, setComment] = useState("");
  const [referredBody, setReferredBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  /** When set, the external-body field is shown and "Confirm Refer" submits. */
  const [referMode, setReferMode] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Super Admin (allTiers) issues a single unscoped call; the backend
      // ignores the approverRole filter for super admins and returns every tier.
      const scope = allTiers
        ? "status=PENDING"
        : `approverRole=${tier}&status=PENDING`;
      const data = await api.get<PaginatedResponse<ApprovalRequest>>(
        `/approval-requests?${scope}&page=1&pageSize=50`,
      );
      setRequests(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load approvals.",
      );
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [tier, allTiers]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  function openModal(req: ApprovalRequest) {
    setSelected(req);
    setComment("");
    setReferredBody("");
    setReferMode(false);
    setActionError(null);
  }

  async function handleDecision(
    action: "approve" | "return" | "escalate" | "refer",
  ) {
    if (!selected) return;
    if (action === "return" && !comment.trim()) {
      setActionError("A comment is required when returning a ticket.");
      return;
    }
    if (action === "refer" && !referredBody.trim()) {
      setActionError("The external body name is required for a referral.");
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      const body: Record<string, unknown> = {};
      if (comment.trim()) {
        body[
          action === "approve"
            ? "comment"
            : action === "refer"
              ? "reason"
              : action === "escalate"
                ? "reason"
                : "comment"
        ] = comment;
      }
      if (action === "refer") body.referredBody = referredBody;

      await api.post(
        `/tickets/${selected.ticket?.id ?? selected.id}/${action}`,
        body,
      );
      setSelected(null);
      fetchRequests();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Decision failed.";
      setActionError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800">{title}</h1>
          <p className="text-sm text-neutral-500">
            {total} item{total !== 1 ? "s" : ""} awaiting your action
          </p>
        </div>
        <button
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={fetchRequests}
          disabled={loading}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {requests.length === 0 && !loading ? (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 shadow-sm">
          <div className="p-6">
            <p className="py-8 text-center text-neutral-500">
              No items awaiting your action.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 shadow-sm">
          <div className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                    <th className="px-4 py-3">Ticket</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-neutral-100 hover:bg-neutral-50"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-green-700">
                        {r.ticket?.ticketCode ?? "—"}
                      </td>
                      <td className="max-w-[260px] truncate px-4 py-3 font-medium text-neutral-800">
                        {r.ticket?.subject ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {r.ticket?.department?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {r.ticket?.priority ? (
                          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                            {r.ticket.priority}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700"
                          onClick={() => openModal(r)}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Decision modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-neutral-50 p-0 shadow-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Review Approval Request
                </h2>
                <button
                  onClick={() => setSelected(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="max-h-[70vh] space-y-4 overflow-y-auto">
                <p className="text-sm text-neutral-500">
                  <span className="font-mono">
                    {selected.ticket?.ticketCode}
                  </span>{" "}
                  — {selected.ticket?.subject}
                </p>
                {/* Ticket meta */}
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase text-neutral-400">
                      Department
                    </p>
                    <p className="text-neutral-700">
                      {selected.ticket?.department?.name ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-neutral-400">
                      Officer
                    </p>
                    <p className="text-neutral-700">
                      {selected.ticket?.assignedOfficer?.fullName ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-neutral-400">
                      Priority
                    </p>
                    <p className="text-neutral-700">
                      {selected.ticket?.priority ?? "—"}
                    </p>
                  </div>
                </div>

                {/* Executive summary */}
                {selected.ticket?.minutes?.[0]?.body && (
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase text-neutral-500">
                      Officer Summary
                    </p>
                    <p className="text-sm text-neutral-700">
                      {selected.ticket.minutes[0].body}
                    </p>
                  </div>
                )}

                {/* External body (shown only when referring) */}
                {referMode && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-neutral-700">
                      External body name *
                    </label>
                    <input
                      value={referredBody}
                      onChange={(e) => setReferredBody(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. Public Complaints Commission"
                    />
                  </div>
                )}

                {/* Comment / directive */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700">
                    Comment / directive{" "}
                    <span className="text-neutral-400">
                      (required for return)
                    </span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className={`${inputClass} resize-y`}
                    placeholder={
                      tier === "COMMISSIONER"
                        ? "Policy directive…"
                        : "Comments, conditions, or instructions for the officer…"
                    }
                  />
                </div>

                {actionError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {actionError}
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between">
                {/* Action buttons per tier */}
                <div className="flex flex-wrap gap-2">
                  {TIER_ACTIONS[tier].map((a) => {
                    const isPrimary = a.value === "approve";
                    return (
                      <button
                        key={a.value}
                        className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                          isPrimary
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "border border-neutral-300 bg-neutral-50 text-neutral-700 hover:bg-neutral-50"
                        }`}
                        disabled={submitting}
                        onClick={() => {
                          if (a.value === "refer") {
                            if (referMode && referredBody.trim()) {
                              handleDecision("refer");
                            } else {
                              setReferMode(true);
                              setActionError(null);
                            }
                          } else {
                            handleDecision(a.value);
                          }
                        }}
                      >
                        {referMode && a.value === "refer"
                          ? "Confirm Refer"
                          : a.label}
                      </button>
                    );
                  })}
                </div>
                <button
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => setSelected(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
