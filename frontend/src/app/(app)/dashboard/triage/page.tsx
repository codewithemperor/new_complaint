"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowRight, FileText, Paperclip, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import { CATEGORIES, PRIORITIES, SENSITIVITIES } from "@/lib/constants";
import type { Ticket, PaginatedResponse, Department, TicketAttachment } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600";

const selectClass =
  "w-full rounded-lg border border-border bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600";
function attachmentHref(attachment: TicketAttachment) {
  const url = attachment.url ?? (attachment.storedPath ? `/uploads/${attachment.storedPath}` : "");
  if (!url) return "";
  return url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
}

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
    attachments: TicketAttachment[];
  } | null>(null);
  const [triagePhase, setTriagePhase] = useState<"submission" | "classify">(
    "submission",
  );
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
    api
      .get<Department[]>("/departments")
      .then(setDepartments)
      .catch(() => {});
  }, [fetchTickets]);

  function openTriageModal(ticket: Ticket) {
    setTriaging(ticket);
    setTriageDetail(null);
    setTriagePhase("submission");
    setCategory(ticket.category ?? "");
    setPriority("");
    setDepartmentId("");
    setSensitivity("NORMAL");
    setTriageNote("");
    setError(null);
    // Fetch full ticket detail for citizen info
    api
      .get<any>(`/tickets/${ticket.id}/detail`)
      .then((data) => {
        setTriageDetail({
          citizen: data.citizen ?? { name: null, email: "", phone: null },
          description: data.description ?? "",
          lga: data.lga ?? null,
          attachments: data.attachments ?? [],
        });
      })
      .catch(() => {});
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
      setError(
        err instanceof ApiError ? err.message : "Classification failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Classify & Review
          </h1>
          <p className="text-sm text-muted-foreground">
            {total} complaint{total !== 1 ? "s" : ""} awaiting classification
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

      {tickets.length === 0 && !loading ? (
        <div className="rounded-xl border border-border bg-neutral-50 shadow-sm">
          <div className="p-6">
            <p className="py-8 text-center text-muted-foreground">
              No complaints awaiting classification. All caught up!
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
                      className="border-b border-border hover:bg-neutral-50"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-green-700">
                        {t.ticketCode}
                      </td>
                      <td className="max-w-[240px] truncate px-4 py-3 font-medium text-foreground">
                        {t.subject}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t.category ? t.category.replace(/_/g, " ") : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t.channel.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700"
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
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-neutral-50 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-neutral-50 disabled:opacity-60 disabled:cursor-not-allowed"
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
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setTriaging(null)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-neutral-50 p-0 shadow-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Classify & Review
                  </h2>
                  <div className="mt-2 flex gap-1 rounded-lg bg-neutral-100 p-1 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setTriagePhase("submission")}
                      className={`rounded-md px-3 py-1.5 ${
                        triagePhase === "submission"
                          ? "bg-white text-green-700 shadow-sm"
                          : "text-muted-foreground"
                      }`}
                    >
                      Submission
                    </button>
                    <button
                      type="button"
                      onClick={() => setTriagePhase("classify")}
                      className={`rounded-md px-3 py-1.5 ${
                        triagePhase === "classify"
                          ? "bg-white text-green-700 shadow-sm"
                          : "text-muted-foreground"
                      }`}
                    >
                      Classify & route
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setTriaging(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-neutral-50"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="max-h-[70vh] space-y-4 overflow-y-auto">
                {triagePhase === "submission" && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-border bg-neutral-50 p-4 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-green-700">
                          {triaging.ticketCode}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {triaging.subject}
                        </span>
                      </div>
                      {triageDetail ? (
                        <>
                          <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                            <span>
                              Citizen:{" "}
                              <strong className="text-foreground">
                                {triageDetail.citizen.name || "Anonymous"}
                              </strong>
                            </span>
                            <span>Email: {triageDetail.citizen.email || "—"}</span>
                            <span>Phone: {triageDetail.citizen.phone || "—"}</span>
                            <span>LGA: {triageDetail.lga || "—"}</span>
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                              Description
                            </p>
                            <p className="whitespace-pre-wrap text-sm text-foreground">
                              {triageDetail.description}
                            </p>
                          </div>
                          <div>
                            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
                              <Paperclip className="h-3 w-3" />
                              Attachments ({triageDetail.attachments.length})
                            </p>
                            {triageDetail.attachments.length > 0 ? (
                              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {triageDetail.attachments.map((att) => {
                                  const href = attachmentHref(att);
                                  const isImg = att.mimetype?.startsWith("image/");
                                  return (
                                    <li key={att.id}>
                                      <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 rounded-lg border border-border bg-white p-2 transition-colors hover:border-green-300 hover:bg-green-50"
                                      >
                                        {isImg && href ? (
                                          <img
                                            src={href}
                                            alt={att.filename}
                                            className="h-12 w-12 shrink-0 rounded-md bg-neutral-100 object-contain"
                                          />
                                        ) : (
                                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-neutral-100">
                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                          </span>
                                        )}
                                        <span className="min-w-0">
                                          <span className="block truncate text-sm font-medium text-foreground">
                                            {att.filename}
                                          </span>
                                          <span className="block text-xs text-muted-foreground">
                                            {att.mimetype}
                                          </span>
                                        </span>
                                      </a>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                                No attachments submitted.
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Loading details…
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setTriagePhase("classify")}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                    >
                      Continue to classification
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {triagePhase === "classify" && (
                  <>
                    <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select category…</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Priority *
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Select priority…</option>
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Department{" "}
                    <span className="text-muted-foreground">
                      (optional — auto-routes if blank)
                    </span>
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">— Auto-route —</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Sensitivity
                  </label>
                  <select
                    value={sensitivity}
                    onChange={(e) => setSensitivity(e.target.value)}
                    className={selectClass}
                  >
                    {SENSITIVITIES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Classification Note
                  </label>
                  <textarea
                    value={triageNote}
                    onChange={(e) => setTriageNote(e.target.value)}
                    rows={3}
                    className={`${inputClass} resize-y`}
                    placeholder="Optional note about classification decision…"
                  />
                </div>
                  </>
                )}
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-neutral-50 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => setTriaging(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleTriage}
                  disabled={
                    submitting ||
                    triagePhase !== "classify" ||
                    !category ||
                    !priority
                  }
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
