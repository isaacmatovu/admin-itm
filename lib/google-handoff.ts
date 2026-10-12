const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN ?? "";
const HANDOFF_KEY = "g_handoff";
// Matches the backend's handoff_state lifetime (5 minutes).
export const HANDOFF_WINDOW_MS = 5 * 60_000;

export type Handoff = { verifier: string; challenge: string };

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

// Async (SHA-256): call it BEFORE the click so window.open keeps the user gesture.
export async function prepareHandoff(): Promise<Handoff> {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)),
  );
  return { verifier, challenge: b64url(digest) };
}

// Opens the API's own origin (outside the PWA scope) so it opens in the browser.
export function openGoogleLogin(h: Handoff) {
  try {
    localStorage.setItem(
      HANDOFF_KEY,
      JSON.stringify({ verifier: h.verifier, ts: Date.now() }),
    );
  } catch {}
  window.open(
    `${API_ORIGIN}/api/v1/auth/google/login?handoff=${h.challenge}`,
    "_blank",
  );
}

export function pendingHandoff(): { verifier: string; ts: number } | null {
  try {
    const v = JSON.parse(localStorage.getItem(HANDOFF_KEY) ?? "null");
    if (v?.verifier && Date.now() - v.ts < HANDOFF_WINDOW_MS) return v;
  } catch {}
  return null;
}

export function clearHandoff() {
  try {
    localStorage.removeItem(HANDOFF_KEY);
  } catch {}
}

// Same-origin call through the rewrite, so the pre-session cookie is set on
// this app's own domain. Returns the next path, or null while pending.
export async function claimGoogleLogin(
  verifier: string,
): Promise<string | null> {
  const res = await fetch("/api/v1/auth/google/claim", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ verifier }),
  });
  if (res.status === 200) return ((await res.json()) as { next: string }).next;
  return null;
}

// Old full-page redirect, kept as a fallback if crypto isn't ready.
export function redirectToGoogleLogin() {
  window.location.href = `/api/v1/auth/google/login?return_to=${encodeURIComponent(window.location.origin)}`;
}
