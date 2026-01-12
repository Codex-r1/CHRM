"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { CheckCircle, Users, User, CreditCard, Shield, ArrowRight, Lock, Mail, Phone, Calendar, BookOpen, Gift } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Variants, Transition } from "framer-motion";

// Define types
type FormData = {
  membership_number: string;
  full_name: string;
  email: string;
  phone: string;
  renewal_year: string;
  event_name: string;
  event_price: string;
  is_alumni_member: string;
  password: string;
  graduation_year: string;
  // Add these new fields
  course: string;
  county: string;
};

type PaybillInfo = {
  amount: number;
  account_number: string;
  payment_type: "renewal" | "event" | "registration";
  description: string;
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

export default function CombinedPaymentsPage() {
  const [paymentType, setPaymentType] = useState<"renewal" | "event" | "registration">("registration"); 
  const [formData, setFormData] = useState<FormData>({
    membership_number: "",
    full_name: "",
    email: "",
    phone: "",
    renewal_year: new Date().getFullYear().toString(),
    event_name: "",
    event_price: "",
    is_alumni_member: "",
    password: "",
    graduation_year: "",
    // Add these new fields
    course: "",
    county: "",
  });
  const [step, setStep] = useState(1);
  const [paybillInfo, setPaybillInfo] = useState<PaybillInfo>({
    amount: 0,
    account_number: "",
    payment_type: "registration",
    description: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (paymentType === "registration") {
      // Registration form validation
      if (!formData.full_name || !formData.email || !formData.password || !formData.graduation_year || !formData.course || !formData.county) {
        setError("Please fill in all required fields");
        return;
      }

      const registrationFee = 1500;
      const generatedAccountNumber = `R-${formData.full_name.replace(/\s+/g, '').toUpperCase()}`;      
      setPaybillInfo({
        amount: registrationFee,
        account_number: generatedAccountNumber,
        payment_type: "registration",
        description: `New Member Registration - ${formData.full_name}`,
      });
      setStep(2);
      return;
    }

    if (paymentType === "renewal") {
      if (!formData.membership_number || !formData.full_name || !formData.email || !formData.phone) {
        setError("Please fill in all required fields");
        return;
      }

      setPaybillInfo({
        amount: 1000,
        account_number: `RN-${formData.full_name.toUpperCase().replace(/\s+/g, '')}`,
        payment_type: "renewal",
        description: `Membership Renewal - ${formData.renewal_year}`,
      });
    } else if (paymentType === "event") {
      const eventPrice = parseFloat(formData.event_price);
      if (isNaN(eventPrice) || eventPrice <= 0) {
        setError("Please enter a valid event price");
        return;
      }

      if (!formData.is_alumni_member) {
        setError("Please select whether you are an alumni member");
        return;
      }

      if (formData.is_alumni_member === "yes" && !formData.membership_number) {
        setError("Please enter your membership number");
        return;
      }
      
      const discount = formData.is_alumni_member === "yes" ? 5 : 0;
      const finalPrice = eventPrice - (eventPrice * discount) / 100;
      
      setPaybillInfo({
        amount: finalPrice,
        account_number: `EVT-${formData.membership_number.toUpperCase().replace(/\s+/g, '')}`,
        payment_type: "event",
        description: `Event Payment - ${formData.event_name}`,
      });
    }

    setStep(2);
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    
    try {
      
      if (paybillInfo.payment_type === "registration") {
          // Simulate user registration API call
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      }
      
      setStep(3);
    } catch (err) {
      setError("Payment confirmation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calculateEventPrice = () => {
    const eventPrice = parseFloat(formData.event_price);
    if (isNaN(eventPrice) || eventPrice <= 0) return null;
    
    const isMember = formData.is_alumni_member === "yes";
    const discount = isMember ? 5 : 0;
    const finalPrice = isMember 
      ? eventPrice - (eventPrice * discount) / 100
      : eventPrice;
    
    return {
      originalPrice: eventPrice,
      discount,
      finalPrice,
      isMember
    };
  };

  const paymentSteps = [
    "Go to M-PESA on your phone",
    "Select Lipa na M-PESA",
    "Select Pay Bill",
    `Enter Business Number: 263532`,
    `Enter Account Number: ${paybillInfo.account_number}`,
    `Enter Amount: Ksh ${paybillInfo.amount.toLocaleString()}`,
    "Enter your M-PESA PIN and confirm"
  ];

  // Success messages based on payment type
  const successMessages = {
    registration: {
      title: "Welcome to CHRMAA!",
      message: "Your account has been created successfully! You can now log in and access your dashboard. Your payment will be verified by our team, and once confirmed, you'll have full access to all member benefits."
    },
    renewal: {
      title: "Payment Submitted!",
      message: "Your membership renewal payment will be verified by our team. You'll be notified once it's confirmed and your membership will be activated for the selected year."
    },
    event: {
      title: "Registration Complete!",
      message: "Your event registration payment will be verified by our team. You'll receive a confirmation email with event details once payment is confirmed."
    }
  };

  if (step === 3) {
    const successInfo = successMessages[paybillInfo.payment_type];
    
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-br from-gray-50 to-white"
      >
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="w-full max-w-md text-center"
          >
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
                
                <motion.h1
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="text-3xl font-bold font-poppins text-gray-900 mb-4"
                >
                  {successInfo.title}
                </motion.h1>
                
                <motion.p
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.1 }}
                  className="text-gray-600 mb-8 leading-relaxed"
                >
                  {successInfo.message}
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
                    href={paybillInfo.payment_type === "registration" ? "/login" : "/"}
                    className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300"
                  >
                    {paybillInfo.payment_type === "registration" ? "Go to Login" : "Back to Home"}
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
            <div className="relative bg-white rounded-2xl p-8 shadow-2xl border border-gray-100 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-full translate-x-20 -translate-y-20" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full -translate-x-16 translate-y-16" />
              
              <div className="relative z-10">
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="flex items-center justify-center gap-3 mb-6"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center">
                    <CreditCard className="text-white" size={24} />
                  </div>
                  <h1 className="text-3xl font-bold font-poppins text-gray-900">
                    Complete Your Payment
                  </h1>
                </motion.div>

                <motion.div
                  variants={scaleIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-2xl mb-8 border border-amber-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold font-poppins text-amber-900">
                        {paybillInfo.payment_type === "registration" 
                          ? "Registration Fee" 
                          : paybillInfo.payment_type === "renewal"
                          ? "Renewal Fee"
                          : "Event Fee"}
                      </h2>
                      <p className="text-amber-700 text-sm">{paybillInfo.description}</p>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="px-4 py-2 bg-amber-600 text-white rounded-full font-bold text-lg"
                    >
                      Ksh {paybillInfo.amount.toLocaleString()}
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
                      <motion.div
                        whileHover={{ rotate: 5 }}
                        className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center"
                      >
                        <Shield className="text-amber-600" size={20} />
                      </motion.div>
                      <div>
                        <div className="text-sm text-amber-800 font-medium">Paybill Number</div>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 }}
                          className="text-xl font-bold text-gray-900"
                        >
                          263532
                        </motion.div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <motion.div
                        whileHover={{ rotate: -5 }}
                        className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center"
                      >
                        <User className="text-amber-600" size={20} />
                      </motion.div>
                      <div>
                        <div className="text-sm text-amber-800 font-medium">Account Number</div>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 }}
                          className="text-xl font-bold text-gray-900 font-mono"
                        >
                          {paybillInfo.account_number}
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>

                <motion.div
                  variants={scaleIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl mb-8 border border-blue-100"
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
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"
                        >
                          <span className="text-blue-700 font-bold text-sm">{index + 1}</span>
                        </motion.div>
                        <p className="text-gray-700 flex-1">
                          {stepText.includes("263532") || stepText.includes(paybillInfo.account_number) || stepText.includes("Ksh") ? (
                            <>
                              {stepText.split(/(263532|Ksh \d+|RN-\w+|EVT-\w+|R-\w+)/).map((part, i) => 
                                /(263532|Ksh \d+|RN-\w+|EVT-\w+|R-\w+)/.test(part) ? (
                                  <span key={i} className="font-bold text-blue-700">{part}</span>
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

                <motion.button
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                  onClick={handleConfirmPayment}
                  disabled={loading}
                  className="group w-full px-4 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} />
                      I Have Completed Payment
                      <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                    </>
                  )}
                </motion.button>

                <motion.p
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-sm text-gray-500 text-center mt-4"
                >
                  {paybillInfo.payment_type === "registration" 
                    ? "💡 Your account will be created immediately. Full member benefits activate after payment verification."
                    : "💡 Your payment will be verified within 24 hours. You'll receive a confirmation email."}
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
          className="max-w-3xl mx-auto"
        >
          <div className="relative bg-white rounded-2xl p-8 shadow-2xl border border-gray-100 overflow-hidden">
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
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center">
                    <CreditCard className="text-white" size={24} />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold font-poppins text-gray-900">
                    Make a Payment
                  </h1>
                </div>
                <p className="text-gray-600">
                  Register as a new member, renew membership, or pay for events
                </p>
              </motion.div>

              {/* Payment Type Selection - Updated order: Registration first */}
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
              >
                {[
                  { id: "registration", label: "New Member", icon: BookOpen, color: "from-green-500 to-emerald-600", desc: "Join CHRMAA community" },
                  { id: "renewal", label: "Membership Renewal", icon: Users, color: "from-amber-500 to-yellow-500", desc: "Renew your annual membership" },
                  { id: "event", label: "Event Payment", icon: User, color: "from-blue-500 to-indigo-500", desc: "Register for upcoming events" },
                ].map((type, index) => (
                  <motion.button
                    key={type.id}
                    variants={scaleIn}
                    custom={index}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPaymentType(type.id as any)}
                    className={`px-6 py-4 rounded-xl font-bold transition-all duration-300 flex flex-col items-center gap-2 relative overflow-hidden ${
                      paymentType === type.id
                        ? `bg-gradient-to-r ${type.color} text-white shadow-lg`
                        : "bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-md"
                    }`}
                  >
                    <type.icon size={24} />
                    <span className="font-poppins">{type.label}</span>
                    <span className={`text-xs mt-1 ${
                      paymentType === type.id ? "text-white/80" : "text-gray-500"
                    }`}>
                      {type.desc}
                    </span>
                  </motion.button>
                ))}
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

              {/* Main form container with increased min-height */}
              <motion.div
                variants={scaleIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="min-h-[500px]"
              >
                <motion.form
                  onSubmit={handleSubmit}
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  className="space-y-6"
                >
                  {paymentType === "registration" ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div variants={scaleIn}>
                          <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                            <User size={16} className="text-gray-500" />
                            Full Name *
                          </label>
                          <motion.input
                            whileHover={inputHover}
                            whileFocus={inputFocus}
                            type="text"
                            required
                            value={formData.full_name}
                            onChange={(e) =>
                              setFormData({ ...formData, full_name: e.target.value })
                            }
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none transition-all duration-200"
                            placeholder="Enter your full name"
                          />
                        </motion.div>

                        <motion.div variants={scaleIn}>
                          <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                            <Mail size={16} className="text-gray-500" />
                            Email Address *
                          </label>
                          <motion.input
                            whileHover={inputHover}
                            whileFocus={inputFocus}
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none transition-all duration-200"
                            placeholder="Enter your email"
                          />
                        </motion.div>

                        <motion.div variants={scaleIn}>
                          <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                            <Phone size={16} className="text-gray-500" />
                            Phone Number
                          </label>
                          <motion.input
                            whileHover={inputHover}
                            whileFocus={inputFocus}
                            type="tel"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({ ...formData, phone: e.target.value })
                            }
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none transition-all duration-200"
                            placeholder="0712345678"
                          />
                        </motion.div>

                        <motion.div variants={scaleIn}>
                          <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                            <Calendar size={16} className="text-gray-500" />
                            Graduation Year *
                          </label>
                          <motion.input
                            whileHover={inputHover}
                            whileFocus={inputFocus}
                            type="number"
                            min="2000"
                            max="2030"
                            required
                            value={formData.graduation_year}
                            onChange={(e) =>
                              setFormData({ ...formData, graduation_year: e.target.value })
                            }
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none transition-all duration-200"
                            placeholder="e.g., 2024"
                          />
                        </motion.div>

                        {/* Add Course Selection Field */}
                        <motion.div variants={scaleIn}>
                          <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                            <BookOpen size={16} className="text-gray-500" />
                            Course Studied *
                          </label>
                          <motion.select
                            whileHover={inputHover}
                            whileFocus={inputFocus}
                            required
                            value={formData.course}
                            onChange={(e) =>
                              setFormData({ ...formData, course: e.target.value })
                            }
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none transition-all duration-200"
                          >
                            <option value="">Select your course</option>
                            {CHRM_COURSES.map((course) => (
                              <option key={course} value={course}>
                                {course}
                              </option>
                            ))}
                          </motion.select>
                        </motion.div>

                        {/* Add County Selection Field */}
                        <motion.div variants={scaleIn}>
                          <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                            <Users size={16} className="text-gray-500" />
                            County of Residence *
                          </label>
                          <motion.select
                            whileHover={inputHover}
                            whileFocus={inputFocus}
                            required
                            value={formData.county}
                            onChange={(e) =>
                              setFormData({ ...formData, county: e.target.value })
                            }
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none transition-all duration-200"
                          >
                            <option value="">Select your county</option>
                            {COUNTIES_IN_KENYA.map((county) => (
                              <option key={county} value={county}>
                                {county}
                              </option>
                            ))}
                          </motion.select>
                        </motion.div>
                      </div>

                      <motion.div variants={scaleIn}>
                        <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                          <Lock size={16} className="text-gray-500" />
                          Password *
                        </label>
                        <motion.input
                          whileHover={inputHover}
                          whileFocus={inputFocus}
                          type="password"
                          required
                          minLength={6}
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                          }
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none transition-all duration-200"
                          placeholder="Minimum 6 characters"
                        />
                      </motion.div>

                      <motion.div
                        variants={scaleIn}
                        className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100 mt-6"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <Gift className="text-green-600" size={24} />
                          <p className="text-green-700 font-semibold text-lg">Registration Benefits:</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          <div className="flex items-start gap-2">
                            <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">Lifetime membership access</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">Networking opportunities</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">Exclusive events & workshops</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">Member resources & discounts</span>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-green-200">
                          <p className="text-lg font-bold text-green-700">
                            Registration Fee: Ksh 1,500
                          </p>
                        </div>
                      </motion.div>

                      <motion.p
                        variants={fadeUp}
                        className="text-sm text-gray-500 text-center pt-4"
                      >
                        Already have an account?{" "}
                        <Link
                          href="/login"
                          className="text-amber-600 hover:text-amber-700 font-semibold hover:underline transition-colors"
                        >
                          Login here
                        </Link>
                      </motion.p>
                    </>
                  ) : paymentType === "renewal" ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div variants={scaleIn}>
                          <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2">
                            Membership Number
                          </label>
                          <motion.input
                            whileHover={inputHover}
                            whileFocus={inputFocus}
                            type="text"
                            required
                            value={formData.membership_number}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                membership_number: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all duration-200"
                            placeholder="M-123456"
                          />
                        </motion.div>

                        <motion.div variants={scaleIn}>
                          <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2">
                            Full Name
                          </label>
                          <motion.input
                            whileHover={inputHover}
                            whileFocus={inputFocus}
                            type="text"
                            required
                            value={formData.full_name}
                            onChange={(e) =>
                              setFormData({ ...formData, full_name: e.target.value })
                            }
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all duration-200"
                            placeholder="John Doe"
                          />
                        </motion.div>

                        <motion.div variants={scaleIn}>
                          <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2">
                            Email
                          </label>
                          <motion.input
                            whileHover={inputHover}
                            whileFocus={inputFocus}
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all duration-200"
                            placeholder="john.doe@example.com"
                          />
                        </motion.div>

                        <motion.div variants={scaleIn}>
                          <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2">
                            Phone
                          </label>
                          <motion.input
                            whileHover={inputHover}
                            whileFocus={inputFocus}
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData({ ...formData, phone: e.target.value })
                            }
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all duration-200"
                            placeholder="0712345678"
                          />
                        </motion.div>

                        <motion.div variants={scaleIn} className="md:col-span-2">
                          <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2">
                            Renewal Year
                          </label>
                          <motion.select
                            whileHover={inputHover}
                            whileFocus={inputFocus}
                            required
                            value={formData.renewal_year}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                renewal_year: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all duration-200"
                          >
                            {Array.from(
                              { length: 7 },
                              (_, i) => new Date().getFullYear() + i,
                            ).map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </motion.select>
                        </motion.div>
                      </div>

                      <motion.div
                        variants={scaleIn}
                        className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-2xl border border-amber-100 mt-6"
                      >
                        <p className="text-lg font-bold text-amber-700">
                          Annual Membership Fee: Ksh 1,000
                        </p>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div variants={scaleIn} className="md:col-span-2">
                          <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2">
                            Event Name
                          </label>
                          <motion.input
                            whileHover={inputHover}
                            whileFocus={inputFocus}
                            type="text"
                            required
                            value={formData.event_name}
                            onChange={(e) =>
                              setFormData({ ...formData, event_name: e.target.value })
                            }
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all duration-200"
                            placeholder="Annual HR Conference 2024"
                          />
                        </motion.div>

                        <motion.div variants={scaleIn}>
                          <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2">
                            Event Price (Ksh)
                          </label>
                          <motion.input
                            whileHover={inputHover}
                            whileFocus={inputFocus}
                            type="number"
                            required
                            min="1"
                            step="0.01"
                            value={formData.event_price}
                            onChange={(e) =>
                              setFormData({ ...formData, event_price: e.target.value })
                            }
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all duration-200"
                            placeholder="5000"
                          />
                        </motion.div>

                        <motion.div variants={scaleIn}>
                          <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2">
                            Are you a CHRM Alumni Association member?
                          </label>
                          <div className="space-y-3">
                            <motion.label
                              whileHover={{ scale: 1.01 }}
                              className="flex items-center p-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-amber-300 transition-all duration-200"
                            >
                              <input
                                type="radio"
                                name="is_alumni_member"
                                value="yes"
                                checked={formData.is_alumni_member === "yes"}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    is_alumni_member: e.target.value,
                                  })
                                }
                                className="mr-3 text-amber-500 focus:ring-amber-200"
                              />
                              <div className="flex items-center">
                                <Users size={18} className="mr-2 text-amber-500" />
                                <span className="font-semibold text-gray-700">
                                  Yes, I am a member
                                </span>
                              </div>
                            </motion.label>

                            <motion.label
                              whileHover={{ scale: 1.01 }}
                              className="flex items-center p-3 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-amber-300 transition-all duration-200"
                            >
                              <input
                                type="radio"
                                name="is_alumni_member"
                                value="no"
                                checked={formData.is_alumni_member === "no"}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    is_alumni_member: e.target.value,
                                  })
                                }
                                className="mr-3 text-amber-500 focus:ring-amber-200"
                              />
                              <div className="flex items-center">
                                <User size={18} className="mr-2 text-gray-400" />
                                <span className="font-semibold text-gray-700">
                                  No, I am not a member
                                </span>
                              </div>
                            </motion.label>
                          </div>
                        </motion.div>

                        {formData.is_alumni_member === "yes" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.3 }}
                            className="md:col-span-2"
                          >
                            <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2">
                              Membership Number
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.membership_number}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  membership_number: e.target.value,
                                })
                              }
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all duration-200"
                              placeholder="Enter your membership number"
                            />
                          </motion.div>
                        )}
                      </div>

                      {formData.event_price && calculateEventPrice() && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100 mt-6"
                        >
                          {(() => {
                            const priceInfo = calculateEventPrice();
                            if (priceInfo) {
                              return (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <p className="text-gray-700">
                                      <strong className="text-green-700">
                                        Original Price:
                                      </strong>
                                    </p>
                                    <p className="text-lg font-semibold">Ksh {priceInfo.originalPrice.toLocaleString()}</p>
                                  </div>
                                  {priceInfo.isMember && (
                                    <div className="flex items-center justify-between">
                                      <p className="text-gray-700">
                                        <strong className="text-green-700">
                                          Member Discount:
                                        </strong>
                                      </p>
                                      <p className="text-lg font-semibold text-green-600">{priceInfo.discount}%</p>
                                    </div>
                                  )}
                                  <div className="pt-3 border-t border-green-200">
                                    <div className="flex items-center justify-between">
                                      <p className="text-xl font-bold text-green-700">
                                        Final Amount:
                                      </p>
                                      <p className="text-2xl font-bold text-green-700">
                                        Ksh {priceInfo.finalPrice.toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </motion.div>
                      )}
                    </>
                  )}

                  <motion.button
                    variants={fadeUp}
                    type="submit"
                    disabled={loading}
                    whileHover={buttonHover}
                    whileTap={buttonTap}
                    className="group w-full px-4 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 mt-8"
                  >
                    <CreditCard size={20} />
                    {paymentType === "registration" ? "Register & Pay" : "Continue to Payment"}
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                  </motion.button>
                </motion.form>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </motion.div>
  );
}

export const CHRM_COURSES = [
  // Diploma / Higher Diploma Programmes
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

  // Certificate Courses
  "Certificate in Human Resource Management (KNEC)",
  "Certificate in Business Management (KNEC)",
  "Certificate in Banking and Finance (KNEC)",
  "Certificate in Supply Chain Management (KNEC)",
  "Certificate in Information Communication Technology (ICT) – KNEC",
  "Certificate in Security Management – TVET CDACC Level 5",
  "Certificate in Cyber Security – TVET CDACC Level 5",
  "Certificate in Forensic Investigation – TVET CDACC Level 5",
  "Certificate in Accounting and Management Skills (CAMS – KASNEB)",

  // Artisan & Vocational Courses
  "Artisan in Store-Keeping (KNEC)",
  "Artisan in Salesmanship (KNEC)",

  // Professional & Short-Courses / Specialized Trainings
  "ICT & Computer Application Packages",
  "Digital Marketing & Social Media Courses",
  "Graphic Design & CAD Courses",
  "Leadership & Management Training",
  "HR Consultancy Training",
  "CHRP",
  "HRCi",
  "Other Professional Short Courses",
];

export const COUNTIES_IN_KENYA = [
  "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita Taveta", "Garissa", 
  "Wajir", "Mandera", "Marsabit", "Isiolo", "Meru", "Tharaka Nithi", "Embu", 
  "Kitui", "Machakos", "Makueni", "Nyandarua", "Nyeri", "Kirinyaga", "Murang'a", 
  "Kiambu", "Turkana", "West Pokot", "Samburu", "Trans Nzoia", "Uasin Gishu", 
  "Elgeyo Marakwet", "Nandi", "Baringo", "Laikipia", "Nakuru", "Narok", "Kajiado", 
  "Kericho", "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia", "Siaya", 
  "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi"
];