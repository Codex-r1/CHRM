"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { CheckCircle, Lock, User, Mail, Phone, Calendar, CreditCard, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

type FormData = {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  graduation_year: string;
};

// Animation Variants
const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const fadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const buttonHover = {
  scale: 1.02,
  y: -2,
  boxShadow: "0 10px 25px rgba(43, 76, 115, 0.3)",
  transition: {
    type: "spring" as const,
    stiffness: 400,
    damping: 15,
  },
};

const buttonTap = {
  scale: 0.98,
};

const inputHover = {
  scale: 1.01,
  borderColor: "#2563eb",
  transition: {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
  },
};

const inputFocus = {
  scale: 1.02,
  borderColor: "#2B4C73",
  boxShadow: "0 0 0 3px rgba(43, 76, 115, 0.1)",
  transition: {
    type: "spring" as const,
    stiffness: 400,
    damping: 15,
  },
};

export default function RegisterPage() {
  const [step, setStep] = useState(1); // 1: form, 2: payment instructions, 3: success
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    graduation_year: "",
  });
  const [registrationFee] = useState(1000);
  const [accountNumber, setAccountNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    
    const generatedAccountNumber = `R-${formData.full_name.replace(/\s+/g, '').toUpperCase()}`;
    setAccountNumber(generatedAccountNumber);
    
    setStep(2);
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Registration failed");
      }

      setStep(3);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formFields = [
    {
      id: "full_name",
      label: "Full Name",
      type: "text",
      icon: User,
      required: true,
      placeholder: "Enter your full name"
    },
    {
      id: "email",
      label: "Email",
      type: "email",
      icon: Mail,
      required: true,
      placeholder: "Enter your email"
    },
    {
      id: "phone",
      label: "Phone Number",
      type: "tel",
      icon: Phone,
      required: false,
      placeholder: "Enter your phone number"
    },
    {
      id: "graduation_year",
      label: "Graduation Year",
      type: "number",
      icon: Calendar,
      required: true,
      placeholder: "e.g., 2024"
    },
    {
      id: "password",
      label: "Password",
      type: "password",
      icon: Lock,
      required: true,
      placeholder: "Minimum 6 characters"
    }
  ];

  const paymentSteps = [
    "Go to M-PESA on your phone",
    "Select Lipa na M-PESA",
    "Select Pay Bill",
    `Enter Business Number: 263532`,
    `Enter Account Number: ${accountNumber}`,
    `Enter Amount: Ksh ${registrationFee}`,
    "Enter your M-PESA PIN and confirm"
  ];

  if (step === 3) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-br from-[#F7F9FC] to-white"
      >
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            viewport={{ once: true }}
            className="w-full max-w-md text-center"
          >
            <div className="relative bg-white rounded-2xl p-8 md:p-12 shadow-2xl border border-gray-100 overflow-hidden">
              {/* Background Elements */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-green-100 to-green-50 rounded-full -translate-x-16 -translate-y-16" />
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full translate-x-20 translate-y-20" />
              
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg"
                >
                  <CheckCircle className="text-white" size={48} />
                </motion.div>
                
                <motion.h1
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="text-3xl font-bold font-poppins text-gray-900 mb-4"
                >
                  Welcome to CHRMAA!
                </motion.h1>
                
                <motion.p
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.1 }}
                  className="text-gray-600 font-inter mb-8 leading-relaxed"
                >
                  Your account has been created successfully! You can now log in and access your dashboard. Your payment will be verified by our team, and once confirmed, you'll have full access to all member benefits.
                </motion.p>
                
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.2 }}
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  <Link
                    href="/login"
                    className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300"
                  >
                    Go to Login
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </main>
        <Footer />
      </motion.div>
    );
  }

  if (step === 2) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-br from-gray-50 to-white"
      >
        <Header />
        <main className="flex-1 py-12 px-4">
          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative bg-white rounded-2xl p-8 md:p-12 shadow-2xl border border-gray-100 overflow-hidden">
              {/* Background Elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full translate-x-20 -translate-y-20" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-full -translate-x-16 translate-y-16" />
              
              <div className="relative z-10">
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="flex items-center justify-center gap-3 mb-6"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center">
                    <CreditCard className="text-white" size={24} />
                  </div>
                  <h1 className="text-3xl font-bold font-poppins text-gray-900">
                    Complete Your Payment
                  </h1>
                </motion.div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 font-inter"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.div
                  variants={scaleIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl mb-8 border border-blue-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold font-poppins text-blue-900">
                      Registration Fee
                    </h2>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-full font-bold text-lg"
                    >
                      Ksh {registrationFee.toLocaleString()}
                    </motion.div>
                  </div>
                  
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Shield className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <div className="text-sm text-blue-800 font-medium">Paybill Number</div>
                        <div className="text-xl font-bold text-gray-900">263532</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <User className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <div className="text-sm text-blue-800 font-medium">Account Number</div>
                        <div className="text-xl font-bold text-gray-900 font-mono">{accountNumber}</div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>

                <motion.div
                  variants={scaleIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl mb-8 border border-amber-100"
                >
                  <h3 className="text-xl font-bold font-poppins text-gray-900 mb-4">
                    📱 Payment Instructions
                  </h3>
                  
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="space-y-3"
                  >
                    {paymentSteps.map((stepText, index) => (
                      <motion.div
                        key={index}
                        variants={fadeUp}
                        whileHover={{ x: 5 }}
                        className="flex items-start gap-3"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                          <span className="text-amber-700 font-bold text-sm">{index + 1}</span>
                        </div>
                        <p className="text-gray-700 font-inter flex-1">
                          {stepText.includes("263532") || stepText.includes(accountNumber) || stepText.includes("Ksh") ? (
                            <>
                              {stepText.split(/(263532|Ksh \d+|R-\w+)/).map((part, i) => 
                                /(263532|Ksh \d+|R-\w+)/.test(part) ? (
                                  <span key={i} className="font-bold text-amber-700">{part}</span>
                                ) : (
                                  part
                                )
                              )}
                            </>
                          ) : (
                            stepText
                          )}
                        </p>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>

                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  <button
                    onClick={handleConfirmPayment}
                    disabled={loading}
                    className="group w-full px-4 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity as number, ease: "linear" as const }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <Shield size={20} />
                        I Have Completed Payment
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                      </>
                    )}
                  </button>
                </motion.div>

                <motion.p
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-sm text-gray-500 font-inter text-center mt-4"
                >
                  💡 Your account will be created immediately. Full member benefits activate after payment verification.
                </motion.p>
              </div>
            </div>
          </motion.div>
        </main>
        <Footer />
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50"
    >
      <Header />

      <main className="flex-1 py-12 px-4">
        <motion.div
          variants={scaleIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <div className="relative bg-white rounded-2xl p-8 md:p-12 shadow-2xl border border-gray-100 overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full -translate-x-20 -translate-y-20" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-full translate-x-24 translate-y-24" />
            
            <div className="relative z-10">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="text-center mb-8"
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#2B4C73] to-[#1E3A5F] rounded-full flex items-center justify-center">
                    <User className="text-white" size={24} />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold font-poppins text-gray-900">
                    Join CHRMAA
                  </h1>
                </div>
                <p className="text-gray-600 font-inter">
                  Register to become a member of the CHRM Alumni Association
                </p>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 font-inter"
                >
                  {error}
                </motion.div>
              )}

              <motion.form
                onSubmit={handleFormSubmit}
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                className="space-y-6"
              >
                {formFields.map((field, index) => (
                  <motion.div
                    key={field.id}
                    variants={scaleIn}
                    custom={index}
                    className="relative"
                  >
                    <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                      <field.icon size={16} className="text-gray-500" />
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <motion.input
                      whileHover={inputHover}
                      whileFocus={inputFocus}
                      type={field.type}
                      required={field.required}
                      min={field.type === "number" ? "2000" : undefined}
                      max={field.type === "number" ? "2030" : undefined}
                      value={formData[field.id as keyof FormData]}
                      onChange={(e) =>
                        setFormData({ ...formData, [field.id]: e.target.value })
                      }
                      className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl font-inter text-gray-900 bg-white focus:outline-none transition-all duration-200"
                      placeholder={field.placeholder}
                    />
                    <div className="absolute left-4 top-[42px] text-gray-400">
                      <field.icon size={20} />
                    </div>
                  </motion.div>
                ))}

                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  transition={{ delay: 0.5 }}
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  <button
                    type="submit"
                    disabled={loading}
                    className="group w-full px-4 py-4 bg-gradient-to-r from-[#2B4C73] to-[#2563eb] text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CreditCard size={20} />
                    Continue to Payment
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                  </button>
                </motion.div>
              </motion.form>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                transition={{ delay: 0.6 }}
                className="mt-8 text-center pt-6 border-t border-gray-100"
              >
                <p className="text-gray-600 font-inter">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-[#2B4C73] hover:text-[#1E3A5F] font-semibold hover:underline transition-colors inline-flex items-center gap-1"
                  >
                    Login here
                    <ArrowRight size={16} />
                  </Link>
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </motion.div>
  );
}