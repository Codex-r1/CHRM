import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cx } from "../../lib/cx";

interface FieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  description?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}

/** Label + control + helper text. */
export function Field({ label, htmlFor, required, description, error, className, children }: FieldProps) {
  return (
    <div className={cx("ui-field", className)}>
      <label className="ui-label" htmlFor={htmlFor}>
        {label}
        {required && (
          <span className="ui-label-req" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <div className="ui-field-error" role="alert">
          {error}
        </div>
      ) : description ? (
        <div className="ui-field-desc">{description}</div>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  /** Content shown inside the right edge of the input (icon, toggle button, card logo). */
  trailing?: ReactNode;
}

export function Input({ invalid, trailing, className, ...rest }: InputProps) {
  const input = <input className={cx("ui-input", className)} aria-invalid={invalid || undefined} {...rest} />;
  if (!trailing) return input;
  return (
    <div className="ui-input-wrap">
      {input}
      <span className="ui-input-trailing">{trailing}</span>
    </div>
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx("ui-input", "ui-textarea", className)} {...rest} />;
}

interface NativeSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: ReadonlyArray<string | { value: string; label: string }>;
  placeholder?: string;
}

export function NativeSelect({ options, placeholder, className, ...rest }: NativeSelectProps) {
  return (
    <div className="ui-native-select">
      <select className={cx("ui-input", className)} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => {
          const opt = typeof o === "string" ? { value: o, label: o } : o;
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
      </select>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}
