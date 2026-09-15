"use client";

import { useState } from "react";
import { AlertCircle, LogIn } from "lucide-react";
import { Blueprint } from "@/components/ui/Blueprint";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export function LoginForm({ initialError }: { initialError: boolean }) {
  const [redirecting, setRedirecting] = useState(false);

  function signIn() {
    setRedirecting(true);
    // A cross-origin, full-page navigation to the Go API (which itself
    // 307s on to Google) — not an internal Next.js route, so this isn't
    // the relative-navigation case the lint rule is meant to catch.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `${API_URL}/api/v1/auth/google/login`;
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
            background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
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
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            ITM Africa
          </div>
          <div style={{ fontSize: 13.5, color: "color-mix(in srgb, var(--color-text) 55%, transparent)", marginTop: 2 }}>
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
            <AlertCircle size={15} strokeWidth={2} style={{ flex: "none", marginTop: 2 }} />
            <span>Sign-in failed, please try again.</span>
          </div>
        )}

        <button
          type="button"
          className="btn btn-secondary"
          onClick={signIn}
          disabled={redirecting}
          style={{ width: "100%", minHeight: 46, gap: 10, fontSize: 14 }}
        >
          <LogIn size={17} strokeWidth={2} />
          <span>{redirecting ? "Signing in…" : "Sign in with Google"}</span>
        </button>

        {redirecting && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, opacity: 0.6 }}>
            <span className="sk" style={{ width: 60, height: 3, borderRadius: 999 }} />
            <span>Redirecting to Google…</span>
          </div>
        )}

        <div style={{ fontSize: 12.5, opacity: 0.6, maxWidth: "28ch" }}>
          Use your ITM Africa Google account to continue.
        </div>
      </Blueprint>
    </div>
  );
}
