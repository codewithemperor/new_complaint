"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { StatCard } from "@/components/DashboardStats";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useSession } from "@/lib/session";
import type { PaginatedResponse, Ticket } from "@/lib/types";

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

export default function HodDashboard() {
  const { user } = useSession();
  const [stats, setStats] = useState<Partial<OverviewStats>>({});
  const [trend, setTrend] = useState<{ date: string; total: number }[]>([]);
  const [recent, setRecent] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, trendRes, ticketsRes] = await Promise.all([
        api.get<OverviewStats>("/reports/overview"),
        api.get<TrendPoint[]>("/reports/trend?days=30"),
        api.get<PaginatedResponse<Ticket>>(
          `/tickets?departmentId=${user?.departmentId ?? ""}&page=1&pageSize=5`,
        ),
      ]);
      setStats(overviewRes);
      setTrend(trendRes.map((t) => ({ date: t.date, total: t.total })));
      setRecent(ticketsRes.items);
    } catch {
      // degrade silently
    } finally {
      setLoading(false);
    }
  }, [user?.departmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-neutral-400">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-800">Department Dashboard</h1>
        <p className="text-sm text-neutral-500">Welcome, {user?.fullName}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Dept Complaints" value={stats.total ?? 0} icon="total" accent="teal" />
        <StatCard label="Open" value={stats.open ?? 0} icon="open" accent="amber" />
        <StatCard
          label="Pending Approval"
          value={stats.pendingApproval ?? 0}
          icon="awaiting"
          accent="amber"
        />
        <StatCard label="Breached" value={stats.breached ?? 0} icon="breached" accent="red" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase text-neutral-500">
              Trend (30 days)
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#0f766e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase text-neutral-500">
              Recent Department Activity
            </h2>
            {recent.length === 0 ? (
              <p className="py-4 text-center text-sm text-neutral-400">
                No complaints in your department yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recent.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-100 p-3"
                  >
                    <div>
                      <p className="font-mono text-xs text-teal-700">{t.ticketCode}</p>
                      <p className="text-sm font-medium text-neutral-800">{t.subject}</p>
                    </div>
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                      {t.status.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
