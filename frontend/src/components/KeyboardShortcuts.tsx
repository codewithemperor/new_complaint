"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { ROLE_LANDING_ROUTE } from "@/lib/nav";

/**
 * Global keyboard shortcuts handler.
 *
 * Shortcuts:
 *   g d  → go to dashboard
 *   g l  → go to login (or home if logged in)
 *   g t  → go to track page
 *   g r  → go to report page
 *   ?    → show shortcuts hint (future enhancement)
 *   /    → focus the topbar search (dispatches custom event)
 *   Esc  → close any open modal/dropdown (dispatches custom event)
 *
 * Works on any authenticated page (within the (app) layout).
 */
export function KeyboardShortcuts() {
  const router = useRouter();
  const { user } = useSession();

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea/contenteditable
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.tagName === "SELECT")
      ) {
        // Only allow Escape to blur
        if (e.key === "Escape") {
          (target as HTMLElement).blur();
        }
        return;
      }

      // Skip if any meta key except for ? shortcut
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Single-key shortcuts
      if (e.key === "/" && user) {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent("kwmoc:focus-search"));
        return;
      }
      if (e.key === "Escape") {
        document.dispatchEvent(new CustomEvent("kwmoc:escape"));
        return;
      }
      if (e.key === "?") {
        document.dispatchEvent(new CustomEvent("kwmoc:show-shortcuts"));
        return;
      }

      // Two-key shortcuts: g + key
      if (e.key === "g") {
        const onSecondKey = (ev: KeyboardEvent) => {
          window.removeEventListener("keydown", onSecondKey);
          if (!user) return;
          const dest = ROLE_LANDING_ROUTE[user.role] || "/";
          if (ev.key === "d") {
            ev.preventDefault();
            router.push(dest);
          } else if (ev.key === "l") {
            ev.preventDefault();
            router.push("/login");
          } else if (ev.key === "t") {
            ev.preventDefault();
            router.push("/track");
          } else if (ev.key === "r") {
            ev.preventDefault();
            router.push("/report");
          } else if (ev.key === "a") {
            ev.preventDefault();
            router.push("/admin/complaints");
          }
        };
        window.addEventListener("keydown", onSecondKey, { once: true });
        // Cleanup if second key never comes
        setTimeout(() => window.removeEventListener("keydown", onSecondKey), 1000);
      }
    },
    [router, user],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return null;
}
