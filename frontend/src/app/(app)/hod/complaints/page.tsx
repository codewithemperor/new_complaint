"use client";

import { useEffect, useState, useCallback } from "react";

import Link from "next/link";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { Ticket, PaginatedResponse } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "ACKNOWLEDGED", label: "Received" },
  { value: "TRIAGED", label: "Being Routed" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_PROGRESS", label: "Under Investigation" },
  { value: "PENDING_APPROVAL", label: "Pending Approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
  { value: "REOPENED", label: "Reopened" },
  { value: "ESCALATED", label: "Escalated" },
  { value: "REFERRED", label: "Referred" },
];

const STATUS_COLORS: Record<string, string> = {
  ACKNOWLEDGED: "bg-teal-100 text-teal-700",
  TRIAGED: "bg-purple-100 text-purple-700",
  ASSIGNED: "bg-violet-100 text-violet-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-teal-100 text-teal-700",
  RESOLVED: "bg-teal-100 text-teal-700",
  CLOSED: "bg-neutral-100 text-neutral-600",
  REOPENED: "bg-orange-100 text-orange-700",
  ESCALATED: "bg-red-100 text-red-700",
  REFERRED: "bg-violet-100 text-violet-700",
};

const selectClass =
  "rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white";

export default function DeptComplaintsPage() {
  const { user } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter
  const [statusFilter, setStatusFilter] = useState("");

  const pageSize = 20;

  const fetchTickets = useCallback(async () => {
    if (!user?.departmentId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      params.set("departmentId", user.departmentId);
      if (statusFilter) params.set("status", statusFilter);

      const data = await api.get<PaginatedResponse<Ticket>>(
        `/tickets?${params.toString()}`,
      );
      setTickets(data.items);
      setTotal(data.total);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, user?.departmentId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const totalPages = Math.ceil(total / pageSize);

  if (!user?.departmentId) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="p-6">
          <p className="py-8 text-center text-neutral-500">
            You are not assigned to a department.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800">Department Complaints</h1>
          <p className="text-sm text-neutral-500">
            {total} complaint{total !== 1 ? "s" : ""} in your department
          </p>
        </div>
        <button className="rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed" onClick={fetchTickets} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={selectClass}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {tickets.length === 0 && !loading ? (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="p-6">
            <p className="py-8 text-center text-neutral-500">
              No complaints found matching your filter.
            </p>
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
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Officer</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-neutral-100 hover:bg-neutral-50"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-teal-700">
                        {t.ticketCode}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 font-medium text-neutral-800">
                        {t.subject}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            STATUS_COLORS[t.status] ?? "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          {STATUS_OPTIONS.find((o) => o.value === t.status)?.label ?? t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {t.assignedOfficer?.fullName ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {t.category ? t.category.replace(/_/g, " ") : "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/ticket/${t.id}`}
                          className="text-teal-700 hover:underline text-xs font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="text-sm text-neutral-500">
            Page {page} of {totalPages}
          </span>
          <button
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
