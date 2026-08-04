"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Bell,
  BellRing,
  X,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";

/**
 * ReminderManager — UI for scheduling follow-up reminders on a ticket.
 *
 * Uses the browser's Notification API + service worker (Phase 8.2) to
 * schedule local notifications. Falls back to in-app display if
 * notifications aren't supported.
 *
 * This component renders a button that opens a small popover with the
 * scheduling form. Reminders are also persisted via the backend
 * /api/reminders endpoint so they survive across sessions.
 */

interface Reminder {
  id: string;
  ticketId: string;
  ticketCode?: string;
  title: string;
  note?: string | null;
  dueAt: string;
  isFired?: boolean;
}

interface ReminderManagerProps {
  ticketId: string;
  ticketCode?: string;
  ticketSubject?: string;
  /** Render as a compact button (default) or full card */
  variant?: "button" | "card";
}

const QUICK_PRESETS = [
  { label: "In 1 hour", minutes: 60 },
  { label: "In 4 hours", minutes: 240 },
  { label: "Tomorrow", minutes: 60 * 24 },
  { label: "In 3 days", minutes: 60 * 24 * 3 },
  { label: "In 1 week", minutes: 60 * 24 * 7 },
];

export function ReminderManager({
  ticketId,
  ticketCode,
  ticketSubject,
  variant = "button",
}: ReminderManagerProps) {
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied",
  );
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [scheduledFor, setScheduledFor] = useState<string>("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  /* ── Load existing reminders for this ticket ───────────────────── */
  const loadReminders = useCallback(async () => {
    try {
      const res = await api.get<Reminder[] | { items: Reminder[] }>(
        `/reminders/ticket/${ticketId}`,
      );
      const list = Array.isArray(res) ? res : (res.items ?? []);
      setReminders(list);
    } catch (err) {
      // Silently fail — non-critical
      setReminders([]);
    }
  }, [ticketId]);

  useEffect(() => {
    if (open) loadReminders();
  }, [open, loadReminders]);

  /* ── Auto-dismiss success/error after a few seconds ────────────── */
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 3500);
      return () => clearTimeout(t);
    }
  }, [success]);
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  /* ── Close popover when clicking outside ───────────────────────── */
  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  /* ── Request notification permission ───────────────────────────── */
  async function requestPermission() {
    if (typeof Notification === "undefined") {
      setError("Notifications are not supported by this browser.");
      return false;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== "granted") {
      setError(
        "Notifications were blocked. You can still create in-app reminders.",
      );
      return false;
    }
    return true;
  }

  /* ── Schedule reminder via SW + persist on backend ─────────────── */
  async function scheduleReminder() {
    setError(null);
    setSuccess(null);

    if (!title.trim()) {
      setError("Please enter a reminder title.");
      return;
    }
    if (!scheduledFor) {
      setError("Please pick a date and time.");
      return;
    }

    const due = new Date(scheduledFor);
    if (due.getTime() <= Date.now()) {
      setError("Pick a time in the future.");
      return;
    }

    setLoading(true);
    try {
      // Persist to backend
      const created = await api.post<Reminder>("/reminders", {
        ticketId,
        title: title.trim(),
        note: note.trim() || undefined,
        dueAt: due.toISOString(),
      });

      // Schedule via service worker (if permission granted)
      if (permission === "granted" && "serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        reg.active?.postMessage({
          type: "SCHEDULE_REMINDER",
          payload: {
            id: created.id,
            title: `🔔 ${title.trim()}`,
            body: note.trim() || `${ticketCode ?? "Ticket"} follow-up`,
            scheduledFor: due.toISOString(),
            ticketCode,
            url: ticketId ? `/dashboard/complaints/${ticketId}` : "/",
          },
        });
      } else if (
        permission !== "granted" &&
        typeof Notification !== "undefined"
      ) {
        // Try to request permission
        const granted = await requestPermission();
        if (granted && "serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.ready;
          reg.active?.postMessage({
            type: "SCHEDULE_REMINDER",
            payload: {
              id: created.id,
              title: `🔔 ${title.trim()}`,
              body: note.trim() || `${ticketCode ?? "Ticket"} follow-up`,
              scheduledFor: due.toISOString(),
              ticketCode,
              url: ticketId ? `/dashboard/complaints/${ticketId}` : "/",
            },
          });
        }
      }

      setSuccess(`Reminder scheduled for ${due.toLocaleString()}`);
      setTitle("");
      setNote("");
      setScheduledFor("");
      await loadReminders();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.message || `Failed to create reminder (${err.statusCode})`,
        );
      } else {
        setError("Could not create reminder. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  /* ── Quick preset click ────────────────────────────────────────── */
  function applyPreset(minutes: number) {
    const d = new Date(Date.now() + minutes * 60 * 1000);
    // Format to datetime-local: YYYY-MM-DDTHH:MM
    const pad = (n: number) => String(n).padStart(2, "0");
    const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setScheduledFor(formatted);
  }

  /* ── Cancel a reminder ─────────────────────────────────────────── */
  async function cancelReminder(id: string) {
    try {
      await api.delete(`/reminders/${id}`);
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        reg.active?.postMessage({
          type: "CANCEL_REMINDER",
          payload: { id },
        });
      }
      await loadReminders();
      setSuccess("Reminder cancelled.");
    } catch (err) {
      setError("Failed to cancel reminder.");
    }
  }

  /* ── Default reminder title ────────────────────────────────────── */
  useEffect(() => {
    if (!title && ticketCode) {
      setTitle(`Follow up: ${ticketSubject ?? ticketCode}`);
    }
  }, [ticketCode, ticketSubject, title]);

  /* ────────────────────────────────────────────────────────────── */
  /*  Render                                                       */
  /* ────────────────────────────────────────────────────────────── */

  if (variant === "card") {
    return (
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <BellRing size={16} className="text-green-600" />
            Scheduled Reminders
          </h3>
          {permission !== "granted" && (
            <button
              onClick={requestPermission}
              className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-[10px] font-medium text-green-700 hover:bg-green-100"
            >
              <Bell size={10} />
              Enable notifications
            </button>
          )}
        </div>

        <ReminderForm
          title={title}
          note={note}
          scheduledFor={scheduledFor}
          setTitle={setTitle}
          setNote={setNote}
          setScheduledFor={setScheduledFor}
          applyPreset={applyPreset}
          onSubmit={scheduleReminder}
          loading={loading}
        />

        <ReminderList reminders={reminders} onCancel={cancelReminder} compact />

        <BannerMessage error={error} success={success} />
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm transition-all hover:border-green-300 hover:bg-green-50 hover:text-green-700"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <BellRing
          size={12}
          className={reminders.length > 0 ? "text-green-600" : ""}
        />
        Set Reminder
        {reminders.length > 0 && (
          <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-green-600 px-1 text-[9px] font-bold text-white">
            {reminders.length}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-full z-30 mt-2 w-[340px] rounded-xl border border-neutral-200 bg-neutral-50 p-4 shadow-xl"
          role="dialog"
          aria-label="Schedule a reminder"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900">
              Schedule a reminder
            </h3>
            <button
              onClick={() => setOpen(false)}
              className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>

          {permission !== "granted" && typeof Notification !== "undefined" && (
            <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Notifications not enabled</p>
                <button
                  onClick={requestPermission}
                  className="mt-1 text-amber-900 underline hover:no-underline"
                >
                  Enable browser notifications
                </button>
              </div>
            </div>
          )}

          <ReminderForm
            title={title}
            note={note}
            scheduledFor={scheduledFor}
            setTitle={setTitle}
            setNote={setNote}
            setScheduledFor={setScheduledFor}
            applyPreset={applyPreset}
            onSubmit={scheduleReminder}
            loading={loading}
          />

          <ReminderList reminders={reminders} onCancel={cancelReminder} />

          <BannerMessage error={error} success={success} />
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/*  Subcomponents                                                 */
/* ────────────────────────────────────────────────────────────── */

function ReminderForm({
  title,
  note,
  scheduledFor,
  setTitle,
  setNote,
  setScheduledFor,
  applyPreset,
  onSubmit,
  loading,
}: {
  title: string;
  note: string;
  scheduledFor: string;
  setTitle: (v: string) => void;
  setNote: (v: string) => void;
  setScheduledFor: (v: string) => void;
  applyPreset: (m: number) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Reminder title (e.g. Call back citizen)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
      />
      <textarea
        placeholder="Optional note…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        className="w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
      />

      {/* Quick presets */}
      <div className="flex flex-wrap gap-1">
        {QUICK_PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p.minutes)}
            className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-1 text-[10px] font-medium text-neutral-600 transition-colors hover:border-green-300 hover:bg-green-50 hover:text-green-700"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Calendar
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
        />
        <input
          type="datetime-local"
          value={scheduledFor}
          onChange={(e) => setScheduledFor(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={loading || !title.trim() || !scheduledFor}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <Clock size={14} className="animate-spin" />
            Scheduling…
          </>
        ) : (
          <>
            <BellRing size={14} />
            Schedule reminder
          </>
        )}
      </button>
    </div>
  );
}

function ReminderList({
  reminders,
  onCancel,
  compact = false,
}: {
  reminders: Reminder[];
  onCancel: (id: string) => void;
  compact?: boolean;
}) {
  if (reminders.length === 0) {
    return (
      <div
        className={`mt-3 text-center text-xs text-neutral-400 ${compact ? "" : "border-t border-neutral-100 pt-3"}`}
      >
        No active reminders.
      </div>
    );
  }

  return (
    <ul
      className={`mt-3 space-y-1.5 ${compact ? "" : "border-t border-neutral-100 pt-3"}`}
    >
      {reminders
        .slice()
        .sort(
          (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
        )
        .map((r) => {
          const due = new Date(r.dueAt);
          const isPast = due.getTime() < Date.now();
          return (
            <li
              key={r.id}
              className="flex items-start gap-2 rounded-lg border border-neutral-100 bg-neutral-50 p-2"
            >
              <Clock
                size={12}
                className={`mt-0.5 flex-shrink-0 ${
                  isPast ? "text-red-500" : "text-green-600"
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-neutral-800">
                  {r.title}
                </p>
                <p className="text-[10px] text-neutral-500">
                  {isPast ? "Overdue · " : ""}
                  {due.toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <button
                onClick={() => onCancel(r.id)}
                className="rounded p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
                aria-label="Cancel reminder"
              >
                <X size={10} />
              </button>
            </li>
          );
        })}
    </ul>
  );
}

function BannerMessage({
  error,
  success,
}: {
  error: string | null;
  success: string | null;
}) {
  if (error) {
    return (
      <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">
        <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
        <p className="flex-1">{error}</p>
      </div>
    );
  }
  if (success) {
    return (
      <div className="mt-3 flex items-start gap-2 rounded-lg bg-green-50 p-2 text-xs text-green-700">
        <CheckCircle2 size={12} className="mt-0.5 flex-shrink-0" />
        <p className="flex-1">{success}</p>
      </div>
    );
  }
  return null;
}
