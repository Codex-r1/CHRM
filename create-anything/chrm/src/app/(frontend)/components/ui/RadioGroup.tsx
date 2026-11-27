"use client";

import type { ReactNode } from "react";
import { cx } from "../../lib/cx";

export interface RadioOption<T extends string> {
  value: T;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

interface RadioGroupProps<T extends string> {
  name: string;
  options: ReadonlyArray<RadioOption<T>>;
  value: T;
  onValueChange: (value: T) => void;
  orientation?: "horizontal" | "vertical";
  variant?: "plain" | "card";
  disabled?: boolean;
  "aria-label"?: string;
}

export function RadioGroup<T extends string>({
  name,
  options,
  value,
  onValueChange,
  orientation = "vertical",
  variant = "plain",
  disabled,
  ...aria
}: RadioGroupProps<T>) {
  return (
    <div
      role="radiogroup"
      className={cx("ui-radio-group", `ui-radio-group--${orientation}`, variant === "card" && "ui-radio-group--card")}
      {...aria}
    >
      {options.map((o) => {
        const isDisabled = disabled || o.disabled;
        return (
          <label key={o.value} className={cx("ui-check", "ui-radio", isDisabled && "is-disabled", value === o.value && "is-checked")}>
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              disabled={isDisabled}
              onChange={() => onValueChange(o.value)}
            />
            <span className="ui-check-box" />
            <span className="ui-check-text">
              <span className="ui-check-label">{o.label}</span>
              {o.description && <span className="ui-check-desc">{o.description}</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}
