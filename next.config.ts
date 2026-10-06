import type { NextConfig } from "next";

// Where the Go API actually lives. Server-side only — read at build time for
// the rewrite below, and at runtime by lib/api-core.ts / proxy.ts.
const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  // The browser calls the API through this app's own origin, never the API's
  // directly. Auth cookies are then set on THIS domain, which is the only
  // place proxy.ts and Server Components (serverApi) can read them —
  // *.vercel.app and the API's duckdns.org domain are both public suffixes,
  // so no Domain= attribute could ever share cookies between them. It also
  // keeps them first-party, so Safari's third-party cookie blocking can't
  // drop them.
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${API_INTERNAL_URL}/api/v1/:path*` }];
  },
};

export default nextConfig;
