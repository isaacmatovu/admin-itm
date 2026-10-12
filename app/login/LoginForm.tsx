"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, LogIn } from "lucide-react";
import { Blueprint } from "@/components/ui/Blueprint";
import {
  prepareHandoff,
  openGoogleLogin,
  pendingHandoff,
  clearHandoff,
  claimGoogleLogin,
  HANDOFF_WINDOW_MS,
  type Handoff,
} from "@/lib/googlehandoff";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export function LoginForm({ initialError }: { initialError: boolean }) {
  const router = useRouter();
  const [waiting, setWaiting] = useState(false);
  const handoffRef = useRef<Handoff | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  const startPolling = useCallback(
    (verifier: string, startedAt: number) => {
      stopPolling();
      setWaiting(true);
      const tick = async () => {
        if (Date.now() - startedAt > HANDOFF_WINDOW_MS) {
          stopPolling();
          clearHandoff();
          setWaiting(false);
          return;
        }
        try {
          const next = await claimGoogleLogin(verifier);
          if (next) {
            stopPolling();
            clearHandoff();
            router.replace(next); // /verify-2fa
          }
        } catch {
          // network blip: try again on the next tick
        }
      };
      timer.current = setInterval(tick, 1500);
      void tick();
    },
    [router, stopPolling],
  );

  useEffect(() => {
    void prepareHandoff().then((h) => (handoffRef.current = h));

    // Resume if the OS reloaded the PWA while the user was in Chrome.
    const resume = pendingHandoff();
    if (resume) startPolling(resume.verifier, resume.ts);

    // Coming back to the app: poll immediately.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const p = pendingHandoff();
      if (p) startPolling(p.verifier, p.ts);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [startPolling, stopPolling]);

  function signIn() {
    const h = handoffRef.current;
    if (!h) {
      // crypto not ready: your original full-page redirect as a fallback
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `${API_URL}/api/v1/auth/google/login?return_to=${encodeURIComponent(window.location.origin)}`;
      return;
    }
    openGoogleLogin(h); // synchronous, keeps the user gesture
    startPolling(h.verifier, Date.now());
    void prepareHandoff().then((n) => (handoffRef.current = n)); // fresh pair for a retry
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
          maxWidth: 400,
          padding: "clamp(24px, 7vw, 40px) clamp(20px, 6vw, 34px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
          textAlign: "center",
        }}
      >
        <span
          style={{
            width: 48,
            height: 48,
            borderRadius: 13,
            background:
              "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: 19,
            boxShadow: "var(--shadow-md)",
          }}
        >
          IT
        </span>
        <div>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            ITM Africa
          </div>
          <div
            style={{
              fontSize: 13.5,
              color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
              marginTop: 2,
            }}
          >
            Task Tracking · Admin
          </div>
        </div>

        {initialError && (
          <div
            style={{
              width: "100%",
              display: "flex",
              gap: 9,
              alignItems: "flex-start",
              textAlign: "left",
              padding: "11px 13px",
              background: "var(--st-changes-bg)",
              color: "var(--st-changes)",
              borderRadius: 10,
              fontSize: 13,
            }}
          >
            <AlertCircle
              size={15}
              strokeWidth={2}
              style={{ flex: "none", marginTop: 2 }}
            />
            <span>Sign-in failed, please try again.</span>
          </div>
        )}

        <button
          type="button"
          className="btn btn-secondary"
          onClick={signIn}
          style={{ width: "100%", minHeight: 46, gap: 10, fontSize: 14 }}
        >
          <LogIn size={17} strokeWidth={2} />
          <span>
            {waiting ? "Waiting for Google sign-in…" : "Sign in with Google"}
          </span>
        </button>

        {waiting && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              opacity: 0.6,
            }}
          >
            <span
              className="sk"
              style={{ width: 60, height: 3, borderRadius: 999 }}
            />
            <span>Finish in your browser, then come back here.</span>
          </div>
        )}

        <div style={{ fontSize: 12.5, opacity: 0.6, maxWidth: "28ch" }}>
          Use your ITM Africa Google account to continue.
        </div>
      </Blueprint>
    </div>
  );
}
