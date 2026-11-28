import type { ReactNode } from "react";
import SiteShell from "./SiteShell";
import { Section } from "./primitives";

interface ResultPanelProps {
  tone: "success" | "warning" | "danger";
  badge: string;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}

/** Centred confirmation / error page used after payments. */
export default function ResultPanel({ tone, badge, title, children, actions }: ResultPanelProps) {
  return (
    <SiteShell>
      <Section spacing="last" style={{ paddingTop: "var(--space-24)" }}>
        <div className="ot-stack ot-fade-in" style={{ maxWidth: 560, margin: "0 auto", alignItems: "center", textAlign: "center", gap: "var(--space-4)" }} aria-live="polite">
          <span className={`ui-badge ui-badge--${tone}`}>{badge}</span>
          <h1 className="ot-display-sm">{title}</h1>
          {children && <div className="ot-body">{children}</div>}
          {actions && <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", justifyContent: "center", marginTop: "var(--space-2)" }}>{actions}</div>}
        </div>
      </Section>
    </SiteShell>
  );
}
