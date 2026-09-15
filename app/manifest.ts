import type { MetadataRoute } from "next";

// Special file convention — Next.js auto-injects the <link rel="manifest">
// tag and serves this at /manifest.webmanifest. icons point at the
// dedicated Route Handlers below (app/icon-*/route.tsx) rather than the
// icon.tsx/apple-icon.tsx convention, since those are fixed-size
// browser-chrome icons and the manifest needs specific 192/512 sizes (plus
// a maskable variant) at URLs we control directly.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ITM Africa · Task Tracking",
    short_name: "ITM Tasking",
    description: "ITM Africa admin task tracking",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f8fc",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
