"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Ticket, PaginatedResponse, Department } from "@/lib/types";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  Filter,
  X,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  UserPlus,
  Flag,
  FileSpreadsheet,
  SlidersHorizontal,
  Calendar,
  AlertCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "ACKNOWLEDGED", label: "Received" },
  { value: "TRIAGED", label: "Being Routed" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "Under Investigation" },
  { value: "PENDING_APPROVAL", label: "Pending Approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
  { value: "REOPENED", label: "Reopened" },
  { value: "ESCALATED", label: "Escalated" },
  { value: "REFERRED", label: "Referred" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "All priorities" },
  { value: "P1", label: "P1 - Critical" },
  { value: "P2", label: "P2 - High" },
  { value: "P3", label: "P3 - Medium" },
  { value: "P4", label: "P4 - Low" },
];

const CHANNEL_OPTIONS = [
  { value: "", label: "All channels" },
  { value: "WEB", label: "Web" },
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Phone" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "SMS", label: "SMS" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const STATUS_COLORS: Record<string, string> = {
  ACKNOWLEDGED: "bg-green-100 text-green-700",
  TRIAGED: "bg-purple-100 text-purple-700",
  ASSIGNED: "bg-violet-100 text-violet-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-neutral-50 text-muted-foreground",
  REOPENED: "bg-orange-100 text-orange-700",
  ESCALATED: "bg-red-100 text-red-700",
  REFERRED: "bg-violet-100 text-violet-700",
};

const STATUS_DOT_COLORS: Record<string, string> = {
  ACKNOWLEDGED: "bg-green-400",
  TRIAGED: "bg-purple-400",
  ASSIGNED: "bg-violet-400",
  IN_PROGRESS: "bg-amber-400",
  PENDING_APPROVAL: "bg-yellow-400",
  APPROVED: "bg-green-400",
  RESOLVED: "bg-green-400",
  CLOSED: "bg-neutral-400",
  REOPENED: "bg-orange-400",
  ESCALATED: "bg-red-400",
  REFERRED: "bg-violet-400",
};

const PRIORITY_COLORS: Record<string, string> = {
  P1: "bg-red-100 text-red-700 border-red-200",
  P2: "bg-orange-100 text-orange-700 border-orange-200",
  P3: "bg-yellow-100 text-yellow-700 border-yellow-200",
  P4: "bg-neutral-50 text-muted-foreground border-border",
};

const PRIORITY_DOT_COLORS: Record<string, string> = {
  P1: "bg-red-500",
  P2: "bg-orange-500",
  P3: "bg-yellow-500",
  P4: "bg-neutral-400",
};

const selectClass =
  "rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 bg-neutral-50";

/* ------------------------------------------------------------------ */
/*  Sort direction type                                                */
/* ------------------------------------------------------------------ */

type SortField =
  | "ticketCode"
  | "subject"
  | "status"
  | "priority"
  | "department"
  | "createdAt";
type SortDir = "asc" | "desc";

/* ------------------------------------------------------------------ */
/*  Bulk Actions Dropdown                                              */
/* ------------------------------------------------------------------ */

function BulkActionsDropdown({
  selectedCount,
  onAction,
}: {
  selectedCount: number;
  onAction: (action: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (selectedCount === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
      >
        <span>{selectedCount} selected</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full mt-2 w-48 rounded-lg border border-border bg-neutral-50 shadow-lg z-10"
          style={{ filter: "drop-shadow(0 4px 6px -4px rgba(0,0,0,0.07))" }}
        >
          <div className="p-2">
            <button
              onClick={() => {
                onAction("assign");
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-green-50 hover:text-green-700"
            >
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              Assign
            </button>
            <button
              onClick={() => {
                onAction("priority");
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-green-50 hover:text-green-700"
            >
              <Flag className="h-4 w-4 text-muted-foreground" />
              Change Priority
            </button>
            <button
              onClick={() => {
                onAction("export");
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-green-50 hover:text-green-700"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
              Export Selected
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function AllComplaintsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sorting
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (statusFilter) params.set("status", statusFilter);
      if (deptFilter) params.set("departmentId", deptFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      if (channelFilter) params.set("channel", channelFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const data = await api.get<PaginatedResponse<Ticket>>(
        `/tickets?${params.toString()}`,
      );
      setTickets(data.items);
      setTotal(data.total);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    pageSize,
    statusFilter,
    deptFilter,
    priorityFilter,
    channelFilter,
    dateFrom,
    dateTo,
  ]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    api
      .get<Department[]>("/departments")
      .then(setDepartments)
      .catch(() => {});
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [
    statusFilter,
    deptFilter,
    priorityFilter,
    channelFilter,
    dateFrom,
    dateTo,
  ]);

  // Clear selection when page/filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, statusFilter, deptFilter, priorityFilter, channelFilter]);

  const totalPages = Math.ceil(total / pageSize);

  /* ---- Selection handlers ---- */
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === tickets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tickets.map((t) => t.id)));
    }
  };

  const handleBulkAction = (action: string) => {
    // Placeholder for bulk actions
    alert(
      `Action "${action}" on ${selectedIds.size} tickets. This is a placeholder.`,
    );
  };

  /* ---- Sorting handler ---- */
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  /* ---- Sort tickets client-side ---- */
  const sortedTickets = [...tickets].sort((a, b) => {
    let aVal: string | number = "";
    let bVal: string | number = "";

    switch (sortField) {
      case "ticketCode":
        aVal = a.ticketCode;
        bVal = b.ticketCode;
        break;
      case "subject":
        aVal = a.subject;
        bVal = b.subject;
        break;
      case "status":
        aVal = a.status;
        bVal = b.status;
        break;
      case "priority":
        aVal = a.priority ?? "";
        bVal = b.priority ?? "";
        break;
      case "department":
        aVal = a.department?.name ?? "";
        bVal = b.department?.name ?? "";
        break;
      case "createdAt":
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
        break;
    }

    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  /* ---- Sort icon helper ---- */
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 text-green-600" />
    ) : (
      <ArrowDown className="h-3 w-3 text-green-600" />
    );
  };

  /* ---- Clear all filters ---- */
  const hasActiveFilters =
    statusFilter ||
    deptFilter ||
    priorityFilter ||
    channelFilter ||
    dateFrom ||
    dateTo;

  const clearAllFilters = () => {
    setStatusFilter("");
    setDeptFilter("");
    setPriorityFilter("");
    setChannelFilter("");
    setDateFrom("");
    setDateTo("");
  };

  /* ---- Pagination helpers ---- */
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            All Complaints
          </h1>
          <p className="text-sm text-muted-foreground">
            {total} complaint{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Bulk actions */}
          <BulkActionsDropdown
            selectedCount={selectedIds.size}
            onAction={handleBulkAction}
          />
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-border bg-neutral-50 text-foreground hover:bg-neutral-50"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {hasActiveFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-[9px] font-bold text-white">
                {
                  [
                    statusFilter,
                    deptFilter,
                    priorityFilter,
                    channelFilter,
                    dateFrom,
                    dateTo,
                  ].filter(Boolean).length
                }
              </span>
            )}
          </button>
          {/* Refresh */}
          <button
            className="flex items-center gap-1.5 rounded-lg border border-border bg-neutral-50 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-neutral-50 disabled:opacity-60"
            onClick={fetchTickets}
            disabled={loading}
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-neutral-50 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">
              Advanced Filters
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
              >
                <X className="h-3 w-3" />
                Clear All
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={selectClass}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {/* Department */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className={selectClass}
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            {/* Priority */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className={selectClass}
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {/* Channel */}
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className={selectClass}
            >
              {CHANNEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {/* Date from */}
            <div className="relative">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 bg-neutral-50"
                placeholder="From date"
              />
              {!dateFrom && (
                <Calendar className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              )}
            </div>
            {/* Date to */}
            <div className="relative">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 bg-neutral-50"
                placeholder="To date"
              />
              {!dateTo && (
                <Calendar className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {statusFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-xs font-medium text-green-700">
              Status:{" "}
              {STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label}
              <button
                onClick={() => setStatusFilter("")}
                className="text-green-500 hover:text-green-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {deptFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-xs font-medium text-green-700">
              Dept:{" "}
              {departments.find((d) => d.id === deptFilter)?.name ?? deptFilter}
              <button
                onClick={() => setDeptFilter("")}
                className="text-green-500 hover:text-green-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {priorityFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-xs font-medium text-green-700">
              Priority:{" "}
              {PRIORITY_OPTIONS.find((o) => o.value === priorityFilter)?.label}
              <button
                onClick={() => setPriorityFilter("")}
                className="text-green-500 hover:text-green-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {channelFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-xs font-medium text-green-700">
              Channel:{" "}
              {CHANNEL_OPTIONS.find((o) => o.value === channelFilter)?.label}
              <button
                onClick={() => setChannelFilter("")}
                className="text-green-500 hover:text-green-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {dateFrom && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-xs font-medium text-green-700">
              From: {dateFrom}
              <button
                onClick={() => setDateFrom("")}
                className="text-green-500 hover:text-green-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {dateTo && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-xs font-medium text-green-700">
              To: {dateTo}
              <button
                onClick={() => setDateTo("")}
                className="text-green-500 hover:text-green-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          <button
            onClick={clearAllFilters}
            className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Table */}
      {tickets.length === 0 && !loading ? (
        <div className="rounded-xl border border-border bg-neutral-50 shadow-sm">
          <div className="p-6">
            <div className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No complaints found matching your filters.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="mt-2 text-xs font-medium text-green-600 hover:text-green-700 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-neutral-50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-neutral-50 text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3 w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center justify-center"
                    >
                      {selectedIds.size === tickets.length &&
                      tickets.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-green-600" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button
                      onClick={() => handleSort("ticketCode")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Ticket <SortIcon field="ticketCode" />
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button
                      onClick={() => handleSort("subject")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Subject <SortIcon field="subject" />
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button
                      onClick={() => handleSort("status")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Status <SortIcon field="status" />
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button
                      onClick={() => handleSort("priority")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Priority <SortIcon field="priority" />
                    </button>
                  </th>
                  <th className="px-4 py-3">
                    <button
                      onClick={() => handleSort("department")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Department <SortIcon field="department" />
                    </button>
                  </th>
                  <th className="px-4 py-3">Officer</th>
                  <th className="px-4 py-3">
                    <button
                      onClick={() => handleSort("createdAt")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Submitted <SortIcon field="createdAt" />
                    </button>
                  </th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedTickets.map((t) => {
                  const isSelected = selectedIds.has(t.id);
                  const priorityBadge =
                    PRIORITY_COLORS[t.priority ?? ""] ??
                    "bg-neutral-50 text-muted-foreground border-border";
                  const priorityDot =
                    PRIORITY_DOT_COLORS[t.priority ?? ""] ?? "bg-neutral-400";
                  const statusDot =
                    STATUS_DOT_COLORS[t.status] ?? "bg-neutral-400";

                  return (
                    <tr
                      key={t.id}
                      className={`border-b border-border transition-colors ${
                        isSelected
                          ? "bg-green-50/60 hover:bg-green-50/80"
                          : "hover:bg-neutral-50"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSelect(t.id)}
                          className="flex items-center justify-center"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-green-600" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground hover:text-muted-foreground" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-green-700 font-medium">
                          {t.ticketCode}
                        </span>
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 font-medium text-foreground">
                        {t.subject}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[t.status] ?? "bg-neutral-50 text-muted-foreground"}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${statusDot}`}
                          />
                          {STATUS_OPTIONS.find((o) => o.value === t.status)
                            ?.label ?? t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {t.priority ? (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityBadge}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${priorityDot}`}
                            />
                            {t.priority}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t.department?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t.assignedOfficer?.fullName ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/complaints/${t.id}`}
                          className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 hover:text-green-800"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Items per page + count */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-md border border-border px-2 py-1 text-xs outline-none focus:border-green-600 bg-neutral-50"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="text-xs text-muted-foreground">per page</span>
            </div>
            <span className="text-xs text-muted-foreground">
              Showing {startItem}–{endItem} of {total}
            </span>
          </div>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium text-foreground transition-colors hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {getPageNumbers().map((p, i) =>
              typeof p === "string" ? (
                <span
                  key={`ellipsis-${i}`}
                  className="flex h-8 w-8 items-center justify-center text-xs text-muted-foreground"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                    p === page
                      ? "bg-green-600 text-white"
                      : "text-foreground hover:bg-neutral-50"
                  }`}
                >
                  {p}
                </button>
              ),
            )}
            <button
              className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium text-foreground transition-colors hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
