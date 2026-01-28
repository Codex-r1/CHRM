"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase/client"; // ← FIXED: should be supabase, not supabaseAdmin
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Lock, Mail, Eye, EyeOff, ArrowRight, Shield, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import Link from "next/link";

type FormData = {
  email: string;
  password: string;
};

// Animation Variants
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

export default function LoginPage() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

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
      const user = data.user;
const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single();

if (profileError) {
  console.error("Profile fetch error:", profileError);
  router.push("/member/dashboard");
  return;
}

if (profile.role === "admin") {
  router.push("/admin/dashboard");
} else {
  router.push("/member/dashboard");
}
router.refresh(); 
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex flex-col"
    >
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <div className="relative bg-white rounded-2xl p-8 shadow-2xl border border-gray-100 overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full -translate-x-16 -translate-y-16" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-full translate-x-20 translate-y-20" />
            
            {/* Floating Icons */}
            <div className="absolute top-6 right-6">
              <Shield size={24} className="text-blue-500/30" />
            </div>
            <div className="absolute bottom-6 left-6">
              <Sparkles size={20} className="text-amber-500/30" />
            </div>
            
            <div className="relative z-10">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="text-center mb-8"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Lock className="text-white" size={28} />
                </div>
                
                <motion.h1
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.1 }}
                  className="text-3xl font-bold text-gray-900 mb-2 font-poppins"
                >
                  Welcome Back
                </motion.h1>
                <motion.p
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.2 }}
                  className="text-gray-600"
                >
                  Sign in to access your dashboard
                </motion.p>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6"
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
                    <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                      <Mail size={16} className="text-gray-500" />
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
                        className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                        placeholder="your.email@example.com"
                      />
                      <Mail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                  </motion.div>

                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.4 }}
                  >
                    <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                      <Lock size={16} className="text-gray-500" />
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
                        className="w-full px-4 py-3 pl-12 pr-12 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200" 
                        placeholder="Enter your password"
                      />
                      <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    <div className="mt-2 text-right">
                      <Link
                        href="/forgot-password"
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
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
                  className="group w-full px-4 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
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
                className="mt-8 pt-6 border-t border-gray-100 text-center"
              >
                <p className="text-gray-600">
                  Don't have an account?{" "}
                  <Link
                    href="/payments"
                    className="group inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors"
                  >
                    Register here
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </p>
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.7 }}
                className="mt-6 bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Shield size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold text-green-600">Secure login:</span> Your credentials are encrypted and protected.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </motion.div>
  );
}