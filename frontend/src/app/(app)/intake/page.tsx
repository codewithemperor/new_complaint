"use client";

import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { ComplaintForm } from "@/components/ComplaintForm";
import type { Ticket, PaginatedResponse } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  ACKNOWLEDGED: "bg-teal-100 text-teal-700",
  TRIAGED: "bg-purple-100 text-purple-700",
  ASSIGNED: "bg-violet-100 text-violet-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-700",
  RESOLVED: "bg-teal-100 text-teal-700",
  CLOSED: "bg-neutral-100 text-neutral-600",
  REOPENED: "bg-orange-100 text-orange-700",
};

/**
 * Intake officer — complaints list. Shows all submitted complaints in a table;
 * a "New Complaint" button opens the ComplaintForm in a modal.
 */
export default function IntakeListPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<PaginatedResponse<Ticket>>(
        "/tickets?page=1&pageSize=50",
      );
      setTickets(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load complaints.");
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
          <h1 className="text-xl font-semibold text-neutral-800">Complaints</h1>
          <p className="text-sm text-neutral-500">
            {total} complaint{total !== 1 ? "s" : ""} submitted
          </p>
        </div>
        <button className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700" onClick={() => setShowModal(true)}>
          + New Complaint
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-neutral-400">
                      No complaints yet. Click &quot;New Complaint&quot; to log one.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="px-4 py-3 font-mono text-xs text-teal-700">
                        {t.ticketCode}
                      </td>
                      <td className="max-w-[240px] truncate px-4 py-3 font-medium text-neutral-800">
                        {t.subject}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {t.category ? t.category.replace(/_/g, " ") : "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {t.channel ? t.channel.replace(/_/g, " ") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            STATUS_COLORS[t.status] ?? "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          {t.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Complaint modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-0 shadow-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">Log a New Complaint</h2>
                <button onClick={() => setShowModal(false)} className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100">
                  <X size={18} />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto">
                <ComplaintForm
                  bare
                  showChannel
                  title=""
                  description=""
                  onSubmitted={() => {
                    setShowModal(false);
                    fetchTickets();
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
