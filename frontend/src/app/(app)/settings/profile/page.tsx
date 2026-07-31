"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { api, ApiError } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/nav";
import type { Department } from "@/lib/types";
import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Clock,
  Briefcase,
  Calendar,
  Loader2,
  AlertCircle,
  Edit3,
  KeyRound,
  Bell,
  HelpCircle,
} from "lucide-react";

interface MeResponse {
  id: string;
  email: string;
  role: string;
  fullName: string;
  departmentId: string | null;
}

const infoRow =
  "flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-4";

export default function ProfilePage() {
  const { user } = useSession();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      try {
        const data = await api.get<MeResponse>("/auth/me");
        if (!mounted) return;
        setMe(data);
        if (data.departmentId) {
          try {
            const depts = await api.get<Department[]>("/departments");
            const found = depts.find((d) => d.id === data.departmentId);
            if (mounted && found) setDepartment(found);
          } catch {
            // Department fetch optional
          }
        }
      } catch (err) {
        if (!mounted) return;
        if (err instanceof ApiError) setError(err.message);
        else setError("Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
        <span className="ml-2 text-sm text-neutral-500">Loading profile…</span>
      </div>
    );
  }

  if (error || !me) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
          <p className="mt-3 text-sm font-medium text-neutral-700">
            {error || "Failed to load profile"}
          </p>
        </div>
      </div>
    );
  }

  const initials = me.fullName
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleLabel =
    ROLE_LABELS[me.role as keyof typeof ROLE_LABELS] ?? me.role.replace(/_/g, " ");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-800">My Profile</h1>
        <p className="mt-1 text-sm text-neutral-500">
          View your account information and activity.
        </p>
      </div>

      {/* Profile Card with gradient header */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xl font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-neutral-900">
                {me.fullName}
              </h2>
              <p className="mt-0.5 text-sm text-neutral-600">{roleLabel}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {me.email}
                </span>
                {department?.name && (
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {department.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Read-only info grid */}
        <div className="grid grid-cols-1 gap-px bg-neutral-100 sm:grid-cols-2">
          <div className="bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Full name
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <User className="h-4 w-4 text-teal-600" />
              <span className="text-sm font-medium text-neutral-800">
                {me.fullName}
              </span>
            </div>
          </div>
          <div className="bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Role
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <Shield className="h-4 w-4 text-teal-600" />
              <span className="text-sm font-medium text-neutral-800">
                {roleLabel}
              </span>
            </div>
          </div>
          <div className="bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Email
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <Mail className="h-4 w-4 text-neutral-600" />
              <span className="text-sm text-neutral-800">{me.email}</span>
            </div>
          </div>
          <div className="bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Department
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-neutral-600" />
              <span className="text-sm text-neutral-800">
                {department?.name ?? "Not assigned"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Help cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50">
              <Edit3 className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-800">
                Need to update your details?
              </h3>
              <p className="mt-1 text-xs text-neutral-500">
                Your name, email, designation, role, and department are managed
                by your administrator. Contact your HOD or admin office to
                request changes.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50">
              <KeyRound className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-800">
                Account security
              </h3>
              <p className="mt-1 text-xs text-neutral-500">
                Your session expires after 8 hours. Use Sign out to end your
                session on this device. Contact IT if you suspect unauthorized
                access.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-50">
              <Bell className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-800">
                Notifications
              </h3>
              <p className="mt-1 text-xs text-neutral-500">
                You&apos;ll receive in-app notifications for new ticket
                assignments, escalations, and approval requests. Check the
                bell icon in the topbar.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-50">
              <HelpCircle className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-800">
                Keyboard shortcuts
              </h3>
              <p className="mt-1 text-xs text-neutral-500">
                <kbd className="rounded border border-neutral-300 bg-neutral-100 px-1 py-0.5 font-mono text-[10px]">
                  /
                </kbd>{" "}
                focus search ·{" "}
                <kbd className="rounded border border-neutral-300 bg-neutral-100 px-1 py-0.5 font-mono text-[10px]">
                  g d
                </kbd>{" "}
                go to dashboard ·{" "}
                <kbd className="rounded border border-neutral-300 bg-neutral-100 px-1 py-0.5 font-mono text-[10px]">
                  Esc
                </kbd>{" "}
                close modal
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
