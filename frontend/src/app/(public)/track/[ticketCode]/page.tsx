"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { TimelineEntry } from "@/lib/types";
import {
  ArrowLeft,
  FileText,
  Clock,
  Tag,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Circle,
  ArrowUpRight,
  User,
  RefreshCw,
  Paperclip,
  Send,
  Plus,
  ShieldCheck,
  Printer,
  Share2,
  Phone,
  Mail,
  CalendarClock,
  ChevronDown,
  Eye,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Download,
  MessageSquare,
  Shield,
  Timer,
  UserCircle,
} from "lucide-react";

interface TrackedMinute {
  body: string;
  isResolutionDraft?: boolean;
  createdAt: string;
  author?: { fullName: string; designation?: string | null } | null;
}

interface TrackedTicket {
  ticketCode: string;
  status: string;
  subject: string;
  description: string;
  category?: string | null;
  priority?: string | null;
  departmentName?: string | null;
  awaiting?: string;
  createdAt: string;
  resolvedAt?: string | null;
  resolutionText?: string | null;
  attachments: { filename: string; mimetype: string }[];
  minutes?: TrackedMinute[];
  infoRequest?: { text: string; createdAt: string } | null;
  timeline: TimelineEntry[];
  citizenName?: string | null;
  citizenEmail?: string | null;
  citizenPhone?: string | null;
  slaDueAt?: string | null;
  slaTargetHours?: number | null;
  slaBreached?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  ACKNOWLEDGED: "Acknowledged",
  TRIAGED: "Being Routed",
  ASSIGNED: "Assigned to Officer",
  IN_PROGRESS: "Under Investigation",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  REOPENED: "Reopened",
  ESCALATED: "Escalated",
  REFERRED: "Referred Externally",
};

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-neutral-100 text-neutral-600 border-neutral-200",
  ACKNOWLEDGED: "bg-cyan-50 text-cyan-700 border-cyan-200",
  TRIAGED: "bg-violet-50 text-violet-700 border-violet-200",
  ASSIGNED: "bg-green-50 text-green-700 border-green-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
  PENDING_APPROVAL: "bg-yellow-50 text-yellow-700 border-yellow-200",
  APPROVED: "bg-green-50 text-green-700 border-green-200",
  RESOLVED: "bg-green-50 text-green-700 border-green-200",
  CLOSED: "bg-neutral-100 text-neutral-600 border-neutral-200",
  REOPENED: "bg-orange-50 text-orange-700 border-orange-200",
  ESCALATED: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_DOT_COLORS: Record<string, string> = {
  SUBMITTED: "bg-neutral-400",
  ACKNOWLEDGED: "bg-cyan-400",
  TRIAGED: "bg-violet-400",
  ASSIGNED: "bg-green-400",
  IN_PROGRESS: "bg-amber-400",
  PENDING_APPROVAL: "bg-yellow-400",
  APPROVED: "bg-green-500",
  RESOLVED: "bg-green-500",
  CLOSED: "bg-neutral-400",
  REOPENED: "bg-orange-400",
  ESCALATED: "bg-red-400",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  SUBMITTED: <FileText size={14} />,
  ACKNOWLEDGED: <Eye size={14} />,
  TRIAGED: <ArrowUpRight size={14} />,
  ASSIGNED: <User size={14} />,
  IN_PROGRESS: <Clock size={14} />,
  PENDING_APPROVAL: <AlertTriangle size={14} />,
  APPROVED: <CheckCircle2 size={14} />,
  RESOLVED: <CheckCircle2 size={14} />,
  CLOSED: <ShieldCheck size={14} />,
  REOPENED: <RefreshCw size={14} />,
  ESCALATED: <AlertTriangle size={14} />,
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-50 text-red-700 border-red-200",
  HIGH: "bg-amber-50 text-amber-700 border-amber-200",
  MEDIUM: "bg-green-50 text-green-700 border-green-200",
  LOW: "bg-neutral-50 text-neutral-600 border-neutral-200",
};

const MOVEMENT_LABELS: Record<string, string> = {
  SUBMITTED: "Complaint submitted",
  ROUTED: "Routed to department",
  ASSIGNED: "Assigned to officer",
  REASSIGNED: "Reassigned",
  RETURNED: "Returned for review",
  ESCALATED: "Escalated",
  APPROVED: "Approved",
  REFERRED: "Referred externally",
  REOPENED: "Reopened",
  CLOSED: "Closed",
  AUTO_ESCALATED: "Auto-escalated (overdue)",
};

const MOVEMENT_ICONS: Record<string, React.ReactNode> = {
  SUBMITTED: <FileText size={14} />,
  ROUTED: <ArrowUpRight size={14} />,
  ASSIGNED: <User size={14} />,
  REASSIGNED: <RefreshCw size={14} />,
  RETURNED: <ArrowLeft size={14} />,
  ESCALATED: <AlertTriangle size={14} />,
  APPROVED: <CheckCircle2 size={14} />,
  REFERRED: <ArrowUpRight size={14} />,
  REOPENED: <RefreshCw size={14} />,
  CLOSED: <ShieldCheck size={14} />,
  AUTO_ESCALATED: <AlertTriangle size={14} />,
};

const MOVEMENT_DOT_COLORS: Record<string, string> = {
  SUBMITTED: "bg-neutral-400",
  ROUTED: "bg-violet-400",
  ASSIGNED: "bg-green-400",
  REASSIGNED: "bg-green-400",
  RETURNED: "bg-amber-400",
  ESCALATED: "bg-red-400",
  APPROVED: "bg-green-500",
  REFERRED: "bg-cyan-400",
  REOPENED: "bg-orange-400",
  CLOSED: "bg-neutral-400",
  AUTO_ESCALATED: "bg-red-400",
};

const PIPELINE_STEPS = [
  "SUBMITTED",
  "ACKNOWLEDGED",
  "TRIAGED",
  "ASSIGNED",
  "IN_PROGRESS",
  "PENDING_APPROVAL",
  "APPROVED",
  "RESOLVED",
] as const;

function getStepIndex(status: string): number {
  return PIPELINE_STEPS.indexOf(status as (typeof PIPELINE_STEPS)[number]);
}

/** Mask a string for privacy */
function maskString(str: string, visibleChars = 2): string {
  if (str.length <= visibleChars * 2) return str;
  return (
    str.slice(0, visibleChars) +
    "•".repeat(Math.min(str.length - visibleChars * 2, 8)) +
    str.slice(-visibleChars)
  );
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return maskString(email);
  return maskString(local, 2) + "@" + domain;
}

function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  return (
    phone.slice(0, 4) +
    "•".repeat(Math.min(phone.length - 4, 6)) +
    phone.slice(-2)
  );
}

function getEstimatedResolution(
  createdAt: string,
  priority?: string | null,
): Date | null {
  const created = new Date(createdAt);
  const hoursMap: Record<string, number> = {
    P1: 48,
    P2: 168,
    P3: 336,
    P4: 672,
  };
  const hours = hoursMap[priority ?? "P3"] ?? 336;
  return new Date(created.getTime() + hours * 60 * 60 * 1000);
}

/** Floating background element component */
function FloatingElement({
  delay,
  duration,
  size,
  x,
  y,
  color,
}: {
  delay: number;
  duration: number;
  size: number;
  x: string;
  y: string;
  color: string;
}) {
  return (
    <motion.div
      className="absolute rounded-full opacity-[0.06]"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        backgroundColor: color,
      }}
      animate={{
        y: [0, -20, 0],
        x: [0, 10, 0],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export default function TrackTicketPage() {
  const params = useParams<{ ticketCode: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const passcode = searchParams.get("passcode");

  const [ticket, setTicket] = useState<TrackedTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketCopied, setTicketCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [hoveredTimelineIdx, setHoveredTimelineIdx] = useState<number | null>(
    null,
  );

  // Info-reply state.
  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySent, setReplySent] = useState(false);

  // Build the auth query string (prefer passcode, fall back to token).
  const authQuery = passcode
    ? `passcode=${encodeURIComponent(passcode)}`
    : token
      ? `token=${encodeURIComponent(token)}`
      : null;

  const fetchTicket = useCallback(async () => {
    if (!authQuery) {
      setError("Please use the tracking page to check your complaint status.");
      setLoading(false);
      return;
    }
    try {
      const data = await api.get<TrackedTicket>(
        `/tickets/${params.ticketCode}/track?${authQuery}`,
      );
      setTicket(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.statusCode === 401
            ? "Invalid or expired tracking link."
            : err.message
          : "Failed to load ticket.",
      );
    } finally {
      setLoading(false);
    }
  }, [params.ticketCode, authQuery]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  async function handleReply() {
    if (!replyBody.trim() || !authQuery) return;
    setReplying(true);
    setReplyError(null);
    try {
      await api.post(`/tickets/${params.ticketCode}/info?${authQuery}`, {
        body: replyBody,
      });
      setReplyBody("");
      setReplySent(true);
      fetchTicket();
    } catch (err) {
      setReplyError(
        err instanceof ApiError ? err.message : "Failed to send reply.",
      );
    } finally {
      setReplying(false);
    }
  }

  async function handleCopyTicketCode() {
    if (!ticket) return;
    try {
      await navigator.clipboard.writeText(ticket.ticketCode);
      setTicketCopied(true);
      setTimeout(() => setTicketCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function handleShare() {
    if (!ticket) return;
    const url = `${window.location.origin}/track/${params.ticketCode}?${authQuery}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  function handleDownloadReport() {
    if (!ticket) return;
    const report = `KwaraMOc Complaint Status Report\n${"=".repeat(40)}\n\nTicket Code: ${ticket.ticketCode}\nStatus: ${STATUS_LABELS[ticket.status] ?? ticket.status}\nSubject: ${ticket.subject}\nCategory: ${ticket.category?.replace(/_/g, " ") ?? "N/A"}\nPriority: ${ticket.priority ?? "N/A"}\nDepartment: ${ticket.departmentName ?? "N/A"}\nSubmitted: ${new Date(ticket.createdAt).toLocaleString()}\n${ticket.resolvedAt ? `Resolved: ${new Date(ticket.resolvedAt).toLocaleString()}\n` : ""}\nDescription:\n${ticket.description}\n${ticket.resolutionText ? `\nResolution:\n${ticket.resolutionText}\n` : ""}\nTimeline:\n${ticket.timeline.map((e, i) => `  ${i + 1}. ${MOVEMENT_LABELS[e.type] ?? e.type} - ${new Date(e.createdAt).toLocaleString()}`).join("\n")}`;
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ticket.ticketCode}_status_report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="flex items-center gap-3">
          <Loader2 size={24} className="animate-spin text-green-600" />
          <p className="text-sm text-neutral-500">
            Loading complaint status...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50">
        {/* Floating elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-neutral-50" />
          <FloatingElement
            delay={0}
            duration={6}
            size={100}
            x="30%"
            y="30%"
            color="#059669"
          />
          <FloatingElement
            delay={1}
            duration={8}
            size={80}
            x="60%"
            y="50%"
            color="#22c55e"
          />
        </div>
        <div className="flex min-h-screen items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md rounded-xl border border-red-200 bg-neutral-50 shadow-sm"
          >
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <AlertCircle size={20} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Cannot Track Complaint
                  </h3>
                  <p className="mt-2 text-sm text-red-700">{error}</p>
                  <ul className="mt-3 space-y-1">
                    <li className="flex items-center gap-1.5 text-xs text-red-600">
                      <span className="h-1 w-1 rounded-full bg-red-400" />
                      Check that you have the correct tracking link
                    </li>
                    <li className="flex items-center gap-1.5 text-xs text-red-600">
                      <span className="h-1 w-1 rounded-full bg-red-400" />
                      Try using the track page with your ticket code and
                      passcode
                    </li>
                    <li className="flex items-center gap-1.5 text-xs text-red-600">
                      <span className="h-1 w-1 rounded-full bg-red-400" />
                      Contact support for assistance
                    </li>
                  </ul>
                </div>
              </div>
              <Link
                href="/track"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
              >
                <ArrowLeft size={14} />
                Go to Track Page
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  const statusLabel = STATUS_LABELS[ticket.status] ?? ticket.status;
  const statusColor =
    STATUS_COLORS[ticket.status] ??
    "bg-neutral-100 text-neutral-600 border-neutral-200";
  const statusDotColor = STATUS_DOT_COLORS[ticket.status] ?? "bg-neutral-400";
  const statusIcon = STATUS_ICONS[ticket.status] ?? <Circle size={14} />;
  const isResolvedOrClosed =
    ticket.status === "RESOLVED" || ticket.status === "CLOSED";

  // Progress info
  let idx = getStepIndex(ticket.status);
  if (idx === -1) {
    if (ticket.status === "CLOSED") idx = PIPELINE_STEPS.length - 1;
    else if (ticket.status === "REOPENED") idx = PIPELINE_STEPS.length - 2;
    else if (ticket.status === "ESCALATED") idx = 4;
    else if (ticket.status === "REFERRED") idx = 5;
    else idx = 0;
  }
  const progressPercent = Math.round(((idx + 1) / PIPELINE_STEPS.length) * 100);

  // SLA info
  const slaInfo = (() => {
    if (!ticket.slaTargetHours && !ticket.slaDueAt) return null;
    const now = new Date();
    const dueAt = ticket.slaDueAt ? new Date(ticket.slaDueAt) : null;
    const remaining = dueAt ? dueAt.getTime() - now.getTime() : null;
    const hoursRemaining = remaining
      ? Math.max(0, Math.round(remaining / (1000 * 60 * 60)))
      : null;
    const isBreached =
      ticket.slaBreached ?? (remaining !== null && remaining < 0);
    return {
      targetHours: ticket.slaTargetHours,
      dueAt,
      hoursRemaining,
      isBreached,
    };
  })();

  const estimatedResolution = (() => {
    if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") return null;
    return getEstimatedResolution(ticket.createdAt, ticket.priority);
  })();

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Floating elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-neutral-50" />
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.03]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="ticketGrid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ticketGrid)" />
        </svg>
        <FloatingElement
          delay={0}
          duration={6}
          size={120}
          x="10%"
          y="20%"
          color="#059669"
        />
        <FloatingElement
          delay={1}
          duration={8}
          size={80}
          x="70%"
          y="15%"
          color="#22c55e"
        />
        <FloatingElement
          delay={2}
          duration={7}
          size={100}
          x="80%"
          y="60%"
          color="#10b981"
        />
      </div>

      <div className="mx-auto max-w-lg px-4 pb-8 pt-8">
        {/* Status header with icon badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 text-center"
        >
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold relative overflow-hidden ${statusColor}`}
          >
            <span
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent, transparent 4px, currentColor 4px, currentColor 5px)",
              }}
            />
            <span
              className={`relative h-2 w-2 rounded-full ${statusDotColor} ${!isResolvedOrClosed ? "animate-pulse" : ""}`}
            />
            <span className="relative">{statusIcon}</span>
            <span className="relative">{statusLabel}</span>
          </span>
          <h1 className="mt-3 text-lg font-bold text-neutral-800">
            Complaint Status
          </h1>
          <div className="flex items-center justify-center gap-2">
            <p className="font-mono text-sm text-neutral-500">
              {ticket.ticketCode}
            </p>
            <button
              onClick={handleCopyTicketCode}
              className="flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-500 transition-all hover:border-green-300 hover:text-green-600"
              title="Copy ticket code"
            >
              {ticketCopied ? (
                <Check size={10} className="text-green-600" />
              ) : (
                <Copy size={10} />
              )}
              {ticketCopied ? "Copied" : "Copy"}
            </button>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-600">
              Progress
            </span>
            <span className="text-xs font-medium text-neutral-500">
              {idx + 1} / {PIPELINE_STEPS.length} steps
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${isResolvedOrClosed ? "bg-green-500" : "bg-green-500"}`}
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-neutral-400">Submitted</span>
            <span className="text-[10px] font-semibold text-green-600">
              {progressPercent}%
            </span>
            <span className="text-[10px] text-neutral-400">Resolved</span>
          </div>
        </motion.div>

        {/* SLA Information */}
        {slaInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className={`mb-4 flex items-center gap-3 rounded-xl border px-4 py-3 ${
              slaInfo.isBreached
                ? "border-red-200 bg-red-50"
                : slaInfo.hoursRemaining !== null && slaInfo.hoursRemaining < 24
                  ? "border-amber-200 bg-amber-50"
                  : "border-green-200 bg-green-50"
            }`}
          >
            <Timer
              size={18}
              className={`shrink-0 ${
                slaInfo.isBreached
                  ? "text-red-600"
                  : slaInfo.hoursRemaining !== null &&
                      slaInfo.hoursRemaining < 24
                    ? "text-amber-600"
                    : "text-green-600"
              }`}
            />
            <div>
              <p
                className={`text-xs font-medium ${
                  slaInfo.isBreached
                    ? "text-red-700"
                    : slaInfo.hoursRemaining !== null &&
                        slaInfo.hoursRemaining < 24
                      ? "text-amber-700"
                      : "text-green-700"
                }`}
              >
                {slaInfo.isBreached ? "SLA Breached" : "SLA Target"}
              </p>
              <p
                className={`text-sm ${
                  slaInfo.isBreached
                    ? "text-red-800"
                    : slaInfo.hoursRemaining !== null &&
                        slaInfo.hoursRemaining < 24
                      ? "text-amber-800"
                      : "text-green-800"
                }`}
              >
                {slaInfo.isBreached
                  ? "Resolution is overdue"
                  : slaInfo.hoursRemaining !== null
                    ? `${slaInfo.hoursRemaining} hours remaining`
                    : `${slaInfo.targetHours} hour target`}
              </p>
            </div>
          </motion.div>
        )}

        {/* Estimated Resolution */}
        {estimatedResolution && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
          >
            <CalendarClock size={18} className="shrink-0 text-amber-600" />
            <div>
              <p className="text-xs font-medium text-amber-700">
                Estimated Resolution
              </p>
              <p className="text-sm text-amber-800">
                {estimatedResolution.toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </motion.div>
        )}

        {/* Ticket detail card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-xl border border-neutral-200 bg-neutral-50/80 shadow-sm backdrop-blur-md"
        >
          <div className="space-y-5 p-6">
            {/* Subject */}
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase text-neutral-400">
                <FileText size={12} />
                Subject
              </div>
              <p className="text-sm font-medium text-neutral-800">
                {ticket.subject}
              </p>
            </div>

            {/* Category & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase text-neutral-400">
                  <Tag size={12} />
                  Category
                </div>
                <p className="text-sm text-neutral-700">
                  {ticket.category ? ticket.category.replace(/_/g, " ") : "—"}
                </p>
              </div>
              {ticket.priority && (
                <div>
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase text-neutral-400">
                    <AlertTriangle size={12} />
                    Priority
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${PRIORITY_COLORS[ticket.priority] ?? "bg-neutral-50 text-neutral-600 border-neutral-200"}`}
                  >
                    {ticket.priority}
                  </span>
                </div>
              )}
            </div>

            {/* Department Info Card */}
            {ticket.departmentName && (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                    <Building2 size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-neutral-400">
                      Department
                    </p>
                    <p className="text-sm font-medium text-neutral-700">
                      {ticket.departmentName}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Citizen Info Section (masked for privacy) */}
            {(ticket.citizenName ||
              ticket.citizenEmail ||
              ticket.citizenPhone) && (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
                    <UserCircle size={16} className="text-violet-600" />
                  </div>
                  <p className="text-xs font-medium uppercase text-neutral-400">
                    Complainant
                  </p>
                </div>
                <div className="space-y-1 pl-10">
                  {ticket.citizenName && (
                    <p className="text-sm text-neutral-700">
                      <span className="text-neutral-400 mr-2">Name:</span>
                      {maskString(ticket.citizenName, 2)}
                    </p>
                  )}
                  {ticket.citizenEmail && (
                    <p className="text-sm text-neutral-700">
                      <span className="text-neutral-400 mr-2">Email:</span>
                      {maskEmail(ticket.citizenEmail)}
                    </p>
                  )}
                  {ticket.citizenPhone && (
                    <p className="text-sm text-neutral-700">
                      <span className="text-neutral-400 mr-2">Phone:</span>
                      {maskPhone(ticket.citizenPhone)}
                    </p>
                  )}
                </div>
                <p className="mt-2 text-[10px] text-neutral-400 pl-10">
                  <Shield size={10} className="mr-1 inline" />
                  Personal information is partially masked for privacy
                </p>
              </div>
            )}

            {/* Description */}
            <div>
              <div className="mb-1 text-xs font-medium uppercase text-neutral-400">
                Description
              </div>
              <p className="whitespace-pre-wrap text-sm text-neutral-700">
                {ticket.description}
              </p>
            </div>

            {/* Submitted date */}
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase text-neutral-400">
                <Clock size={12} />
                Submitted
              </div>
              <p className="text-sm text-neutral-700">
                {new Date(ticket.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Resolution */}
            {ticket.resolutionText && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase text-green-600">
                  <CheckCircle2 size={14} />
                  Resolution
                </div>
                <p className="mt-1 text-sm text-neutral-700">
                  {ticket.resolutionText}
                </p>
              </div>
            )}

            {/* Attachments */}
            {ticket.attachments.length > 0 && (
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase text-neutral-400">
                  <Paperclip size={12} />
                  Attachments
                </div>
                <ul className="mt-1 space-y-1">
                  {ticket.attachments.map((a, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-1.5 text-sm text-neutral-600"
                    >
                      <Paperclip size={12} className="text-neutral-400" />
                      {a.filename}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Info request + reply box */}
            {ticket.awaiting === "CITIZEN" && ticket.infoRequest && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-amber-700">
                  <AlertCircle size={14} />
                  Information Requested
                </div>
                <p className="mb-3 text-sm text-neutral-700">
                  {ticket.infoRequest.text}
                </p>

                {replySent ? (
                  <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                    Thank you — your response has been sent.
                  </div>
                ) : (
                  <>
                    <textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      rows={3}
                      className="w-full resize-y rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/30"
                      placeholder="Type your response here..."
                    />
                    {replyError && (
                      <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600">
                        <AlertCircle size={12} className="mt-0.5 shrink-0" />
                        {replyError}
                      </div>
                    )}
                    <button
                      className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-green-700 hover:shadow-md mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      onClick={handleReply}
                      disabled={replying || !replyBody.trim()}
                    >
                      {replying ? (
                        <span className="flex items-center gap-2">
                          <Loader2 size={14} className="animate-spin" />
                          Sending...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send size={14} />
                          Send Response
                        </span>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Officer minutes */}
            {ticket.minutes && ticket.minutes.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase text-neutral-400">
                  <FileText size={12} />
                  Updates from the handling officer
                </div>
                <div className="space-y-3">
                  {ticket.minutes.map((m, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 shadow-sm"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-700">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-50">
                            <User size={10} className="text-green-600" />
                          </div>
                          {m.author?.fullName ?? "Officer"}
                          {m.author?.designation ? (
                            <span className="text-neutral-400">
                              · {m.author.designation}
                            </span>
                          ) : null}
                        </span>
                        <span className="text-xs text-neutral-400">
                          {new Date(m.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-neutral-700 leading-relaxed">
                        {m.body}
                      </p>
                      {m.isResolutionDraft && (
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600">
                          <CheckCircle2 size={10} />
                          Resolution draft
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Movement Timeline */}
            {ticket.timeline && ticket.timeline.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase text-neutral-400">
                  <Clock size={12} />
                  Timeline
                </div>
                <div className="relative">
                  <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-neutral-200" />
                  {ticket.timeline.length > 1 && (
                    <div
                      className="absolute left-[15px] top-2 w-0.5 bg-green-400"
                      style={{
                        height: `calc(${((ticket.timeline.length - 1) / ticket.timeline.length) * 100}% - 8px)`,
                      }}
                    />
                  )}

                  <div className="space-y-0">
                    {ticket.timeline.map((entry, i) => {
                      const icon = MOVEMENT_ICONS[entry.type] ?? (
                        <Circle size={14} />
                      );
                      const label = MOVEMENT_LABELS[entry.type] ?? entry.type;
                      const dotColor =
                        MOVEMENT_DOT_COLORS[entry.type] ?? "bg-neutral-400";
                      const isLast = i === ticket.timeline.length - 1;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.08 }}
                          className="relative flex gap-3 pb-5 last:pb-0"
                          onMouseEnter={() => setHoveredTimelineIdx(i)}
                          onMouseLeave={() => setHoveredTimelineIdx(null)}
                        >
                          <div
                            className={`relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-2 border-white text-white shadow-sm transition-all duration-200 ${dotColor} ${isLast ? "ring-2 ring-green-200" : ""}`}
                          >
                            {icon}
                            {isLast && !isResolvedOrClosed && (
                              <span className="absolute inset-0 rounded-full animate-ping bg-green-400 opacity-20" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 pt-0.5">
                            <p className="text-sm font-medium text-neutral-800">
                              {label}
                            </p>
                            {entry.note && (
                              <p className="mt-0.5 text-xs text-neutral-500">
                                {entry.note}
                              </p>
                            )}
                            <div
                              className={`mt-0.5 transition-all duration-200 ${hoveredTimelineIdx === i ? "opacity-100" : "opacity-60"}`}
                            >
                              <p className="text-xs text-neutral-400">
                                {new Date(entry.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Feedback link for resolved tickets */}
            {isResolvedOrClosed && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
                    <MessageSquare size={16} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">
                      Your complaint has been resolved
                    </p>
                    <p className="mt-1 text-xs text-green-700">
                      We value your feedback. Let us know how we handled your
                      complaint.
                    </p>
                    <Link
                      href="/#feedback"
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
                    >
                      <MessageSquare size={12} />
                      Submit Feedback
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
              >
                <Printer size={14} />
                Print
              </button>
              <button
                onClick={handleShare}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2 text-sm font-medium transition-all duration-200 ${
                  shareCopied
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                <Share2 size={14} />
                {shareCopied ? "Copied!" : "Share"}
              </button>
              <button
                onClick={handleDownloadReport}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
              >
                <Download size={14} />
                Download
              </button>
            </div>

            <Link
              href="/track"
              className="block w-full rounded-lg border border-neutral-300 bg-neutral-50 py-2.5 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <ArrowLeft size={14} className="inline mr-1" />
              Back to Track Page
            </Link>

            <Link
              href="/report"
              className="block w-full rounded-lg bg-green-600 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              <Plus size={14} className="inline mr-1" />
              Submit New Complaint
            </Link>
          </div>
        </motion.div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-5"
        >
          <h3 className="mb-3 text-sm font-semibold text-neutral-800">
            Contact Support
          </h3>
          <div className="space-y-3">
            <a
              href="mailto:support@kwaramoc.kw.gov.ng"
              className="flex items-center gap-3 text-sm text-neutral-600 transition-colors hover:text-green-600"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
                <Mail size={16} className="text-green-600" />
              </div>
              <div>
                <p className="font-medium text-neutral-700">Email Support</p>
                <p className="text-xs text-neutral-500">
                  support@kwaramoc.kw.gov.ng
                </p>
              </div>
            </a>
            <a
              href="tel:+2340000000000"
              className="flex items-center gap-3 text-sm text-neutral-600 transition-colors hover:text-green-600"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
                <Phone size={16} className="text-green-600" />
              </div>
              <div>
                <p className="font-medium text-neutral-700">Phone Support</p>
                <p className="text-xs text-neutral-500">
                  +234 000 000 0000 (Mon-Fri, 8am-4pm)
                </p>
              </div>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
