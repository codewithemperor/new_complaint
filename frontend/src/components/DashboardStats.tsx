"use client";

import { useEffect, useState, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface Trend {
  direction: "up" | "down" | "flat";
  value: string;
}

export interface StatCardProps {
  label: string;
  value: number | string;
  /** Accent colour key — maps to a tailwind bg/border set. */
  accent: "teal" | "amber" | "emerald" | "red" | "orange" | "slate";
  /** Which SVG icon to render. */
  icon: "total" | "awaiting" | "open" | "resolved" | "breached" | "reopened";
  /** Optional trend indicator. */
  trend?: Trend;
  /** Optional sparkline data — array of numeric values for mini chart. */
  sparkline?: number[];
  /** Optional comparison text (e.g., "↑ 12% vs last week"). */
  comparison?: string;
  /** Optional click handler for "click to filter" behavior. */
  onClick?: () => void;
  /** Whether this card is currently active/selected. */
  isActive?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Accent colour map                                                  */
/* ------------------------------------------------------------------ */

const ACCENT_MAP: Record<
  StatCardProps["accent"],
  {
    stripe: string;
    bg: string;
    iconBg: string;
    iconText: string;
    trendUp: string;
    trendDown: string;
    sparkStroke: string;
    sparkFill: string;
    activeRing: string;
  }
> = {
  teal: {
    stripe: "bg-teal-500",
    bg: "bg-teal-50/60",
    iconBg: "bg-teal-100",
    iconText: "text-teal-600",
    trendUp: "text-teal-600",
    trendDown: "text-red-500",
    sparkStroke: "#0d9488",
    sparkFill: "rgba(13,148,136,0.1)",
    activeRing: "ring-teal-400",
  },
  amber: {
    stripe: "bg-amber-500",
    bg: "bg-amber-50/60",
    iconBg: "bg-amber-100",
    iconText: "text-amber-600",
    trendUp: "text-amber-600",
    trendDown: "text-red-500",
    sparkStroke: "#d97706",
    sparkFill: "rgba(217,119,6,0.1)",
    activeRing: "ring-amber-400",
  },
  emerald: {
    stripe: "bg-emerald-500",
    bg: "bg-emerald-50/60",
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-600",
    trendUp: "text-emerald-600",
    trendDown: "text-red-500",
    sparkStroke: "#059669",
    sparkFill: "rgba(5,150,105,0.1)",
    activeRing: "ring-emerald-400",
  },
  red: {
    stripe: "bg-red-500",
    bg: "bg-red-50/60",
    iconBg: "bg-red-100",
    iconText: "text-red-600",
    trendUp: "text-red-500",
    trendDown: "text-emerald-600",
    sparkStroke: "#dc2626",
    sparkFill: "rgba(220,38,38,0.1)",
    activeRing: "ring-red-400",
  },
  orange: {
    stripe: "bg-orange-500",
    bg: "bg-orange-50/60",
    iconBg: "bg-orange-100",
    iconText: "text-orange-600",
    trendUp: "text-orange-600",
    trendDown: "text-emerald-600",
    sparkStroke: "#ea580c",
    sparkFill: "rgba(234,88,12,0.1)",
    activeRing: "ring-orange-400",
  },
  slate: {
    stripe: "bg-slate-500",
    bg: "bg-slate-50/60",
    iconBg: "bg-slate-100",
    iconText: "text-slate-600",
    trendUp: "text-teal-600",
    trendDown: "text-red-500",
    sparkStroke: "#64748b",
    sparkFill: "rgba(100,116,139,0.1)",
    activeRing: "ring-slate-400",
  },
};

/* ------------------------------------------------------------------ */
/*  Inline SVG icons                                                   */
/* ------------------------------------------------------------------ */

function StatIcon({ variant, className }: { variant: StatCardProps["icon"]; className?: string }) {
  const cls = className ?? "h-5 w-5";

  switch (variant) {
    case "total":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "awaiting":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12" />
          <path d="M12 21v-2" />
          <path d="M5.5 6.5C7 4 9.5 3 12 3s5 1 6.5 3.5" />
          <path d="M18.5 6.5C20 9 20.5 11.5 19 14" />
          <path d="M5.5 6.5C4 9 3.5 11.5 5 14" />
          <circle cx="12" cy="17" r="2" />
        </svg>
      );
    case "open":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      );
    case "resolved":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <path d="M22 4L12 14.01l-3-3" />
        </svg>
      );
    case "breached":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case "reopened":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 4v6h6" />
          <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
        </svg>
      );
  }
}

/* ------------------------------------------------------------------ */
/*  Animated value counter                                             */
/* ------------------------------------------------------------------ */

function AnimatedValue({ value }: { value: number | string }) {
  const numeric = typeof value === "number" ? value : Number(value);
  const isNumeric = !isNaN(numeric);

  const [display, setDisplay] = useState<string>(() =>
    isNumeric ? "0" : String(value),
  );

  useEffect(() => {
    if (!isNumeric) return;

    // Quick count-up animation
    const duration = 600;
    const start = performance.now();
    const to = numeric;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(to * eased);
      setDisplay(current.toLocaleString());
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [value, isNumeric, numeric]);

  if (!isNumeric) return <>{String(value)}</>;

  return <>{display}</>;
}

/* ------------------------------------------------------------------ */
/*  Sparkline mini chart (pure SVG, no recharts dependency)            */
/* ------------------------------------------------------------------ */

function Sparkline({ data, strokeColor, fillColor }: { data: number[]; strokeColor: string; fillColor: string }) {
  if (data.length < 2) return null;

  const width = 80;
  const height = 28;
  const padding = 2;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  // Calculate points
  const points = data.map((val, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: padding + (height - padding * 2) - ((val - min) / range) * (height - padding * 2),
  }));

  // Create line path
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // Create area path (fill under the line)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <svg width={width} height={height} className="opacity-70">
      <path d={areaPath} fill={fillColor} />
      <path d={linePath} fill="none" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  StatCard                                                           */
/* ------------------------------------------------------------------ */

export function StatCard({ label, value, accent, icon, trend, sparkline, comparison, onClick, isActive }: StatCardProps) {
  const colors = ACCENT_MAP[accent];
  const isClickable = !!onClick;

  const handleClick = useCallback(() => {
    if (onClick) onClick();
  }, [onClick]);

  return (
    <div
      onClick={handleClick}
      className={`
        group relative overflow-hidden rounded-xl border shadow-sm transition-all duration-200
        ${isClickable ? "cursor-pointer" : ""}
        ${isActive
          ? `ring-2 ${colors.activeRing} border-transparent shadow-md -translate-y-0.5`
          : "border-neutral-200 bg-white hover:shadow-md hover:-translate-y-0.5"
        }
      `}
    >
      {/* Left accent stripe */}
      <div className={`absolute inset-y-0 left-0 w-1 ${colors.stripe}`} />

      {/* Subtle background wash */}
      <div className={`absolute inset-0 ${isActive ? colors.bg : "bg-white"}`} />

      <div className="relative p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 sm:text-sm">
            {label}
          </p>
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colors.iconBg} ${colors.iconText}`}>
            <StatIcon variant={icon} />
          </div>
        </div>

        <div className="mt-2 flex items-end justify-between gap-2">
          <p className="text-2xl font-bold tabular-nums text-neutral-900 sm:text-3xl">
            <AnimatedValue value={value} />
          </p>
          {sparkline && sparkline.length > 1 && (
            <Sparkline
              data={sparkline}
              strokeColor={colors.sparkStroke}
              fillColor={colors.sparkFill}
            />
          )}
        </div>

        {/* Trend indicator */}
        {trend && trend.direction !== "flat" && (
          <div className="mt-1.5 flex items-center gap-1">
            {trend.direction === "up" ? (
              <svg className={`h-3.5 w-3.5 ${colors.trendUp}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 15l-6-6-6 6" />
              </svg>
            ) : (
              <svg className={`h-3.5 w-3.5 ${colors.trendDown}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            )}
            <span className={`text-xs font-medium ${trend.direction === "up" ? colors.trendUp : colors.trendDown}`}>
              {trend.value}
            </span>
            <span className="text-xs text-neutral-400">vs last period</span>
          </div>
        )}
        {trend && trend.direction === "flat" && (
          <div className="mt-1.5 flex items-center gap-1">
            <svg className="h-3.5 w-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
            </svg>
            <span className="text-xs font-medium text-neutral-400">{trend.value}</span>
          </div>
        )}

        {/* Comparison to previous period */}
        {comparison && (
          <div className="mt-1 flex items-center gap-1">
            <span className="text-[10px] font-medium text-neutral-400">{comparison}</span>
          </div>
        )}

        {/* Click to filter hint */}
        {isClickable && (
          <div className="mt-2 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="text-[10px] font-medium text-teal-600">Click to filter</span>
          </div>
        )}
      </div>
    </div>
  );
}
