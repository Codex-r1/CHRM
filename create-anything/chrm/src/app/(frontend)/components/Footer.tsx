import Link from "next/link";
import { ROUTES, SOCIETY } from "../content/site";
import { AutoGrid } from "./site/primitives";

interface FooterProps {
  /** The "Contact office" strip above the footer. Hidden on the contact page, which has its own. */
  showContactStrip?: boolean;
}

export default function Footer({ showContactStrip = true }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <div className="ot-scope">
      {showContactStrip && (
        <section className="ot-contact-strip">
          <AutoGrid min={240} className="ot-container ot-contact-strip-inner">
            <h2 className="ot-h2">Contact office</h2>
            <address className="ot-stack ot-dense" style={{ gap: "var(--space-1)", color: "var(--ink-2)", fontStyle: "normal" }}>
              {SOCIETY.address.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </address>
            <div className="ot-stack ot-dense" style={{ gap: "var(--space-1)" }}>
              <span className="ot-muted">General enquiries</span>
              <a href={`mailto:${SOCIETY.generalEmail}`} className="ot-underline">
                {SOCIETY.generalEmail}
              </a>
            </div>
          </AutoGrid>
        </section>
      )}

      <footer className="ot-footer">
        <div className="ot-container ot-footer-inner">
          <AutoGrid min={220} className="ot-footer-grid">
            <div className="ot-stack ot-span-2" style={{ gap: "var(--space-3)" }}>
              <span className="ot-footer-label">{SOCIETY.name}</span>
              <p className="ot-body" style={{ color: "#fff", maxWidth: 440 }}>
                {SOCIETY.tagline}
              </p>
            </div>
            <nav className="ot-stack" style={{ gap: "var(--space-2)" }} aria-label="Footer">
              <span className="ot-footer-label" style={{ marginBottom: "var(--space-1)" }}>
                Quick links
              </span>
              <Link href={ROUTES.login}>Alumni directory</Link>
              <Link href={ROUTES.membership}>Membership</Link>
              <Link href={ROUTES.events}>Global events</Link>
              <Link href={ROUTES.store}>Official store</Link>
            </nav>
          </AutoGrid>

          <div className="ot-footer-base">
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/turi-crest.png" alt="St Andrew's Turi crest" width={23} height={40} style={{ height: 40, width: "auto", display: "block" }} />
              <span className="ot-stack">
                <span style={{ fontWeight: 800, letterSpacing: "-0.02em", fontSize: "var(--fs-body)", lineHeight: "var(--lh-20)" }}>{SOCIETY.school}</span>
                <span className="ot-footer-label">
                  Est. {SOCIETY.founded} · {SOCIETY.motto}
                </span>
              </span>
            </div>
            <span className="ot-footer-label">
              © {year} {SOCIETY.schoolFull}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
