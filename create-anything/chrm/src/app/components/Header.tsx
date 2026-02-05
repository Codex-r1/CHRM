"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/auth"; 

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter(); 

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // Show loading state if auth is still loading
  if (authLoading) {
    return (
      <header className="bg-[#FFF] border-b border-[#000] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logos - keep as is */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-4">
                <Image
                  src="/CHRM LOGO.jpeg"
                  alt="CHRM College"
                  width={56}
                  height={56}
                  className="h-14 w-auto object-contain"
                  unoptimized
                />
                <Image
                  src="/CHRMAA LOGO.jpeg"
                  alt="CHRMAA"
                  width={56}
                  height={56}
                  className="h-14 w-auto object-contain"
                  unoptimized
                />
              </Link>
            </div>
            <div className="animate-pulse">
              <div className="h-10 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-[#FFF] border-b border-[#000] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logos */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-4">
              <Image
                src="/CHRM LOGO.jpeg"
                alt="CHRM College"
                width={56}
                height={56}
                className="h-14 w-auto object-contain"
                unoptimized
              />
              <Image
                src="/CHRMAA LOGO.jpeg"
                alt="CHRMAA"
                width={56}
                height={56}
                className="h-14 w-auto object-contain"
                unoptimized
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-[#0F172A] hover:text-[#d69e2e] transition font-inter"
            >
              Home
            </Link>
            <Link
              href="/payments"
              className="text-[#0f172a] hover:text-[#d69e2e] transition font-inter"
            >
              Payments
            </Link>
            <Link
              href="/merchandise"
              className="text-[#0f172a] hover:text-[#d69e2e] transition font-inter"
            >
              Merchandise
            </Link>
            <Link
              href="/events"
              className="text-[#0F172A] hover:text-[#d69e2e] transition font-inter"
            >
              Events
            </Link>
            <Link
              href="/about"
              className="text-[#0F172A] hover:text-[#d69e2e] transition font-inter"
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className="text-[#0f172a] hover:text-[#d69e2e] transition font-inter"
            >
              Contacts
            </Link>
          </nav>

          {/* Desktop Auth Buttons - Conditionally Render */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              // User is logged in - show Dashboard & Logout
              <>
                <Link
                  href="/member/dashboard"
                  className="px-4 py-2 bg-[#d69e2e] text-[#0f172a] font-semibold rounded hover:bg-[#b8832a] transition font-inter"
                >
                  Back to Dash
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-[#E53E3E] text-white font-semibold rounded hover:bg-[#C53030] transition font-inter border border-[#E53E3E]"
                >
                  Logout
                </button>
              </>
            ) : (
              // User is not logged in - show Register & Login
              <>
                <Link
                  href="/payments"
                  className="px-4 py-2 bg-[#d69e2e] text-[#0f172a] font-semibold rounded hover:bg-[#b8832a] transition font-inter"
                >
                  Register
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 bg-[#2B4C73] text-white font-semibold rounded hover:bg-[#1d4ed8] transition font-inter"
                >
                  Login
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-[#0f172a]"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu - Updated with Conditional Auth Buttons */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <nav className="flex flex-col px-4 py-4 gap-3">
            <Link
              href="/"
              className="text-[#0f172a] hover:text-[#d69e2e] py-2 font-inter"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-[#0f172a] hover:text-[#d69e2e] py-2 font-inter"
              onClick={() => setMobileMenuOpen(false)}
            >
              About Us
            </Link>
            <Link
              href="/payments"
              className="text-[#0f172a] hover:text-[#d69e2e] py-2 font-inter"
              onClick={() => setMobileMenuOpen(false)}
            >
              Payments
            </Link>
            <Link
              href="/merchandise"
              className="text-[#0f172a] hover:text-[#d69e2e] py-2 font-inter"
              onClick={() => setMobileMenuOpen(false)}
            >
              Merchandise
            </Link>
            <Link
              href="/events"
              className="text-[#0f172a] hover:text-[#d69e2e] py-2 font-inter"
              onClick={() => setMobileMenuOpen(false)}
            >
              Events
            </Link>
            <Link
              href="/contact"
              className="text-[#0f172a] hover:text-[#d69e2e] py-2 font-inter"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            
            {/* Mobile Auth Buttons - Conditionally Render */}
            <div className="flex flex-col gap-2 mt-2">
              {user ? (
                // User is logged in - show Dashboard & Logout
                <>
                  <Link
                    href="/member/dashboard"
                    className="px-4 py-2 bg-[#d69e2e] text-[#0f172a] font-semibold rounded text-center font-inter"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Back to Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-2 bg-[#E53E3E] text-white font-semibold rounded text-center font-inter"
                  >
                    Logout
                  </button>
                </>
              ) : (
                // User is not logged in - show Register & Login
                <>
                  <Link
                    href="/payments"
                    className="px-4 py-2 bg-[#d69e2e] text-[#0f172a] font-semibold rounded text-center font-inter"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                  <Link
                    href="/login"
                    className="px-4 py-2 bg-[#2B4C73] text-white font-semibold rounded text-center font-inter"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}