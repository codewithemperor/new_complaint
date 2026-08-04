"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PenLine,
  Search,
  CircleCheckBig,
  ArrowRight,
  Clock,
  Shield,
  FileText,
  Eye,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Timer,
} from "lucide-react";

interface HowItWorksSectionProps {
  onComplaintOpen: () => void;
}

const stepDetails = [
  {
    icon: PenLine,
    title: "Submit",
    body: "Fill the form with your complaint details and any evidence. You get a reference number instantly.",
    estimatedTime: "2 minutes",
    details: [
      { icon: FileText, text: "Multiple evidence attachments" },
      { icon: Clock, text: "Average 2 min completion" },
      { icon: Shield, text: "No account required" },
    ],
    learnMore:
      "Our streamlined form collects all essential information in a single page. You can attach photos, documents, or other evidence files. Once submitted, you'll receive a unique reference number via SMS and email for tracking purposes.",
  },
  {
    icon: Search,
    title: "Track",
    body: "Follow your complaint through classification, investigation, and approval. We email you at every stage.",
    estimatedTime: "24 hours",
    details: [
      { icon: Eye, text: "Real-time status updates" },
      { icon: Clock, text: "Email notifications" },
      { icon: Shield, text: "Secure passcode access" },
    ],
    learnMore:
      "Use your reference number and secure passcode to check your complaint status at any time. The system automatically classifies your complaint and routes it to the appropriate department. You'll receive email notifications at each stage transition.",
  },
  {
    icon: CircleCheckBig,
    title: "Resolve",
    body: "Receive a resolution and confirm it's addressed. Not satisfied? Reopen with one click.",
    estimatedTime: "Real-time",
    details: [
      { icon: CheckCircle2, text: "Verified resolution" },
      { icon: Eye, text: "One-click reopen" },
      { icon: Shield, text: "Satisfaction guarantee" },
    ],
    learnMore:
      "Once a department resolves your complaint, you'll be notified immediately. You can confirm the resolution or reopen the case with a single click if you're not satisfied. All interactions are logged for full transparency and accountability.",
  },
];

const featuredIn = [
  "Kwara State Government",
  "Ministry of Communications",
  "Open Government Partnership",
];

/* ── Step card with expandable section ──────────────────────────── */
function StepCard({
  step,
  index,
}: {
  step: (typeof stepDetails)[0];
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-50 p-8 shadow-sm transition-all duration-300 hover:border-green-300 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-1"
    >
      {/* Step number badge with animated circle */}
      <div className="absolute right-6 top-6 flex items-center justify-center">
        <div className="relative flex h-12 w-12 items-center justify-center">
          {/* Animated ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-green-200"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.3,
            }}
          />
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-green-50 font-mono text-sm font-bold text-green-700 ring-1 ring-green-100 transition-all group-hover:bg-green-600 group-hover:text-white">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Estimated time badge */}
      <div className="mb-4 flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-100 w-fit">
        <Timer size={12} />
        {step.estimatedTime}
      </div>

      <div className="relative">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 shadow-sm ring-1 ring-green-100 transition-all group-hover:shadow-md group-hover:ring-green-300">
          <Icon size={26} className="text-green-700" />
        </div>
        <h3 className="text-xl font-semibold text-neutral-900">{step.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          {step.body}
        </p>

        {/* Detail list — always visible for accessibility */}
        <div className="mt-4 space-y-2.5">
          {step.details.map((d, j) => {
            const DetailIcon = d.icon;
            return (
              <div
                key={j}
                className="flex items-center gap-2.5 text-xs text-neutral-700"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-green-50 ring-1 ring-green-100">
                  <DetailIcon size={12} className="text-green-700" />
                </span>
                {d.text}
              </div>
            );
          })}
        </div>

        {/* Learn More expandable section */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-green-600 transition-colors hover:text-green-700"
          aria-expanded={isExpanded}
          aria-label={`Learn more about ${step.title}`}
        >
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          />
          {isExpanded ? "Show less" : "Learn more"}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <p className="mt-3 rounded-lg bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-600 ring-1 ring-neutral-100">
                {step.learnMore}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Connecting dot on card edges - desktop */}
      {index < 2 && (
        <div className="absolute -right-4 top-1/2 z-20 hidden h-3 w-3 -translate-y-1/2 rounded-full border-2 border-neutral-200 bg-neutral-50 md:block group-hover:border-green-400 transition-colors" />
      )}
      {index > 0 && (
        <div className="absolute -left-4 top-1/2 z-20 hidden h-3 w-3 -translate-y-1/2 rounded-full border-2 border-neutral-200 bg-neutral-50 md:block group-hover:border-green-400 transition-colors" />
      )}
    </motion.div>
  );
}

export default function HowItWorksSection({
  onComplaintOpen,
}: HowItWorksSectionProps) {
  return (
    <>
      {/* How it works */}
      <section id="how-it-works" className="bg-neutral-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-green-600">
              Process
            </span>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
              A simpler way to be heard
            </h2>
            <p className="mt-4 text-lg text-neutral-500">
              Three straightforward steps from submission to resolution.
            </p>
          </div>

          {/* Step cards with connecting dotted lines */}
          <div className="relative mt-16">
            {/* Connecting dotted lines with animation - desktop only */}
            <div className="absolute top-1/2 left-0 right-0 z-0 hidden -translate-y-1/2 md:block">
              <div className="mx-auto flex max-w-4xl items-center justify-between px-20">
                {/* Line between step 1 and 2 */}
                <motion.div
                  className="flex-1 border-t-2 border-dashed border-green-200"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  style={{ transformOrigin: "left" }}
                />
                <div className="mx-4 flex items-center justify-center">
                  <ChevronRight size={20} className="text-green-300" />
                </div>
                {/* Line between step 2 and 3 */}
                <motion.div
                  className="flex-1 border-t-2 border-dashed border-green-200"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  style={{ transformOrigin: "left" }}
                />
                <div className="mx-4 flex items-center justify-center">
                  <ChevronRight size={20} className="text-green-300" />
                </div>
              </div>
            </div>

            <div className="relative z-10 grid gap-8 md:grid-cols-3">
              {stepDetails.map((s, i) => (
                <StepCard key={i} step={s} index={i} />
              ))}
            </div>
          </div>

          {/* Featured in / Trust bar */}
          <div className="mt-20 border-t border-neutral-100 pt-10">
            <div className="flex flex-col items-center gap-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                Recognized &amp; supported by
              </p>
              <div className="flex flex-wrap items-center justify-center gap-8">
                {featuredIn.map((name) => (
                  <div
                    key={name}
                    className="flex items-center gap-2 rounded-full border border-neutral-100 bg-neutral-50 px-4 py-2 text-xs font-medium text-neutral-500 transition-colors hover:border-green-200 hover:text-green-700"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Submit a complaint (Split Layout) */}
      <section className="relative overflow-hidden bg-neutral-50 py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-green-600">
              Action
            </span>
            <h2 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-5xl">
              Tell us what happened
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-neutral-600">
              Describe the issue, choose the department it concerns, and attach
              any supporting evidence. You&apos;ll receive a tracking reference
              the moment you submit — no account required.
            </p>

            <ul className="mt-8 space-y-4 text-sm text-neutral-700">
              <li className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600">
                  &#10003;
                </span>
                Takes about two minutes to complete
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600">
                  &#10003;
                </span>
                Photo &amp; document attachments supported
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600">
                  &#10003;
                </span>
                Instant reference number &amp; email confirmation
              </li>
            </ul>

            <button
              onClick={onComplaintOpen}
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#04130C] px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-neutral-800 hover:shadow-xl"
              aria-label="Open the complaint submission form"
            >
              Open Complaint Form
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="relative">
            {/* Abstract UI representation for corporate aesthetic */}
            <div className="relative rounded-3xl border border-neutral-200 bg-neutral-50 p-2 shadow-2xl shadow-neutral-200/50">
              <div className="rounded-2xl bg-neutral-50 p-6">
                <div className="mb-6 flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400"></div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 h-3 w-1/4 rounded-full bg-neutral-300"></div>
                    <div className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50"></div>
                  </div>
                  <div>
                    <div className="mb-2 h-3 w-1/4 rounded-full bg-neutral-300"></div>
                    <div className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50"></div>
                  </div>
                  <div>
                    <div className="mb-2 h-3 w-1/4 rounded-full bg-neutral-300"></div>
                    <div className="h-24 w-full rounded-lg border border-dashed border-neutral-300 bg-neutral-50 flex items-center justify-center text-neutral-400 text-xs">
                      Drag &amp; drop files
                    </div>
                  </div>
                  <div className="h-10 w-1/3 rounded-lg bg-green-500"></div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 -z-10 h-40 w-40 rounded-3xl bg-green-400/20 blur-2xl"></div>
          </div>
        </div>
      </section>

      {/* Transparency / tracking feature */}
      <section className="relative overflow-hidden bg-[#04130C] py-24 text-white sm:py-32">
        <div className="absolute top-0 left-0 h-96 w-96 rounded-full bg-green-500/10 blur-3xl"></div>
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2 lg:px-8">
          <div className="order-2 lg:order-1">
            <div className="rounded-3xl border border-white/10 bg-neutral-50/5 p-8 shadow-2xl backdrop-blur-xl">
              <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    Performance
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    Resolution rate this quarter
                  </p>
                </div>
                <span className="rounded-full bg-green-400/10 px-3 py-1.5 text-xs font-bold text-green-300 ring-1 ring-inset ring-green-400/20">
                  &#9650; 12% Increase
                </span>
              </div>
              <div className="flex h-40 items-end gap-3">
                {[38, 52, 44, 61, 70, 66, 82].map((h, i) => (
                  <div
                    key={i}
                    className="group flex flex-1 flex-col items-center justify-end"
                  >
                    <div
                      className="w-full rounded-t-lg bg-green-500/60 transition-all duration-300 group-hover:bg-green-400"
                      style={{ height: `${h}%` }}
                    ></div>
                    <span className="mt-2 text-[10px] font-medium text-neutral-500">
                      W{i + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <span className="text-xs font-bold uppercase tracking-widest text-green-400">
              Transparency
            </span>
            <h2 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              See exactly where things stand
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-neutral-400">
              Every complaint moves through the same public stages —
              classification, investigation, approval, resolution — so you
              always know what happens next and who&apos;s responsible for it.
            </p>
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-neutral-300">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-400">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                Secure &amp; confidential processing
              </div>
              <div className="flex items-center gap-3 text-neutral-300">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-400">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </span>
                Real-time status updates
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
