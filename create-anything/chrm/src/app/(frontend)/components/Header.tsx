"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../(backend)/context/auth";
import { MEMBER_NAV_ITEM, PUBLIC_NAV, ROUTES, SOCIETY, type NavItem } from "../content/site";
import NairobiClock from "./site/NairobiClock";
import { ArrowRightIcon } from "./site/primitives";
import { Dialog, Spinner } from "./ui";
import { useCart } from "../lib/cart";

type LogoutStep = "idle" | "logging" | "success";

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const { user, loading: authLoading, logout } = useAuth();
  const { count: basketCount, ready: basketReady } = useCart();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutStep, setLogoutStep] = useState<LogoutStep>("idle");
  const headerRef = useRef<HTMLElement>(null);

  // Close the menu on navigation, on Escape and on outside click.
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    const onClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    if (logoutStep !== "idle") return;
    setMenuOpen(false);
    setLogoutStep("logging");
    try {
      await logout();
      setLogoutStep("success");
      await new Promise((resolve) => setTimeout(resolve, 800));
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      setLogoutStep("idle");
    }
  };

  const isAdmin = user?.role === "admin";
  // Admins don't join, shop or write to the office, so those links are hidden for them.
  const ADMIN_HIDDEN = new Set<string>([ROUTES.membership, ROUTES.store, ROUTES.contact]);
  const navItems: NavItem[] = !user
    ? PUBLIC_NAV
    : [...PUBLIC_NAV.slice(0, 3), MEMBER_NAV_ITEM, ...PUBLIC_NAV.slice(3)].filter((item) => !isAdmin || !ADMIN_HIDDEN.has(item.href));

  const dashboardHref = isAdmin ? ROUTES.adminDashboard : ROUTES.memberDashboard;
  // The dashboard button is a way back; it isn't needed on the dashboard itself.
  const onDashboard = pathname === dashboardHref;
  // While auth resolves, render the signed-out actions invisibly so the layout doesn't jump.
  const authHidden = authLoading ? { visibility: "hidden" as const } : undefined;

  const renderNavLink = (item: NavItem, className: string) => {
    if (item.comingSoon) {
      return (
        <span key={item.label} className={className} aria-disabled="true" title="Coming soon">
          {item.label}
        </span>
      );
    }
    return (
      <Link key={item.label} href={item.href} className={className} aria-current={isActive(pathname, item.href) ? "page" : undefined}>
        {item.label}
      </Link>
    );
  };

  return (
    <>
      <header ref={headerRef} className="ot-header ot-scope">
        <div className="ot-header-row">
          <Link href="/" className="ot-brand">
            <span className="ot-brand-crest">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/turi-crest.png" alt="St Andrew's Turi crest" width={32} height={56} />
            </span>
            <span className="ot-brand-text">
              <span className="ot-brand-name">{SOCIETY.school}</span>
              <NairobiClock />
            </span>
          </Link>

          <nav className="ot-nav" aria-label="Main">
            {navItems.map((item) => renderNavLink(item, "ot-nav-link"))}
          </nav>

          <div className="ot-header-actions" style={authHidden}>
            {!isAdmin && (
              <Link
                href={ROUTES.storeBasket}
                className="ot-basket-link"
                aria-label={basketReady && basketCount > 0 ? `Basket, ${basketCount} ${basketCount === 1 ? "item" : "items"}` : "Basket"}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 7h12l-1 13H7L6 7z" />
                  <path d="M9 7a3 3 0 0 1 6 0" />
                </svg>
                {basketReady && basketCount > 0 && <span className="ot-basket-count">{basketCount}</span>}
              </Link>
            )}
            {user ? (
              <button type="button" className="ot-header-text-btn ot-header-desktop-only" onClick={handleLogout}>
                Log out
              </button>
            ) : (
              <Link href={ROUTES.login} className="ot-header-text-btn ot-header-desktop-only">
                Log in
              </Link>
            )}
            {!(user && onDashboard) && (
              <Link href={user ? dashboardHref : ROUTES.membership} className="ot-join">
                {user ? "Dashboard" : "Join the society"}
                <ArrowRightIcon size={16} strokeWidth={2} />
              </Link>
            )}
            <button
              type="button"
              className="ot-menu-btn"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="ot-mobile-menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
                {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div id="ot-mobile-menu" className="ot-menu-panel">
            {navItems.map((item) => renderNavLink(item, "ot-menu-link"))}
            {user ? (
              <>
                {!onDashboard && (
                  <Link href={dashboardHref} className="ot-menu-link ot-menu-link--strong">
                    Dashboard
                  </Link>
                )}
                <button type="button" className="ot-menu-link ot-menu-link--strong" onClick={handleLogout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href={ROUTES.login} className="ot-menu-link ot-menu-link--strong">
                  Log in
                </Link>
                <Link href={ROUTES.membership} className="ot-menu-link ot-menu-link--strong">
                  Join the society
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      <Dialog open={logoutStep !== "idle"} onClose={() => undefined} title={logoutStep === "success" ? "Goodbye" : "Logging out"} size="sm">
        <div className="ot-scope ot-stack" style={{ alignItems: "center", gap: "var(--space-3)", color: "var(--brand)" }}>
          {logoutStep === "logging" ? <Spinner size={32} label="Logging out" /> : <p className="ot-body">You have been signed out.</p>}
        </div>
      </Dialog>
    </>
  );
}
