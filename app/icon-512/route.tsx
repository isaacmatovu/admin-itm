import { ImageResponse } from "next/og";

export const dynamic = "force-static";

// 512x512 "any"-purpose icon — used for the install prompt, app switcher,
// and splash screen generation on Android.
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
          borderRadius: 108,
          color: "#fff",
          fontFamily: "sans-serif",
          fontWeight: 700,
          fontSize: 236,
        }}
      >
        IT
      </div>
    ),
    { width: 512, height: 512 },
  );
}
