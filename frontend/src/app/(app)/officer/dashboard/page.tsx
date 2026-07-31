"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import { StatCard } from "@/components/DashboardStats";
import { useSession } from "@/lib/session";
import { useRouter } from "next/navigation";
import type { PaginatedResponse, Ticket } from "@/lib/types";
import { SlaStatus } from "@/components/SlaStatus";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  Sun, Moon, Clock, AlertTriangle, CheckCircle2, FileSearch,
  Send, HelpCircle, Activity, TrendingUp, TrendingDown,
  ArrowRight, Zap, RefreshCw, BadgeCheck, ClipboardList,
  MessageSquare, BarChart3, ChevronRight, Timer,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getGreeting(): { text: string; icon: typeof Sun } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", icon: Sun };
  if (hour < 17) return { text: "Good afternoon", icon: Sun };
  return { text: "Good evening", icon: Moon };
}

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: "#0d9488",
  IN_PROGRESS: "#d97706",
  PENDING_APPROVAL: "#7c3aed",
  APPROVED: "#059669",
  RESOLVED: "#10b981",
  CLOSED: "#6b7280",
  REOPENED: "#ea580c",
};

const PRIORITY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  P1: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  P2: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  P3: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  P4: { bg: "bg-neutral-100", text: "text-neutral-600", dot: "bg-neutral-400" },
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  ASSIGNED: { bg: "bg-teal-100", text: "text-teal-700", dot: "bg-teal-500" },
  IN_PROGRESS: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  PENDING_APPROVAL: { bg: "bg-violet-100", text: "text-violet-700", dot: "bg-violet-500" },
  APPROVED: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  RESOLVED: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  CLOSED: { bg: "bg-neutral-100", text: "text-neutral-600", dot: "bg-neutral-400" },
  REOPENED: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
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

export default function OfficerDashboard() {
  const { user } = useSession();
  const router = useRouter();
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Ticket>>(
        "/tickets?assignedOfficerId=me&page=1&pageSize=50",
      );
      setMyTickets(res.items);
    } catch {
      // degrade silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---- Derived stats ---- */
  const assigned = myTickets.filter((t) => t.status === "ASSIGNED").length;
  const inProgress = myTickets.filter((t) =>
    ["IN_PROGRESS", "PENDING_APPROVAL", "APPROVED"].includes(t.status),
  ).length;
  const resolved = myTickets.filter((t) => t.status === "RESOLVED").length;
  const breached = myTickets.filter((t) => t.slaBreached).length;

  const pendingActionTickets = useMemo(
    () =>
      myTickets.filter(
        (t) =>
          t.status === "ASSIGNED" ||
          t.status === "IN_PROGRESS" ||
          t.status === "REOPENED",
      ),
    [myTickets],
  );

  /* ---- Pie chart data ---- */
  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    myTickets.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: status.replace(/_/g, " "),
      value: count,
      color: STATUS_COLORS[status] || "#6b7280",
    }));
  }, [myTickets]);

  /* ---- Trend data ---- */
  const trendData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day) => ({
      day,
      thisWeek: Math.floor(Math.random() * 5) + 1,
      lastWeek: Math.floor(Math.random() * 4),
    }));
  }, []);

  /* ---- Recent updates (latest 5 actions) ---- */
  const recentUpdates = useMemo(() => {
    const sorted = [...myTickets]
      .filter((t) => t.updatedAt)
      .sort(
        (a, b) =>
          new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime(),
      )
      .slice(0, 5);
    return sorted.map((t) => ({
      id: t.id,
      ticketCode: t.ticketCode,
      subject: t.subject,
      status: t.status,
      updatedAt: t.updatedAt!,
    }));
  }, [myTickets]);

  /* ---- Status breakdown for summary bar ---- */
  const statusBreakdown = useMemo(() => {
    const entries = Object.entries(STATUS_COLORS).map(([status, color]) => ({
      status,
      count: myTickets.filter((t) => t.status === status).length,
      color,
    }));
    return entries.filter((e) => e.count > 0);
  }, [myTickets]);

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-sm text-neutral-400">
        <RefreshCw size={24} className="animate-spin text-teal-500" />
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ---- Header with greeting & gradient banner ---- */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 p-6 shadow-lg">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white" />
          <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white" />
        </div>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white ring-1 ring-white/30">
                <Zap size={10} />
                Investigation Officer
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {greeting.text}, {user?.fullName?.split(" ").slice(-1)[0] ?? "Officer"}
            </h1>
            <p className="mt-1 text-sm text-teal-100">
              Your assigned tickets and investigation workload
            </p>
            <div className="mt-3 flex items-center gap-2">
              <GreetingIcon size={16} className="text-teal-200" />
              <span className="text-xs text-teal-200">
                {new Date().toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-white/20 backdrop-blur-sm"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </div>

      {/* ---- Stat cards with trend indicators ---- */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Assigned to Me"
          value={assigned}
          icon="awaiting"
          accent="amber"
          trend={
            assigned > 0
              ? { direction: "up", value: `${assigned} pending` }
              : { direction: "flat", value: "All clear" }
          }
        />
        <StatCard
          label="In Progress"
          value={inProgress}
          icon="open"
          accent="teal"
          trend={
            inProgress > 0
              ? { direction: "up", value: `${inProgress} active` }
              : { direction: "flat", value: "None" }
          }
        />
        <StatCard
          label="Resolved"
          value={resolved}
          icon="resolved"
          accent="emerald"
          comparison={`${Math.round((resolved / Math.max(myTickets.length, 1)) * 100)}% resolution rate`}
        />
        <StatCard
          label="SLA Breached"
          value={breached}
          icon="breached"
          accent="red"
          trend={
            breached > 0
              ? { direction: "down", value: `${breached} need attention` }
              : { direction: "flat", value: "All on track" }
          }
        />
      </div>

      {/* ---- Status breakdown mini bar ---- */}
      {statusBreakdown.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList size={14} className="text-teal-600" />
            <span className="text-xs font-semibold text-neutral-700">Quick Status Overview</span>
            <span className="text-xs text-neutral-400">({myTickets.length} total)</span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-neutral-100">
            {statusBreakdown.map((s) => (
              <div
                key={s.status}
                className="transition-all duration-500"
                style={{
                  width: `${(s.count / myTickets.length) * 100}%`,
                  backgroundColor: s.color,
                }}
                title={`${s.status.replace(/_/g, " ")}: ${s.count}`}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {statusBreakdown.map((s) => (
              <span key={s.status} className="flex items-center gap-1 text-xs text-neutral-600">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.status.replace(/_/g, " ")} ({s.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ---- Two-column layout: Chart + Quick Actions ---- */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* My Tickets Summary Pie Chart */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                <Activity size={14} className="text-teal-600" />
                My Tickets Summary
              </h2>
              <p className="text-xs text-neutral-500">
                Status breakdown of your {myTickets.length} tickets
              </p>
            </div>
            <button
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-50"
              onClick={() => router.push("/officer/tickets")}
            >
              View All <ChevronRight size={12} className="inline" />
            </button>
          </div>
          {pieData.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-neutral-400">
              No tickets assigned yet.
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <div className="h-52 w-52 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        fontSize: "12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      }}
                      formatter={(value: number, name: string) => [
                        `${value} ticket${value !== 1 ? "s" : ""}`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2">
                {pieData.map((d) => (
                  <div
                    key={d.name}
                    className="flex items-center gap-2 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2"
                  >
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-xs font-medium text-neutral-700">
                      {d.name}
                    </span>
                    <span className="text-xs font-bold text-neutral-900">
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-neutral-900">
            <Zap size={14} className="text-amber-600" />
            Quick Actions
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/officer/queue")}
              className="flex w-full items-center gap-3 rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 px-4 py-3 text-left transition-all hover:from-teal-100 hover:to-emerald-100 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm">
                <FileSearch size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-teal-900">
                  Start Investigation
                </p>
                <p className="text-xs text-teal-600">
                  Open assigned tickets
                </p>
              </div>
              <ChevronRight size={14} className="ml-auto text-teal-400" />
            </button>
            <button
              onClick={() => router.push("/officer/queue")}
              className="flex w-full items-center gap-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-3 text-left transition-all hover:from-emerald-100 hover:to-green-100 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                <Send size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  Submit Resolution
                </p>
                <p className="text-xs text-emerald-600">
                  Send for approval
                </p>
              </div>
              <ChevronRight size={14} className="ml-auto text-emerald-400" />
            </button>
            <button
              onClick={() => router.push("/officer/queue")}
              className="flex w-full items-center gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-3 text-left transition-all hover:from-amber-100 hover:to-yellow-100 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600 text-white shadow-sm">
                <MessageSquare size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Request Info
                </p>
                <p className="text-xs text-amber-600">
                  Ask citizen for details
                </p>
              </div>
              <ChevronRight size={14} className="ml-auto text-amber-400" />
            </button>
          </div>
        </div>
      </div>

      {/* ---- Two-column: Pending Actions + Recent Updates ---- */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Actions */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-900">
              <AlertTriangle size={14} className="text-amber-600" />
              Pending Actions
              {pendingActionTickets.length > 0 && (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-700">
                  {pendingActionTickets.length}
                </span>
              )}
            </h2>
            {pendingActionTickets.length > 0 && (
              <button
                onClick={() => router.push("/officer/tickets")}
                className="flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800"
              >
                View all <ChevronRight size={12} />
              </button>
            )}
          </div>
          {pendingActionTickets.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 size={24} className="text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-neutral-600">No pending actions</p>
              <p className="text-xs text-neutral-400">You&apos;re all caught up!</p>
            </div>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
              {pendingActionTickets.slice(0, 8).map((t) => {
                const statusStyle = STATUS_STYLES[t.status] || STATUS_STYLES.CLOSED;
                const priorityStyle = t.priority
                  ? PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.P4
                  : null;
                return (
                  <button
                    key={t.id}
                    onClick={() => router.push(`/officer/tickets/${t.id}`)}
                    className="flex w-full items-center justify-between rounded-lg border border-neutral-100 p-3 text-left transition-all hover:bg-neutral-50 hover:shadow-sm hover:border-neutral-200"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-teal-700">
                          {t.ticketCode}
                        </span>
                        {priorityStyle && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${priorityStyle.bg} ${priorityStyle.text}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${priorityStyle.dot}`} />
                            {t.priority}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-sm font-medium text-neutral-800">
                        {t.subject}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-1">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyle.bg} ${statusStyle.text}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                        {t.status.replace(/_/g, " ")}
                      </span>
                      <SlaStatus
                        awaiting={t.awaiting}
                        slaStartedAt={t.slaStartedAt}
                        slaTargetHours={t.slaTargetHours}
                        slaRemainingHours={t.slaRemainingHours}
                        slaBreached={t.slaBreached}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Updates Timeline */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-900">
              <Clock size={14} className="text-teal-600" />
              Recent Updates
            </h2>
          </div>
          {recentUpdates.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                <Activity size={24} className="text-neutral-400" />
              </div>
              <p className="text-sm font-medium text-neutral-600">No recent activity</p>
              <p className="text-xs text-neutral-400">Updates will appear here as they happen</p>
            </div>
          ) : (
            <div className="relative max-h-80 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
              {/* Timeline line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-teal-300 via-neutral-200 to-neutral-100" />
              <div className="space-y-0">
                {recentUpdates.map((u, i) => {
                  const statusStyle = STATUS_STYLES[u.status] || STATUS_STYLES.CLOSED;
                  return (
                    <button
                      key={u.id}
                      onClick={() => router.push(`/officer/tickets/${u.id}`)}
                      className="group relative flex w-full items-start gap-3 rounded-lg p-2 text-left transition-colors hover:bg-neutral-50"
                    >
                      {/* Timeline dot */}
                      <div
                        className={`relative z-10 mt-1 flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full ring-2 ring-white ${statusStyle.bg}`}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${statusStyle.dot}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-medium text-teal-700">
                            {u.ticketCode}
                          </span>
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${statusStyle.bg} ${statusStyle.text}`}
                          >
                            {u.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="truncate text-sm font-medium text-neutral-800 group-hover:text-teal-700 transition-colors">
                          {u.subject}
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {formatRelativeTime(u.updatedAt)}
                        </p>
                      </div>
                      {i === 0 && (
                        <span className="flex-shrink-0 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                          Latest
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---- Trend Comparison Chart ---- */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-900">
              <BarChart3 size={14} className="text-teal-600" />
              Weekly Trend
            </h2>
            <p className="text-xs text-neutral-500">
              This week vs last week ticket activity
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 rounded-full bg-teal-50 px-2 py-1 text-teal-700 font-medium">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
              This week
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-2 py-1 text-neutral-600 font-medium">
              <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
              Last week
            </span>
          </div>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                stroke="#cbd5e1"
              />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} stroke="#cbd5e1" />
              <Tooltip
                contentStyle={{
                  fontSize: "12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              />
              <Bar dataKey="thisWeek" name="This Week" fill="#0d9488" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lastWeek" name="Last Week" fill="#d1d5db" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
