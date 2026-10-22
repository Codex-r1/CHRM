"use client";

import { useState, useEffect } from "react";
import { Menu, X, Loader2, CheckCircle, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from '../../(backend)/context/auth';
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutOverlay, setShowLogoutOverlay] = useState(false);
  const [logoutStep, setLogoutStep] = useState<'idle' | 'logging' | 'success'>('idle');
  
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (showLogoutOverlay) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showLogoutOverlay]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setShowLogoutOverlay(true);
    setLogoutStep('logging');
    try {
      await logout();
      setLogoutStep('success');
      await new Promise(resolve => setTimeout(resolve, 800));
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      setShowLogoutOverlay(false);
      setIsLoggingOut(false);
      setLogoutStep('idle');
    }
  };

  // Added "Alumni Stories" and refined order for narrative flow
  const publicNavItems = [
    { label: "Old Turians", href: "/" },
    { label: "Alumni Stories", href: "/stories" }, 
    { label: "Membership", href: "/payments" },
    { label: "Events", href: "/events" },
    { label: "Merchandise", href: "/merchandise" },
    { label: "About Us", href: "/about" },
    { label: "Get In Touch", href: "/contact" },
  ];

  const navItems = user 
    ? [
        ...publicNavItems.slice(0, 3),
        { label: "Find Old Friends", href: "/member/directory" },
        ...publicNavItems.slice(3)
      ]
    : publicNavItems;

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
    <>
      <header className="sticky top-0 z-50 w-full shadow-sm">
        {/* BRANDING BAR: Refined spacing and typography hierarchy */}
        <div className="border-b border-[#C9A84C]/30 bg-[#800020] text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-12">
            <Link href="/" className="group flex items-center gap-4">
              <img 
                src="/St-Andrews-Turi.png" 
                alt="St Andrew's Turi" 
                className="h-12 w-auto transition-transform group-hover:scale-105 object-contain"
              />
              <div className="flex flex-col">
                <span className="font-serif text-xl font-semibold tracking-wide text-white leading-none">
                  St Andrew's Turi
                </span>
                <span className="text-[10px] font-medium tracking-[0.15em] text-[#C9A84C] uppercase mt-1">
                  Est. 1931 · Old Turians
                </span>
              </div>
            </Link>

            {/* Desktop Auth Controls - Refined Button Styles */}
            <div className="hidden items-center gap-6 md:flex">
              {user ? (
                <>
                  <Link
                    href="/member/directory"
                    className="text-xs font-semibold tracking-wider text-white/90 uppercase hover:text-[#C9A84C] transition-colors flex items-center gap-2"
                  >
                    <Users size={14} /> Directory
                  </Link>
                  <Link
                    href={user.role === 'admin' ? "/admin/dashboard" : "/member/dashboard"}
                    className="bg-[#C9A84C] px-5 py-2.5 text-xs font-bold tracking-wider text-[#1B3A6B] uppercase transition-all hover:bg-white"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="text-xs font-semibold tracking-wider text-white/60 hover:text-white transition-colors"
                  >
                    {isLoggingOut ? <Loader2 className="animate-spin" size={16} /> : 'Logout'}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-xs font-semibold tracking-wider text-white uppercase hover:text-[#C9A84C] transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/payments"
                    className="bg-[#C9A84C] px-6 py-2.5 text-xs font-bold tracking-wider text-[#1B3A6B] uppercase transition-all hover:bg-white"
                  >
                    Join the Society
                  </Link>
                </>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* NAVIGATION BAR: Refined spacing and hover states */}
        <nav className="hidden bg-[#1B3A6B] md:block">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <ul className="flex items-center gap-8">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={`block py-4 text-[13px] font-semibold tracking-wide transition-colors relative ${
                        isActive
                          ? "text-[#C9A84C]"
                          : "text-white/80 hover:text-white"
                      }`}
                    >
                      {item.label}
                      {isActive && (
                        <motion.div 
                          layoutId="nav-underline"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A84C]" 
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Mobile Menu - Logic remains similar but styled cleaner */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-[#C9A84C] bg-[#1B3A6B] text-white md:hidden overflow-hidden"
            >
              <nav className="flex flex-col px-6 py-6 space-y-4">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-sm font-medium tracking-wide text-white/90 hover:text-[#C9A84C]"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="h-px bg-white/10 my-2" />
                {user ? (
                  <>
                    <Link href="/member/dashboard" className="text-sm font-medium text-[#C9A84C]">Dashboard</Link>
                    <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="text-left text-sm text-white/60">LOGOUT</button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="text-sm font-medium text-[#C9A84C]">Login</Link>
                    <Link href="/payments" className="text-sm font-medium text-white">Join the Society</Link>
                  </>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Logout Overlay*/}
      <AnimatePresence>
        {showLogoutOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-[#1B3A6B]/95 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center shadow-2xl"
            >
              {logoutStep === 'logging' && (
                <>
                  <Loader2 className="animate-spin text-[#1B3A6B] mx-auto mb-4" size={32} />
                  <h3 className="text-xl font-serif font-bold text-[#1B3A6B]">Logging Out</h3>
                </>
              )}
              {logoutStep === 'success' && (
                <>
                  <CheckCircle className="text-[#C9A84C] mx-auto mb-4" size={32} />
                  <h3 className="text-xl font-serif font-bold text-[#1B3A6B]">Goodbye!</h3>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}