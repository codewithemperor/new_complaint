/// <reference lib="webworker" />
/**
 * Serwist service worker.
 * Uses the default cache strategy (precache + runtime caching for common
 * asset types). Compiled by @serwist/next into public/sw.js at build time.
 */
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// Offline navigation fallback: if a page navigation fails (no network), serve
// the precached /offline page. Per milestone-8 §5.3.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.mode !== "navigate") return;
  event.respondWith(
    fetch(req).catch(async () => {
      const cache = await caches.open("serwist-precache");
      const cached = await cache.match("/offline");
      return cached ?? new Response("Offline", { status: 503 });
    }),
  );
});
