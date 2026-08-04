"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Copy,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Shield,
  X,
  AlertCircle,
  CheckCircle2,
  Mail,
  Phone,
  MessageSquare,
  Clock,
} from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { api, ApiError } from "@/lib/api";
import { LGAS } from "@/lib/constants";

/* ──────────────────────────────────────────────────────────────────
 *  Report a complaint — streamlined 3-step flow.
 *
 *  Category / department / priority are intentionally NOT collected here:
 *  those are set by an admin during triage/routing. Citizens only supply
 *  what they know: the issue, evidence, and how to reach them.
 * ────────────────────────────────────────────────────────────────── */

const STEPS = [
  { id: 1, label: "Details", hint: "What happened?" },
  { id: 2, label: "Your Info", hint: "How we reach you" },
  { id: 3, label: "Review", hint: "Confirm & submit" },
] as const;

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/30";

export default function ReportPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitProgress, setSubmitProgress] = useState(0);

  // Step 1 — Details
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  // Step 2 — Your info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [lga, setLga] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Success
  const [success, setSuccess] = useState<string | null>(null);
  const [successPasscode, setSuccessPasscode] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Draft persistence ── */
  const DRAFT_KEY = "kwaramoc_report_draft";
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.subject) setSubject(d.subject);
      if (d.description) setDescription(d.description);
      if (d.name) setName(d.name);
      if (d.email) setEmail(d.email);
      if (d.phone) setPhone(d.phone);
      if (d.lga) setLga(d.lga);
      if (typeof d.isAnonymous === "boolean") setIsAnonymous(d.isAnonymous);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (success) return; // don't persist after submit
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            subject,
            description,
            name,
            email,
            phone,
            lga,
            isAnonymous,
          }),
        );
      } catch {
        /* ignore */
      }
    }, 600);
    return () => clearTimeout(t);
  }, [subject, description, name, email, phone, lga, isAnonymous, success]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  };

  /* ── File handling ── */
  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    setError(null);
    const next = [...files];
    for (const f of Array.from(incoming)) {
      if (next.length >= MAX_FILES) {
        setError(`You can attach a maximum of ${MAX_FILES} files.`);
        break;
      }
      if (f.size > MAX_FILE_SIZE) {
        setError(`${f.name} exceeds the 10 MB limit.`);
        continue;
      }
      next.push(f);
    }
    setFiles(next);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  /* ── Validation per step ── */
  const stepValid = (s: number): boolean => {
    if (s === 1)
      return subject.trim().length >= 4 && description.trim().length >= 10;
    if (s === 2) {
      if (isAnonymous) return termsAccepted && !!email.trim();
      return (
        name.trim().length >= 2 && /\S+@\S+\.\S+/.test(email) && termsAccepted
      );
    }
    return true;
  };

  const canSubmit = stepValid(1) && stepValid(2);

  const next = () => {
    setError(null);
    if (!stepValid(step)) {
      setError(
        step === 1
          ? "Please add a subject (4+ chars) and description (10+ chars)."
          : "Please complete the required fields.",
      );
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  };
  const back = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  /* ── Submit ── */
  const submit = async () => {
    if (!canSubmit) {
      setError("Please complete all required fields before submitting.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSubmitProgress(20);
    try {
      const formData = new FormData();
      formData.append("subject", subject.trim());
      formData.append("description", description.trim());
      formData.append(
        "email",
        isAnonymous ? `anon-${Date.now()}@kwmoc.anon` : email.trim(),
      );
      formData.append("isAnonymous", String(isAnonymous));
      if (!isAnonymous) {
        if (name.trim()) formData.append("name", name.trim());
        if (phone.trim()) formData.append("phone", phone.trim());
      }
      if (lga) formData.append("lga", lga);
      for (const f of files) formData.append("attachments", f);

      setSubmitProgress(50);
      const result = await api.upload<{
        ticketCode: string;
        id: string;
        trackingPasscode?: string;
      }>("/tickets", formData);
      setSubmitProgress(100);
      setSuccess(result.ticketCode);
      setSuccessPasscode(result.trackingPasscode ?? "");
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
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  /* ── Success view (contained, no full-page scroll) ── */
  if (success) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <PublicHeader />
        <div className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-4 py-10">
          <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h1 className="mt-5 text-2xl font-semibold text-foreground">
                Complaint submitted
              </h1>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                We&apos;ve received your complaint. Use the details below to
                track its progress.
              </p>
            </div>

            <div className="mt-7 space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border bg-neutral-50/50 px-4 py-3">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  Ticket code
                </span>
                <button
                  onClick={() => copy(success, "code")}
                  className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-foreground hover:text-primary"
                >
                  {success}
                  {copied === "code" ? (
                    <Check className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              {successPasscode && (
                <div className="flex items-center justify-between rounded-lg border border-border bg-neutral-50/50 px-4 py-3">
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    Passcode
                  </span>
                  <button
                    onClick={() => copy(successPasscode, "pass")}
                    className="inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-foreground hover:text-primary"
                  >
                    {successPasscode}
                    {copied === "pass" ? (
                      <Check className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
              <strong className="text-foreground">Keep these safe.</strong>{" "}
              <span className="text-muted-foreground">
                You&apos;ll need both the ticket code and passcode to check
                status.
              </span>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={() =>
                  router.push(
                    `/track?code=${encodeURIComponent(success)}&passcode=${encodeURIComponent(successPasscode)}`,
                  )
                }
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-700"
              >
                Track this complaint <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                href="/"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-neutral-50"
              >
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main form (widescreen 2-column: form left, support right) ── */
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />

      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[1fr_320px] lg:px-6">
        {/* ── Form column (80vh card, internal scroll) ── */}
        <div className="flex flex-col rounded-2xl border border-border bg-card shadow-sm lg:h-[80vh]">
          {/* Step header (sticky inside the card) */}
          <div className="shrink-0 border-b border-border px-6 pt-6">
            <h1 className="text-xl font-semibold text-foreground">
              Submit a complaint
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tell us what happened. An admin will classify and route it to the
              right department.
            </p>
            {/* Stepper */}
            <div className="mt-5 hidden items-center gap-2 sm:flex">
              {STEPS.map((s, i) => {
                const active = step === s.id;
                const done = step > s.id;
                return (
                  <div key={s.id} className="flex flex-1 items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : done
                              ? "bg-success text-white"
                              : "bg-neutral-50 text-muted-foreground"
                        }`}
                      >
                        {done ? <Check className="h-3.5 w-3.5" /> : s.id}
                      </div>
                      <div>
                        <p
                          className={`text-xs font-medium ${active || done ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {s.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {s.hint}
                        </p>
                      </div>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={`h-px flex-1 ${done ? "bg-success" : "bg-border"}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 sm:hidden">
              <p className="text-xs font-medium text-foreground">
                {STEPS[step - 1].label}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {STEPS[step - 1].hint}
              </p>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* ── Step 1: Details ── */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Subject <span className="text-destructive">*</span>
                  </label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of the issue"
                    className={inputClass}
                    maxLength={120}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Description <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what happened, when, and any other relevant detail (min. 10 characters)…"
                    rows={7}
                    className={inputClass + " resize-y"}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {description.trim().length}/10 min characters
                  </p>
                </div>

                {/* Attachments */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Evidence / attachments{" "}
                    <span className="text-muted-foreground">
                      (optional, up to {MAX_FILES} files, 10 MB each)
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-neutral-50/40 px-4 py-8 text-center transition-colors hover:border-primary hover:bg-neutral-50"
                  >
                    <Paperclip className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      Click to attach files
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PNG, JPG, PDF, DOC up to 10 MB
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => addFiles(e.target.files)}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    className="hidden"
                  />

                  {files.length > 0 && (
                    <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {files.map((f, idx) => (
                        <FilePreview
                          key={idx}
                          file={f}
                          onRemove={() => removeFile(idx)}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 2: Your info ── */}
            {step === 2 && (
              <div className="space-y-5">
                <label className="flex items-start gap-3 rounded-lg border border-border bg-neutral-50/40 p-3">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Submit anonymously
                    </p>
                    <p className="text-xs text-muted-foreground">
                      We won&apos;t store your name or phone. An email is still
                      required so you can track the complaint.
                    </p>
                  </div>
                </label>

                {!isAnonymous && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Full name <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className={inputClass}
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Used to send your tracking code and status updates.
                  </p>
                </div>

                {!isAnonymous && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Phone
                      </label>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0801 234 5678"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">
                        LGA
                      </label>
                      <select
                        value={lga}
                        onChange={(e) => setLga(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">— Select LGA —</option>
                        {LGAS.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="text-xs text-muted-foreground">
                    I confirm the information provided is accurate to the best
                    of my knowledge and consent to it being processed to handle
                    this complaint.
                  </span>
                </label>
              </div>
            )}

            {/* ── Step 3: Review ── */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Subject
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {subject}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Description
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {description}
                  </p>
                </div>

                {files.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Attachments ({files.length})
                    </p>
                    <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {files.map((f, idx) => (
                        <FilePreview key={idx} file={f} readOnly />
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-neutral-50/40 p-4 text-sm">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      Name
                    </p>
                    <p className="font-medium text-foreground">
                      {isAnonymous ? "Anonymous" : name || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      Email
                    </p>
                    <p className="font-medium text-foreground">
                      {email || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      Phone
                    </p>
                    <p className="font-medium text-foreground">
                      {isAnonymous ? "—" : phone || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      LGA
                    </p>
                    <p className="font-medium text-foreground">{lga || "—"}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
                  <Shield className="mb-1 inline h-3.5 w-3.5 text-primary" />{" "}
                  Category, department and priority will be assigned by an admin
                  during routing.
                </div>
              </div>
            )}
          </div>

          {/* Footer actions (sticky inside card) */}
          <div className="shrink-0 border-t border-border px-6 py-4">
            {submitting && submitProgress > 0 && (
              <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-neutral-50">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${submitProgress}%` }}
                />
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={back}
                disabled={step === 1 || submitting}
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>

              {step < 3 ? (
                <button
                  onClick={next}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-700"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={submitting || !canSubmit}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" /> Submit complaint
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Support column (right on widescreen) ── */}
        <aside className="lg:h-[80vh]">
          <div className="flex h-full flex-col gap-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <MessageSquare className="h-4 w-4 text-primary" /> Need help?
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                If you&apos;d rather speak to someone, reach our complaints
                desk:
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-center gap-2 text-foreground">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" /> 0800
                  KWARA MOC
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                  complaints@kwmoc.gov.ng
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                  Mon–Fri, 8am–4pm
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-gradient-to-br from-primary-600 to-primary-800 p-5 text-white shadow-sm">
              <h3 className="text-sm font-semibold">What happens next?</h3>
              <ol className="mt-3 space-y-2.5 text-xs text-white/90">
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-50/20 text-[10px] font-bold">
                    1
                  </span>
                  We receive and acknowledge your complaint.
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-50/20 text-[10px] font-bold">
                    2
                  </span>
                  An admin classifies and routes it to the right department.
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-50/20 text-[10px] font-bold">
                    3
                  </span>
                  Track progress in real time with your ticket code.
                </li>
              </ol>
            </div>

            <Link
              href="/"
              className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-neutral-50"
            >
              <ChevronLeft className="h-4 w-4" /> Back to home
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
 *  File preview tile — shows a thumbnail for images, an icon for docs.
 * ────────────────────────────────────────────────────────────────── */
function FilePreview({
  file,
  onRemove,
  readOnly,
}: {
  file: File;
  onRemove?: () => void;
  readOnly?: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const isImage = file.type.startsWith("image/");

  useEffect(() => {
    if (!isImage) return;
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file, isImage]);

  return (
    <li className="group relative overflow-hidden rounded-lg border border-border bg-neutral-50/40">
      <div className="flex aspect-square items-center justify-center">
        {isImage && url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={file.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 p-3 text-center">
            <FileText className="h-7 w-7 text-muted-foreground" />
            <span className="line-clamp-2 text-[10px] text-muted-foreground">
              {file.name}
            </span>
          </div>
        )}
      </div>
      {/* Hover overlay with filename */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
        <p className="line-clamp-1 text-[10px] font-medium text-white">
          {file.name}
        </p>
        <p className="text-[9px] text-white/70">
          {(file.size / 1024).toFixed(0)} KB
        </p>
      </div>
      {!readOnly && onRemove && (
        <button
          onClick={onRemove}
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
          aria-label="Remove file"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {!isImage && (
        <ImageIcon className="pointer-events-none absolute right-1.5 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
      )}
    </li>
  );
}
