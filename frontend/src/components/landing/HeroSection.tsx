"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface HeroSectionProps {
  onTrackOpen: () => void;
  onComplaintOpen?: () => void;
}

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 16, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.7,
      ease: [0.2, 0.7, 0.2, 1] as const,
    },
  },
};

/**
 * Hero section — blur-in headline, announcement pill, two CTAs, and an
 * app-screenshot preview framed in a card.
 * Always dark background with accent gradients.
 */
export default function HeroSection({ onTrackOpen }: HeroSectionProps) {
  return (
    <main className="overflow-hidden bg-black">
      {/* Ambient gradient backdrop — always dark with green accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 isolate [contain:strict] hidden lg:block"
      >
        <div
          className="absolute left-0 top-0 h-[80rem] w-[35rem] -translate-y-[350px] -rotate-45 rounded-full"
          style={{
            background:
              "radial-gradient(68.54% 68.72% at 55.02% 31.46%, rgba(34, 197, 94, 0.12) 0%, rgba(22, 163, 74, 0.06) 50%, transparent 80%)",
          }}
        />
        <div
          className="absolute right-0 top-0 h-[70rem] w-[30rem] -translate-y-[300px] translate-x-[10%] rotate-45 rounded-full"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 50%, rgba(16, 185, 129, 0.08) 0%, rgba(6, 95, 70, 0.04) 60%, transparent 100%)",
          }}
        />
        {/* Additional glow for depth */}
        <div
          className="absolute left-1/2 top-1/2 h-[60rem] w-[60rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(50% 50% at 50% 50%, rgba(34, 197, 94, 0.03) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Dark overlay gradient */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,black_75%)]"
      />

      <section>
        <motion.div
          initial="hidden"
          animate="show"
          variants={container}
          className="relative pt-28 md:pt-40"
        >
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto max-w-4xl text-center">
              {/* Announcement pill - dark mode styled */}
              <motion.div variants={item}>
                <Link
                  href="/#departments"
                  className="group mx-auto flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/5 p-1 pl-4 shadow-sm transition-all duration-300 hover:bg-white/10"
                >
                  <span className="flex h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span className="text-sm text-white/90">
                    7 departments · one complaint channel
                  </span>
                  <span className="block h-4 w-px bg-white/10" />
                  <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-white/5 transition-colors duration-500 group-hover:bg-white/10">
                    <ArrowRight className="h-3 w-3 text-white/70" />
                  </span>
                </Link>
              </motion.div>

              {/* Headline - always dark mode */}
              <motion.h1
                variants={item}
                className="font-heading mt-8 text-balance text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl"
              >
                Your voice,{" "}
                <span className="bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
                  acted on
                </span>
              </motion.h1>

              {/* Subhead */}
              <motion.p
                variants={item}
                className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-white/60"
              >
                A transparent, trackable way to submit complaints and follow
                them from intake to resolution across every Kwara State
                department.
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={item}
                className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
              >
                <Link
                  href="/report"
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-lg hover:shadow-green-600/20"
                >
                  Submit a complaint
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={onTrackOpen}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Track a complaint
                </button>
              </motion.div>

              <motion.p variants={item} className="mt-4 text-xs text-white/40">
                Free · Anonymous option available · Real-time tracking
              </motion.p>
            </div>
          </div>

          {/* App screenshot preview - dark card */}
          <motion.div
            variants={item}
            className="relative mt-14 overflow-hidden px-2 sm:mt-20 md:mt-24"
          >
            <div
              aria-hidden
              className="absolute inset-0 z-10 bg-gradient-to-b from-transparent from-35% to-black"
            />
            <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-3 shadow-xl shadow-black/50 ring-1 ring-white/5 backdrop-blur-sm">
              <Image
                src="/qa-r6-admin-dashboard.png"
                alt="KwaraMOc complaints dashboard preview"
                width={2700}
                height={1440}
                priority
                className="h-auto w-full rounded-xl border border-white/5"
              />
            </div>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}
