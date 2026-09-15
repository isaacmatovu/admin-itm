import type { CSSProperties } from "react";

/** A skeleton block shaped like the content it stands in for — never a
 * spinner, per the design's loading-state convention. Respects
 * prefers-reduced-motion via the .sk rule in app/globals.css. */
export function Skeleton({
  height,
  width = "100%",
  style,
}: {
  height: number | string;
  width?: number | string;
  style?: CSSProperties;
}) {
  return <div className="sk" style={{ height, width, ...style }} />;
}
