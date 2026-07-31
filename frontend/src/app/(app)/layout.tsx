"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SessionProvider, useSession } from "@/lib/session";
import { Sidebar, type NotificationCounts } from "@/components/Sidebar";
import { ROLE_LABELS } from "@/lib/nav";
import { Topbar } from "@/components/Topbar";
import { InstallPrompt } from "@/components/InstallPrompt";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { api } from "@/lib/api";


function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts>({});

  // Fetch notification counts for sidebar badges
  const fetchNotificationCounts = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get<{ count: number }>("/notifications/count");
      // Map the notification count to relevant sidebar items
      // For now, we show the count on "Classify & Review" for admin/super_admin roles
      // and on "My Work" for officer roles
      const counts: NotificationCounts = {};
      if (res.count > 0) {
        if (["ADMIN_OFFICER", "SUPER_ADMIN"].includes(user.role)) {
          counts["/admin/triage"] = res.count;
        }
        if (["SCHEDULE_OFFICER", "ASSISTANT_DIRECTOR", "DEPUTY_DIRECTOR"].includes(user.role)) {
          counts["/officer/queue"] = res.count;
        }
        if (user.role === "DIRECTOR") {
          counts["/hod/approvals"] = res.count;
        }
        if (user.role === "PERMANENT_SECRETARY") {
          counts["/ps/inbox"] = res.count;
        }
        if (user.role === "COMMISSIONER") {
          counts["/commissioner/inbox"] = res.count;
        }
        if (user.role === "INTAKE_OFFICER") {
          counts["/intake"] = res.count;
        }
      }
      setNotificationCounts(counts);
    } catch {
      // silently degrade
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(fetchNotificationCounts, 500);
    const interval = setInterval(fetchNotificationCounts, 60_000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchNotificationCounts, user]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-neutral-400">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Sidebar
        role={user.role}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        notificationCounts={notificationCounts}
        user={{ fullName: user.fullName, role: ROLE_LABELS[user.role] ?? user.role }}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar onMobileMenuToggle={() => setMobileMenuOpen((prev) => !prev)} />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
      <InstallPrompt />
      <KeyboardShortcuts />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
