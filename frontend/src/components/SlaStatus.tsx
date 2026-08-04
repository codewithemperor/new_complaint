"use client";

/**
 * SlaStatus — shared SLA chip + progress bar.
 *
 * Renders the ticket's SLA state per planning/05-sla-matrix.md §7:
 *   green  — within SLA (remaining > 20% of target)
 *   amber  — warning  (0 < remaining ≤ 20%)
 *   red    — breached (remaining ≤ 0, or slaBreached flag)
 *   grey   — paused   (awaiting != NONE)
 *
 * Compound HeroUI pattern: the chip and progress are composed here so every
 * queue row and detail header renders SLA identically.
 */

type SlaStatusProps = {
  awaiting?: string | null;
  slaStartedAt?: string | null;
  slaTargetHours?: number | null;
  /** Live remaining hours, as derived by the backend SlaClockService. */
  slaRemainingHours?: number | null;
  slaBreached?: boolean;
};

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

export function SlaStatus({
  awaiting,
  slaStartedAt,
  slaTargetHours,
  slaRemainingHours,
  slaBreached,
}: SlaStatusProps) {
  // No clock started yet.
  if (!slaStartedAt || !slaTargetHours) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-500">
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
        SLA idle
      </span>
    );
  }

  const isPaused = awaiting && awaiting !== "NONE";
  const remaining = slaRemainingHours ?? slaTargetHours;
  const elapsed = Math.max(0, slaTargetHours - remaining);
  const pctOfTarget = slaTargetHours > 0 ? elapsed / slaTargetHours : 0;
  const breached = slaBreached || remaining <= 0;

  // Paused dominates (grey) — a paused clock cannot breach.
  if (isPaused) {
    return (
      <div className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
          Paused
        </span>
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full bg-neutral-400"
            style={{ width: `${Math.min(100, pctOfTarget * 100)}%` }}
          />
        </div>
      </div>
    );
  }

  let color: "green" | "amber" | "red";
  let label: string;
  if (breached) {
    color = "red";
    label = "Breached";
  } else if (remaining <= slaTargetHours * 0.2) {
    color = "amber";
    label = `${formatHours(remaining)} left`;
  } else {
    color = "green";
    label = `${formatHours(remaining)} left`;
  }

  const styles = {
    green: {
      chip: "bg-green-100 text-green-700",
      dot: "bg-green-500",
      bar: "bg-green-500",
    },
    amber: {
      chip: "bg-amber-100 text-amber-700",
      dot: "bg-amber-500",
      bar: "bg-amber-500",
    },
    red: {
      chip: "bg-red-100 text-red-700",
      dot: "bg-red-500",
      bar: "bg-red-500",
    },
  }[color];

  return (
    <div className="flex flex-col gap-1">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles.chip}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
        {label}
      </span>
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-neutral-200">
        <div
          className={`h-full ${styles.bar}`}
          style={{ width: `${Math.min(100, pctOfTarget * 100)}%` }}
        />
      </div>
    </div>
  );
}
