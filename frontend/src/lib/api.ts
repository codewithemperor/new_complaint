/**
 * Typed API client for the NestJS backend.
 *
 * Uses credentials: "include" so the httpOnly auth cookie travels with every
 * request. Mirrors the backend's DTO shapes (kept in sync manually; generated
 * types from OpenAPI are a future nicety).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type FetchOptions = {
  method?: string;
  body?: unknown;
  /** Set to false to skip JSON content-type (e.g., for FormData). */
  json?: boolean;
  /** Set to "blob" to return the response as a Blob (for file downloads). */
  responseType?: "json" | "blob";
  /** Extra headers to add to the request. */
  headers?: Record<string, string>;
};

/**
 * Builds a URL that goes through the Caddy gateway.
 * All backend API calls use a relative path with the XTransformTarget query
 * param — resolved against whatever origin the page was loaded from, so the
 * page MUST be loaded through the Caddy gateway, not the Next.js dev server
 * directly.
 */

async function request<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const {
    method = "GET",
    body,
    json = true,
    responseType = "json",
    headers: extraHeaders = {},
  } = opts;
  const headers: Record<string, string> = { ...extraHeaders };

  if (json && body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const url = `${API_URL}/api${path}`;

  const res = await fetch(url, {
    method,
    headers,
    credentials: "include",
    body:
      body instanceof FormData
        ? body
        : json && body
          ? JSON.stringify(body)
          : undefined,
    cache: "no-store",
  });

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      (data as { message?: string | string[] }).message &&
      Array.isArray((data as { message?: string[] }).message)
        ? (data as { message: string[] }).message.join(", ")
        : ((data as { message?: string }).message ?? res.statusText);
    throw new ApiError(res.status, message);
  }

  if (responseType === "blob") {
    return (await res.blob()) as T;
  }

  const data = await res.json().catch(() => ({}));
  return data as T;
}

export const api = {
  get: <T>(path: string, opts?: FetchOptions) => request<T>(path, opts),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: "POST", body: formData, json: false }),
};
