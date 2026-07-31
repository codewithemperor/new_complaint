"use client";

import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { CATEGORIES, PRIORITIES, SENSITIVITIES } from "@/lib/constants";
import type { Ticket, PaginatedResponse, Department } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600";

const selectClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600";

export default function TriagePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Triage modal state
  const [triaging, setTriaging] = useState<Ticket | null>(null);
  const [triageDetail, setTriageDetail] = useState<{
    citizen: { name: string | null; email: string; phone: string | null };
    description: string;
    lga: string | null;
  } | null>(null);
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [sensitivity, setSensitivity] = useState("NORMAL");
  const [triageNote, setTriageNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<PaginatedResponse<Ticket>>(
        `/tickets?status=ACKNOWLEDGED&page=${page}&pageSize=20`,
      );
      setTickets(data.items);
      setTotal(data.total);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchTickets();
    api.get<Department[]>("/departments").then(setDepartments).catch(() => {});
  }, [fetchTickets]);

  function openTriageModal(ticket: Ticket) {
    setTriaging(ticket);
    setTriageDetail(null);
    setCategory(ticket.category ?? "");
    setPriority("");
    setDepartmentId("");
    setSensitivity("NORMAL");
    setTriageNote("");
    setError(null);
    // Fetch full ticket detail for citizen info
    api.get<any>(`/tickets/${ticket.id}/detail`).then((data) => {
      setTriageDetail({
        citizen: data.citizen ?? { name: null, email: "", phone: null },
        description: data.description ?? "",
        lga: data.lga ?? null,
      });
    }).catch(() => {});
  }

  async function handleTriage() {
    if (!triaging || !category || !priority) return;
    setSubmitting(true);
    setError(null);

    try {
      await api.patch(`/tickets/${triaging.id}/triage`, {
        category,
        priority,
        ...(departmentId && { departmentId }),
        sensitivity,
        triageNote: triageNote || undefined,
      });
      setTriaging(null);
      fetchTickets();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Classification failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800">Classify & Review</h1>
          <p className="text-sm text-neutral-500">
            {total} complaint{total !== 1 ? "s" : ""} awaiting classification
          </p>
        </div>
        <button className="rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed" onClick={fetchTickets} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {tickets.length === 0 && !loading ? (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="p-6">
            <p className="py-8 text-center text-neutral-500">
              No complaints awaiting classification. All caught up!
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
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Channel</th>
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
                      <td className="max-w-[240px] truncate px-4 py-3 font-medium text-neutral-800">
                        {t.subject}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {t.category ? t.category.replace(/_/g, " ") : "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {t.channel.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-700"
                          onClick={() => openTriageModal(t)}
                        >
                          Classify
                        </button>
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

      {/* Triage Modal */}
      {triaging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setTriaging(null)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-0 shadow-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">Classify & Review</h2>
                <button onClick={() => setTriaging(null)} className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100">
                  <X size={18} />
                </button>
              </div>
              <div className="max-h-[70vh] space-y-4 overflow-y-auto">
                {/* Complaint info (read-only) */}
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-teal-700">{triaging.ticketCode}</span>
                    <span className="text-xs text-neutral-400">·</span>
                    <span className="text-sm font-medium text-neutral-800">{triaging.subject}</span>
                  </div>
                  {triageDetail && (
                    <>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                        <span>Citizen: <strong className="text-neutral-700">{triageDetail.citizen.name || "Anonymous"}</strong></span>
                        {triageDetail.citizen.phone && <span>Phone: {triageDetail.citizen.phone}</span>}
                        <span>Email: {triageDetail.citizen.email}</span>
                        {triageDetail.lga && <span>LGA: {triageDetail.lga}</span>}
                      </div>
                      <details className="text-sm">
                        <summary className="cursor-pointer text-xs font-medium text-neutral-500 hover:text-neutral-700">
                          Show full description
                        </summary>
                        <p className="mt-1 whitespace-pre-wrap text-neutral-700">{triageDetail.description}</p>
                      </details>
                    </>
                  )}
                  {!triageDetail && (
                    <p className="text-xs text-neutral-400">Loading details…</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700">Category *</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
                    <option value="">Select category…</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700">Priority *</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectClass}>
                    <option value="">Select priority…</option>
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700">
                    Department <span className="text-neutral-400">(optional — auto-routes if blank)</span>
                  </label>
                  <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className={selectClass}>
                    <option value="">— Auto-route —</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700">Sensitivity</label>
                  <select value={sensitivity} onChange={(e) => setSensitivity(e.target.value)} className={selectClass}>
                    {SENSITIVITIES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700">Classification Note</label>
                  <textarea
                    value={triageNote}
                    onChange={(e) => setTriageNote(e.target.value)}
                    rows={3}
                    className={`${inputClass} resize-y`}
                    placeholder="Optional note about classification decision…"
                  />
                </div>
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button className="rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed" onClick={() => setTriaging(null)} disabled={submitting}>Cancel</button>
                <button
                  className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleTriage}
                  disabled={submitting || !category || !priority}
                >
                  {submitting ? "Classifying…" : "Classify & Review"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
