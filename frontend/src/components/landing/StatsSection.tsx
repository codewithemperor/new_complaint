"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Building2, Globe, Clock, CircleCheckBig, Activity, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";

/* ── Animated counter hook ─────────────────────────────────────── */
function useCountUp(target: number, duration: number = 1200) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [hasStarted, target, duration]);

  return { count, ref };
}

/* ── Sparkline mini component ─────────────────────────────────── */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-60 group-hover:opacity-100 transition-opacity">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Area fill */}
      <polyline
        points={`0,${h} ${points} ${w},${h}`}
        fill={color}
        opacity="0.08"
      />
    </svg>
  );
}

/* ── Animated progress bar ─────────────────────────────────────── */
function ProgressBar({ value, color, delay }: { value: number; color: string; delay: number }) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setWidth(value), delay);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, delay]);

  return (
    <div ref={ref} className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${width}%`, backgroundColor: color }}
      />
    </div>
  );
}

/* ── Animated divider line ─────────────────────────────────────── */
function AnimatedDivider() {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setWidth(100), 300);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="hidden md:block w-full flex items-center justify-center">
      <div
        className="h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent transition-all duration-1000 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export default function StatsSection() {
  const stat11 = useCountUp(11);
  const stat16 = useCountUp(16);
  const stat100 = useCountUp(100);

  const stats = [
    {
      value: `${stat11.count}+`,
      label: "Departments Integrated",
      icon: <Building2 size={24} className="text-teal-600" />,
      ref: stat11.ref,
      sparkline: [4, 6, 5, 7, 8, 9, 11],
      sparkColor: "#0d9488",
      progress: 78,
      progressColor: "#0d9488",
      progressDelay: 200,
      progressLabel: "of 14 target depts",
      trend: "up" as const,
      trendValue: "+3",
    },
    {
      value: `${stat16.count}`,
      label: "LGAs Covered",
      icon: <Globe size={24} className="text-teal-600" />,
      ref: stat16.ref,
      sparkline: [10, 12, 11, 13, 14, 15, 16],
      sparkColor: "#0d9488",
      progress: 100,
      progressColor: "#0d9488",
      progressDelay: 400,
      progressLabel: "full coverage",
      trend: "up" as const,
      trendValue: "+2",
    },
    {
      value: "24/7",
      label: "Submission Availability",
      icon: <Clock size={24} className="text-teal-600" />,
      ref: null,
      sparkline: [95, 98, 99, 97, 100, 99, 100],
      sparkColor: "#f59e0b",
      progress: 99,
      progressColor: "#f59e0b",
      progressDelay: 600,
      progressLabel: "uptime this month",
      trend: "up" as const,
      trendValue: "+1%",
    },
    {
      value: `${stat100.count}%`,
      label: "Issues Tracked",
      icon: <CircleCheckBig size={24} className="text-teal-600" />,
      ref: stat100.ref,
      sparkline: [82, 88, 91, 94, 96, 98, 100],
      sparkColor: "#10b981",
      progress: 100,
      progressColor: "#10b981",
      progressDelay: 800,
      progressLabel: "end-to-end visibility",
      trend: "up" as const,
      trendValue: "+6%",
    },
  ];

  return (
    <section className="relative border-b border-neutral-100 bg-white py-14">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, rgba(0,0,0,0.3) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Pulsing live indicator */}
      <div className="absolute top-4 right-6 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-[11px] font-medium text-neutral-400">System online</span>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 md:grid-cols-4 lg:px-8">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <div
              ref={s.ref as React.RefObject<HTMLDivElement>}
              className="group rounded-2xl p-5 text-center transition-all duration-300 hover:bg-neutral-50 hover:scale-[1.03] hover:shadow-lg hover:shadow-emerald-500/5 md:border-r md:border-neutral-100 md:last:border-r-0 md:rounded-none md:p-0 md:hover:bg-transparent md:hover:scale-100 md:hover:shadow-none"
            >
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 opacity-70 transition-all group-hover:opacity-100 group-hover:shadow-sm group-hover:shadow-teal-200/50">
                {s.icon}
              </div>
              <div className="flex items-center justify-center gap-2">
                <p className="text-4xl font-bold tracking-tight text-neutral-900">
                  {s.value}
                </p>
                {/* Trend indicator */}
                <span className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  s.trend === "up"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-red-50 text-red-600"
                }`}>
                  {s.trend === "up" ? (
                    <TrendingUp size={10} />
                  ) : (
                    <TrendingDown size={10} />
                  )}
                  {s.trendValue}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-neutral-500">
                {s.label}
              </p>

              {/* Sparkline */}
              <div className="mt-3 flex justify-center">
                <Sparkline values={s.sparkline} color={s.sparkColor} />
              </div>

              {/* Progress bar */}
              <div className="mt-3 px-2">
                <ProgressBar value={s.progress} color={s.progressColor} delay={s.progressDelay} />
                <p className="mt-1 text-[10px] font-medium text-neutral-400">{s.progressLabel}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Animated divider between stats */}
      <div className="mx-auto mt-8 max-w-7xl px-6 lg:px-8">
        <AnimatedDivider />
      </div>

      {/* Bottom status bar + View Full Report */}
      <div className="mx-auto mt-6 flex max-w-7xl items-center justify-center gap-6 px-6 lg:px-8">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Activity size={14} className="text-emerald-500" />
          <span>Last updated: just now</span>
        </div>
        <span className="text-neutral-200">|</span>
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>All systems operational</span>
        </div>
        <span className="text-neutral-200">|</span>
        <a
          href="#"
          className="flex items-center gap-1 text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-700"
        >
          View Full Report
          <ExternalLink size={12} />
        </a>
      </div>
    </section>
  );
}
