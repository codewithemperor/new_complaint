"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { StatCard } from "@/components/DashboardStats";
import { useSession } from "@/lib/session";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import {
  ShieldCheck, Inbox, Clock, AlertTriangle, CheckCircle2,
  ArrowRight, FileCheck, Building2, TrendingUp, TrendingDown,
  Bell, Zap, RefreshCw, ChevronRight, MessageSquare, BarChart3,
  ArrowUpRight, ArrowDownRight, Minus, Eye, ThumbsUp, ThumbsDown,
  Sun, Moon, ClipboardList, Users, Timer,
} from "lucide-react";

interface OverviewStats {
  total: number;
  open: number;
  resolved: number;
  closed: number;
  breached: number;
  reopened: number;
  acknowledged: number;
  pendingApproval: number;
}

interface TrendPoint {
  date: string;
  total: number;
  resolved: number;
  open: number;
}

interface ApprovalRequest {
  id: string;
  status: string;
  approverRole?: string;
  createdAt: string;
  decidedAt?: string | null;
  note?: string | null;
  ticket?: {
    id: string;
    ticketCode: string;
    subject: string;
    priority?: string | null;
    status: string;
    department?: { name: string } | null;
    assignedOfficer?: { fullName: string } | null;
  };
}

interface DepartmentStat {
  departmentId: string;
  departmentName: string;
  total: number;
  open: number;
  resolved: number;
  breached: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getGreeting(): { text: string; icon: typeof Sun } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", icon: Sun };
  if (hour < 17) return { text: "Good afternoon", icon: Sun };
  return { text: "Good evening", icon: Moon };
}

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

const PRIORITY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  P1: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  P2: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  P3: { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  P4: { bg: "bg-neutral-100", text: "text-neutral-600", dot: "bg-neutral-400" },
};

const DEPT_COLORS = [
  "#0d9488", "#059669", "#d97706", "#7c3aed",
  "#ea580c", "#dc2626", "#2563eb", "#6b7280",
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PsDashboard() {
  const { user } = useSession();
  const [stats, setStats] = useState<Partial<OverviewStats>>({});
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [departments, setDepartments] = useState<DepartmentStat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, trendRes, approvalsRes, deptRes] = await Promise.allSettled([
        api.get<OverviewStats>("/reports/overview"),
        api.get<TrendPoint[]>("/reports/trend?days=30"),
        api.get<{ items?: ApprovalRequest[] } | ApprovalRequest[]>("/approval-requests?pageSize=10"),
        api.get<DepartmentStat[]>("/reports/departments"),
      ]);

      if (overviewRes.status === "fulfilled") setStats(overviewRes.value);
      if (trendRes.status === "fulfilled") setTrend(trendRes.value);
      if (approvalsRes.status === "fulfilled") {
        const v = approvalsRes.value;
        setApprovals(Array.isArray(v) ? v : v.items ?? []);
      }
      if (deptRes.status === "fulfilled") setDepartments(deptRes.value);
    } catch {
      // degrade silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;
  const pendingCount = stats.pendingApproval ?? 0;

  /* ---- Escalation summary (recent escalations from approvals) ---- */
  const escalations = useMemo(
    () => approvals.filter((a) => a.status === "PENDING" && a.ticket?.priority === "P1" || a.status === "PENDING"),
    [approvals],
  );

  /* ---- Department pie data ---- */
  const deptPieData = useMemo(() => {
    if (departments.length === 0) {
      // Generate placeholder data from stats
      return [
        { name: "Open", value: stats.open ?? 0, color: "#d97706" },
        { name: "Resolved", value: stats.resolved ?? 0, color: "#059669" },
        { name: "Closed", value: stats.closed ?? 0, color: "#6b7280" },
        { name: "Breached", value: stats.breached ?? 0, color: "#dc2626" },
      ].filter((d) => d.value > 0);
    }
    return departments.map((d, i) => ({
      name: d.departmentName,
      value: d.total,
      color: DEPT_COLORS[i % DEPT_COLORS.length],
    }));
  }, [departments, stats]);

  /* ---- Department bar chart data ---- */
  const deptBarData = useMemo(() => {
    if (departments.length === 0) {
      return [
        { name: "All", open: stats.open ?? 0, resolved: stats.resolved ?? 0 },
      ];
    }
    return departments.slice(0, 6).map((d) => ({
      name: d.departmentName.length > 12 ? d.departmentName.substring(0, 12) + "…" : d.departmentName,
      open: d.open,
      resolved: d.resolved,
    }));
  }, [departments, stats]);

  /* ---- Stats trend comparison ---- */
  const openTrend = useMemo(() => {
    const recent = trend.slice(-7);
    const prev = trend.slice(-14, -7);
    const recentAvg = recent.length > 0 ? recent.reduce((s, t) => s + t.open, 0) / recent.length : 0;
    const prevAvg = prev.length > 0 ? prev.reduce((s, t) => s + t.open, 0) / prev.length : 0;
    if (prevAvg === 0) return { direction: "flat" as const, value: "No prior data" };
    const pct = Math.round(((recentAvg - prevAvg) / prevAvg) * 100);
    if (pct > 0) return { direction: "up" as const, value: `+${pct}%` };
    if (pct < 0) return { direction: "down" as const, value: `${pct}%` };
    return { direction: "flat" as const, value: "0%" };
  }, [trend]);

  const resolvedTrend = useMemo(() => {
    const recent = trend.slice(-7);
    const prev = trend.slice(-14, -7);
    const recentAvg = recent.length > 0 ? recent.reduce((s, t) => s + t.resolved, 0) / recent.length : 0;
    const prevAvg = prev.length > 0 ? prev.reduce((s, t) => s + t.resolved, 0) / prev.length : 0;
    if (prevAvg === 0) return { direction: "flat" as const, value: "No prior data" };
    const pct = Math.round(((recentAvg - prevAvg) / prevAvg) * 100);
    if (pct > 0) return { direction: "up" as const, value: `+${pct}%` };
    if (pct < 0) return { direction: "down" as const, value: `${pct}%` };
    return { direction: "flat" as const, value: "0%" };
  }, [trend]);

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-sm text-neutral-400">
        <RefreshCw size={24} className="animate-spin text-emerald-500" />
        Loading PS dashboard…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ---- Header with gradient banner ---- */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-500 p-6 shadow-lg">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white" />
          <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-white" />
          <div className="absolute right-40 bottom-0 h-32 w-32 rounded-full bg-white" />
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
              {greeting.text}, {user?.fullName?.split(" ").slice(-1)[0] ?? "PS"}
            </h1>
            <p className="mt-1 text-sm text-emerald-100">
              Executive oversight · Approval queue · Department accountability
            </p>
            <div className="mt-3 flex items-center gap-2">
              <GreetingIcon size={16} className="text-emerald-200" />
              <span className="text-xs text-emerald-200">
                {new Date().toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-white/20 backdrop-blur-sm"
            >
              <RefreshCw size={12} />
              Refresh
            </button>
            <Link
              href="/ps/inbox"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-50"
            >
              <Inbox size={13} />
              Open Approvals Inbox
              {pendingCount > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* ---- Pending approval alert banner ---- */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 ring-2 ring-amber-200">
            <AlertTriangle size={20} className="text-amber-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              {pendingCount} approval request{pendingCount === 1 ? "" : "s"} awaiting your review
            </p>
            <p className="text-xs text-amber-700">
              Decisions on resolved complaints require your sign-off before closure.
            </p>
          </div>
          <Link
            href="/ps/inbox"
            className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors"
          >
            Review now <ArrowRight size={11} />
          </Link>
        </div>
      )}

      {/* ---- Stat cards with trend indicators ---- */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Total Complaints"
          value={stats.total ?? 0}
          icon="total"
          accent="teal"
          trend={openTrend}
        />
        <StatCard
          label="Open"
          value={stats.open ?? 0}
          icon="open"
          accent="amber"
          trend={openTrend}
        />
        <StatCard
          label="Pending Approval"
          value={stats.pendingApproval ?? 0}
          icon="awaiting"
          accent="amber"
          trend={
            pendingCount > 0
              ? { direction: "up", value: `${pendingCount} pending` }
              : { direction: "flat", value: "All clear" }
          }
        />
        <StatCard
          label="Resolved"
          value={stats.resolved ?? 0}
          icon="resolved"
          accent="emerald"
          trend={resolvedTrend}
        />
      </div>

      {/* ---- Department Overview + Escalation Summary ---- */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Department Overview Cards */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                <Building2 size={14} className="text-emerald-600" />
                Department Overview
              </h2>
              <p className="text-xs text-neutral-500">
                Open vs resolved across departments
              </p>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptBarData} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
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
                <Bar dataKey="open" name="Open" fill="#d97706" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Mini department stat cards */}
          {departments.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {departments.slice(0, 6).map((d, i) => (
                <div
                  key={d.departmentId}
                  className="flex items-center gap-2 rounded-lg border border-neutral-100 bg-neutral-50 p-2.5"
                >
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: DEPT_COLORS[i % DEPT_COLORS.length] }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-neutral-700">
                      {d.departmentName}
                    </p>
                    <p className="text-[10px] text-neutral-500">
                      {d.open} open · {d.resolved} resolved
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Escalation Summary */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-900">
              <AlertTriangle size={14} className="text-red-500" />
              Escalation Summary
            </h2>
            <span className="inline-flex items-center justify-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
              {escalations.length} pending
            </span>
          </div>
          {escalations.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 size={24} className="text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-neutral-600">No escalations</p>
              <p className="text-xs text-neutral-400">Everything is running smoothly</p>
            </div>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
              {escalations.slice(0, 8).map((a) => {
                const priorityStyle = a.ticket?.priority
                  ? PRIORITY_STYLES[a.ticket.priority] || PRIORITY_STYLES.P4
                  : null;
                return (
                  <Link
                    key={a.id}
                    href={`/ps/inbox`}
                    className="flex items-start gap-3 rounded-lg border border-neutral-100 p-3 transition-all hover:bg-amber-50 hover:border-amber-200"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                      <AlertTriangle size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-teal-700">
                          {a.ticket?.ticketCode ?? "—"}
                        </span>
                        {priorityStyle && (
                          <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${priorityStyle.bg} ${priorityStyle.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${priorityStyle.dot}`} />
                            {a.ticket!.priority}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-sm font-medium text-neutral-800">
                        {a.ticket?.subject ?? "Untitled complaint"}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-neutral-500">
                        {a.ticket?.department?.name && (
                          <span className="inline-flex items-center gap-0.5">
                            <Building2 size={10} />
                            {a.ticket.department.name}
                          </span>
                        )}
                        <span>{formatRelativeTime(a.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-4 border-t border-neutral-100 pt-4">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-bold text-neutral-700">
              <Zap size={12} className="text-emerald-600" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link
                href="/ps/inbox"
                className="flex w-full items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-left transition-all hover:bg-emerald-100 hover:shadow-sm"
              >
                <ThumbsUp size={14} className="text-emerald-600" />
                <div>
                  <p className="text-xs font-semibold text-emerald-900">Approve Resolutions</p>
                  <p className="text-[10px] text-emerald-600">Review pending approvals</p>
                </div>
                <ChevronRight size={12} className="ml-auto text-emerald-400" />
              </Link>
              <Link
                href="/ps/inbox"
                className="flex w-full items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-left transition-all hover:bg-red-100 hover:shadow-sm"
              >
                <ThumbsDown size={14} className="text-red-600" />
                <div>
                  <p className="text-xs font-semibold text-red-900">Return / Reject</p>
                  <p className="text-[10px] text-red-600">Send back for revision</p>
                </div>
                <ChevronRight size={12} className="ml-auto text-red-400" />
              </Link>
              <Link
                href="/admin/reports"
                className="flex w-full items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2.5 text-left transition-all hover:bg-teal-100 hover:shadow-sm"
              >
                <BarChart3 size={14} className="text-teal-600" />
                <div>
                  <p className="text-xs font-semibold text-teal-900">View Reports</p>
                  <p className="text-[10px] text-teal-600">Full department analytics</p>
                </div>
                <ChevronRight size={12} className="ml-auto text-teal-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Trend chart ---- */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-900">
              <TrendingUp size={14} className="text-emerald-600" />
              Complaints Trend (30 days)
            </h2>
            <p className="text-xs text-neutral-500">Submissions vs. resolutions over time</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 rounded-full bg-teal-50 px-2 py-1 font-medium text-teal-700">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
              New
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Resolved
            </span>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickFormatter={(v) => v.slice(5)}
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
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Line
                type="monotone"
                dataKey="total"
                name="New"
                stroke="#0d9488"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="resolved"
                name="Resolved"
                stroke="#059669"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ---- Pending approvals list ---- */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-900">
            <FileCheck size={14} className="text-amber-600" />
            Recent Approval Requests
          </h2>
          <Link
            href="/ps/inbox"
            className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800"
          >
            View all <ChevronRight size={11} />
          </Link>
        </div>

        {approvals.length > 0 ? (
          <div className="max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
            <ul className="divide-y divide-neutral-100">
              {approvals.slice(0, 8).map((a) => {
                const priorityStyle = a.ticket?.priority
                  ? PRIORITY_STYLES[a.ticket.priority] || PRIORITY_STYLES.P4
                  : null;
                const statusStyle = a.status === "PENDING"
                  ? { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" }
                  : a.status === "APPROVED"
                  ? { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" }
                  : { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" };

                return (
                  <li key={a.id} className="py-3 first:pt-0 last:pb-0">
                    <Link
                      href={`/ps/inbox`}
                      className="flex items-start gap-3 group"
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                        <FileCheck size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium text-neutral-900 group-hover:text-teal-700 transition-colors">
                            {a.ticket?.subject ?? "Untitled complaint"}
                          </p>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-neutral-500">
                          <span className="font-mono text-teal-700">
                            {a.ticket?.ticketCode}
                          </span>
                          {priorityStyle && (
                            <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${priorityStyle.bg} ${priorityStyle.text}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${priorityStyle.dot}`} />
                              {a.ticket!.priority}
                            </span>
                          )}
                          {a.ticket?.department?.name && (
                            <span className="inline-flex items-center gap-0.5">
                              <Building2 size={10} />
                              {a.ticket.department.name}
                            </span>
                          )}
                          {a.ticket?.assignedOfficer?.fullName && (
                            <span>· {a.ticket.assignedOfficer.fullName}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyle.bg} ${statusStyle.text}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                          {a.status}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {formatRelativeTime(a.createdAt)}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 size={24} className="text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-neutral-600">No pending approvals</p>
            <p className="text-xs text-neutral-400">You&apos;re all caught up.</p>
          </div>
        )}
      </div>
    </div>
  );
}
