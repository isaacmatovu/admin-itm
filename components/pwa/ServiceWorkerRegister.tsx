"use client";

import { useEffect } from "react";

/** Registers public/sw.js — production only, so a dev-mode service worker
 * never intercepts fetches while iterating (stale-cache confusion isn't
 * worth it for a SW that only exists for install-ability anyway). Mounted
 * once in the root layout so the install prompt is available even from
 * /login, before a session exists. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Non-fatal — the app works identically without it, it just won't
      // be installable.
    });
  }, []);

  return null;
}
