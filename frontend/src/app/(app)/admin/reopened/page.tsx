"use client";

import { useEffect, useState, useCallback } from "react";

import { api, ApiError } from "@/lib/api";
import type { Ticket, PaginatedResponse } from "@/lib/types";

/**
 * Admin: reopened tickets queue. Citizens who rejected a resolution land here
 * for re-triage. A reopen-count badge flags repeat reopeners (≥2 triggers a
 * REOPEN_ESCALATION to the HOD on the backend).
 */
export default function ReopenedTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<PaginatedResponse<Ticket>>(
        "/tickets/admin/reopened?page=1&pageSize=50",
      );
      setTickets(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load.");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800">Reopened Tickets</h1>
          <p className="text-sm text-neutral-500">
            {total} ticket{total !== 1 ? "s" : ""} rejected by citizens — re-classification required
          </p>
        </div>
        <button className="rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed" onClick={fetchTickets} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {tickets.length === 0 && !loading ? (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="p-6">
            <p className="py-8 text-center text-neutral-500">No reopened tickets.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                    <th className="px-4 py-3">Ticket</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Reopens</th>
                    <th className="px-4 py-3">Last Reopened</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t: any) => (
                    <tr key={t.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="px-4 py-3 font-mono text-xs text-teal-700">
                        {t.ticketCode}
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 font-medium text-neutral-800">
                        {t.subject}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {t.department?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            (t.reopenCount ?? 0) >= 2
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {t.reopenCount ?? 0}×
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {t.lastReopenedAt
                          ? new Date(t.lastReopenedAt).toLocaleDateString()
                          : "—"}
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
