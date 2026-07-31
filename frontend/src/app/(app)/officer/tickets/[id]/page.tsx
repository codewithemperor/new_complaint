"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { SlaStatus } from "@/components/SlaStatus";
import type { Ticket, Minute } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600";

const STATUS_BADGE: Record<string, string> = {
  ASSIGNED: "bg-violet-100 text-violet-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-teal-100 text-teal-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-neutral-100 text-neutral-600",
  REOPENED: "bg-orange-100 text-orange-700",
};

/**
 * Officer ticket detail — the investigation workspace.
 *
 * Header: ticket meta + SLA. Timeline merges minutes + movements chronologically.
 * Actions: Start (ASSIGNED→IN_PROGRESS), Request Info (pause SLA), Request
 * Approval (→PENDING_APPROVAL), Post Minute. "Submit Resolution" is present but
 * disabled — it lands in M6.
 */
export default function OfficerTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action state.
  const [minuteBody, setMinuteBody] = useState("");
  const [minuteInternal, setMinuteInternal] = useState(false);
  const [posting, setPosting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [infoText, setInfoText] = useState("");
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Resolution modal (M6).
  const [resolutionText, setResolutionText] = useState("");
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [submittingResolution, setSubmittingResolution] = useState(false);

  const fetchTicket = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Ticket>(`/tickets/${params.id}/detail`);
      setTicket(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load ticket.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  async function handleStart() {
    setActionError(null);
    try {
      await api.patch(`/tickets/${params.id}/start`);
      fetchTicket();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to start investigation.");
    }
  }

  async function handlePostMinute() {
    if (!minuteBody.trim()) return;
    setPosting(true);
    setActionError(null);
    try {
      await api.post(`/tickets/${params.id}/minutes`, {
        body: minuteBody,
        isInternal: minuteInternal,
      });
      setMinuteBody("");
      setMinuteInternal(false);
      fetchTicket();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to post minute.");
    } finally {
      setPosting(false);
    }
  }

  async function handleRequestInfo() {
    if (!infoText.trim()) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await api.post(`/tickets/${params.id}/request-info`, { requestText: infoText });
      setInfoText("");
      setShowInfoModal(false);
      fetchTicket();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to request info.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequestApproval() {
    if (!confirm("Request departmental approval from your HOD? This will pause the SLA clock.")) {
      return;
    }
    setActionError(null);
    try {
      await api.patch(`/tickets/${params.id}/request-approval`);
      fetchTicket();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to request approval.");
    }
  }

  async function handleSubmitResolution() {
    if (!resolutionText.trim()) return;
    setSubmittingResolution(true);
    setActionError(null);
    try {
      await api.post(`/tickets/${params.id}/resolution`, {
        resolutionText,
      });
      setResolutionText("");
      setShowResolutionModal(false);
      fetchTicket();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to submit resolution.");
    } finally {
      setSubmittingResolution(false);
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-neutral-400">Loading…</div>;
  }
  if (error || !ticket) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="p-6">
            <p className="py-6 text-center text-sm text-red-600">
              {error ?? "Ticket not found."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const minutes = ticket.minutes ?? [];
  const movements = ticket.movements ?? [];

  // Merge minutes + movements into one chronological timeline.
  const timeline: {
    kind: "minute" | "movement";
    createdAt: string;
    data: Minute | (typeof movements)[number];
  }[] = [
    ...minutes.map((m) => ({ kind: "minute" as const, createdAt: m.createdAt, data: m })),
    ...movements.map((mv) => ({ kind: "movement" as const, createdAt: mv.createdAt, data: mv })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const canAct = ["ASSIGNED", "IN_PROGRESS", "PENDING_APPROVAL", "APPROVED", "REOPENED"].includes(
    ticket.status,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-teal-700">{ticket.ticketCode}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    STATUS_BADGE[ticket.status] ?? "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {ticket.status.replace(/_/g, " ")}
                </span>
              </div>
              <h1 className="mt-1 text-lg font-semibold text-neutral-800">{ticket.subject}</h1>
            </div>
            <SlaStatus
              awaiting={ticket.awaiting}
              slaStartedAt={ticket.slaStartedAt}
              slaTargetHours={ticket.slaTargetHours}
              slaRemainingHours={ticket.slaRemainingHours}
              slaBreached={ticket.slaBreached}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <p className="text-xs uppercase text-neutral-400">Priority</p>
              <p className="font-medium text-neutral-700">{ticket.priority ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-neutral-400">Category</p>
              <p className="text-neutral-700">
                {ticket.category ? ticket.category.replace(/_/g, " ") : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-neutral-400">Department</p>
              <p className="text-neutral-700">{ticket.department?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-neutral-400">Citizen</p>
              <p className="text-neutral-700">{ticket.citizen?.name ?? "Anonymous"}</p>
            </div>
          </div>

          {ticket.description && (
            <div>
              <p className="text-xs uppercase text-neutral-400">Description</p>
              <p className="whitespace-pre-wrap text-sm text-neutral-700">{ticket.description}</p>
            </div>
          )}

          {/* Action buttons */}
          {canAct && (
            <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
              {ticket.status === "ASSIGNED" && (
                <button className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700" onClick={handleStart}>
                  Start Investigation
                </button>
              )}
              {ticket.status === "IN_PROGRESS" && (
                <>
                  <button className="rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100" onClick={() => setShowInfoModal(true)}>
                    Request Info
                  </button>
                  <button className="rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100" onClick={handleRequestApproval}>
                    Request Approval
                  </button>
                  <button className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700" onClick={() => setShowResolutionModal(true)}>
                    Submit Resolution
                  </button>
                </>
              )}
            </div>
          )}

          {actionError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {actionError}
            </div>
          )}
        </div>
      </div>

      {/* New minute composer */}
      {canAct && ticket.status !== "ASSIGNED" && (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="space-y-3 p-6">
            <label className="block text-sm font-medium text-neutral-700">Add a minute</label>
            <textarea
              value={minuteBody}
              onChange={(e) => setMinuteBody(e.target.value)}
              rows={3}
              className={`${inputClass} resize-y`}
              placeholder="Investigation note, finding, or action taken…"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  checked={minuteInternal}
                  onChange={(e) => setMinuteInternal(e.target.checked)}
                  className="rounded border-neutral-300"
                />
                Internal (hidden from citizen)
              </label>
              <button
                className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handlePostMinute}
                disabled={posting || !minuteBody.trim()}
              >
                {posting ? "Posting…" : "Post Minute"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase text-neutral-500">
            Investigation Timeline
          </h2>
          {timeline.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-400">
              No activity yet. {ticket.status === "ASSIGNED" ? "Click Start to begin." : ""}
            </p>
          ) : (
            <div className="relative border-l-2 border-neutral-200 pl-6">
              {timeline.map((entry, i) => {
                const dt = new Date(entry.createdAt).toLocaleString();
                if (entry.kind === "minute") {
                  const m = entry.data as Minute;
                  return (
                    <div key={i} className="relative mb-5 last:mb-0">
                      <span className="absolute -left-[29px] flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm">
                        {m.isInternal ? "🔒" : "📝"}
                      </span>
                      <div className="rounded-lg border border-neutral-200 bg-white p-3">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs font-medium text-neutral-700">
                            {m.author?.fullName ?? "System"}
                            {m.author?.designation ? ` · ${m.author.designation}` : ""}
                          </span>
                          <span className="text-xs text-neutral-400">{dt}</span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm text-neutral-700">{m.body}</p>
                        <div className="mt-1 flex gap-2">
                          {m.isInternal && (
                            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
                              Internal
                            </span>
                          )}
                          {m.isResolutionDraft && (
                            <span className="rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-600">
                              Resolution draft
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
                const mv = entry.data as (typeof movements)[number];
                return (
                  <div key={i} className="relative mb-4 last:mb-0">
                    <span className="absolute -left-[29px] flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm">
                      🔀
                    </span>
                    <p className="text-sm font-medium text-neutral-800">
                      {mv.type.replace(/_/g, " ")}
                    </p>
                    {mv.note && <p className="text-xs text-neutral-500">{mv.note}</p>}
                    <p className="text-xs text-neutral-400">{dt}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Request Info modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowInfoModal(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-0 shadow-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">Request Information from Citizen</h2>
                <button onClick={() => setShowInfoModal(false)} className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-neutral-500">This pauses the SLA clock until the citizen responds.</p>
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700">What do you need?</label>
                  <textarea
                    value={infoText}
                    onChange={(e) => setInfoText(e.target.value)}
                    rows={4}
                    className={`${inputClass} resize-y`}
                    placeholder="e.g. Please provide the date the incident occurred and any reference numbers…"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button className="rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed" onClick={() => setShowInfoModal(false)} disabled={submitting}>Cancel</button>
                <button className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed" onClick={handleRequestInfo} disabled={submitting || !infoText.trim()}>
                  {submitting ? "Sending…" : "Send Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Resolution modal (M6) */}
      {showResolutionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowResolutionModal(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-0 shadow-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">Submit Resolution</h2>
                <button onClick={() => setShowResolutionModal(false)} className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-neutral-500">
                  The citizen will be notified and asked to confirm. A 7-day feedback window starts on submission.
                </p>
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700">Resolution narrative *</label>
                  <textarea
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    rows={6}
                    className={`${inputClass} resize-y`}
                    placeholder="Describe the findings, action taken, and outcome for the citizen…"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button className="rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed" onClick={() => setShowResolutionModal(false)} disabled={submittingResolution}>Cancel</button>
                <button className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed" onClick={handleSubmitResolution} disabled={submittingResolution || !resolutionText.trim()}>
                  {submittingResolution ? "Submitting…" : "Submit Resolution"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
