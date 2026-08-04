"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";

/**
 * InstallPrompt — a slim, dismissible banner that surfaces the browser's
 * install prompt (Chrome/Android via beforeinstallprompt). Hidden where
 * unsupported. Per planning/milestone-8 §5.3.
 *
 * Design: slides up from bottom-right with a soft shadow. Dismissal is
 * remembered for the session so it doesn't keep nagging users.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "kwmoc_install_dismissed_at";
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [dismissedAt, setDismissedAt] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(DISMISS_KEY);
      if (!raw) return null;
      const ts = parseInt(raw, 10);
      if (Number.isFinite(ts) && Date.now() - ts < DISMISS_TTL_MS) {
        return ts;
      }
      return null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred || dismissedAt !== null) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted" || choice.outcome === "dismissed") {
      setDeferred(null);
      setDismissedAt(Date.now());
    }
  }

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setDismissedAt(Date.now());
  }

  return (
    <div
      role="dialog"
      aria-labelledby="install-prompt-title"
      aria-describedby="install-prompt-desc"
      className="fixed bottom-4 right-4 z-40 w-[300px] overflow-hidden rounded-2xl border border-green-200 bg-neutral-50 shadow-xl shadow-green-900/10 animate-in slide-in-from-bottom-4 duration-300"
    >
      {/* Accent strip */}
      <div className="h-1 bg-green-500" />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-green-50 ring-1 ring-green-100">
            <Smartphone size={18} className="text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p
                id="install-prompt-title"
                className="text-sm font-semibold text-neutral-900"
              >
                Install KwaraMOc
              </p>
              <button
                onClick={dismiss}
                aria-label="Dismiss install prompt"
                className="-mt-1 -mr-1 rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X size={14} />
              </button>
            </div>
            <p
              id="install-prompt-desc"
              className="mt-1 text-xs leading-relaxed text-neutral-500"
            >
              Add the app to your home screen for quick, offline-friendly
              access.
            </p>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={install}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md active:scale-[0.98]"
          >
            <Download size={13} />
            Install now
          </button>
          <button
            onClick={dismiss}
            className="rounded-lg px-3 py-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
