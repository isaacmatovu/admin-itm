"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, Clock, AlertCircle } from "lucide-react";
import { Blueprint } from "@/components/ui/Blueprint";
import { clientApi, ApiError } from "@/lib/api-client";

type Phase =
  | "loading"
  | "enroll"
  | "entry"
  | "verifying"
  | "incorrect"
  | "locked"
  | "error";

const MAX_ATTEMPTS = 5;

/** Distinguishes "the pre-session is gone" from "that code was wrong" — the
 *  API returns 403 for both (middleware.RequirePreSession vs HandleTOTPVerify's
 *  invalid-code branch). Re-probing the read-only status endpoint answers it
 *  authoritatively, and costs a request only on a failure path, which beats
 *  string-matching an error message that isn't part of any contract. */
async function preSessionAlive(): Promise<boolean> {
  try {
    await clientApi<TotpStatus>("/api/v1/auth/2fa/status");
    return true;
  } catch (err) {
    return !(err instanceof ApiError && err.status === 403);
  }
}

type TotpStatus = { enrolled: boolean };
type TotpSetup = { qr_code_data_url: string; secret: string };

/** The centered card every phase of this screen sits in — shared so the
 *  loading and error states line up with the form instead of jumping. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        padding: "20px 0",
        background:
          "radial-gradient(1100px circle at 50% -10%, color-mix(in srgb, var(--color-accent) 10%, transparent), transparent 60%)",
      }}
    >
      <Blueprint
        style={{
          width: "100%",
          maxWidth: 430,
          padding: "clamp(22px, 6.5vw, 34px) clamp(18px, 5.5vw, 30px)",
        }}
      >
        {children}
      </Blueprint>
    </div>
  );
}

export function TwoFactorForm() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [qr, setQr] = useState<{ qrCodeDataUrl: string; secret: string } | null>(null);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  // The API doesn't return a remaining-attempts count on a failed verify —
  // only the lockout guard's own 429 says "too many". This is a
  // best-effort local counter (resets on reload), not a source of truth.
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [retryAfterSec, setRetryAfterSec] = useState<number | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Read enrollment state from GET /2fa/status, then call POST /2fa/setup
  // only when we actually need a QR to show. Inferring enrollment from
  // whether /setup succeeded used to send anyone whose request failed for
  // any unrelated reason — expired pre-session, CORS, 500, dropped
  // connection — to the code-entry screen, including brand-new users who
  // had nothing to enter and no route forward.
  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        const status = await clientApi<TotpStatus>("/api/v1/auth/2fa/status", {
          signal: ac.signal,
        });
        if (status.enrolled) {
          setPhase("entry");
          return;
        }
        const setup = await clientApi<TotpSetup>("/api/v1/auth/2fa/setup", {
          method: "POST",
          signal: ac.signal,
        });
        setQr({ qrCodeDataUrl: setup.qr_code_data_url, secret: setup.secret });
        setPhase("enroll");
      } catch (err) {
        if (ac.signal.aborted) return;
        // No pre-session at all (missing, or past its 5-minute expiry) —
        // there is nothing to verify, so restart the login rather than
        // showing a code prompt that can only ever fail.
        if (err instanceof ApiError && err.status === 403) {
          router.replace("/login?error=1");
          return;
        }
        setPhase("error");
      }
    })();

    return () => {
      ac.abort();
    };
  }, [router]);

  useEffect(() => {
    if (phase === "enroll" || phase === "entry") {
      inputs.current[0]?.focus();
    }
  }, [phase]);

  function setDigit(i: number, value: string) {
    const clean = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < 5) inputs.current[i + 1]?.focus();
    if (next.every((d) => d !== "") && i === 5) {
      void submit(next.join(""));
    }
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) {
      inputs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < 5) {
      inputs.current[i + 1]?.focus();
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 0) return;
    e.preventDefault();
    const next = Array(6).fill("");
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    if (text.length === 6) {
      void submit(text);
    } else {
      inputs.current[text.length]?.focus();
    }
  }

  async function submit(code: string) {
    setPhase("verifying");
    try {
      await clientApi("/api/v1/auth/2fa/verify", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      router.push("/admin");
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setRetryAfterSec(err.retryAfter ?? 15 * 60);
        setPhase("locked");
        return;
      }
      // A 403 here is either a rejected code or a pre-session that expired
      // mid-flow. Only the first should burn an attempt; the second has to
      // restart the login, since no code can ever succeed against it.
      if (err instanceof ApiError && err.status === 403 && !(await preSessionAlive())) {
        router.replace("/login?error=1");
        return;
      }
      if (!(err instanceof ApiError) || err.status >= 500) {
        // Network failure or server fault — the code was never judged, so
        // don't count it against the user or tell them it was wrong.
        setPhase("error");
        return;
      }
      setAttemptsLeft((n) => Math.max(0, n - 1));
      setDigits(Array(6).fill(""));
      setPhase("incorrect");
      inputs.current[0]?.focus();
    }
  }

  const enroll = phase === "enroll";
  const locked = phase === "locked";
  const verifying = phase === "verifying";
  const incorrect = phase === "incorrect";

  // Until /2fa/status answers we don't know whether this account needs the
  // QR or the code boxes, and rendering the code boxes meanwhile flashed the
  // wrong screen at every user who was about to enroll.
  if (phase === "loading") {
    return (
      <Shell>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <span className="sk" style={{ width: 170, height: 20, borderRadius: 7 }} />
          <span className="sk" style={{ width: "100%", height: 13, borderRadius: 6 }} />
          <span className="sk" style={{ width: "100%", height: 58, borderRadius: 10 }} />
        </div>
      </Shell>
    );
  }

  if (phase === "error") {
    return (
      <Shell>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 36,
                height: 36,
                flex: "none",
                borderRadius: 10,
                background: "var(--st-changes-bg)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <AlertCircle size={17} strokeWidth={2} color="var(--st-changes)" />
            </span>
            <div
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: 19,
                letterSpacing: "-0.01em",
              }}
            >
              Couldn&apos;t reach the server
            </div>
          </div>
          <div style={{ fontSize: 13.5, opacity: 0.7 }}>
            Your sign-in is still in progress — we just couldn&apos;t load your two-factor
            settings. Check your connection and try again.
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
            style={{ width: "100%", minHeight: 44, fontSize: 14 }}
          >
            Try again
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => router.replace("/login")}
            style={{ width: "100%", minHeight: 40, fontSize: 13.5 }}
          >
            Start over
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        padding: "20px 0",
        background:
          "radial-gradient(1100px circle at 50% -10%, color-mix(in srgb, var(--color-accent) 10%, transparent), transparent 60%)",
      }}
    >
      <Blueprint
        style={{
          width: "100%",
          maxWidth: 430,
          padding: "clamp(22px, 6.5vw, 34px) clamp(18px, 5.5vw, 30px)",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 36,
              height: 36,
              flex: "none",
              borderRadius: 10,
              background: "var(--color-accent-100)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Lock size={17} strokeWidth={2} color="var(--color-accent)" />
          </span>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 19, letterSpacing: "-0.01em" }}>
            {enroll ? "Set up your authenticator" : "Two-factor verification"}
          </div>
        </div>
        <div style={{ fontSize: 13.5, opacity: 0.7 }}>
          {enroll
            ? "One-time setup. Scan the code below, then enter the 6-digit code your app shows to finish signing in."
            : "Enter the 6-digit code from your authenticator app."}
        </div>

        {enroll && qr && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 18,
              alignItems: "center",
              padding: 16,
              background: "color-mix(in srgb, var(--color-accent) 5%, var(--color-surface))",
              border: "1px solid var(--color-divider)",
              borderRadius: 12,
            }}
          >
            <div
              style={{
                width: 122,
                height: 122,
                flex: "none",
                background: "var(--color-surface)",
                border: "1px solid var(--color-divider)",
                borderRadius: 10,
                display: "grid",
                placeItems: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Image src={qr.qrCodeDataUrl} alt="2FA setup QR code" fill sizes="122px" unoptimized />
            </div>
            <div style={{ flex: "1 1 170px", minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 13 }}>Scan this with Google Authenticator (or equivalent).</div>
              <div style={{ fontSize: 12, opacity: 0.55 }}>Or enter key manually</div>
              <code
                style={{
                  fontSize: 12.5,
                  letterSpacing: ".03em",
                  padding: "7px 9px",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-divider)",
                  borderRadius: 7,
                  wordBreak: "break-all",
                }}
              >
                {qr.secret}
              </code>
            </div>
          </div>
        )}

        <div>
          <div style={{ fontSize: 12.5, fontWeight: 500, opacity: 0.65, marginBottom: 8 }}>
            6-digit code
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                onPaste={onPaste}
                disabled={locked || verifying}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: 48,
                  textAlign: "center",
                  borderRadius: 10,
                  fontFamily: "var(--font-heading)",
                  fontWeight: 600,
                  fontSize: 22,
                  border: `1.5px solid ${
                    incorrect
                      ? "var(--st-changes)"
                      : d
                        ? "var(--color-accent)"
                        : "var(--color-divider)"
                  }`,
                  background: "var(--color-surface)",
                  color: "var(--color-text)",
                  opacity: locked ? 0.45 : 1,
                }}
              />
            ))}
          </div>
          {incorrect && (
            <div style={{ marginTop: 9, fontSize: 12.5, color: "var(--st-changes)" }}>
              Incorrect code, please try again. {attemptsLeft} attempt{attemptsLeft === 1 ? "" : "s"} remaining.
            </div>
          )}
        </div>

        {locked && (
          <div
            style={{
              display: "flex",
              gap: 9,
              alignItems: "flex-start",
              padding: "11px 13px",
              background: "var(--st-changes-bg)",
              color: "var(--st-changes)",
              borderRadius: 10,
              fontSize: 13,
            }}
          >
            <Clock size={15} strokeWidth={2} style={{ flex: "none", marginTop: 2 }} />
            <span>
              Too many attempts. Try again in {Math.ceil((retryAfterSec ?? 900) / 60)} minutes.
            </span>
          </div>
        )}

        <button
          type="button"
          className="btn btn-primary"
          disabled={locked || verifying || digits.some((d) => !d)}
          onClick={() => submit(digits.join(""))}
          style={{ width: "100%", minHeight: 44, fontSize: 14 }}
        >
          {verifying ? "Verifying…" : "Verify and continue"}
        </button>
        <div style={{ fontSize: 12, opacity: 0.5, textAlign: "center" }}>
          Required on every login — no exceptions.
        </div>
      </Blueprint>
    </div>
  );
}
