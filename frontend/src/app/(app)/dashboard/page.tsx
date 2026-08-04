"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TicketIcon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { ROLE_LANDING_ROUTE } from "@/lib/nav";

/**
 * `/dashboard` — the single role-aware landing.
 *
 * Non-ADMIN roles are redirected to their default module. ADMIN sees the
 * consolidated summary (single GET /dashboard/summary call) with stat cards,
 * a trend area chart, a status pie, recent complaints and escalation counts.
 */

interface Summary {
  overview: {
    total: number;
    open: number;
    resolved: number;
    closed: number;
    breached: number;
    reopened: number;
    acknowledged: number;
    assigned: number;
    pendingApproval: number;
  };
  trend: { date: string; total: number; resolved: number; open: number }[];
  breakdowns: {
    priority: { key: string; count: number }[];
    channel: { key: string; count: number }[];
    status: { key: string; count: number }[];
  };
  departmentPerformance: any[];
  recent: any[];
  breaching: any[];
  escalations: { tier: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "#94a3b8",
  ACKNOWLEDGED: "#0ea5e9",
  TRIAGED: "#6366f1",
  ASSIGNED: "#8b5cf6",
  IN_PROGRESS: "#f59e0b",
  PENDING_APPROVAL: "#ec4899",
  APPROVED: "#14b8a6",
  RESOLVED: "#16a34a",
  CLOSED: "#22c55e",
  REOPENED: "#ef4444",
  ESCALATED: "#dc2626",
  REFERRED: "#a855f7",
};

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: any;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Icon className={`h-4 w-4 ${accent ?? "text-primary"}`} />
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-muted-foreground">
          <span
            className="mr-1.5 inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          {p.name}:{" "}
          <span className="font-medium text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function DashboardIndex() {
  const { user, loading } = useSession();
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await api.get<Summary>("/dashboard/summary");
      setSummary(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (loading || !user) return;
    if (user.role !== "ADMIN") {
      const target = ROLE_LANDING_ROUTE[user.role] ?? "/dashboard";
      if (target !== "/dashboard") {
        router.replace(target);
        return;
      }
    }
    void load();
  }, [user, loading, router, load]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  const o = summary?.overview;
  const escalationsTotal =
    summary?.escalations?.reduce((sum, e) => sum + e.count, 0) ?? 0;

  // Format trend data for the chart.
  const trendData = (summary?.trend ?? []).map((t) => ({
    date: new Date(t.date).toLocaleDateString("en", {
      month: "short",
      day: "numeric",
    }),
    Submitted: t.total,
    Resolved: t.resolved,
  }));

  // Format status breakdown for the pie.
  const statusData = (summary?.breakdowns?.status ?? []).map((s) => ({
    name: s.key
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    value: s.count,
    color: STATUS_COLORS[s.key] ?? "#94a3b8",
  }));

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Welcome back, {user.fullName.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            System-wide complaint overview
          </p>
        </div>
        <button
          onClick={load}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-neutral-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total" value={o?.total ?? 0} icon={TicketIcon} />
        <StatCard
          label="Open"
          value={o?.open ?? 0}
          icon={Clock}
          accent="text-warning"
        />
        <StatCard
          label="Resolved"
          value={o?.resolved ?? 0}
          icon={CheckCircle2}
          accent="text-success"
        />
        <StatCard
          label="Closed"
          value={o?.closed ?? 0}
          icon={CheckCircle2}
          accent="text-success"
        />
        <StatCard
          label="Breached"
          value={o?.breached ?? 0}
          icon={AlertTriangle}
          accent="text-destructive"
        />
        <StatCard
          label="Reopened"
          value={o?.reopened ?? 0}
          icon={RotateCcw}
          accent="text-warning"
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trend area chart */}
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Complaints trend (30 days)
            </h2>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart
                data={trendData}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="cSubmitted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Submitted"
                  stroke="#0d9488"
                  strokeWidth={2}
                  fill="url(#cSubmitted)"
                />
                <Area
                  type="monotone"
                  dataKey="Resolved"
                  stroke="#16a34a"
                  strokeWidth={2}
                  fill="url(#cResolved)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
              No trend data yet
            </div>
          )}
        </div>

        {/* Status pie */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            By status
          </h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: 11,
                    color: "var(--muted-foreground)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
              No status data
            </div>
          )}
        </div>
      </div>

      {/* Recent + escalation summary */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Recent complaints
            </h2>
            <Link
              href="/dashboard/complaints"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {(summary?.recent ?? []).map((t) => (
              <li key={t.id}>
                <Link
                  href={`/dashboard/complaints/${t.id}`}
                  className="flex items-center justify-between gap-3 px-2 py-2.5 transition-colors hover:rounded-md hover:bg-neutral-50/50 -mx-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {t.subject}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.ticketCode} · {t.department?.name ?? "Unassigned"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.slaBreached && (
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <span className="rounded-md bg-neutral-50 px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                      {t.status}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
            {(summary?.recent ?? []).length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">
                No complaints yet
              </li>
            )}
          </ul>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Escalations in flight
              </h2>
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {escalationsTotal}
              </span>
            </div>
            <ul className="space-y-1.5">
              {(summary?.escalations ?? []).map((e) => (
                <li
                  key={e.tier}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {e.tier
                      .replace(/_/g, " ")
                      .toLowerCase()
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                  <span className="font-medium text-foreground">{e.count}</span>
                </li>
              ))}
              {(summary?.escalations ?? []).length === 0 && (
                <li className="text-sm text-muted-foreground">None pending</li>
              )}
            </ul>
          </div>

          {/* Priority breakdown */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              By priority
            </h2>
            <ul className="space-y-1.5">
              {(summary?.breakdowns?.priority ?? []).map((p) => (
                <li
                  key={p.key}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{p.key}</span>
                  <span className="font-medium text-foreground">{p.count}</span>
                </li>
              ))}
              {(summary?.breakdowns?.priority ?? []).length === 0 && (
                <li className="text-sm text-muted-foreground">No data</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
