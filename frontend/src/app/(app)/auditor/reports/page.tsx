"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { X, TrendingUp, TrendingDown, Clock, ShieldCheck, FileText, Download, ChevronDown, BarChart3, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { Ticket } from "@/lib/types";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, LineChart, Line,
} from "recharts";

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
  acknowledged?: number;
  assigned?: number;
  pendingApproval?: number;
}

interface DeptPerf {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  total: number;
  resolved: number;
  breached: number;
  reopened: number;
  avgResolutionHours: number | null;
  breachRate: number;
  reopenRate: number;
}

interface TrendPoint {
  date: string;
  total: number;
  resolved: number;
  open: number;
}

interface Reminder {
  id: string;
  ticketId: string;
  note: string;
  remindAt: string;
  ticket?: { ticketCode: string; subject: string };
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Colors — teal/emerald palette                                      */
/* ------------------------------------------------------------------ */

const PIE_COLORS = ["#0d9488", "#f59e0b", "#10b981", "#6b7280", "#ef4444", "#8b5cf6"];
const PIE_NAMES = ["Acknowledged", "Open", "Resolved", "Closed", "Reopened"];

/* ------------------------------------------------------------------ */
/*  Sample data for new charts                                         */
/* ------------------------------------------------------------------ */

const trendLineData = [
  { month: "Jan", Submitted: 42, Resolved: 28, Escalated: 5 },
  { month: "Feb", Submitted: 38, Resolved: 32, Escalated: 4 },
  { month: "Mar", Submitted: 55, Resolved: 41, Escalated: 8 },
  { month: "Apr", Submitted: 47, Resolved: 39, Escalated: 6 },
  { month: "May", Submitted: 62, Resolved: 51, Escalated: 7 },
  { month: "Jun", Submitted: 58, Resolved: 48, Escalated: 9 },
  { month: "Jul", Submitted: 71, Resolved: 59, Escalated: 10 },
  { month: "Aug", Submitted: 65, Resolved: 55, Escalated: 8 },
  { month: "Sep", Submitted: 53, Resolved: 47, Escalated: 5 },
  { month: "Oct", Submitted: 49, Resolved: 44, Escalated: 4 },
  { month: "Nov", Submitted: 60, Resolved: 52, Escalated: 6 },
  { month: "Dec", Submitted: 44, Resolved: 38, Escalated: 3 },
];

const resolutionTimeData = [
  { department: "Works & Infra", days: 3.2 },
  { department: "Health", days: 4.8 },
  { department: "Education", days: 6.5 },
  { department: "Agriculture", days: 8.1 },
  { department: "Finance", days: 11.4 },
  { department: "Justice", days: 14.7 },
];

const priorityData = [
  { name: "P1 – Critical", value: 18, color: "#ef4444" },
  { name: "P2 – High", value: 45, color: "#f59e0b" },
  { name: "P3 – Medium", value: 72, color: "#14b8a6" },
  { name: "P4 – Low", value: 35, color: "#6b7280" },
];

const DATE_RANGE_OPTIONS = ["Last 7 days", "Last 30 days", "Last 90 days", "This Year", "All Time"] as const;

/* ------------------------------------------------------------------ */
/*  Helper: greeting based on time of day                              */
/* ------------------------------------------------------------------ */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatDateLong(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Helper: resolution rate                                            */
/* ------------------------------------------------------------------ */

function resolutionRate(stats: OverviewStats): number {
  if (stats.total === 0) return 0;
  return Math.round(((stats.resolved + stats.closed) / stats.total) * 100);
}

function avgResolutionHours(deptPerf: DeptPerf[]): number | null {
  const valid = deptPerf.filter((d) => d.avgResolutionHours !== null);
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((s, d) => s + (d.avgResolutionHours ?? 0), 0) / valid.length);
}

function overallBreachRate(stats: OverviewStats): number {
  if (stats.total === 0) return 0;
  return Math.round((stats.breached / stats.total) * 100);
}

/* ------------------------------------------------------------------ */
/*  Custom tooltip for bar chart                                       */
/* ------------------------------------------------------------------ */

function BarChartTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-lg">
      <p className="mb-1 text-xs font-semibold text-neutral-700">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs text-neutral-600">
          <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Custom pie chart label renderer                                    */
/* ------------------------------------------------------------------ */

const RADIAN = Math.PI / 180;
function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) {
  if (percent < 0.05) return null; // Skip tiny slices
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function ReportsPage() {
  const { user } = useSession();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [deptPerf, setDeptPerf] = useState<DeptPerf[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);

  /* Reminder state */
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [ticketOptions, setTicketOptions] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [reminderNote, setReminderNote] = useState("");
  const [remindAt, setRemindAt] = useState("");
  const [submittingReminder, setSubmittingReminder] = useState(false);
  const [reminderSuccess, setReminderSuccess] = useState("");
  const [deletingReminderId, setDeletingReminderId] = useState<string | null>(null);

  /* Date range filter & export */
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("Last 30 days");
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  /* ------------------------------------------------------------------ */
  /*  Data fetching                                                      */
  /* ------------------------------------------------------------------ */

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, deptRes, trendRes] = await Promise.all([
        api.get<OverviewStats>("/reports/overview"),
        api.get<DeptPerf[]>(`/reports/department-performance${from ? `?from=${from}` : ""}${to ? `${from ? "&" : "?"}to=${to}` : ""}`),
        api.get<TrendPoint[]>("/reports/trend?days=30"),
      ]);
      setStats(overviewRes);
      setDeptPerf(deptRes);
      setTrend(trendRes);
    } catch {
      // Silently degrade
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  const fetchReminders = useCallback(async () => {
    try {
      const res = await api.get<Reminder[]>("/reminders");
      setReminders(res);
    } catch {
      // Silently degrade
    }
  }, []);

  const fetchTicketOptions = useCallback(async () => {
    try {
      const res = await api.get<{ items: Ticket[] }>("/tickets?pageSize=100");
      setTicketOptions(res.items ?? []);
    } catch {
      // Silently degrade
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { fetchReminders(); }, [fetchReminders]);
  useEffect(() => { fetchTicketOptions(); }, [fetchTicketOptions]);

  /* Close export dropdown on outside click */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setShowExportDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Reminder handlers                                                  */
  /* ------------------------------------------------------------------ */

  async function handleCreateReminder() {
    if (!selectedTicketId || !remindAt) return;
    setSubmittingReminder(true);
    try {
      await api.post("/reminders", {
        ticketId: selectedTicketId,
        note: reminderNote,
        remindAt,
      });
      setShowReminderModal(false);
      setSelectedTicketId("");
      setReminderNote("");
      setRemindAt("");
      setReminderSuccess("Reminder created successfully!");
      fetchReminders();
      setTimeout(() => setReminderSuccess(""), 4000);
    } catch {
      setReminderSuccess("");
    } finally {
      setSubmittingReminder(false);
    }
  }

  async function handleDeleteReminder(id: string) {
    setDeletingReminderId(id);
    try {
      await api.delete(`/reminders/${id}`);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // Silently degrade
    } finally {
      setDeletingReminderId(null);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Pie chart data                                                     */
  /* ------------------------------------------------------------------ */

  const pieData = stats
    ? [
        { name: "Acknowledged", value: stats.acknowledged ?? 0 },
        { name: "Open", value: stats.open ?? 0 },
        { name: "Resolved", value: stats.resolved ?? 0 },
        { name: "Closed", value: stats.closed ?? 0 },
        { name: "Reopened", value: stats.reopened ?? 0 },
      ].filter((d) => d.value > 0)
    : [];

  /* ------------------------------------------------------------------ */
  /*  Loading state                                                      */
  /* ------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="h-6 w-6 animate-spin text-teal-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="ml-2 text-sm text-neutral-500">Loading reports...</span>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="space-y-6">
      {/* ─────────── Page Header ─────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {getGreeting()}, {user?.fullName?.split(" ")[0] ?? "Auditor"}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {formatDateLong()} &middot; Performance metrics and analytics overview
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Set Reminder button */}
          <button
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-700"
            onClick={() => setShowReminderModal(true)}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            Set Reminder
          </button>

          {/* Export Report dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50"
              onClick={() => setShowExportDropdown(!showExportDropdown)}
            >
              <Download className="h-4 w-4 text-neutral-500" />
              Export Report
              <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
            </button>
            {showExportDropdown && (
              <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                {["PDF", "CSV", "Excel"].map((format) => (
                  <button
                    key={format}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
                    onClick={() => setShowExportDropdown(false)}
                  >
                    <FileText className="h-4 w-4 text-neutral-400" />
                    {format}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─────────── Date Range Filter ─────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-neutral-500 mr-1">Period:</span>
        {DATE_RANGE_OPTIONS.map((option) => (
          <button
            key={option}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              dateRangeFilter === option
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white text-neutral-600 border border-neutral-200 hover:border-emerald-300 hover:text-emerald-700"
            }`}
            onClick={() => setDateRangeFilter(option)}
          >
            {option}
          </button>
        ))}
        {/* Custom date range (existing) */}
        <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 shadow-sm">
          <svg className="h-4 w-4 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-neutral-200 px-2 py-1 text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20"
          />
          <span className="text-xs text-neutral-400">&mdash;</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-neutral-200 px-2 py-1 text-xs outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20"
          />
          {(from || to) && (
            <button className="rounded-lg px-2 py-1 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100" onClick={() => { setFrom(""); setTo(""); }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ─────────── Success toast ─────────── */}
      {reminderSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
          <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <path d="M22 4L12 14.01l-3-3" />
          </svg>
          {reminderSuccess}
        </div>
      )}

      {/* ─────────── Summary Stats ─────────── */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Total Complaints */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
                <BarChart3 className="h-5 w-5 text-teal-600" />
              </div>
              <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5">
                <TrendingUp className="h-3 w-3 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-600">+12%</span>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-neutral-900">{stats.total.toLocaleString()}</p>
              <p className="text-xs font-medium text-neutral-500">Total Complaints</p>
            </div>
          </div>

          {/* Resolution Rate */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5">
                <TrendingUp className="h-3 w-3 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-600">+5%</span>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-neutral-900">{resolutionRate(stats)}%</p>
              <p className="text-xs font-medium text-neutral-500">Resolution Rate</p>
            </div>
          </div>

          {/* Avg Response Time */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5">
                <TrendingDown className="h-3 w-3 text-amber-600" />
                <span className="text-xs font-semibold text-amber-600">-8%</span>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-neutral-900">
                {avgResolutionHours(deptPerf) !== null ? `${avgResolutionHours(deptPerf)}h` : "N/A"}
              </p>
              <p className="text-xs font-medium text-neutral-500">Avg Response Time</p>
            </div>
          </div>

          {/* Compliance Score */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
                <ShieldCheck className="h-5 w-5 text-teal-600" />
              </div>
              <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5">
                <TrendingUp className="h-3 w-3 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-600">+3%</span>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-neutral-900">{Math.max(0, 100 - overallBreachRate(stats) * 2)}%</p>
              <p className="text-xs font-medium text-neutral-500">Compliance Score</p>
            </div>
          </div>
        </div>
      )}

      {/* ─────────── Charts Row ─────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie Chart — Status Distribution */}
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="p-6">
            <div className="mb-2">
              <h2 className="text-base font-semibold text-neutral-800">Status Distribution</h2>
              <p className="text-xs text-neutral-500">Breakdown of all complaints by current status</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                    label={renderPieLabel}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(), "Count"]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend below pie */}
            <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-xs font-medium text-neutral-600">{d.name}</span>
                  <span className="text-xs text-neutral-400">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar Chart — Complaints Trend */}
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="p-6">
            <div className="mb-2">
              <h2 className="text-base font-semibold text-neutral-800">Complaints Trend</h2>
              <p className="text-xs text-neutral-500">Last 30 days — new vs resolved complaints</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#737373" }}
                    tickFormatter={(v) => v.slice(5)}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#737373" }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip content={<BarChartTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={28}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => <span className="text-xs font-medium text-neutral-600">{value}</span>}
                  />
                  <Bar dataKey="total" fill="#0d9488" name="Total" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="resolved" fill="#10b981" name="Resolved" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────── New Charts Row: Complaint Trends & Resolution Time ─────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Complaint Trends — Multi-line Chart */}
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="p-6">
            <div className="mb-2">
              <h2 className="text-base font-semibold text-neutral-800">Complaint Trends</h2>
              <p className="text-xs text-neutral-500">12-month overview — submitted, resolved & escalated</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendLineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#737373" }}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#737373" }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                    formatter={(value: number, name: string) => [value, name]}
                  />
                  <Legend
                    verticalAlign="top"
                    height={28}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => <span className="text-xs font-medium text-neutral-600">{value}</span>}
                  />
                  <Line
                    type="monotone"
                    dataKey="Submitted"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Resolved"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#f59e0b", strokeWidth: 2, stroke: "#fff" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Escalated"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#ef4444", strokeWidth: 2, stroke: "#fff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Resolution Time by Department — Horizontal Bar Chart */}
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="p-6">
            <div className="mb-2">
              <h2 className="text-base font-semibold text-neutral-800">Resolution Time by Department</h2>
              <p className="text-xs text-neutral-500">Average days to resolve — color-coded by performance</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resolutionTimeData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#737373" }}
                    axisLine={false}
                    tickLine={false}
                    unit="d"
                  />
                  <YAxis
                    type="category"
                    dataKey="department"
                    tick={{ fontSize: 11, fill: "#737373" }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                    formatter={(value: number) => [`${value} days`, "Avg Resolution"]}
                  />
                  <Bar dataKey="days" radius={[0, 4, 4, 0]} barSize={24}>
                    {resolutionTimeData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.days < 5 ? "#10b981" : entry.days <= 10 ? "#f59e0b" : "#ef4444"}
                        stroke="none"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Performance legend */}
            <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-emerald-500" />
                <span className="text-xs text-neutral-600">&lt; 5 days</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-amber-500" />
                <span className="text-xs text-neutral-600">5–10 days</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm bg-red-500" />
                <span className="text-xs text-neutral-600">&gt; 10 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────── Priority Distribution Donut ─────────── */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="p-6">
          <div className="mb-2">
            <h2 className="text-base font-semibold text-neutral-800">Priority Distribution</h2>
            <p className="text-xs text-neutral-500">Complaints categorized by priority level (P1–P4)</p>
          </div>
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-10">
            <div className="h-64 w-full max-w-xs">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                    label={renderPieLabel}
                    stroke="none"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(), "Count"]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Center text & legend */}
            <div className="flex flex-col justify-center gap-4 md:mt-8">
              <div className="text-center md:text-left">
                <p className="text-3xl font-bold text-neutral-900">{priorityData.reduce((s, d) => s + d.value, 0)}</p>
                <p className="text-xs font-medium text-neutral-500">Total Complaints</p>
              </div>
              <div className="space-y-2.5">
                {priorityData.map((d) => (
                  <div key={d.name} className="flex items-center gap-3">
                    <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: d.color }} />
                    <span className="text-sm font-medium text-neutral-700">{d.name}</span>
                    <span className="ml-auto text-sm font-semibold text-neutral-900">{d.value}</span>
                    <span className="text-xs text-neutral-400">
                      ({Math.round((d.value / priorityData.reduce((s, p) => s + p.value, 0)) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────── Reminders Section ─────────── */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-neutral-800">Active Reminders</h2>
              <p className="text-xs text-neutral-500">Your scheduled follow-up reminders</p>
            </div>
            <button
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-700"
              onClick={() => setShowReminderModal(true)}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New Reminder
            </button>
          </div>

          {reminders.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-neutral-400">
              <svg className="h-8 w-8 mb-2 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              <p className="text-sm">No active reminders</p>
              <p className="text-xs mt-1">Click &ldquo;New Reminder&rdquo; to schedule a follow-up</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
              {reminders.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm transition-colors hover:border-teal-200"
                >
                  {/* Bell icon */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 01-3.46 0" />
                    </svg>
                  </div>
                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-neutral-800 truncate">
                      {r.ticket?.ticketCode ?? "Ticket"} &mdash; {r.ticket?.subject ?? "N/A"}
                    </p>
                    {r.note && (
                      <p className="mt-0.5 text-xs text-neutral-500 truncate">{r.note}</p>
                    )}
                    <p className="mt-1 text-xs text-neutral-400">
                      {new Date(r.remindAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {/* Delete button */}
                  <button
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:text-red-500 hover:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={deletingReminderId === r.id}
                    onClick={() => handleDeleteReminder(r.id)}
                  >
                    {deletingReminderId === r.id ? (
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─────────── Department Performance Table ─────────── */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-neutral-800">Department Performance</h2>
            <p className="text-xs text-neutral-500">Comparison across departments for the selected period</p>
          </div>
          {deptPerf.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-neutral-400">
              <svg className="h-8 w-8 mb-2 text-neutral-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
              <p className="text-sm">No department data available</p>
              <p className="text-xs mt-1">Try adjusting the date range</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-teal-50 text-left">
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-teal-800">Department</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-teal-800 text-right">Total</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-teal-800 text-right">Resolved</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-teal-800 text-right">Avg Hours</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-teal-800">Breach Rate</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-teal-800">Reopen Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {deptPerf.map((d, i) => (
                    <tr
                      key={d.departmentId}
                      className={`${i % 2 === 0 ? "bg-white" : "bg-neutral-50/50"} border-b border-neutral-100 transition-colors hover:bg-teal-50/30`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-teal-100 text-teal-700 text-xs font-bold">
                            {d.departmentCode?.slice(0, 2) ?? "?"}
                          </div>
                          <span className="font-medium text-neutral-800">{d.departmentName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-neutral-700">{d.total}</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          d.resolved / d.total >= 0.7
                            ? "bg-emerald-100 text-emerald-700"
                            : d.resolved / d.total >= 0.4
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {d.resolved}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-neutral-600">
                        {d.avgResolutionHours !== null ? (
                          <span className={`font-medium ${
                            d.avgResolutionHours <= 48 ? "text-emerald-600" : d.avgResolutionHours <= 96 ? "text-amber-600" : "text-red-600"
                          }`}>
                            {d.avgResolutionHours}h
                          </span>
                        ) : (
                          <span className="text-neutral-400">&mdash;</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-2 w-24 rounded-full bg-neutral-200 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                d.breachRate > 20 ? "bg-red-500" : d.breachRate > 10 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(d.breachRate, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-semibold tabular-nums ${
                            d.breachRate > 20 ? "text-red-600" : d.breachRate > 10 ? "text-amber-600" : "text-emerald-600"
                          }`}>
                            {d.breachRate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-2 w-24 rounded-full bg-neutral-200 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                d.reopenRate > 15 ? "bg-orange-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(d.reopenRate, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-semibold tabular-nums ${
                            d.reopenRate > 15 ? "text-orange-600" : "text-emerald-600"
                          }`}>
                            {d.reopenRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ─────────── Reminder Modal ─────────── */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowReminderModal(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-0 shadow-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">Set Reminder</h2>
                <button onClick={() => setShowReminderModal(false)} className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                {/* Ticket dropdown */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700">Ticket *</label>
                  <select
                    value={selectedTicketId}
                    onChange={(e) => setSelectedTicketId(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  >
                    <option value="">Select a ticket…</option>
                    {ticketOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.ticketCode} — {t.subject}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Note textarea */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700">Note</label>
                  <textarea
                    value={reminderNote}
                    onChange={(e) => setReminderNote(e.target.value)}
                    rows={3}
                    placeholder="What should I follow up on?"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20 resize-none"
                  />
                </div>

                {/* Remind At datetime */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700">Remind At *</label>
                  <input
                    type="datetime-local"
                    value={remindAt}
                    onChange={(e) => setRemindAt(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button className="rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed" onClick={() => setShowReminderModal(false)} disabled={submittingReminder}>
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleCreateReminder}
                  disabled={!selectedTicketId || !remindAt || submittingReminder}
                >
                  {submittingReminder ? "Creating…" : "Create Reminder"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
