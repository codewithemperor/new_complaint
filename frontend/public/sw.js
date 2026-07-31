/**
 * KwaraMOc Complaints — Service Worker
 *
 * Features:
 *  - Precaches the offline fallback page
 *  - Runtime caching for static assets (stale-while-revalidate)
 *  - Caches API GET responses for short offline use
 *  - Handles scheduled reminder notifications posted via postMessage
 *  - Listens for push events (future server push support)
 *
 * Phase 8.2 — PWA reminder registration.
 */

const SW_VERSION = "kwmoc-sw-v1";
const OFFLINE_URL = "/offline";
const STATIC_CACHE = `${SW_VERSION}-static`;
const RUNTIME_CACHE = `${SW_VERSION}-runtime`;
const API_CACHE = `${SW_VERSION}-api`;

// Precache manifest (minimal — let runtime caching handle the rest)
const PRECACHE_URLS = [OFFLINE_URL, "/", "/manifest.webmanifest"];

/* ──────────────────────────────────────────────────────────────── */
/*  Install — precache offline page                                  */
/* ──────────────────────────────────────────────────────────────── */
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // Best-effort precache; ignore individual failures so install never breaks
      await Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: "reload" })),
        ),
      );
      await self.skipWaiting();
    })(),
  );
});

/* ──────────────────────────────────────────────────────────────── */
/*  Activate — clean up old caches & claim clients                   */
/* ──────────────────────────────────────────────────────────────── */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => !key.startsWith(SW_VERSION))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

/* ──────────────────────────────────────────────────────────────── */
/*  Fetch — runtime caching strategies                              */
/* ──────────────────────────────────────────────────────────────── */
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Skip cross-origin requests (e.g., analytics, fonts)
  if (url.origin !== self.location.origin) return;

  // Skip Next.js dev/HMR endpoints
  if (url.pathname.startsWith("/_next/webpack-hmr")) return;

  // Navigation requests → network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Static assets → stale-while-revalidate
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.match(/\.(?:png|jpe?g|gif|webp|svg|ico|css|js|woff2?)$/i)
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // API GET requests → short-lived cache (2 minutes)
  if (url.pathname.startsWith("/api/") && url.searchParams.get("XTransformPort")) {
    event.respondWith(apiCacheFirst(request));
    return;
  }
});

async function networkFirstNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (err) {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await cache.match(OFFLINE_URL);
    return offline || new Response("Offline", { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

async function apiCacheFirst(request) {
  const cache = await caches.open(API_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    // Revalidate in background
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          cache.put(request, response.clone());
        }
      })
      .catch(() => {});
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response(JSON.stringify({ error: "offline" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/* ──────────────────────────────────────────────────────────────── */
/*  Reminder scheduling & notification display (Phase 8.2)         */
/* ──────────────────────────────────────────────────────────────── */

// In-memory store of scheduled reminders (lost on SW restart — acceptable
// for the dev sandbox; production would use IndexedDB or sync with server)
const scheduledReminders = new Map();

self.addEventListener("message", (event) => {
  const data = event.data || {};

  switch (data.type) {
    case "SCHEDULE_REMINDER": {
      const { id, title, body, scheduledFor, ticketCode, url } = data.payload || {};
      if (!id || !scheduledFor) return;
      const delay = new Date(scheduledFor).getTime() - Date.now();
      if (delay <= 0) {
        // Fire immediately
        showReminderNotification({ title, body, ticketCode, url });
      } else {
        const timer = setTimeout(() => {
          showReminderNotification({ title, body, ticketCode, url });
          scheduledReminders.delete(id);
        }, delay);
        scheduledReminders.set(id, { timer, payload: data.payload });
      }
      break;
    }
    case "CANCEL_REMINDER": {
      const { id } = data.payload || {};
      const entry = scheduledReminders.get(id);
      if (entry) {
        clearTimeout(entry.timer);
        scheduledReminders.delete(id);
      }
      break;
    }
    case "SKIP_WAITING":
      self.skipWaiting();
      break;
  }
});

async function showReminderNotification({ title, body, ticketCode, url }) {
  const finalTitle = title || "KwaraMOc Reminder";
  const finalBody = body || (ticketCode ? `Follow up on ${ticketCode}` : "");

  const options = {
    body: finalBody,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: ticketCode ? `reminder-${ticketCode}` : "kwmoc-reminder",
    renotify: true,
    data: { url: url || "/" },
    actions: [
      { action: "open", title: "Open" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  try {
    await self.registration.showNotification(finalTitle, options);
  } catch (err) {
    console.warn("Failed to show reminder notification:", err);
  }
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const action = event.action;
  const targetUrl = event.notification.data?.url || "/";

  if (action === "dismiss") return;

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      // Focus an existing tab if one is open
      for (const client of allClients) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          if (targetUrl && targetUrl !== "/") {
            client.postMessage({
              type: "NAVIGATE",
              payload: { url: targetUrl },
            });
          }
          return;
        }
      }
      // Otherwise open a new tab
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })(),
  );
});

/* ──────────────────────────────────────────────────────────────── */
/*  Push events (future server-side push for reminders)             */
/* ──────────────────────────────────────────────────────────────── */
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    showReminderNotification({
      title: payload.title || "KwaraMOc Update",
      body: payload.body || "",
      ticketCode: payload.ticketCode,
      url: payload.url,
    }),
  );
});

/* ──────────────────────────────────────────────────────────────── */
/*  Periodic sync (future: background refresh)                      */
/* ──────────────────────────────────────────────────────────────── */
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "refresh-reminders") {
    event.waitUntil(refreshReminders());
  }
});

async function refreshReminders() {
  // Placeholder — production would fetch pending reminders from the server
  // and re-schedule them.
  const allClients = await self.clients.matchAll();
  allClients.forEach((client) =>
    client.postMessage({ type: "REMINDERS_REFRESHED" }),
  );
}
