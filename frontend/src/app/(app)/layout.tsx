"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SessionProvider, useSession } from "@/lib/session";
import { Sidebar, type NotificationCounts } from "@/components/Sidebar";
import { ROLE_LABELS, ROLE_LANDING_ROUTE } from "@/lib/nav";
import { canAccessRoute } from "@/lib/route-access";
import { Topbar } from "@/components/Topbar";
import { InstallPrompt } from "@/components/InstallPrompt";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { api } from "@/lib/api";


function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts>({});

  // Fetch notification counts for sidebar badges
  const fetchNotificationCounts = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get<{ count: number }>("/notifications/count");
      // Map the notification count to the relevant sidebar item by role.
      const counts: NotificationCounts = {};
      if (res.count > 0) {
        if (user.role === "ADMIN") {
          counts["/dashboard/triage"] = res.count;
        }
        if (user.role === "DEPARTMENT_STAFF") {
          counts["/dashboard/queue"] = res.count;
        }
        if (user.role === "DEPARTMENT_HOD") {
          counts["/dashboard/approvals"] = res.count;
        }
        if (user.role === "PERMANENT_SECRETARY" || user.role === "COMMISSIONER") {
          counts["/dashboard/approvals"] = res.count;
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

  // Client-side route guard: block deep links a role/permission can't access.
  useEffect(() => {
    if (!loading && user && pathname) {
      if (!canAccessRoute(user, pathname)) {
        const fallback = ROLE_LANDING_ROUTE[user.role] ?? "/dashboard";
        router.replace(fallback);
      }
    }
  }, [loading, user, pathname, router]);

  // While the access check resolves, hide the children for a blocked route.
  const blocked = !!user && !!pathname && !canAccessRoute(user, pathname);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-neutral-400">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  if (blocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        role={user.role}
        sessionUser={user}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        notificationCounts={notificationCounts}
        user={{ fullName: user.fullName, role: ROLE_LABELS[user.role] ?? user.role }}
      />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Topbar onMobileMenuToggle={() => setMobileMenuOpen((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
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
