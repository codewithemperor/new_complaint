"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { ApprovalRequest, PaginatedResponse } from "@/lib/types";
import {
  ShieldCheck, Search, Filter, CheckCircle2, XCircle, Clock,
  ChevronRight, ThumbsUp, ThumbsDown, ArrowUpRight, RefreshCw,
  Building2, FileCheck, AlertTriangle, Inbox, X, Eye,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Constants & Helpers                                                */
/* ------------------------------------------------------------------ */

const STATUS_FILTERS = [
  { key: "ALL", label: "All", icon: Inbox },
  { key: "PENDING", label: "Pending", icon: Clock },
  { key: "APPROVED", label: "Approved", icon: CheckCircle2 },
  { key: "REJECTED", label: "Rejected", icon: XCircle },
] as const;

type StatusFilterKey = typeof STATUS_FILTERS[number]["key"];

const STATUS_BADGE: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  APPROVED: { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" },
  REJECTED: { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
  RETURNED: { bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-500" },
};

const PRIORITY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  P1: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  P2: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  P3: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  P4: { bg: "bg-neutral-100", text: "text-neutral-600", dot: "bg-neutral-400" },
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PsInboxPage() {
  const { user } = useSession();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and search state
  const [activeFilter, setActiveFilter] = useState<StatusFilterKey>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Decision modal state
  const [selected, setSelected] = useState<ApprovalRequest | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [decisionType, setDecisionType] = useState<"approve" | "reject" | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = activeFilter === "ALL" ? "" : `&status=${activeFilter}`;
      const data = await api.get<PaginatedResponse<ApprovalRequest>>(
        `/approval-requests?approverRole=PERMANENT_SECRETARY${statusParam}&page=1&pageSize=50`,
      );
      setRequests(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load approvals.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  /* ---- Filtered + searched requests ---- */
  const filteredRequests = useMemo(() => {
    let list = requests;

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          (r.ticket?.subject ?? "").toLowerCase().includes(q) ||
          (r.ticket?.ticketCode ?? "").toLowerCase().includes(q) ||
          (r.ticket?.department?.name ?? "").toLowerCase().includes(q) ||
          (r.ticket?.assignedOfficer?.fullName ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [requests, searchQuery]);

  /* ---- Count by status ---- */
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
    requests.forEach((r) => {
      if (counts[r.status] !== undefined) counts[r.status]++;
      else counts[r.status] = 1;
    });
    return counts;
  }, [requests]);

  function openModal(req: ApprovalRequest, type: "approve" | "reject") {
    setSelected(req);
    setDecisionType(type);
    setComment("");
    setActionError(null);
  }

  async function handleDecision() {
    if (!selected || !decisionType) return;
    if (decisionType === "reject" && !comment.trim()) {
      setActionError("A reason is required when rejecting a request.");
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      const endpoint = decisionType === "approve" ? "approve" : "return";
      const body: Record<string, unknown> = {};
      if (comment.trim()) {
        body[decisionType === "approve" ? "comment" : "comment"] = comment;
      }
      await api.post(`/tickets/${selected.ticket?.id ?? selected.id}/${endpoint}`, body);
      setSelected(null);
      setDecisionType(null);
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
      {/* ---- Header ---- */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-500 p-6 shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white" />
          <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-white" />
        </div>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white ring-1 ring-white/30">
                <ShieldCheck size={10} />
                Permanent Secretary
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Approval Inbox
            </h1>
            <p className="mt-1 text-sm text-emerald-100">
              Review, approve, or return resolved complaints
            </p>
          </div>
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-white/20 backdrop-blur-sm disabled:opacity-60"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ---- Filter + Search bar ---- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status filter tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => {
            const Icon = f.icon;
            const count = f.key === "ALL" ? total : statusCounts[f.key] ?? 0;
            const isActive = activeFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? f.key === "PENDING"
                      ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
                      : f.key === "APPROVED"
                      ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
                      : f.key === "REJECTED"
                      ? "bg-red-100 text-red-800 ring-1 ring-red-200"
                      : "bg-teal-100 text-teal-800 ring-1 ring-teal-200"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                <Icon size={12} />
                {f.label}
                {count > 0 && (
                  <span className={`ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                    isActive ? "bg-white/80 text-inherit" : "bg-neutral-200 text-neutral-500"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by subject, code, dept…"
            className="w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 py-2 text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 placeholder:text-neutral-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
            >
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* ---- Error ---- */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle size={18} className="text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={fetchRequests}
            className="ml-auto rounded-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* ---- Approval request list ---- */}
      {filteredRequests.length === 0 && !loading ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-neutral-700">
              {searchQuery ? "No results matching your search" : activeFilter !== "ALL" ? `No ${activeFilter.toLowerCase()} requests` : "No approval requests"}
            </p>
            <p className="text-xs text-neutral-400">
              {searchQuery ? "Try a different search term" : "You're all caught up!"}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((r) => {
            const statusBadge = STATUS_BADGE[r.status] || STATUS_BADGE.PENDING;
            const priorityStyle = r.ticket?.priority
              ? PRIORITY_STYLES[r.ticket.priority] || PRIORITY_STYLES.P4
              : null;
            const isPending = r.status === "PENDING";

            return (
              <div
                key={r.id}
                className={`rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
                  isPending
                    ? "border-amber-200 ring-1 ring-amber-100"
                    : "border-neutral-200"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left: ticket info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ring-1 ${
                      isPending
                        ? "bg-amber-50 text-amber-700 ring-amber-100"
                        : r.status === "APPROVED"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                        : "bg-red-50 text-red-700 ring-red-100"
                    }`}>
                      <FileCheck size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-teal-700">
                          {r.ticket?.ticketCode ?? "—"}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusBadge.bg} ${statusBadge.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusBadge.dot}`} />
                          {r.status}
                        </span>
                        {priorityStyle && (
                          <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${priorityStyle.bg} ${priorityStyle.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${priorityStyle.dot}`} />
                            {r.ticket!.priority}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm font-medium text-neutral-900">
                        {r.ticket?.subject ?? "Untitled complaint"}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-neutral-500">
                        {r.ticket?.department?.name && (
                          <span className="inline-flex items-center gap-0.5">
                            <Building2 size={10} className="text-neutral-400" />
                            {r.ticket.department.name}
                          </span>
                        )}
                        {r.ticket?.assignedOfficer?.fullName && (
                          <span>Officer: {r.ticket.assignedOfficer.fullName}</span>
                        )}
                        <span>{formatRelativeTime(r.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: action buttons */}
                  {isPending ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openModal(r, "approve")}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md"
                      >
                        <ThumbsUp size={12} />
                        Approve
                      </button>
                      <button
                        onClick={() => openModal(r, "reject")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-all hover:bg-red-100 hover:shadow-md"
                      >
                        <ThumbsDown size={12} />
                        Return
                      </button>
                      <button
                        onClick={() => openModal(r, "approve")}
                        className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-2 text-xs text-neutral-600 transition-colors hover:bg-neutral-50"
                      >
                        <Eye size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${
                        r.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {r.status === "APPROVED" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {r.status === "APPROVED" ? "Approved" : "Returned"}
                      </span>
                      {r.decidedAt && (
                        <span className="text-[10px] text-neutral-400">
                          {formatRelativeTime(r.decidedAt)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---- Loading state ---- */}
      {loading && (
        <div className="flex h-32 items-center justify-center">
          <RefreshCw size={24} className="animate-spin text-emerald-500" />
        </div>
      )}

      {/* ---- Decision modal ---- */}
      {selected && decisionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setSelected(null); setDecisionType(null); }} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">
                  {decisionType === "approve" ? "Approve Resolution" : "Return for Revision"}
                </h2>
                <button
                  onClick={() => { setSelected(null); setDecisionType(null); }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Ticket summary */}
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs font-medium text-teal-700">
                    {selected.ticket?.ticketCode ?? "—"}
                  </span>
                  {selected.ticket?.priority && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${PRIORITY_STYLES[selected.ticket.priority]?.bg ?? "bg-neutral-100"} ${PRIORITY_STYLES[selected.ticket.priority]?.text ?? "text-neutral-600"}`}>
                      {selected.ticket.priority}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-neutral-800">
                  {selected.ticket?.subject ?? "Untitled"}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-neutral-600">
                  <div>
                    <span className="text-neutral-400">Dept:</span>{" "}
                    {selected.ticket?.department?.name ?? "—"}
                  </div>
                  <div>
                    <span className="text-neutral-400">Officer:</span>{" "}
                    {selected.ticket?.assignedOfficer?.fullName ?? "—"}
                  </div>
                </div>
              </div>

              {/* Comment field */}
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                  {decisionType === "approve"
                    ? "Approval comment"
                    : "Reason for return *"}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 resize-y placeholder:text-neutral-400"
                  placeholder={
                    decisionType === "approve"
                      ? "Optional approval comment or conditions…"
                      : "Required: explain why this needs revision…"
                  }
                />
              </div>

              {actionError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {actionError}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleDecision}
                  disabled={submitting}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition-all disabled:opacity-60 ${
                    decisionType === "approve"
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  {submitting ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    decisionType === "approve" ? <ThumbsUp size={14} /> : <ThumbsDown size={14} />
                  )}
                  {decisionType === "approve" ? "Confirm Approval" : "Confirm Return"}
                </button>
                <button
                  onClick={() => { setSelected(null); setDecisionType(null); }}
                  disabled={submitting}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-60"
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
