import Link from "next/link";

/**
 * Offline fallback page — precached by Serwist and served when a navigation
 * request fails (no network). Plain HTML (no HeroUI) so it renders even in
 * the most constrained offline SW context. Per planning/milestone-8 §5.3.
 */
export default function OfflinePage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-neutral-50 px-4"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-neutral-800">You&apos;re offline</h1>
        <p className="mt-1 text-sm text-neutral-500">No internet connection detected</p>
        <p className="mt-4 text-sm text-neutral-600">
          The KwaraMOc Complaints app can&apos;t reach the server right now.
          Your work is safe — once you&apos;re back online, reconnect and try
          again.
        </p>
        <Link
          href="/"
          className="mt-4 block w-full rounded-lg border border-neutral-300 py-2 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Try again
        </Link>
      </div>
    </div>
  );
}
