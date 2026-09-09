"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../(backend)/context/auth";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Lock, Mail, Eye, EyeOff, ArrowRight, AlertCircle, X, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type FormData = {
  email: string;
  password: string;
};

function LoginForm() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { user, loading: authLoading, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/member/dashboard';
      router.replace(redirectPath);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (searchParams?.get("reason") === "session_expired") {
      setSessionExpired(true);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);

      const timer = setTimeout(() => {
        setSessionExpired(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      
      // Show success state
      setShowSuccess(true);
      
      // The redirect will happen in the auth context's login function
      // But we'll also set a fallback redirect
      setTimeout(() => {
        const redirectPath = user?.role === 'admin' ? '/admin/dashboard' : '/member/dashboard';
        router.replace(redirectPath);
      }, 1000);
      
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  // If already loading or user is logged in, show loading
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-[#1B3A6B]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#1B3A6B] border-t-transparent" />
          <p className="mt-4 font-serif text-sm font-bold text-[#1B3A6B]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#1B3A6B]">
      <Header />

      {/* SESSION EXPIRED BANNER */}
      <AnimatePresence>
        {sessionExpired && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 px-4"
          >
            <div className="flex items-start justify-between border-2 border-[#800020] bg-[#800020] p-4 text-white shadow-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 text-[#C9A84C]" size={20} />
                <div>
                  <h3 className="font-serif text-sm font-bold text-white uppercase tracking-wider">
                    Session Timed Out
                  </h3>
                  <p className="mt-1 text-xs text-white/90">
                    You were logged out due to 20 minutes of inactivity. Please re-authenticate to continue.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSessionExpired(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex flex-1 items-center justify-center py-16 px-6">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="border-t-4 border-[#C9A84C] border-x border-b border-[#1B3A6B]/15 bg-white p-8 md:p-10 shadow-sm"
          >
            {/* CARD HEADER */}
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-serif font-bold text-[#1B3A6B]">
                Welcome Back
              </h1>
              <p className="mt-2 text-sm text-[#1B3A6B]/80">
                Access your profile and membership services
              </p>
            </div>

            {/* SUCCESS STATE */}
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#C9A84C]/10 p-4 text-sm font-medium text-[#1B3A6B] flex items-center gap-2"
              >
                Login successful! Redirecting...
              </motion.div>
            )}

            {/* ERROR DISPLAY */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 border-l-4 border-[#800020] bg-[#800020]/5 p-4 text-xs font-medium text-[#800020]"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* EMAIL FIELD */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1B3A6B] mb-2">
                  Registered Email Address
                </label>
                <div className="relative">
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full border border-[#1B3A6B]/30 bg-white py-3 pl-11 pr-4 text-sm text-[#1B3A6B] placeholder-[#1B3A6B]/40 focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C] transition"
                    placeholder="alumni@standrewsturi.com"
                    disabled={loading}
                  />
                  <Mail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1B3A6B]/50"
                  />
                </div>
              </div>

              {/* PASSWORD FIELD */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1B3A6B] mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full border border-[#1B3A6B]/30 bg-white py-3 pl-11 pr-11 text-sm text-[#1B3A6B] placeholder-[#1B3A6B]/40 focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C] transition"
                    placeholder="••••••••••••"
                    disabled={loading}
                  />
                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1B3A6B]/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#1B3A6B]/50 hover:text-[#1B3A6B] cursor-pointer transition"
                    disabled={loading}
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                <div className="mt-2 text-right">
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-[#800020] hover:underline transition"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full border-2 border-[#1B3A6B] bg-[#1B3A6B] py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-[#800020] hover:border-[#800020] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Logging in...
                  </>
                ) : (
                  <>
                    Login <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* CARD FOOTER */}
            <div className="mt-8 border-t border-[#1B3A6B]/10 pt-6 text-center">
              <p className="text-xs text-[#1B3A6B]/80">
                Not yet registered in the Old Turian Society?
              </p>
              <Link
                href="/payments"
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#C9A84C] hover:underline transition"
              >
                Register Alumni Profile <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white text-[#1B3A6B]">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#1B3A6B] border-t-transparent" />
            <p className="mt-4 font-serif text-sm font-bold text-[#1B3A6B]">Loading Portal...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}