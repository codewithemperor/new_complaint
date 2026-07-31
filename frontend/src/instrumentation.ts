/**
 * Next.js instrumentation hook.
 *
 * Serwist (@serwist/next) auto-registers the service worker when `disable` is
 * false (production builds). No manual registration is needed here. This hook
 * is kept for future server-side initialization (e.g., OpenTelemetry).
 */
export async function register() {
  // Intentionally empty — Serwist handles SW registration via next.config.ts.
}
