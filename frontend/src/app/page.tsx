"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Modal } from "@heroui/react";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Landmark,
  MessageSquare,
  Palette,
  Route,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { ComplaintForm } from "@/components/ComplaintForm";
import { PublicHeader } from "@/components/PublicHeader";
import HeroSection from "@/components/landing/HeroSection";
import { DEPARTMENTS } from "@/lib/constants";

const FaqSection = dynamic(() => import("@/components/landing/FaqSection"));
const ContactSection = dynamic(
  () => import("@/components/landing/ContactSection"),
);
const FooterSection = dynamic(
  () => import("@/components/landing/FooterSection"),
);
const TrackModal = dynamic(() => import("@/components/landing/TrackModal"));

const DEPARTMENT_ICONS: Record<string, any> = {
  server: Server,
  compass: Compass,
  palette: Palette,
  landmark: Landmark,
  wallet: Wallet,
  chart: BarChart3,
  building: Building2,
};

const TRUST_ITEMS = [
  "Information Services",
  "Public Orientation",
  "Graphics",
  "Culture and Tourism",
  "Finance & Supply",
  "Planning, Research and Statistics",
  "Admin Department",
];

const OUTCOMES = [
  {
    icon: FileText,
    title: "Guided public intake",
    body: "Citizens submit clear complaints with category, LGA, contact details, and supporting evidence.",
  },
  {
    icon: Route,
    title: "Department routing",
    body: "Teams receive the right issues early, with handoff history and ownership visible to admins.",
  },
  {
    icon: Clock,
    title: "Response discipline",
    body: "Status changes, SLA views, and notifications keep every ticket moving toward resolution.",
  },
];

const STEPS = [
  {
    icon: MessageSquare,
    title: "Report the issue",
    body: "Submit a complaint online, include evidence, and choose whether to identify yourself.",
  },
  {
    icon: Search,
    title: "Triage and assign",
    body: "Admins classify the ticket, route it to the responsible department, and track priority.",
  },
  {
    icon: ShieldCheck,
    title: "Resolve with proof",
    body: "Citizens follow progress with their ticket code and confirm or reopen the outcome.",
  },
];

const METRICS = [
  { value: "7", label: "integrated departments" },
  { value: "16", label: "Kwara LGAs supported" },
  { value: "24-48h", label: "classification target" },
  { value: "100%", label: "trackable ticket history" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [isTrackOpen, setIsTrackOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background font-sans text-foreground antialiased">
      <PublicHeader />

      <HeroSection
        onTrackOpen={() => setIsTrackOpen(true)}
        onComplaintOpen={() => setIsComplaintOpen(true)}
      />

      {/* Trust bar */}
      <section className="border-y border-border bg-primary-600 py-4 text-white">
        <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex w-max animate-marquee items-center gap-5 group-hover:[animation-play-state:paused]">
            {[...TRUST_ITEMS, ...TRUST_ITEMS, ...TRUST_ITEMS].map((name, i) => (
              <span
                key={`${name}-${i}`}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-semibold shadow-sm"
              >
                <CheckCircle2 className="h-4 w-4 text-primary-200" />
                {name}
              </span>
            ))}
          </div>
        </div>
        <style jsx>{`
          @keyframes marquee {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(-50%);
            }
          }
          .animate-marquee {
            animation: marquee 34s linear infinite;
          }
        `}</style>
      </section>

      {/* Intro + Outcomes */}
      <section className="bg-background py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end"
          >
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Built for public service
              </span>
              <h2 className="mt-5 max-w-2xl font-heading text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
                A complete complaint desk, not just a contact form.
              </h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              The system connects intake, routing, SLA monitoring, attachments,
              citizen tracking, feedback, and internal reporting in one workflow
              for the Ministry of Communications.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {OUTCOMES.map((outcome, i) => {
              const Icon = outcome.icon;
              return (
                <motion.div
                  key={outcome.title}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-40px" }}
                  variants={fadeUp}
                  transition={{ duration: 0.35, delay: i * 0.08 }}
                  className="rounded-[1.5rem] border border-border bg-card p-6 shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 text-lg font-bold text-foreground">
                    {outcome.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {outcome.body}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section id="departments" className="bg-background py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl text-center"
          >
            <span className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Departments
            </span>
            <h2 className="mt-4 font-heading text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
              Every concern starts in the right place.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Citizens can pick a department directly, while administrators can
              reclassify and route tickets when a complaint belongs elsewhere.
            </p>
          </motion.div>

          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DEPARTMENTS.map((d, i) => {
              const Icon = DEPARTMENT_ICONS[d.icon] ?? Building2;
              return (
                <motion.div
                  key={d.name}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-40px" }}
                  variants={fadeUp}
                  transition={{ duration: 0.3, delay: (i % 3) * 0.06 }}
                  className="group flex min-h-[132px] flex-col justify-between rounded-[1.4rem] border border-border bg-card p-5 transition hover:-translate-y-1 hover:border-primary/35 hover:bg-primary-50/50 dark:hover:bg-primary-950/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background text-primary shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-foreground">{d.name}</h3>
                  </div>
                  <p className="mt-5 text-sm leading-6 text-muted-foreground">
                    {d.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="bg-primary-50/50 py-24 dark:bg-primary-950/10"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
                Process
              </span>
              <h2 className="mt-4 font-heading text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
                Clear steps for citizens and staff.
              </h2>
            </div>
            <div className="grid gap-4">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-40px" }}
                    variants={fadeUp}
                    transition={{ duration: 0.35, delay: i * 0.08 }}
                    className="grid gap-4 rounded-[1.5rem] border border-border bg-neutral-50/50 dark:bg-neutral-200 p-5  sm:grid-cols-[auto_1fr_auto] sm:items-center"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {step.body}
                      </p>
                    </div>
                    <span className="font-heading text-4xl font-semibold text-primary/35">
                      0{i + 1}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Metrics */}
      <section className="bg-background py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] bg-neutral-900 text-white dark:bg-neutral-950">
            <div className="grid gap-10 p-8 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:p-14">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.24em] text-primary-200">
                  Operational clarity
                </span>
                <h2 className="mt-4 max-w-xl font-heading text-4xl font-semibold text-neutral-200 leading-tight sm:text-5xl">
                  Measurable public response without paperwork drift.
                </h2>
                <p className="mt-4 max-w-lg text-neutral-300/70">
                  Leaders get a live view of volume, department performance,
                  pending queues, reopened complaints, and resolution history.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {METRICS.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-[1.25rem] border border-neutral-50/10  p-5"
                  >
                    <p className="font-heading text-4xl text-neutral-200 font-semibold">
                      {metric.value}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-neutral-300/70">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background py-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-5xl px-6 text-center lg:px-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary">
            <Users className="h-4 w-4" />
            Citizen-first service
          </div>
          <h2 className="mt-6 font-heading text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Ready to submit, track, and resolve complaints with confidence?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Start a ticket now, or use your ticket code and passcode to check
            progress on an existing complaint.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/report"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-primary-700"
            >
              Submit a complaint <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={() => setIsTrackOpen(true)}
              className="inline-flex items-center justify-center rounded-full border border-border bg-card px-6 py-3.5 text-sm font-bold text-foreground transition hover:bg-muted"
            >
              Track a complaint
            </button>
          </div>
        </motion.div>
      </section>

      <FaqSection onComplaintOpen={() => setIsComplaintOpen(true)} />
      <ContactSection />
      <FooterSection
        onComplaintOpen={() => setIsComplaintOpen(true)}
        onTrackOpen={() => setIsTrackOpen(true)}
      />

      <Modal isOpen={isComplaintOpen} onOpenChange={setIsComplaintOpen}>
        <Modal.Backdrop>
          <Modal.Container placement="center" size="lg" scroll="inside">
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Submit a complaint</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <ComplaintForm bare title="" description="" />
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <TrackModal isOpen={isTrackOpen} onOpenChange={setIsTrackOpen} />
    </div>
  );
}
