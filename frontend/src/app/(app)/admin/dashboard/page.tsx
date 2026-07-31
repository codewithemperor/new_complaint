"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import { ROLE_LABELS } from "@/lib/nav";
import { StatCard } from "@/components/DashboardStats";
import type { Ticket } from "@/lib/types";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import {
  Inbox, LayoutGrid, Clock, BarChart3,
  ArrowRight, FileText, AlertTriangle, CheckCircle2,
  RotateCcw, Activity, TrendingUp,
  Shield, Download, RefreshCw, Eye, EyeOff,
  CircleDot, Bell, Sparkles, X,
  Flame, Minus, ChevronRight,
  Zap, ThumbsUp, Printer, FileDown, FileSpreadsheet,
  ChevronDown, ArrowUpRight, ArrowDownRight,
  Mail, Phone, Globe, MessageSquare, UserRound,
  Clock4, Target, AlertCircle, ChevronUp, ChevronLeft,
  ExternalLink,
} from "lucide-react";

const COLORS = ["#0d9488", "#f59e0b", "#10b981", "#6b7280", "#ef4444"];

/* ------------------------------------------------------------------ */
/*  Data types                                                         */
/* ------------------------------------------------------------------ */

interface OverviewStats {
  total: number;
  open: number;
  resolved: number;
  closed: number;
  breached: number;
  reopened: number;
  acknowledged: number;
  assigned: number;
  pendingApproval: number;
}

interface TrendPoint {
  date: string;
  total: number;
  resolved: number;
  open: number;
}

interface DeptRow {
  departmentName: string;
  acknowledged: number;
  inProgress: number;
  resolved: number;
  closed: number;
  reopened: number;
}

/* ------------------------------------------------------------------ */
/*  Quick Action Card                                                  */
/* ------------------------------------------------------------------ */
function QuickActionCard({
  icon,
  title,
  subtitle,
  href,
  accent,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href: string;
  accent: string;
  badge?: number;
}) {
  return (
    <a
      href={href}
      className="group relative flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-teal-200"
    >
      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-2 -top-3 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-sm transition-transform group-hover:scale-125">
          {badge}
        </span>
      )}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-800 group-hover:text-teal-700 transition-colors">
          {title}
        </p>
        <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 text-neutral-300 transition-all group-hover:text-teal-500 group-hover:translate-x-0.5" />
    </a>
  );
}

/* ------------------------------------------------------------------ */
/*  Activity Timeline Item (Enhanced)                                  */
/* ------------------------------------------------------------------ */
function ActivityItem({
  ticketCode,
  subject,
  status,
  updatedAt,
  isLast,
  ticketId,
}: {
  ticketCode: string;
  subject: string;
  status: string;
  updatedAt: string;
  isLast: boolean;
  ticketId?: string;
}) {
  const statusColors: Record<string, string> = {
    ACKNOWLEDGED: "bg-amber-100 text-amber-700",
    OPEN: "bg-teal-100 text-teal-700",
    IN_PROGRESS: "bg-teal-100 text-teal-700",
    RESOLVED: "bg-emerald-100 text-emerald-700",
    CLOSED: "bg-slate-100 text-slate-700",
    REOPENED: "bg-orange-100 text-orange-700",
    BREACHED: "bg-red-100 text-red-700",
    ASSIGNED: "bg-violet-100 text-violet-700",
    PENDING_APPROVAL: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-teal-100 text-teal-700",
    ESCALATED: "bg-red-100 text-red-700",
  };

  const dotColor: Record<string, string> = {
    ACKNOWLEDGED: "bg-amber-400",
    OPEN: "bg-teal-400",
    IN_PROGRESS: "bg-teal-400",
    RESOLVED: "bg-emerald-400",
    CLOSED: "bg-slate-400",
    REOPENED: "bg-orange-400",
    BREACHED: "bg-red-400",
    ASSIGNED: "bg-violet-400",
    PENDING_APPROVAL: "bg-yellow-400",
    APPROVED: "bg-teal-400",
    ESCALATED: "bg-red-400",
  };

  const statusIcons: Record<string, React.ReactNode> = {
    ACKNOWLEDGED: <Inbox className="h-3 w-3" />,
    OPEN: <FileText className="h-3 w-3" />,
    IN_PROGRESS: <Activity className="h-3 w-3" />,
    RESOLVED: <CheckCircle2 className="h-3 w-3" />,
    CLOSED: <CheckCircle2 className="h-3 w-3" />,
    REOPENED: <RotateCcw className="h-3 w-3" />,
    BREACHED: <AlertTriangle className="h-3 w-3" />,
    ESCALATED: <AlertCircle className="h-3 w-3" />,
    ASSIGNED: <UserRound className="h-3 w-3" />,
  };

  const badge = statusColors[status] ?? "bg-neutral-100 text-neutral-700";
  const dot = dotColor[status] ?? "bg-neutral-400";
  const icon = statusIcons[status] ?? <FileText className="h-3 w-3" />;

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="flex gap-3 group">
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center">
        <div className={`flex h-6 w-6 items-center justify-center rounded-full ${dot} ring-2 ring-white transition-transform group-hover:scale-110`}>
          <div className="text-white">{icon}</div>
        </div>
        {!isLast && <div className="w-px flex-1 bg-neutral-200" />}
      </div>
      {/* Content */}
      <div className={`min-w-0 flex-1 pb-4 ${isLast ? "pb-0" : ""}`}>
        <p className="truncate text-sm font-medium text-neutral-800 group-hover:text-teal-700 transition-colors">
          {subject}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-neutral-400">{ticketCode}</span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge}`}>
            {status.replace(/_/g, " ")}
          </span>
          <span className="text-xs text-neutral-400">{timeAgo(updatedAt)}</span>
        </div>
      </div>
      {/* View link */}
      <a
        href={ticketId ? `/admin/ticket/${ticketId}` : `/admin/complaints`}
        className="shrink-0 self-center rounded-md px-2 py-1 text-xs font-medium text-teal-600 opacity-0 transition-all hover:bg-teal-50 hover:text-teal-700 group-hover:opacity-100"
      >
        View
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Department Performance Mini Table                                  */
/* ------------------------------------------------------------------ */
function DeptPerformanceTable({ data }: { data: DeptRow[] }) {
  const sorted = [...data]
    .sort((a, b) => {
      const aTotal = a.acknowledged + a.inProgress + a.resolved + a.closed + a.reopened;
      const bTotal = b.acknowledged + b.inProgress + b.resolved + b.closed + b.reopened;
      return bTotal - aTotal;
    })
    .slice(0, 5);

  if (sorted.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-neutral-400">
        No department data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100">
            <th className="py-2 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Department</th>
            <th className="py-2 px-2 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Active</th>
            <th className="py-2 px-2 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Resolved</th>
            <th className="py-2 pl-2 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Rate</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((dept) => {
            const total = dept.acknowledged + dept.inProgress + dept.resolved + dept.closed + dept.reopened;
            const active = dept.acknowledged + dept.inProgress;
            const resolved = dept.resolved + dept.closed;
            const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
            const rateColor = rate >= 70 ? "text-emerald-600" : rate >= 40 ? "text-amber-600" : "text-red-600";
            const barColor = rate >= 70 ? "bg-emerald-500" : rate >= 40 ? "bg-amber-500" : "bg-red-500";
            return (
              <tr
                key={dept.departmentName}
                className="border-b border-neutral-50 last:border-0 transition-all duration-150 hover:bg-teal-50/40 hover:shadow-[inset_2px_0_0_0_#0d9488] group/row cursor-pointer"
              >
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-neutral-300 group-hover/row:text-teal-500 transition-colors" />
                    <p className="truncate font-medium text-neutral-700 max-w-[140px] group-hover/row:text-teal-700 transition-colors" title={dept.departmentName}>
                      {dept.departmentName}
                    </p>
                  </div>
                </td>
                <td className="py-2.5 px-2 text-right">
                  <span className="inline-flex items-center justify-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 group-hover/row:bg-amber-200 transition-colors">
                    {active}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-right">
                  <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 group-hover/row:bg-emerald-200 transition-colors">
                    {resolved}
                  </span>
                </td>
                <td className="py-2.5 pl-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-12 overflow-hidden rounded-full bg-neutral-100">
                      <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${rate}%` }} />
                    </div>
                    <span className={`text-xs font-semibold ${rateColor}`}>{rate}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Priority Breakdown Mini Section                                    */
/* ------------------------------------------------------------------ */
function PriorityBreakdown({ stats }: { stats: Partial<OverviewStats> }) {
  const total = stats.total ?? 0;
  const high = stats.breached ?? 0;
  const medium = stats.open ?? 0;
  const low = stats.acknowledged ?? 0;
  const totalPriority = high + medium + low;

  const items = [
    { label: "High", count: high, color: "bg-red-500", bgLight: "bg-red-50", textColor: "text-red-700", icon: <Flame className="h-3 w-3" /> },
    { label: "Medium", count: medium, color: "bg-amber-500", bgLight: "bg-amber-50", textColor: "text-amber-700", icon: <Minus className="h-3 w-3" /> },
    { label: "Low", count: low, color: "bg-emerald-500", bgLight: "bg-emerald-50", textColor: "text-emerald-700", icon: <ChevronRight className="h-3 w-3" /> },
  ];

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Priority Breakdown</h3>
      <div className="space-y-2.5">
        {items.map((item) => {
          const pct = totalPriority > 0 ? Math.round((item.count / totalPriority) * 100) : 0;
          return (
            <div key={item.label} className="flex items-center gap-3">
              <div className={`flex h-6 w-6 items-center justify-center rounded-md ${item.bgLight} ${item.textColor}`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-neutral-700">{item.label}</span>
                  <span className="text-xs font-semibold text-neutral-900">{item.count}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <span className="text-[10px] font-medium text-neutral-400 tabular-nums w-8 text-right">{pct}%</span>
            </div>
          );
        })}
      </div>
      {total > 0 && (
        <p className="mt-3 text-[10px] text-neutral-400 border-t border-neutral-100 pt-2">
          Based on {total} total complaints
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick Stats Bar (Horizontal KPI strip)                             */
/* ------------------------------------------------------------------ */
interface QuickStatItem {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend: "up" | "down" | "flat";
  trendValue: string;
  color: string;
  bgColor: string;
  iconBg: string;
}

const QUICK_STATS: QuickStatItem[] = [
  {
    label: "Avg. Response Time",
    value: "2.4h",
    icon: <Clock4 className="h-4 w-4" />,
    trend: "down",
    trendValue: "18%",
    color: "text-teal-600",
    bgColor: "border-teal-200 bg-teal-50/50",
    iconBg: "bg-teal-100 text-teal-600",
  },
  {
    label: "Citizen Satisfaction",
    value: "87%",
    icon: <ThumbsUp className="h-4 w-4" />,
    trend: "up",
    trendValue: "5%",
    color: "text-emerald-600",
    bgColor: "border-emerald-200 bg-emerald-50/50",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  {
    label: "SLA Compliance",
    value: "92%",
    icon: <Target className="h-4 w-4" />,
    trend: "up",
    trendValue: "3%",
    color: "text-amber-600",
    bgColor: "border-amber-200 bg-amber-50/50",
    iconBg: "bg-amber-100 text-amber-600",
  },
  {
    label: "Active Escalations",
    value: "7",
    icon: <AlertCircle className="h-4 w-4" />,
    trend: "down",
    trendValue: "2",
    color: "text-red-600",
    bgColor: "border-red-200 bg-red-50/50",
    iconBg: "bg-red-100 text-red-600",
  },
];

function QuickStatsBar() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {QUICK_STATS.map((stat) => {
        const isPositive =
          stat.label === "Avg. Response Time" || stat.label === "Active Escalations"
            ? stat.trend === "down"
            : stat.trend === "up";

        return (
          <div
            key={stat.label}
            className={`flex items-center gap-3 rounded-xl border p-3 sm:p-4 shadow-sm transition-all duration-200 hover:shadow-md ${stat.bgColor}`}
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.iconBg}`}>
              {stat.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-neutral-500">{stat.label}</p>
              <div className="flex items-center gap-1.5">
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : stat.trend === "down" ? (
                    <ArrowDownRight className="h-3 w-3" />
                  ) : null}
                  {stat.trendValue}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Complaints by Channel Chart                                        */
/* ------------------------------------------------------------------ */
const CHANNEL_DATA = [
  { name: "Web", count: 45, icon: "globe" },
  { name: "Email", count: 28, icon: "mail" },
  { name: "Phone", count: 32, icon: "phone" },
  { name: "Walk-in", count: 18, icon: "user" },
  { name: "SMS", count: 12, icon: "message" },
];

function ChannelChart() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-800">Complaints by Channel</h2>
            <p className="mt-0.5 text-xs text-neutral-500">Distribution of intake channels</p>
          </div>
          <BarChart3 className="h-4 w-4 text-neutral-500" />
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={CHANNEL_DATA} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={60} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
              />
              <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]} barSize={20} name="Complaints" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Channel legend */}
        <div className="mt-3 flex flex-wrap gap-3 border-t border-neutral-100 pt-3">
          {CHANNEL_DATA.map((ch) => (
            <div key={ch.name} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-teal-500" />
              <span className="text-[10px] text-neutral-500">{ch.name}: {ch.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Priority Distribution Donut Chart                                  */
/* ------------------------------------------------------------------ */
const PRIORITY_DATA = [
  { name: "P1 Critical", value: 8, color: "#dc2626" },
  { name: "P2 High", value: 22, color: "#ea580c" },
  { name: "P3 Medium", value: 35, color: "#d97706" },
  { name: "P4 Low", value: 45, color: "#9ca3af" },
];

function PriorityDonutChart() {
  const total = PRIORITY_DATA.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-800">Priority Distribution</h2>
            <p className="mt-0.5 text-xs text-neutral-500">Complaints by priority level</p>
          </div>
          <AlertCircle className="h-4 w-4 text-neutral-500" />
        </div>
        <div className="relative h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={PRIORITY_DATA}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {PRIORITY_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-900">{total}</p>
              <p className="text-[10px] font-medium text-neutral-500">Total</p>
            </div>
          </div>
        </div>
        {/* Priority legend */}
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-neutral-100 pt-3">
          {PRIORITY_DATA.map((p) => (
            <div key={p.name} className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-[10px] font-medium text-neutral-600">{p.name}</span>
              <span className="text-[10px] font-semibold text-neutral-900 ml-auto">{p.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Performance Overview KPI Mini Cards                                */
/* ------------------------------------------------------------------ */
interface KPICardData {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend: "up" | "down";
  trendValue: string;
  accent: string;
  accentIcon: string;
}

const HARDCODED_KPI: KPICardData[] = [
  {
    label: "Avg. Resolution Time",
    value: "4.2 days",
    icon: <Clock className="h-4 w-4" />,
    trend: "down",
    trendValue: "12%",
    accent: "bg-teal-50 text-teal-600",
    accentIcon: "bg-teal-100",
  },
  {
    label: "First Response Rate",
    value: "94%",
    icon: <Zap className="h-4 w-4" />,
    trend: "up",
    trendValue: "3.5%",
    accent: "bg-emerald-50 text-emerald-600",
    accentIcon: "bg-emerald-100",
  },
  {
    label: "Citizen Satisfaction",
    value: "87%",
    icon: <ThumbsUp className="h-4 w-4" />,
    trend: "up",
    trendValue: "5%",
    accent: "bg-amber-50 text-amber-600",
    accentIcon: "bg-amber-100",
  },
  {
    label: "Escalation Rate",
    value: "3.2%",
    icon: <TrendingUp className="h-4 w-4" />,
    trend: "down",
    trendValue: "1.8%",
    accent: "bg-red-50 text-red-600",
    accentIcon: "bg-red-100",
  },
];

function PerformanceKPICard({ data }: { data: KPICardData }) {
  const isPositiveTrend =
    (data.label === "Escalation Rate" || data.label === "Avg. Resolution Time")
      ? data.trend === "down"
      : data.trend === "up";

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${data.accentIcon}`}>
          <div className={data.accent.split(" ")[1]}>{data.icon}</div>
        </div>
        <div className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isPositiveTrend ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
          {data.trend === "up" ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {data.trendValue}
        </div>
      </div>
      <div className="mt-3">
        <p className="text-xl font-bold text-neutral-900">{data.value}</p>
        <p className="mt-0.5 text-xs text-neutral-500">{data.label}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Recent Complaints List                                             */
/* ------------------------------------------------------------------ */
interface RecentComplaintData {
  ticketCode: string;
  subject: string;
  department: string;
  status: string;
  timeAgo: string;
}

const HARDCODED_RECENT_COMPLAINTS: RecentComplaintData[] = [
  { ticketCode: "KWR-2025-0142", subject: "Water supply disruption in Ajase-Ipo", department: "Water Corporation", status: "OPEN", timeAgo: "12m ago" },
  { ticketCode: "KWR-2025-0141", subject: "Road pothole causing accidents on Jebba road", department: "Works & Transport", status: "IN_PROGRESS", timeAgo: "1h ago" },
  { ticketCode: "KWR-2025-0140", subject: "Uncompleted classroom block at Community School", department: "Education", status: "ACKNOWLEDGED", timeAgo: "3h ago" },
  { ticketCode: "KWR-2025-0139", subject: "Delayed payment of pension benefits", department: "Finance", status: "ESCALATED", timeAgo: "5h ago" },
  { ticketCode: "KWR-2025-0138", subject: "Faulty traffic light at Post Office junction", department: "Works & Transport", status: "RESOLVED", timeAgo: "1d ago" },
];

function RecentComplaintsList() {
  const statusColors: Record<string, string> = {
    OPEN: "bg-teal-100 text-teal-700",
    IN_PROGRESS: "bg-teal-100 text-teal-700",
    ACKNOWLEDGED: "bg-amber-100 text-amber-700",
    RESOLVED: "bg-emerald-100 text-emerald-700",
    CLOSED: "bg-slate-100 text-slate-700",
    ESCALATED: "bg-red-100 text-red-700",
    REOPENED: "bg-orange-100 text-orange-700",
    BREACHED: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-0">
      {HARDCODED_RECENT_COMPLAINTS.map((complaint) => {
        const badge = statusColors[complaint.status] ?? "bg-neutral-100 text-neutral-700";
        return (
          <a
            key={complaint.ticketCode}
            href={`/admin/complaints/${complaint.ticketCode}`}
            className="flex items-center gap-3 border-b border-neutral-50 py-3 last:border-0 transition-all duration-150 hover:bg-teal-50/40 group"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 group-hover:bg-teal-100 transition-colors">
              <FileText className="h-4 w-4 text-neutral-400 group-hover:text-teal-600 transition-colors" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-neutral-400">{complaint.ticketCode}</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge}`}>
                  {complaint.status.replace(/_/g, " ")}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm font-medium text-neutral-800 group-hover:text-teal-700 transition-colors">
                {complaint.subject}
              </p>
              <p className="mt-0.5 text-xs text-neutral-400">{complaint.department}</p>
            </div>
            <span className="shrink-0 text-xs text-neutral-400">{complaint.timeAgo}</span>
          </a>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Enhanced Department Performance Cards with Sparklines              */
/* ------------------------------------------------------------------ */
interface EnhancedDeptRow {
  department: string;
  total: number;
  open: number;
  resolved: number;
  avgTime: string;
  satisfaction: number;
  trend: number[];
}

const HARDCODED_ENHANCED_DEPT: EnhancedDeptRow[] = [
  { department: "Water Corporation", total: 48, open: 12, resolved: 31, avgTime: "3.1 days", satisfaction: 92, trend: [30, 35, 40, 38, 42, 45, 48] },
  { department: "Works & Transport", total: 65, open: 22, resolved: 36, avgTime: "5.8 days", satisfaction: 74, trend: [50, 55, 58, 60, 62, 63, 65] },
  { department: "Education", total: 34, open: 8, resolved: 23, avgTime: "4.2 days", satisfaction: 85, trend: [20, 22, 25, 28, 30, 32, 34] },
  { department: "Health", total: 41, open: 15, resolved: 22, avgTime: "6.1 days", satisfaction: 68, trend: [35, 38, 40, 39, 42, 40, 41] },
  { department: "Finance", total: 27, open: 5, resolved: 20, avgTime: "2.9 days", satisfaction: 89, trend: [15, 18, 20, 22, 24, 25, 27] },
];

function DeptMiniSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const width = 60;
  const height = 20;
  const padding = 1;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: padding + (height - padding * 2) - ((val - min) / range) * (height - padding * 2),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <svg width={width} height={height} className="opacity-60">
      <path d={linePath} fill="none" stroke="#0d9488" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EnhancedDeptPerformanceCards() {
  return (
    <div className="space-y-3">
      {HARDCODED_ENHANCED_DEPT.map((dept) => {
        const resolutionRate = dept.total > 0 ? Math.round((dept.resolved / dept.total) * 100) : 0;
        const satColor = dept.satisfaction >= 80 ? "text-emerald-600" : dept.satisfaction >= 60 ? "text-amber-600" : "text-red-600";
        const satBg = dept.satisfaction >= 80 ? "bg-emerald-100" : dept.satisfaction >= 60 ? "bg-amber-100" : "bg-red-100";
        const barColor = resolutionRate >= 70 ? "bg-emerald-500" : resolutionRate >= 40 ? "bg-amber-500" : "bg-red-500";
        const performanceIndicator = dept.satisfaction >= 80 ? "bg-emerald-400" : dept.satisfaction >= 60 ? "bg-amber-400" : "bg-red-400";

        return (
          <div
            key={dept.department}
            className="rounded-lg border border-neutral-100 bg-white p-4 transition-all duration-200 hover:shadow-md hover:border-teal-200 group cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`h-2 w-2 rounded-full shrink-0 ${performanceIndicator}`} />
                <p className="truncate text-sm font-semibold text-neutral-800 group-hover:text-teal-700 transition-colors" title={dept.department}>
                  {dept.department}
                </p>
              </div>
              <DeptMiniSparkline data={dept.trend} />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] font-medium uppercase text-neutral-400">Total</p>
                <p className="text-sm font-bold text-neutral-900">{dept.total}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase text-neutral-400">Open</p>
                <p className="text-sm font-bold text-amber-600">{dept.open}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase text-neutral-400">Avg Time</p>
                <p className="text-sm font-bold text-neutral-700">{dept.avgTime}</p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
              {/* Resolution rate progress bar */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-neutral-500">Resolution Rate</span>
                  <span className="text-[10px] font-semibold text-neutral-700">{resolutionRate}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${resolutionRate}%` }} />
                </div>
              </div>
              {/* Satisfaction badge */}
              <span className={`inline-flex items-center justify-center rounded-full ${satBg} px-2 py-0.5 text-[10px] font-semibold ${satColor}`}>
                {dept.satisfaction}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Enhanced Activity Feed with Show More                              */
/* ------------------------------------------------------------------ */
function EnhancedActivityFeed({ tickets }: { tickets: Ticket[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayTickets = showAll ? tickets : tickets.slice(0, 5);

  if (tickets.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-neutral-400">
        No recent activity
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-0">
        {displayTickets.map((t, i) => (
          <ActivityItem
            key={t.id}
            ticketCode={t.ticketCode}
            subject={t.subject}
            status={t.status}
            updatedAt={t.updatedAt ?? t.createdAt}
            isLast={i === displayTickets.length - 1 && (showAll || tickets.length <= 5)}
            ticketId={t.id}
          />
        ))}
      </div>
      {tickets.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-neutral-200 py-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-teal-700"
        >
          {showAll ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Show more ({tickets.length - 5} more)
            </>
          )}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated Background Pattern for Greeting Header                    */
/* ------------------------------------------------------------------ */
function AnimatedHeaderPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Floating circles */}
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full border border-teal-200/30 animate-[float_6s_ease-in-out_infinite]" />
      <div className="absolute right-16 top-2 h-12 w-12 rounded-full border border-teal-300/20 animate-[float_8s_ease-in-out_infinite]" />
      <div className="absolute -left-4 bottom-0 h-16 w-16 rounded-full border border-teal-100/40 animate-[float_7s_ease-in-out_infinite]" />

      {/* Small dots */}
      <div className="absolute left-[10%] top-[30%] h-1.5 w-1.5 rounded-full bg-teal-300/20 animate-[pulse_3s_ease-in-out_infinite]" />
      <div className="absolute left-[50%] top-[60%] h-2 w-2 rounded-full bg-teal-400/15 animate-[pulse_4s_ease-in-out_infinite]" />
      <div className="absolute left-[80%] top-[10%] h-1 w-1 rounded-full bg-teal-300/5 animate-[pulse_2.5s_ease-in-out_infinite]" />

      {/* Decorative lines */}
      <div className="absolute left-[5%] top-[15%] h-px w-20 bg-gradient-to-r from-teal-200/30 to-transparent" />
      <div className="absolute left-[70%] bottom-[10%] h-px w-32 bg-gradient-to-r from-transparent to-teal-200/30" />

      {/* Animated accent line — bottom decorative sweep */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-teal-400/40 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton Loading                                                   */
/* ------------------------------------------------------------------ */
function DashboardSkeleton() {
  return (
    <div className="space-y-6 pb-4 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="h-7 w-56 rounded-lg bg-neutral-200" />
          <div className="mt-2 h-4 w-36 rounded bg-neutral-100" />
        </div>
        <div className="h-4 w-40 rounded bg-neutral-100" />
      </div>
      {/* Quick stats bar skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-neutral-100" />
              <div className="flex-1">
                <div className="h-3 w-20 rounded bg-neutral-200" />
                <div className="mt-1.5 h-5 w-12 rounded bg-neutral-200" />
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 rounded bg-neutral-200" />
              <div className="h-9 w-9 rounded-lg bg-neutral-100" />
            </div>
            <div className="mt-3 h-8 w-12 rounded-lg bg-neutral-200" />
          </div>
        ))}
      </div>
      {/* Quick actions skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-neutral-100" />
              <div className="flex-1">
                <div className="h-4 w-24 rounded bg-neutral-200" />
                <div className="mt-1.5 h-3 w-20 rounded bg-neutral-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Charts skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 rounded-xl border border-neutral-200 bg-white" />
        <div className="h-80 rounded-xl border border-neutral-200 bg-white" />
      </div>
      {/* Bottom row skeleton */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="h-80 rounded-xl border border-neutral-200 bg-white lg:col-span-3" />
        <div className="h-80 rounded-xl border border-neutral-200 bg-white lg:col-span-2" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Greeting helper & motivational quotes                              */
/* ------------------------------------------------------------------ */
const MOTIVATIONAL_QUOTES = [
  "Every complaint resolved is a citizen empowered.",
  "Transparency builds trust; accountability builds progress.",
  "Serving the people starts with listening to them.",
  "Good governance is measured by how quickly problems are solved.",
  "Your dedication to resolving issues makes Kwara better every day.",
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getQuoteOfDay() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}

function formatDate() {
  return new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Dashboard Page                                                     */
/* ------------------------------------------------------------------ */
export default function AdminDashboard() {
  const { user } = useSession();
  const [stats, setStats] = useState<Partial<OverviewStats>>({});
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [deptBreakdown, setDeptBreakdown] = useState<DeptRow[]>([]);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [activeStatFilter, setActiveStatFilter] = useState<string | null>(null);
  const whatsNewRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const quoteOfDay = getQuoteOfDay();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, trendRes, deptRes, ticketsRes] = await Promise.all([
        api.get<OverviewStats>("/reports/overview"),
        api.get<TrendPoint[]>("/report/trend?days=30"),
        api.get<DeptRow[]>("/reports/status-by-department"),
        api.get<{ items: Ticket[] }>("/tickets?limit=10&sort=updatedAt").catch(() => ({ items: [] })),
      ]);
      setStats(overviewRes);
      setTrend(trendRes);
      setDeptBreakdown(deptRes);
      setRecentTickets(ticketsRes.items ?? []);
    } catch {
      // Dashboard silently degrades
    } finally {
      setLoading(false);
      setLastRefreshed(new Date());
    }
  }, []);

  // Close What's New on outside click
  useEffect(() => {
    if (!showWhatsNew) return;
    const handler = (e: MouseEvent) => {
      if (whatsNewRef.current && !whatsNewRef.current.contains(e.target as Node)) {
        setShowWhatsNew(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showWhatsNew]);

  // Close Export dropdown on outside click
  useEffect(() => {
    if (!showExportDropdown) return;
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExportDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showExportDropdown]);

  // Initial fetch
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      void fetchData();
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // Generate sparkline data from trend data
  const getSparkline = useCallback((key: keyof TrendPoint) => {
    const trendSlice = trend.slice(-7);
    return trendSlice.map((p) => (p[key] as number) ?? 0);
  }, [trend]);

  const getSparklineTotal = useCallback(() => getSparkline("total"), [getSparkline]);
  const getSparklineResolved = useCallback(() => getSparkline("resolved"), [getSparkline]);
  const getSparklineOpen = useCallback(() => getSparkline("open"), [getSparkline]);

  const pieData = [
    { name: "Acknowledged", value: stats.acknowledged ?? 0 },
    { name: "In Progress", value: stats.open ?? 0 },
    { name: "Resolved", value: stats.resolved ?? 0 },
    { name: "Closed", value: stats.closed ?? 0 },
    { name: "Reopened", value: stats.reopened ?? 0 },
  ].filter((d) => d.value > 0);

  // Stat card click-to-filter handler
  const handleStatFilter = useCallback((filterKey: string) => {
    setActiveStatFilter(prev => prev === filterKey ? null : filterKey);
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 pb-4">
      {/* -------------------------------------------------------- */}
      {/*  Greeting Header with animated background,               */}
      {/*  system health, last refreshed, download, what's new     */}
      {/* -------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-teal-50/30 to-neutral-50 p-5 sm:p-6">
        <AnimatedHeaderPattern />
        <div className="relative flex flex-col gap-3 sm:gap-4">
          {/* Top row: greeting + system health */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">
                {getGreeting()}, {user?.fullName?.split(" ")[0] ?? "Admin"}
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                {user ? ROLE_LABELS[user.role] : "Dashboard"} &middot; System-wide overview
              </p>
              {/* Motivational quote */}
              <p className="mt-1.5 text-xs italic text-teal-600/70">
                &ldquo;{quoteOfDay}&rdquo;
              </p>
            </div>
            {/* System Health indicator */}
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-emerald-700">All systems operational</span>
            </div>
          </div>

          {/* Bottom row: date, last login, refresh, export, what's new, focus mode */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <p className="text-sm text-neutral-400">{formatDate()}</p>
            <p className="text-xs text-neutral-300">Last login: 2 hours ago</p>

            {/* Last refreshed timestamp + Refresh button */}
            <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5">
              <RefreshCw className="h-3.5 w-3.5 text-neutral-400" />
              <span className="text-xs text-neutral-500">
                Last refreshed: {lastRefreshed ? lastRefreshed.toLocaleTimeString() : "Never"}
              </span>
              <button
                onClick={() => void fetchData()}
                className="ml-1 rounded-md px-2 py-0.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
                title="Refresh now"
              >
                Refresh
              </button>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${autoRefresh ? "bg-teal-50 text-teal-700" : "text-neutral-400 hover:text-neutral-600"}`}
                title={autoRefresh ? "Auto-refresh on (60s)" : "Enable auto-refresh"}
              >
                <span className="relative flex h-2 w-2">
                  {autoRefresh && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />}
                  {autoRefresh ? <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" /> : <span className="h-2 w-2 rounded-full bg-neutral-300" />}
                </span>
                {autoRefresh ? "Auto" : "Manual"}
              </button>
            </div>

            {/* Export Dashboard dropdown */}
            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:border-neutral-300"
              >
                <Download className="h-3.5 w-3.5 text-neutral-500" />
                <span>Export Dashboard</span>
                <ChevronDown className="h-3 w-3 text-neutral-400" />
              </button>
              {showExportDropdown && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-neutral-200 bg-white shadow-lg z-10" style={{ filter: "drop-shadow(0 4px 6px -4px rgba(0,0,0,0.07))" }}>
                  <div className="p-2">
                    <button
                      onClick={() => setShowExportDropdown(false)}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                    >
                      <FileDown className="h-4 w-4 text-red-500" />
                      Export as PDF
                    </button>
                    <button
                      onClick={() => setShowExportDropdown(false)}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                      Export as CSV
                    </button>
                    <button
                      onClick={() => { setShowExportDropdown(false); window.print(); }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                    >
                      <Printer className="h-4 w-4 text-neutral-500" />
                      Print Report
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* What's new tooltip */}
            <div className="relative" ref={whatsNewRef}>
              <button
                onClick={() => setShowWhatsNew(!showWhatsNew)}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
              >
                <Bell className="h-3.5 w-3.5 text-neutral-500" />
                <span>What&apos;s new</span>
                <Sparkles className="h-3 w-3 text-amber-400" />
              </button>
              {showWhatsNew && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-neutral-200 bg-white shadow-lg p-4 z-10" style={{ filter: "drop-shadow(0 4px 6px -4px rgba(0,0,0,0.07))" }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-neutral-800">What&apos;s new</p>
                    <button onClick={() => setShowWhatsNew(false)} className="text-neutral-400 hover:text-neutral-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="border-b border-neutral-100 pb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700">v2.5</span>
                        <span className="text-[10px] text-neutral-400">Latest</span>
                      </div>
                      <ul className="space-y-0.5 pl-2">
                        <li className="text-xs text-neutral-600 flex items-center gap-1.5">
                          <CircleDot className="h-1 w-1 text-teal-400" />
                          Priority distribution donut chart
                        </li>
                        <li className="text-xs text-neutral-600 flex items-center gap-1.5">
                          <CircleDot className="h-1 w-1 text-teal-400" />
                          Complaints by channel breakdown
                        </li>
                        <li className="text-xs text-neutral-600 flex items-center gap-1.5">
                          <CircleDot className="h-1 w-1 text-teal-400" />
                          Department performance cards with sparklines
                        </li>
                      </ul>
                    </div>
                    <div className="border-b border-neutral-100 pb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600">v2.4</span>
                        <span className="text-[10px] text-neutral-400">Mar 2025</span>
                      </div>
                      <ul className="space-y-0.5 pl-2">
                        <li className="text-xs text-neutral-600 flex items-center gap-1.5">
                          <CircleDot className="h-1 w-1 text-neutral-400" />
                          SLA breach alerts
                        </li>
                        <li className="text-xs text-neutral-600 flex items-center gap-1.5">
                          <CircleDot className="h-1 w-1 text-neutral-400" />
                          Reminder system
                        </li>
                        <li className="text-xs text-neutral-600 flex items-center gap-1.5">
                          <CircleDot className="h-1 w-1 text-neutral-400" />
                          Enhanced reports
                        </li>
                      </ul>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600">v2.3</span>
                        <span className="text-[10px] text-neutral-400">Feb 2025</span>
                      </div>
                      <ul className="space-y-0.5 pl-2">
                        <li className="text-xs text-neutral-600 flex items-center gap-1.5">
                          <CircleDot className="h-1 w-1 text-neutral-400" />
                          System health indicator
                        </li>
                        <li className="text-xs text-neutral-600 flex items-center gap-1.5">
                          <CircleDot className="h-1 w-1 text-neutral-400" />
                          Pending approval badge
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Focus Mode toggle */}
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${focusMode ? "border-teal-200 bg-teal-50 text-teal-700" : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300"}`}
            >
              {focusMode ? <Eye className="h-3.5 w-3.5 text-teal-600" /> : <EyeOff className="h-3.5 w-3.5 text-neutral-500" />}
              {focusMode ? "Focus mode" : "Full view"}
            </button>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------- */}
      {/*  Due Today Warning Banner (amber)                        */}
      {/* -------------------------------------------------------- */}
      {(stats.breached ?? 0) > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800">
              <span className="font-semibold">{stats.breached}</span> complaint{stats.breached === 1 ? "" : "s"} due today &mdash; SLA deadline approaching
            </p>
            <p className="text-xs text-amber-600">These require immediate attention before the deadline passes.</p>
          </div>
          <a href="/admin/sla" className="flex items-center gap-1 rounded-md border border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-200">
            View Deadlines
          </a>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/*  Quick Stats Bar (horizontal KPI strip)                  */}
      {/* -------------------------------------------------------- */}
      <QuickStatsBar />

      {/* -------------------------------------------------------- */}
      {/*  Stats cards with click-to-filter                        */}
      {/* -------------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Total"
          value={stats.total ?? 0}
          icon="total"
          accent="teal"
          sparkline={getSparklineTotal()}
          comparison="↑ 12% vs last week"
          onClick={() => handleStatFilter("total")}
          isActive={activeStatFilter === "total"}
        />
        <StatCard
          label="Awaiting Review"
          value={stats.acknowledged ?? 0}
          icon="awaiting"
          accent="amber"
          sparkline={getSparklineOpen()}
          comparison="↓ 3% vs last week"
          onClick={() => handleStatFilter("acknowledged")}
          isActive={activeStatFilter === "acknowledged"}
        />
        <StatCard
          label="Open"
          value={stats.open ?? 0}
          icon="open"
          accent="amber"
          sparkline={getSparklineOpen()}
          comparison="↑ 5% vs last week"
          onClick={() => handleStatFilter("open")}
          isActive={activeStatFilter === "open"}
        />
        <StatCard
          label="Resolved"
          value={stats.resolved ?? 0}
          icon="resolved"
          accent="emerald"
          sparkline={getSparklineResolved()}
          comparison="↑ 18% vs last week"
          onClick={() => handleStatFilter("resolved")}
          isActive={activeStatFilter === "resolved"}
        />
        <StatCard
          label="Breached"
          value={stats.breached ?? 0}
          icon="breached"
          accent="red"
          comparison="↓ 2 vs last week"
          onClick={() => handleStatFilter("breached")}
          isActive={activeStatFilter === "breached"}
        />
        <StatCard
          label="Reopened"
          value={stats.reopened ?? 0}
          icon="reopened"
          accent="orange"
          comparison="↑ 1 vs last week"
          onClick={() => handleStatFilter("reopened")}
          isActive={activeStatFilter === "reopened"}
        />
      </div>

      {/* -------------------------------------------------------- */}
      {/*  Priority Breakdown (mini section)                       */}
      {/* -------------------------------------------------------- */}
      <PriorityBreakdown stats={stats} />

      {/* -------------------------------------------------------- */}
      {/*  Performance Overview KPI Cards                         */}
      {/* -------------------------------------------------------- */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Performance Overview</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {HARDCODED_KPI.map((kpi) => (
            <PerformanceKPICard key={kpi.label} data={kpi} />
          ))}
        </div>
      </div>

      {/* -------------------------------------------------------- */}
      {/*  Quick Actions with pending approval badges              */}
      {/* -------------------------------------------------------- */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <QuickActionCard href="/admin/triage" accent="bg-amber-100 text-amber-600" icon={<Inbox className="h-5 w-5" />} title="Classify New Tickets" subtitle={`${stats.acknowledged ?? 0} awaiting review`} badge={stats.acknowledged ?? 0} />
          <QuickActionCard href="/admin/complaints" accent="bg-teal-100 text-teal-600" icon={<LayoutGrid className="h-5 w-5" />} title="View All Complaints" subtitle={`${stats.total ?? 0} total complaints`} />
          <QuickActionCard href="/admin/sla" accent="bg-red-100 text-red-600" icon={<Clock className="h-5 w-5" />} title="Check Deadlines" subtitle={`${stats.breached ?? 0} breached`} badge={stats.breached ?? 0} />
          <QuickActionCard href="/auditor/reports" accent="bg-emerald-100 text-emerald-600" icon={<BarChart3 className="h-5 w-5" />} title="View Reports" subtitle="Analytics & insights" badge={stats.pendingApproval ?? 0} />
        </div>
      </div>

      {/* -------------------------------------------------------- */}
      {/*  Charts Row — hidden in focus mode                       */}
      {/* -------------------------------------------------------- */}
      {!focusMode && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Trend line chart */}
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-800">Complaints Trend</h2>
                  <p className="mt-0.5 text-xs text-neutral-500">Last 30 days</p>
                </div>
                <TrendingUp className="h-4 w-4 text-teal-500" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#0f766e" strokeWidth={2} dot={false} name="Total" />
                    <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={1.5} dot={false} name="Resolved" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Status distribution pie chart */}
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-800">Status Distribution</h2>
                  <p className="mt-0.5 text-xs text-neutral-500">All complaints by current status</p>
                </div>
                <Activity className="h-4 w-4 text-neutral-500" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/*  Complaints by Channel + Priority Distribution           */}
      {/* -------------------------------------------------------- */}
      {!focusMode && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ChannelChart />
          <PriorityDonutChart />
        </div>
      )}

      {/* -------------------------------------------------------- */}
      {/*  Bottom row: Enhanced Dept Performance + Activity Feed   */}
      {/* -------------------------------------------------------- */}
      {!focusMode ? (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Department Performance Cards — takes 3 cols */}
          <div className="lg:col-span-3">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Department Performance</h2>
                <p className="mt-0.5 text-xs text-neutral-400">Metrics across all departments</p>
              </div>
              <a href="/admin/complaints" className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors">
                View All <ArrowRight className="h-3 w-3" />
              </a>
            </div>
            <EnhancedDeptPerformanceCards />
          </div>

          {/* Recent Activity Feed — takes 2 cols */}
          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm lg:col-span-2">
            <div className="p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-800">Recent Activity</h2>
                  <p className="mt-0.5 text-xs text-neutral-500">Latest complaint updates</p>
                </div>
                <Activity className="h-4 w-4 text-neutral-500" />
              </div>
              <EnhancedActivityFeed tickets={recentTickets} />
            </div>
          </div>
        </div>
      ) : (
        /* In focus mode, show only stat cards — no charts or tables */
        <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center">
          <Eye className="mx-auto h-8 w-8 text-neutral-300" />
          <p className="mt-2 text-sm font-medium text-neutral-500">Focus mode active</p>
          <p className="mt-1 text-xs text-neutral-400">Charts and detailed tables are hidden. Toggle &ldquo;Full view&rdquo; to see all data.</p>
        </div>
      )}
    </div>
  );
}
