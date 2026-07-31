"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ApiError } from "@/lib/api";
import type { PaginatedResponse } from "@/lib/types";
import {
  ScrollText,
  Download,
  RefreshCw,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  FileText,
  AlertCircle,
} from "lucide-react";

interface AuditEvent {
  id: string;
  eventType: string;
  actorId: string | null;
  actor?: { fullName: string; role: string } | null;
  ticketId: string | null;
  ticket?: { ticketCode: string; subject: string } | null;
  meta: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  TICKET_CREATED: "bg-teal-100 text-teal-700",
  TICKET_ACKNOWLEDGED: "bg-cyan-100 text-cyan-700",
  TICKET_TRIAGED: "bg-violet-100 text-violet-700",
  TICKET_ASSIGNED: "bg-violet-100 text-violet-700",
  TICKET_ESCALATED: "bg-red-100 text-red-700",
  TICKET_RESOLVED: "bg-emerald-100 text-emerald-700",
  TICKET_CLOSED: "bg-neutral-100 text-neutral-700",
  TICKET_REOPENED: "bg-orange-100 text-orange-700",
  APPROVAL_DECISION: "bg-amber-100 text-amber-700",
  USER_LOGIN: "bg-slate-100 text-slate-700",
  USER_LOGOUT: "bg-slate-100 text-slate-700",
  USER_CREATED: "bg-emerald-100 text-emerald-700",
  USER_UPDATED: "bg-cyan-100 text-cyan-700",
  DEPARTMENT_UPDATED: "bg-cyan-100 text-cyan-700",
};

const EVENT_TYPES = [
  { value: "", label: "All events" },
  { value: "TICKET_CREATED", label: "Ticket Created" },
  { value: "TICKET_ACKNOWLEDGED", label: "Ticket Acknowledged" },
  { value: "TICKET_TRIAGED", label: "Ticket Triaged" },
  { value: "TICKET_ASSIGNED", label: "Ticket Assigned" },
  { value: "TICKET_ESCALATED", label: "Ticket Escalated" },
  { value: "TICKET_RESOLVED", label: "Ticket Resolved" },
  { value: "TICKET_CLOSED", label: "Ticket Closed" },
  { value: "TICKET_REOPENED", label: "Ticket Reopened" },
  { value: "APPROVAL_DECISION", label: "Approval Decision" },
  { value: "USER_LOGIN", label: "User Login" },
  { value: "USER_LOGOUT", label: "User Logout" },
  { value: "USER_CREATED", label: "User Created" },
  { value: "USER_UPDATED", label: "User Updated" },
  { value: "DEPARTMENT_UPDATED", label: "Department Updated" },
];

function formatTimeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return d.toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AuditLogsPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("");
  const [ticketCodeSearch, setTicketCodeSearch] = useState("");

  const pageSize = 25;

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (filterType) params.set("eventType", filterType);
      if (ticketCodeSearch.trim()) params.set("ticketCode", ticketCodeSearch.trim());
      const data = await api.get<PaginatedResponse<AuditEvent>>(
        `/audit-events?${params.toString()}`,
      );
      setEvents(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to load audit events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [page, filterType, ticketCodeSearch]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    setPage(1);
  }, [filterType, ticketCodeSearch]);

  const handleExport = async () => {
    try {
      const blob = await api.get<Blob>("/audit-events/export", {
        headers: { Accept: "text/csv" },
        responseType: "blob",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-events-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to export audit events");
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-neutral-800">
            <ScrollText className="h-5 w-5 text-teal-600" />
            Audit Log
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {total} event{total !== 1 ? "s" : ""} recorded
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={ticketCodeSearch}
              onChange={(e) => setTicketCodeSearch(e.target.value)}
              placeholder="Search by ticket code (e.g., KWMOC-2026-000001)…"
              className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Events list */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-6 w-6 animate-spin text-teal-600" />
            <span className="ml-2 text-sm text-neutral-500">
              Loading audit events…
            </span>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ScrollText className="h-10 w-10 text-neutral-300" />
            <p className="mt-3 text-sm font-medium text-neutral-600">
              No audit events found
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              {filterType || ticketCodeSearch
                ? "Try adjusting your filters."
                : "Audit events will appear here as users interact with the system."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {events.map((event) => {
              const colorClass =
                EVENT_TYPE_COLORS[event.eventType] ??
                "bg-neutral-100 text-neutral-700";
              const actorName = event.actor?.fullName ?? "Unknown";
              const actorRole = event.actor?.role
                ? event.actor.role.replace(/_/g, " ").toLowerCase()
                : "";
              const ticketCode = event.ticket?.ticketCode;
              const ticketSubject = event.ticket?.subject;
              return (
                <div
                  key={event.id}
                  className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-neutral-50 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="flex items-center gap-3 sm:w-56 sm:shrink-0">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${colorClass}`}
                    >
                      {event.eventType.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-800">
                      {ticketSubject
                        ? `${ticketSubject}`
                        : event.eventType.replace(/_/g, " ")}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {actorName}
                        {actorRole && (
                          <span className="text-neutral-400">· {actorRole}</span>
                        )}
                      </span>
                      {ticketCode && (
                        <span className="inline-flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {ticketCode}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatTimeAgo(event.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-500">
            Page {page} of {totalPages} · {total} events
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
