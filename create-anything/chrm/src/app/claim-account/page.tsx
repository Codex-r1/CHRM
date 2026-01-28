"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { User, Mail, Shield, CheckCircle, ArrowRight, Key } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ClaimAccountPage() {
  const [formData, setFormData] = useState({
    membership_number: "",
    email: "",
  });
  const [step, setStep] = useState(1); // 1: Form, 2: Success
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/claim-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to claim account");
      }

      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md text-center">
            <div className="relative bg-white rounded-2xl p-8 shadow-2xl border border-gray-100 overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-50 rounded-full -translate-x-16 -translate-y-16" />
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-100 to-indigo-50 rounded-full translate-x-20 translate-y-20" />
              
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg"
                >
                  <CheckCircle className="text-white" size={48} />
                </motion.div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Check Your Email!
                </h1>
                
                <p className="text-gray-600 mb-8 leading-relaxed">
                  We've sent a password setup link to <strong>{formData.email}</strong>.
                  Click the link in your email to set your password and access your account.
                </p>
                
                <div className="space-y-4">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Back to Claim Form
                  </button>
                  <Link
                    href="/login"
                    className="block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all"
                  >
                    Go to Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="relative bg-white rounded-2xl p-8 shadow-2xl border border-gray-100 overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full -translate-x-16 -translate-y-16" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-full translate-x-20 translate-y-20" />
            
            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Key className="text-white" size={28} />
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Claim Your Account
                </h1>
                <p className="text-gray-600">
                  Already have a CHRMAA membership? Claim your online access.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                    <User size={16} className="text-gray-500" />
                    Membership Number
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.membership_number}
                    onChange={(e) =>
                      setFormData({ ...formData, membership_number: e.target.value.toUpperCase() })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                   
                    style={{ textTransform: 'uppercase' }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your CHRMAA membership number 
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                    <Mail size={16} className="text-gray-500" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    placeholder="your.email@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    We'll send a password setup link to this email
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full px-4 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Shield size={20} />
                      Claim My Account
                      <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-gray-600">
                  New to CHRMAA?{" "}
                  <Link
                    href="/payments"
                    className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors"
                  >
                    Register as a new member
                  </Link>
                </p>
                <p className="text-gray-600 mt-2">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors"
                  >
                    Login here
                  </Link>
                </p>
              </div>

              <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Shield size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">
                      <span className="font-semibold">Note:</span> This is for alumni who registered and have a membership number. New members should register through the payments page.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}