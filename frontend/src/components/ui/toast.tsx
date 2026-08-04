"use client";

import { useEffect, useCallback } from "react";
import { create } from "zustand";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  add: (toast: Omit<Toast, "id">) => string;
  remove: (id: string) => void;
  clear: () => void;
}

const TOAST_STYLES: Record<
  ToastType,
  {
    icon: LucideIcon;
    bg: string;
    border: string;
    iconColor: string;
    title: string;
    message: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    bg: "bg-green-50",
    border: "border-green-200",
    iconColor: "text-green-600",
    title: "text-green-900",
    message: "text-green-700",
  },
  error: {
    icon: AlertCircle,
    bg: "bg-red-50",
    border: "border-red-200",
    iconColor: "text-red-600",
    title: "text-red-900",
    message: "text-red-700",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconColor: "text-amber-600",
    title: "text-amber-900",
    message: "text-amber-700",
  },
  info: {
    icon: Info,
    bg: "bg-green-50",
    border: "border-green-200",
    iconColor: "text-green-600",
    title: "text-green-900",
    message: "text-green-700",
  },
};

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    return id;
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

export function useToast() {
  const add = useToastStore((s) => s.add);
  const remove = useToastStore((s) => s.remove);
  return {
    success: (title: string, message?: string, duration?: number) =>
      add({ type: "success", title, message, duration }),
    error: (title: string, message?: string, duration?: number) =>
      add({ type: "error", title, message, duration }),
    warning: (title: string, message?: string, duration?: number) =>
      add({ type: "warning", title, message, duration }),
    info: (title: string, message?: string, duration?: number) =>
      add({ type: "info", title, message, duration }),
    dismiss: (id: string) => remove(id),
  };
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => remove(t.id), t.duration ?? 4000),
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, remove]);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
    >
      {toasts.map((t) => {
        const style = TOAST_STYLES[t.type];
        const Icon = style.icon;
        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border ${style.border} ${style.bg} p-3.5 shadow-md animate-[fadeIn_0.2s_ease-out]`}
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconColor}`} />
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold ${style.title}`}>
                {t.title}
              </p>
              {t.message && (
                <p className={`mt-0.5 text-xs ${style.message}`}>{t.message}</p>
              )}
            </div>
            <button
              onClick={() => remove(t.id)}
              className="shrink-0 rounded p-0.5 text-neutral-400 transition-colors hover:text-neutral-700"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
