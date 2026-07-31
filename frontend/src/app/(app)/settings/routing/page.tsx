"use client";

import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { CATEGORIES, PRIORITIES } from "@/lib/constants";
import type { RoutingRule, Department } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600";

const selectClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600";

export default function RoutingSettingsPage() {
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [editing, setEditing] = useState<RoutingRule | null>(null);
  const [creating, setCreating] = useState(false);
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [priorityRank, setPriorityRank] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<RoutingRule[]>("/routing-rules");
      setRules(data);
    } catch {
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
    api.get<Department[]>("/departments").then(setDepartments).catch(() => {});
  }, [fetchRules]);

  function openCreateModal() {
    setEditing(null);
    setCreating(true);
    setCategory("");
    setPriority("");
    setDepartmentId("");
    setPriorityRank("0");
    setIsActive(true);
    setError(null);
  }

  function openEditModal(rule: RoutingRule) {
    setCreating(false);
    setEditing(rule);
    setCategory(rule.category);
    setPriority(rule.priority ?? "");
    setDepartmentId(rule.departmentId);
    setPriorityRank(String(rule.priorityRank));
    setIsActive(rule.isActive);
    setError(null);
  }

  function closeModal() {
    setEditing(null);
    setCreating(false);
    setError(null);
  }

  async function handleSave() {
    if (!category || !departmentId) return;
    setSubmitting(true);
    setError(null);

    const body = {
      category,
      priority: priority || null,
      departmentId,
      priorityRank: parseInt(priorityRank, 10) || 0,
      isActive,
    };

    try {
      if (editing) {
        await api.patch(`/routing-rules/${editing.id}`, body);
      } else {
        await api.post("/routing-rules", body);
      }
      closeModal();
      fetchRules();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/routing-rules/${id}`);
      setDeleteConfirm(null);
      fetchRules();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Delete failed.");
    }
  }

  const showModal = creating || editing !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800">Routing Rules</h1>
          <p className="text-sm text-neutral-500">
            Configure how tickets are automatically routed to departments
          </p>
        </div>
        <button className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700" onClick={openCreateModal}>
          Add Rule
        </button>
      </div>

      {rules.length === 0 && !loading ? (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="p-6">
            <p className="py-8 text-center text-neutral-500">
              No routing rules configured. Add one to enable auto-routing.
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
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Active</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-neutral-100 hover:bg-neutral-50"
                    >
                      <td className="px-4 py-3 font-medium text-neutral-800">
                        {r.category.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {r.priority ?? "Any"}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {r.department?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{r.priorityRank}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            r.isActive
                              ? "bg-teal-100 text-teal-700"
                              : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {r.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="flex gap-2 px-4 py-3">
                        <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100" onClick={() => openEditModal(r)}>
                          Edit
                        </button>
                        {deleteConfirm === r.id ? (
                          <div className="flex gap-1">
                            <button
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"
                              onClick={() => handleDelete(r.id)}
                            >
                              Confirm
                            </button>
                            <button
                              className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
                              onClick={() => setDeleteConfirm(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
                            onClick={() => setDeleteConfirm(r.id)}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-0 shadow-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">{editing ? "Edit Routing Rule" : "New Routing Rule"}</h2>
                <button onClick={closeModal} className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100">
                  <X size={18} />
                </button>
              </div>
              <div className="max-h-[70vh] space-y-4 overflow-y-auto">
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
                  <label className="mb-1 block text-sm font-medium text-neutral-700">
                    Priority filter <span className="text-neutral-400">(blank = any)</span>
                  </label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectClass}>
                    <option value="">— Any —</option>
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700">Department *</label>
                  <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className={selectClass}>
                    <option value="">Select department…</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-700">
                    Priority Rank <span className="text-neutral-400">(higher = first)</span>
                  </label>
                  <input type="number" min="0" value={priorityRank} onChange={(e) => setPriorityRank(e.target.value)} className={inputClass} />
                </div>
                <label className="flex items-center gap-2 text-sm text-neutral-700">
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-neutral-300 text-teal-600 focus:ring-teal-500" />
                  Active
                </label>
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button className="rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed" onClick={closeModal} disabled={submitting}>Cancel</button>
                <button className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed" onClick={handleSave} disabled={submitting || !category || !departmentId}>
                  {submitting ? "Saving…" : editing ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
