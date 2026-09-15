import { ImageResponse } from "next/og";

export const dynamic = "force-static";

// Maskable variant: Android may crop adaptive icons to a circle, squircle,
// or rounded square, so the mark is kept well inside the ~80% "safe zone"
// (here: the background fills the full edge-to-edge canvas with no
// rounding of its own — the OS does the masking — and the glyph is sized
// small enough to survive a circular crop).
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
          color: "#fff",
          fontFamily: "sans-serif",
          fontWeight: 700,
          fontSize: 150,
        }}
      >
        IT
      </div>
    ),
    { width: 512, height: 512 },
  );
}
