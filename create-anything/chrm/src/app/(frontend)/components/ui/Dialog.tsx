"use client";

import { useEffect, useId, type ReactNode } from "react";
import { cx } from "../../lib/cx";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  size?: "md" | "sm";
  children: ReactNode;
}

/** Lightweight modal: closes on Escape and on backdrop click, locks body scroll. */
export function Dialog({ open, onClose, title, size = "md", children }: DialogProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ui-overlay" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx("ui-dialog", size === "sm" && "ui-dialog--sm")}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, padding: "20px 24px", borderBottom: "1px solid var(--divider-strong)" }}>
          <h2 id={titleId} className="ot-title">
            {title}
          </h2>
          <button type="button" className="ui-icon-btn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}
