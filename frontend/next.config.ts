import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

/**
 * Serwist PWA configuration.
 * disable: true in dev — the service worker only activates in production builds,
 * avoiding caching surprises during development (per Milestone 0 decision #2).
 * Serwist auto-registers the SW; no manual instrumentation needed.
 */
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  cacheOnNavigation: true,
  // Precache the /offline page so the SW can serve it on navigation failure.
  // The navigation-fallback wiring lives in app/sw.ts. Per milestone-8 §5.3.
  additionalPrecacheEntries: [{ url: "/offline", revision: "1" }],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "http", hostname: "localhost", port: "4000" }],
  },
};

export default withSerwist(nextConfig);
