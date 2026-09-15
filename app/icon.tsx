import { ImageResponse } from "next/og";

// The browser-tab favicon — same gradient "IT" mark used in the Sidebar
// brand and the login screen. Next.js auto-links this as
// <link rel="icon"> at build time.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 7,
          color: "#fff",
          fontFamily: "sans-serif",
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        IT
      </div>
    ),
    { ...size },
  );
}
