"use client";

import { cx } from "../../lib/cx";

export interface ToggleOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface ToggleGroupProps<T extends string> {
  options: ReadonlyArray<ToggleOption<T>>;
  value: T;
  onValueChange: (value: T) => void;
  variant?: "segmented" | "plain";
  "aria-label"?: string;
  className?: string;
}

/** Single-select segmented control (Upcoming / Past, store categories, …). */
export function ToggleGroup<T extends string>({
  options,
  value,
  onValueChange,
  variant = "segmented",
  className,
  ...aria
}: ToggleGroupProps<T>) {
  return (
    <div role="group" className={cx("ui-toggle-group", variant === "segmented" && "ui-toggle-group--segmented", className)} {...aria}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="ui-toggle"
          aria-pressed={value === o.value}
          disabled={o.disabled}
          onClick={() => onValueChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
