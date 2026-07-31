"use client";

import { useState, useMemo, useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import type { Role } from "@/lib/types";
import { NAV_BY_ROLE, NAV_SECTIONS, ROLE_LABELS } from "@/lib/nav";
import type { NavItem } from "@/lib/nav";

/* ─── Lucide Icons ────────────────────────────────────────────────── */
import {
  LayoutDashboard,
  ClipboardList,
  Inbox,
  CheckCircle2,
  Users,
  Building2,
  RefreshCw,
  Archive,
  Clock,
  BarChart3,
  Route,
  Settings,
  ScrollText,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
  Moon,
  Sun,
  Star,
  ChevronRight,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ─── Icon Map ────────────────────────────────────────────────────── */

const ICON_MAP: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  clipboard: ClipboardList,
  inbox: Inbox,
  checkCircle: CheckCircle2,
  users: Users,
  building: Building2,
  refresh: RefreshCw,
  archive: Archive,
  clock: Clock,
  chart: BarChart3,
  route: Route,
  settings: Settings,
  scroll: ScrollText,
};

/* ─── Helpers ─────────────────────────────────────────────────────── */

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/* ─── Types ───────────────────────────────────────────────────────── */

/** Badge counts keyed by nav item href */
export interface NotificationCounts {
  [href: string]: number;
}

interface SidebarProps {
  role: Role;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  /** Notification counts for nav items (keyed by href) */
  notificationCounts?: NotificationCounts;
  /** Badge counts for nav items (keyed by href) — alias for notificationCounts */
  badges?: Record<string, number>;
  /** User profile info for the mini card at the bottom */
  user?: { fullName: string; role: string };
  /** Legacy: user profile with full role type */
  userProfile?: { fullName: string; role: Role; email?: string };
  /** Favorited nav item hrefs */
  favorites?: string[];
}

/* ─── Sidebar Component ───────────────────────────────────────────── */

export function Sidebar({
  role,
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onMobileClose,
  notificationCounts = {},
  badges = {},
  user,
  userProfile,
  favorites: favoriteHrefs = [],
}: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const items = NAV_BY_ROLE[role] ?? [];

  // Hydration-safe mounted detection using useSyncExternalStore
  const mounted = useSyncExternalStore(
    useCallback((onStoreChange: () => void) => {
      // No-op subscription — we only need the snapshot values
      return () => {};
    }, []),
    () => true,  // client snapshot
    () => false  // server snapshot
  );

  // Merge notificationCounts and badges (badges takes precedence)
  const allBadges = useMemo(() => ({ ...notificationCounts, ...badges }), [notificationCounts, badges]);

  // Resolve user info from either `user` or `userProfile` prop
  const resolvedUser = useMemo(() => {
    if (user) return user;
    if (userProfile) {
      return {
        fullName: userProfile.fullName,
        role: ROLE_LABELS[userProfile.role] ?? userProfile.role,
      };
    }
    return null;
  }, [user, userProfile]);

  // Determine which nav items are favorites
  const favoriteSet = useMemo(() => new Set(favoriteHrefs), [favoriteHrefs]);

  // Group items by section, filtered by search
  const groupedItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = query
      ? items.filter(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            item.section.toLowerCase().includes(query)
        )
      : items;

    const groups: Record<string, NavItem[]> = {};
    for (const item of filtered) {
      if (!groups[item.section]) groups[item.section] = [];
      groups[item.section].push(item);
    }
    return groups;
  }, [items, searchQuery]);

  // Favorite items (shown at top)
  const favoriteItems = useMemo(() => {
    if (favoriteHrefs.length === 0) return [];
    return items.filter((item) => favoriteSet.has(item.href));
  }, [items, favoriteHrefs, favoriteSet]);

  const isActive = useCallback(
    (href: string) => pathname === href || pathname.startsWith(href + "/"),
    [pathname]
  );

  const isDark = mounted && theme === "dark";

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onMobileClose}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col border-r border-neutral-200 bg-white
          dark:border-neutral-800 dark:bg-neutral-950
          transition-[width,transform] duration-300 ease-in-out
          md:relative md:z-auto
          ${collapsed ? "w-[68px]" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Animated decorative shimmer line */}
        <div className="relative h-[3px] w-full shrink-0 overflow-hidden bg-teal-100 dark:bg-teal-900/30">
          <div
            className="absolute inset-y-0 w-2/5 animate-shimmer rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, #0d9488, #14b8a6, #0d9488, transparent)",
            }}
          />
        </div>

        {/* Brand header */}
        <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-lg font-bold text-white">
            K
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="block text-sm font-semibold text-neutral-800 whitespace-nowrap dark:text-neutral-100 transition-opacity duration-200">
                KwaraMOc
              </span>
              <span className="block text-[10px] text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
                Complaint System
              </span>
            </div>
          )}
        </div>

        {/* Quick search input */}
        {!collapsed && (
          <div className="border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter menu…"
                className="w-full rounded-md border border-neutral-200 bg-neutral-50 py-1.5 pl-8 pr-3 text-xs text-neutral-700 placeholder-neutral-400 transition-colors focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:placeholder-neutral-500 dark:focus:border-teal-500 dark:focus:bg-neutral-800"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center border-b border-neutral-100 py-2 dark:border-neutral-800">
            <button
              onClick={() => {
                onToggleCollapse?.();
                setTimeout(() => searchInputRef.current?.focus(), 350);
              }}
              className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
              title="Search"
              aria-label="Expand and search"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin">
          {searchQuery && groupedItems && Object.keys(groupedItems).length === 0 && (
            <div className="px-3 py-6 text-center">
              <p className="text-xs text-neutral-400 dark:text-neutral-500">No matches found</p>
            </div>
          )}

          {/* Favorites section */}
          {favoriteItems.length > 0 && !searchQuery && (
            <div className="mb-3">
              {!collapsed && (
                <div className="mb-1 px-3 pt-2 pb-1 flex items-center gap-1.5">
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Favorites
                  </span>
                </div>
              )}
              {collapsed && (
                <div className="mx-auto mb-1 mt-2 h-px w-6 bg-amber-300 dark:bg-amber-700" />
              )}
              {favoriteItems.map((item) => {
                const IconComponent = ICON_MAP[item.icon];
                const active = isActive(item.href);
                const badgeCount = allBadges[item.href] ?? 0;

                return (
                  <Link
                    key={`fav-${item.href}`}
                    href={item.href}
                    onClick={() => {
                      onMobileClose?.();
                      setSearchQuery("");
                    }}
                    className={`
                      group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium
                      transition-all duration-200
                      ${
                        active
                          ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400"
                          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                      }
                      ${collapsed ? "justify-center" : ""}
                    `}
                    title={collapsed ? item.label : undefined}
                  >
                    {/* Active left border stripe */}
                    {active && (
                      <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-teal-600 dark:bg-teal-400 transition-all" />
                    )}

                    {/* Hover slide-in background */}
                    {!active && (
                      <div className="absolute inset-0 origin-left scale-x-0 rounded-lg bg-teal-50/60 transition-transform duration-200 group-hover:scale-x-100 dark:bg-teal-950/20" />
                    )}

                    {/* Icon */}
                    <span className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center">
                      {IconComponent ? (
                        <IconComponent
                          className={`h-[18px] w-[18px] ${
                            active ? "text-teal-600 dark:text-teal-400" : "text-neutral-500 group-hover:text-neutral-700 dark:text-neutral-400 dark:group-hover:text-neutral-200"
                          } transition-colors`}
                        />
                      ) : (
                        <span className="text-base">{item.icon}</span>
                      )}
                    </span>

                    {/* Label */}
                    {!collapsed && (
                      <span className="relative z-10 flex-1 whitespace-nowrap">
                        {item.label}
                      </span>
                    )}

                    {/* Star indicator for favorite */}
                    {!collapsed && (
                      <Star className="relative z-10 h-3 w-3 shrink-0 text-amber-500 fill-amber-500" />
                    )}

                    {/* Badge */}
                    {badgeCount > 0 && !collapsed && (
                      <span className="relative z-10 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-none text-white">
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}
                    {badgeCount > 0 && collapsed && (
                      <span className="absolute -right-0.5 -top-0.5 z-20 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Divider between favorites and regular nav */}
              <div className="mx-3 mt-2 border-t border-neutral-200 dark:border-neutral-700" />
            </div>
          )}

          {/* Regular nav sections */}
          {NAV_SECTIONS.map((section) => {
            const sectionItems = groupedItems[section.key];
            if (!sectionItems || sectionItems.length === 0) return null;

            // Filter out favorite items from regular sections to avoid duplicates
            const displayItems = favoriteItems.length > 0 && !searchQuery
              ? sectionItems.filter((item) => !favoriteSet.has(item.href))
              : sectionItems;

            if (displayItems.length === 0) return null;

            return (
              <div key={section.key} className="mb-3">
                {/* Section header */}
                {!collapsed && (
                  <div className="mb-1 px-3 pt-2 pb-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      {section.label}
                    </span>
                  </div>
                )}
                {collapsed && (
                  <div className="mx-auto mb-1 mt-2 h-px w-6 bg-neutral-200 dark:bg-neutral-700" />
                )}

                {/* Section items */}
                {displayItems.map((item) => {
                  const IconComponent = ICON_MAP[item.icon];
                  const active = isActive(item.href);
                  const badgeCount = allBadges[item.href] ?? 0;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        onMobileClose?.();
                        setSearchQuery("");
                      }}
                      className={`
                        group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium
                        transition-all duration-200
                        ${
                          active
                            ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400"
                            : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                        }
                        ${collapsed ? "justify-center" : ""}
                      `}
                      title={collapsed ? item.label : undefined}
                    >
                      {/* Active left border stripe */}
                      {active && (
                        <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-teal-600 dark:bg-teal-400 transition-all" />
                      )}

                      {/* Hover slide-in background */}
                      {!active && (
                        <div className="absolute inset-0 origin-left scale-x-0 rounded-lg bg-teal-50/60 transition-transform duration-200 group-hover:scale-x-100 dark:bg-teal-950/20" />
                      )}

                      {/* Icon */}
                      <span className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center">
                        {IconComponent ? (
                          <IconComponent
                            className={`h-[18px] w-[18px] ${
                              active ? "text-teal-600 dark:text-teal-400" : "text-neutral-500 group-hover:text-neutral-700 dark:text-neutral-400 dark:group-hover:text-neutral-200"
                            } transition-colors`}
                          />
                        ) : (
                          <span className="text-base">{item.icon}</span>
                        )}
                      </span>

                      {/* Label */}
                      {!collapsed && (
                        <span className="relative z-10 flex-1 whitespace-nowrap">
                          {item.label}
                        </span>
                      )}

                      {/* Notification count badge */}
                      {badgeCount > 0 && !collapsed && (
                        <span className="relative z-10 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-none text-white">
                          {badgeCount > 99 ? "99+" : badgeCount}
                        </span>
                      )}
                      {badgeCount > 0 && collapsed && (
                        <span className="absolute -right-0.5 -top-0.5 z-20 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
                          {badgeCount > 99 ? "99+" : badgeCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Bottom section: user profile + dark mode + collapse */}
        <div className="border-t border-neutral-200 dark:border-neutral-800">
          {/* User profile mini card */}
          {resolvedUser && !collapsed && (
            <Link
              href="/profile"
              className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
              onClick={() => onMobileClose?.()}
            >
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-semibold text-white">
                {getInitials(resolvedUser.fullName)}
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-neutral-950" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">
                  {resolvedUser.fullName}
                </p>
                <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-400">
                  {resolvedUser.role}
                </p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-400 dark:text-neutral-500" />
            </Link>
          )}
          {resolvedUser && collapsed && (
            <Link
              href="/profile"
              className="flex justify-center py-2 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
              onClick={() => onMobileClose?.()}
              title={`${resolvedUser.fullName} — ${resolvedUser.role}`}
            >
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-teal-700 text-xs font-semibold text-white">
                {getInitials(resolvedUser.fullName)}
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-neutral-950" />
              </div>
            </Link>
          )}

          {/* Dark mode toggle + collapse toggle row */}
          <div className="flex items-center gap-1 px-2 py-2">
            {/* Dark mode toggle */}
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              {!collapsed && <span className="text-xs">{isDark ? "Light" : "Dark"}</span>}
            </button>

            {/* Collapse toggle (desktop only) */}
            <button
              onClick={onToggleCollapse}
              className="hidden flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-700 md:flex dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4" />
                  <span className="text-xs">Collapse</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Version badge footer */}
        {!collapsed && (
          <div className="border-t border-neutral-200 px-4 py-2 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-teal-50 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700 dark:bg-teal-950/40 dark:text-teal-400">
                v0.1.0
              </span>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-600">Milestone 1</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
