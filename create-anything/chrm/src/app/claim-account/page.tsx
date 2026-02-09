"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { 
  User, Mail, Shield, CheckCircle, ArrowRight, Key, Phone, 
  Calendar, BookOpen, Users, Lock, Eye, EyeOff 
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ClaimAccountPage() {
  const [formData, setFormData] = useState({
    membership_number: "",
    email: "",
    full_name: "",
    phone: "",
    password: "",
    graduation_year: "",
    course: "",
    county: "",
  });
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

      // Account created successfully - redirect to login
      setStep(2);
      
      // Auto-redirect after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);

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
                  Account Created!
                </h1>
                
                <p className="text-[#6D7A8B] mb-8 leading-relaxed">
                  Your account has been successfully created with membership number{" "}
                  <strong className="text-[#2B4C73]">{formData.membership_number}</strong>.
                  Redirecting you to login...
                </p>
                
                <Link
                  href="/login"
                  className="inline-block w-full px-6 py-3 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white font-semibold rounded-xl hover:opacity-90 transition-all hover:shadow-md"
                >
                  Go to Login
                </Link>
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
        <div className="w-full max-w-2xl">
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
                  Already a CHRMAA member? Complete this form to set up your online account.
                </p>
              </div>

              {error && (
                <div className="bg-[#FFF0F0] border border-[#E53E3E]/30 text-[#E53E3E] px-4 py-3 rounded-xl mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Membership Number - Primary Field */}
                <div className="bg-[#E8F4FD] p-4 rounded-xl border border-[#2B4C73]/20">
                  <label className="block font-poppins font-semibold text-sm text-[#2B4C73] mb-2 flex items-center gap-2">
                    <Key size={16} />
                    Membership Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.membership_number}
                    onChange={(e) =>
                      setFormData({ ...formData, membership_number: e.target.value.toUpperCase() })
                    }
                    className="w-full px-4 py-3 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#2B4C73] focus:ring-2 focus:ring-[#E8F4FD] transition-all duration-200 text-lg font-mono"
                    style={{ textTransform: 'uppercase' }}
                    placeholder="100XXX"
                  />
                  <p className="text-xs text-[#2B4C73] mt-1">
                    Enter your membership number
                  </p>
                </div>

                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-poppins font-semibold text-sm text-[#6D7A8B] mb-2 flex items-center gap-2">
                      <User size={16} />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                      className="w-full px-4 py-3 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#2B4C73] focus:ring-2 focus:ring-[#E8F4FD] transition-all duration-200"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block font-poppins font-semibold text-sm text-[#6D7A8B] mb-2 flex items-center gap-2">
                      <Mail size={16} />
                      Email Address *
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
                  </div>

                  <div>
                    <label className="block font-poppins font-semibold text-sm text-[#6D7A8B] mb-2 flex items-center gap-2">
                      <Phone size={16} />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-4 py-3 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#2B4C73] focus:ring-2 focus:ring-[#E8F4FD] transition-all duration-200"
                      placeholder="0712345678"
                      pattern="^(07\d{8}|7\d{8}|\+2547\d{8}|2547\d{8})$"
                    />
                  </div>

                  <div>
                    <label className="block font-poppins font-semibold text-sm text-[#6D7A8B] mb-2 flex items-center gap-2">
                      <Calendar size={16} />
                      Graduation Year *
                    </label>
                    <input
                      type="number"
                      required
                      min="2000"
                      max="2030"
                      value={formData.graduation_year}
                      onChange={(e) =>
                        setFormData({ ...formData, graduation_year: e.target.value })
                      }
                      className="w-full px-4 py-3 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#2B4C73] focus:ring-2 focus:ring-[#E8F4FD] transition-all duration-200"
                      placeholder="e.g., 2024"
                    />
                  </div>

                  <div>
                    <label className="block font-poppins font-semibold text-sm text-[#6D7A8B] mb-2 flex items-center gap-2">
                      <BookOpen size={16} />
                      Course Studied *
                    </label>
                    <select
                      required
                      value={formData.course}
                      onChange={(e) =>
                        setFormData({ ...formData, course: e.target.value })
                      }
                      className="w-full px-4 py-3 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#2B4C73] focus:ring-2 focus:ring-[#E8F4FD] transition-all duration-200"
                    >
                      <option value="">Select your course</option>
                      {CHRM_COURSES.map((course) => (
                        <option key={course} value={course}>
                          {course}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-poppins font-semibold text-sm text-[#6D7A8B] mb-2 flex items-center gap-2">
                      <Users size={16} />
                      County of Residence *
                    </label>
                    <select
                      required
                      value={formData.county}
                      onChange={(e) =>
                        setFormData({ ...formData, county: e.target.value })
                      }
                      className="w-full px-4 py-3 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#2B4C73] focus:ring-2 focus:ring-[#E8F4FD] transition-all duration-200"
                    >
                      <option value="">Select your county</option>
                      {COUNTIES_IN_KENYA.map((county) => (
                        <option key={county} value={county}>
                          {county}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Password */}
                <div className="relative">
                  <label className="block font-poppins font-semibold text-sm text-[#6D7A8B] mb-2 flex items-center gap-2">
                    <Lock size={16} />
                    Password *
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-4 py-3 pr-12 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#2B4C73] focus:ring-2 focus:ring-[#E8F4FD] transition-all duration-200"
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-[42px] text-[#6D7A8B] hover:text-[#0B0F1A] transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full px-4 py-4 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-md"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <Shield size={20} />
                      Create My Account
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
                <p className="text-sm text-[#2B4C73]">
                  <span className="font-semibold">Note:</span> This is for existing members who registered manually and already have a membership number.
                </p>
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

const CHRM_COURSES = [
  "Diploma in Human Resource Management (KNEC)",
  "Diploma in Business Management",
  "Diploma in Banking and Finance",
  "Diploma in Supply Chain Management (KNEC)",
  "Diploma in Information Communication Technology (ICT) – KNEC",
  "Diploma in Computer Science / Computer Programming (TVET CDACC)",
  "Diploma in Cyber Security (TVET CDACC)",
  "Diploma in Criminal Justice (TVET CDACC)",
  "Diploma in Security Management (TVET CDACC)",
  "Diploma in Forensic Investigation (TVET CDACC)",
  "Diploma in Customer Service (ICM)",
  "Diploma in Digital Journalism Level 6",
  "Diploma in Food and Beverage Production (Culinary Arts) Level 6",
  "Diploma in Food and Beverage Sales Management Level 6",
  "Higher Diploma in Human Resource Management",
  "Certificate in Human Resource Management (KNEC)",
  "Certificate in Business Management (KNEC)",
  "Certificate in Banking and Finance (KNEC)",
  "Certificate in Supply Chain Management (KNEC)",
  "Certificate in Information Communication Technology (ICT) – KNEC",
  "Certificate in Security Management – TVET CDACC Level 5",
  "Certificate in Cyber Security – TVET CDACC Level 5",
  "Certificate in Forensic Investigation – TVET CDACC Level 5",
  "Certificate in Accounting and Management Skills (CAMS – KASNEB)",
  "Artisan in Store-Keeping (KNEC)",
  "Artisan in Salesmanship (KNEC)",
  "ICT & Computer Application Packages",
  "Digital Marketing & Social Media Courses",
  "Graphic Design & CAD Courses",
  "Leadership & Management Training",
  "HR Consultancy Training",
  "CHRP",
  "HRCi",
  "Other Professional Short Courses",
];

const COUNTIES_IN_KENYA = [
  "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita Taveta", "Garissa", 
  "Wajir", "Mandera", "Marsabit", "Isiolo", "Meru", "Tharaka Nithi", "Embu", 
  "Kitui", "Machakos", "Makueni", "Nyandarua", "Nyeri", "Kirinyaga", "Murang'a", 
  "Kiambu", "Turkana", "West Pokot", "Samburu", "Trans Nzoia", "Uasin Gishu", 
  "Elgeyo Marakwet", "Nandi", "Baringo", "Laikipia", "Nakuru", "Narok", "Kajiado", 
  "Kericho", "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia", "Siaya", 
  "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi"
];