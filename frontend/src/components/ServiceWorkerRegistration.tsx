"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw, X } from "lucide-react";

/**
 * ServiceWorkerRegistration — registers the service worker on mount and
 * listens for online/offline events to show a connection status banner.
 */
export function ServiceWorkerRegistration() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [swRegistered, setSwRegistered] = useState(false);

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    // Track online status
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (!online) setShowOfflineBanner(true);
    };
    updateOnlineStatus();
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Register service worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            setSwRegistered(true);
            // Check for updates every 60 minutes
            setInterval(() => reg.update(), 60 * 60 * 1000);
          })
          .catch((err) => {
            console.warn("Service worker registration failed:", err);
          });
      });
    }

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  if (!showOfflineBanner || isOnline) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] bg-amber-500 px-4 py-3 text-white shadow-lg">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <WifiOff className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">You&apos;re offline</p>
            <p className="text-xs text-amber-50">
              Some features may be unavailable. Changes will sync when you
              reconnect.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 rounded-md bg-neutral-50/15 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-50/25"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
          <button
            onClick={() => setShowOfflineBanner(false)}
            className="rounded p-1 text-white/80 transition-colors hover:text-white"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
