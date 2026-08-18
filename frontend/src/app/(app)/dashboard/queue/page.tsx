"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { Ticket, PaginatedResponse } from "@/lib/types";
import { SlaStatus } from "@/components/SlaStatus";
import { useSession } from "@/lib/session";
import {
  Search,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  Send,
  HelpCircle,
  ListChecks,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TABS = [
  { key: "ALL", label: "All", icon: ListChecks },
  { key: "ASSIGNED", label: "To Do", icon: Clock },
  { key: "IN_PROGRESS", label: "In Progress", icon: FileSearch },
  { key: "REOPENED", label: "Reopened", icon: AlertTriangle },
  { key: "PENDING_APPROVAL", label: "Pending Approval", icon: Send },
  { key: "RESOLVED", label: "Resolved", icon: CheckCircle2 },
] as const;

const STATUS_SORT_ORDER: Record<string, number> = {
  REOPENED: 0,
  ASSIGNED: 1,
  IN_PROGRESS: 2,
  PENDING_APPROVAL: 3,
  APPROVED: 4,
  RESOLVED: 5,
  CLOSED: 6,
};

const PRIORITY_STYLES: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  P1: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  P2: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  P3: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  P4: {
    bg: "bg-neutral-50",
    text: "text-muted-foreground",
    dot: "bg-neutral-400",
  },
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> =
  {
    ASSIGNED: {
      bg: "bg-green-100",
      text: "text-green-700",
      dot: "bg-green-500",
    },
    IN_PROGRESS: {
      bg: "bg-amber-100",
      text: "text-amber-700",
      dot: "bg-amber-500",
    },
    PENDING_APPROVAL: {
      bg: "bg-violet-100",
      text: "text-violet-700",
      dot: "bg-violet-500",
    },
    APPROVED: {
      bg: "bg-green-100",
      text: "text-green-700",
      dot: "bg-green-500",
    },
    RESOLVED: {
      bg: "bg-green-100",
      text: "text-green-700",
      dot: "bg-green-500",
    },
    CLOSED: {
      bg: "bg-neutral-50",
      text: "text-muted-foreground",
      dot: "bg-neutral-400",
    },
    REOPENED: {
      bg: "bg-orange-100",
      text: "text-orange-700",
      dot: "bg-orange-500",
    },
  };

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function OfficerQueuePage() {
  const { user } = useSession();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: "1",
        pageSize: "50",
      });
      if (activeTab === "ALL") {
        if (!user?.departmentId) {
          setTickets([]);
          setTotal(0);
          setError("No department is assigned to your account.");
          return;
        }
        params.set("departmentId", user.departmentId);
      } else {
        params.set("assignedOfficerId", "me");
        params.set("status", activeTab);
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
      setError(err instanceof ApiError ? err.message : "Failed to load queue.");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, user?.departmentId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const sortedTickets =
    activeTab === "ALL"
      ? [...tickets].sort((a, b) => {
          const byStatus =
            (STATUS_SORT_ORDER[a.status] ?? 99) -
            (STATUS_SORT_ORDER[b.status] ?? 99);
          if (byStatus !== 0) return byStatus;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        })
      : tickets;

  // Reset search when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchQuery("");
  };

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">My Queue</h1>
          <p className="text-sm text-muted-foreground">
            Department tickets and work assigned to you
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tickets…"
              className="w-48 rounded-lg border border-border bg-neutral-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 sm:w-64"
            />
          </div>
          <button
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-neutral-50 px-3 py-2 text-xs font-medium text-foreground shadow-sm transition-all hover:bg-neutral-50 disabled:opacity-60"
            onClick={fetchTickets}
            disabled={loading}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ---- Tabs with counts ---- */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-neutral-50 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-neutral-50 text-green-700 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={14} />
              {tab.label}
              {isActive && total > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-green-100 px-1 text-[10px] font-bold text-green-700">
                  {total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ---- Error ---- */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ---- Quick Actions Bar ---- */}

      {/* ---- Ticket List ---- */}
      {tickets.length === 0 && !loading ? (
        <div className="rounded-xl border border-border bg-neutral-50 shadow-sm">
          <div className="p-6">
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <CheckCircle2 size={32} className="text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">
                No tickets in this view
              </p>
              <p className="text-xs text-muted-foreground">All caught up!</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-neutral-50 text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">SLA</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedTickets.map((t) => {
                  const statusStyle =
                    STATUS_STYLES[t.status] || STATUS_STYLES.CLOSED;
                  const priorityStyle = t.priority
                    ? PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.P4
                    : null;
                  const needsWork =
                    t.status === "ASSIGNED" || t.status === "REOPENED";
                  const rowBg = t.slaBreached
                    ? "bg-red-50/70 hover:bg-red-50"
                    : needsWork
                      ? "bg-amber-50/70 hover:bg-amber-50"
                      : t.status === "IN_PROGRESS"
                        ? "bg-green-50/50 hover:bg-green-50"
                        : "bg-card hover:bg-neutral-50";
                  return (
                    <tr
                      key={t.id}
                      className={`border-b border-border transition-colors ${rowBg}`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-bold text-green-700">
                        {t.ticketCode}
                      </td>
                      <td className="max-w-[280px] px-4 py-3">
                        <Link
                          href={`/dashboard/complaints/${t.id}`}
                          className="block truncate font-medium text-foreground hover:text-green-700"
                        >
                          {t.subject}
                        </Link>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                          {t.category && <span>{t.category}</span>}
                          {t.department?.name && (
                            <span>{t.department.name}</span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyle.bg} ${statusStyle.text}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
                          />
                          {t.status.replace(/_/g, " ")}
                        </span>
                        {needsWork && (
                          <span className="ml-1.5 inline-flex rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            Due for work
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {priorityStyle && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${priorityStyle.bg} ${priorityStyle.text}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${priorityStyle.dot}`}
                            />
                            {t.priority}
                          </span>
                        )}
                        {!priorityStyle && "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <SlaStatus
                          status={t.status}
                          awaiting={t.awaiting}
                          slaStartedAt={t.slaStartedAt}
                          slaTargetHours={t.slaTargetHours}
                          slaRemainingHours={t.slaRemainingHours}
                          slaBreached={t.slaBreached}
                          feedbackSatisfied={t.feedback?.satisfied}
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                        {new Date(t.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/complaints/${t.id}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
                        >
                          Open
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

      {/* ---- Total count ---- */}
      {total > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {total} ticket{total !== 1 ? "s" : ""} in this view
        </p>
      )}
    </div>
  );
}
