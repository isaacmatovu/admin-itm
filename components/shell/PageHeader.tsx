import type { ReactNode } from "react";

/** The kicker + <h2> + bottom-divider header every main-content screen
 * opens with. */
export function PageHeader({
  kicker,
  title,
  action,
}: {
  kicker?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: "10px 20px",
        borderBottom: "1px solid var(--color-divider)",
        paddingBottom: 16,
      }}
    >
      <div>
        {kicker && (
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 500,
              color: "color-mix(in srgb, var(--color-text) 55%, transparent)",
              marginBottom: 2,
            }}
          >
            {kicker}
          </div>
        )}
        <h2 style={{ margin: 0, fontSize: "clamp(21px, 4.5vw, 26px)", fontWeight: 700, letterSpacing: "-0.02em" }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}
