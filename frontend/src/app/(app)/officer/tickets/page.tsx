"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { Ticket, PaginatedResponse } from "@/lib/types";
import { SlaStatus } from "@/components/SlaStatus";
import {
  Search, Filter, ChevronLeft, ChevronRight, RefreshCw,
  List, Building2, User, ArrowUpDown,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  ASSIGNED: { bg: "bg-teal-100", text: "text-teal-700", dot: "bg-teal-500" },
  IN_PROGRESS: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  PENDING_APPROVAL: { bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500" },
  APPROVED: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  RESOLVED: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  CLOSED: { bg: "bg-neutral-100", text: "text-neutral-600", dot: "bg-neutral-400" },
  REOPENED: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
};

const PRIORITY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  P1: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  P2: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  P3: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  P4: { bg: "bg-neutral-100", text: "text-neutral-600", dot: "bg-neutral-400" },
};

const STATUS_FILTERS = [
  { key: "ALL", label: "All" },
  { key: "ASSIGNED", label: "Assigned" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "PENDING_APPROVAL", label: "Pending Approval" },
  { key: "RESOLVED", label: "Resolved" },
  { key: "REOPENED", label: "Reopened" },
] as const;

const PRIORITY_FILTERS = ["ALL", "P1", "P2", "P3", "P4"] as const;

const PAGE_SIZE = 10;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function OfficerTicketsPage() {
  const { user } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [viewMode, setViewMode] = useState<"mine" | "department">("mine");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"priority" | "sla" | "date">("date");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (viewMode === "mine") {
        params.set("assignedOfficerId", "me");
      }
      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }
      if (priorityFilter !== "ALL") {
        params.set("priority", priorityFilter);
      }
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }
      const data = await api.get<PaginatedResponse<Ticket>>(
        `/tickets?${params.toString()}`,
      );
      setTickets(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load tickets.");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [viewMode, statusFilter, priorityFilter, searchQuery, page]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [viewMode, statusFilter, priorityFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Sort tickets client-side
  const sortedTickets = useMemo(() => {
    const sorted = [...tickets];
    if (sortBy === "priority") {
      const order: Record<string, number> = { P1: 0, P2: 1, P3: 2, P4: 3 };
      sorted.sort(
        (a, b) =>
          (order[a.priority || "P4"] ?? 3) - (order[b.priority || "P4"] ?? 3),
      );
    } else if (sortBy === "sla") {
      sorted.sort((a, b) => {
        if (a.slaBreached && !b.slaBreached) return -1;
        if (!a.slaBreached && b.slaBreached) return 1;
        return (
          (a.slaRemainingHours ?? 999) - (b.slaRemainingHours ?? 999)
        );
      });
    } else {
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    return sorted;
  }, [tickets, sortBy]);

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800">Tickets</h1>
          <p className="text-sm text-neutral-500">
            {viewMode === "mine" ? "Your assigned tickets" : "All department tickets"} · {total} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTickets}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 disabled:opacity-60"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ---- View Mode Toggle + Search + Filters ---- */}
      <div className="space-y-3">
        {/* View mode toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-neutral-200 bg-neutral-50 p-1">
            <button
              onClick={() => setViewMode("mine")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "mine"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              <User size={12} />
              My Tickets
            </button>
            <button
              onClick={() => setViewMode("department")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "department"
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              <Building2 size={12} />
              Department
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code, subject, or description…"
              className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((sf) => (
            <button
              key={sf.key}
              onClick={() => setStatusFilter(sf.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === sf.key
                  ? "bg-teal-600 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {sf.label}
            </button>
          ))}
          <span className="mx-1 text-neutral-300">|</span>
          {PRIORITY_FILTERS.map((pf) => (
            <button
              key={pf}
              onClick={() => setPriorityFilter(pf)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                priorityFilter === pf
                  ? "bg-amber-600 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {pf === "ALL" ? "All Priorities" : pf}
            </button>
          ))}
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-2 text-xs">
          <ArrowUpDown size={12} className="text-neutral-400" />
          <span className="text-neutral-500">Sort by:</span>
          {(["date", "priority", "sla"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                sortBy === s
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-500 hover:bg-neutral-100"
              }`}
            >
              {s === "date" ? "Newest" : s === "priority" ? "Priority" : "SLA Urgency"}
            </button>
          ))}
        </div>
      </div>

      {/* ---- Error ---- */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ---- Ticket List ---- */}
      {sortedTickets.length === 0 && !loading ? (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="p-6">
            <p className="py-8 text-center text-neutral-500">
              No tickets found matching your filters.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedTickets.map((t) => {
            const statusStyle = STATUS_STYLES[t.status] || STATUS_STYLES.CLOSED;
            const priorityStyle = t.priority
              ? PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.P4
              : null;
            return (
              <div
                key={t.id}
                className="group rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-teal-200"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left: Ticket info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-700">
                        {t.ticketCode}
                      </span>
                      {/* Status badge */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyle.bg} ${statusStyle.text}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                        {t.status.replace(/_/g, " ")}
                      </span>
                      {/* Priority badge */}
                      {priorityStyle && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${priorityStyle.bg} ${priorityStyle.text}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${priorityStyle.dot}`} />
                          {t.priority}
                        </span>
                      )}
                      {/* SLA breached indicator */}
                      {t.slaBreached && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                          SLA BREACHED
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm font-medium text-neutral-800 group-hover:text-teal-700">
                      {t.subject}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-neutral-500">
                      {t.category && <span>{t.category}</span>}
                      {t.department?.name && (
                        <span className="flex items-center gap-1">
                          <Building2 size={10} />
                          {t.department.name}
                        </span>
                      )}
                      {t.assignedOfficer?.fullName && viewMode === "department" && (
                        <span>Officer: {t.assignedOfficer.fullName}</span>
                      )}
                      <span>
                        {new Date(t.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Right: SLA + Action */}
                  <div className="flex flex-shrink-0 items-center gap-3">
                    <SlaStatus
                      awaiting={t.awaiting}
                      slaStartedAt={t.slaStartedAt}
                      slaTargetHours={t.slaTargetHours}
                      slaRemainingHours={t.slaRemainingHours}
                      slaBreached={t.slaBreached}
                    />
                    <Link
                      href={`/officer/tickets/${t.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-700"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---- Pagination ---- */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs text-neutral-500">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                    page === pageNum
                      ? "bg-teal-600 text-white"
                      : "border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
