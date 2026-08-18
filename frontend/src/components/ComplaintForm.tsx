"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api, ApiError } from "@/lib/api";
import { CATEGORIES, DEPARTMENTS, LGAS, CHANNELS } from "@/lib/constants";
import {
  User,
  FileText,
  AlertTriangle,
  ChevronDown,
  Upload,
  X,
  Eye,
  EyeOff,
  Shield,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Clock,
  Info,
  Copy,
  Check,
  RefreshCw,
  Image as ImageIcon,
  File,
  Paperclip,
  TriangleAlert,
  Printer,
  Save,
  ClipboardList,
  Phone,
  Mail,
  Building2,
  Tag,
  MapPin,
  Server,
  Compass,
  Palette,
  Landmark,
  Wallet,
  BarChart3,
} from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/30";

const selectClass =
  "w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/30 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000/svg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23737373%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat pr-8";

const alertClass =
  "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700";

const STEPS = [
  { id: 1, label: "Personal Info", description: "Your contact details" },
  { id: 2, label: "Complaint Details", description: "Issue description" },
  { id: 3, label: "Review & Submit", description: "Confirm and submit" },
] as const;

const DRAFT_KEY = "kwaramoc_complaint_draft";

// Department icons keyed by the icon key in lib/constants DEPARTMENTS.
const DEPARTMENT_ICONS: Record<string, React.ReactNode> = {
  server: <Server size={14} />,
  compass: <Compass size={14} />,
  palette: <Palette size={14} />,
  landmark: <Landmark size={14} />,
  wallet: <Wallet size={14} />,
  chart: <BarChart3 size={14} />,
  building: <Building2 size={14} />,
};

// Lookup a department's icon by its display name.
function departmentIcon(name: string): React.ReactNode {
  const dept = DEPARTMENTS.find((d) => d.name === name);
  if (!dept) return <Info size={14} />;
  return DEPARTMENT_ICONS[dept.icon] ?? <Info size={14} />;
}

interface ComplaintFormProps {
  /** When true, show the channel selector (intake officer variant). */
  showChannel?: boolean;
  /** Override the card title. */
  title?: string;
  /** Override the card description. */
  description?: string;
  /** Render without the wrapping Card (for embedding in a custom container). */
  bare?: boolean;
  /** Called after a successful submission (e.g. to close a modal). */
  onSubmitted?: (ticketCode: string, passcode?: string) => void;
}

/**
 * Complaint submission form — multi-step with progress bar, save draft, success animation.
 *
 * Posts a multipart form to /tickets (public) or /tickets/intake (staff).
 */
export function ComplaintForm({
  showChannel = false,
  title = "Submit a Complaint",
  description = "Fill in the details below. Fields marked * are required.",
  bare = false,
  onSubmitted,
}: ComplaintFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [successPasscode, setSuccessPasscode] = useState("");
  const [successEmail, setSuccessEmail] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [draftSaved, setDraftSaved] = useState(false);
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [copiedPasscode, setCopiedPasscode] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [lga, setLga] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [descriptionText, setDescriptionText] = useState("");
  const [channel, setChannel] = useState("WALK_IN");

  // Load draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.name) setName(draft.name);
        if (draft.email) setEmail(draft.email);
        if (draft.phone) setPhone(draft.phone);
        if (draft.lga) setLga(draft.lga);
        if (draft.isAnonymous) setIsAnonymous(draft.isAnonymous);
        if (draft.category) setCategory(draft.category);
        if (draft.subject) setSubject(draft.subject);
        if (draft.description) setDescriptionText(draft.description);
        if (draft.channel) setChannel(draft.channel);
        if (draft.step) setCurrentStep(draft.step);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function saveDraft() {
    try {
      const draft = {
        name,
        email,
        phone,
        lga,
        isAnonymous,
        category,
        subject,
        description: descriptionText,
        channel,
        step: currentStep,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000);
    } catch {
      /* ignore */
    }
  }

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length > 5) {
      setError("Maximum 5 files allowed.");
      return;
    }
    setFiles(selected);
    setError(null);
  }

  function isStepComplete(step: number): boolean {
    switch (step) {
      case 1:
        return !!((isAnonymous || name.trim()) && email.trim());
      case 2:
        return !!(
          category &&
          subject.trim() &&
          descriptionText.trim().length >= 10
        );
      case 3:
        return true;
      default:
        return false;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (currentStep < 3) {
      if (!isStepComplete(currentStep)) {
        setError("Please complete the required fields before continuing.");
        return;
      }
      setCurrentStep((s) => Math.min(3, s + 1));
      return;
    }

    // Final validation
    if (!isAnonymous && !name.trim()) {
      setError("Full name is required unless submitting anonymously.");
      setCurrentStep(1);
      return;
    }
    if (!email.trim()) {
      setError("Email is required for tracking.");
      setCurrentStep(1);
      return;
    }
    if (!subject.trim()) {
      setError("Subject is required.");
      setCurrentStep(2);
      return;
    }
    if (!category) {
      setError("Category is required.");
      setCurrentStep(2);
      return;
    }
    if (descriptionText.trim().length < 10) {
      setError("Description must be at least 10 characters.");
      setCurrentStep(2);
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      const payload: Record<string, string | boolean> = {
        name: isAnonymous ? "" : name,
        email,
        phone,
        lga,
        isAnonymous,
        category: category || "General complaint",
        subject,
        description: descriptionText,
      };
      if (showChannel) payload.channel = channel;

      for (const [key, value] of Object.entries(payload)) {
        formData.append(key, String(value));
      }
      for (const file of files) {
        formData.append("attachments", file);
      }

      const endpoint = showChannel ? "/tickets/intake" : "/tickets";
      const result = await api.upload<{
        ticketCode: string;
        id: string;
        trackingPasscode: string;
      }>(endpoint, formData);
      setSuccess(result.ticketCode);
      setSuccessPasscode(result.trackingPasscode ?? "");
      setSuccessEmail(email);
      clearDraft();
      onSubmitted?.(result.ticketCode, result.trackingPasscode);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to submit complaint. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Success view with animation and print button
  if (success) {
    const successContent = (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-5"
      >
        {/* Confetti animation */}
        <div
          className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
          aria-hidden="true"
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-0"
              style={{
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
                backgroundColor: [
                  "#059669",
                  "#10b981",
                  "#22c55e",
                  "#f59e0b",
                  "#34d399",
                  "#6ee7b7",
                  "#a7f3d0",
                ][i % 7],
                left: `${Math.random() * 100}%`,
                top: "-5%",
                animation: `confettiFall ${2 + Math.random() * 3}s ease-out ${Math.random() * 1.5}s forwards`,
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes confettiFall {
            0% { opacity: 0; transform: translateY(0) rotate(0deg) scale(1); }
            10% { opacity: 1; }
            100% { opacity: 0; transform: translateY(100vh) rotate(720deg) scale(0.3); }
          }
        `}</style>

        {/* Success icon */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
          >
            <CheckCircle2 size={40} className="text-green-600" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl font-bold text-neutral-900"
          >
            Complaint Submitted Successfully!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-2 text-sm text-neutral-500"
          >
            Your complaint has been received and is being processed.
          </motion.p>
        </div>

        {/* Ticket Code Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border border-green-200 bg-green-50 p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-green-600">
                Ticket Reference
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-green-800">
                {success}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(success);
                setCopiedTicket(true);
                setTimeout(() => setCopiedTicket(false), 2000);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-neutral-50 px-3 py-2 text-xs font-medium text-green-700 transition-colors hover:bg-green-50"
            >
              {copiedTicket ? (
                <>
                  <Check size={14} className="text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Copy
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Passcode Card */}
        {successPasscode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-xl border border-amber-200 bg-amber-50 p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-amber-700">
                  Tracking Passcode
                </p>
                <p className="mt-1 font-mono text-2xl font-bold tracking-[0.3em] text-neutral-800">
                  {successPasscode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(successPasscode);
                  setCopiedPasscode(true);
                  setTimeout(() => setCopiedPasscode(false), 2000);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-neutral-50 px-3 py-2 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50"
              >
                {copiedPasscode ? (
                  <>
                    <Check size={14} className="text-amber-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-100/60 p-2.5">
              <AlertTriangle
                size={14}
                className="mt-0.5 shrink-0 text-amber-600"
              />
              <p className="text-xs text-amber-800">
                <strong>Keep this safe!</strong> You will need both the ticket
                code and passcode to check your complaint status.
              </p>
            </div>
          </motion.div>
        )}

        {/* Confirmation email notice */}
        {successEmail && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-sm text-neutral-600"
          >
            A confirmation email has been sent to{" "}
            <strong className="text-neutral-800">{successEmail}</strong>.
          </motion.p>
        )}

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="space-y-3"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                sessionStorage.setItem(
                  "kwaramoc_pending_track_lookup",
                  JSON.stringify({
                    code: success,
                    passcode: successPasscode,
                  }),
                );
                router.push("/track");
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
            >
              <Shield size={16} />
              Track This Complaint
            </button>
            <button
              type="button"
              onClick={() => {
                // Print confirmation details
                const content = `KwaraMOc Complaint Confirmation\n${"=".repeat(40)}\n\nTicket Code: ${success}\nPasscode: ${successPasscode}\nEmail: ${successEmail}\n\nKeep this information safe. You will need it to track your complaint status.`;
                const w = window.open("", "_blank");
                if (w) {
                  w.document.write(
                    `<pre style="font-family:monospace;font-size:14px;padding:40px">${content}</pre>`,
                  );
                  w.document.close();
                  w.print();
                }
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              <Printer size={16} />
              Print Confirmation
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setSuccess(null);
              setSuccessPasscode("");
              setName("");
              setEmail("");
              setPhone("");
              setLga("");
              setIsAnonymous(false);
              setCategory("");
              setSubject("");
              setDescriptionText("");
              setFiles([]);
              setCurrentStep(1);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            <RefreshCw size={14} />
            Submit Another Complaint
          </button>
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
            >
              <ArrowLeft size={14} />
              Back to Home
            </button>
          </div>
        </motion.div>
      </motion.div>
    );

    if (bare) return successContent;

    return (
      <div className="mx-auto w-full max-w-lg rounded-xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm">
        {successContent}
      </div>
    );
  }

  // Step Indicator
  function StepIndicator() {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const isActive = currentStep === step.id;
            const isComplete = isStepComplete(step.id);
            const isPast = currentStep > step.id;

            return (
              <div key={step.id} className="flex flex-1 items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (step.id < currentStep || isStepComplete(currentStep)) {
                      setCurrentStep(step.id);
                    }
                  }}
                  className={`group flex flex-col items-center gap-1.5 transition-all duration-200 ${
                    step.id < currentStep || isStepComplete(currentStep)
                      ? "cursor-pointer"
                      : step.id === currentStep
                        ? "cursor-default"
                        : "cursor-not-allowed opacity-60"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                      isActive
                        ? "border-green-600 bg-green-600 text-white"
                        : isComplete || isPast
                          ? "border-green-600 bg-green-600 text-white"
                          : "border-neutral-300 bg-neutral-50 text-neutral-400"
                    }`}
                  >
                    {isComplete || isPast ? (
                      <Check size={16} strokeWidth={3} />
                    ) : (
                      <span className="text-sm font-semibold">{step.id}</span>
                    )}
                  </div>
                  <div className="text-center">
                    <p
                      className={`text-xs font-medium transition-colors ${
                        isActive
                          ? "text-green-700"
                          : isComplete || isPast
                            ? "text-green-600"
                            : "text-neutral-400"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="hidden text-[10px] text-neutral-400 sm:block">
                      {step.description}
                    </p>
                  </div>
                </button>

                {idx < STEPS.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                      currentStep > step.id ? "bg-green-500" : "bg-neutral-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const form = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Step Indicator */}
      <StepIndicator />

      {/* Progress Bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 mb-4">
        <motion.div
          className="h-full rounded-full bg-green-500"
          initial={{ width: `${((currentStep - 1) / STEPS.length) * 100}%` }}
          animate={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <AnimatePresence mode="wait">
        {/* ═══════════ STEP 1: Personal Info ═══════════ */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* Anonymous toggle */}
            <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
              <div className="flex items-center gap-3">
                {isAnonymous ? (
                  <EyeOff size={18} className="text-neutral-400" />
                ) : (
                  <Eye size={18} className="text-green-600" />
                )}
                <div>
                  <p className="text-sm font-medium text-neutral-700">
                    Submit Anonymously
                  </p>
                  <p className="text-xs text-neutral-500">
                    Your name will be hidden from the complaint
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isAnonymous}
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600/20 ${
                  isAnonymous ? "bg-green-600" : "bg-neutral-200"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-neutral-50 shadow ring-0 transition duration-200 ease-in-out ${
                    isAnonymous ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {!isAnonymous && (
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                  <User size={14} className="text-neutral-400" />
                  Full Name *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                <Mail size={14} className="text-neutral-400" />
                Email *{" "}
                <span className="text-neutral-400">(for tracking link)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
                placeholder="you@example.com"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                  <Phone size={14} className="text-neutral-400" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  placeholder="0800 000 0000"
                />
              </div>

              <div>
                <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                  <MapPin size={14} className="text-neutral-400" />
                  LGA
                </label>
                <select
                  value={lga}
                  onChange={(e) => setLga(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select LGA...</option>
                  {LGAS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {showChannel && (
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Channel *
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className={selectClass}
                >
                  {CHANNELS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════ STEP 2: Complaint Details ═══════════ */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* Category selection with icons */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                <Tag size={14} className="text-neutral-400" />
                Category *
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200 ${
                      category === c
                        ? "border-green-600 bg-green-50 text-green-700 ring-1 ring-green-600/20"
                        : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
                    }`}
                  >
                    <span
                      className={
                        category === c
                          ? "text-primary"
                          : "text-muted-foreground"
                      }
                    >
                      {departmentIcon(c)}
                    </span>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Subject *
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                maxLength={200}
                className={inputClass}
                placeholder="Brief summary of the issue"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Description *
              </label>
              <textarea
                value={descriptionText}
                onChange={(e) => setDescriptionText(e.target.value)}
                required
                minLength={10}
                maxLength={10000}
                className={`${inputClass} min-h-[120px] resize-y`}
                placeholder="Describe the complaint in detail..."
              />
              <div className="mt-1 flex items-center justify-between">
                <p className="text-xs text-neutral-400">
                  Minimum 10 characters
                </p>
                <p
                  className={`text-xs ${
                    descriptionText.length > 9000
                      ? "text-amber-600"
                      : "text-neutral-400"
                  }`}
                >
                  {descriptionText.length.toLocaleString()} /{" "}
                  {(10000).toLocaleString()}
                </p>
              </div>
            </div>

            {/* File upload */}
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Evidence / Attachments
                <span className="ml-1 text-neutral-400">
                  (max 5 files, 10MB each)
                </span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="block w-full text-sm text-neutral-500 file:mr-3 file:rounded-lg file:border-0 file:bg-green-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-green-700 hover:file:bg-green-100"
              />
              {files.length > 0 && (
                <p className="mt-1 text-xs text-neutral-500">
                  {files.length} file(s) selected:{" "}
                  {files.map((f) => f.name).join(", ")}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══════════ STEP 3: Review & Submit ═══════════ */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {/* Review section */}
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-neutral-800">
                Review Your Complaint
              </h3>

              {/* Personal info summary */}
              <div className="mb-3 space-y-2">
                <p className="text-xs font-medium uppercase text-neutral-400">
                  Personal Info
                </p>
                {!isAnonymous && name && (
                  <p className="text-sm text-neutral-700">
                    <span className="text-neutral-400 mr-2">Name:</span>
                    {name}
                  </p>
                )}
                {isAnonymous && (
                  <p className="text-sm text-neutral-700">
                    <span className="text-neutral-400 mr-2">Name:</span>
                    Anonymous
                  </p>
                )}
                <p className="text-sm text-neutral-700">
                  <span className="text-neutral-400 mr-2">Email:</span>
                  {email}
                </p>
                {phone && (
                  <p className="text-sm text-neutral-700">
                    <span className="text-neutral-400 mr-2">Phone:</span>
                    {phone}
                  </p>
                )}
                {lga && (
                  <p className="text-sm text-neutral-700">
                    <span className="text-neutral-400 mr-2">LGA:</span>
                    {lga}
                  </p>
                )}
              </div>

              {/* Complaint details summary */}
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase text-neutral-400">
                  Complaint Details
                </p>
                {category && (
                  <p className="text-sm text-neutral-700">
                    <span className="text-neutral-400 mr-2">Category:</span>
                    {category}
                  </p>
                )}
                <p className="text-sm text-neutral-700">
                  <span className="text-neutral-400 mr-2">Subject:</span>
                  {subject}
                </p>
                <p className="text-sm text-neutral-700">
                  <span className="text-neutral-400 mr-2">Description:</span>
                  {descriptionText.length > 200
                    ? `${descriptionText.slice(0, 200)}...`
                    : descriptionText}
                </p>
                {files.length > 0 && (
                  <p className="text-sm text-neutral-700">
                    <span className="text-neutral-400 mr-2">Attachments:</span>
                    {files.length} file(s)
                  </p>
                )}
              </div>
            </div>

            {/* Estimated response time */}
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
              <Clock size={18} className="shrink-0 text-green-600" />
              <div>
                <p className="text-xs font-medium text-green-700">
                  Estimated Response Time
                </p>
                <p className="text-sm text-green-800">
                  Based on your complaint category, you should receive an
                  initial response within 24-48 hours.
                </p>
              </div>
            </div>

            {/* Privacy notice */}
            <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
              <Shield size={16} className="mt-0.5 shrink-0 text-neutral-500" />
              <div>
                <p className="text-xs font-medium text-neutral-700">
                  Privacy Notice
                </p>
                <p className="text-xs text-neutral-500">
                  Your personal information is protected under Kwara State data
                  protection regulations. Only authorized officers will have
                  access to your complaint details. If submitted anonymously,
                  your name will not appear in any reports.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className={`flex items-start gap-2 ${alertClass}`}
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Navigation & Save Draft buttons */}
      <div className="flex items-center gap-3">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={() => setCurrentStep((s) => s - 1)}
            className="flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            <ArrowLeft size={14} />
            Back
          </button>
        )}

        {/* Save as Draft */}
        <button
          type="button"
          onClick={saveDraft}
          className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
            draftSaved
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-neutral-200 bg-neutral-50 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700"
          }`}
        >
          {draftSaved ? (
            <>
              <Check size={14} />
              Saved!
            </>
          ) : (
            <>
              <Save size={14} />
              Save Draft
            </>
          )}
        </button>

        {currentStep < 3 ? (
          <button
            type="button"
            onClick={() => {
              setError(null);
              if (!isStepComplete(currentStep)) {
                setError("Please complete the required fields before continuing.");
                return;
              }
              setCurrentStep((s) => Math.min(3, s + 1));
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            Continue
            <ArrowRight size={14} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Shield size={16} />
                Submit Complaint
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );

  if (bare) return form;

  return (
    <div className="mx-auto w-full max-w-lg rounded-xl border border-neutral-200 bg-neutral-50 shadow-sm">
      <div className="border-b border-neutral-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
      </div>
      <div className="p-6">{form}</div>
    </div>
  );
}
