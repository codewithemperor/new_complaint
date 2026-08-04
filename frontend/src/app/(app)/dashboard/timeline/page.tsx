"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { Ticket, Department, PaginatedResponse } from "@/lib/types";
import {
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Building2,
  AlertCircle,
  Activity,
  Inbox,
  CheckCircle2,
  RotateCcw,
  ArrowUpRight,
  FileText,
  Eye,
  X,
  Calendar,
  Hash,
  ChevronDown,
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────────
 *  Type for the new "all tickets with timeline" endpoint (Phase 1.2)
 * ────────────────────────────────────────────────────────────────── */
interface TimelineEvent {
  id: string;
  type: string;
  action?: string;
  note?: string | null;
  createdAt: string;
  actorName?: string | null;
  actorRole?: string | null;
}

interface TicketWithTimeline extends Ticket {
  events?: TimelineEvent[];
  citizen?: { name?: string | null; email: string; phone?: string | null };
  department?: { id: string; name: string; code: string } | null;
  assignedOfficer?: {
    id: string;
    fullName: string;
    email?: string;
    role?: string;
  } | null;
}

interface TimelineResponse {
  items: TicketWithTimeline[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* ──────────────────────────────────────────────────────────────────
 *  Constants
 * ────────────────────────────────────────────────────────────────── */
const STATUS_OPTIONS = [
  {
    value: "",
    label: "All statuses",
    color: "bg-neutral-50 text-foreground",
  },
  {
    value: "ACKNOWLEDGED",
    label: "Received",
    color: "bg-green-100 text-green-700",
  },
  {
    value: "TRIAGED",
    label: "Being Routed",
    color: "bg-purple-100 text-purple-700",
  },
  {
    value: "ASSIGNED",
    label: "Assigned",
    color: "bg-violet-100 text-violet-700",
  },
  {
    value: "IN_PROGRESS",
    label: "Under Investigation",
    color: "bg-amber-100 text-amber-700",
  },
  {
    value: "PENDING_APPROVAL",
    label: "Pending Approval",
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    value: "APPROVED",
    label: "Approved",
    color: "bg-green-100 text-green-700",
  },
  {
    value: "RESOLVED",
    label: "Resolved",
    color: "bg-green-100 text-green-700",
  },
  {
    value: "CLOSED",
    label: "Closed",
    color: "bg-neutral-50 text-muted-foreground",
  },
  {
    value: "REOPENED",
    label: "Reopened",
    color: "bg-orange-100 text-orange-700",
  },
  { value: "ESCALATED", label: "Escalated", color: "bg-red-100 text-red-700" },
  {
    value: "REFERRED",
    label: "Referred",
    color: "bg-violet-100 text-violet-700",
  },
];

const PRIORITY_OPTIONS = [
  {
    value: "",
    label: "All priorities",
    color: "bg-neutral-50 text-foreground",
  },
  { value: "P1", label: "P1 — Critical", color: "bg-red-100 text-red-700" },
  { value: "P2", label: "P2 — High", color: "bg-orange-100 text-orange-700" },
  { value: "P3", label: "P3 — Medium", color: "bg-amber-100 text-amber-700" },
  { value: "P4", label: "P4 — Low", color: "bg-green-100 text-green-700" },
];

const STATUS_COLORS: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((s) => [s.value, s.color]),
);
const PRIORITY_COLORS: Record<string, string> = Object.fromEntries(
  PRIORITY_OPTIONS.map((s) => [s.value, s.color]),
);

const EVENT_ICON_MAP: Record<string, React.ReactNode> = {
  TICKET_CREATED: <FileText className="h-3.5 w-3.5" />,
  TICKET_ACKNOWLEDGED: <Inbox className="h-3.5 w-3.5" />,
  TICKET_TRIAGED: <Filter className="h-3.5 w-3.5" />,
  TICKET_ASSIGNED: <User className="h-3.5 w-3.5" />,
  TICKET_IN_PROGRESS: <Activity className="h-3.5 w-3.5" />,
  TICKET_RESOLVED: <CheckCircle2 className="h-3.5 w-3.5" />,
  TICKET_CLOSED: <CheckCircle2 className="h-3.5 w-3.5" />,
  TICKET_REOPENED: <RotateCcw className="h-3.5 w-3.5" />,
  TICKET_ESCALATED: <ArrowUpRight className="h-3.5 w-3.5" />,
  TICKET_REFERRED: <ArrowUpRight className="h-3.5 w-3.5" />,
};

const EVENT_COLOR_MAP: Record<string, string> = {
  TICKET_CREATED: "bg-green-500",
  TICKET_ACKNOWLEDGED: "bg-amber-500",
  TICKET_TRIAGED: "bg-purple-500",
  TICKET_ASSIGNED: "bg-violet-500",
  TICKET_IN_PROGRESS: "bg-amber-500",
  TICKET_RESOLVED: "bg-green-500",
  TICKET_CLOSED: "bg-neutral-500",
  TICKET_REOPENED: "bg-orange-500",
  TICKET_ESCALATED: "bg-red-500",
  TICKET_REFERRED: "bg-violet-500",
};

const EVENT_LABEL_MAP: Record<string, string> = {
  TICKET_CREATED: "Complaint submitted",
  TICKET_ACKNOWLEDGED: "Acknowledged by intake",
  TICKET_TRIAGED: "Classified & routed",
  TICKET_ASSIGNED: "Assigned to officer",
  TICKET_IN_PROGRESS: "Investigation started",
  TICKET_RESOLVED: "Marked as resolved",
  TICKET_CLOSED: "Complaint closed",
  TICKET_REOPENED: "Complaint reopened",
  TICKET_ESCALATED: "Escalated",
  TICKET_REFERRED: "Referred externally",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const selectClass =
  "rounded-lg border border-border bg-neutral-50 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-green-600 focus:ring-1 focus:ring-green-600 hover:border-neutral-400";

/* ──────────────────────────────────────────────────────────────────
 *  Expandable ticket row with full timeline
 * ────────────────────────────────────────────────────────────────── */
function TicketRow({
  ticket,
  isExpanded,
  onToggle,
  index,
}: {
  ticket: TicketWithTimeline;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}) {
  const statusColor =
    STATUS_COLORS[ticket.status] ?? "bg-neutral-50 text-foreground";
  const priorityColor =
    PRIORITY_COLORS[ticket.priority ?? ""] ??
    "bg-neutral-50 text-muted-foreground";

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-neutral-50 transition-all ${
        isExpanded
          ? "border-green-300 shadow-md"
          : "border-border hover:border-green-200 hover:shadow-sm"
      }`}
    >
      {/* Header row */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-neutral-50"
      >
        {/* Index */}
        <span className="hidden w-8 flex-shrink-0 text-xs font-mono text-muted-foreground sm:block">
          {(index + 1).toString().padStart(2, "0")}
        </span>

        {/* Ticket code + subject */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-green-700">
              {ticket.ticketCode}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusColor}`}
            >
              {ticket.status.replace(/_/g, " ").toLowerCase()}
            </span>
            {ticket.priority && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${priorityColor}`}
              >
                {ticket.priority}
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-sm font-medium text-foreground">
            {ticket.subject}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Building2 size={11} className="text-muted-foreground" />
              {ticket.department?.name ?? "Unrouted"}
            </span>
            {ticket.assignedOfficer && (
              <span className="inline-flex items-center gap-1">
                <User size={11} className="text-muted-foreground" />
                {ticket.assignedOfficer.fullName}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock size={11} className="text-muted-foreground" />
              {timeAgo(ticket.createdAt)}
            </span>
            {ticket.events && ticket.events.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                <Activity size={10} />
                {ticket.events.length} event
                {ticket.events.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expanded timeline */}
      {isExpanded && (
        <div className="border-t border-border bg-neutral-50/50 px-4 py-4">
          {/* Meta grid */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetaItem
              icon={<Calendar size={12} />}
              label="Submitted"
              value={formatDate(ticket.createdAt)}
            />
            <MetaItem
              icon={<MapPin size={12} />}
              label="LGA"
              value={ticket.lga ?? "—"}
            />
            <MetaItem
              icon={<Hash size={12} />}
              label="Channel"
              value={ticket.channel.replace(/_/g, " ").toLowerCase()}
            />
            <MetaItem
              icon={<User size={12} />}
              label="Citizen"
              value={
                ticket.citizen?.name ?? ticket.citizen?.email ?? "Anonymous"
              }
            />
          </div>

          {/* Description */}
          <div className="mb-4 rounded-lg border border-border bg-neutral-50 p-3">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Description
            </p>
            <p className="text-sm leading-relaxed text-foreground line-clamp-3">
              {ticket.description}
            </p>
          </div>

          {/* Timeline */}
          {ticket.events && ticket.events.length > 0 ? (
            <div className="rounded-lg border border-border bg-neutral-50 p-3">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Full Activity Timeline
              </p>
              <ol className="space-y-0">
                {ticket.events
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(a.createdAt).getTime() -
                      new Date(b.createdAt).getTime(),
                  )
                  .map((event, i, arr) => {
                    const safeType = event.type ?? "";
                    const dotColor =
                      EVENT_COLOR_MAP[safeType] ?? "bg-neutral-400";
                    const icon = EVENT_ICON_MAP[safeType] ?? (
                      <Activity className="h-3.5 w-3.5" />
                    );
                    const label =
                      EVENT_LABEL_MAP[safeType] ??
                      (safeType
                        ? safeType.replace(/_/g, " ").toLowerCase()
                        : "Activity");
                    const isLast = i === arr.length - 1;
                    return (
                      <li key={event.id} className="flex gap-3">
                        {/* Vertical line + dot */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-white ${dotColor}`}
                          >
                            {icon}
                          </div>
                          {!isLast && (
                            <div className="w-px flex-1 bg-neutral-200" />
                          )}
                        </div>
                        {/* Content */}
                        <div className={`min-w-0 ${isLast ? "pb-0" : "pb-4"}`}>
                          <p className="text-sm font-medium text-foreground">
                            {label}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            <span>{formatDate(event.createdAt)}</span>
                            {event.actorName && (
                              <span className="inline-flex items-center gap-1">
                                <User size={10} />
                                {event.actorName}
                                {event.actorRole && (
                                  <span className="text-muted-foreground">
                                    (
                                    {event.actorRole
                                      .replace(/_/g, " ")
                                      .toLowerCase()}
                                    )
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                          {event.note && (
                            <p className="mt-1 rounded-md bg-neutral-50 px-2 py-1 text-xs italic text-muted-foreground">
                              &ldquo;{event.note}&rdquo;
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
              </ol>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-neutral-50 p-4 text-center">
              <p className="text-xs text-muted-foreground">
                No workflow events recorded yet for this ticket.
              </p>
            </div>
          )}

          {/* Action bar */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              href={`/dashboard/complaints/${ticket.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow"
            >
              <Eye size={12} />
              Open full detail
            </Link>
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-neutral-50 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-neutral-50"
              onClick={() => navigator.clipboard?.writeText(ticket.ticketCode)}
            >
              <Hash size={12} />
              Copy code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-neutral-50 p-2">
      <p className="mb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="truncate text-xs font-medium text-foreground" title={value}>
        {value}
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
 *  Main Page
 * ────────────────────────────────────────────────────────────────── */
export default function TimelinePage() {
  const [tickets, setTickets] = useState<TicketWithTimeline[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Expansion
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (statusFilter) params.set("status", statusFilter);
      if (deptFilter) params.set("departmentId", deptFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      if (search.trim()) params.set("search", search.trim());

      const data = await api.get<TimelineResponse>(
        `/tickets/admin/all?${params.toString()}`,
      );
      setTickets(data.items ?? []);
      setTotal(data.total);
      setTotalPages(data.totalPages ?? Math.ceil(data.total / pageSize));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || `Request failed (${err.statusCode})`);
      } else {
        setError("Failed to load timeline. Please try again.");
      }
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, deptFilter, priorityFilter, search]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    api
      .get<Department[]>("/departments")
      .then(setDepartments)
      .catch(() => {});
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, deptFilter, priorityFilter, search]);

  const activeFilterCount = useMemo(() => {
    return [statusFilter, deptFilter, priorityFilter, search].filter(Boolean)
      .length;
  }, [statusFilter, deptFilter, priorityFilter, search]);

  function clearFilters() {
    setStatusFilter("");
    setDeptFilter("");
    setPriorityFilter("");
    setSearchInput("");
    setSearch("");
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Complaints Timeline
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cross-department audit view with full activity history per ticket.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTickets}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-neutral-50 px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-neutral-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="mb-4 rounded-xl border border-border bg-neutral-50 p-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search by ticket code, subject, or description…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg border border-border bg-neutral-50 py-2 pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-neutral-50 hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              showFilters || activeFilterCount > 0
                ? "border-green-300 bg-green-50 text-green-700"
                : "border-border bg-neutral-50 text-foreground hover:bg-neutral-50"
            }`}
          >
            <Filter size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-green-600 px-1.5 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Collapsible filter row */}
        {showFilters && (
          <div className="mt-3 grid grid-cols-1 gap-2 border-t border-border pt-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={selectClass + " w-full"}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Department
              </label>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className={selectClass + " w-full"}
              >
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className={selectClass + " w-full"}
              >
                {PRIORITY_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            {activeFilterCount > 0 && (
              <div className="sm:col-span-3">
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-green-800"
                >
                  <X size={12} />
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Result count */}
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <p>
          Showing{" "}
          <span className="font-semibold text-foreground">
            {tickets.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-foreground">
            {total.toLocaleString()}
          </span>{" "}
          complaints
          {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
        </p>
        {loading && (
          <span className="inline-flex items-center gap-1 text-green-700">
            <RefreshCw size={11} className="animate-spin" />
            Loading…
          </span>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle
            size={18}
            className="mt-0.5 flex-shrink-0 text-red-600"
          />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900">
              Failed to load complaints
            </p>
            <p className="mt-0.5 text-xs text-red-700">{error}</p>
          </div>
          <button
            onClick={fetchTickets}
            className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {!loading && !error && tickets.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-neutral-50 p-12 text-center">
            <Inbox size={36} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              No complaints match your filters
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try adjusting your search or clearing filters.
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
              >
                <X size={12} />
                Clear filters
              </button>
            )}
          </div>
        )}

        {tickets.map((ticket, i) => (
          <TicketRow
            key={ticket.id}
            ticket={ticket}
            index={i + (page - 1) * pageSize}
            isExpanded={expandedId === ticket.id}
            onToggle={() =>
              setExpandedId(expandedId === ticket.id ? null : ticket.id)
            }
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            Page <span className="font-semibold text-foreground">{page}</span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">{totalPages}</span>
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-neutral-50 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-all hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft size={12} />
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-neutral-50 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm transition-all hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
