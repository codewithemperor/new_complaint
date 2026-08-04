"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Modal, Button as HeroButton, Input as HeroInput } from "@heroui/react";
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
  Mail,
  Search,
  CheckCircle2,
  Zap,
  KeyRound,
  Star,
  Inbox,
  ClipboardList,
  Building2,
  Briefcase,
  Crown,
  Shield,
  type LucideIcon,
} from "lucide-react";

// Quick-access test accounts. Disabled unless NEXT_PUBLIC_SHOW_TEST_ACCOUNTS is set,
// so they never appear in production.
const TEST_ACCOUNTS = process.env.NEXT_PUBLIC_SHOW_TEST_ACCOUNTS
  ? [
      { email: "superadmin@kwmoc.gov.ng", role: "Super Admin", icon: "star" },
      {
        email: "admin@kwmoc.gov.ng",
        role: "Administrator (full)",
        icon: "shield",
      },
      {
        email: "intake.admin@kwmoc.gov.ng",
        role: "Admin (Intake+Reports)",
        icon: "inbox",
      },
      {
        email: "staff@kwmoc.gov.ng",
        role: "Department Staff",
        icon: "clipboard",
      },
      { email: "hod@kwmoc.gov.ng", role: "Department HOD", icon: "building" },
      { email: "ps@kwmoc.gov.ng", role: "Perm. Secretary", icon: "briefcase" },
      {
        email: "commissioner@kwmoc.gov.ng",
        role: "Commissioner",
        icon: "crown",
      },
      { email: "auditor@kwmoc.gov.ng", role: "Auditor", icon: "search" },
    ]
  : [];

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

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";

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
  const [resetEmail, setResetEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email, password);
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

  const fillTestAccount = useCallback((email: string) => {
    setEmail(email);
    setPassword("password123");
  }, []);

  function openForgotPassword() {
    setResetEmail(email);
    setShowForgotPassword(true);
  }

  function handleSendResetLink() {
    // TODO: wire up to actual reset-password endpoint
    setShowForgotPassword(false);
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
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950/85 via-primary-900/40 to-gray-950/70" />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-12">
          {/* <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-primary-300/50 bg-white shadow-2xl">
            <Image
              src="/Kwara-logo-3.webp"
              alt="Kwara State Logo"
              width={112}
              height={112}
              className="h-full w-full object-contain p-2"
            />
          </div> */}

          {/* <div className="text-center text-white">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Kwara State Ministry of Complaints
            </h1>
            <p className="mt-2 max-w-sm text-sm text-white/80">
              Complaint Management &amp; Ticketing System — your voice,
              delivered to the right office.
            </p>
          </div> */}

          {/* <div className="mt-2 flex flex-col gap-3">
            {[
              { text: "Track complaints in real-time", icon: Search },
              { text: "Transparent resolution process", icon: CheckCircle2 },
              { text: "Secure & confidential", icon: ShieldCheck },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2.5 text-sm text-white/90">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-500/20">
                  <item.icon size={14} className="text-primary-300" />
                </div>
                <span>{item.text}</span>
              </div>
            ))}
          </div> */}
        </div>
      </div>

      {/* ── Right: form column ──────────────────────────────────────── */}
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-10 md:w-1/2 md:max-h-screen md:overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Logo + heading */}
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-primary-200 bg-white shadow-sm">
              <Image
                src="/Kwara-logo-3.webp"
                alt="Kwara State Logo"
                width={64}
                height={64}
                className="h-full w-full object-contain p-1.5"
              />
            </div>
            <div className="text-center">
              <h2 className="font-heading text-lg font-semibold text-gray-900">
                KwaraMOc Complaints
              </h2>
              <p className="text-sm text-gray-500">
                Sign in to your staff account
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="px-6 pt-6 pb-2">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Email field */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className={inputClass + " pl-9"}
                      placeholder="you@kwmoc.gov.ng"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={openForgotPassword}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className={inputClass + " pr-10"}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                  />
                  <label htmlFor="rememberMe" className="text-sm text-gray-600">
                    Remember me for 30 days
                  </label>
                </div>

                {/* Error display */}
                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
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
                  className="mt-2 w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Authenticating…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Lock size={14} />
                      Sign in
                    </span>
                  )}
                </button>
              </form>
            </div>

            <div className="border-t border-gray-100 px-6 py-4">
              <p className="text-center text-xs text-gray-400">
                Complaint Management &amp; Ticketing System ·{" "}
                <Link href="/" className="text-primary-600 hover:underline">
                  Back to home
                </Link>
              </p>
            </div>
          </div>

          {/* Test accounts (dev only) */}
          {TEST_ACCOUNTS.length > 0 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowTestAccounts(!showTestAccounts)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-600 hover:border-primary-200 hover:text-primary-700"
              >
                <Zap size={14} className="text-primary-600" />
                {showTestAccounts
                  ? "Hide test accounts"
                  : "Quick Access — Test Accounts"}
              </button>

              {showTestAccounts && (
                <div className="mt-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-800">
                      Quick Access
                    </p>
                    <p className="text-xs text-gray-400">
                      Password:{" "}
                      <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-gray-600">
                        password123
                      </code>
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {TEST_ACCOUNTS.map((acc) => {
                      const RoleIcon = ROLE_ICONS[acc.icon] || ShieldCheck;
                      return (
                        <button
                          key={acc.email}
                          type="button"
                          onClick={() => fillTestAccount(acc.email)}
                          className="flex items-center gap-2.5 rounded-lg border border-primary-100 bg-primary-50 px-3 py-2.5 text-left transition-colors hover:bg-primary-100"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-primary-700 ring-1 ring-inset ring-primary-200">
                            <RoleIcon size={15} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-primary-700">
                              {acc.role}
                            </p>
                            <p className="truncate text-[11px] text-gray-400">
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
          )}
        </div>
      </div>

      {/* ── Forgot password — HeroUI Modal, centered ──────────────────── */}
      <Modal isOpen={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <Modal.Backdrop>
          <Modal.Container placement="center">
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Icon>
                  <KeyRound size={18} className="text-secondary-600" />
                </Modal.Icon>
                <Modal.Heading>Reset Your Password</Modal.Heading>
              </Modal.Header>

              <Modal.Body>
                <p className="mb-4 text-sm text-gray-500">
                  Enter your registered email and we&apos;ll send you a link to
                  reset your password.
                </p>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Registered email address
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className={inputClass + " pl-9"}
                    placeholder="you@kwmoc.gov.ng"
                    autoFocus
                  />
                </div>
              </Modal.Body>

              <Modal.Footer>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendResetLink}
                  className="rounded-lg bg-secondary-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-secondary-600"
                >
                  Send Reset Link
                </button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
