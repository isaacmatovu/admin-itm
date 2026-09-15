import { ImageResponse } from "next/og";

// iOS home-screen icon when the app is added via Safari's share sheet.
// Apple applies its own corner-rounding/mask, so this is a plain filled
// square — no border-radius needed here. Auto-linked as
// <link rel="apple-touch-icon">.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 84,
        }}
      >
        IT
      </div>
    ),
    { ...size },
  );
}
