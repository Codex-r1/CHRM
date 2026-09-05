"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../(backend)/context/auth";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const navItems = [
    { label: "Old Turians", href: "/" },
    { label: "Membership", href: "/payments" },
    { label: "Events", href: "/events" },
    { label: "Merchandise", href: "/merchandise" },
    { label: "About Us", href: "/about" },
    { label: "Get In Touch", href: "/contact" },
  ];

  if (authLoading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-[#800020]/20 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-12">
          <div className="h-12 w-48 bg-gray-200 animate-pulse" />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full shadow-md">
      {/* BRANDING BAR (Maroon Top) */}
      <div className="border-b-2 border-[#C9A84C] bg-[#800020] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 lg:px-12">
          <Link href="/" className="group flex items-center gap-4">
            {/* Crest Shield */}
            <svg
              className="h-12 w-auto transition-transform group-hover:scale-105"
              viewBox="0 0 60 70"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M30 2L5 14V34C5 49.5 30 65 30 65C30 65 55 49.5 55 34V14L30 2Z"
                fill="#1B3A6B"
                stroke="#C9A84C"
                strokeWidth="3"
              />
              <path
                d="M30 12L34 24H46L36 31L40 43L30 35L20 43L24 31L14 24H26L30 12Z"
                fill="#C9A84C"
              />
            </svg>
            <div>
              <span className="block font-serif text-lg font-bold tracking-tight text-white uppercase md:text-xl">
                St Andrew's Turi
              </span>
              <span className="block text-[10px] font-semibold tracking-widest text-[#C9A84C] uppercase md:text-xs">
                Est. 1931 · Seeking the Highest
              </span>
            </div>
          </Link>

          {/* Desktop Auth Controls */}
          <div className="hidden items-center gap-4 md:flex">
            {user ? (
              <>
                <Link
                  href="/member/dashboard"
                  className="border border-[#C9A84C] bg-[#C9A84C] px-5 py-2 text-xs font-bold tracking-wider text-[#1B3A6B] uppercase transition-all hover:bg-white hover:text-[#800020]"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="border border-white/40 bg-transparent px-5 py-2 text-xs font-bold tracking-wider text-white uppercase transition-all hover:bg-white hover:text-[#800020]"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-bold tracking-wider text-white uppercase hover:text-[#C9A84C] transition-colors"
                >
                  Portal Login
                </Link>
                <Link
                  href="/payments"
                  className="border-2 border-[#C9A84C] bg-[#C9A84C] px-5 py-2 text-xs font-bold tracking-wider text-[#1B3A6B] uppercase transition-all hover:bg-white hover:text-[#800020]"
                >
                  Register Profile
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white hover:text-[#C9A84C] md:hidden cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* NAVIGATION BAR (Navy Blue) */}
      <nav className="hidden bg-[#1B3A6B] md:block">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <ul className="flex flex-wrap items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`block border-b-4 px-5 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
                      isActive
                        ? "border-[#C9A84C] bg-white/10 text-white"
                        : "border-transparent text-white/90 hover:border-[#C9A84C] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* MOBILE DROPDOWN MENU */}
      {mobileMenuOpen && (
        <div className="border-t border-[#C9A84C] bg-[#1B3A6B] text-white md:hidden">
          <nav className="flex flex-col px-6 py-6 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`text-xs font-bold uppercase tracking-widest py-2 border-b border-white/10 ${
                  pathname === item.href ? "text-[#C9A84C]" : "text-white"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}