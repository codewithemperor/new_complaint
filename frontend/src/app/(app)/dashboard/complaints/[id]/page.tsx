"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import { SlaStatus } from "@/components/SlaStatus";
import { ReminderManager } from "@/components/ReminderManager";
import { useSession } from "@/lib/session";
import { useBreadcrumbStore } from "@/lib/breadcrumb-store";
import type {
  Ticket,
  Minute,
  Department,
  PaginatedResponse,
} from "@/lib/types";
import {
  ArrowLeft,
  Clock,
  FileText,
  User,
  Mail,
  Phone,
  Tag,
  Building2,
  Shield,
  Lock,
  MessageSquare,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  Send,
  RotateCcw,
  Eye,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  StickyNote,
  Activity,
  Flag,
  Hash,
  Radio,
  Inbox,
  Printer,
  Share2,
  Zap,
  ArrowUpRight,
  XCircle,
  ClipboardCheck,
  Link2,
  Calendar,
  Timer,
  ExternalLink,
  Copy,
  Check,
  Download,
} from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600";

const STATUS_BADGE: Record<string, string> = {
  ACKNOWLEDGED: "bg-slate-100 text-slate-700",
  TRIAGED: "bg-purple-100 text-purple-700",
  ASSIGNED: "bg-violet-100 text-violet-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-neutral-50 text-muted-foreground",
  REOPENED: "bg-orange-100 text-orange-700",
  ESCALATED: "bg-red-100 text-red-700",
  REFERRED: "bg-violet-100 text-violet-700",
};

const STATUS_LABELS: Record<string, string> = {
  ACKNOWLEDGED: "Received",
  TRIAGED: "Being Routed",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "Under Investigation",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  REOPENED: "Reopened",
  ESCALATED: "Escalated",
  REFERRED: "Referred",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  ACKNOWLEDGED: <Inbox className="h-3.5 w-3.5" />,
  TRIAGED: <ArrowRightLeft className="h-3.5 w-3.5" />,
  ASSIGNED: <User className="h-3.5 w-3.5" />,
  IN_PROGRESS: <Activity className="h-3.5 w-3.5" />,
  PENDING_APPROVAL: <Clock className="h-3.5 w-3.5" />,
  APPROVED: <CheckCircle2 className="h-3.5 w-3.5" />,
  RESOLVED: <CheckCircle2 className="h-3.5 w-3.5" />,
  CLOSED: <CheckCircle2 className="h-3.5 w-3.5" />,
  REOPENED: <RotateCcw className="h-3.5 w-3.5" />,
  ESCALATED: <AlertTriangle className="h-3.5 w-3.5" />,
  REFERRED: <ArrowRightLeft className="h-3.5 w-3.5" />,
};

/* ------------------------------------------------------------------ */
/*  Priority badge (P1-P4 scale)                                      */
/* ------------------------------------------------------------------ */

const PRIORITY_MAP: Record<
  string,
  { label: string; color: string; dotColor: string; ringColor: string }
> = {
  P1: {
    label: "P1 - Critical",
    color: "bg-red-100 text-red-700 border-red-200",
    dotColor: "bg-red-500",
    ringColor: "ring-red-400/30",
  },
  P2: {
    label: "P2 - High",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    dotColor: "bg-amber-500",
    ringColor: "ring-amber-400/30",
  },
  P3: {
    label: "P3 - Medium",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    dotColor: "bg-slate-500",
    ringColor: "ring-slate-400/30",
  },
  P4: {
    label: "P4 - Low",
    color: "bg-green-100 text-green-700 border-green-200",
    dotColor: "bg-green-500",
    ringColor: "ring-green-400/30",
  },
  HIGH: {
    label: "P1 - Critical",
    color: "bg-red-100 text-red-700 border-red-200",
    dotColor: "bg-red-500",
    ringColor: "ring-red-400/30",
  },
  MEDIUM: {
    label: "P2 - High",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    dotColor: "bg-amber-500",
    ringColor: "ring-amber-400/30",
  },
  LOW: {
    label: "P3 - Medium",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    dotColor: "bg-slate-500",
    ringColor: "ring-slate-400/30",
  },
};

/* ------------------------------------------------------------------ */
/*  Timeline dot color map                                             */
/* ------------------------------------------------------------------ */

const MOVEMENT_DOT_COLOR: Record<string, string> = {
  STATUS_CHANGE: "bg-green-500",
  ASSIGNMENT: "bg-violet-500",
  DEPARTMENT_TRANSFER: "bg-amber-500",
  ESCALATION: "bg-red-500",
  REOPEN: "bg-orange-500",
  APPROVAL_REQUEST: "bg-yellow-500",
  INFO_REQUEST: "bg-green-500",
  RESOLUTION: "bg-green-500",
};

const MOVEMENT_ICON: Record<string, React.ReactNode> = {
  STATUS_CHANGE: <ArrowRightLeft className="h-3.5 w-3.5" />,
  ASSIGNMENT: <User className="h-3.5 w-3.5" />,
  DEPARTMENT_TRANSFER: <Building2 className="h-3.5 w-3.5" />,
  ESCALATION: <AlertTriangle className="h-3.5 w-3.5" />,
  REOPEN: <RotateCcw className="h-3.5 w-3.5" />,
  APPROVAL_REQUEST: <Shield className="h-3.5 w-3.5" />,
  INFO_REQUEST: <Mail className="h-3.5 w-3.5" />,
  RESOLUTION: <CheckCircle2 className="h-3.5 w-3.5" />,
};

/* ------------------------------------------------------------------ */
/*  Metadata field component                                           */
/* ------------------------------------------------------------------ */

function MetaField({
  icon,
  label,
  value,
  fallback = "\u2014",
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  fallback?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground">
          {value ?? fallback}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeleton Loading                                                   */
/* ------------------------------------------------------------------ */

function TicketDetailSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Back button skeleton */}
      <div className="h-4 w-28 rounded bg-neutral-200" />

      {/* Quick actions skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-lg bg-neutral-200" />
        ))}
      </div>

      {/* Main two-column layout skeleton */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left column skeleton */}
        <div className="space-y-5 lg:col-span-2">
          {/* Header card skeleton */}
          <div className="rounded-xl border border-border bg-neutral-50 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-5 w-24 rounded bg-neutral-200" />
              <div className="h-5 w-20 rounded-full bg-neutral-50" />
              <div className="h-5 w-16 rounded-full bg-neutral-50" />
            </div>
            <div className="h-6 w-80 rounded bg-neutral-200" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  <div className="h-3 w-12 rounded bg-neutral-50" />
                  <div className="mt-1.5 h-4 w-20 rounded bg-neutral-200" />
                </div>
              ))}
            </div>
            <div className="h-24 rounded-lg bg-neutral-50" />
          </div>

          {/* Minutes skeleton */}
          <div className="rounded-xl border border-border bg-neutral-50 p-6 space-y-3">
            <div className="h-5 w-32 rounded bg-neutral-200" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-neutral-50 p-4 space-y-2"
                >
                  <div className="flex justify-between">
                    <div className="h-4 w-24 rounded bg-neutral-200" />
                    <div className="h-3 w-20 rounded bg-neutral-50" />
                  </div>
                  <div className="h-3 w-full rounded bg-neutral-50" />
                  <div className="h-3 w-3/4 rounded bg-neutral-50" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column skeleton */}
        <div className="space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-neutral-50 p-5 space-y-3"
            >
              <div className="h-4 w-20 rounded bg-neutral-200" />
              <div className="h-3 w-full rounded bg-neutral-50" />
              <div className="h-3 w-2/3 rounded bg-neutral-50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick Action Button                                                */
/* ------------------------------------------------------------------ */

function QuickActionButton({
  icon,
  label,
  variant = "ghost",
  onPress,
  isDisabled = false,
  isLoading = false,
  colorClass = "",
}: {
  icon: React.ReactNode;
  label: string;
  variant?: "ghost" | "primary";
  onPress?: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
  colorClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={isDisabled || isLoading}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        variant === "primary"
          ? "border-green-600 bg-green-600 text-white hover:bg-green-700"
          : colorClass
            ? colorClass
            : "border-border bg-neutral-50 text-foreground hover:bg-neutral-50 hover:border-border"
      }`}
    >
      {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Ticket Detail Page                                                 */
/* ------------------------------------------------------------------ */

/**
 * Admin / Super-Admin ticket detail page — full investigation workspace.
 *
 * Shows ticket metadata, SLA status, timeline of minutes + movements,
 * and action buttons appropriate to the ticket's current status.
 */
export default function AdminTicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSession();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [minuteBody, setMinuteBody] = useState("");
  const [minuteInternal, setMinuteInternal] = useState(false);
  const [posting, setPosting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showMinuteForm, setShowMinuteForm] = useState(false);

  // Reassign modal
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [reassignDeptId, setReassignDeptId] = useState("");
  const [reassignNote, setReassignNote] = useState("");
  const [reassigning, setReassigning] = useState(false);

  // Info request modal
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoText, setInfoText] = useState("");
  const [submittingInfo, setSubmittingInfo] = useState(false);

  // Resolution modal
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionText, setResolutionText] = useState("");
  const [submittingResolution, setSubmittingResolution] = useState(false);

  // Escalate modal
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateNote, setEscalateNote] = useState("");
  const [escalating, setEscalating] = useState(false);

  // Close modal
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closing, setClosing] = useState(false);

  // Related tickets
  const [relatedTickets, setRelatedTickets] = useState<Ticket[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Share feedback
  const [copied, setCopied] = useState(false);

  // Acknowledge/Classify loading
  const [acknowledging, setAcknowledging] = useState(false);
  const [classifying, setClassifying] = useState(false);

  const setBreadcrumbTitle = useBreadcrumbStore((s) => s.setCustomTitle);

  const fetchTicket = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<Ticket>(`/tickets/${params.id}/detail`);
      setTicket(data);
      // Set breadcrumb to ticket code instead of UUID
      if (data.ticketCode) {
        setBreadcrumbTitle(data.ticketCode);
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load ticket.",
      );
    } finally {
      setLoading(false);
    }
  }, [params.id, setBreadcrumbTitle]);

  const fetchRelatedTickets = useCallback(
    async (t: Ticket) => {
      setLoadingRelated(true);
      try {
        const deptId = t.departmentId;
        const citizenEmail = t.citizen?.email;
        const canViewCrossDepartmentRelated =
          user?.role === "ADMIN" ||
          user?.role === "PERMANENT_SECRETARY" ||
          user?.role === "COMMISSIONER";
        const canViewDepartmentRelated =
          canViewCrossDepartmentRelated ||
          (!!deptId && deptId === user?.departmentId);
        let related: Ticket[] = [];

        if (deptId && canViewDepartmentRelated) {
          const deptRes = await api.get<PaginatedResponse<Ticket>>(
            `/tickets?departmentId=${deptId}&pageSize=5`,
          );
          related = deptRes.items.filter(
            (rt) =>
              rt.id !== t.id &&
              (canViewCrossDepartmentRelated ||
                rt.departmentId === user?.departmentId),
          );
        }

        if (
          canViewCrossDepartmentRelated &&
          citizenEmail &&
          related.length < 5
        ) {
          const citizenRes = await api.get<PaginatedResponse<Ticket>>(
            `/tickets?search=${encodeURIComponent(citizenEmail)}&pageSize=5`,
          );
          const citizenRelated = citizenRes.items.filter(
            (rt) => rt.id !== t.id && !related.some((r) => r.id === rt.id),
          );
          related = [...related, ...citizenRelated].slice(0, 5);
        }

        setRelatedTickets(related);
      } catch {
        // Silently fail: related tickets are only supporting context.
      } finally {
        setLoadingRelated(false);
      }
    },
    [user?.departmentId, user?.role],
  );

  // Clear breadcrumb custom title when leaving the page
  useEffect(() => {
    return () => {
      setBreadcrumbTitle(null);
    };
  }, [setBreadcrumbTitle]);

  useEffect(() => {
    fetchTicket();
    api
      .get<Department[]>("/departments")
      .then(setDepartments)
      .catch(() => {});
  }, [fetchTicket]);

  // Fetch related tickets when ticket loads
  useEffect(() => {
    if (ticket) {
      fetchRelatedTickets(ticket);
    }
  }, [ticket, fetchRelatedTickets]);

  // Auto-dismiss success messages
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  async function handleAcknowledge() {
    setAcknowledging(true);
    setActionError(null);
    try {
      await api.patch(`/tickets/${params.id}/acknowledge`);
      setActionSuccess("Ticket acknowledged.");
      fetchTicket();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to acknowledge ticket.",
      );
    } finally {
      setAcknowledging(false);
    }
  }

  async function handleClassify() {
    setClassifying(true);
    setActionError(null);
    try {
      await api.patch(`/tickets/${params.id}/classify`);
      setActionSuccess("Ticket classified and routed.");
      fetchTicket();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to classify ticket.",
      );
    } finally {
      setClassifying(false);
    }
  }

  async function handleStart() {
    setActionError(null);
    try {
      await api.patch(`/tickets/${params.id}/start`);
      setActionSuccess("Investigation started.");
      fetchTicket();
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Failed to start investigation.",
      );
    }
  }

  async function handlePostMinute() {
    if (!minuteBody.trim()) return;
    setPosting(true);
    setActionError(null);
    try {
      await api.post(`/tickets/${params.id}/minutes`, {
        body: minuteBody,
        isInternal: minuteInternal,
      });
      setMinuteBody("");
      setMinuteInternal(false);
      setShowMinuteForm(false);
      fetchTicket();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to post minute.",
      );
    } finally {
      setPosting(false);
    }
  }

  async function handleRequestInfo() {
    if (!infoText.trim()) return;
    setSubmittingInfo(true);
    setActionError(null);
    try {
      await api.post(`/tickets/${params.id}/request-info`, {
        requestText: infoText,
      });
      setInfoText("");
      setShowInfoModal(false);
      setActionSuccess("Information request sent to citizen.");
      fetchTicket();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to request info.",
      );
    } finally {
      setSubmittingInfo(false);
    }
  }

  async function handleRequestApproval() {
    setActionError(null);
    try {
      await api.patch(`/tickets/${params.id}/request-approval`);
      setActionSuccess("Approval requested from HOD.");
      fetchTicket();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to request approval.",
      );
    }
  }

  async function handleSubmitResolution() {
    if (!resolutionText.trim()) return;
    setSubmittingResolution(true);
    setActionError(null);
    try {
      await api.post(`/tickets/${params.id}/resolution`, { resolutionText });
      setResolutionText("");
      setShowResolutionModal(false);
      setActionSuccess("Resolution submitted. Citizen notified.");
      fetchTicket();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to submit resolution.",
      );
    } finally {
      setSubmittingResolution(false);
    }
  }

  async function handleEscalate() {
    if (!escalateNote.trim()) return;
    setEscalating(true);
    setActionError(null);
    try {
      await api.patch(`/tickets/${params.id}/escalate`, { note: escalateNote });
      setEscalateNote("");
      setShowEscalateModal(false);
      setActionSuccess("Ticket escalated.");
      fetchTicket();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to escalate ticket.",
      );
    } finally {
      setEscalating(false);
    }
  }

  async function handleClose() {
    setClosing(true);
    setActionError(null);
    try {
      await api.patch(`/tickets/${params.id}/close`);
      setShowCloseModal(false);
      setActionSuccess("Ticket closed.");
      fetchTicket();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to close ticket.",
      );
    } finally {
      setClosing(false);
    }
  }

  async function handleReassign() {
    if (!reassignDeptId) return;
    setReassigning(true);
    setActionError(null);
    try {
      // Reassignment reuses the triage endpoint (which re-routes the ticket).
      // Send the existing category/priority so the call stays valid.
      await api.patch(`/tickets/${params.id}/triage`, {
        departmentId: reassignDeptId,
        category: ticket?.category ?? "Admin Department",
        priority: ticket?.priority ?? "P3",
        triageNote: reassignNote || "Reassigned to another department",
      });
      setReassignDeptId("");
      setReassignNote("");
      setShowReassignModal(false);
      setActionSuccess("Ticket reassigned.");
      fetchTicket();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Failed to reassign ticket.",
      );
    } finally {
      setReassigning(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleShare() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return <TicketDetailSkeleton />;
  }
  if (error || !ticket) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-border bg-neutral-50 shadow-sm">
          <div className="p-6">
            <p className="py-6 text-center text-sm text-red-600">
              {error ?? "Ticket not found."}
            </p>
            <div className="text-center">
              <button
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-neutral-50"
                onClick={() => router.back()}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const minutes = ticket.minutes ?? [];
  // Deduplicate movements by id (each TicketMovement row has a unique UUID PK).
  const movements = (() => {
    const raw = ticket.movements ?? [];
    const seen = new Set<string>();
    return raw.filter((mv) => {
      if (seen.has(mv.id)) return false;
      seen.add(mv.id);
      return true;
    });
  })();

  // Merge into chronological timeline
  const timeline: {
    kind: "minute" | "movement";
    createdAt: string;
    data: Minute | (typeof movements)[number];
  }[] = [
    ...minutes.map((m) => ({
      kind: "minute" as const,
      createdAt: m.createdAt,
      data: m,
    })),
    ...movements.map((mv) => ({
      kind: "movement" as const,
      createdAt: mv.createdAt,
      data: mv,
    })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const statusAllowsWork = [
    "ASSIGNED",
    "IN_PROGRESS",
    "PENDING_APPROVAL",
    "APPROVED",
    "REOPENED",
  ].includes(ticket.status);
  const isAdmin = user?.role === "ADMIN";
  const isSuperAdmin = !!user?.isSuperAdmin;
  const canReassign = isAdmin;
  const isAssignedOfficer = ticket.assignedOfficerId === user?.id;
  const isDepartmentHod =
    user?.role === "DEPARTMENT_HOD" &&
    !!ticket.departmentId &&
    ticket.departmentId === user.departmentId;
  const canWorkOnTicket = isSuperAdmin || isAssignedOfficer || isDepartmentHod;
  const canAct = statusAllowsWork && canWorkOnTicket;

  // Priority info
  const priorityInfo = ticket.priority ? PRIORITY_MAP[ticket.priority] : null;

  // Format date for display
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateShort = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
    });
  };

  const formatTimeShort = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Compute SLA time remaining display
  const getSlaDisplay = () => {
    if (!ticket.slaStartedAt || !ticket.slaTargetHours) return null;
    const remaining = ticket.slaRemainingHours ?? ticket.slaTargetHours;
    const breached = ticket.slaBreached || remaining <= 0;
    if (breached) {
      const overdue = Math.abs(remaining);
      if (overdue < 24)
        return { text: `${overdue.toFixed(1)}h overdue`, color: "red" };
      return { text: `${(overdue / 24).toFixed(1)}d overdue`, color: "red" };
    }
    if (remaining < 1)
      return {
        text: `${Math.round(remaining * 60)}m remaining`,
        color: "amber",
      };
    if (remaining < 24)
      return { text: `${remaining.toFixed(1)}h remaining`, color: "amber" };
    return {
      text: `${(remaining / 24).toFixed(1)}d remaining`,
      color: "green",
    };
  };

  const slaDisplay = getSlaDisplay();

  // Determine which quick actions are available
  const showAcknowledge = ticket.status === "ACKNOWLEDGED" && isAdmin;
  const showClassify = ticket.status === "ACKNOWLEDGED" && isAdmin;
  const showAssign =
    ["TRIAGED", "ACKNOWLEDGED"].includes(ticket.status) && canReassign;
  const showEscalate =
    ["IN_PROGRESS", "ASSIGNED", "PENDING_APPROVAL"].includes(ticket.status) &&
    (canAct || isSuperAdmin);
  const showResolve =
    ticket.status === "IN_PROGRESS" && (canAct || isSuperAdmin);
  const showClose =
    ["RESOLVED", "APPROVED"].includes(ticket.status) &&
    (isSuperAdmin || canAct);

  return (
    <div className="space-y-5">
      {/* Back to list navigation */}
      <button
        onClick={() =>
          router.push(
            user?.role === "DEPARTMENT_STAFF"
              ? "/dashboard/queue"
              : "/dashboard/complaints",
          )
        }
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-green-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to list
      </button>

      {/* Quick Actions Bar */}
      {(showAcknowledge ||
        showClassify ||
        showAssign ||
        showEscalate ||
        showResolve ||
        showClose) && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-neutral-50 p-3 shadow-sm print:hidden">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quick Actions
          </span>
          {showAcknowledge && (
            <QuickActionButton
              icon={<Inbox className="h-3.5 w-3.5" />}
              label="Acknowledge"
              onPress={handleAcknowledge}
              isLoading={acknowledging}
              colorClass="border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            />
          )}
          {showClassify && (
            <QuickActionButton
              icon={<ArrowRightLeft className="h-3.5 w-3.5" />}
              label="Classify"
              onPress={handleClassify}
              isLoading={classifying}
              colorClass="border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
            />
          )}
          {showAssign && (
            <QuickActionButton
              icon={<User className="h-3.5 w-3.5" />}
              label="Assign"
              onPress={() => setShowReassignModal(true)}
              colorClass="border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
            />
          )}
          {showEscalate && (
            <QuickActionButton
              icon={<ArrowUpRight className="h-3.5 w-3.5" />}
              label="Escalate"
              onPress={() => setShowEscalateModal(true)}
              colorClass="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
            />
          )}
          {showResolve && (
            <QuickActionButton
              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
              label="Resolve"
              onPress={() => setShowResolutionModal(true)}
              colorClass="border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
            />
          )}
          {showClose && (
            <QuickActionButton
              icon={<XCircle className="h-3.5 w-3.5" />}
              label="Close"
              onPress={() => setShowCloseModal(true)}
              colorClass="border-border bg-neutral-50 text-foreground hover:bg-neutral-200"
            />
          )}
        </div>
      )}

      {/* Status messages */}
      {actionError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 print:hidden">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {actionError}
          <button
            onClick={() => setActionError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}
      {actionSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 print:hidden">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {actionSuccess}
          <button
            onClick={() => setActionSuccess(null)}
            className="ml-auto text-green-400 hover:text-green-600"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left column — main content */}
        <div className="space-y-5 lg:col-span-2">
          {/* Header Card */}
          <div className="rounded-xl border border-border bg-neutral-50 shadow-sm">
            <div className="p-5 sm:p-6 space-y-5">
              {/* Status + Priority + SLA + Print/Share row */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-sm font-semibold text-green-700">
                    {ticket.ticketCode}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      STATUS_BADGE[ticket.status] ??
                      "bg-neutral-50 text-muted-foreground"
                    }`}
                  >
                    {STATUS_ICON[ticket.status] ?? (
                      <FileText className="h-3.5 w-3.5" />
                    )}
                    {STATUS_LABELS[ticket.status] ??
                      ticket.status.replace(/_/g, " ")}
                  </span>
                  {/* Priority badge (P1-P4) */}
                  {priorityInfo && (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ring-2 ${priorityInfo.color} ${priorityInfo.ringColor}`}
                    >
                      <Flag className="h-3 w-3" />
                      {priorityInfo.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <SlaStatus
                    status={ticket.status}
                    awaiting={ticket.awaiting}
                    slaStartedAt={ticket.slaStartedAt}
                    slaTargetHours={ticket.slaTargetHours}
                    slaRemainingHours={ticket.slaRemainingHours}
                    slaBreached={ticket.slaBreached}
                    feedbackSatisfied={ticket.feedback?.satisfied}
                  />
                  {/* Print & Share */}
                  <button
                    onClick={handlePrint}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-neutral-50 hover:text-foreground transition-colors print:hidden"
                    title="Print ticket"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleShare}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-neutral-50 hover:text-foreground transition-colors print:hidden"
                    title="Share ticket"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Share2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Subject */}
              <h1 className="text-lg font-semibold text-foreground">
                {ticket.subject}
              </h1>

              {/* Ticket metadata grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                <MetaField
                  icon={<Flag className="h-3.5 w-3.5" />}
                  label="Priority"
                  value={priorityInfo?.label ?? ticket.priority}
                />
                <MetaField
                  icon={<Tag className="h-3.5 w-3.5" />}
                  label="Category"
                  value={
                    ticket.category
                      ? ticket.category.replace(/_/g, " ")
                      : undefined
                  }
                />
                <MetaField
                  icon={<Building2 className="h-3.5 w-3.5" />}
                  label="Department"
                  value={ticket.department?.name}
                />
                <MetaField
                  icon={<User className="h-3.5 w-3.5" />}
                  label="Assigned Officer"
                  value={ticket.assignedOfficer?.fullName}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                <MetaField
                  icon={<User className="h-3.5 w-3.5" />}
                  label="Citizen"
                  value={ticket.citizen?.name ?? "Anonymous"}
                />
                <MetaField
                  icon={<Mail className="h-3.5 w-3.5" />}
                  label="Email"
                  value={ticket.citizen?.email}
                />
                <MetaField
                  icon={<Phone className="h-3.5 w-3.5" />}
                  label="Phone"
                  value={ticket.citizen?.phone}
                />
                <MetaField
                  icon={<Radio className="h-3.5 w-3.5" />}
                  label="Channel"
                  value={ticket.channel?.replace(/_/g, " ")}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                <MetaField
                  icon={<Hash className="h-3.5 w-3.5" />}
                  label="LGA"
                  value={ticket.lga?.replace(/_/g, " ")}
                />
                <MetaField
                  icon={<Calendar className="h-3.5 w-3.5" />}
                  label="Created"
                  value={formatDateTime(ticket.createdAt)}
                />
                <MetaField
                  icon={<Clock className="h-3.5 w-3.5" />}
                  label="Last Updated"
                  value={
                    ticket.updatedAt
                      ? formatDateTime(ticket.updatedAt)
                      : undefined
                  }
                />
              </div>

              {/* Description */}
              {ticket.description && (
                <div className="rounded-lg border border-border bg-neutral-50/50 p-4">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Description
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {ticket.description}
                  </p>
                </div>
              )}

              {/* Attached documents / evidence */}
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="rounded-lg border border-border bg-neutral-50/50 p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Attachments ({ticket.attachments.length})
                  </p>
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {ticket.attachments.map((att) => {
                      const isImg = att.mimetype?.startsWith("image/");
                      const url =
                        att.url ??
                        (att.storedPath ? `/uploads/${att.storedPath}` : "");
                      const href = url.startsWith("http")
                        ? url
                        : `${API_BASE_URL}${url}`;
                      return (
                        <li key={att.id}>
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-3 rounded-lg border border-border bg-neutral-50 p-2.5 transition-colors hover:border-green-300 hover:bg-green-50/50"
                          >
                            {isImg ? (
                              <img
                                src={href}
                                alt={att.filename}
                                className="h-11 w-11 shrink-0 rounded-md bg-neutral-100 object-contain"
                              />
                            ) : (
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-neutral-50 text-muted-foreground">
                                <FileText className="h-5 w-5" />
                              </span>
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-foreground">
                                {att.filename}
                              </span>
                              <span className="block text-[11px] text-muted-foreground">
                                {att.mimetype} ·{" "}
                                {att.sizeBytes
                                  ? `${Math.round(att.sizeBytes / 1024)} KB`
                                  : ""}
                              </span>
                            </span>
                            <Download className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-green-600" />
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Action buttons (contextual) */}
              {(canAct || isSuperAdmin) && (
                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4 print:hidden">
                  {(ticket.status === "ASSIGNED" || ticket.status === "REOPENED") && (
                    <button
                      className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                      onClick={handleStart}
                    >
                      <Activity className="mr-1.5 h-4 w-4" />
                      {ticket.status === "REOPENED"
                        ? "Resume Investigation"
                        : "Start Investigation"}
                    </button>
                  )}
                  {ticket.status === "IN_PROGRESS" && (
                    <>
                      <button
                        className="rounded-lg flex items-center bg-amber-200 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-neutral-50"
                        onClick={() => setShowInfoModal(true)}
                      >
                        <Mail className="mr-1.5 h-4 w-4" />
                        Request Info
                      </button>
                      <button
                        className="rounded-lg flex items-center bg-secondary-200 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-neutral-50"
                        onClick={handleRequestApproval}
                      >
                        <Shield className="mr-1.5 h-4 w-4" />
                        Request Approval
                      </button>
                      <button
                        className="rounded-lg flex items-center bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                        onClick={() => setShowResolutionModal(true)}
                      >
                        <CheckCircle2 className="mr-1.5 h-4 w-4" />
                        Submit Resolution
                      </button>
                    </>
                  )}
                  {/* Reminder scheduler (Phase 8.2 PWA) */}
                  <div className="ml-auto">
                    <ReminderManager
                      ticketId={ticket.id}
                      ticketCode={ticket.ticketCode}
                      ticketSubject={ticket.subject}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Post Minute Section */}
          {(canAct || isSuperAdmin) && ticket.status !== "ASSIGNED" && (
            <div className="rounded-xl border border-border bg-neutral-50 shadow-sm print:hidden">
              <div className="p-5 sm:p-6">
                <button
                  onClick={() => setShowMinuteForm(!showMinuteForm)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-600">
                      <StickyNote className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Post Investigation Minute
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Add findings, notes, or action items
                      </p>
                    </div>
                  </div>
                  {showMinuteForm ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {showMinuteForm && (
                  <div className="mt-4 space-y-3 border-t border-border pt-4">
                    <textarea
                      value={minuteBody}
                      onChange={(e) => setMinuteBody(e.target.value)}
                      rows={4}
                      className={`${inputClass} resize-y`}
                      placeholder="Investigation note, finding, or action taken..."
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={minuteInternal}
                          onChange={(e) => setMinuteInternal(e.target.checked)}
                          className="rounded border-border text-green-600 focus:ring-green-600"
                        />
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        Internal (hidden from citizen)
                      </label>
                      <button
                        className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        onClick={handlePostMinute}
                        disabled={posting || !minuteBody.trim()}
                      >
                        {posting ? (
                          <>
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />{" "}
                            Posting...
                          </>
                        ) : (
                          <>
                            <Send className="mr-1.5 h-4 w-4" /> Post Minute
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes/Minutes Section */}
          {minutes.length > 0 && (
            <div className="rounded-xl border border-border bg-neutral-50 shadow-sm">
              <div className="p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                    <StickyNote className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      Notes &amp; Minutes
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {minutes.length} note{minutes.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="max-h-96 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                  {minutes.map((m, i) => (
                    <div
                      key={m.id ?? i}
                      className={`rounded-lg border ${
                        m.isInternal
                          ? "border-border bg-neutral-50"
                          : "border-green-100 bg-neutral-50"
                      } p-3 sm:p-4`}
                    >
                      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full ${
                              m.isInternal
                                ? "bg-neutral-200 text-muted-foreground"
                                : "bg-green-100 text-green-600"
                            }`}
                          >
                            {m.isInternal ? (
                              <Lock className="h-3 w-3" />
                            ) : (
                              <MessageSquare className="h-3 w-3" />
                            )}
                          </div>
                          <span className="text-xs font-semibold text-foreground">
                            {m.author?.fullName ?? "System"}
                          </span>
                          {m.author?.designation && (
                            <span className="text-[10px] text-muted-foreground">
                              {m.author.designation}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(m.createdAt)}
                        </div>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {m.body}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.isInternal && (
                          <span className="inline-flex items-center gap-1 rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            <Lock className="h-2.5 w-2.5" /> Internal
                          </span>
                        )}
                        {m.isResolutionDraft && (
                          <span className="inline-flex items-center gap-1 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Resolution
                            draft
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column — sidebar */}
        <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          {/* SLA Status Card */}
          <div className="rounded-xl border border-border bg-neutral-50 shadow-sm">
            <div className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 text-green-600">
                  <Timer className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  SLA Status
                </h3>
              </div>
              <SlaStatus
                status={ticket.status}
                awaiting={ticket.awaiting}
                slaStartedAt={ticket.slaStartedAt}
                slaTargetHours={ticket.slaTargetHours}
                slaRemainingHours={ticket.slaRemainingHours}
                slaBreached={ticket.slaBreached}
                feedbackSatisfied={ticket.feedback?.satisfied}
              />
              {slaDisplay && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Time remaining
                    </span>
                    <span
                      className={`font-semibold ${
                        slaDisplay.color === "red"
                          ? "text-red-600"
                          : slaDisplay.color === "amber"
                            ? "text-amber-600"
                            : "text-green-600"
                      }`}
                    >
                      {slaDisplay.text}
                    </span>
                  </div>
                  {ticket.slaTargetHours && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Target</span>
                      <span className="font-medium text-foreground">
                        {ticket.slaTargetHours}h
                      </span>
                    </div>
                  )}
                  {ticket.slaStartedAt && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Started</span>
                      <span className="font-medium text-foreground">
                        {formatDateTime(ticket.slaStartedAt)}
                      </span>
                    </div>
                  )}
                  {ticket.awaiting && ticket.awaiting !== "NONE" && (
                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        <span className="font-semibold">Clock paused</span>
                      </div>
                      <p className="mt-0.5 text-amber-600">
                        Awaiting: {ticket.awaiting.replace(/_/g, " ")}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Department Info Card */}
          <div className="rounded-xl border border-border bg-neutral-50 shadow-sm">
            <div className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <Building2 className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  Department
                </h3>
              </div>
              {ticket.department ? (
                <div className="space-y-2">
                  <div className="rounded-lg border border-border bg-neutral-50 p-3">
                    <p className="text-sm font-semibold text-foreground">
                      {ticket.department.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Code: {ticket.department.code}
                    </p>
                  </div>
                  {canReassign && (
                    <button
                      onClick={() => setShowReassignModal(true)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-neutral-50 hover:text-foreground transition-colors print:hidden"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      Transfer Department
                    </button>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-neutral-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    No department assigned
                  </p>
                  {canReassign && (
                    <button
                      onClick={() => setShowReassignModal(true)}
                      className="mt-2 text-xs font-semibold text-green-600 hover:text-green-700 print:hidden"
                    >
                      Assign Department
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Assignee Info Card */}
          <div className="rounded-xl border border-border bg-neutral-50 shadow-sm">
            <div className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                  <User className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  Assignee
                </h3>
              </div>
              {ticket.assignedOfficer ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-neutral-50 p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-200 text-violet-700">
                      <span className="text-sm font-bold">
                        {ticket.assignedOfficer.fullName
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {ticket.assignedOfficer.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ticket.assignedOfficer.designation ??
                          ticket.assignedOfficer.role?.replace(/_/g, " ") ??
                          "Officer"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-neutral-50 p-3 text-center">
                  <User className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    No officer assigned
                  </p>
                  {canReassign && (
                    <button
                      onClick={() => setShowReassignModal(true)}
                      className="mt-2 text-xs font-semibold text-green-600 hover:text-green-700 print:hidden"
                    >
                      Assign Officer
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Timeline Sidebar */}
          <div className="rounded-xl border border-border bg-neutral-50 shadow-sm">
            <div className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 text-green-600">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Activity Timeline
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {timeline.length} event{timeline.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {timeline.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <FileText className="mb-2 h-6 w-6" />
                  <p className="text-xs">No activity yet.</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                  <div className="relative pl-5">
                    {/* Vertical timeline line */}
                    <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-neutral-200" />

                    {timeline.map((entry, i) => {
                      const isLast = i === timeline.length - 1;

                      if (entry.kind === "minute") {
                        const m = entry.data as Minute;
                        return (
                          <div
                            key={`minute-${i}`}
                            className={`relative ${isLast ? "" : "pb-4"}`}
                          >
                            {/* Timeline dot */}
                            <div
                              className={`absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                                m.isInternal ? "bg-neutral-400" : "bg-green-500"
                              }`}
                            />

                            {/* Content */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                {m.isInternal ? (
                                  <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
                                ) : (
                                  <MessageSquare className="h-3 w-3 shrink-0 text-green-500" />
                                )}
                                <span className="truncate text-xs font-medium text-foreground">
                                  {m.author?.fullName ?? "System"}
                                </span>
                              </div>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {formatDateShort(entry.createdAt)}{" "}
                                {formatTimeShort(entry.createdAt)}
                              </p>
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                                {m.body}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      // Movement entry
                      const mv = entry.data as (typeof movements)[number];
                      const mvType = mv.type ?? "STATUS_CHANGE";
                      const dotColor =
                        MOVEMENT_DOT_COLOR[mvType] ?? "bg-neutral-400";
                      const mvIcon = MOVEMENT_ICON[mvType] ?? (
                        <ArrowRightLeft className="h-2.5 w-2.5" />
                      );

                      return (
                        <div
                          key={`movement-${i}`}
                          className={`relative ${isLast ? "" : "pb-4"}`}
                        >
                          {/* Timeline dot with icon */}
                          <div
                            className={`absolute -left-5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ${dotColor} ring-2 ring-white`}
                          >
                            <div className="text-white scale-50">{mvIcon}</div>
                          </div>

                          {/* Content */}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground">
                              {mvType.replace(/_/g, " ")}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatDateShort(entry.createdAt)}{" "}
                              {formatTimeShort(entry.createdAt)}
                            </p>
                            {mv.note && (
                              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                                {mv.note}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related Tickets */}
          <div className="rounded-xl border border-border bg-neutral-50 shadow-sm">
            <div className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 text-green-600">
                  <Link2 className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  Related Tickets
                </h3>
              </div>

              {loadingRelated ? (
                <div className="space-y-2 animate-pulse">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-12 rounded-lg bg-neutral-50" />
                  ))}
                </div>
              ) : relatedTickets.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-neutral-50 p-3 text-center">
                  <Link2 className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    No related tickets found
                  </p>
                </div>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto custom-scrollbar">
                  {relatedTickets.map((rt) => (
                    <button
                      key={rt.id}
                      onClick={() =>
                        router.push(`/dashboard/complaints/${rt.id}`)
                      }
                      className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-neutral-50 p-2.5 text-left hover:border-green-200 hover:bg-green-50/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {rt.ticketCode}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {rt.subject}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span
                          className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                            STATUS_BADGE[rt.status] ??
                            "bg-neutral-50 text-muted-foreground"
                          }`}
                        >
                          {STATUS_LABELS[rt.status] ??
                            rt.status.replace(/_/g, " ")}
                        </span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full Timeline (expanded view) */}
      <div className="rounded-xl border border-border bg-neutral-50 shadow-sm">
        <div className="p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Full Activity Timeline
                </h2>
                <p className="text-xs text-muted-foreground">
                  {timeline.length} event{timeline.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          {timeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="mb-2 h-8 w-8" />
              <p className="text-sm">No activity yet.</p>
            </div>
          ) : (
            <div className="relative pl-6">
              {/* Vertical timeline line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-neutral-200" />

              {timeline.map((entry, i) => {
                const isLast = i === timeline.length - 1;

                if (entry.kind === "minute") {
                  const m = entry.data as Minute;
                  return (
                    <div
                      key={`minute-${i}`}
                      className={`relative ${isLast ? "" : "pb-5"}`}
                    >
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-6 top-1 flex h-5 w-5 items-center justify-center rounded-full ${
                          m.isInternal ? "bg-neutral-200" : "bg-green-100"
                        } ring-2 ring-white`}
                      >
                        {m.isInternal ? (
                          <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                        ) : (
                          <MessageSquare className="h-2.5 w-2.5 text-green-600" />
                        )}
                      </div>

                      {/* Content card */}
                      <div
                        className={`rounded-lg border ${
                          m.isInternal
                            ? "border-border bg-neutral-50"
                            : "border-green-100 bg-neutral-50"
                        } p-3 sm:p-4`}
                      >
                        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">
                              {m.author?.fullName ?? "System"}
                            </span>
                            {m.author?.designation && (
                              <span className="text-[10px] text-muted-foreground">
                                {m.author.designation}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(entry.createdAt)}
                          </div>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                          {m.body}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {m.isInternal && (
                            <span className="inline-flex items-center gap-1 rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              <Lock className="h-2.5 w-2.5" /> Internal
                            </span>
                          )}
                          {m.isResolutionDraft && (
                            <span className="inline-flex items-center gap-1 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                              <CheckCircle2 className="h-2.5 w-2.5" />{" "}
                              Resolution draft
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Movement entry
                const mv = entry.data as (typeof movements)[number];
                const mvType = mv.type ?? "STATUS_CHANGE";
                const dotColor = MOVEMENT_DOT_COLOR[mvType] ?? "bg-neutral-400";
                const mvIcon = MOVEMENT_ICON[mvType] ?? (
                  <ArrowRightLeft className="h-2.5 w-2.5" />
                );

                return (
                  <div
                    key={`movement-${i}`}
                    className={`relative ${isLast ? "" : "pb-5"}`}
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute -left-6 top-1 flex h-5 w-5 items-center justify-center rounded-full ${dotColor} ring-2 ring-white`}
                    >
                      <div className="text-white">{mvIcon}</div>
                    </div>

                    {/* Content */}
                    <div className="rounded-lg border border-border bg-neutral-50/50 p-3 sm:p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {mvType.replace(/_/g, " ")}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(entry.createdAt)}
                        </div>
                      </div>
                      {mv.note && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {mv.note}
                        </p>
                      )}
                      {/* Show from/to user if available */}
                      {("fromUser" in mv || "toUser" in mv) && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          {(
                            mv as (typeof movements)[number] & {
                              fromUser?: { fullName: string };
                            }
                          ).fromUser && (
                            <span className="flex items-center gap-1">
                              <ArrowRightLeft className="h-3 w-3" />
                              From:{" "}
                              {
                                (
                                  mv as (typeof movements)[number] & {
                                    fromUser: { fullName: string };
                                  }
                                ).fromUser.fullName
                              }
                            </span>
                          )}
                          {(
                            mv as (typeof movements)[number] & {
                              toUser?: { fullName: string };
                            }
                          ).toUser && (
                            <span className="flex items-center gap-1">
                              <ArrowRightLeft className="h-3 w-3" />
                              To:{" "}
                              {
                                (
                                  mv as (typeof movements)[number] & {
                                    toUser: { fullName: string };
                                  }
                                ).toUser.fullName
                              }
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Request Info modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowInfoModal(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-neutral-50 p-0 shadow-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  Request Information from Citizen
                </h2>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-neutral-50"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This pauses the deadline clock until the citizen responds.
                </p>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    What do you need?
                  </label>
                  <textarea
                    value={infoText}
                    onChange={(e) => setInfoText(e.target.value)}
                    rows={4}
                    className={`${inputClass} resize-y`}
                    placeholder="e.g. Please provide the date the incident occurred..."
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-neutral-50 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => setShowInfoModal(false)}
                  disabled={submittingInfo}
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleRequestInfo}
                  disabled={submittingInfo || !infoText.trim()}
                >
                  {submittingInfo ? "Sending…" : "Send Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolution modal */}
      {showResolutionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowResolutionModal(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-neutral-50 p-0 shadow-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  Submit Resolution
                </h2>
                <button
                  onClick={() => setShowResolutionModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-neutral-50"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  The citizen will be notified and asked to confirm. A 7-day
                  feedback window starts on submission.
                </p>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Resolution narrative *
                  </label>
                  <textarea
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    rows={6}
                    className={`${inputClass} resize-y`}
                    placeholder="Describe the findings, action taken, and outcome..."
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-neutral-50 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => setShowResolutionModal(false)}
                  disabled={submittingResolution}
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleSubmitResolution}
                  disabled={submittingResolution || !resolutionText.trim()}
                >
                  {submittingResolution ? "Submitting…" : "Submit Resolution"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Escalate modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowEscalateModal(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-neutral-50 p-0 shadow-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  Escalate Ticket
                </h2>
                <button
                  onClick={() => setShowEscalateModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-neutral-50"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Escalating this ticket will notify senior officials. The SLA
                  clock will continue running.
                </p>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Reason for escalation *
                  </label>
                  <textarea
                    value={escalateNote}
                    onChange={(e) => setEscalateNote(e.target.value)}
                    rows={4}
                    className={`${inputClass} resize-y`}
                    placeholder="Explain why this ticket needs escalation..."
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-neutral-50 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => setShowEscalateModal(false)}
                  disabled={escalating}
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleEscalate}
                  disabled={escalating || !escalateNote.trim()}
                >
                  {escalating ? "Escalating…" : "Escalate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCloseModal(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-neutral-50 p-0 shadow-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  Close Ticket
                </h2>
                <button
                  onClick={() => setShowCloseModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-neutral-50"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Closing this ticket will mark it as resolved. The citizen will
                  be notified. This action cannot be undone.
                </p>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-semibold">Confirm closure</span>
                  </div>
                  <p className="mt-1 text-amber-600">
                    Are you sure you want to close ticket {ticket.ticketCode}?
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-neutral-50 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => setShowCloseModal(false)}
                  disabled={closing}
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleClose}
                  disabled={closing}
                >
                  {closing ? "Closing…" : "Close Ticket"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reassign modal */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowReassignModal(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-neutral-50 p-0 shadow-2xl">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  Assign / Reassign Ticket
                </h2>
                <button
                  onClick={() => setShowReassignModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-neutral-50"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Department *
                  </label>
                  <select
                    value={reassignDeptId}
                    onChange={(e) => setReassignDeptId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select department...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Note
                  </label>
                  <textarea
                    value={reassignNote}
                    onChange={(e) => setReassignNote(e.target.value)}
                    rows={3}
                    className={`${inputClass} resize-y`}
                    placeholder="Reason for reassignment..."
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-neutral-50 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => setShowReassignModal(false)}
                  disabled={reassigning}
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleReassign}
                  disabled={reassigning || !reassignDeptId}
                >
                  {reassigning ? "Assigning…" : "Assign"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
