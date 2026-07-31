"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { StatCard } from "@/components/DashboardStats";
import { useSession } from "@/lib/session";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  ShieldCheck, Inbox, Clock, Building2, TrendingUp,
  ArrowRight, Award, AlertTriangle, CheckCircle2,
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

interface DeptPerf {
  departmentId?: string;
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

const STATUS_COLORS = ["#0d9488", "#f59e0b", "#10b981", "#6b7280", "#ef4444", "#8b5cf6"];

export default function CommissionerDashboard() {
  const { user } = useSession();
  const [stats, setStats] = useState<Partial<OverviewStats>>({});
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [deptPerf, setDeptPerf] = useState<DeptPerf[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, trendRes, deptRes] = await Promise.allSettled([
        api.get<OverviewStats>("/reports/overview"),
        api.get<TrendPoint[]>("/reports/trend?days=30"),
        api.get<DeptPerf[]>("/reports/department-performance"),
      ]);
      if (overviewRes.status === "fulfilled") setStats(overviewRes.value);
      if (trendRes.status === "fulfilled") setTrend(trendRes.value);
      if (deptRes.status === "fulfilled") setDeptPerf(deptRes.value);
    } catch {
      // degrade silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Department performance ranking
  const topDepartments = [...deptPerf]
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0))
    .slice(0, 5);

  // Status distribution pie
  const pieData = [
    { name: "Open", value: stats.open ?? 0, color: STATUS_COLORS[1] },
    { name: "Resolved", value: stats.resolved ?? 0, color: STATUS_COLORS[2] },
    { name: "Closed", value: stats.closed ?? 0, color: STATUS_COLORS[3] },
    { name: "Reopened", value: stats.reopened ?? 0, color: STATUS_COLORS[4] },
  ].filter((d) => d.value > 0);

  const complianceScore = (() => {
    const total = stats.total ?? 0;
    const resolved = (stats.resolved ?? 0) + (stats.closed ?? 0);
    if (total === 0) return 0;
    return Math.round((resolved / total) * 100);
  })();

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-sm text-neutral-400">
        <Clock size={24} className="animate-pulse text-teal-500" />
        Loading Commissioner dashboard…
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-700 ring-1 ring-amber-100">
              <Award size={10} />
              Hon. Commissioner
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
            {greeting}, {user?.fullName?.split(" ").slice(-1)[0] ?? "Commissioner"}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Strategic overview · Ministry performance · Final approvals
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/commissioner/inbox"
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-teal-700"
          >
            <Inbox size={13} />
            Approvals Inbox
            {(stats.pendingApproval ?? 0) > 0 && (
              <span className="ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-teal-700">
                {stats.pendingApproval}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Compliance summary banner */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                Ministry Resolution Rate
              </p>
              <p className="mt-1 text-3xl font-bold text-neutral-900">{complianceScore}%</p>
              <p className="mt-1 text-xs text-neutral-600">
                Resolved + Closed of {stats.total ?? 0} total
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 size={26} className="text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                Pending Final Approval
              </p>
              <p className="mt-1 text-3xl font-bold text-neutral-900">
                {stats.pendingApproval ?? 0}
              </p>
              <p className="mt-1 text-xs text-neutral-600">Awaiting your sign-off</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
              <ShieldCheck size={26} className="text-amber-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-700">
                SLA Breaches
              </p>
              <p className="mt-1 text-3xl font-bold text-neutral-900">
                {stats.breached ?? 0}
              </p>
              <p className="mt-1 text-xs text-neutral-600">Require attention</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle size={26} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total" value={stats.total ?? 0} icon="total" accent="teal" />
        <StatCard label="Open" value={stats.open ?? 0} icon="open" accent="amber" />
        <StatCard label="Resolved" value={stats.resolved ?? 0} icon="resolved" accent="emerald" />
        <StatCard label="Reopened" value={stats.reopened ?? 0} icon="reopened" accent="orange" />
      </div>

      {/* Trend + Status */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                <TrendingUp size={14} className="text-teal-600" />
                30-Day Complaints Trend
              </h2>
              <p className="text-xs text-neutral-500">Daily submissions and resolutions</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
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
                <Bar dataKey="total" name="New" fill="#0d9488" radius={[3, 3, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-neutral-900">
            <Award size={14} className="text-amber-600" />
            Status Mix
          </h2>
          {pieData.length > 0 ? (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ percent }) =>
                        percent ? `${Math.round(percent * 100)}%` : ""
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
              <div className="mt-3 space-y-1 border-t border-neutral-100 pt-3">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
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
            </>
          ) : (
            <div className="flex h-48 items-center justify-center text-xs text-neutral-400">
              No data
            </div>
          )}
        </div>
      </div>

      {/* Top departments */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-neutral-900">
            <Building2 size={14} className="text-teal-600" />
            Department Performance Snapshot
          </h2>
        </div>

        {topDepartments.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topDepartments.map((d, i) => (
              <div
                key={d.departmentId ?? d.departmentName}
                className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white font-mono text-xs font-bold text-neutral-600 ring-1 ring-neutral-200">
                    {i + 1}
                  </span>
                  <p className="flex-1 truncate text-sm font-semibold text-neutral-900">
                    {d.departmentName}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-white p-1.5">
                    <p className="text-[10px] font-bold uppercase text-neutral-400">Total</p>
                    <p className="text-sm font-bold text-neutral-900">{d.total ?? 0}</p>
                  </div>
                  <div className="rounded-md bg-white p-1.5">
                    <p className="text-[10px] font-bold uppercase text-neutral-400">Resolved</p>
                    <p className="text-sm font-bold text-emerald-700">{d.resolved ?? 0}</p>
                  </div>
                  <div className="rounded-md bg-white p-1.5">
                    <p className="text-[10px] font-bold uppercase text-neutral-400">Breached</p>
                    <p className={`text-sm font-bold ${d.breached > 0 ? "text-red-700" : "text-neutral-500"}`}>
                      {d.breached ?? 0}
                    </p>
                  </div>
                </div>
                {d.breachRate !== undefined && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[10px] text-neutral-500">
                      <span>Breach rate</span>
                      <span className="font-semibold text-neutral-700">{d.breachRate}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-200">
                      <div
                        className={
                          d.breachRate > 25
                            ? "h-full bg-red-500"
                            : d.breachRate > 10
                            ? "h-full bg-amber-500"
                            : "h-full bg-emerald-500"
                        }
                        style={{ width: `${Math.min(100, d.breachRate)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center text-xs text-neutral-400">
            No department data
          </div>
        )}
      </div>
    </div>
  );
}
