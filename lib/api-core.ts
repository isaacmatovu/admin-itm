// Shared fetch plumbing for both lib/api-server.ts (Server Components) and
// lib/api-client.ts ("use client" components) — not imported directly by
// either kind of component, so it carries no next/headers dependency and is
// safe in either bundle.

// In the browser, same-origin (""): requests go through next.config.ts's
// /api/v1 rewrite, so cookies land on this app's domain. On the server
// (Server Components, Server Actions) there's no origin to be relative to,
// so call the API directly — forwarding the cookies explicitly instead.
const API_URL =
  typeof window === "undefined"
    ? (process.env.API_INTERNAL_URL ?? "http://localhost:8080")
    : (process.env.NEXT_PUBLIC_API_URL ?? "");

export class ApiError extends Error {
  status: number;
  details?: unknown;
  /** Seconds to wait before retrying — only set on a 429 lockout response
   *  (middleware.LockoutGuard), which is its own third error shape. */
  retryAfter?: number;
  constructor(
    status: number,
    message: string,
    details?: unknown,
    retryAfter?: number,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.retryAfter = retryAfter;
  }
}

let refreshing: Promise<boolean> | null = null;
function refreshOnce(): Promise<boolean> {
  refreshing ??= fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: "POST",
    credentials: "include",
  })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
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
  const errObj = (
    typeof nested === "object" && nested ? nested : (b ?? {})
  ) as Record<string, unknown>;
  const detailsStr =
    typeof errObj.details === "string" ? (errObj.details as string) : undefined;
  const message =
    detailsStr ??
    (errObj.message as string | undefined) ??
    (typeof nested === "string" ? nested : undefined) ??
    `Request failed (${status})`;
  const retryAfter =
    typeof b?.retry_after === "number" ? (b.retry_after as number) : undefined;
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
  if (init.body && !h.has("Content-Type"))
    h.set("Content-Type", "application/json");
  if (cookieHeader) h.set("Cookie", cookieHeader);

  const url = `${API_URL}${path}`;
  const opts: RequestInit = {
    ...init,
    headers: h,
    credentials: cookieHeader ? undefined : "include",
    cache: "no-store",
  };

  let res = await fetch(url, opts);

  // Browser only: a 401 on a normal API call means the access token expired.
  if (
    res.status === 401 &&
    typeof window !== "undefined" &&
    !path.startsWith("/api/v1/auth/")
  ) {
    if (await refreshOnce()) {
      res = await fetch(url, opts); // retry once with the new cookies
    } else {
      window.location.href = "/login";
    }
  }

  return handle<T>(res);
}
