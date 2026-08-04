"use client";

import { useEffect, useState, useCallback } from "react";
import { api, ApiError } from "@/lib/api";
import type { Ticket, PaginatedResponse, Department } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants";

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600";

const selectClass =
  "w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600";

/**
 * Admin/Auditor: archived tickets (read-only). Supports filtering by
 * department and category. No action buttons — archived tickets are frozen.
 */
export default function ArchivePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptFilter, setDeptFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: "1", pageSize: "50" });
      if (deptFilter) params.set("departmentId", deptFilter);
      if (catFilter) params.set("category", catFilter);
      const data = await api.get<PaginatedResponse<Ticket>>(
        `/tickets/admin/archive?${params}`,
      );
      setTickets(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load.");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [deptFilter, catFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    api
      .get<Department[]>("/departments")
      .then(setDepartments)
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Archive</h1>
        <p className="text-sm text-muted-foreground">
          {total} archived ticket{total !== 1 ? "s" : ""} (read-only)
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Department
          </label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">— All —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Category
          </label>
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">— All —</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <button
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={fetchTickets}
          disabled={loading}
        >
          {loading ? "Loading…" : "Apply"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {tickets.length === 0 && !loading ? (
        <div className="rounded-xl border border-border bg-muted shadow-sm">
          <div className="p-6">
            <p className="py-8 text-center text-muted-foreground">
              No archived tickets.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-muted shadow-sm">
          <div className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted text-left text-xs uppercase text-muted-foreground">
                    <th className="px-4 py-3">Ticket</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Closed</th>
                    <th className="px-4 py-3">Archived</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t: any) => (
                    <tr key={t.id} className="border-b border-border">
                      <td className="px-4 py-3 font-mono text-xs text-green-700">
                        {t.ticketCode}
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 font-medium text-foreground">
                        {t.subject}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t.department?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t.closedAt
                          ? new Date(t.closedAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t.archivedAt
                          ? new Date(t.archivedAt).toLocaleDateString()
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
