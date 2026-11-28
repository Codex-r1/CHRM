import type { ReactNode } from "react";

interface EmptyProps {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
}

export function Empty({ title, description, icon, actions }: EmptyProps) {
  return (
    <div className="ui-empty">
      <span className="ui-empty-media" aria-hidden="true">
        {icon ?? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 13l2-8h12l2 8" />
            <path d="M4 13v6h16v-6h-5a3 3 0 0 1-6 0z" />
          </svg>
        )}
      </span>
      <p className="ui-empty-title">{title}</p>
      {description && <p className="ui-empty-desc">{description}</p>}
      {actions && <div className="ui-empty-actions">{actions}</div>}
    </div>
  );
}
