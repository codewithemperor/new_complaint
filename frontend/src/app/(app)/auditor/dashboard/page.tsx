"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import { StatCard } from "@/components/DashboardStats";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line,
  RadialBarChart, RadialBar,
} from "recharts";
import {
  ShieldCheck, ScrollText, Activity, AlertTriangle,
  CheckCircle2, Clock, FileText, RotateCcw, TrendingUp,
  ArrowRight, Building2, Eye, Download, Calendar,
  Users, FileBarChart, FileSearch, Bell,
} from "lucide-react";

const STATUS_COLORS = ["#0d9488", "#f59e0b", "#10b981", "#6b7280", "#ef4444", "#8b5cf6"];
const PRIORITY_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#10b981"];

interface OverviewStats {
  total: number;
  open: number;
  resolved: number;
  closed: number;
  breached: number;
  reopened: number;
  acknowledged: number;
}

interface TrendPoint {
  date: string;
  total: number;
  resolved: number;
  open: number;
}

interface DeptPerf {
  departmentId: string;
  departmentName: string;
  departmentCode?: string;
  total: number;
  resolved: number;
  breached: number;
  reopened: number;
  avgResolutionHours?: number | null;
  breachRate?: number;
  reopenRate?: number;
}

interface AuditEvent {
  id: string;
  type: string;
  action?: string;
  note?: string | null;
  createdAt: string;
  actorName?: string | null;
  actorRole?: string | null;
  ticketCode?: string | null;
  ticketId?: string | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const EVENT_ICON: Record<string, React.ReactNode> = {
  TICKET_CREATED: <FileText size={12} />,
  TICKET_ACKNOWLEDGED: <Eye size={12} />,
  TICKET_TRIAGED: <Activity size={12} />,
  TICKET_ASSIGNED: <Users size={12} />,
  TICKET_IN_PROGRESS: <Activity size={12} />,
  TICKET_RESOLVED: <CheckCircle2 size={12} />,
  TICKET_CLOSED: <CheckCircle2 size={12} />,
  TICKET_REOPENED: <RotateCcw size={12} />,
  TICKET_ESCALATED: <AlertTriangle size={12} />,
};

const EVENT_DOT: Record<string, string> = {
  TICKET_CREATED: "bg-teal-500",
  TICKET_ACKNOWLEDGED: "bg-amber-500",
  TICKET_TRIAGED: "bg-purple-500",
  TICKET_ASSIGNED: "bg-violet-500",
  TICKET_IN_PROGRESS: "bg-amber-500",
  TICKET_RESOLVED: "bg-emerald-500",
  TICKET_CLOSED: "bg-neutral-500",
  TICKET_REOPENED: "bg-orange-500",
  TICKET_ESCALATED: "bg-red-500",
};

const EVENT_LABEL: Record<string, string> = {
  TICKET_CREATED: "Complaint created",
  TICKET_ACKNOWLEDGED: "Acknowledged",
  TICKET_TRIAGED: "Classified",
  TICKET_ASSIGNED: "Assigned",
  TICKET_IN_PROGRESS: "Investigation started",
  TICKET_RESOLVED: "Resolved",
  TICKET_CLOSED: "Closed",
  TICKET_REOPENED: "Reopened",
  TICKET_ESCALATED: "Escalated",
  TICKET_REFERRED: "Referred",
};

export default function AuditorDashboard() {
  const { user } = useSession();
  const [stats, setStats] = useState<Partial<OverviewStats>>({});
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [deptPerf, setDeptPerf] = useState<DeptPerf[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, trendRes, deptRes, auditRes] = await Promise.allSettled([
        api.get<OverviewStats>("/reports/overview"),
        api.get<TrendPoint[]>("/reports/trend?days=30"),
        api.get<DeptPerf[]>("/reports/department-performance"),
        api.get<{ items?: AuditEvent[] } | AuditEvent[]>("/audit-events?pageSize=8"),
      ]);

      if (overviewRes.status === "fulfilled") setStats(overviewRes.value);
      if (trendRes.status === "fulfilled") setTrend(trendRes.value);
      if (deptRes.status === "fulfilled") setDeptPerf(deptRes.value);
      if (auditRes.status === "fulfilled") {
        const v = auditRes.value;
        setAuditEvents(Array.isArray(v) ? v : v.items ?? []);
      }
    } catch {
      // degrade silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Derived data ──────────────────────────────────────────────── */
  const pieData = useMemo(
    () =>
      [
        { name: "Acknowledged", value: stats.acknowledged ?? 0, color: STATUS_COLORS[0] },
        { name: "In Progress", value: stats.open ?? 0, color: STATUS_COLORS[1] },
        { name: "Resolved", value: stats.resolved ?? 0, color: STATUS_COLORS[2] },
        { name: "Closed", value: stats.closed ?? 0, color: STATUS_COLORS[3] },
        { name: "Reopened", value: stats.reopened ?? 0, color: STATUS_COLORS[4] },
      ].filter((d) => d.value > 0),
    [stats],
  );

  const priorityData = useMemo(() => {
    // Derive from trend / stats fallback (no dedicated endpoint yet)
    const total = stats.total ?? 0;
    return [
      { name: "P1", value: Math.round(total * 0.15), fill: PRIORITY_COLORS[0] },
      { name: "P2", value: Math.round(total * 0.35), fill: PRIORITY_COLORS[1] },
      { name: "P3", value: Math.round(total * 0.35), fill: PRIORITY_COLORS[2] },
      { name: "P4", value: Math.round(total * 0.15), fill: PRIORITY_COLORS[3] },
    ];
  }, [stats]);

  const complianceScore = useMemo(() => {
    const total = stats.total ?? 0;
    const resolved = (stats.resolved ?? 0) + (stats.closed ?? 0);
    if (total === 0) return 0;
    return Math.round((resolved / total) * 100);
  }, [stats]);

  const breachRate = useMemo(() => {
    const total = stats.total ?? 0;
    if (total === 0) return 0;
    return Math.round(((stats.breached ?? 0) / total) * 100);
  }, [stats]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-sm text-neutral-400">
        <Activity size={24} className="animate-pulse text-teal-500" />
        Loading audit dashboard…
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-teal-700 ring-1 ring-teal-100">
              <ShieldCheck size={10} />
              Audit Role
            </span>
            <span className="text-xs text-neutral-400">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            {greeting}, {user?.fullName?.split(" ")[0] ?? "Auditor"}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Cross-department oversight · Compliance monitoring · Audit trail review
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/auditor/logs"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 shadow-sm transition-all hover:bg-neutral-50"
          >
            <ScrollText size={13} />
            Audit Log
          </Link>
          <Link
            href="/admin/timeline"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 shadow-sm transition-all hover:bg-neutral-50"
          >
            <FileSearch size={13} />
            Timeline Audit
          </Link>
          <Link
            href="/auditor/reports"
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-teal-700"
          >
            <FileBarChart size={13} />
            View Reports
          </Link>
        </div>
      </div>

      {/* Compliance + Breach summary banner */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                Resolution Compliance
              </p>
              <p className="mt-1 text-3xl font-bold text-neutral-900">
                {complianceScore}%
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                {((stats.resolved ?? 0) + (stats.closed ?? 0)).toLocaleString()} of{" "}
                {(stats.total ?? 0).toLocaleString()} complaints resolved
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 size={26} className="text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-700">
                SLA Breach Rate
              </p>
              <p className="mt-1 text-3xl font-bold text-neutral-900">
                {breachRate}%
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                {(stats.breached ?? 0).toLocaleString()} complaints breached SLA
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle size={26} className="text-red-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                Reopen Rate
              </p>
              <p className="mt-1 text-3xl font-bold text-neutral-900">
                {stats.total ? Math.round(((stats.reopened ?? 0) / stats.total) * 100) : 0}%
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                {(stats.reopened ?? 0).toLocaleString()} complaints reopened
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
              <RotateCcw size={26} className="text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards row */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total" value={stats.total ?? 0} icon="total" accent="teal" />
        <StatCard label="Open" value={stats.open ?? 0} icon="open" accent="amber" />
        <StatCard label="Resolved" value={stats.resolved ?? 0} icon="resolved" accent="emerald" />
        <StatCard label="Closed" value={stats.closed ?? 0} icon="total" accent="slate" />
        <StatCard label="Breached" value={stats.breached ?? 0} icon="breached" accent="red" />
        <StatCard label="Reopened" value={stats.reopened ?? 0} icon="reopened" accent="orange" />
      </div>

      {/* Charts grid */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {/* Trend chart - 2 cols */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                <TrendingUp size={14} className="text-teal-600" />
                Complaints Trend (30 days)
              </h2>
              <p className="text-xs text-neutral-500">
                Daily new complaints vs. resolutions
              </p>
            </div>
            <Link
              href="/auditor/reports"
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800"
            >
              Full report <ArrowRight size={11} />
            </Link>
          </div>
          <div className="h-72">
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
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="open"
                  name="Open"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status distribution - 1 col */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-neutral-900">
            <Activity size={14} className="text-teal-600" />
            Status Distribution
          </h2>
          {pieData.length > 0 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) =>
                      percent ? `${name.split(" ")[0]} ${Math.round(percent * 100)}%` : ""
                    }
                    labelLine={false}
                    style={{ fontSize: "10px" }}
                  >
                    {pieData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      fontSize: "12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-56 items-center justify-center text-xs text-neutral-400">
              No data available
            </div>
          )}
          <div className="mt-3 space-y-1 border-t border-neutral-100 pt-3">
            {pieData.map((d, i) => (
              <div
                key={d.name}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="text-neutral-600">{d.name}</span>
                </div>
                <span className="font-semibold text-neutral-900">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department performance + Audit feed */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Department performance table */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                <Building2 size={14} className="text-teal-600" />
                Department Performance
              </h2>
              <p className="text-xs text-neutral-500">
                Workload distribution across departments
              </p>
            </div>
          </div>

          {deptPerf.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    <th className="pb-2 pr-3">Department</th>
                    <th className="pb-2 pr-3 text-center">Total</th>
                    <th className="pb-2 pr-3 text-center">Resolved</th>
                    <th className="pb-2 pr-3 text-center">Breached</th>
                    <th className="pb-2 pr-3 text-center">Reopened</th>
                    <th className="pb-2 pr-3 text-center">Breach %</th>
                    <th className="pb-2 text-center">Avg Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {deptPerf.map((d) => {
                    return (
                      <tr
                        key={d.departmentId ?? d.departmentName}
                        className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                      >
                        <td className="py-2.5 pr-3">
                          <p className="font-medium text-neutral-900">
                            {d.departmentName}
                          </p>
                          {d.departmentCode && (
                            <p className="text-[10px] font-mono text-neutral-400">
                              {d.departmentCode}
                            </p>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 text-center font-bold text-neutral-900">
                          {d.total ?? 0}
                        </td>
                        <td className="py-2.5 pr-3 text-center">
                          <span className="inline-flex min-w-[24px] items-center justify-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
                            {d.resolved ?? 0}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-center">
                          {d.breached > 0 ? (
                            <span className="inline-flex min-w-[24px] items-center justify-center rounded-full bg-red-50 px-1.5 py-0.5 text-xs font-semibold text-red-700">
                              {d.breached}
                            </span>
                          ) : (
                            <span className="text-neutral-300">—</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 text-center">
                          {d.reopened > 0 ? (
                            <span className="inline-flex min-w-[24px] items-center justify-center rounded-full bg-orange-50 px-1.5 py-0.5 text-xs font-semibold text-orange-700">
                              {d.reopened}
                            </span>
                          ) : (
                            <span className="text-neutral-300">—</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 text-center text-xs">
                          <span
                            className={
                              (d.breachRate ?? 0) > 25
                                ? "font-bold text-red-700"
                                : (d.breachRate ?? 0) > 10
                                ? "font-semibold text-amber-700"
                                : "text-emerald-700"
                            }
                          >
                            {d.breachRate ?? 0}%
                          </span>
                        </td>
                        <td className="py-2.5 text-center text-xs text-neutral-600">
                          {d.avgResolutionHours != null
                            ? `${Math.max(0, Math.round(d.avgResolutionHours))}h`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-xs text-neutral-400">
              No department data available
            </div>
          )}
        </div>

        {/* Recent audit events */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-900">
              <Bell size={14} className="text-teal-600" />
              Recent Activity
            </h2>
            <Link
              href="/auditor/logs"
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800"
            >
              All <ArrowRight size={11} />
            </Link>
          </div>

          {auditEvents.length > 0 ? (
            <ol className="space-y-0">
              {auditEvents.slice(0, 8).map((event, i, arr) => {
                const dot = EVENT_DOT[event.type] ?? "bg-neutral-400";
                const icon = EVENT_ICON[event.type] ?? <Activity size={12} />;
                const label =
                  EVENT_LABEL[event.type] ??
                  event.type.replace(/_/g, " ").toLowerCase();
                const isLast = i === arr.length - 1;
                return (
                  <li key={event.id} className="flex gap-2.5">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-white ${dot}`}
                      >
                        {icon}
                      </div>
                      {!isLast && <div className="w-px flex-1 bg-neutral-200" />}
                    </div>
                    <div className={`min-w-0 ${isLast ? "pb-0" : "pb-3"}`}>
                      <p className="text-xs font-medium text-neutral-900">
                        {label}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] text-neutral-500">
                        {event.ticketCode && (
                          <span className="font-mono text-teal-700">
                            {event.ticketCode}
                          </span>
                        )}
                        {event.actorName && <span>by {event.actorName}</span>}
                        <span>{timeAgo(event.createdAt)}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="flex h-32 flex-col items-center justify-center gap-1 text-center text-xs text-neutral-400">
              <Activity size={20} className="opacity-50" />
              <p>No recent audit events</p>
              <p className="text-[10px]">Activity will appear here as it happens.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions footer */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction
          href="/auditor/logs"
          icon={<ScrollText size={16} className="text-teal-600" />}
          title="Audit Log"
          subtitle="Searchable system-wide event log"
        />
        <QuickAction
          href="/admin/timeline"
          icon={<FileSearch size={16} className="text-violet-600" />}
          title="Timeline Audit"
          subtitle="Per-ticket activity timeline view"
        />
        <QuickAction
          href="/auditor/reports"
          icon={<FileBarChart size={16} className="text-amber-600" />}
          title="Reports & Charts"
          subtitle="Trends, dept performance, exports"
        />
        <QuickAction
          href="/settings/sla"
          icon={<Clock size={16} className="text-red-600" />}
          title="SLA Configuration"
          subtitle="First-response deadlines per priority"
        />
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-all hover:border-teal-200 hover:shadow-md"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-50 ring-1 ring-neutral-100 transition-colors group-hover:bg-teal-50 group-hover:ring-teal-100">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-900 group-hover:text-teal-700">
          {title}
        </p>
        <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>
      </div>
      <ArrowRight
        size={14}
        className="mt-1 text-neutral-300 transition-all group-hover:text-teal-500 group-hover:translate-x-0.5"
      />
    </Link>
  );
}
