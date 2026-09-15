"use client";

// Client Component entry point for calling the Go API directly from the
// browser. Relies on the browser attaching the session cookie itself
// (credentials: 'include' in api-core.ts) — see the auth architecture note
// in the plan: dev and prod both keep frontend/API same-site, so
// SameSite=Strict cookies still flow.
import { apiFetch, type ApiFetchOptions } from "./api-core";

export { ApiError } from "./api-core";

export function clientApi<T>(
  path: string,
  init: Omit<ApiFetchOptions, "cookieHeader"> = {},
): Promise<T> {
  return apiFetch<T>(path, init);
}
