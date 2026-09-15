import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import "./globals.css";

// One family for headings and body — Google's own dashboards (Analytics,
// Admin Console, Cloud Console) use a single neutral grotesque throughout
// rather than a display/body pairing; Inter is the closest widely-available
// match to Google Sans and renders tabular numbers cleanly for stat cards.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ITM Africa · Task Tracking",
  description: "ITM Africa admin task tracking",
  // manifest.ts's own <link rel="manifest"> is auto-injected by Next — no
  // manifest field needed here. This just covers iOS's separate
  // "installed web app" meta tags (Safari doesn't read the manifest for
  // these), matching the same title theme/ThemeToggle.tsx uses elsewhere.
  appleWebApp: {
    title: "ITM Tasking",
    statusBarStyle: "default",
  },
};

// Explicit rather than relying on Next's default — mobile-first layout
// depends on this being present. Pinch-zoom is left enabled (no
// maximumScale/userScalable:false) since disabling it is an accessibility
// regression, not something responsive design requires. themeColor tints
// the native browser/OS chrome (status bar, task switcher) — matched to
// the light/dark surface color so it blends with the app's own top bar
// instead of a jarring solid brand-color band.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1e2025" },
  ],
};

// Applies a persisted theme choice before first paint, so there's no
// light-flash before hydration. Reads the same localStorage key
// theme/ThemeToggle.tsx writes to. Left unset (system default) when no
// choice has been made — globals.css then falls back to prefers-color-scheme.
const themeInitScript = `(function(){try{
  var t = localStorage.getItem('itm-theme');
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-itm-theme', t);
} catch (e) {}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* A raw <script> here trips React 19's "scripts aren't executed on
            client render" check even though this is server-rendered HTML —
            next/script's beforeInteractive strategy is the supported way to
            inject a script that must run before hydration/first paint. */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
