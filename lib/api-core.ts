// Shared fetch plumbing for both lib/api-server.ts (Server Components) and
// lib/api-client.ts ("use client" components) — not imported directly by
// either kind of component, so it carries no next/headers dependency and is
// safe in either bundle.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  /** Seconds to wait before retrying — only set on a 429 lockout response
   *  (middleware.LockoutGuard), which is its own third error shape. */
  retryAfter?: number;
  constructor(status: number, message: string, details?: unknown, retryAfter?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.retryAfter = retryAfter;
  }
}

// The API's error shape is inconsistent across three different code paths
// (task-tracker/utils/response.go, utils/errors.go, middleware/lockout.go):
//  1. utils.ErrorResponse (most handlers): {success:false,error:{code,message,details}}
//  2. utils.HandleError's fallback (an untranslated error): bare {code,message,details}
//  3. middleware.LockoutGuard (2FA rate limiting): {error:"<string>",retry_after:N}
// `details` is usually the specific human-readable reason (message is often
// just a generic "Forbidden"/"Bad Request" label), so prefer it when it's a
// string; fall back through the rest for the other two shapes.
function extractError(status: number, body: unknown): ApiError {
  const b = body as Record<string, unknown> | null;
  const nested = b?.error;
  const errObj = (typeof nested === "object" && nested ? nested : b ?? {}) as Record<
    string,
    unknown
  >;
  const detailsStr = typeof errObj.details === "string" ? (errObj.details as string) : undefined;
  const message =
    detailsStr ??
    (errObj.message as string | undefined) ??
    (typeof nested === "string" ? nested : undefined) ??
    `Request failed (${status})`;
  const retryAfter = typeof b?.retry_after === "number" ? (b.retry_after as number) : undefined;
  return new ApiError(status, message, errObj.details, retryAfter);
}

async function handle<T>(res: Response): Promise<T> {
  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    throw extractError(res.status, body);
  }

  const b = body as { success?: boolean; data?: unknown } | null;
  if (b && typeof b === "object" && "data" in b) {
    return b.data as T;
  }
  return body as T;
}

export interface ApiFetchOptions extends RequestInit {
  /** Forwarded verbatim as the Cookie header — server-side callers only,
   *  since fetch() never auto-attaches the browser's cookies to a
   *  cross-service request made from Node. */
  cookieHeader?: string;
}

export async function apiFetch<T>(
  path: string,
  { cookieHeader, headers, ...init }: ApiFetchOptions = {},
): Promise<T> {
  const h = new Headers(headers);
  if (init.body && !h.has("Content-Type")) {
    h.set("Content-Type", "application/json");
  }
  if (cookieHeader) h.set("Cookie", cookieHeader);

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: h,
    // Client-side calls rely on the browser attaching cookies itself;
    // server-side calls forward them explicitly via cookieHeader above.
    credentials: cookieHeader ? undefined : "include",
    cache: "no-store",
  });

  return handle<T>(res);
}
