"use client";

import { useEffect, useState, useCallback } from "react";

import { Label } from "react-aria-components";
import { api, ApiError } from "@/lib/api";

const inputClass =
  "w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600";

interface SlaConfigRow {
  priority: string;
  firstResponseHours: number;
  resolutionHours: number;
  warningThreshold: number;
  escalationChain: string[];
}

const ROLES = ["DIRECTOR", "PERMANENT_SECRETARY", "COMMISSIONER"];

/**
 * Super Admin: SLA matrix configuration. One row per priority; editing updates
 * the SlaConfig table and invalidates the server-side policy cache. Open
 * tickets keep their snapshot, so edits only affect future tickets.
 */
export default function SlaConfigPage() {
  const [rows, setRows] = useState<SlaConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<SlaConfigRow[]>("/sla/config");
      setRows(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load config.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  function updateRow(priority: string, field: keyof SlaConfigRow, value: unknown) {
    setRows((prev) =>
      prev.map((r) => (r.priority === priority ? { ...r, [field]: value } : r)),
    );
  }

  function toggleChainRole(priority: string, role: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.priority !== priority) return r;
        const has = r.escalationChain.includes(role);
        return {
          ...r,
          escalationChain: has
            ? r.escalationChain.filter((x) => x !== role)
            : [...r.escalationChain, role],
        };
      }),
    );
  }

  async function saveRow(row: SlaConfigRow) {
    setSaving(row.priority);
    setSaveMsg(null);
    try {
      await api.patch(`/sla/config/${row.priority}`, {
        firstResponseHours: Number(row.firstResponseHours),
        resolutionHours: Number(row.resolutionHours),
        warningThreshold: Number(row.warningThreshold),
        escalationChain: row.escalationChain,
      });
      setSaveMsg(`Saved ${row.priority} config.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed.");
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <div className="py-12 text-center text-neutral-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-800">Response Deadline Configuration</h1>
        <p className="text-sm text-neutral-500">
          Set response deadlines per priority level. Changes apply to new complaints only.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {saveMsg && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">{saveMsg}</div>
      )}

      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.priority} className="rounded-xl border border-neutral-200 bg-white shadow-sm">
            <div className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-800">{row.priority}</h2>
              <button
                className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={() => saveRow(row)}
                disabled={saving === row.priority}
              >
                {saving === row.priority ? "Saving…" : "Save"}
              </button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <Label className="mb-1 block text-xs font-medium text-neutral-600">First response (hours)</Label>
                  <input
                    type="number"
                    value={row.firstResponseHours}
                    onChange={(e) => updateRow(row.priority, "firstResponseHours", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs font-medium text-neutral-600">Resolution (hours)</Label>
                  <input
                    type="number"
                    value={row.resolutionHours}
                    onChange={(e) => updateRow(row.priority, "resolutionHours", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs font-medium text-neutral-600">Warning threshold</Label>
                  <input
                    type="number"
                    step="0.05"
                    value={row.warningThreshold}
                    onChange={(e) => updateRow(row.priority, "warningThreshold", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <Label className="mb-2 block text-xs font-medium text-neutral-600">Escalation chain (order matters)</Label>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleChainRole(row.priority, role)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        row.escalationChain.includes(role)
                          ? "border-teal-600 bg-teal-50 text-teal-700"
                          : "border-neutral-300 text-neutral-500 hover:border-neutral-400"
                      }`}
                    >
                      {role.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-neutral-400">
                  Chain: {row.escalationChain.length ? row.escalationChain.join(" → ") : "—"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
