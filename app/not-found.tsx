import { Blueprint } from "@/components/ui/Blueprint";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 20,
        background: "var(--color-bg)",
        color: "var(--color-text)",
        fontFamily: "var(--font-body)",
      }}
    >
      <Blueprint
        style={{
          width: "100%",
          maxWidth: 420,
          padding: "48px 26px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          textAlign: "center",
        }}
      >
        <span
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--color-accent-100)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Search size={26} strokeWidth={2} color="var(--color-accent)" />
        </span>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 20 }}>
          Page not found
        </div>
        <p style={{ fontSize: 13.5, opacity: 0.65, maxWidth: "40ch", margin: 0 }}>
          This page doesn&apos;t exist, or isn&apos;t part of your world.
        </p>
      </Blueprint>
    </div>
  );
}
