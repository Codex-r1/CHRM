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
  county: string;
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
/**
 * Members who graduated in 2021 or later pay Ksh 1,000.
 * Members who graduated before 2021 pay Ksh 1,500.
 * Returns null if graduation year is not yet entered.
 */
const getRegistrationFee = (graduationYear: string): number | null => {
  const year = parseInt(graduationYear, 10);
  if (!graduationYear || isNaN(year)) return null;
  return year >= 2021 ? 1000 : 1500;
};

const FEE_RENEWAL = 1000;

// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
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
  scale: 1.02, y: -2,
  boxShadow: "0 12px 28px rgba(43, 76, 115, 0.28)",
  transition: { type: "spring" as const, stiffness: 400, damping: 15 },
};
const buttonTap = { scale: 0.97 };
const inputFocus = {
  scale: 1.01,
  borderColor: "#2B4C73",
  boxShadow: "0 0 0 3px rgba(43, 76, 115, 0.1)",
  transition: { type: "spring" as const, stiffness: 400, damping: 15 },
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

  // ── Derived: registration fee updates live as graduation year changes ─────────
  const registrationFee = useMemo(() => getRegistrationFee(formData.graduation_year), [formData.graduation_year]);
  const feeLabel = registrationFee !== null ? `Ksh ${registrationFee.toLocaleString()}` : '—';
  const feeGroup = registrationFee === null ? null : registrationFee === 1000 ? 'recent' : 'standard';

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
          !formData.graduation_year || !formData.course || !formData.county) {
          showAlert('error', 'Missing Information', 'Please fill in all required fields');
          setLoading(false);
          return;
        }
        if (!formData.phone || !validatePhoneNumber(formData.phone)) {
          showAlert('error', 'Invalid Phone Number', 'Please enter a valid Kenyan phone number (e.g., 0712345678)');
          setLoading(false);
          return;
        }

        // ── FIX: compute actual fee from graduation year before proceeding ──
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

  // ─── Registration + Payment ────────────────────────────────────────────────
  // FIX: accept fee as a parameter so we use the computed value, not a hardcoded one
  const handleRegistrationAndPayment = async (fee: number) => {
    try {
      setLoading(true);
      const registrationResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone,
          graduation_year: formData.graduation_year,
          course: formData.course,
          county: formData.county,
          password: formData.password,
          // Pass the computed fee so the backend can store the correct amount
          registration_fee: fee,
        })
      });

      const registrationData = await registrationResponse.json();
      if (!registrationResponse.ok) throw new Error(registrationData.error || 'Registration failed');

      const payment_id = registrationData.payment_id;

      // ── FIX: use our locally-computed fee, NOT whatever the API returns ──
      // This ensures the STK Push requests the correct amount based on grad year
      await initiateSTKPush(fee, 'registration', undefined, {
        graduation_year: formData.graduation_year,
        course: formData.course,
        county: formData.county,
      }, payment_id);

    } catch (err) {
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
          amount,                // ← correct amount passed here
          paymentType: type,
          userId,
          userEmail: formData.email,
          userName: formData.full_name,
          metadata: metadata || {
            graduation_year: formData.graduation_year,
            course: formData.course,
            county: formData.county,
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
            showAlert('success', 'Welcome to CHRMAA!',
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
      success: { bg: 'bg-white', border: 'border-[#2B4C73]', iconBg: 'bg-[#E8F4FD]', icon: <CheckCircle className="text-[#2B4C73]" size={28} />, btnBg: 'bg-[#2B4C73] hover:bg-[#1E3A5F]', titleColor: 'text-[#2B4C73]' },
      warning: { bg: 'bg-white', border: 'border-[#FF7A00]', iconBg: 'bg-[#FFF4E6]', icon: <AlertCircle className="text-[#FF7A00]" size={28} />, btnBg: 'bg-[#FF7A00] hover:bg-[#E56B00]', titleColor: 'text-[#FF7A00]' },
      info: { bg: 'bg-white', border: 'border-[#2B4C73]', iconBg: 'bg-[#E8F4FD]', icon: <Info className="text-[#2B4C73]" size={28} />, btnBg: 'bg-[#2B4C73] hover:bg-[#1E3A5F]', titleColor: 'text-[#2B4C73]' },
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gradient-to-br from-[#F7F9FC] via-white to-[#E8F4FD]">
        <AlertModalComponent />
        <Header />
        <main className="flex-1 py-12 px-4">
          <div className="max-w-lg mx-auto">
            <motion.div variants={scaleIn} initial="hidden" animate="visible"
              className="bg-white rounded-2xl shadow-xl border border-[#E7ECF3] overflow-hidden">

              {/* Top banner */}
              <div className="bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] p-6 text-white text-center">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Smartphone className="text-white" size={28} />
                </div>
                <h1 className="text-xl font-bold">Check Your Phone</h1>
                <p className="text-white/80 text-sm mt-1">An M-PESA prompt has been sent to</p>
                <p className="text-[#FF7A00] font-bold text-lg mt-0.5">{formData.phone}</p>
              </div>

              <div className="p-6 space-y-5">
                {/* Amount */}
                <div className="flex items-center justify-between p-4 bg-[#F7F9FC] rounded-xl border border-[#E7ECF3]">
                  <div>
                    <p className="text-xs text-[#6D7A8B] font-medium">Amount Due</p>
                    <p className="text-sm text-[#0B0F1A] font-medium">{paybillInfo.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#FF7A00]">Ksh {paybillInfo.amount.toLocaleString()}</p>
                  </div>
                </div>

                {/* Status */}
                <div className={`p-4 rounded-xl border ${
                  stkStatus === 'success' ? 'bg-[#E8F4FD] border-[#2B4C73]/20' :
                  stkStatus === 'failed' || stkStatus === 'cancelled' ? 'bg-[#FFF0F0] border-[#E53E3E]/20' :
                  'bg-[#FFF4E6] border-[#FF7A00]/20'}`}>
                  <div className="flex items-center gap-3">
                    {stkStatus === 'pending' && (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-7 h-7 border-2 border-[#FF7A00] border-t-transparent rounded-full flex-shrink-0" />
                    )}
                    {stkStatus === 'success' && <CheckCircle className="text-[#2B4C73] flex-shrink-0" size={28} />}
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

                {/* Steps */}
                <div className="space-y-2.5">
                  {["Check your phone for a prompt", "Enter your M-PESA PIN", "Wait for payment confirmation"].map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-[#E8F4FD] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-[#2B4C73]">{i + 1}</span>
                      </div>
                      <p className="text-sm text-[#6D7A8B]">{s}</p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button onClick={cancelPayment}
                    className="flex-1 px-4 py-3 bg-[#F7F9FC] text-[#6D7A8B] font-semibold rounded-xl hover:bg-[#E7ECF3] border border-[#E7ECF3] transition text-sm">
                    Cancel
                  </button>
                  {stkStatus === 'failed' && (
                    <button onClick={() => setStep(1)}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-[#FF7A00] to-[#E56B00] text-white font-semibold rounded-xl hover:opacity-90 transition text-sm">
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
      className="min-h-screen bg-gradient-to-br from-[#F7F9FC] via-white to-[#E8F4FD]">
      <AlertModalComponent />
      <Header />

      <main className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Page title */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-[#0B0F1A] mb-2">
              {paymentType === "registration" ? "Join CHRMAA" : "Renew Membership"}
            </h1>
            <p className="text-[#6D7A8B]">
              {paymentType === "registration"
                ? "Become part of the CHRMAA community. Payment is processed securely via M-PESA."
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
                    ? "bg-gradient-to-br from-[#2B4C73] to-[#1E3A5F] text-white shadow-md"
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
                  {/* Personal details section */}
                  <div>
                    <h2 className="text-sm font-bold text-[#0B0F1A] uppercase tracking-wide mb-4 flex items-center gap-2">
                      <span className="w-5 h-5 bg-[#2B4C73] text-white rounded-full text-xs flex items-center justify-center">1</span>
                      Personal Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-[#0B0F1A] mb-1.5 flex items-center gap-1.5"><User size={14} className="text-[#6D7A8B]" />Full Name *</label>
                        <input type="text" required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})}
                          className="w-full px-4 py-2.5 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#2B4C73] transition"
                          placeholder="Your full name" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[#0B0F1A] mb-1.5 flex items-center gap-1.5"><Mail size={14} className="text-[#6D7A8B]" />Email *</label>
                        <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                          className="w-full px-4 py-2.5 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#2B4C73] transition"
                          placeholder="you@email.com" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[#0B0F1A] mb-1.5 flex items-center gap-1.5"><Phone size={14} className="text-[#6D7A8B]" />Phone (M-PESA) *</label>
                        <div className="relative">
                          <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full px-4 py-2.5 pl-10 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#2B4C73] transition"
                            placeholder="0712345678" />
                          <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6D7A8B]" />
                        </div>
                        <p className="text-xs text-[#6D7A8B] mt-1">M-PESA prompt will be sent here</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[#0B0F1A] mb-1.5 flex items-center gap-1.5"><Lock size={14} className="text-[#6D7A8B]" />Password *</label>
                        <div className="relative">
                          <input type={showPassword ? "text" : "password"} required minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                            className="w-full px-4 py-2.5 pr-10 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#2B4C73] transition"
                            placeholder="Min. 6 characters" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6D7A8B] hover:text-[#0B0F1A] transition">
                            {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Academic details section */}
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
                          className="w-full px-4 py-2.5 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#2B4C73] transition"
                          placeholder="e.g. 2023" />
                        {/* ── Live fee indicator ── */}
                        <AnimatePresence mode="wait">
                          {registrationFee !== null && (
                            <motion.div
                              key={feeGroup}
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              className={`mt-2 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg w-fit ${
                                feeGroup === 'recent'
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : 'bg-[#FFF4E6] text-[#FF7A00] border border-[#FF7A00]/20'
                              }`}>
                              {feeGroup === 'recent'
                                ? <> Ksh 1,000 fee applies (2021 or later)</>
                                : <> Ksh 1,500 fee applies (before 2021)</>
                              }
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[#0B0F1A] mb-1.5 flex items-center gap-1.5"><BookOpen size={14} className="text-[#6D7A8B]" />Course Studied *</label>
                        <select required value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})}
                          className="w-full px-4 py-2.5 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#2B4C73] transition bg-white">
                          <option value="">Select your course</option>
                          {CHRM_COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-[#0B0F1A] mb-1.5 flex items-center gap-1.5"><MapPin size={14} className="text-[#6D7A8B]" />County of Residence *</label>
                        <select required value={formData.county} onChange={e => setFormData({...formData, county: e.target.value})}
                          className="w-full px-4 py-2.5 border-2 border-[#E7ECF3] rounded-xl text-[#0B0F1A] focus:outline-none focus:border-[#2B4C73] transition bg-white">
                          <option value="">Select your county</option>
                          {COUNTIES_IN_KENYA.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Fee summary */}
                  <div className={`rounded-2xl border p-5 transition-all duration-300 ${
                    registrationFee !== null
                      ? registrationFee === 1000
                        ? 'bg-gradient-to-r from-green-50 to-[#E8F4FD] border-green-200'
                        : 'bg-gradient-to-r from-[#FFF4E6] to-[#FFF0F0] border-[#FF7A00]/20'
                      : 'bg-[#F7F9FC] border-[#E7ECF3]'
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <Gift size={20} className={registrationFee === 1000 ? "text-green-600" : registrationFee === 1500 ? "text-[#FF7A00]" : "text-[#6D7A8B]"} />
                      <p className="font-bold text-[#0B0F1A]">Registration Summary</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                      {[
                        "Lifetime membership access", "Networking opportunities",
                        "Exclusive events & workshops", "Member resources & discounts"
                      ].map(b => (
                        <div key={b} className="flex items-start gap-2">
                          <CheckCircle size={14} className="text-[#2B4C73] mt-0.5 flex-shrink-0" />
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
                            registrationFee === 1000 ? 'text-green-700' :
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

                  <div className="border-t border-[#E7ECF3] pt-4 text-center">
                    <p className="text-[#6D7A8B] text-sm mb-2">Already have a membership number?</p>
                    <Link href="/claim-account" className="inline-flex items-center gap-2 text-[#2B4C73] font-semibold hover:underline text-sm">
                      <Key size={14} /> Claim your account
                    </Link>
                  </div>
                </div>
              ) : (
                /* ── Renewal form ── */
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

                  <div className="bg-gradient-to-r from-[#FFF4E6] to-[#FFF0F0] p-5 rounded-2xl border border-[#FF7A00]/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[#FF7A00]">Annual Membership Fee</p>
                        <p className="text-sm text-[#6D7A8B] mt-0.5">Paid via M-PESA STK Push</p>
                      </div>
                      <p className="text-2xl font-bold text-[#FF7A00]">Ksh {FEE_RENEWAL.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <div className={`px-6 pb-6 ${paymentType === 'registration' ? '' : 'pt-0'}`}>
                <motion.button
                  type="submit"
                  disabled={loading || (paymentType === 'registration' && registrationFee === null)}
                  whileHover={(!loading && registrationFee !== null) ? buttonHover : undefined}
                  whileTap={buttonTap}
                  className="w-full py-4 bg-gradient-to-r from-[#E53E3E] to-[#CC3636] text-white font-bold rounded-xl hover:opacity-95 transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2 text-base">
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
                {paymentType === 'registration' && !formData.graduation_year && (
                  <p className="text-xs text-center text-[#6D7A8B] mt-2">Enter your graduation year to see your fee</p>
                )}
              </div>
            </form>
          </motion.div>

          {/* Security note */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-2 mt-5 text-xs text-[#6D7A8B]">
            <Shield size={13} />
            <span>Payments are processed securely via M-PESA. Your data is encrypted and protected.</span>
          </motion.div>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const CHRM_COURSES = [
  "Diploma in Human Resource Management (KNEC)", "Diploma in Business Management",
  "Diploma in Banking and Finance", "Diploma in Supply Chain Management (KNEC)",
  "Diploma in Information Communication Technology (ICT) – KNEC",
  "Diploma in Computer Science / Computer Programming (TVET CDACC)",
  "Diploma in Cyber Security (TVET CDACC)", "Diploma in Criminal Justice (TVET CDACC)",
  "Diploma in Security Management (TVET CDACC)", "Diploma in Forensic Investigation (TVET CDACC)",
  "Diploma in Customer Service (ICM)", "Diploma in Digital Journalism Level 6",
  "Diploma in Food and Beverage Production (Culinary Arts) Level 6",
  "Diploma in Food and Beverage Sales Management Level 6",
  "Higher Diploma in Human Resource Management",
  "Certificate in Human Resource Management (KNEC)", "Certificate in Business Management (KNEC)",
  "Certificate in Banking and Finance (KNEC)", "Certificate in Supply Chain Management (KNEC)",
  "Certificate in Information Communication Technology (ICT) – KNEC",
  "Certificate in Security Management – TVET CDACC Level 5",
  "Certificate in Cyber Security – TVET CDACC Level 5",
  "Certificate in Forensic Investigation – TVET CDACC Level 5",
  "Certificate in Accounting and Management Skills (CAMS – KASNEB)",
  "Artisan in Store-Keeping (KNEC)", "Artisan in Salesmanship (KNEC)",
  "ICT & Computer Application Packages", "Digital Marketing & Social Media Courses",
  "Graphic Design & CAD Courses", "Leadership & Management Training",
  "HR Consultancy Training", "CHRP", "HRCi", "Other Professional Short Courses",
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