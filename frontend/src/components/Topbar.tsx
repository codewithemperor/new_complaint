"use client";

import { useEffect, useState, useRef, useCallback, useSyncExternalStore } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/lib/session";
import { ROLE_LABELS, getPageTitle } from "@/lib/nav";
import { useBreadcrumbStore } from "@/lib/breadcrumb-store";
import { api } from "@/lib/api";
import { useTheme } from "next-themes";
import type { Role } from "@/lib/types";
import {
  Home,
  ChevronRight,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Maximize2,
  Minimize2,
  HelpCircle,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Plus,
  ClipboardList,
  Inbox,
  BarChart3,
  X,
  Keyboard,
  Zap,
  User,
  Clock,
  Trash2,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────────── */

interface NotificationItem {
  id: string;
  ticketCode: string;
  subject: string;
  status: string;
  action: string;
  createdAt: string;
  link: string;
}

/* ─── Helpers ─────────────────────────────────────────────────────── */

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  if (diffMs < 0) return "just now";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  return new Date(dateStr).toLocaleDateString();
}

function getNotificationType(action: string): "info" | "warning" | "urgent" | "success" {
  const lower = action.toLowerCase();
  if (lower.includes("urgent") || lower.includes("critical") || lower.includes("escalat")) return "urgent";
  if (lower.includes("overdue") || lower.includes("breach") || lower.includes("warn")) return "warning";
  if (lower.includes("resolved") || lower.includes("approved") || lower.includes("closed")) return "success";
  return "info";
}

const NOTIFICATION_DOT_COLORS: Record<string, string> = {
  info: "bg-teal-500",
  warning: "bg-amber-500",
  urgent: "bg-red-500",
  success: "bg-emerald-500",
};

/* ─── Role Badge Colors ──────────────────────────────────────────── */

const ROLE_BADGE_COLORS: Record<Role, string> = {
  SUPER_ADMIN: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  ADMIN_OFFICER: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  SCHEDULE_OFFICER: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
  INTAKE_OFFICER: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  ASSISTANT_DIRECTOR: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  DEPUTY_DIRECTOR: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  DIRECTOR: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  PERMANENT_SECRETARY: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
  COMMISSIONER: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  AUDITOR: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
};

/* ─── Quick Actions Config ────────────────────────────────────────── */

interface QuickAction {
  label: string;
  icon: React.ElementType;
  href: string;
  shortcut?: string;
}

function getQuickActions(role: Role): QuickAction[] {
  const actions: QuickAction[] = [];

  if (["INTAKE_OFFICER", "ADMIN_OFFICER", "SUPER_ADMIN"].includes(role)) {
    actions.push({ label: "New Ticket", icon: Plus, href: "/intake", shortcut: "N" });
  }

  if (["ADMIN_OFFICER", "SUPER_ADMIN"].includes(role)) {
    actions.push({ label: "Classify", icon: Inbox, href: "/admin/triage", shortcut: "C" });
  }

  actions.push({ label: "Reports", icon: BarChart3, href: "/auditor/reports", shortcut: "R" });

  if (["SUPER_ADMIN", "ADMIN_OFFICER"].includes(role)) {
    actions.push({ label: "All Complaints", icon: ClipboardList, href: "/admin/complaints", shortcut: "A" });
  }

  return actions;
}

/* ─── Recent Searches (localStorage) ──────────────────────────────── */

const RECENT_SEARCHES_KEY = "kwara_recent_searches";
const MAX_RECENT_SEARCHES = 3;

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as string[];
  } catch {
    return [];
  }
}

function addRecentSearch(query: string) {
  if (typeof window === "undefined") return;
  try {
    const existing = getRecentSearches();
    const filtered = existing.filter((s) => s !== query);
    const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // silently fail
  }
}

function clearRecentSearches() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // silently fail
  }
}

/* ─── Keyboard Shortcuts ──────────────────────────────────────────── */

const KEYBOARD_SHORTCUTS = [
  { keys: "?", description: "Show keyboard shortcuts" },
  { keys: "N", description: "New ticket" },
  { keys: "C", description: "Classify & Review" },
  { keys: "R", description: "Reports" },
  { keys: "/", description: "Focus search" },
  { keys: "F", description: "Toggle fullscreen" },
  { keys: "D", description: "Toggle dark mode" },
  { keys: "Esc", description: "Close dialogs" },
];

/* ─── Topbar Component ────────────────────────────────────────────── */

export function Topbar({ onMobileMenuToggle }: { onMobileMenuToggle?: () => void }) {
  const { user, logout } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Use useSyncExternalStore for mounted detection (avoids setState in effect)
  const emptySubscribe = useCallback(() => () => {}, []);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Compute recent searches on demand (avoid setState in effect)
  const recentSearches = searchFocused && searchQuery.trim() === "" ? getRecentSearches() : [];

  const bellRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLButtonElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const quickActionsBtnRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const isDark = mounted && theme === "dark";

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const [countRes, listRes] = await Promise.all([
        api.get<{ count: number }>("/notifications/count"),
        api.get<NotificationItem[]>("/notifications/list"),
      ]);
      setCount(countRes.count);
      setItems(listRes);
    } catch {
      // silently degrade — notifications are non-critical
    }
  }, [user]);

  // Poll every 60 seconds
  useEffect(() => {
    const initialTimer = setTimeout(fetchNotifications, 100);
    const interval = setInterval(fetchNotifications, 60_000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // Fullscreen toggle
  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        if (e.key === "Escape") {
          (target as HTMLInputElement).blur();
        }
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setShortcutsOpen(false);
        setQuickActionsOpen(false);
        setOpen(false);
        setUserMenuOpen(false);
      } else if (e.key === "/") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>("[data-topbar-search]");
        searchInput?.focus();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        setTheme(isDark ? "light" : "dark");
      } else if (user) {
        const quickActions = getQuickActions(user.role);
        const matched = quickActions.find((a) => a.shortcut === e.key.toUpperCase());
        if (matched) {
          e.preventDefault();
          router.push(matched.href);
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDark, user, router, setTheme]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node) &&
        avatarRef.current &&
        !avatarRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
      if (
        quickActionsRef.current &&
        !quickActionsRef.current.contains(e.target as Node) &&
        quickActionsBtnRef.current &&
        !quickActionsBtnRef.current.contains(e.target as Node)
      ) {
        setQuickActionsOpen(false);
      }
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && searchQuery.trim()) {
      const q = searchQuery.trim();
      addRecentSearch(q);
      let searchPath = "/admin/complaints";
      if (user?.role === "INTAKE_OFFICER") searchPath = "/intake";
      else if (user?.role === "DIRECTOR") searchPath = "/hod/complaints";
      else if (user?.role === "SCHEDULE_OFFICER" || user?.role === "ASSISTANT_DIRECTOR" || user?.role === "DEPUTY_DIRECTOR")
        searchPath = "/officer/queue";
      router.push(`${searchPath}?search=${encodeURIComponent(q)}`);
      setSearchQuery("");
      setSearchFocused(false);
    }
  }

  function handleRecentSearchClick(query: string) {
    setSearchQuery(query);
    addRecentSearch(query);
    let searchPath = "/admin/complaints";
    if (user?.role === "INTAKE_OFFICER") searchPath = "/intake";
    else if (user?.role === "DIRECTOR") searchPath = "/hod/complaints";
    else if (user?.role === "SCHEDULE_OFFICER" || user?.role === "ASSISTANT_DIRECTOR" || user?.role === "DEPUTY_DIRECTOR")
      searchPath = "/officer/queue";
    router.push(`${searchPath}?search=${encodeURIComponent(query)}`);
    setSearchQuery("");
    setSearchFocused(false);
  }

  function handleClearRecentSearches() {
    clearRecentSearches();
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  function handleMarkAllRead() {
    setCount(0);
  }

  const customTitle = useBreadcrumbStore((s) => s.customTitle);

  if (!user) return null;

  const pageTitle = customTitle ?? getPageTitle(pathname);
  const quickActions = getQuickActions(user.role);
  const roleBadgeColor = ROLE_BADGE_COLORS[user.role] || "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300";
  const showRecentSearches = searchFocused && searchQuery.trim() === "" && recentSearches.length > 0;

  return (
    <>
      <header className="relative flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-2.5 md:px-6 dark:border-neutral-800 dark:bg-neutral-950">
        {/* Left: Mobile menu + Breadcrumb */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={onMobileMenuToggle}
            className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100 md:hidden dark:text-neutral-300 dark:hover:bg-neutral-800"
            aria-label="Toggle menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Breadcrumb / Page title with animated underline */}
          <div className="flex items-center gap-2">
            <Home className="hidden h-4 w-4 text-neutral-400 sm:block dark:text-neutral-500" />
            <span className="hidden text-sm text-neutral-500 sm:inline dark:text-neutral-400">Home</span>
            <ChevronRight className="hidden h-3.5 w-3.5 text-neutral-300 sm:inline dark:text-neutral-600" />
            {/* Animated underline on breadcrumb page title */}
            <div className="relative">
              <span className="text-sm font-medium text-neutral-800 dark:text-neutral-100">{pageTitle}</span>
              <div className="absolute -bottom-0.5 left-0 h-[2px] w-full origin-left animate-[underline-grow_1.5s_ease-in-out_infinite] rounded-full bg-teal-500/60" />
            </div>
          </div>
        </div>

        {/* Center: Search bar (hidden on mobile) + Quick Actions */}
        <div className="mx-4 hidden max-w-md flex-1 items-center gap-2 md:flex">
          <div className="relative w-full" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              data-topbar-search
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              onFocus={() => setSearchFocused(true)}
              placeholder="Search tickets…"
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-10 text-sm text-neutral-800 placeholder-neutral-400 transition-colors focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:placeholder-neutral-500 dark:focus:border-teal-500 dark:focus:bg-neutral-800"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500">
              /
            </kbd>

            {/* Recent Searches Dropdown */}
            {showRecentSearches && (
              <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Recent searches</span>
                  <button
                    onClick={handleClearRecentSearches}
                    className="flex items-center gap-1 text-xs text-neutral-400 transition-colors hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear
                  </button>
                </div>
                <div className="py-1">
                  {recentSearches.map((query, idx) => (
                    <button
                      key={`${query}-${idx}`}
                      onClick={() => handleRecentSearchClick(query)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      <Search className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
                      <span className="flex-1 truncate">{query}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions dropdown */}
          <div className="relative">
            <button
              ref={quickActionsBtnRef}
              onClick={() => setQuickActionsOpen((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              aria-label="Quick actions"
            >
              <Zap className="h-4 w-4" />
              <span className="hidden lg:inline">Actions</span>
            </button>

            {quickActionsOpen && (
              <div
                ref={quickActionsRef}
                className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 dark:border-neutral-700 dark:bg-neutral-900"
              >
                <div className="border-b border-neutral-100 px-4 py-2.5 dark:border-neutral-800">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Quick Actions
                  </h3>
                </div>
                <div className="py-1">
                  {quickActions.map((action) => {
                    const ActionIcon = action.icon;
                    return (
                      <button
                        key={action.label}
                        onClick={() => {
                          setQuickActionsOpen(false);
                          router.push(action.href);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                      >
                        <ActionIcon className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                        <span className="flex-1">{action.label}</span>
                        {action.shortcut && (
                          <kbd className="rounded border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500">
                            {action.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="hidden rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 sm:flex dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode (D)" : "Dark mode (D)"}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Notification sound toggle */}
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="hidden rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 sm:flex dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            aria-label={soundEnabled ? "Mute notifications" : "Unmute notifications"}
            title={soundEnabled ? "Mute sounds" : "Unmute sounds"}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="hidden rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 sm:flex dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>

          {/* Help / FAQ button */}
          <a
            href="/#faq"
            className="hidden rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 sm:flex dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            aria-label="Help & FAQ"
            title="Help & FAQ"
          >
            <HelpCircle className="h-4 w-4" />
          </a>

          {/* Notification bell */}
          <div className="relative">
            <button
              ref={bellRef}
              onClick={() => {
                setOpen((prev) => !prev);
                setCount(0);
              }}
              className="relative rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {open && (
              <div
                ref={dropdownRef}
                className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 dark:border-neutral-700 dark:bg-neutral-900"
              >
                <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                      Notifications
                    </h3>
                    {items.length > 0 && (
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                        {items.length} new
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                    Items requiring your action
                  </p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Inbox className="mx-auto mb-2 h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                      <p className="text-sm text-neutral-400 dark:text-neutral-500">No pending items</p>
                    </div>
                  ) : (
                    items.map((item) => {
                      const nType = getNotificationType(item.action);
                      const dotColor = NOTIFICATION_DOT_COLORS[nType];
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setOpen(false);
                            router.push(item.link);
                          }}
                          className="flex w-full gap-3 border-b border-neutral-50 px-4 py-3 text-left transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
                        >
                          <div className="mt-1 flex h-2.5 w-2.5 shrink-0 items-start justify-center pt-1">
                            <div className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">
                              {item.subject}
                            </p>
                            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                              {item.ticketCode} · {item.action}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
                            {relativeTime(item.createdAt)}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
                {items.length > 0 && (
                  <div className="border-t border-neutral-100 px-4 py-2.5 dark:border-neutral-800">
                    <button
                      onClick={handleMarkAllRead}
                      className="w-full rounded-lg py-1.5 text-xs font-medium text-teal-600 transition-colors hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/20"
                    >
                      Mark all as read
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User avatar + menu */}
          <div className="relative">
            <button
              ref={avatarRef}
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <div className="relative">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white">
                  {getInitials(user.fullName)}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-neutral-950" />
              </div>
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium text-neutral-800 leading-tight dark:text-neutral-100">
                  {user.fullName}
                </p>
                <p className="text-xs text-neutral-500 leading-tight dark:text-neutral-400">
                  {ROLE_LABELS[user.role]}
                </p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-neutral-400 md:block dark:text-neutral-500" />
            </button>

            {/* Enhanced user dropdown with last login and role badge */}
            {userMenuOpen && (
              <div
                ref={userMenuRef}
                className="absolute right-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 dark:border-neutral-700 dark:bg-neutral-900"
              >
                <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                      {getInitials(user.fullName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">{user.fullName}</p>
                      <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{user.email}</p>
                    </div>
                  </div>
                  {/* Role badge with colored background */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${roleBadgeColor}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </div>
                  {/* Last login time - always show, default "Never" */}
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                    <Clock className="h-3 w-3" />
                    <span>Last login: {user.lastLoginAt ? relativeTime(user.lastLoginAt) : "Never"}</span>
                  </div>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      router.push("/settings/profile");
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                  >
                    <User className="h-4 w-4" />
                    View Profile
                  </button>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Keyboard shortcut indicator */}
          <button
            onClick={() => setShortcutsOpen(true)}
            className="hidden rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 lg:flex dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
          >
            <div className="relative">
              <Keyboard className="h-4 w-4" />
              <span className="absolute -right-1.5 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-neutral-800 text-[8px] font-bold text-white dark:bg-neutral-200 dark:text-neutral-800">
                ?
              </span>
            </div>
          </button>
        </div>

        {/* Animated bottom border - teal gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] animate-[border-shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-teal-500 to-transparent" />
      </header>

      {/* Keyboard Shortcuts Overlay */}
      {shortcutsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={() => setShortcutsOpen(false)}>
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-100">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={() => setShortcutsOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="space-y-2">
                {KEYBOARD_SHORTCUTS.map((shortcut) => (
                  <div key={shortcut.keys} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-neutral-600 dark:text-neutral-300">{shortcut.description}</span>
                    <kbd className="rounded border border-neutral-200 bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
