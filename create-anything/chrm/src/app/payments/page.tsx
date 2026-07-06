"use client";

import { useState, FormEvent, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  CheckCircle, Users, User, CreditCard, Shield, ArrowRight, Lock, Mail, Phone,
  Calendar, BookOpen, Gift, Smartphone, Loader2, AlertCircle, Key, Eye, EyeOff,
  X, Info, MapPin, GraduationCap, Star, Sparkles, BadgeCheck
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
type FormData = {
  membership_number: string;
  full_name: string;
  email: string;
  phone: string;
  renewal_year: string;
  is_alumni_member: string;
  password: string;
  graduation_year: string;
  course: string;
  country: string;
};

type PaybillInfo = {
  amount: number;
  account_number: string;
  payment_type: "renewal" | "registration";
  description: string;
};

type STKPushStatus = 'idle' | 'initiating' | 'pending' | 'success' | 'failed' | 'cancelled';
type PaymentResponse = {
  success: boolean;
  message: string;
  checkoutRequestID?: string;
  merchantRequestID?: string;
  paymentId?: string;
  data?: any;
};

type AlertType = 'error' | 'success' | 'info' | 'warning';
type AlertModal = {
  show: boolean;
  type: AlertType;
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
  onCancel?: () => void;
  cancelText?: string;
};

// ─── Fee Logic ────────────────────────────────────────────────────────────────
const getRegistrationFee = (graduationYear: string): number | null => {
  const year = parseInt(graduationYear, 10);
  if (!graduationYear || isNaN(year)) return null;
  return year >= 2021 ? 1 : 1500;
};

const FEE_RENEWAL = 1;

// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};
const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};
const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const buttonHover = {
  scale: 1.02,
  y: -2,
  boxShadow: "0 12px 28px rgba(0, 0, 0, 0.15)",
  transition: { type: "spring" as const, stiffness: 400, damping: 15 },
};
const buttonTap = { scale: 0.97 };
const cardHover = {
  scale: 1.02,
  y: -8,
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.08)",
  borderColor: "#171717",
  transition: { type: "spring" as const, stiffness: 300, damping: 20 },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CombinedPaymentsPage() {
  const [paymentType, setPaymentType] = useState<"renewal" | "registration">("registration");
  const [formData, setFormData] = useState<FormData>({
    membership_number: "",
    full_name: "",
    email: "",
    phone: "",
    renewal_year: new Date().getFullYear().toString(),
    is_alumni_member: "",
    password: "",
    graduation_year: "",
    course: "",
    country: "",
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
  const [stkStatus, setStkStatus] = useState<STKPushStatus>('idle');
  const [checkoutRequestID, setCheckoutRequestID] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string>('');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [alertModal, setAlertModal] = useState<AlertModal>({
    show: false, type: 'error', title: '', message: '',
    confirmText: 'OK', cancelText: 'Cancel'
  });

  const router = useRouter();
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const registrationFee = useMemo(() => getRegistrationFee(formData.graduation_year), [formData.graduation_year]);
  const feeLabel = registrationFee !== null ? `Ksh ${registrationFee.toLocaleString()}` : '—';

  useEffect(() => {
    return () => { if (pollingInterval) clearInterval(pollingInterval); };
  }, [pollingInterval]);

  useEffect(() => {
    return () => { if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current); };
  }, []);

  // ─── Alert helpers ─────────────────────────────────────────────────────────
  const showAlert = (
    type: AlertType, title: string, message: string,
    options?: { onConfirm?: () => void; confirmText?: string; onCancel?: () => void; cancelText?: string; autoClose?: number; }
  ) => {
    if (alertTimeoutRef.current) { clearTimeout(alertTimeoutRef.current); alertTimeoutRef.current = null; }
    setAlertModal({ show: true, type, title, message, onConfirm: options?.onConfirm, confirmText: options?.confirmText || 'OK', onCancel: options?.onCancel, cancelText: options?.cancelText || 'Cancel' });
    if (options?.autoClose) {
      alertTimeoutRef.current = setTimeout(() => hideAlert(), options.autoClose);
    }
  };

  const hideAlert = () => {
    if (alertTimeoutRef.current) { clearTimeout(alertTimeoutRef.current); alertTimeoutRef.current = null; }
    setAlertModal(prev => ({ ...prev, show: false }));
  };

  // ─── Validation ────────────────────────────────────────────────────────────
  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^(07\d{8}|7\d{8}|\+2547\d{8}|2547\d{8})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (paymentType === "registration") {
        if (!formData.full_name || !formData.email || !formData.password ||
          !formData.graduation_year || !formData.country) {
          showAlert('error', 'Missing Information', 'Please fill in all required fields');
          setLoading(false);
          return;
        }
        if (!formData.phone || !validatePhoneNumber(formData.phone)) {
          showAlert('error', 'Invalid Phone Number', 'Please enter a valid Kenyan phone number (e.g., 0712345678)');
          setLoading(false);
          return;
        }

        const fee = getRegistrationFee(formData.graduation_year);
        if (!fee) {
          showAlert('error', 'Invalid Graduation Year', 'Please enter a valid graduation year');
          setLoading(false);
          return;
        }

        setPaybillInfo({
          amount: fee,
          account_number: "PENDING",
          payment_type: "registration",
          description: `New Member Registration - ${formData.full_name}`,
        });

        await handleRegistrationAndPayment(fee);
        return;
      }

      if (paymentType === "renewal") {
        if (!formData.membership_number || !formData.full_name || !formData.email || !formData.phone) {
          showAlert('error', 'Missing Information', 'Please fill in all required fields');
          setLoading(false);
          return;
        }
        if (!validatePhoneNumber(formData.phone)) {
          showAlert('error', 'Invalid Phone Number', 'Please enter a valid Kenyan phone number (e.g., 0712345678)');
          setLoading(false);
          return;
        }
        if (!/^100\d{3}$/.test(formData.membership_number)) {
          showAlert('error', 'Invalid Membership Number', 'Membership number must be in format 100XXX (e.g., 100121)');
          setLoading(false);
          return;
        }

        try {
          const lookupRes = await fetch(`/api/users/lookup?membership_number=${formData.membership_number}`);
          if (!lookupRes.ok) {
            showAlert('error', 'Member Not Found', 'Membership number not found. Please check and try again.');
            setLoading(false);
            return;
          }
          const lookupData = await lookupRes.json();
          const userId = lookupData.user.id;
          if (lookupData.user.email.toLowerCase() !== formData.email.toLowerCase()) {
            showAlert('error', 'Email Mismatch', 'Email address does not match our records for this membership number');
            setLoading(false);
            return;
          }

          setPaybillInfo({
            amount: FEE_RENEWAL,
            account_number: formData.membership_number,
            payment_type: "renewal",
            description: `Membership Renewal - ${formData.renewal_year}`,
          });

          await initiateSTKPush(FEE_RENEWAL, 'renewal', userId, {
            membership_number: formData.membership_number,
            renewal_year: formData.renewal_year,
            full_name: formData.full_name,
            email: formData.email
          });
        } catch {
          showAlert('error', 'Verification Failed', 'Failed to verify membership. Please try again.');
          setLoading(false);
        }
      }
    } catch (err) {
      showAlert('error', 'Payment Error', err instanceof Error ? err.message : "Payment initiation failed");
      setLoading(false);
    }
  };

const handleRegistrationAndPayment = async (fee: number) => {
  try {
    setLoading(true);
    
    // First, check if user already exists
    const checkResponse = await fetch(
      `/api/users/check?email=${encodeURIComponent(formData.email)}`
    );
    const checkData = await checkResponse.json();
    
    if (checkData.exists) {
      showAlert('error', 'User Already Exists', 
        'This email is already registered. Please login instead.',
        { 
          confirmText: 'Go to Login',
          onConfirm: () => router.push('/login')
        }
      );
      setLoading(false);
      return;
    }
    
    const registrationData = {
      email: formData.email,
      full_name: formData.full_name,
      phone: formData.phone,
      graduation_year: formData.graduation_year,
      course: formData.course,
      country: formData.country,
      password: formData.password,
      registration_fee: fee,
    };
    
    console.log(' Sending registration data:', registrationData);

    const registrationResponse = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData)
    });

    const registrationResult = await registrationResponse.json();
    
    if (!registrationResponse.ok) {
      console.error(' Registration error details:', registrationResult);
      
      // Handle specific error codes
      if (registrationResult.code === 'USER_EXISTS') {
        showAlert('error', 'User Already Exists', 
          'This email is already registered. Please login instead.',
          { 
            confirmText: 'Go to Login',
            onConfirm: () => router.push('/login')
          }
        );
        setLoading(false);
        return;
      }
      
      if (registrationResult.code === 'PENDING_PAYMENT') {
        showAlert('warning', 'Payment Pending', 
          'You have a pending payment. Please complete it to activate your account.',
          { 
            confirmText: 'Continue Payment',
            onConfirm: () => {
              // Resume the payment flow
              setPaymentId(registrationResult.payment_id);
              // Re-initiate STK push or continue polling
            }
          }
        );
        setLoading(false);
        return;
      }
      
      throw new Error(registrationResult.error || registrationResult.message || 'Registration failed');
    }

    // Now initiate STK push with the payment_id
    const payment_id = registrationResult.payment_id;

    await initiateSTKPush(fee, 'registration', undefined, {
      graduation_year: formData.graduation_year,
      course: formData.course,
      country: formData.country,
    }, payment_id);

  } catch (err) {
    console.error(' Registration error:', err);
    showAlert('error', 'Registration Failed', err instanceof Error ? err.message : "Registration failed");
    setLoading(false);
    throw err;
  }
};

  // ─── STK Push ──────────────────────────────────────────────────────────────
  const initiateSTKPush = async (
    amount: number,
    type: 'registration' | 'renewal',
    userId?: string,
    metadata?: any,
    payment_id?: string
  ) => {
    try {
      setStkStatus('initiating');
      const response = await fetch('/api/payments/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: formData.phone,
          amount,
          paymentType: type,
          userId,
          userEmail: formData.email,
          userName: formData.full_name,
          metadata: metadata || {
            graduation_year: formData.graduation_year,
            course: formData.course,
            country: formData.country,
            membership_number: formData.membership_number,
            renewal_year: formData.renewal_year
          },
          payment_id,
        })
      });

      const data: PaymentResponse = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to initiate payment');

      if (data.success && data.checkoutRequestID) {
        showAlert('success', 'Payment Request Sent',
          'Please check your phone for the M-PESA prompt and enter your PIN to complete the payment.',
          { autoClose: 5000 }
        );
        setCheckoutRequestID(data.checkoutRequestID);
        setPaymentId(data.paymentId || '');
        setStkStatus('pending');
        setStep(2);
        startPaymentPolling(data.checkoutRequestID);
      } else {
        throw new Error(data.message || 'Payment initiation failed');
      }
    } catch (err) {
      setStkStatus('failed');
      showAlert('error', 'Payment Failed', err instanceof Error ? err.message : 'Failed to initiate payment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ─── Polling ───────────────────────────────────────────────────────────────
  const startPaymentPolling = async (checkoutID: string) => {
    let pollCount = 0;
    const maxPolls = 60;
    const interval = setInterval(async () => {
      try {
        pollCount++;
        if (pollCount > maxPolls) {
          clearInterval(interval); setPollingInterval(null); setStkStatus('failed');
          showAlert('error', 'Timeout', 'Payment verification timed out. Please check your M-PESA messages and contact support if payment was deducted.', { autoClose: 5000 });
          return;
        }
        const response = await fetch(`/api/payments/${checkoutID}?verify_user=true`);
        const data = await response.json();

        if (data.status === 'confirmed' && data.user_created === true && data.user_id) {
          setStkStatus('success'); clearInterval(interval); setPollingInterval(null);
          if (data.membership_number) setFormData(prev => ({ ...prev, membership_number: data.membership_number }));

          if (paymentType === 'registration') {
            if (data.membership_number) setFormData(prev => ({ ...prev, membership_number: data.membership_number }));
            showAlert('success', 'Welcome to Alumni Association!',
              `Your account has been created! ${data.membership_number ? `Membership Number: ${data.membership_number}.` : ''} Redirecting to login...`,
              { autoClose: 3000 }
            );
            setTimeout(() => router.push('/login'), 3000);
          } else {
            showAlert('success', 'Renewal Successful!',
              'Your membership has been renewed! Redirecting to dashboard...',
              { autoClose: 3000 }
            );
            setTimeout(() => router.push('/member/dashboard'), 3000);
          }
        } else if (data.status === 'confirmed' && data.user_created === false) {
          clearInterval(interval); setPollingInterval(null); setStkStatus('failed');
          showAlert('error', 'Account Creation Failed', 'Payment was received but account creation failed. Please contact the admin with your M-PESA receipt.', { autoClose: 6000 });
        } else if (data.status === 'failed') {
          clearInterval(interval); setPollingInterval(null); setStkStatus('failed');
          showAlert('error', 'Payment Failed', 'The payment was not completed. Please try again.');
        } else if (data.status === 'cancelled') {
          clearInterval(interval); setPollingInterval(null); setStkStatus('cancelled');
          showAlert('warning', 'Payment Cancelled', 'The payment was cancelled.');
        }
      } catch (err) { console.error('Polling error:', err); }
    }, 3000);
    setPollingInterval(interval);
  };

  const cancelPayment = () => {
    if (pollingInterval) { clearInterval(pollingInterval); setPollingInterval(null); }
    setStkStatus('cancelled'); setStep(1);
    showAlert('info', 'Payment Cancelled', 'You can restart the payment process when ready.', { autoClose: 3000 });
  };

  const stkStatusMessages: Record<STKPushStatus, string> = {
    idle: "Ready to initiate payment",
    initiating: "Initiating payment request...",
    pending: "Awaiting payment on your phone. Check for STK Push prompt.",
    success: "Payment confirmed successfully!",
    failed: "Payment failed. Please try again.",
    cancelled: "Payment cancelled."
  };

  // ─── Alert Modal ───────────────────────────────────────────────────────────
  const AlertModalComponent = () => {
    const styles = {
      error: { bg: 'bg-white', border: 'border-[#E53E3E]', iconBg: 'bg-[#FFF0F0]', icon: <AlertCircle className="text-[#E53E3E]" size={28} />, btnBg: 'bg-[#E53E3E] hover:bg-[#C53030]', titleColor: 'text-[#E53E3E]' },
      success: { bg: 'bg-white', border: 'border-[#171717]', iconBg: 'bg-[#F5F5F5]', icon: <CheckCircle className="text-[#171717]" size={28} />, btnBg: 'bg-[#171717] hover:bg-[#333333]', titleColor: 'text-[#171717]' },
      warning: { bg: 'bg-white', border: 'border-[#FF7A00]', iconBg: 'bg-[#FFF4E6]', icon: <AlertCircle className="text-[#FF7A00]" size={28} />, btnBg: 'bg-[#FF7A00] hover:bg-[#E56B00]', titleColor: 'text-[#FF7A00]' },
      info: { bg: 'bg-white', border: 'border-[#171717]', iconBg: 'bg-[#F5F5F5]', icon: <Info className="text-[#171717]" size={28} />, btnBg: 'bg-[#171717] hover:bg-[#333333]', titleColor: 'text-[#171717]' },
    }[alertModal.type];

    return (
      <AnimatePresence>
        {alertModal.show && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={hideAlert} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 16 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={`${styles.bg} border-2 ${styles.border} rounded-2xl shadow-2xl max-w-md w-full overflow-hidden`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-5">
                    <div className={`${styles.iconBg} p-3 rounded-xl flex-shrink-0`}>{styles.icon}</div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold mb-1 ${styles.titleColor}`}>{alertModal.title}</h3>
                      <p className="text-[#6D7A8B] text-sm leading-relaxed">{alertModal.message}</p>
                    </div>
                    <button onClick={hideAlert} className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0"><X size={20} /></button>
                  </div>
                  <div className="flex gap-3">
                    {alertModal.onCancel && (
                      <button onClick={alertModal.onCancel} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition text-sm">{alertModal.cancelText}</button>
                    )}
                    <button onClick={() => { alertModal.onConfirm?.(); hideAlert(); }}
                      className={`flex-1 px-4 py-2.5 ${styles.btnBg} text-white font-semibold rounded-xl transition text-sm`}>
                      {alertModal.confirmText}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    );
  };

  // ─── Step 2: Waiting for payment ──────────────────────────────────────────
  if (step === 2) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#F7F9FC]">
        <AlertModalComponent />
        <Header />
        <main className="flex-1 py-12 px-4">
          <div className="max-w-lg mx-auto">
            <motion.div variants={scaleIn} initial="hidden" animate="visible"
              className="bg-white rounded-2xl shadow-lg border border-[#E7ECF3] overflow-hidden">

              <div className="bg-[#171717] p-6 text-white text-center">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Smartphone className="text-white" size={28} />
                </div>
                <h1 className="text-xl font-bold">Check Your Phone</h1>
                <p className="text-white/80 text-sm mt-1">An M-PESA prompt has been sent to</p>
                <p className="text-[#FF7A00] font-bold text-lg mt-0.5">{formData.phone}</p>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between p-4 bg-[#F7F9FC] rounded-xl border border-[#E7ECF3]">
                  <div>
                    <p className="text-xs text-[#6D7A8B] font-medium">Amount Due</p>
                    <p className="text-sm text-[#0B0F1A] font-medium">{paybillInfo.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#171717]">Ksh {paybillInfo.amount.toLocaleString()}</p>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${
                  stkStatus === 'success' ? 'bg-[#F5F5F5] border-[#171717]/20' :
                  stkStatus === 'failed' || stkStatus === 'cancelled' ? 'bg-[#FFF0F0] border-[#E53E3E]/20' :
                  'bg-[#FFF4E6] border-[#FF7A00]/20'}`}>
                  <div className="flex items-center gap-3">
                    {stkStatus === 'pending' && (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-7 h-7 border-2 border-[#FF7A00] border-t-transparent rounded-full flex-shrink-0" />
                    )}
                    {stkStatus === 'success' && <CheckCircle className="text-[#171717] flex-shrink-0" size={28} />}
                    {(stkStatus === 'failed' || stkStatus === 'cancelled') && <AlertCircle className="text-[#E53E3E] flex-shrink-0" size={28} />}
                    <div>
                      <p className="font-semibold text-sm text-[#0B0F1A]">
                        {stkStatus === 'pending' && 'Awaiting your M-PESA PIN...'}
                        {stkStatus === 'success' && 'Payment Confirmed!'}
                        {stkStatus === 'failed' && 'Payment Failed'}
                        {stkStatus === 'cancelled' && 'Payment Cancelled'}
                      </p>
                      <p className="text-xs text-[#6D7A8B] mt-0.5">{stkStatusMessages[stkStatus]}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {["Check your phone for a prompt", "Enter your M-PESA PIN", "Wait for payment confirmation"].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-[#F5F5F5] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-[#171717]">{i + 1}</span>
                      </div>
                      <p className="text-sm text-[#6D7A8B]">{s}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={cancelPayment}
                    className="flex-1 px-4 py-3 bg-[#F7F9FC] text-[#6D7A8B] font-semibold rounded-xl hover:bg-[#E7ECF3] border border-[#E7ECF3] transition text-sm">
                    Cancel
                  </button>
                  {stkStatus === 'failed' && (
                    <button onClick={() => setStep(1)}
                      className="flex-1 px-4 py-3 bg-[#171717] text-white font-semibold rounded-xl hover:bg-[#333333] transition text-sm">
                      Try Again
                    </button>
                  )}
                </div>

                {stkStatus === 'pending' && (
                  <p className="text-xs text-[#6D7A8B] text-center">Payment status updates automatically. Please wait...</p>
                )}
              </div>
            </motion.div>
          </div>
        </main>
        <Footer />
      </motion.div>
    );
  }

  // ─── Step 1: Main Form ─────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#F7F9FC]">
      <AlertModalComponent />
      <Header />

      <main className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Page title */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-[#0B0F1A] mb-2">
              {paymentType === "registration" ? "Join Alumni Association" : "Renew Membership"}
            </h1>
            <p className="text-[#6D7A8B]">
              {paymentType === "registration"
                ? "Become part of the alumni community. Payment is processed securely via M-PESA."
                : "Keep your membership active and continue enjoying full member benefits."}
            </p>
          </motion.div>

          {/* Payment type toggle */}
          <motion.div variants={scaleIn} initial="hidden" animate="visible"
            className="grid grid-cols-2 gap-3 mb-7 p-1.5 bg-white rounded-2xl border border-[#E7ECF3] shadow-sm">
            {[
              { id: "registration" as const, label: "New Member", icon: GraduationCap, sub: "First-time registration" },
              { id: "renewal" as const, label: "Renew Membership", icon: BadgeCheck, sub: "Annual renewal" },
            ].map(t => (
              <motion.button key={t.id} whileTap={buttonTap}
                onClick={() => setPaymentType(t.id)}
                className={`flex flex-col items-center gap-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                  paymentType === t.id
                    ? "bg-[#171717] text-white shadow-md"
                    : "text-[#6D7A8B] hover:bg-[#F7F9FC]"
                }`}>
                <t.icon size={20} />
                <span className="text-sm">{t.label}</span>
                <span className={`text-xs ${paymentType === t.id ? "text-white/70" : "text-[#6D7A8B]/70"}`}>{t.sub}</span>
              </motion.button>
            ))}
          </motion.div>

          {/* Form card */}
          <motion.div variants={scaleIn} initial="hidden" animate="visible"
            className="bg-white rounded-2xl shadow-lg border border-[#E7ECF3] overflow-hidden">

            <form onSubmit={handleSubmit}>
              {paymentType === "registration" ? (
                <div className="p-6 space-y-5">
                  <div>
                    <h2 className="text-sm font-bold text-[#0B0F1A] uppercase tracking-wide mb-4 flex items-center gap-2">
                      <span className="w-5 h-5 bg-[#171717] text-white rounded-full text-xs flex items-center justify-center">1</span>
                      Personal Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-[#0B0F1A] mb-1.5 flex items-center gap-1.5"><User size={14} className="text-[#6D7A8B]" />Full Name *</label>
                        <input type="text" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
                          className="w-full px-4 py-2.5 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#171717] transition"
                          placeholder="Your full name" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[#0B0F1A] mb-1.5 flex items-center gap-1.5"><Mail size={14} className="text-[#6D7A8B]" />Email *</label>
                        <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                          className="w-full px-4 py-2.5 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#171717] transition"
                          placeholder="you@email.com" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[#0B0F1A] mb-1.5 flex items-center gap-1.5"><Phone size={14} className="text-[#6D7A8B]" />Phone (M-PESA) *</label>
                        <div className="relative">
                          <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full px-4 py-2.5 pl-10 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#171717] transition"
                            placeholder="0712345678" />
                          <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6D7A8B]" />
                        </div>
                        <p className="text-xs text-[#6D7A8B] mt-1">M-PESA prompt will be sent here</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[#0B0F1A] mb-1.5 flex items-center gap-1.5"><Lock size={14} className="text-[#6D7A8B]" />Password *</label>
                        <div className="relative">
                          <input type={showPassword ? "text" : "password"} required minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                            className="w-full px-4 py-2.5 pr-10 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#171717] transition"
                            placeholder="Min. 6 characters" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6D7A8B] hover:text-[#0B0F1A] transition">
                            {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#E7ECF3] pt-5">
                    <h2 className="text-sm font-bold text-[#0B0F1A] uppercase tracking-wide mb-4 flex items-center gap-2">
                      <span className="w-5 h-5 bg-[#FF7A00] text-white rounded-full text-xs flex items-center justify-center">2</span>
                      Academic Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-[#0B0F1A] mb-1.5 flex items-center gap-1.5">
                          <GraduationCap size={14} className="text-[#6D7A8B]" />Graduation Year *
                        </label>
                        <input type="number" min="2000" max="2030" required value={formData.graduation_year}
                          onChange={e => setFormData({...formData, graduation_year: e.target.value})}
                          className="w-full px-4 py-2.5 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#171717] transition"
                          placeholder="e.g. 2023" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-[#0B0F1A] mb-1.5 flex items-center gap-1.5"><MapPin size={14} className="text-[#6D7A8B]" />Country of Residence *</label>
                        <select required value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})}
                          className="w-full px-4 py-2.5 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#171717] transition bg-white">
                          <option value="">Select your country</option>
                          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-2xl border p-5 transition-all duration-300 ${
                    registrationFee !== null
                      ? registrationFee === 1
                        ? 'bg-[#F5F5F5] border-[#171717]/20'
                        : 'bg-[#FFF4E6] border-[#FF7A00]/20'
                      : 'bg-[#F7F9FC] border-[#E7ECF3]'
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <Gift size={20} className={registrationFee === 1 ? "text-[#171717]" : registrationFee === 1500 ? "text-[#FF7A00]" : "text-[#6D7A8B]"} />
                      <p className="font-bold text-[#0B0F1A]">Registration Summary</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                      {[
                        "Lifetime membership access", "Networking opportunities",
                        "Exclusive events & workshops", "Member resources & discounts"
                      ].map(b => (
                        <div key={b} className="flex items-start gap-2">
                          <CheckCircle size={14} className="text-[#171717] mt-0.5 flex-shrink-0" />
                          <span className="text-[#6D7A8B] text-xs">{b}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-[#E7ECF3] pt-3 flex items-center justify-between">
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={feeLabel}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className={`text-2xl font-bold ${
                            registrationFee === 1 ? 'text-[#171717]' :
                            registrationFee === 1500 ? 'text-[#FF7A00]' : 'text-[#6D7A8B]'
                          }`}>
                          {feeLabel}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                  </div>

                  <p className="text-sm text-[#6D7A8B] text-center">
                    Already have an account?{" "}
                    <Link href="/login" className="text-[#FF7A00] font-semibold hover:underline">Login here</Link>
                  </p>
                </div>
              ) : (
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#0B0F1A] mb-1.5">Membership Number *</label>
                      <input type="text" required value={formData.membership_number} onChange={e => setFormData({...formData, membership_number: e.target.value})}
                        className="w-full px-4 py-2.5 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#FF7A00] transition font-mono"
                        placeholder="e.g. 100121" pattern="^100\d{3}$" />
                      <p className="text-xs text-[#6D7A8B] mt-1">Format: 100XXX</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#0B0F1A] mb-1.5">Full Name *</label>
                      <input type="text" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
                        className="w-full px-4 py-2.5 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#FF7A00] transition"
                        placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#0B0F1A] mb-1.5">Email *</label>
                      <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-2.5 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#FF7A00] transition"
                        placeholder="john@email.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#0B0F1A] mb-1.5 flex items-center gap-1.5"><Phone size={14} className="text-[#6D7A8B]" />Phone (M-PESA) *</label>
                      <div className="relative">
                        <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                          className="w-full px-4 py-2.5 pl-10 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#FF7A00] transition"
                          placeholder="0712345678" />
                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6D7A8B]" />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-[#0B0F1A] mb-1.5">Renewal Year *</label>
                      <select required value={formData.renewal_year} onChange={e => setFormData({...formData, renewal_year: e.target.value})}
                        className="w-full px-4 py-2.5 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#FF7A00] transition bg-white">
                        {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() + i).map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-[#F5F5F5] p-5 rounded-2xl border border-[#171717]/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[#171717]">Annual Membership Fee</p>
                        <p className="text-sm text-[#6D7A8B] mt-0.5">Paid via M-PESA STK Push</p>
                      </div>
                      <p className="text-2xl font-bold text-[#171717]">Ksh {FEE_RENEWAL.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className={`px-6 pb-6 ${paymentType === 'registration' ? '' : 'pt-0'}`}>
                <motion.button
                  type="submit"
                  disabled={loading || (paymentType === 'registration' && registrationFee === null)}
                  whileHover={(!loading && registrationFee !== null) ? buttonHover : undefined}
                  whileTap={buttonTap}
                  className="w-full py-4 bg-[#171717] text-white font-bold rounded-xl hover:bg-[#333333] transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2 text-base">
                  {loading ? (
                    <><Loader2 className="animate-spin" size={18} />Processing...</>
                  ) : (
                    <>
                      <Smartphone size={18} />
                      {paymentType === "registration"
                        ? `Register & Pay ${registrationFee ? `Ksh ${registrationFee.toLocaleString()}` : ''} via M-PESA`
                        : `Pay Ksh ${FEE_RENEWAL.toLocaleString()} via M-PESA`}
                      <ArrowRight size={18} />
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
}

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas",
  "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin",
  "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei",
  "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada",
  "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia",
  "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana",
  "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti",
  "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
  "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya",
  "Kiribati", "Korea", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon",
  "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands",
  "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia",
  "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Norway", "Oman",
  "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines",
  "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis",
  "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino",
  "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles",
  "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands",
  "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan",
  "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania",
  "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia",
  "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates",
  "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu",
  "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];