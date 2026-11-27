import Link from "next/link";
import type { CSSProperties, ElementType, ReactNode } from "react";
import { cx } from "../../lib/cx";

/* ── Icons ────────────────────────────────────────────────────────────── */

export function ArrowRightIcon({ size = 16, strokeWidth = 1.75 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }} aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/* ── Layout ───────────────────────────────────────────────────────────── */

interface AutoGridProps {
  /** Minimum column width in px before columns wrap. */
  min: number;
  gap?: string;
  fill?: boolean;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/** Responsive `repeat(auto-fit, minmax(min, 1fr))` grid that never overflows on phones. */
export function AutoGrid({ min, gap, fill, as: Tag = "div", className, style, children }: AutoGridProps) {
  return (
    <Tag className={cx("ot-grid", fill && "ot-grid--fill", className)} style={{ "--ot-min": `${min}px`, gap, ...style } as CSSProperties}>
      {children}
    </Tag>
  );
}

type SectionSpacing = "intro" | "default" | "last" | "none";

const SPACING: Record<SectionSpacing, string | undefined> = {
  intro: "ot-section-intro",
  default: "ot-section",
  last: "ot-section--last",
  none: undefined,
};

export function Section({
  spacing = "default",
  id,
  className,
  style,
  children,
}: {
  spacing?: SectionSpacing;
  id?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cx("ot-container", SPACING[spacing], className)} style={style}>
      {children}
    </section>
  );
}

/* ── Page intro: big title left, lede right, ruled underneath ─────────── */

export function PageIntro({ eyebrow, title, lede }: { eyebrow?: string; title: string; lede: ReactNode }) {
  return (
    <Section spacing="intro">
      <AutoGrid min={320} className="ot-intro">
        <div className="ot-stack" style={{ gap: "var(--space-3)" }}>
          {eyebrow && <span className="ot-caption">{eyebrow}</span>}
          <h1 className="ot-hero">{title}</h1>
        </div>
        <p className="ot-lede">{lede}</p>
      </AutoGrid>
    </Section>
  );
}

/* ── Section heading ──────────────────────────────────────────────────── */

export function SectionHeading({ eyebrow, title, description, ruled }: { eyebrow?: string; title: string; description?: string; ruled?: boolean }) {
  return (
    <div className={cx("ot-stack", ruled && "ot-rule-top")} style={{ gap: "var(--space-2)", marginBottom: "var(--space-8)" }}>
      {eyebrow && <span className="ot-caption">{eyebrow}</span>}
      <h2 className="ot-h2">{title}</h2>
      {description && <p className="ot-body ot-muted">{description}</p>}
    </div>
  );
}

/* ── Arrow link ───────────────────────────────────────────────────────── */

export function ArrowLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cx("ot-arrow-link", className)}>
      <ArrowRightIcon />
      {children}
    </Link>
  );
}

/* ── Navy feature band ────────────────────────────────────────────────── */

export function FeatureBand({ title, children, id, spacing = "default" }: { title: string; children: ReactNode; id?: string; spacing?: SectionSpacing }) {
  return (
    <Section id={id} spacing={spacing}>
      <AutoGrid min={320} className="ot-band">
        <div className="ot-band-head">
          <h2 className="ot-display-sm">{title}</h2>
        </div>
        <div className="ot-band-body">{children}</div>
      </AutoGrid>
    </Section>
  );
}

/* ── Image frame with placeholder ─────────────────────────────────────── */

type Aspect = "banner" | "wide" | "photo" | "portrait";

interface ImageFrameProps {
  aspect: Aspect;
  src?: string | null;
  alt?: string;
  /** Shown when there is no image yet (official photography pending). */
  placeholder?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Fixed-ratio image area. When `src` is empty it renders a neutral hatched
 * placeholder instead of stock photography.
 */
export function ImageFrame({ aspect, src, alt = "", placeholder = "Photo pending", className, children }: ImageFrameProps) {
  return (
    <div className={cx("ot-media", `ot-media--${aspect}`, className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote URLs from Supabase storage; domains not configured for next/image
        <img src={src} alt={alt} loading="lazy" />
      ) : (
        <div className="ot-placeholder" role="img" aria-label={placeholder}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="1" />
            <circle cx="9" cy="10" r="1.5" />
            <path d="M21 16l-5-5-8 8" />
          </svg>
          <span>{placeholder}</span>
        </div>
      )}
      {children}
    </div>
  );
}

/* ── Tile: image + navy title bar + body ──────────────────────────────── */

interface TileProps {
  title: ReactNode;
  href?: string;
  onClick?: () => void;
  media: ReactNode;
  children?: ReactNode;
}

export function Tile({ title, href, onClick, media, children }: TileProps) {
  const bar = (
    <>
      <span className="ot-title">{title}</span>
      <ChevronRightIcon />
    </>
  );
  return (
    <div className="ot-tile">
      <div className="ot-stack">
        {media}
        {href ? (
          <Link href={href} className="ot-tile-bar">
            {bar}
          </Link>
        ) : onClick ? (
          <button type="button" className="ot-tile-bar" onClick={onClick}>
            {bar}
          </button>
        ) : (
          <div className="ot-tile-bar">
            <span className="ot-title">{title}</span>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── Inline status message ────────────────────────────────────────────── */

export function Notice({ tone, children }: { tone: "danger" | "success" | "info" | "warning"; children: ReactNode }) {
  return (
    <div className={`ui-alert ui-alert--${tone}`} role={tone === "danger" ? "alert" : "status"}>
      {children}
    </div>
  );
}
