"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Bell, Shield, Building2, GraduationCap, Stethoscope, Tractor, Wrench, Landmark, Play } from "lucide-react";

interface HeroSectionProps {
  onTrackOpen: () => void;
  onComplaintOpen: () => void;
}

const trustedDepts = [
  { name: "Works", icon: Wrench },
  { name: "Health", icon: Stethoscope },
  { name: "Education", icon: GraduationCap },
  { name: "Agriculture", icon: Tractor },
  { name: "Finance", icon: Landmark },
  { name: "Housing", icon: Building2 },
];

const liveStats = [
  { label: "10+ complaints resolved today", icon: "✓" },
  { label: "24/7 monitoring active", icon: "●" },
  { label: "4 departments connected", icon: "◆" },
];

/* ── Animated floating dots background ──────────────────────────── */
function FloatingDots() {
  const dots = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
    }))
  , []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          className="absolute rounded-full bg-emerald-400/20"
          style={{
            width: dot.size,
            height: dot.size,
            left: `${dot.x}%`,
            top: `${dot.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 10, -10, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: dot.duration,
            delay: dot.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default function HeroSection({ onTrackOpen, onComplaintOpen }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-[#04130C] pt-32 pb-24 text-white">
      {/* Background Effects */}
      <div
        className="absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Floating dots animation */}
      <FloatingDots />
      <div className="absolute -top-40 left-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-emerald-600/20 blur-[120px]" />
      <div className="absolute -bottom-40 right-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-amber-500/10 blur-[120px]" />

      {/* Floating notification badge */}
      <div className="absolute top-36 right-12 z-10 hidden animate-bounce lg:block" style={{ animationDuration: "3s" }}>
        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 shadow-2xl backdrop-blur-xl">
          <div className="relative">
            <Bell size={16} className="text-emerald-400" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
          </div>
          <span className="text-xs font-medium text-neutral-300">New: Real-time status updates</span>
        </div>
      </div>

      {/* Floating security badge */}
      <div className="absolute top-56 right-32 z-10 hidden lg:block" style={{ animation: "float 6s ease-in-out infinite" }}>
        <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 backdrop-blur-sm">
          <Shield size={14} className="text-emerald-400" />
          <span className="text-[11px] font-medium text-emerald-300">End-to-end encrypted</span>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2 lg:px-8">
        {/* Left: copy + track */}
        <div className="flex flex-col items-start">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Kwara State Ministry of Communications
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl"
          >
            Your voice, <br />
            <span className="text-emerald-400">heard and tracked.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-6 max-w-lg text-lg leading-relaxed text-neutral-400"
          >
            Submit a complaint in minutes and follow it through every stage —
            from classification to resolution. Transparent, accountable, secure.
          </motion.p>

          {/* Track existing complaint */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-10 w-full max-w-lg"
          >
            <label className="mb-2 block text-sm font-medium text-neutral-300">
              Already submitted? Track your complaint
            </label>
            <button
              onClick={onTrackOpen}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-[#04130C] transition-colors hover:bg-emerald-400"
              aria-label="Track the status of an existing complaint"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#04130C] opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#04130C]" />
              </span>
              Track Status
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <button
              onClick={onComplaintOpen}
              className="group flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#04130C] shadow-xl transition-all hover:bg-neutral-100 hover:shadow-2xl hover:shadow-emerald-500/10"
              aria-label="Submit a new complaint"
            >
              Submit a complaint
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </button>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/5"
              aria-label="See how the complaint process works"
            >
              See how it works
            </a>
            <button
              className="group flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/5"
              aria-label="Watch a demo of the complaint process"
            >
              <Play size={16} className="text-emerald-400 transition-transform group-hover:scale-110" />
              Watch Demo
            </button>
          </motion.div>

          {/* Live Stats Ticker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.75 }}
            className="mt-10 w-full max-w-lg"
          >
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              {liveStats.map((stat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-emerald-400 text-xs">{stat.icon}</span>
                  <span className="text-xs font-medium text-neutral-300">{stat.label}</span>
                  {i < liveStats.length - 1 && (
                    <span className="ml-2 text-neutral-600">|</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Trusted by departments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="mt-14 w-full"
          >
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Trusted across departments
            </p>
            <div className="flex flex-wrap gap-3">
              {trustedDepts.map((dept) => {
                const Icon = dept.icon;
                return (
                  <div
                    key={dept.name}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:border-emerald-400/30 hover:text-emerald-300"
                  >
                    <Icon size={13} className="text-neutral-500" />
                    <span>{dept.name}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Right: status timeline visual */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="relative"
        >
          <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-emerald-500/20 via-transparent to-amber-500/10 blur-2xl" />

          {/* Animated border glow wrapper */}
          <div className="relative rounded-[2rem] p-px">
            {/* Animated gradient border */}
            <div
              className="absolute inset-0 rounded-[2rem] opacity-60"
              style={{
                background: "conic-gradient(from 0deg, transparent 0%, rgba(16,185,129,0.4) 25%, transparent 50%, rgba(16,185,129,0.2) 75%, transparent 100%)",
                animation: "spin 8s linear infinite",
              }}
            />
            <div className="relative rounded-[2rem] border border-white/10 bg-[#071a12] p-8 shadow-2xl backdrop-blur-xl">
              <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                    Reference
                  </p>
                  <p className="font-mono text-lg font-semibold text-white">
                    KWMOC-2026-004821
                  </p>
                </div>
                <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300 ring-1 ring-inset ring-amber-400/20">
                  In Review
                </span>
              </div>

              <ol className="space-y-8">
                {[
                  { label: "Submitted", time: "Jul 22, 9:04 AM", done: true },
                  { label: "Assigned to Works Dept.", time: "Jul 22, 2:10 PM", done: true },
                  { label: "Under investigation", time: "Jul 24, 10:00 AM", done: true, active: true },
                  { label: "Resolved", time: "Pending", done: false },
                ].map((s, i) => (
                  <li key={s.label} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                          s.done
                            ? "bg-emerald-500 text-[#04130C] shadow-lg shadow-emerald-500/30"
                            : "border border-white/20 bg-transparent text-neutral-500"
                        }`}
                      >
                        {s.done ? "\u2713" : i + 1}
                      </span>
                      {i < 3 && (
                        <span
                          className={`mt-1 h-10 w-px ${s.done ? "bg-emerald-500/40" : "bg-white/10"}`}
                        />
                      )}
                    </div>
                    <div className="pt-1">
                      <p
                        className={`text-sm font-semibold ${s.active ? "text-amber-300" : s.done ? "text-white" : "text-neutral-500"}`}
                      >
                        {s.label}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">{s.time}</p>
                    </div>
                  </li>
                ))}
              </ol>

              {/* Live indicator inside card */}
              <div className="mt-8 flex items-center gap-2 border-t border-white/10 pt-6">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-xs font-medium text-neutral-400">Live tracking active</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Gradient border on bottom edge */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

      {/* Keyframe for animated border */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </section>
  );
}
