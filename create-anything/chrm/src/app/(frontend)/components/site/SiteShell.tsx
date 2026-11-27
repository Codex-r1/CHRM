import type { ReactNode } from "react";
import Header from "../Header";
import Footer from "../Footer";

interface SiteShellProps {
  children: ReactNode;
  showContactStrip?: boolean;
  /** Extra space below the footer, e.g. when a fixed bar overlays the bottom of the page. */
  bottomInset?: number;
}

/** Header + page body + footer for the public marketing pages. */
export default function SiteShell({ children, showContactStrip = true, bottomInset }: SiteShellProps) {
  return (
    <div className="ot-site ot-scope" style={bottomInset ? { paddingBottom: bottomInset } : undefined}>
      <Header />
      <div className="ot-main">{children}</div>
      <Footer showContactStrip={showContactStrip} />
    </div>
  );
}
