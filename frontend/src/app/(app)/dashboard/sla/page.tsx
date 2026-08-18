"use client";

import { useEffect, useState, useCallback } from "react";

import { api, ApiError } from "@/lib/api";
import { SlaStatus } from "@/components/SlaStatus";
import type { Ticket } from "@/lib/types";

type View = "all" | "breached" | "warning";

/**
 * SLA breach dashboard. Shows active tickets with their SLA state, filterable
 * by breached / warning / all. Red chips + progress bars surface at-risk work.
 */
export default function SlaDashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("all");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ items: Ticket[] }>(
        `/sla/breaching?view=${view}`,
      );
      setTickets(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load.");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const breachedCount = tickets.filter((t: any) => t.slaBreached).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Response Deadlines
          </h1>
          <p className="text-sm text-muted-foreground">
            {tickets.length} active complaint{tickets.length !== 1 ? "s" : ""} ·{" "}
            <span className="text-red-600">{breachedCount} overdue</span>
          </p>
        </div>
        <button
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-neutral-50 disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={fetchTickets}
          disabled={loading}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div className="flex gap-1 rounded-lg border border-border bg-neutral-50 p-1">
        {(["all", "breached", "warning"] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors ${
              view === v
                ? "bg-neutral-50 text-green-700 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {tickets.length === 0 && !loading ? (
        <div className="rounded-xl border border-border bg-neutral-50 shadow-sm">
          <div className="p-6">
            <p className="py-8 text-center text-muted-foreground">
              No tickets in this view.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-neutral-50 shadow-sm">
          <div className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-neutral-50 text-left text-xs uppercase text-muted-foreground">
                    <th className="px-4 py-3">Ticket</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t: any) => (
                    <tr
                      key={t.id}
                      className="border-b border-border hover:bg-neutral-50"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-green-700">
                        {t.ticketCode}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 font-medium text-foreground">
                        {t.subject}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t.department?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {t.priority ? (
                          <span className="rounded-full bg-neutral-50 px-2 py-0.5 text-xs font-medium text-foreground">
                            {t.priority}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
