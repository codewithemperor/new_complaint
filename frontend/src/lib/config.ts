const rawApiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "http://localhost:4000";

function normalizeApiBaseUrl(url: string) {
  const trimmed = url.trim().replace(/\/+$/, "");
  const isLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(trimmed);
  const isHttpsPage =
    typeof window !== "undefined" && window.location.protocol === "https:";

  if (isHttpsPage && !isLocal && trimmed.startsWith("http://")) {
    return `https://${trimmed.slice("http://".length)}`;
  }

  return trimmed;
}

export const API_BASE_URL = normalizeApiBaseUrl(rawApiBaseUrl);
