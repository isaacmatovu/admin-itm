import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, cookieNames, type SessionClaims } from "@/lib/jwt";

// This deployment implements ONLY the Admin app — there is no staff
// experience here at all, so any authenticated non-admin gets a 404 on
// every protected path, not just /admin/*. Pre-session screens (Google
// OAuth already succeeded, 2FA still pending) are the only public routes.
const PUBLIC_PATHS = ["/login", "/verify-2fa"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/**
 * Attempts a silent refresh via the API's rotating-refresh-token endpoint
 * when the access token is missing/expired but a refresh cookie is present.
 * Forwards every Set-Cookie from the refresh response onto our own response
 * so the browser picks up the rotated cookies, and decodes the new access
 * token directly from that Set-Cookie header to avoid a second round trip.
 */
async function tryRefresh(
  request: NextRequest,
): Promise<{ claims: SessionClaims; response: NextResponse } | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { Cookie: request.headers.get("cookie") ?? "" },
    });
    if (!res.ok) return null;

    const setCookies: string[] =
      (res.headers as { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];
    if (setCookies.length === 0) return null;

    const response = NextResponse.next();
    for (const sc of setCookies) response.headers.append("set-cookie", sc);

    const newAccess = setCookies
      .map((sc) => sc.split(";")[0])
      .find((kv) => kv.startsWith(`${cookieNames.session}=`))
      ?.split("=")[1];
    if (!newAccess) return null;

    const claims = await verifySessionToken(newAccess);
    if (!claims) return null;

    return { claims, response };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = request.cookies.get(cookieNames.session)?.value;
  const preSessionCookie = request.cookies.get(cookieNames.preSession)?.value;
  const refreshCookie = request.cookies.get(cookieNames.refresh)?.value;

  let claims = sessionCookie ? await verifySessionToken(sessionCookie) : null;
  let refreshed: NextResponse | null = null;

  if (!claims && refreshCookie) {
    const result = await tryRefresh(request);
    if (result) {
      claims = result.claims;
      refreshed = result.response;
    }
  }

  if (!claims) {
    // Mid-flow: Google succeeded, 2FA hasn't happened yet. Keep them on
    // /verify-2fa rather than bouncing to /login.
    if (preSessionCookie && pathname !== "/verify-2fa") {
      return NextResponse.redirect(new URL("/verify-2fa", request.url));
    }
    if (isPublicPath(pathname)) {
      return refreshed ?? NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (claims.role !== "admin") {
    // Rewriting to a path nothing matches renders Next's own not-found
    // boundary (app/not-found.tsx) with a real 404 status, without
    // changing the URL the browser shows — there is no direct
    // "return a 404" API from Proxy itself.
    return NextResponse.rewrite(new URL("/__blocked", request.url));
  }

  if (isPublicPath(pathname)) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return refreshed ?? NextResponse.next();
}

// PWA assets (manifest, icons, service worker) must stay unauthenticated —
// the browser fetches the manifest and icons to decide installability
// independent of login state, and sw.js has to be reachable before any
// session exists. Without excluding these, an unauthenticated request to
// any of them was silently 307-redirected to /login instead of serving
// the actual JSON/image/script, breaking install prompts and even the
// plain browser-tab favicon for a signed-out visitor.
export const config = {
  // "icon" is a deliberate prefix match, not just the exact /icon route —
  // it also covers /icon-192, /icon-512 and /icon-512-maskable in one go
  // (apple-icon is separate since "apple-icon" doesn't start with "icon").
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|apple-icon|icon).*)",
  ],
};
