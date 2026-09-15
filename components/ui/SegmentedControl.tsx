"use client";

/**
 * Generic segmented (radio-group) control — used for the work-status
 * inline edit (TT-03/TT-04/TT-06) and the days/weeks duration-unit picker
 * (TT-05/TT-09). Native radio inputs under the hood (.seg/.seg-opt in
 * app/globals.css), so it's keyboard-operable for free.
 */
export function SegmentedControl<T extends string>({
  name,
  options,
  value,
  onChange,
  disabled = false,
  size = "md",
}: {
  name: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <div className="seg" role="radiogroup">
      {options.map((o) => (
        <label
          key={o.value}
          className="seg-opt"
          style={size === "sm" ? { padding: "5px 9px", fontSize: 11.5 } : undefined}
        >
          <input
            type="radio"
            name={name}
            checked={value === o.value}
            disabled={disabled}
            onChange={() => onChange(o.value)}
          />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}
