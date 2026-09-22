 // Server Component / Server Action entry point for calling the Go API.
// Never import this from a "use client" file — next/headers only works in
// a server context, and bundling it into client code breaks the build.
import "server-only";
import { cookies } from "next/headers";
import { apiFetch, type ApiFetchOptions } from "./api-core";

export { ApiError } from "./api-core";

/**
 * Calls the Go API, forwarding the current request's cookies (the session
 * JWT the browser sent to this Next.js server) so the API sees the same
 * authenticated caller. cookies() is async in this Next.js version.
 */
export async function serverApi<T>(
  path: string,
  init: ApiFetchOptions = {},
): Promise<T> {
  const store = await cookies();
  return apiFetch<T>(path, { ...init, cookieHeader: store.toString() });
}

