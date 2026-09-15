// RS256 verification of the session cookie the Go API issues
// (internal/jwt/jwt.go on the task-tracker side). JWT_PUBLIC_KEY is the same
// base64-encoded PEM value as that service's own JWT_PUBLIC_KEY env var —
// not secret, safe to hand to this frontend (see internal/config/config.go's
// comment: "verifies tokens ... including in the Next.js middleware, which
// only ever needs the public key").
//
// Shared by proxy.ts (route/role gating) and any Server Component that wants
// the caller's identity without a round trip to GET /profile.
import { importSPKI, jwtVerify } from "jose";

export type Role = "staff" | "admin";

export interface SessionClaims {
  user_id: string;
  role: Role;
  email: string;
  id: string; // google_id
  exp: number;
  iat: number;
}

let cachedKeyPromise: Promise<CryptoKey> | null = null;

function getPublicKey(): Promise<CryptoKey> {
  if (!cachedKeyPromise) {
    const b64 = process.env.JWT_PUBLIC_KEY;
    if (!b64) {
      throw new Error(
        "JWT_PUBLIC_KEY is not set — copy the base64 PEM value from task-tracker's .env",
      );
    }
    const pem = Buffer.from(b64, "base64").toString("utf8");
    cachedKeyPromise = importSPKI(pem, "RS256");
  }
  return cachedKeyPromise;
}

/**
 * Verifies a session (access-token) JWT. Returns null on any failure —
 * missing/expired/malformed/wrong-signature all collapse to "not signed
 * in", which is all the callers here (proxy.ts, server components) ever
 * need to distinguish. Does not check the `type` claim against the Go
 * service's cookie-name-as-type-value convention (internal/jwt/jwt.go) —
 * reading from the correctly-named session cookie already selects the
 * right token by construction.
 */
export async function verifySessionToken(
  token: string,
): Promise<SessionClaims | null> {
  try {
    const key = await getPublicKey();
    const { payload } = await jwtVerify(token, key, { issuer: "itm_server" });
    if (typeof payload.user_id !== "string" || typeof payload.role !== "string") {
      return null;
    }
    return payload as unknown as SessionClaims;
  } catch {
    return null;
  }
}

export const cookieNames = {
  session: process.env.SESSION_COOKIE_NAME || "itm_session",
  preSession: process.env.PRE_SESSION_COOKIE_NAME || "itm_presession",
  refresh: process.env.REFRESH_COOKIE_NAME || "itm_refresh",
};
