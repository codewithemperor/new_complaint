"use client";

/**
 * Placeholder for routes that haven't been built yet (replaced in later milestones).
 * Keeps role redirects functional during M1.
 */
export function PlaceholderPage({ title, milestone }: { title: string; milestone: string }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-neutral-800">{title}</h2>
          <p className="text-sm text-neutral-500">Coming in {milestone}</p>
        </div>
        <div>
          <p className="text-sm text-neutral-500">
            This page is a placeholder. The full feature will be implemented in{" "}
            <strong>{milestone}</strong>. The authentication and role-based navigation are
            working — you&apos;re seeing this because your role has access to this route.
          </p>
        </div>
      </div>
    </div>
  );
}
