import { Blueprint } from "./Blueprint";

export function StatCard({
  label,
  value,
  sub,
  color,
  size = "md",
}: {
  label: string;
  value: string | number;
  sub: string;
  color?: string;
  size?: "md" | "lg";
}) {
  return (
    <Blueprint
      style={{
        padding: size === "lg" ? "20px 22px" : "17px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "color-mix(in srgb, var(--color-text) 60%, transparent)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 700,
          fontSize: size === "lg" ? 40 : 32,
          lineHeight: 1,
          letterSpacing: "-0.02em",
          color: color ?? "var(--color-text)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: size === "lg" ? 12.5 : 12, opacity: 0.6 }}>{sub}</div>
    </Blueprint>
  );
}
