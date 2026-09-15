import { ImageResponse } from "next/og";

// Route Handlers aren't cached by default (unlike the icon.tsx/manifest.ts
// conventions, which are) — force-static since this image never varies by
// request.
export const dynamic = "force-static";

// A plain Route Handler (not the icon.tsx convention) so the manifest can
// reference a URL/size we control exactly: 192x192 is Android's baseline
// "any" purpose icon size. Statically generated at build time — no
// request-time data involved.
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a73e8, #1765cc)",
          borderRadius: 40,
          color: "#fff",
          fontFamily: "sans-serif",
          fontWeight: 700,
          fontSize: 88,
        }}
      >
        IT
      </div>
    ),
    { width: 192, height: 192 },
  );
}
