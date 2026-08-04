"use client";

import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Department } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600";

/**
 * Super Admin — department management. Lists departments; create/edit/delete
 * with referential-integrity enforcement on the backend (delete blocked if
 * active users/tickets exist).
 */
export default function DepartmentsAdminPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  const fetchDepts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Department[]>("/departments");
      setDepartments(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load.");
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepts();
  }, [fetchDepts]);

  function openCreate() {
    setEditing(null);
    setName("");
    setCode("");
    setDescription("");
    setShowModal(true);
  }

  function openEdit(d: Department) {
    setEditing(d);
    setName(d.name);
    setCode(d.code);
    setDescription(d.description ?? "");
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!name || !code) return;
    setSubmitting(true);
    setError(null);
    try {
      const body = { name, code: code.toUpperCase(), description };
      if (editing) {
        await api.patch(`/departments/${editing.id}`, body);
      } else {
        await api.post("/departments", body);
      }
      setShowModal(false);
      fetchDepts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(d: Department) {
    if (
      !confirm(
        `Delete department "${d.name}"? This is blocked if it has active users or open tickets.`,
      )
    )
      return;
    try {
      await api.delete(`/departments/${d.id}`);
      fetchDepts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Departments</h1>
          <p className="text-sm text-muted-foreground">
            {departments.length} department(s)
          </p>
        </div>
        <button
          className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
          onClick={openCreate}
        >
          + Add Department
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-neutral-50 shadow-sm">
        <div className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-neutral-50 text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.length === 0 && !loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-muted-foreground"
                    >
                      No departments.
                    </td>
                  </tr>
                ) : (
                  departments.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-border hover:bg-neutral-50"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {d.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-green-700">
                        {d.code}
                      </td>
                      <td className="max-w-[300px] truncate px-4 py-3 text-muted-foreground">
                        {d.description ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-neutral-50"
                            onClick={() => openEdit(d)}
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-neutral-50"
                            onClick={() => handleDelete(d)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-neutral-50 p-0 shadow-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  {editing ? "Edit Department" : "Add Department"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-neutral-50"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Name *
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Code *{" "}
                    <span className="text-muted-foreground">
                      (unique, e.g. WORKS)
                    </span>
                  </label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className={inputClass}
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className={`${inputClass} resize-y`}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-neutral-50 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? "Saving…" : editing ? "Save" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
