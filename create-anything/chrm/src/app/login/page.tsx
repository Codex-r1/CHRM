"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase/client";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Lock, Mail, Eye, EyeOff, ArrowRight, Shield, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import Link from "next/link";

type FormData = {
  email: string;
  password: string;
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const slideDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3 },
  },
};

export default function LoginPage() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('reason') === 'session_expired') {
      setSessionExpired(true);
      
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
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

    const { email, password } = formData;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        throw new Error(error?.message || "Invalid email or password");
      }

      console.log("Login successful! Session created.");
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastActivity', Date.now().toString());
      }
      
      const user = data.user;
      
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError || !profile) {
        console.error("Profile missing", profileError);
        setError("Your account is not fully set up. Please contact support.");
        setLoading(false);
        return;
      }

      if (profile.role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/member/dashboard");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#F7F9FC] flex flex-col"
    >
      <Header />

      {/* Session Expired Alert */}
      <AnimatePresence>
        {sessionExpired && (
          <motion.div
            variants={slideDown}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
          >
            <div className="bg-[#FFF0F0] border-2 border-[#E53E3E]/30 rounded-xl shadow-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="w-10 h-10 bg-[#E53E3E]/10 rounded-full flex items-center justify-center"
                  >
                    <AlertCircle className="text-[#E53E3E]" size={24} />
                  </motion.div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#0B0F1A] mb-1 font-poppins">
                    Session Expired
                  </h3>
                  <p className="text-sm text-[#6D7A8B]">
                    You were logged out due to 20 minutes of inactivity. Please log in again to continue.
                  </p>
                </div>
                <button
                  onClick={() => setSessionExpired(false)}
                  className="flex-shrink-0 text-[#6D7A8B] hover:text-[#0B0F1A] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <div className="relative bg-white rounded-2xl p-8 shadow-lg border border-[#E7ECF3] overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#E8F4FD] to-[#d4e9fa] rounded-full -translate-x-16 -translate-y-16" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-[#FFF4E6] to-[#ffe9cc] rounded-full translate-x-20 translate-y-20" />
            
            {/* Floating Icons */}
            <div className="absolute top-6 right-6">
              <Shield size={24} className="text-[#2B4C73]/20" />
            </div>
            
            <div className="relative z-10">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="text-center mb-8"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#2B4C73] to-[#1E3A5F] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                  <Lock className="text-white" size={28} />
                </div>
                
                <motion.h1
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.1 }}
                  className="text-3xl font-bold text-[#0B0F1A] mb-2 font-poppins"
                >
                  Welcome Back
                </motion.h1>
                <motion.p
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.2 }}
                  className="text-[#6D7A8B]"
                >
                  Sign in to access your dashboard
                </motion.p>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#FFF0F0] border border-[#E53E3E]/30 text-[#E53E3E] px-4 py-3 rounded-xl mb-6"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.3 }}
                  >
                    <label className="block font-poppins font-semibold text-sm text-[#6D7A8B] mb-2 flex items-center gap-2">
                      <Mail size={16} className="text-[#6D7A8B]" />
                      Email Address
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
                        className="w-full px-4 py-3 pl-12 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] bg-white focus:outline-none focus:border-[#2B4C73] focus:ring-2 focus:ring-[#E8F4FD] transition-all duration-200"
                        placeholder="your.email@example.com"
                      />
                      <Mail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#6D7A8B]" />
                    </div>
                  </motion.div>

                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.4 }}
                  >
                    <label className="block font-poppins font-semibold text-sm text-[#6D7A8B] mb-2 flex items-center gap-2">
                      <Lock size={16} className="text-[#6D7A8B]" />
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
                        className="w-full px-4 py-3 pl-12 pr-12 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] bg-white focus:outline-none focus:border-[#2B4C73] focus:ring-2 focus:ring-[#E8F4FD] transition-all duration-200" 
                        placeholder="Enter your password"
                      />
                      <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#6D7A8B]" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#6D7A8B] hover:text-[#0B0F1A] transition-colors"
                      >
                        {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                      </button>
                    </div>
                    <div className="mt-2 text-right">
                      <Link
                        href="/forgot-password"
                        className="text-sm text-[#2B4C73] hover:text-[#1E3A5F] hover:underline transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </motion.div>
                </div>

                <motion.button
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.5 }}
                  type="submit"
                  disabled={loading}
                  className="group w-full px-4 py-4 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-md"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : null}
                  {loading ? "Signing in..." : "Sign In"}
                  {!loading && <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />}
                </motion.button>
              </form>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.6 }}
                className="mt-8 pt-6 border-t border-[#E7ECF3] text-center"
              >
                <p className="text-[#6D7A8B] mb-4">
                  Don't have an account?{" "}
                  <Link
                    href="/claim-account"
                    className="group inline-flex items-center gap-1 text-[#2B4C73] hover:text-[#1E3A5F] font-semibold hover:underline transition-colors"
                  >
                    Claim your account
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </p>
                <p className="text-[#6D7A8B]">
                  New to CHRMAA?{" "}
                  <Link
                    href="/payments"
                    className="group inline-flex items-center gap-1 text-[#FF7A00] hover:text-[#E56A00] font-semibold hover:underline transition-colors"
                  >
                    Register as new member
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        
        .font-poppins {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>

      <Footer />
    </motion.div>
  );
}