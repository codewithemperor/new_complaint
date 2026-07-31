"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { api, ApiError } from "@/lib/api";
import { CATEGORIES, LGAS } from "@/lib/constants";
import type { Department } from "@/lib/types";
import {
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
  FileUp,
  ArrowRight,
  Scale,
  Clock,
  Flame,
  Zap,
  Info,
  Copy,
  Check,
  RefreshCw,
  Image as ImageIcon,
  File,
  Paperclip,
  TriangleAlert,
  Save,
  Printer,
  Building2,
  Tag,
  MapPin,
  Phone,
  Mail,
  User,
  Heart,
  Sword,
  BookOpen,
  Droplets,
  TreePine,
  Home,
  Bus,
  ClipboardList,
} from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30";

const selectClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000/svg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23737373%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat pr-8";

const REPORT_TYPES = [
  { value: "GENERAL", label: "General Complaint", icon: <FileText size={16} />, description: "General grievances or concerns" },
  { value: "SERVICE_FAILURE", label: "Service Failure", icon: <AlertTriangle size={16} />, description: "Failure of a government service" },
  { value: "CORRUPTION", label: "Corruption", icon: <Scale size={16} />, description: "Report corrupt practices" },
  { value: "INFRASTRUCTURE", label: "Infrastructure", icon: <Zap size={16} />, description: "Road, water, power, or building issues" },
] as const;

const PRIORITY_OPTIONS = [
  {
    value: "P1",
    label: "Critical",
    description: "Immediate danger or emergency",
    icon: <Flame size={20} />,
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-700",
    iconColor: "text-red-500",
    ringColor: "ring-red-400",
    selectedBg: "bg-red-50",
    selectedBorder: "border-red-400",
    estimatedHours: "2 days",
  },
  {
    value: "P2",
    label: "High",
    description: "Urgent, needs quick action",
    icon: <TriangleAlert size={20} />,
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    textColor: "text-amber-700",
    iconColor: "text-amber-500",
    ringColor: "ring-amber-400",
    selectedBg: "bg-amber-50",
    selectedBorder: "border-amber-400",
    estimatedHours: "7 days",
  },
  {
    value: "P3",
    label: "Medium",
    description: "Important but not urgent",
    icon: <Clock size={20} />,
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    textColor: "text-teal-700",
    iconColor: "text-teal-500",
    ringColor: "ring-teal-400",
    selectedBg: "bg-teal-50",
    selectedBorder: "border-teal-400",
    estimatedHours: "14 days",
  },
  {
    value: "P4",
    label: "Low",
    description: "General feedback or minor issue",
    icon: <Info size={20} />,
    bgColor: "bg-neutral-50",
    borderColor: "border-neutral-200",
    textColor: "text-neutral-600",
    iconColor: "text-neutral-400",
    ringColor: "ring-neutral-400",
    selectedBg: "bg-neutral-50",
    selectedBorder: "border-neutral-400",
    estimatedHours: "28 days",
  },
] as const;

const STEPS = [
  { id: 1, label: "Details", description: "Complaint info" },
  { id: 2, label: "Evidence", description: "Attachments" },
  { id: 3, label: "Your Info", description: "Contact details" },
] as const;

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  INFRASTRUCTURE: <Building2 size={14} />,
  HEALTH: <Heart size={14} />,
  EDUCATION: <BookOpen size={14} />,
  SECURITY: <Shield size={14} />,
  AGRICULTURE: <Zap size={14} />,
  WATER_SANITATION: <Droplets size={14} />,
  ENVIRONMENT: <TreePine size={14} />,
  LAND_HOUSING: <Home size={14} />,
  TRANSPORT: <Bus size={14} />,
  OTHER: <Info size={14} />,
};

const MAX_DESCRIPTION_LENGTH = 10000;
const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DRAFT_KEY = "kwaramoc_report_draft";

/** Format file size in human-readable format */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Floating background element component */
function FloatingElement({ delay, duration, size, x, y, color }: {
  delay: number; duration: number; size: number; x: string; y: string; color: string;
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

export default function ReportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [lga, setLga] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [reportType, setReportType] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [subject, setSubject] = useState("");
  const [descriptionText, setDescriptionText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Step navigation
  const [currentStep, setCurrentStep] = useState(1);

  // Validation tracking
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // File previews
  const [filePreviews, setFilePreviews] = useState<Record<number, string>>({});

  // Copy state for success view
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [copiedPasscode, setCopiedPasscode] = useState(false);

  // Success state
  const [success, setSuccess] = useState<string | null>(null);
  const [successPasscode, setSuccessPasscode] = useState("");
  const [successEmail, setSuccessEmail] = useState("");

  // Departments from API
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

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
        if (draft.reportType) setReportType(draft.reportType);
        if (draft.priority) setPriority(draft.priority);
        if (draft.category) setCategory(draft.category);
        if (draft.departmentId) setDepartmentId(draft.departmentId);
        if (draft.subject) setSubject(draft.subject);
        if (draft.description) setDescriptionText(draft.description);
        if (draft.termsAccepted) setTermsAccepted(draft.termsAccepted);
        if (draft.step) setCurrentStep(draft.step);
      }
    } catch { /* ignore */ }
  }, []);

  // Save draft
  function saveDraft() {
    try {
      const draft = {
        name, email, phone, lga, isAnonymous, reportType, priority, category,
        departmentId, subject, description: descriptionText, termsAccepted, step: currentStep,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000);
    } catch { /* ignore */ }
  }

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch { /* ignore */ }
  }

  // Fetch departments
  useEffect(() => {
    let cancelled = false;
    async function fetchDepartments() {
      setDepartmentsLoading(true);
      try {
        const data = await api.get<Department[]>("/departments");
        if (!cancelled) setDepartments(data);
      } catch {
        // Departments endpoint requires auth; silently fail
      } finally {
        if (!cancelled) setDepartmentsLoading(false);
      }
    }
    fetchDepartments();
    return () => { cancelled = true; };
  }, []);

  // Generate file previews
  useEffect(() => {
    const newPreviews: Record<number, string> = {};
    files.forEach((file, index) => {
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        newPreviews[index] = url;
      }
    });
    setFilePreviews((prev) => {
      Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
      return newPreviews;
    });
    return () => {
      Object.values(newPreviews).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  // ─── Validation helpers ───
  function markTouched(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function isFieldValid(field: string): boolean | null {
    if (!touched[field]) return null;
    switch (field) {
      case "email":
        return email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      case "name":
        return !isAnonymous && name.trim().length > 0;
      case "subject":
        return subject.trim().length > 0;
      case "description":
        return descriptionText.trim().length >= 10;
      case "category":
        return category.length > 0;
      case "reportType":
        return reportType.length > 0;
      case "priority":
        return priority.length > 0;
      case "lga":
        return lga.length > 0;
      default:
        return null;
    }
  }

  function getMissingRequiredFields(): string[] {
    const missing: string[] = [];
    if (!reportType) missing.push("Report Type");
    if (!priority) missing.push("Priority");
    if (!category) missing.push("Category");
    if (!subject.trim()) missing.push("Subject");
    if (descriptionText.trim().length < 10) missing.push("Description (min 10 chars)");
    if (!email.trim()) missing.push("Email");
    if (!isAnonymous && !name.trim()) missing.push("Full Name");
    if (!termsAccepted) missing.push("Terms & Conditions");
    return missing;
  }

  function isStepComplete(step: number): boolean {
    switch (step) {
      case 1:
        return !!(reportType && priority && category && subject.trim() && descriptionText.trim().length >= 10);
      case 2:
        return true;
      case 3:
        return !!(email.trim() && (isAnonymous || name.trim()) && termsAccepted);
      default:
        return false;
    }
  }

  // ─── Drag & drop handlers ───
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  }, []);

  function addFiles(newFiles: File[]) {
    const validFiles = newFiles.filter((f) => {
      if (f.size > MAX_FILE_SIZE) {
        setError(`File "${f.name}" exceeds 10MB limit.`);
        return false;
      }
      return true;
    });
    setFiles((prev) => {
      const combined = [...prev, ...validFiles];
      if (combined.length > MAX_FILES) {
        setError(`Maximum ${MAX_FILES} files allowed.`);
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });
    setError(null);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    addFiles(selected);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    setTouched({
      email: true, name: true, subject: true, description: true,
      category: true, reportType: true, priority: true, lga: true,
    });

    if (!termsAccepted) {
      setError("You must accept the Terms & Conditions to submit.");
      return;
    }

    const missing = getMissingRequiredFields();
    if (missing.length > 0) {
      setError(`Please complete: ${missing.join(", ")}`);
      return;
    }

    setSubmitting(true);
    setSubmitProgress(10);

    try {
      const formData = new FormData();
      const payload: Record<string, string | boolean> = {
        name: isAnonymous ? "" : name,
        email,
        phone,
        lga,
        isAnonymous,
        category: category || "OTHER",
        subject,
        description: descriptionText,
      };

      if (priority) payload.priority = priority;

      if (!category && reportType) {
        const typeToCategory: Record<string, string> = {
          INFRASTRUCTURE: "INFRASTRUCTURE",
          CORRUPTION: "OTHER",
          SERVICE_FAILURE: "OTHER",
          GENERAL: "OTHER",
        };
        payload.category = typeToCategory[reportType] ?? "OTHER";
      }

      for (const [key, value] of Object.entries(payload)) {
        formData.append(key, String(value));
      }
      for (const file of files) {
        formData.append("attachments", file);
      }

      setSubmitProgress(40);

      const result = await api.upload<{ ticketCode: string; id: string; trackingPasscode: string }>(
        "/tickets",
        formData,
      );

      setSubmitProgress(100);
      setSuccess(result.ticketCode);
      setSuccessPasscode(result.trackingPasscode ?? "");
      setSuccessEmail(email);
      clearDraft();
    } catch (err) {
      setSubmitProgress(0);
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to submit complaint. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function ValidationIndicator({ field }: { field: string }) {
    const valid = isFieldValid(field);
    if (valid === null) return null;
    return valid ? (
      <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
    ) : (
      <AlertCircle size={16} className="shrink-0 text-red-400" />
    );
  }

  // ─── Estimated response time ───
  const estimatedResponse = (() => {
    const selectedPriority = PRIORITY_OPTIONS.find((p) => p.value === priority);
    return selectedPriority?.estimatedHours ?? null;
  })();

  // ─── Step indicator ───
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
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : isComplete || isPast
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-neutral-300 bg-white text-neutral-400"
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
                        isActive ? "text-emerald-700" : isComplete || isPast ? "text-emerald-600" : "text-neutral-400"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="hidden text-[10px] text-neutral-400 sm:block">{step.description}</p>
                  </div>
                </button>

                {idx < STEPS.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                      currentStep > step.id ? "bg-emerald-500" : "bg-neutral-200"
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

  // ─── Preview Modal ───
  function PreviewModal() {
    return (
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-xl border border-neutral-200 bg-white shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900">Preview Before Submit</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Report Type */}
                {reportType && (
                  <div>
                    <p className="text-xs font-medium uppercase text-neutral-400">Report Type</p>
                    <p className="text-sm font-medium text-neutral-800">
                      {REPORT_TYPES.find((t) => t.value === reportType)?.label ?? reportType}
                    </p>
                  </div>
                )}

                {/* Priority */}
                {priority && (
                  <div>
                    <p className="text-xs font-medium uppercase text-neutral-400">Priority</p>
                    <p className="text-sm font-medium text-neutral-800">
                      {PRIORITY_OPTIONS.find((p) => p.value === priority)?.label ?? priority}
                    </p>
                  </div>
                )}

                {/* Category */}
                {category && (
                  <div>
                    <p className="text-xs font-medium uppercase text-neutral-400">Category</p>
                    <p className="text-sm font-medium text-neutral-800">{category.replace(/_/g, " ")}</p>
                  </div>
                )}

                {/* LGA */}
                {lga && (
                  <div>
                    <p className="text-xs font-medium uppercase text-neutral-400">LGA</p>
                    <p className="text-sm font-medium text-neutral-800">{lga}</p>
                  </div>
                )}

                {/* Subject */}
                <div>
                  <p className="text-xs font-medium uppercase text-neutral-400">Subject</p>
                  <p className="text-sm font-medium text-neutral-800">{subject}</p>
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs font-medium uppercase text-neutral-400">Description</p>
                  <p className="whitespace-pre-wrap text-sm text-neutral-700">{descriptionText}</p>
                </div>

                {/* Files */}
                {files.length > 0 && (
                  <div>
                    <p className="text-xs font-medium uppercase text-neutral-400">Attachments</p>
                    <p className="text-sm text-neutral-700">{files.length} file(s): {files.map((f) => f.name).join(", ")}</p>
                  </div>
                )}

                {/* Contact info */}
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                  <p className="text-xs font-medium uppercase text-neutral-400">Contact Info</p>
                  <div className="mt-1 space-y-1">
                    {isAnonymous ? (
                      <p className="text-sm text-neutral-700">Anonymous submission</p>
                    ) : (
                      <p className="text-sm text-neutral-700">Name: {name}</p>
                    )}
                    <p className="text-sm text-neutral-700">Email: {email}</p>
                    {phone && <p className="text-sm text-neutral-700">Phone: {phone}</p>}
                  </div>
                </div>

                {/* Estimated response */}
                {estimatedResponse && (
                  <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <Clock size={16} className="text-emerald-600" />
                    <div>
                      <p className="text-xs font-medium text-emerald-700">Estimated Response Time</p>
                      <p className="text-sm text-emerald-800">{estimatedResponse}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-200 px-6 py-4 flex gap-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 rounded-lg border border-neutral-300 bg-white py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Go Back to Edit
                </button>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    // Submit the form programmatically
                    const formEl = document.querySelector("form");
                    if (formEl) {
                      const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
                      formEl.dispatchEvent(submitEvent);
                    }
                  }}
                  className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Confirm & Submit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // ─── Success View ───
  if (success) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <PublicHeader />
        {/* Floating elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-neutral-50" />
          <FloatingElement delay={0} duration={6} size={120} x="10%" y="20%" color="#059669" />
          <FloatingElement delay={1} duration={8} size={80} x="70%" y="15%" color="#14b8a6" />
          <FloatingElement delay={2} duration={7} size={100} x="80%" y="60%" color="#10b981" />
        </div>

        {/* Confetti animation */}
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-0"
              style={{
                width: `${6 + Math.random() * 8}px`,
                height: `${6 + Math.random() * 8}px`,
                backgroundColor: [
                  "#059669", "#10b981", "#14b8a6", "#f59e0b", "#d97706",
                  "#34d399", "#6ee7b7", "#a7f3d0",
                ][i % 8],
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

        <div className="flex items-center justify-center px-4 pt-24 pb-8">
          <div className="w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <div className="space-y-5">
                {/* Success icon */}
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"
                  >
                    <CheckCircle2 size={40} className="text-emerald-600" />
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
                    Your complaint has been received and is being processed. Keep your reference details safe.
                  </motion.p>
                </div>

                {/* Ticket Code Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 p-5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-emerald-600">
                        Ticket Reference
                      </p>
                      <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-emerald-800">
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
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50"
                    >
                      {copiedTicket ? <><Check size={14} className="text-emerald-600" />Copied!</> : <><Copy size={14} />Copy</>}
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
                        className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50"
                      >
                        {copiedPasscode ? <><Check size={14} className="text-amber-600" />Copied!</> : <><Copy size={14} />Copy</>}
                      </button>
                    </div>
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-100/60 p-2.5">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
                      <p className="text-xs text-amber-800">
                        <strong>Keep this safe!</strong> You will need both the ticket code and passcode to check your complaint status.
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

                {/* What happens next */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                >
                  <p className="text-xs font-medium text-neutral-600">What happens next?</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Your complaint will be reviewed and routed to the appropriate
                    department. You can track progress at any time using your ticket code and passcode.
                  </p>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="space-y-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/track?code=${encodeURIComponent(success)}&passcode=${encodeURIComponent(successPasscode)}`,
                        )
                      }
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
                    >
                      <Shield size={16} />
                      Track This Complaint
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Print confirmation
                        const content = `KwaraMOc Complaint Confirmation\n${"=".repeat(40)}\n\nTicket Code: ${success}\nPasscode: ${successPasscode}\nEmail: ${successEmail}\n\nKeep this information safe. You will need it to track your complaint status.`;
                        const w = window.open("", "_blank");
                        if (w) {
                          w.document.write(`<pre style="font-family:monospace;font-size:14px;padding:40px">${content}</pre>`);
                          w.document.close();
                          w.print();
                        }
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
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
                      setName(""); setEmail(""); setPhone(""); setLga("");
                      setIsAnonymous(false); setReportType(""); setPriority("");
                      setCategory(""); setDepartmentId(""); setSubject("");
                      setDescriptionText(""); setFiles([]); setTermsAccepted(false);
                      setCurrentStep(1);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
                  >
                    <RefreshCw size={16} />
                    Submit Another
                  </button>
                  <div className="flex items-center justify-center">
                    <Link
                      href="/"
                      className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
                    >
                      <ArrowLeft size={14} />
                      Back to Home
                    </Link>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Form View ───
  const missingFields = getMissingRequiredFields();

  return (
    <div className="min-h-screen bg-neutral-50">
      <PublicHeader />
      {/* Animated background with floating elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-neutral-50" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="reportGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#reportGrid)" />
        </svg>
        <FloatingElement delay={0} duration={6} size={120} x="10%" y="20%" color="#059669" />
        <FloatingElement delay={1} duration={8} size={80} x="70%" y="15%" color="#14b8a6" />
        <FloatingElement delay={2} duration={7} size={100} x="80%" y="60%" color="#10b981" />
        <FloatingElement delay={0.5} duration={9} size={60} x="20%" y="70%" color="#0d9488" />
      </div>

      {/* Preview Modal */}
      <PreviewModal />

      <div className="flex items-center justify-center px-4 pt-24 pb-8">
        <div className="w-full max-w-lg">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 text-center"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <FileText size={24} className="text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold text-neutral-800">Submit a Complaint</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Fill in the details below. Fields marked * are required.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-xl border border-neutral-200 bg-white shadow-sm"
          >
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Step Indicator */}
              <StepIndicator />

              {/* Progress Bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                <motion.div
                  className="h-full rounded-full bg-emerald-500"
                  initial={{ width: `${((currentStep - 1) / STEPS.length) * 100}%` }}
                  animate={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Estimated response time (shown when priority is selected) */}
              {estimatedResponse && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3"
                >
                  <Clock size={16} className="text-emerald-600" />
                  <div>
                    <p className="text-xs font-medium text-emerald-700">Estimated Response Time</p>
                    <p className="text-sm text-emerald-800">{estimatedResponse}</p>
                  </div>
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                {/* ═══════════ STEP 1: Details ═══════════ */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    {/* Report Type Selector */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-neutral-700">
                        Report Type *
                        <ValidationIndicator field="reportType" />
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {REPORT_TYPES.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => {
                              setReportType(type.value);
                              markTouched("reportType");
                            }}
                            onBlur={() => markTouched("reportType")}
                            className={`flex items-start gap-2 rounded-lg border p-3 text-left transition-all duration-200 ${
                              reportType === type.value
                                ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600/20"
                                : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50"
                            }`}
                          >
                            <span className={`mt-0.5 ${reportType === type.value ? "text-emerald-600" : "text-neutral-400"}`}>
                              {type.icon}
                            </span>
                            <div>
                              <p className={`text-sm font-medium ${reportType === type.value ? "text-emerald-700" : "text-neutral-700"}`}>
                                {type.label}
                              </p>
                              <p className="text-[10px] text-neutral-500">{type.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Priority Selector */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-neutral-700">
                        Priority *
                        <ValidationIndicator field="priority" />
                      </label>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {PRIORITY_OPTIONS.map((opt) => {
                          const isSelected = priority === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setPriority(opt.value);
                                markTouched("priority");
                              }}
                              onBlur={() => markTouched("priority")}
                              className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-all duration-200 ${
                                isSelected
                                  ? `${opt.selectedBorder} ${opt.selectedBg} ring-2 ${opt.ringColor} ring-offset-1`
                                  : `${opt.borderColor} ${opt.bgColor} hover:shadow-sm`
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600">
                                  <Check size={12} className="text-white" strokeWidth={3} />
                                </div>
                              )}
                              <div className={`rounded-full p-2 ${isSelected ? opt.iconColor : "text-neutral-400"}`}>
                                {opt.icon}
                              </div>
                              <div>
                                <p className={`text-xs font-bold ${isSelected ? opt.textColor : "text-neutral-600"}`}>
                                  {opt.label}
                                </p>
                                <p className="mt-0.5 text-[10px] leading-tight text-neutral-500">
                                  {opt.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Category - Enhanced with icons */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-neutral-700">
                        Category *
                        <ValidationIndicator field="category" />
                      </label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {CATEGORIES.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setCategory(c);
                              markTouched("category");
                            }}
                            onBlur={() => markTouched("category")}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all duration-200 ${
                              category === c
                                ? "border-emerald-600 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
                            }`}
                          >
                            <span className={category === c ? "text-emerald-600" : "text-neutral-400"}>
                              {CATEGORY_ICONS[c] ?? <Info size={14} />}
                            </span>
                            <span className="truncate">{c.replace(/_/g, " ")}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* LGA */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-neutral-700">
                        <MapPin size={14} className="text-neutral-400" />
                        LGA *
                        <ValidationIndicator field="lga" />
                      </label>
                      <select
                        value={lga}
                        onChange={(e) => { setLga(e.target.value); markTouched("lga"); }}
                        onBlur={() => markTouched("lga")}
                        className={selectClass}
                      >
                        <option value="">Select LGA...</option>
                        {LGAS.map((l) => (<option key={l} value={l}>{l}</option>))}
                      </select>
                    </div>

                    {/* Department Dropdown */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                        <Building2 size={14} className="text-neutral-400" />
                        Department
                        <span className="text-neutral-400">(optional)</span>
                      </label>
                      <select
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        className={selectClass}
                        disabled={departmentsLoading}
                      >
                        <option value="">
                          {departmentsLoading ? "Loading departments..." : "Select department..."}
                        </option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      {departments.length === 0 && !departmentsLoading && (
                        <p className="mt-1 text-xs text-neutral-400">
                          <Info size={10} className="mr-1 inline" />
                          Department will be auto-assigned based on category
                        </p>
                      )}
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-neutral-700">
                        Subject *
                        <ValidationIndicator field="subject" />
                      </label>
                      <input
                        value={subject}
                        onChange={(e) => { setSubject(e.target.value); markTouched("subject"); }}
                        onBlur={() => markTouched("subject")}
                        required
                        maxLength={200}
                        className={inputClass}
                        placeholder="Brief summary of the issue"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-neutral-700">
                        Description *
                        <ValidationIndicator field="description" />
                      </label>
                      <textarea
                        value={descriptionText}
                        onChange={(e) => { setDescriptionText(e.target.value); markTouched("description"); }}
                        onBlur={() => markTouched("description")}
                        required
                        minLength={10}
                        maxLength={MAX_DESCRIPTION_LENGTH}
                        className={`${inputClass} min-h-[140px] resize-y`}
                        placeholder="Describe the complaint in detail..."
                      />
                      <div className="mt-1 flex items-center justify-between">
                        <p className="text-xs text-neutral-400">Minimum 10 characters</p>
                        <p className={`text-xs ${
                          descriptionText.length > MAX_DESCRIPTION_LENGTH * 0.9
                            ? "text-amber-600"
                            : "text-neutral-400"
                        }`}>
                          {descriptionText.length.toLocaleString()} / {MAX_DESCRIPTION_LENGTH.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ═══════════ STEP 2: Evidence ═══════════ */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                      <p className="text-sm text-neutral-600">
                        <Paperclip size={14} className="mr-1.5 inline" />
                        Attach photos, documents, or other evidence to support your complaint.
                        This step is optional — you can skip it if you don&apos;t have any files.
                      </p>
                    </div>

                    {/* File Attachment - Drag & Drop */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                        Evidence / Attachments
                        <span className="ml-1 text-neutral-400">(max {MAX_FILES} files, 10MB each)</span>
                      </label>
                      <div
                        ref={dropZoneRef}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200 ${
                          dragOver
                            ? "border-emerald-500 bg-emerald-50/80 scale-[1.01]"
                            : "border-neutral-300 bg-neutral-50 hover:border-emerald-400 hover:bg-emerald-50/30"
                        }`}
                      >
                        <div className={`mb-3 rounded-full p-3 transition-colors duration-200 ${
                          dragOver ? "bg-emerald-100" : "bg-neutral-100"
                        }`}>
                          <FileUp size={28} className={dragOver ? "text-emerald-600" : "text-neutral-400"} />
                        </div>
                        <p className="text-sm font-medium text-neutral-700">
                          {dragOver ? "Drop files here" : "Drag & drop files here"}
                        </p>
                        <p className="mt-1 text-xs text-neutral-400">
                          or <span className="text-emerald-600 underline">click to browse</span> your computer
                        </p>
                        <p className="mt-2 text-xs text-neutral-400">
                          Supports images, PDFs, and documents
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>

                      {/* File previews */}
                      {files.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-medium text-neutral-500">
                            {files.length} of {MAX_FILES} files attached
                          </p>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {files.map((f, i) => (
                              <div
                                key={i}
                                className="group relative flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3 transition-all duration-200 hover:border-neutral-300 hover:shadow-sm"
                              >
                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-neutral-100 bg-neutral-50">
                                  {filePreviews[i] ? (
                                    <img src={filePreviews[i]} alt={f.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                      {f.type === "application/pdf" ? (
                                        <FileText size={16} className="text-red-400" />
                                      ) : (
                                        <File size={16} className="text-neutral-400" />
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-neutral-700">{f.name}</p>
                                  <p className="text-xs text-neutral-400">{formatFileSize(f.size)}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                                  className="shrink-0 rounded-full p-1 text-neutral-300 opacity-0 transition-all duration-200 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                                  aria-label={`Remove ${f.name}`}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ═══════════ STEP 3: Your Info ═══════════ */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    {/* Anonymous Toggle */}
                    <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        {isAnonymous ? <EyeOff size={18} className="text-neutral-400" /> : <Eye size={18} className="text-emerald-600" />}
                        <div>
                          <p className="text-sm font-medium text-neutral-700">Submit Anonymously</p>
                          <p className="text-xs text-neutral-500">Your name will be hidden from the complaint</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isAnonymous}
                        onClick={() => setIsAnonymous(!isAnonymous)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-600/20 ${
                          isAnonymous ? "bg-emerald-600" : "bg-neutral-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isAnonymous ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Name */}
                    {!isAnonymous && (
                      <div>
                        <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-neutral-700">
                          <User size={14} className="text-neutral-400" />
                          Full Name *
                          <ValidationIndicator field="name" />
                        </label>
                        <input
                          value={name}
                          onChange={(e) => { setName(e.target.value); markTouched("name"); }}
                          onBlur={() => markTouched("name")}
                          required
                          className={inputClass}
                          placeholder="John Doe"
                        />
                      </div>
                    )}

                    {/* Email */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-neutral-700">
                        <Mail size={14} className="text-neutral-400" />
                        Email * <span className="text-neutral-400">(for tracking link)</span>
                        <ValidationIndicator field="email" />
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); markTouched("email"); }}
                        onBlur={() => markTouched("email")}
                        required
                        className={inputClass}
                        placeholder="you@example.com"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-700">
                        <Phone size={14} className="text-neutral-400" />
                        Phone <span className="text-neutral-400">(optional)</span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={inputClass}
                        placeholder="0800 000 0000"
                      />
                    </div>

                    {/* Terms & Conditions */}
                    <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor="terms" className="text-sm text-neutral-600">
                        I confirm that the information provided is truthful and accurate. I understand that
                        submitting false complaints may result in action being taken.{" "}
                        <span className="font-medium text-neutral-700">
                          I accept the Terms & Conditions.
                        </span>
                      </label>
                    </div>

                    {/* Privacy Notice */}
                    <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <Shield size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                      <div>
                        <p className="text-xs font-medium text-emerald-700">Privacy Notice</p>
                        <p className="text-xs text-emerald-600">
                          Your personal information is protected under Kwara State data protection regulations.
                          Only authorized officers will have access to your complaint details.
                          {isAnonymous && " Since you chose anonymous submission, your name will not appear in any reports."}
                        </p>
                      </div>
                    </div>

                    {/* Validation summary */}
                    {missingFields.length > 0 && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                          <div>
                            <p className="text-sm font-medium text-amber-800">Required fields still missing:</p>
                            <ul className="mt-1 space-y-0.5">
                              {missingFields.map((field) => (
                                <li key={field} className="text-xs text-amber-700">&bull; {field}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                  >
                    <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Progress Indicator */}
              {submitting && (
                <div className="space-y-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
                      style={{ width: `${submitProgress}%` }}
                    />
                  </div>
                  <p className="text-center text-xs text-neutral-500">
                    {submitProgress < 40 ? "Preparing your complaint..." : submitProgress < 100 ? "Uploading and processing..." : "Almost done!"}
                  </p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center gap-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((s) => s - 1)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
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
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700"
                  }`}
                >
                  {draftSaved ? <><Check size={14} />Saved!</> : <><Save size={14} />Save Draft</>}
                </button>

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((s) => s + 1)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                  >
                    Continue
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <div className="flex flex-1 gap-2">
                    {/* Preview Before Submit */}
                    <button
                      type="button"
                      onClick={() => setShowPreview(true)}
                      disabled={submitting || !termsAccepted}
                      className="flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Eye size={14} />
                      Preview
                    </button>
                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={submitting || !termsAccepted}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? (
                        <><Loader2 size={16} className="animate-spin" />Submitting...</>
                      ) : (
                        <><Shield size={16} />Submit Complaint</>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Back link */}
              <div className="flex items-center justify-center">
                <Link
                  href="/"
                  className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
                >
                  <ArrowLeft size={14} />
                  Back to Home
                </Link>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
