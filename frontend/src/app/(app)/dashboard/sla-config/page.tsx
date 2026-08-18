"use client";

import { useEffect, useState, useCallback } from "react";
import { Modal, Button as HeroButton } from "@heroui/react";
import { Pencil } from "lucide-react";
import { api, ApiError } from "@/lib/api";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30";

interface SlaConfigRow {
  priority: string;
  firstResponseHours: number;
  resolutionHours: number;
  warningThreshold: number;
  escalationChain: string[];
}

const PRIORITY_LABELS: Record<string, string> = {
  P1: "P1 — Critical",
  P2: "P2 — High",
  P3: "P3 — Medium",
  P4: "P4 — Low",
};

const PRIORITY_BADGE: Record<string, string> = {
  P1: "bg-red-100 text-red-700",
  P2: "bg-amber-100 text-amber-700",
  P3: "bg-teal-100 text-teal-700",
  P4: "bg-neutral-200 text-foreground",
};

const ROLE_LABELS: Record<string, string> = {
  DEPARTMENT_HOD: "HOD",
  PERMANENT_SECRETARY: "Perm. Sec.",
  COMMISSIONER: "Commissioner",
};

const ALL_ROLES = ["DEPARTMENT_HOD", "PERMANENT_SECRETARY", "COMMISSIONER"];

/**
 * SLA / deadline configuration. One row per priority in a table; clicking
 * "Edit" opens a HeroUI modal to adjust first-response, resolution, warning
 * threshold and the escalation chain. Edits only affect future tickets.
 */
export default function SlaConfigPage() {
  const [rows, setRows] = useState<SlaConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Edit-modal state.
  const [editing, setEditing] = useState<SlaConfigRow | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<SlaConfigRow[]>("/sla/config");
      // Normalise: ensure escalationChain is always an array (backend now
      // returns it parsed, but guard against a stale string).
      setRows(
        data.map((r) => ({
          ...r,
          escalationChain: Array.isArray(r.escalationChain)
            ? r.escalationChain
            : typeof r.escalationChain === "string"
              ? (() => {
                  try {
                    return JSON.parse(r.escalationChain as unknown as string);
                  } catch {
                    return [];
                  }
                })()
              : [],
        })),
      );
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load config.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  function openEdit(row: SlaConfigRow) {
    setEditing({ ...row, escalationChain: [...row.escalationChain] });
    setSaveMsg(null);
    setError(null);
  }

  function updateField(field: keyof SlaConfigRow, value: unknown) {
    setEditing((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  function toggleChainRole(role: string) {
    setEditing((prev) => {
      if (!prev) return prev;
      const has = prev.escalationChain.includes(role);
      return {
        ...prev,
        escalationChain: has
          ? prev.escalationChain.filter((x) => x !== role)
          : [...prev.escalationChain, role],
      };
    });
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      await api.patch(`/sla/config/${editing.priority}`, {
        firstResponseHours: Number(editing.firstResponseHours),
        resolutionHours: Number(editing.resolutionHours),
        warningThreshold: Number(editing.warningThreshold),
        escalationChain: editing.escalationChain,
      });
      setSaveMsg(
        `${PRIORITY_LABELS[editing.priority] ?? editing.priority} saved.`,
      );
      setEditing(null);
      fetchConfig();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="py-12 text-center text-muted-foreground">Loading…</div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Response Deadline Configuration
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set response deadlines and escalation chains per priority level.
          Changes apply to new complaints only.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {saveMsg && (
        <div className="rounded-lg border border-success/30 bg-primary/5 px-4 py-3 text-sm text-success">
          {saveMsg}
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-neutral-50/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">First response</th>
                <th className="px-4 py-3">Resolution</th>
                <th className="px-4 py-3">Warning at</th>
                <th className="px-4 py-3">Escalation chain</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.priority}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        PRIORITY_BADGE[row.priority] ??
                        "bg-neutral-50 text-muted-foreground"
                      }`}
                    >
                      {PRIORITY_LABELS[row.priority] ?? row.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.firstResponseHours}h
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.resolutionHours}h
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {Math.round((row.warningThreshold ?? 0) * 100)}%
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.escalationChain.length
                      ? row.escalationChain
                          .map((r) => ROLE_LABELS[r] ?? r)
                          .join(" → ")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(row)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-neutral-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    No SLA configuration found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Edit modal (HeroUI) ── */}
      <Modal isOpen={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <Modal.Backdrop />
        <Modal.Container placement="center" size="md" scroll="inside">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header className="border-b border-border">
              <Modal.Heading className="text-base font-semibold text-foreground">
                Edit{" "}
                {editing
                  ? (PRIORITY_LABELS[editing.priority] ?? editing.priority)
                  : ""}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="gap-4 py-5">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    First response (hrs)
                  </label>
                  <input
                    type="number"
                    value={editing?.firstResponseHours ?? 0}
                    onChange={(e) =>
                      updateField("firstResponseHours", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Resolution (hrs)
                  </label>
                  <input
                    type="number"
                    value={editing?.resolutionHours ?? 0}
                    onChange={(e) =>
                      updateField("resolutionHours", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Warning threshold
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={editing?.warningThreshold ?? 0}
                    onChange={(e) =>
                      updateField("warningThreshold", e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-muted-foreground">
                  Escalation chain (order matters)
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_ROLES.map((role) => {
                    const active = editing?.escalationChain.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleChainRole(role)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:bg-neutral-50"
                        }`}
                      >
                        {ROLE_LABELS[role] ?? role}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Chain:{" "}
                  {editing?.escalationChain.length
                    ? editing.escalationChain
                        .map((r) => ROLE_LABELS[r] ?? r)
                        .join(" → ")
                    : "—"}
                </p>
              </div>
            </Modal.Body>
            <Modal.Footer className="border-t border-border">
              <HeroButton
                variant="ghost"
                onPress={() => setEditing(null)}
                isDisabled={saving}
              >
                Cancel
              </HeroButton>
              <HeroButton
                variant="primary"
                onPress={saveEdit}
                isDisabled={saving}
              >
                {saving ? "Saving…" : "Save changes"}
              </HeroButton>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal>
    </div>
  );
}
