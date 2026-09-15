// Minimal service worker — registered purely so the app is installable
// (Chrome requires a controlling SW with a fetch handler for the install
// prompt/"Add to Home Screen"). This is an authenticated admin dashboard
// behind Google OAuth + 2FA + a role-gating proxy, so it deliberately does
// NOT cache pages, RSC payloads, or /api/* responses — doing that risks
// serving stale org data, or a previous session's screen, after a login,
// logout, or role change. Caching is limited to the app's own static,
// non-sensitive shell assets (icons, manifest).
const CACHE_NAME = "itm-shell-v1";
const SHELL_ASSETS = ["/icon-192", "/icon-512", "/icon-512-maskable", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch(() => {
        // Non-fatal — a failed precache just means the first request for
        // one of these falls through to the network like everything else.
      }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin === self.location.origin && SHELL_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request)));
  }
  // Everything else — every page, every RSC payload, every /api/* call —
  // is left to the network untouched. No offline fallback is registered
  // on purpose: this tool is only useful online anyway.
});
