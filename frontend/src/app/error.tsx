"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw, Home, Bug } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to the console for debugging
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          An unexpected error occurred while loading this page. Our team has
          been notified. Please try again or return to the homepage.
        </p>

        {error?.message && (
          <details className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-left">
            <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-neutral-600">
              <Bug className="h-3.5 w-3.5" />
              Technical details
            </summary>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-[11px] text-neutral-500">
              {error.message}
              {error.digest ? `\nDigest: ${error.digest}` : ""}
            </pre>
          </details>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
          >
            <RotateCw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            <Home className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
