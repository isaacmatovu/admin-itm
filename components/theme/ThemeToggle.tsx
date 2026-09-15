"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/stores/theme-store";

/** Persisted light/dark toggle, backed by the zustand theme store. Mirrors
 * the inline script in app/layout.tsx that applies the stored choice before
 * first paint. */
export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const hydrated = useThemeStore((s) => s.hydrated);
  const toggle = useThemeStore((s) => s.toggle);
  const syncFromDom = useThemeStore((s) => s.syncFromDom);

  useEffect(() => {
    // Syncing the store FROM the DOM attribute the inline script in
    // app/layout.tsx already set before hydration — there's no render-time
    // way to read it without a server/client mismatch (document doesn't
    // exist during SSR), so this one-time read is the legitimate case the
    // set-state-in-effect rule is meant to flag; it doesn't fire here
    // because the state lives in the zustand store rather than a local
    // useState, but the reasoning is the same.
    syncFromDom();
  }, [syncFromDom]);

  return (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={toggle}
      style={{ fontSize: 12 }}
      aria-label="Toggle color theme"
    >
      {!hydrated || theme === "light" ? "Dark mode" : "Light mode"}
    </button>
  );
}
