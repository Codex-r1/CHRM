"use client";

import { useState, useEffect } from "react";
import { Menu, X, Loader2, CheckCircle, Users } from "lucide-react";
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent scrolling when overlay is open
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

  // Clean up stale session data
  useEffect(() => {
    if (!authLoading && !user) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        localStorage.removeItem('user');
        sessionStorage.clear();
      }
    }
  }, [user, authLoading]);

  // Handle logout with proper state clearing
  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    setShowLogoutOverlay(true);
    setLogoutStep('logging');

    try {
      // Call the logout function from auth context
      await logout();
      
      // Show success state
      setLogoutStep('success');
      
      // Wait for success animation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Force a full page reload to clear all state
      // The auth context logout should handle the redirect, but we'll ensure it happens
      window.location.href = '/';
      
    } catch (error) {
      console.error('Logout error:', error);
      setShowLogoutOverlay(false);
      setIsLoggingOut(false);
      setLogoutStep('idle');
    }
  };

  // Standard Public Navigation
  const publicNavItems = [
    { label: "Old Turians", href: "/" },
    { label: "Membership", href: "/payments" },
    { label: "Events", href: "/events" },
    { label: "Merchandise", href: "/merchandise" },
    { label: "About Us", href: "/about" },
    { label: "Get In Touch", href: "/contact" },
  ];

  // Dynamic Navigation: Appends "Find Alumni" when authenticated
  const navItems = user 
    ? [
        ...publicNavItems.slice(0, 2),
        { label: "Find Old Friends", href: "/member/directory" },
        ...publicNavItems.slice(2)
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
      <header className="sticky top-0 z-50 w-full shadow-md">
        {/* BRANDING BAR (Maroon Top) */}
        <div className="border-b-2 border-[#C9A84C] bg-[#800020] text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 lg:px-12">
        
<Link href="/" className="group flex items-center gap-4">
  <img 
    src="/St-Andrews-Turi.png" 
    alt="St Andrew's Turi" 
    className="h-14 w-auto transition-transform group-hover:scale-105 object-contain"
  />
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
                    href="/member/directory"
                    className="flex items-center gap-1.5 border border-[#C9A84C] bg-white/10 px-4 py-2 text-xs font-bold tracking-wider text-white uppercase transition-all hover:bg-[#C9A84C] hover:text-[#1B3A6B]"
                  >
                    <Users size={14} /> Find Old Friends
                  </Link>
                  <Link
                    href={user.role === 'admin' ? "/admin/dashboard" : "/member/dashboard"}
                    className="border border-[#C9A84C] bg-[#C9A84C] px-5 py-2 text-xs font-bold tracking-wider text-[#1B3A6B] uppercase transition-all hover:bg-white hover:text-[#800020]"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center gap-2 border border-white/40 bg-transparent px-5 py-2 text-xs font-bold tracking-wider text-white uppercase transition-all hover:bg-white hover:text-[#800020] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 className="animate-spin" size={14} /> Logging out...
                      </>
                    ) : (
                      'Logout'
                    )}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-xs font-bold tracking-wider text-white uppercase hover:text-[#C9A84C] transition-colors"
                  >
                    Login
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
              className="p-2 text-white hover:text-[#C9A84C] md:hidden cursor-pointer transition-colors"
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
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="border-t border-[#C9A84C] bg-[#1B3A6B] text-white md:hidden overflow-hidden"
            >
              <nav className="flex flex-col px-6 py-6 space-y-4">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`text-xs font-bold uppercase tracking-widest py-2 border-b border-white/10 ${
                      pathname === item.href ? "text-[#C9A84C]" : "text-white hover:text-[#C9A84C]"
                    } transition-colors`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                {/* Mobile Auth Actions */}
                {user ? (
                  <>
                    <Link
                      href="/member/directory"
                      className="text-xs font-bold uppercase tracking-widest py-2 border-b border-white/10 text-[#C9A84C] flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Users size={14} /> Find Old Friends
                    </Link>
                    <Link
                      href={user.role === 'admin' ? "/admin/dashboard" : "/member/dashboard"}
                      className="text-xs font-bold uppercase tracking-widest py-2 border-b border-white/10 text-[#C9A84C]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      disabled={isLoggingOut}
                      className="text-xs font-bold uppercase tracking-widest py-2 text-white/70 hover:text-white transition-colors text-left disabled:opacity-50"
                    >
                      {isLoggingOut ? 'Logging out...' : 'Logout'}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-xs font-bold uppercase tracking-widest py-2 border-b border-white/10 text-white hover:text-[#C9A84C] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Portal Login
                    </Link>
                    <Link
                      href="/payments"
                      className="text-xs font-bold uppercase tracking-widest py-2 text-[#C9A84C] hover:text-[#C9A84C]/80 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Register Profile
                    </Link>
                  </>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* LOGOUT OVERLAY */}
      <AnimatePresence>
        {showLogoutOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] bg-[#1B3A6B]/95 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ 
                duration: 0.4, 
                ease: [0.16, 1, 0.3, 1],
                delay: 0.1 
              }}
              className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center shadow-2xl"
            >
              {logoutStep === 'logging' && (
                <>
                  <div className="w-20 h-20 bg-[#1B3A6B]/10 rounded-full flex items-center justify-center mx-auto mb-5">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="text-[#1B3A6B]" size={36} />
                    </motion.div>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-[#1B3A6B] mb-2">
                    Logging Out
                  </h3>
                  <p className="text-[#1B3A6B]/60 text-sm">
                    Please wait while we securely log you out of your account.
                  </p>
                  <div className="mt-6 flex justify-center gap-2">
                    <div className="w-2 h-2 bg-[#C9A84C] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-[#C9A84C] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-[#C9A84C] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </>
              )}

              {logoutStep === 'success' && (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 25,
                      delay: 0.1 
                    }}
                    className="w-20 h-20 bg-[#C9A84C]/10 rounded-full flex items-center justify-center mx-auto mb-5"
                  >
                    <CheckCircle className="text-[#C9A84C]" size={40} />
                  </motion.div>
                  <h3 className="text-2xl font-serif font-bold text-[#1B3A6B] mb-2">
                    Goodbye!
                  </h3>
                  <p className="text-[#1B3A6B]/60 text-sm">
                    You have been successfully logged out.
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}