"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
// HeroUI removed for memory optimization — using native HTML/Tailwind equivalents
import { useSession } from "@/lib/session";
import { ApiError } from "@/lib/api";
import { ROLE_LANDING_ROUTE } from "@/lib/nav";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ShieldCheck,
  X,
  Lock,
  ChevronDown,
  ChevronUp,
  Keyboard,
  HelpCircle,
  Mail,
  Phone,
  Clock,
  ArrowUpRight,
  Shield,
  Star,
  Inbox,
  ClipboardList,
  Building2,
  Briefcase,
  Crown,
  Search,
  Zap,
  KeyRound,
  CheckCircle2,
  Fingerprint,
  Timer,
  Users,
  type LucideIcon,
} from "lucide-react";

const TEST_ACCOUNTS = [
  { email: "admin@kwmoc.gov.ng", role: "Admin Officer", icon: "shield", color: "teal" },
  { email: "superadmin@kwmoc.gov.ng", role: "Super Admin", icon: "star", color: "emerald" },
  { email: "intake@kwmoc.gov.ng", role: "Intake Officer", icon: "inbox", color: "amber" },
  { email: "officer@kwmoc.gov.ng", role: "Schedule Officer", icon: "clipboard", color: "cyan" },
  { email: "director@kwmoc.gov.ng", role: "Director (HOD)", icon: "building", color: "violet" },
  { email: "ps@kwmoc.gov.ng", role: "Perm. Secretary", icon: "briefcase", color: "slate" },
  { email: "commissioner@kwmoc.gov.ng", role: "Commissioner", icon: "crown", color: "orange" },
  { email: "auditor@kwmoc.gov.ng", role: "Auditor", icon: "search", color: "rose" },
];

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  teal: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  cyan: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  violet: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  slate: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
  orange: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  rose: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
};

/* ------------------------------------------------------------------ */
/*  Role-specific icon mapping                                         */
/* ------------------------------------------------------------------ */

const ROLE_ICONS: Record<string, LucideIcon> = {
  shield: Shield,
  star: Star,
  inbox: Inbox,
  clipboard: ClipboardList,
  building: Building2,
  briefcase: Briefcase,
  crown: Crown,
  search: Search,
};

/* ------------------------------------------------------------------ */
/*  Geometric decorative shapes                                        */
/* ------------------------------------------------------------------ */

function GeometricShapes() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Top-right circle */}
      <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full border border-teal-200/40 opacity-30" />
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border border-teal-300/30 opacity-20" />
      {/* Bottom-left diamond */}
      <div className="absolute -bottom-16 -left-16 h-32 w-32 rotate-45 rounded-sm border border-teal-200/40 opacity-30" />
      {/* Middle-right triangles */}
      <div className="absolute right-8 top-1/3 h-0 w-0 opacity-20"
        style={{ borderLeft: "30px solid transparent", borderBottom: "30px solid rgba(13,148,136,0.15)", borderRight: "30px solid transparent" }}
      />
      {/* Scattered dots */}
      <div className="absolute left-[15%] top-[8%] h-2 w-2 rounded-full bg-teal-300/20" />
      <div className="absolute left-[70%] top-[15%] h-1.5 w-1.5 rounded-full bg-teal-400/15" />
      <div className="absolute left-[40%] bottom-[12%] h-2 w-2 rounded-full bg-teal-300/20" />
      <div className="absolute left-[85%] bottom-[25%] h-1.5 w-1.5 rounded-full bg-teal-400/15" />
      {/* Horizontal lines */}
      <div className="absolute left-[5%] top-[20%] h-px w-16 bg-gradient-to-r from-teal-200/40 to-transparent" />
      <div className="absolute left-[60%] bottom-[8%] h-px w-24 bg-gradient-to-r from-transparent to-teal-200/40" />
      {/* Cross pattern */}
      <div className="absolute left-[25%] top-[60%] opacity-15">
        <div className="h-8 w-px bg-teal-400" />
        <div className="absolute left-1/2 top-1/2 h-px w-8 -translate-x-1/2 -translate-y-1/2 bg-teal-400" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Password strength dots indicator                                   */
/* ------------------------------------------------------------------ */

function PasswordStrengthDots({ length }: { length: number }) {
  const maxDots = 5;
  // 0-2 chars: 1 dot, 3-5 chars: 2 dots, 6-9 chars: 3 dots, 10+ chars: 5 dots
  const getFilled = () => {
    if (length === 0) return 0;
    if (length <= 2) return 1;
    if (length <= 5) return 2;
    if (length <= 9) return 3;
    return 5;
  };
  const filled = getFilled();
  const getColor = (idx: number) => {
    if (idx < 2) return "bg-red-300";
    if (idx < 3) return "bg-amber-400";
    return "bg-emerald-400";
  };
  const getLabel = () => {
    if (length === 0) return "";
    if (length <= 2) return "Weak";
    if (length <= 5) return "Fair";
    if (length <= 9) return "Good";
    return "Strong";
  };

  if (length === 0) return null;

  return (
    <div className="mt-1.5 flex items-center gap-1.5">
      {Array.from({ length: maxDots }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 w-1.5 rounded-full transition-all duration-200 ${
            i < filled ? getColor(i) : "bg-neutral-200"
          }`}
        />
      ))}
      <span className={`ml-1 text-[10px] font-medium ${
        filled <= 1 ? "text-red-400" : filled <= 2 ? "text-amber-500" : "text-emerald-500"
      }`}>
        {getLabel()} · {length} chars
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Recent Logins display                                              */
/* ------------------------------------------------------------------ */

function RecentLogins() {
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("kwmoc_last_login");
      if (stored) setLastLogin(stored);
    } catch {
      // localStorage unavailable
    }
    setLoaded(true);
  }, []);

  const formatLoginTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = Date.now();
    const diff = now - date.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) {
      const hours = Math.floor(diff / 3600000);
      if (hours === 0) {
        const mins = Math.floor(diff / 60000);
        return mins <= 1 ? "Just now" : `${mins} min ago`;
      }
      return `${hours}h ago`;
    }
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
  };

  if (!loaded) return null;

  return (
    <div className="flex items-center gap-2 rounded-md border border-neutral-100 bg-neutral-50/80 px-2.5 py-1.5">
      <Clock size={13} className="text-neutral-400" />
      <span className="text-xs text-neutral-500">
        Last login: <span className="font-medium text-neutral-700">{lastLogin ? formatLoginTime(lastLogin) : "Never"}</span>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Need Help expandable section                                       */
/* ------------------------------------------------------------------ */

function NeedHelpSection() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-neutral-400 transition-colors hover:text-teal-600"
      >
        <HelpCircle size={13} />
        <span>Need help?</span>
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {expanded && (
        <div className="mt-2 rounded-lg border border-neutral-200 bg-white p-3 text-xs text-neutral-500 animate-[fadeIn_0.2s_ease-out]">
          <p className="mb-2 font-medium text-neutral-600">Contact Support</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Mail size={13} className="text-teal-500" />
              <span>support@kwmoc.gov.ng</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={13} className="text-teal-500" />
              <span>+234 (0) 812 345 6789</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-teal-500" />
              <span>Mon – Fri, 8:00 AM – 4:00 PM</span>
            </div>
          </div>
          <p className="mt-2 text-neutral-400">
            For urgent issues outside office hours, contact your department head directly.
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Secure Connection indicator                                        */
/* ------------------------------------------------------------------ */

function SecureConnectionIndicator() {
  return (
    <div className="flex items-center gap-1.5">
      <Lock size={12} className="text-emerald-500" />
      <span className="text-xs font-medium text-emerald-600">Secure connection</span>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Caps Lock Warning                                                  */
/* ------------------------------------------------------------------ */

function CapsLockWarning({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700 animate-[fadeIn_0.15s_ease-out]">
      <AlertCircle size={13} className="text-amber-500" />
      <span className="font-medium">Caps Lock is on</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Session Expires Notice                                             */
/* ------------------------------------------------------------------ */

function SessionExpiresNotice({ rememberMe }: { rememberMe: boolean }) {
  if (rememberMe) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs text-neutral-400">
      <Clock size={12} />
      <span>Session expires in 8 hours</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Login Page                                                         */
/* ------------------------------------------------------------------ */

export default function LoginPage() {
  const router = useRouter();
  const { login } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showTestAccounts, setShowTestAccounts] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [mounted, setMounted] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Mark as mounted on client (for any client-only effects)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Caps lock detection
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    setCapsLockOn(e.getModifierState && e.getModifierState("CapsLock"));
  }, []);

  // Ctrl+Enter shortcut to submit
  const handleKeyDownShortcut = useCallback(
    (e: React.KeyboardEvent) => {
      handleKeyDown(e);
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !submitting) {
        e.preventDefault();
        // Trigger form submission programmatically
        const form = e.currentTarget.closest("form");
        if (form) {
          form.requestSubmit();
        }
      }
    },
    [submitting, handleKeyDown],
  );

  // Save last login time on successful login
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email, password);
      // Store last login time in localStorage
      try {
        localStorage.setItem("kwmoc_last_login", new Date().toISOString());
      } catch {
        // localStorage unavailable
      }
      const dest = (user && ROLE_LANDING_ROUTE[user.role]) || "/";
      router.push(dest);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.statusCode === 401
            ? "Invalid email or password. Please check your credentials and try again."
            : err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function fillTestAccount(email: string) {
    setEmail(email);
    setPassword("password123");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* ── Left: image column (hidden on small screens) ─────────────── */}
      <div className="relative hidden md:block md:w-1/2 md:max-h-screen md:overflow-hidden">
        <Image
          src="/1694640981815640-0.jpg"
          alt="Kwara State"
          fill
          priority
          className="object-cover"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/85 via-emerald-900/40 to-neutral-900/70" />

        {/* Animated floating geometric shapes */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Large floating circle - top right */}
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-emerald-400/20 animate-[floatSlow_8s_ease-in-out_infinite]" />
          <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full border border-emerald-300/15 animate-[floatSlow_10s_ease-in-out_infinite_reverse]" />
          {/* Small floating diamond - bottom left */}
          <div className="absolute -bottom-12 -left-12 h-24 w-24 rotate-45 rounded-sm border border-emerald-400/20 animate-[floatMed_7s_ease-in-out_infinite]" />
          <div className="absolute bottom-8 left-8 h-16 w-16 rotate-45 rounded-sm border border-teal-300/15 animate-[floatMed_9s_ease-in-out_infinite_reverse]" />
          {/* Floating hexagon-like shape - middle */}
          <div className="absolute left-[20%] top-[25%] h-10 w-10 rotate-12 rounded-lg border border-emerald-400/15 animate-[floatSlow_12s_ease-in-out_infinite]" />
          {/* Scattered dots */}
          <div className="absolute left-[15%] top-[10%] h-2.5 w-2.5 rounded-full bg-emerald-400/20 animate-[floatMed_6s_ease-in-out_infinite]" />
          <div className="absolute left-[70%] top-[18%] h-2 w-2 rounded-full bg-teal-300/20 animate-[floatSlow_9s_ease-in-out_infinite_reverse]" />
          <div className="absolute left-[45%] bottom-[15%] h-2.5 w-2.5 rounded-full bg-emerald-400/15 animate-[floatMed_8s_ease-in-out_infinite]" />
          <div className="absolute left-[80%] bottom-[30%] h-2 w-2 rounded-full bg-teal-300/15 animate-[floatSlow_7s_ease-in-out_infinite_reverse]" />
          {/* Horizontal accent lines */}
          <div className="absolute left-[5%] top-[22%] h-px w-20 bg-gradient-to-r from-emerald-400/30 to-transparent animate-[floatSlow_10s_ease-in-out_infinite]" />
          <div className="absolute left-[60%] bottom-[10%] h-px w-28 bg-gradient-to-r from-transparent to-teal-300/25 animate-[floatMed_8s_ease-in-out_infinite]" />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-12">
          {/* Prominent K badge */}
          <div className="relative">
            <div className="absolute -inset-3 rounded-full bg-emerald-500/10 animate-[pulse_3s_ease-in-out_infinite]" />
            <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-emerald-400/50 bg-white shadow-2xl">
              <Image
                src="/Kwara-logo-3.webp"
                alt="Kwara State Logo"
                fill
                className="object-contain p-2"
                sizes="128px"
              />
            </div>
          </div>

          {/* Secure Login badge */}
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-900/30 px-4 py-1.5 backdrop-blur-sm">
            <Lock size={14} className="text-emerald-400" />
            <span className="text-xs font-semibold tracking-wide text-emerald-300 uppercase">Secure Login</span>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
            </span>
          </div>

          <div className="text-center text-white">
            <h1 className="text-2xl font-bold tracking-tight">
              Kwara State Ministry of Complaints
            </h1>
            <p className="mt-2 max-w-sm text-sm text-white/80">
              Complaint Management &amp; Ticketing System — your voice,
              delivered to the right office.
            </p>
          </div>

          {/* Feature badges */}
          <div className="mt-4 flex flex-col gap-3">
            {[
              { text: "Track complaints in real-time", icon: Search },
              { text: "Transparent resolution process", icon: CheckCircle2 },
              { text: "Secure & confidential", icon: ShieldCheck },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-2.5 text-sm text-white/90"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/20">
                  <item.icon size={14} className="text-emerald-400" />
                </div>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: form column ──────────────────────────────────────────── */}
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-10 md:w-1/2 md:max-h-screen md:overflow-y-auto">
        {/* Faint background image for small screens */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04] md:hidden">
          <Image
            src="/1694640981815640-0.jpg"
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>

        {/* Geometric decorative shapes */}
        <GeometricShapes />

        <div className="relative w-full max-w-md animate-[fadeIn_0.5s_ease-out]">
          {/* Logo + heading */}
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-emerald-200 bg-white shadow-lg">
              <Image
                src="/Kwara-logo-3.webp"
                alt="Kwara State Logo"
                fill
                className="object-contain p-1.5"
                sizes="80px"
              />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-neutral-800">
                KwaraMOc Complaints
              </h2>
              <p className="text-sm text-neutral-500">
                Sign in to your staff account
              </p>
            </div>
          </div>

          {/* "Welcome back" animated header */}
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-600 animate-[fadeIn_0.4s_ease-out_0.2s_both]">
              Welcome back
            </p>
            <div className="flex items-center gap-1.5 animate-[fadeIn_0.4s_ease-out_0.3s_both]">
              <Lock size={12} className="text-emerald-500" />
              <span className="text-xs font-medium text-emerald-600">Secure</span>
            </div>
          </div>

          {/* Recent logins */}
          <div className="mb-3 animate-[fadeIn_0.4s_ease-out_0.3s_both]">
            <RecentLogins />
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white shadow-sm ring-1 ring-neutral-900/5 transition-shadow hover:shadow-md">
            {/* "Sign in with" heading */}
            <div className="border-b border-neutral-100 px-6 py-3">
              <div className="flex items-center gap-2">
                <KeyRound size={14} className="text-emerald-600" />
                <p className="text-sm font-semibold text-neutral-700">Sign in with your credentials</p>
              </div>
            </div>
            <div className="px-6 pt-5 pb-2">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Email field */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className={inputClass}
                    placeholder="you@kwmoc.gov.ng"
                  />
                </div>

                {/* Password field */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-sm font-medium text-neutral-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(!showForgotPassword)}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      ref={passwordRef}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDownShortcut}
                      required
                      autoComplete="current-password"
                      className={inputClass + " pr-10"}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                  {/* Password strength dots */}
                  <PasswordStrengthDots length={password.length} />
                </div>

                {/* Caps lock warning */}
                <CapsLockWarning show={capsLockOn} />

                {/* Remember me */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-600"
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-sm text-neutral-600"
                    >
                      Remember me for 30 days
                    </label>
                  </div>
                  <SessionExpiresNotice rememberMe={rememberMe} />
                </div>

                {/* Error display with animation */}
                {error && (
                  <div
                    role="alert"
                    className="animate-shake flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                  >
                    <AlertCircle
                      size={16}
                      className="mt-0.5 shrink-0 text-red-500"
                    />
                    <span>{error}</span>
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className="ml-auto shrink-0 text-red-400 hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="group relative mt-2 w-full overflow-hidden rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Authenticating…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Lock size={14} className="transition-transform group-hover:-translate-y-0.5" />
                      Sign in
                    </span>
                  )}
                </button>

                {/* Keyboard shortcut hint */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-400">
                  <Keyboard size={12} />
                  <span>
                    Press <kbd className="rounded border border-neutral-300 bg-neutral-100 px-1 py-0.5 font-mono text-[10px] font-medium text-neutral-600">Ctrl</kbd>
                    +<kbd className="rounded border border-neutral-300 bg-neutral-100 px-1 py-0.5 font-mono text-[10px] font-medium text-neutral-600">Enter</kbd>
                    to submit
                  </span>
                </div>
              </form>
            </div>

            <div className="flex flex-col gap-2 border-t border-neutral-100 px-6 pb-4 pt-3">
              <SecureConnectionIndicator />
              {/* Security info section */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-1 rounded-md bg-neutral-50 px-2 py-2">
                  <Fingerprint size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-medium text-neutral-500 text-center">End-to-end encrypted</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-md bg-neutral-50 px-2 py-2">
                  <Timer size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-medium text-neutral-500 text-center">8hr session timeout</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-md bg-neutral-50 px-2 py-2">
                  <Users size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-medium text-neutral-500 text-center">Multi-role access</span>
                </div>
              </div>
              <p className="text-xs text-neutral-400">
                Complaint Management &amp; Ticketing System ·{" "}
                <Link href="/" className="text-emerald-600 hover:underline">
                  Back to home
                </Link>
              </p>
            </div>
          </div>

          {/* Test account hints card - improved visual hierarchy */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowTestAccounts(!showTestAccounts)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium text-neutral-600 transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700"
            >
              <Zap size={14} className="text-emerald-600" />
              {showTestAccounts
                ? "Hide test accounts"
                : "Quick Access — Test Accounts"}
              <ArrowUpRight size={13} className="text-neutral-300" />
            </button>

            {showTestAccounts && (
              <div className="mt-2 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm ring-1 ring-neutral-900/5 animate-[fadeIn_0.2s_ease-out]">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100">
                      <Zap size={13} className="text-emerald-600" />
                    </div>
                    <p className="text-xs font-bold text-neutral-800 uppercase tracking-wide">
                      Quick Access
                    </p>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Password: <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-neutral-600">password123</code>
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {TEST_ACCOUNTS.map((acc) => {
                    const colors = ROLE_COLORS[acc.color] || ROLE_COLORS.teal;
                    const RoleIcon = ROLE_ICONS[acc.icon] || ShieldCheck;
                    return (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => fillTestAccount(acc.email)}
                        className={`group flex items-center gap-2.5 rounded-lg border ${colors.border} ${colors.bg} px-3 py-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-neutral-200/50 active:scale-[0.98]`}
                      >
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.bg} ${colors.text} ring-1 ring-inset ${colors.border} transition-transform group-hover:scale-110`}>
                          <RoleIcon size={15} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-semibold ${colors.text}`}>
                            {acc.role}
                          </p>
                          <p className="truncate text-[11px] text-neutral-400">
                            {acc.email}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Need Help section */}
          <NeedHelpSection />

          {/* Forgot Password Section */}
          {showForgotPassword && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4 animate-[fadeIn_0.25s_ease-out]">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound size={14} className="text-amber-600" />
                  <p className="text-sm font-semibold text-neutral-800">Reset Your Password</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              {/* Step-by-step process indicator */}
              <div className="mb-3 flex items-center gap-1">
                {[
                  { step: 1, label: "Enter email" },
                  { step: 2, label: "Verify" },
                  { step: 3, label: "Reset" },
                ].map((s, i) => (
                  <div key={s.step} className="flex items-center gap-1">
                    <div className="flex items-center gap-1.5">
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        i === 0 ? "bg-amber-500 text-white" : "bg-neutral-200 text-neutral-400"
                      }`}>
                        {s.step}
                      </div>
                      <span className={`text-[10px] font-medium ${
                        i === 0 ? "text-amber-700" : "text-neutral-400"
                      }`}>{s.label}</span>
                    </div>
                    {i < 2 && (
                      <div className="mx-1 h-px w-4 bg-neutral-200" />
                    )}
                  </div>
                ))}
              </div>
              {/* Reset form */}
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-neutral-600">
                    Registered email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition-all duration-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 hover:border-neutral-400"
                    placeholder="you@kwmoc.gov.ng"
                  />
                </div>
                <button
                  type="button"
                  className="w-full rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-amber-600 hover:shadow-md hover:shadow-amber-500/20 active:scale-[0.98]"
                >
                  Send Reset Link
                </button>
                <p className="text-center text-[11px] text-neutral-400">
                  A password reset link will be sent to your registered email address.
                </p>
              </div>
            </div>
          )}

          {/* KwaraMOc Secure Platform badge */}
          <div className="mt-4 flex items-center justify-center gap-2 animate-[fadeIn_0.5s_ease-out_0.5s_both]">
            <div className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span className="text-[11px] font-semibold text-neutral-500 tracking-wide">KwaraMOc Secure Platform</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shake + fadeIn + float animation keyframes */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }
        @keyframes floatMed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-1deg); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 hover:border-neutral-400";
