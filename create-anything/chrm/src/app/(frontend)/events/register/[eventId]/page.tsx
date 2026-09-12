"use client";

import { useState, useEffect, FormEvent, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import {
  Calendar, MapPin, Users, CheckCircle,
  AlertCircle, Smartphone, ArrowRight, Loader2,
  Ticket, ArrowLeft, BadgeCheck, Shield,
  User, Mail, Phone, CreditCard, Globe
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useAuth } from "../../../../(backend)/context/auth";
import AlertModal, { AlertType } from "../../../components/AlertModal";
import { FEATURES } from "../../../../(backend)/lib/features/features";
import StripeCheckout from "../../../components/StripeCheckout";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

type EventType = {
  id: string; name: string; description: string; event_date: string;
  location: string; price: number; max_attendees: number;
  current_attendees: number; status: string; is_active: boolean; image_url?: string;
};

type PaymentMethod = "mpesa" | "visa" | "paypal";

type STKPushStatus = 'idle' | 'initiating' | 'pending' | 'success' | 'failed' | 'cancelled';

type AlertModalState = {
  show: boolean; type: AlertType; title: string; message: string;
  onConfirm?: () => void; confirmText?: string;
  onCancel?: () => void; cancelText?: string;
};

// ─── PaymentMethodSelector ──────────────────────────────────────────────
const PaymentMethodSelector = ({
  paymentMethod, setPaymentMethod, isProcessing,
}: {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  isProcessing: boolean;
}) => {
  const paymentMethods = [
    { id: "mpesa" as PaymentMethod, label: "M-PESA", icon: "/m-pesa-logo_1.png", disabled: false },
    { id: "visa" as PaymentMethod, label: "Visa / Mastercard", icon: "/mastercard.png", disabled: false },
    { id: "paypal" as PaymentMethod, label: "PayPal", icon: "/paypal-3384015_1280.png", disabled: !FEATURES.paypal.enabled },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {paymentMethods.map((method) => {
          const isSelected = paymentMethod === method.id;
          const isDisabled = method.disabled;
          return (
            <motion.button
              key={method.id}
              type="button"
              onClick={() => { if (isDisabled) return; setPaymentMethod(method.id); }}
              whileHover={isDisabled ? undefined : { y: -2 }}
              whileTap={isDisabled ? undefined : { scale: 0.97 }}
              disabled={isProcessing || isDisabled}
              title={isDisabled ? FEATURES.paypal.comingSoonMessage : undefined}
              className={`relative p-4 border-2 rounded-lg transition-all duration-300 text-center group ${
                isDisabled
                  ? "cursor-not-allowed opacity-60 bg-gray-50 border-[#1B3A6B]/5"
                  : isSelected
                  ? "cursor-pointer border-[#C9A84C] bg-[#C9A84C]/5 shadow-sm"
                  : "cursor-pointer border-[#1B3A6B]/10 hover:border-[#1B3A6B]/20 hover:bg-[#1B3A6B]/5"
              } disabled:cursor-not-allowed`}
            >
              {isSelected && !isDisabled && (
                <motion.div
                  layoutId="payment-selection"
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#C9A84C] rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <CheckCircle className="w-3 h-3 text-white" />
                </motion.div>
              )}
              <div className="flex flex-col items-center gap-2 mb-2">
                <div className={`h-10 flex items-center justify-center ${isDisabled ? "grayscale" : ""}`}>
                  <img src={method.icon} alt={method.label} className={`w-12 h-8 object-contain ${isDisabled ? "opacity-50" : ""}`} />
                </div>
              </div>
              <p className={`text-sm font-medium transition-colors duration-300 ${
                isDisabled ? "text-[#1B3A6B]/40" : isSelected ? "text-[#1B3A6B]" : "text-[#1B3A6B]/70"
              }`}>{method.label}</p>
              {isDisabled && (
                <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-[#C9A84C]/20 text-[#1B3A6B] rounded">Soon</span>
              )}
              {isSelected && !isDisabled && (
                <motion.div
                  layoutId="payment-underline"
                  className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#C9A84C] rounded-full"
                  initial={{ width: 0 }} animate={{ width: 32 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────────
export default function EventRegistrationPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.eventId as string | undefined;

  const { user: authUser, loading: authLoading } = useAuth();

  const [alertModal, setAlertModal] = useState<AlertModalState>({
    show: false, type: 'info', title: '', message: '', confirmText: 'OK', cancelText: 'Cancel',
  });

  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [event, setEvent] = useState<EventType | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [stkStatus, setStkStatus] = useState<STKPushStatus>('idle');
  const [checkoutRequestID, setCheckoutRequestID] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({ full_name: "", email: "", phone: "" });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa");

  // Stripe state
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);

  useEffect(() => {
    return () => { if (pollingInterval) clearInterval(pollingInterval); };
  }, [pollingInterval]);

  useEffect(() => {
    return () => { if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current); };
  }, []);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) { setError("No event ID provided in URL"); setLoading(false); return; }
      try {
        setLoading(true);
        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || errorData.details || `Event not found (HTTP ${response.status})`);
        }
        const data = await response.json();
        setEvent(data);
        setError("");
      } catch (err: any) {
        setError(err.message || "Failed to load event. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    if (authUser && !authLoading) {
      setFormData(prev => ({
        ...prev,
        full_name: authUser.user_metadata?.full_name || "",
        email: authUser.email || "",
        phone: authUser.user_metadata?.phone || "",
      }));
    }
  }, [authUser, authLoading]);

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^(07\d{8}|7\d{8}|\+2547\d{8}|2547\d{8})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const showAlert = (
    type: AlertType, title: string, message: string,
    options?: { onConfirm?: () => void; confirmText?: string; onCancel?: () => void; cancelText?: string; autoClose?: number; }
  ) => {
    if (alertTimeoutRef.current) { clearTimeout(alertTimeoutRef.current); alertTimeoutRef.current = null; }
    setAlertModal({
      show: true, type, title, message,
      onConfirm: options?.onConfirm, confirmText: options?.confirmText || 'OK',
      onCancel: options?.onCancel, cancelText: options?.cancelText || 'Cancel',
    });
    if (options?.autoClose) alertTimeoutRef.current = setTimeout(() => closeAlert(), options.autoClose);
  };

  const closeAlert = () => {
    if (alertTimeoutRef.current) { clearTimeout(alertTimeoutRef.current); alertTimeoutRef.current = null; }
    setAlertModal(prev => ({ ...prev, show: false }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!event) { setError("Event information is still loading. Please wait."); return; }
    if (!formData.full_name || !formData.email || !formData.phone) {
      showAlert('error', 'Missing Information', 'Please fill in all required fields');
      return;
    }
    if (!validatePhoneNumber(formData.phone)) {
      showAlert('error', 'Invalid Phone Number', 'Please enter a valid Kenyan phone number (e.g., 0712345678)');
      return;
    }

    setStkStatus('initiating');

    try {
      const amount = event.price;
      const userId = authUser?.id || null;
      const userEmail = authUser?.email || formData.email;
      const userName = authUser?.user_metadata?.full_name || formData.full_name;
      const membershipNumber = authUser?.user_metadata?.membership_number || null;
      const isMember = !!authUser;

      // ─── M-PESA ─────────────────────────────────────────────
      if (paymentMethod === 'mpesa') {
        const response = await fetch('/api/payments/stk-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: formData.phone,
            amount,
            paymentType: 'event',
            userId, userEmail, userName,
            metadata: {
              event_id: eventId, event_name: event.name,
              attendee_name: formData.full_name,
              attendee_email: formData.email,
              attendee_phone: formData.phone,
              membership_number: membershipNumber,
              is_member: isMember,
              registration_type: isMember ? "member" : "guest",
              payment_method: 'mpesa',
            },
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || data.error || 'Failed to initiate payment');
        }
        const reqId = data.checkoutRequestId || data.checkoutRequestID || data.data?.checkoutRequestId;
        const pId = data.paymentId || data.data?.paymentId || '';
        if (!reqId) throw new Error("No CheckoutRequestID returned from server");

        setCheckoutRequestID(reqId);
        setPaymentId(pId);
        setStkStatus('pending');
        setStep(2);
        startPaymentPolling(reqId);
        return;
      }

      // ─── STRIPE (Card) ──────────────────────────────────────
      if (paymentMethod === 'visa') {
        const intentRes = await fetch('/api/payments/stripe/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Math.round(amount * 100),
            currency: 'KES',
            customerEmail: userEmail,
            metadata: {
              user_id: userId,
              event_id: eventId,
              event_name: event.name,
              attendee_name: formData.full_name,
              attendee_email: formData.email,
              attendee_phone: formData.phone,
              registration_type: isMember ? 'member' : 'guest',
              payment_type: 'event',
            },
          }),
        });

        const intentData = await intentRes.json();
        if (!intentRes.ok || !intentData.clientSecret) {
          throw new Error(intentData.error || 'Failed to initialize card payment');
        }

        setStripeClientSecret(intentData.clientSecret);
        setShowStripeCheckout(true);
        setStkStatus('idle');
        return;
      }

      // ─── PayPal (disabled) ──────────────────────────────────
      if (paymentMethod === 'paypal') {
        if (!FEATURES.paypal.enabled) {
          showAlert('info', 'Coming Soon', 'PayPal payments are coming soon. Please use M-PESA or Card.');
          setStkStatus('idle');
          return;
        }
      }
    } catch (err: any) {
      console.error("Payment Error:", err);
      setStkStatus('failed');
      setError(err.message || 'Failed to register for event');
      showAlert('error', 'Payment Failed', err.message || 'Failed to register for event');
    }
  };

  const startPaymentPolling = (checkoutID: string) => {
    let pollCount = 0;
    const maxPolls = 40;

    if (pollingInterval) { clearInterval(pollingInterval); setPollingInterval(null); }

    const interval = setInterval(async () => {
      pollCount++;
      try {
        const response = await fetch(`/api/payments/${checkoutID}`);
        if (!response.ok) return;
        const data = await response.json();

        if (data.status === 'confirmed') {
          clearInterval(interval); setPollingInterval(null);
          setStkStatus('success');
          closeAlert();
          setStep(3);
        } else if (data.status === 'failed' || data.status === 'cancelled') {
          clearInterval(interval); setPollingInterval(null);
          setStkStatus(data.status);
          showAlert('error', 'Payment Failed',
            data.status === 'cancelled' ? 'Payment was cancelled.' : 'Payment failed. Please try again.',
            { confirmText: 'Try Again', onConfirm: () => setStep(1) }
          );
        }
        if (pollCount >= maxPolls) {
          clearInterval(interval); setPollingInterval(null);
          setStkStatus('failed');
          showAlert('error', 'Payment Timeout', 'Payment verification timed out. Please check your M-PESA messages.',
            { confirmText: 'OK', onConfirm: () => setStep(1) }
          );
        }
      } catch (err) {
        if (pollCount >= maxPolls) { clearInterval(interval); setPollingInterval(null); }
      }
    }, 3000);
    setPollingInterval(interval);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B3A6B] mx-auto"></div>
          <p className="mt-4 text-[#1B3A6B]/60">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <AlertCircle className="mx-auto text-[#1B3A6B] mb-4" size={48} />
            <h1 className="text-2xl font-serif font-bold text-[#1B3A6B] mb-2">Event Not Found</h1>
            <p className="text-[#1B3A6B]/60 mb-6">Unable to load event details. Please try again.</p>
            <Link href="/events" className="inline-flex items-center gap-2 px-6 py-3 bg-[#1B3A6B] text-white font-medium rounded-lg hover:bg-[#152e55] transition">
              <ArrowLeft size={18} /> Back to Events
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (step === 3) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="min-h-screen bg-white">
        <AlertModal
          show={alertModal.show} type={alertModal.type} title={alertModal.title}
          message={alertModal.message} onConfirm={alertModal.onConfirm}
          confirmText={alertModal.confirmText} onCancel={alertModal.onCancel}
          cancelText={alertModal.cancelText} onClose={closeAlert}
        />
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <motion.div variants={scaleIn} initial="hidden" animate="visible" className="w-full max-w-md">
            <div className="bg-white border border-[#1B3A6B]/10 rounded-lg p-8 text-center shadow-sm">
              <div className="w-20 h-20 bg-[#C9A84C]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="text-[#C9A84C]" size={40} />
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#1B3A6B] mb-4">Registration Complete!</h1>
              <p className="text-[#1B3A6B]/60 mb-6">
                You have successfully registered for <strong className="text-[#1B3A6B]">{event.name}</strong>.
              </p>
              <div className="bg-[#1B3A6B]/5 rounded-lg p-4 mb-6 border border-[#1B3A6B]/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#1B3A6B]/60 text-sm">Event Date:</span>
                  <span className="font-serif font-semibold text-[#1B3A6B]">
                    {new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#1B3A6B]/60 text-sm">Location:</span>
                  <span className="font-serif font-semibold text-[#1B3A6B]">{event.location}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/events" className="px-6 py-3 bg-[#1B3A6B] text-white font-medium rounded-lg hover:bg-[#152e55] transition">Back to Events</Link>
                <Link href={authUser ? "/member/dashboard?tab=events" : "/"} className="px-6 py-3 border border-[#1B3A6B]/20 text-[#1B3A6B] font-medium rounded-lg hover:bg-[#1B3A6B]/5 transition">
                  {authUser ? "My Dashboard" : "Home"}
                </Link>
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="min-h-screen bg-white">
        <AlertModal
          show={alertModal.show} type={alertModal.type} title={alertModal.title}
          message={alertModal.message} onConfirm={alertModal.onConfirm}
          confirmText={alertModal.confirmText} onCancel={alertModal.onCancel}
          cancelText={alertModal.cancelText} onClose={closeAlert}
        />
        <Header />
        <main className="flex-1 py-12 px-4">
          <motion.div variants={scaleIn} initial="hidden" animate="visible" className="max-w-lg mx-auto">
            <div className="bg-white border border-[#1B3A6B]/10 rounded-lg p-8 shadow-sm">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#1B3A6B]/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="text-[#1B3A6B]" size={32} />
                </div>
                <h1 className="text-2xl font-serif font-bold text-[#1B3A6B]">Check Your Phone</h1>
                <p className="text-[#1B3A6B]/60 mt-1">An M-PESA prompt has been sent to</p>
                <p className="text-[#C9A84C] font-serif font-bold text-lg mt-1">{formData.phone}</p>
              </div>
              <div className="bg-[#1B3A6B]/5 p-4 rounded-lg mb-6 border border-[#1B3A6B]/10">
                <h3 className="font-serif font-semibold text-[#1B3A6B]">{event.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-[#1B3A6B]/60">Amount:</span>
                  <span className="font-serif font-bold text-[#1B3A6B]">KES {event.price.toLocaleString()}</span>
                </div>
              </div>
              <div className={`p-4 rounded-lg border mb-6 ${stkStatus === 'pending' ? 'bg-[#C9A84C]/5 border-[#C9A84C]/30' : 'bg-[#1B3A6B]/5 border-[#1B3A6B]/20'}`}>
                <div className="flex items-center gap-3">
                  {stkStatus === 'pending' && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full flex-shrink-0"
                    />
                  )}
                  {(stkStatus === 'failed' || stkStatus === 'cancelled') && <AlertCircle className="text-[#1B3A6B] flex-shrink-0" size={24} />}
                  <div>
                    <p className="font-serif font-semibold text-[#1B3A6B]">
                      {stkStatus === 'pending' && 'Awaiting your M-PESA PIN...'}
                      {stkStatus === 'failed' && 'Payment Failed'}
                      {stkStatus === 'cancelled' && 'Payment Cancelled'}
                    </p>
                    <p className="text-xs text-[#1B3A6B]/60">
                      {stkStatus === 'pending' && 'Enter your PIN to complete payment'}
                      {(stkStatus === 'failed' || stkStatus === 'cancelled') && 'Please try again'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                {["Check your phone for the M-PESA prompt", "Enter your M-PESA PIN to authorize payment", "Wait for confirmation"].map((stepText, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#1B3A6B] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">{index + 1}</span>
                    </div>
                    <p className="text-sm text-[#1B3A6B]/70">{stepText}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (pollingInterval) { clearInterval(pollingInterval); setPollingInterval(null); }
                    setStkStatus('cancelled'); setStep(1);
                  }}
                  className="flex-1 px-4 py-3 border border-[#1B3A6B]/20 text-[#1B3A6B] font-medium rounded-lg hover:bg-[#1B3A6B]/5 transition"
                >Cancel</button>
                {stkStatus === 'failed' && (
                  <button onClick={() => setStep(1)} className="flex-1 px-4 py-3 bg-[#1B3A6B] text-white font-medium rounded-lg hover:bg-[#152e55] transition">Try Again</button>
                )}
              </div>
            </div>
          </motion.div>
        </main>
        <Footer />
      </motion.div>
    );
  }

  // ─── STEP 1 ────────────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="min-h-screen bg-white">
      <AlertModal
        show={alertModal.show} type={alertModal.type} title={alertModal.title}
        message={alertModal.message} onConfirm={alertModal.onConfirm}
        confirmText={alertModal.confirmText} onCancel={alertModal.onCancel}
        cancelText={alertModal.cancelText} onClose={closeAlert}
      />
      <Header />

      <section className="bg-[#1B3A6B] py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-block px-4 py-1.5 border border-[#C9A84C] text-[#C9A84C] text-xs uppercase tracking-wider font-medium rounded-sm mb-4"
          >Event Registration</motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-4xl font-serif font-bold text-white"
          >Register for <span className="text-[#C9A84C]">{event.name}</span></motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-6 mt-4 text-white/70 text-sm"
          >
            <span className="flex items-center gap-2">
              <Calendar className="text-[#C9A84C]" size={16} />
              {new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="flex items-center gap-2"><MapPin className="text-[#C9A84C]" size={16} />{event.location}</span>
          </motion.div>
        </div>
      </section>

      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href="/events" className="inline-flex items-center text-[#1B3A6B] hover:text-[#152e55] font-medium text-sm transition-colors">
              <ArrowLeft size={16} className="mr-2" /> Back to Events
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <motion.div variants={scaleIn} initial="hidden" animate="visible" className="bg-white border border-[#1B3A6B]/10 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BadgeCheck className="text-[#C9A84C]" size={20} />
                <span className="text-xs uppercase tracking-wider text-[#1B3A6B]/50 font-medium">Event Details</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#1B3A6B] mb-4">{event.name}</h2>
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <Calendar className="text-[#C9A84C] mt-0.5" size={18} />
                  <div>
                    <p className="font-medium text-[#1B3A6B]">Date & Time</p>
                    <p className="text-[#1B3A6B]/60 text-sm">
                      {new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="text-[#C9A84C] mt-0.5" size={18} />
                  <div>
                    <p className="font-medium text-[#1B3A6B]">Location</p>
                    <p className="text-[#1B3A6B]/60 text-sm">{event.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="text-[#C9A84C] mt-0.5" size={18} />
                  <div>
                    <p className="font-medium text-[#1B3A6B]">Availability</p>
                    <p className="text-[#1B3A6B]/60 text-sm">{event.current_attendees}/{event.max_attendees} seats booked</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Ticket className="text-[#C9A84C] mt-0.5" size={18} />
                  <div>
                    <p className="font-medium text-[#1B3A6B]">Price</p>
                    <p className="text-[#1B3A6B] font-serif font-bold text-lg">KES {event.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-[#1B3A6B]/10">
                <h3 className="font-serif font-semibold text-[#1B3A6B] mb-2">About This Event</h3>
                <p className="text-[#1B3A6B]/60 text-sm leading-relaxed">{event.description}</p>
              </div>
            </motion.div>

            <motion.div variants={scaleIn} initial="hidden" animate="visible" transition={{ delay: 0.1 }} className="bg-white border border-[#1B3A6B]/10 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <User className="text-[#C9A84C]" size={20} />
                <span className="text-xs uppercase tracking-wider text-[#1B3A6B]/50 font-medium">Registration Form</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#1B3A6B] mb-6">Secure Your Spot</h2>

              {error && (
                <div className="bg-[#1B3A6B]/5 border border-[#1B3A6B]/20 text-[#1B3A6B] px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
              )}

              {!authUser && (
                <div className="bg-[#1B3A6B]/5 border border-[#1B3A6B]/10 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-[#C9A84C] mt-0.5" size={18} />
                    <div>
                      <p className="font-serif font-semibold text-[#1B3A6B]">Guest Registration</p>
                      <p className="text-sm text-[#1B3A6B]/60 mt-1">
                        <Link href="/login" className="text-[#C9A84C] hover:underline font-medium">Log in</Link> to save your information and track your registrations.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
  <div>
    <label className="block font-medium text-sm text-[#1B3A6B] mb-1.5">
      Full Name <span className="text-[#C9A84C]">*</span>
    </label>
    <div className="relative">
      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B3A6B]/30" size={16} />
      <input
        type="text" required value={formData.full_name}
        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
        className="w-full pl-10 pr-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition placeholder:text-[#1B3A6B]/30"
        placeholder="John Doe"
      />
    </div>
  </div>

  <div>
    <label className="block font-medium text-sm text-[#1B3A6B] mb-1.5">
      Email Address <span className="text-[#C9A84C]">*</span>
    </label>
    <div className="relative">
      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B3A6B]/30" size={16} />
      <input
        type="email" required value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        className="w-full pl-10 pr-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition placeholder:text-[#1B3A6B]/30"
        placeholder="john.doe@example.com"
      />
    </div>
  </div>

  <div>
    <label className="block font-medium text-sm text-[#1B3A6B] mb-1.5">
      Phone Number {paymentMethod === 'mpesa' && <span className="text-[#1B3A6B]/50">(M-PESA)</span>} <span className="text-[#C9A84C]">*</span>
    </label>
    <div className="relative">
      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B3A6B]/30" size={16} />
      <input
        type="tel" required value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        className="w-full pl-10 pr-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition placeholder:text-[#1B3A6B]/30"
        placeholder="0712345678"
      />
    </div>
    {paymentMethod === 'mpesa' ? (
      <p className="text-xs text-[#1B3A6B]/50 mt-1">You'll receive an M-PESA prompt on this number</p>
    ) : (
      <p className="text-xs text-[#1B3A6B]/50 mt-1">For registration confirmation and updates</p>
    )}
  </div>

  {/* Payment Method Selector — stays inside form; its buttons are type="button" */}
  {!showStripeCheckout && (
    <div className="pt-2">
      <label className="block font-medium text-sm text-[#1B3A6B] mb-3">
        Payment Method <span className="text-[#C9A84C]">*</span>
      </label>
      <PaymentMethodSelector
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        isProcessing={stkStatus === 'initiating' || stkStatus === 'pending'}
      />
    </div>
  )}

  {/* Payment Summary */}
  <div className="bg-[#1B3A6B]/5 p-5 rounded-lg border border-[#1B3A6B]/10">
    <h3 className="font-serif font-semibold text-[#1B3A6B] mb-3">Payment Summary</h3>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-[#1B3A6B]/60">Registration Fee:</span>
        <span className="font-medium text-[#1B3A6B]">KES {event.price.toLocaleString()}</span>
      </div>
      <div className="flex justify-between font-serif font-bold text-lg border-t border-[#1B3A6B]/10 pt-2">
        <span className="text-[#1B3A6B]">Total:</span>
        <span className="text-[#1B3A6B]">KES {event.price.toLocaleString()}</span>
      </div>
    </div>
  </div>

  {!showStripeCheckout && (
    <button
      type="submit"
      disabled={stkStatus === 'initiating' || stkStatus === 'pending' || paymentMethod === 'paypal'}
      className="w-full px-6 py-3.5 bg-[#1B3A6B] text-white font-medium rounded-lg hover:bg-[#152e55] transition disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {(stkStatus === 'initiating' || stkStatus === 'pending') ? (
        <><Loader2 className="animate-spin" size={18} />Processing...</>
      ) : (
        <>
          {paymentMethod === 'mpesa' && <Smartphone size={18} />}
          {paymentMethod === 'visa' && <CreditCard size={18} />}
          {paymentMethod === 'paypal' && <Globe size={18} />}
          Pay KES {event.price.toLocaleString()}
          {paymentMethod === 'mpesa' && ' via M-PESA'}
          {paymentMethod === 'visa' && ' by Card'}
          {paymentMethod === 'paypal' && ' with PayPal'}
          <ArrowRight size={16} />
        </>
      )}
    </button>
  )}

  <div className="flex items-center justify-center gap-2 text-xs text-[#1B3A6B]/40">
    <Shield size={14} />
    Secure payment via {paymentMethod === 'mpesa' ? 'M-PESA' : paymentMethod === 'visa' ? 'Card' : 'PayPal'}
  </div>

  {authUser && (
    <p className="text-sm text-[#1B3A6B]/50 text-center">
      Logged in as <span className="font-medium text-[#1B3A6B]">{authUser.email}</span>
    </p>
  )}
</form>

{/* Stripe PaymentElement OUTSIDE the form so its own submit button works */}
{showStripeCheckout && stripeClientSecret && (
  <div className="mt-5">
    <StripeCheckout
      clientSecret={stripeClientSecret}
      onSuccess={() => {
        setStripeClientSecret(null);
        setShowStripeCheckout(false);
        setStkStatus('success');
        setStep(3);
      }}
      onError={(msg) => {
        showAlert('error', 'Payment Failed', msg);
        setStripeClientSecret(null);
        setShowStripeCheckout(false);
        setStkStatus('failed');
      }}
    />
  </div>
)}
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </motion.div>
  );
}