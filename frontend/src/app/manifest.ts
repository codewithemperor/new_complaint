import type { MetadataRoute } from "next";

/**
 * Web App Manifest — generated as a route (Next.js App Router feature).
 * Makes the app installable as a PWA. Icons live in /public.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KwaraMOc Complaint Management",
    short_name: "KwaraMOc",
    description: "Complaint Management & Ticketing System",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f766e",
    orientation: "portrait-primary",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
