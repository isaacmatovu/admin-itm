import type { ElementType, ComponentPropsWithoutRef } from "react";

type BlueprintProps<T extends ElementType> = {
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

/**
 * The card frame every panel, figure and stat card wears: a white
 * (var(--color-surface)) rounded rectangle with a hairline border and a
 * soft resting shadow that lifts slightly on hover (see .blueprint in
 * app/globals.css). Polymorphic via `as` so the same frame can wrap a
 * plain div, a clickable button (TT-07's shortcut cards), or an anchor.
 */
export function Blueprint<T extends ElementType = "div">({
  as,
  className = "",
  children,
  ...rest
}: BlueprintProps<T>) {
  const Tag = as || "div";
  return (
    <Tag className={`blueprint ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
