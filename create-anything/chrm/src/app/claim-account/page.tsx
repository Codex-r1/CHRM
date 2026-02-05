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
  const [step, setStep] = useState(1);
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
      <div className="min-h-screen bg-[#F7F9FC]">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md text-center">
            <div className="relative bg-white rounded-2xl p-8 shadow-lg border border-[#E7ECF3] overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#E8F4FD] to-[#d4e9fa] rounded-full -translate-x-16 -translate-y-16" />
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-[#FFF4E6] to-[#ffe9cc] rounded-full translate-x-20 translate-y-20" />
              
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-24 h-24 bg-gradient-to-br from-[#2B4C73] to-[#1E3A5F] rounded-full flex items-center justify-center mx-auto mb-8 shadow-md"
                >
                  <CheckCircle className="text-white" size={48} />
                </motion.div>
                
                <h1 className="text-3xl font-bold text-[#0B0F1A] mb-4 font-poppins">
                  Check Your Email!
                </h1>
                
                <p className="text-[#6D7A8B] mb-8 leading-relaxed">
                  We've sent a password setup link to <strong className="text-[#2B4C73]">{formData.email}</strong>.
                  Click the link in your email to set your password and access your account.
                </p>
                
                <div className="space-y-4">
                  <button
                    onClick={() => setStep(1)}
                    className="w-full px-6 py-3 bg-[#E7ECF3] text-[#6D7A8B] font-semibold rounded-xl hover:bg-[#d4dae3] transition-colors"
                  >
                    Back to Claim Form
                  </button>
                  <Link
                    href="/login"
                    className="block w-full px-6 py-3 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white font-semibold rounded-xl hover:opacity-90 transition-all hover:shadow-md"
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
    <div className="min-h-screen bg-[#F7F9FC]">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="relative bg-white rounded-2xl p-8 shadow-lg border border-[#E7ECF3] overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#E8F4FD] to-[#d4e9fa] rounded-full -translate-x-16 -translate-y-16" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-[#FFF4E6] to-[#ffe9cc] rounded-full translate-x-20 translate-y-20" />
            
            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#FF7A00] to-[#FF9500] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                  <Key className="text-white" size={28} />
                </div>
                
                <h1 className="text-3xl font-bold text-[#0B0F1A] mb-2 font-poppins">
                  Claim Your Account
                </h1>
                <p className="text-[#6D7A8B]">
                  Already have a CHRMAA membership? Claim your online access.
                </p>
              </div>

              {error && (
                <div className="bg-[#FFF0F0] border border-[#E53E3E]/30 text-[#E53E3E] px-4 py-3 rounded-xl mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block font-poppins font-semibold text-sm text-[#6D7A8B] mb-2 flex items-center gap-2">
                    <User size={16} className="text-[#6D7A8B]" />
                    Membership Number
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.membership_number}
                    onChange={(e) =>
                      setFormData({ ...formData, membership_number: e.target.value.toUpperCase() })
                    }
                    className="w-full px-4 py-3 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#2B4C73] focus:ring-2 focus:ring-[#E8F4FD] transition-all duration-200"
                    style={{ textTransform: 'uppercase' }}
                  />
                  <p className="text-xs text-[#6D7A8B] mt-1">
                    Enter your CHRMAA membership number 
                  </p>
                </div>

                <div>
                  <label className="block font-poppins font-semibold text-sm text-[#6D7A8B] mb-2 flex items-center gap-2">
                    <Mail size={16} className="text-[#6D7A8B]" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#2B4C73] focus:ring-2 focus:ring-[#E8F4FD] transition-all duration-200"
                    placeholder="your.email@example.com"
                  />
                  <p className="text-xs text-[#6D7A8B] mt-1">
                    We'll send a password setup link to this email
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full px-4 py-4 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-md"
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

              <div className="mt-8 pt-6 border-t border-[#E7ECF3] text-center">
                <p className="text-[#6D7A8B]">
                  New to CHRMAA?{" "}
                  <Link
                    href="/payments"
                    className="text-[#2B4C73] hover:text-[#1E3A5F] font-semibold hover:underline transition-colors"
                  >
                    Register as a new member
                  </Link>
                </p>
                <p className="text-[#6D7A8B] mt-2">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-[#2B4C73] hover:text-[#1E3A5F] font-semibold hover:underline transition-colors"
                  >
                    Login here
                  </Link>
                </p>
              </div>

              <div className="mt-6 bg-[#E8F4FD] p-4 rounded-xl border border-[#2B4C73]/20">
                <div className="flex items-start gap-3">
                  <div>
                    <p className="text-sm text-[#2B4C73]">
                      <span className="font-semibold">Note:</span> This is for alumni who registered and have a membership number. New members should register through the payments page.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        
        .font-poppins {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>

      <Footer />
    </div>
  );
}