"use client";

import { useState, FormEvent, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  CheckCircle,
  User,
  Mail,
  Phone,
  Lock,
  Calendar,
  BookOpen,
  Gift,
  Smartphone,
  Loader2,
  AlertCircle,
  Key,
  Eye,
  EyeOff,
  X,
  Info,
  MapPin,
  GraduationCap,
  Shield,
  Users,
  ArrowRight,
  BadgeCheck,
  Clock,
  Building,
  Globe,
  Award,
  CreditCard,
  Wallet,
  Building2,
  Sparkles,
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

type PaymentMethod = 'mpesa' | 'visa' | 'paypal' | 'bank_transfer';
type STKPushStatus = 'idle' | 'initiating' | 'pending' | 'success' | 'failed' | 'cancelled';
type PaymentResponse = {
  success: boolean;
  message: string;
  checkoutRequestID?: string;
  merchantRequestID?: string;
  paymentId?: string;
  data?: any;
  redirect_url?: string;
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
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CombinedPaymentsPage() {
  const [paymentType, setPaymentType] = useState<"renewal" | "registration">("registration");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
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
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    accountNumber: '',
    referenceNumber: '',
  });

  const router = useRouter();
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const registrationFee = useMemo(() => getRegistrationFee(formData.graduation_year), [formData.graduation_year]);
  const feeLabel = registrationFee !== null ? `KES ${registrationFee.toLocaleString()}` : '—';
  const currentFee = paymentType === 'registration' ? registrationFee : FEE_RENEWAL;

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

  const validateCardNumber = (number: string): boolean => {
    return /^\d{16}$/.test(number.replace(/\s/g, ''));
  };

  const validateExpiry = (expiry: string): boolean => {
    return /^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(expiry);
  };

  const validateCVV = (cvv: string): boolean => {
    return /^\d{3,4}$/.test(cvv);
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate based on payment method
      if (paymentMethod === 'visa') {
        if (!validateCardNumber(cardDetails.cardNumber)) {
          showAlert('error', 'Invalid Card Number', 'Please enter a valid 16-digit card number');
          setLoading(false);
          return;
        }
        if (!validateExpiry(cardDetails.expiryDate)) {
          showAlert('error', 'Invalid Expiry Date', 'Please enter a valid expiry date (MM/YY)');
          setLoading(false);
          return;
        }
        if (!validateCVV(cardDetails.cvv)) {
          showAlert('error', 'Invalid CVV', 'Please enter a valid CVV (3-4 digits)');
          setLoading(false);
          return;
        }
        if (!cardDetails.cardholderName) {
          showAlert('error', 'Missing Cardholder Name', 'Please enter the name on your card');
          setLoading(false);
          return;
        }
      }

      if (paymentMethod === 'bank_transfer') {
        if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.referenceNumber) {
          showAlert('error', 'Missing Bank Details', 'Please fill in all bank transfer details');
          setLoading(false);
          return;
        }
      }

      if (paymentType === "registration") {
        if (!formData.full_name || !formData.email || !formData.password ||
          !formData.graduation_year || !formData.country) {
          showAlert('error', 'Missing Information', 'Please fill in all required fields');
          setLoading(false);
          return;
        }
        if (!formData.phone && (paymentMethod === 'mpesa' || paymentMethod === 'paypal')) {
          showAlert('error', 'Phone Number Required', 'Please enter your phone number');
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
        if (!formData.membership_number || !formData.full_name || !formData.email) {
          showAlert('error', 'Missing Information', 'Please fill in all required fields');
          setLoading(false);
          return;
        }
        if (!formData.phone && (paymentMethod === 'mpesa' || paymentMethod === 'paypal')) {
          showAlert('error', 'Phone Number Required', 'Please enter your phone number');
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

          await initiatePayment(FEE_RENEWAL, 'renewal', userId, {
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
        phone: formData.phone || '',
        graduation_year: formData.graduation_year,
        course: formData.course,
        country: formData.country,
        password: formData.password,
        registration_fee: fee,
      };

      const registrationResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      const registrationResult = await registrationResponse.json();

      if (!registrationResponse.ok) {
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
                setPaymentId(registrationResult.payment_id);
              }
            }
          );
          setLoading(false);
          return;
        }

        throw new Error(registrationResult.error || registrationResult.message || 'Registration failed');
      }

      const payment_id = registrationResult.payment_id;
      await initiatePayment(fee, 'registration', undefined, {
        graduation_year: formData.graduation_year,
        course: formData.course,
        country: formData.country,
      }, payment_id);

    } catch (err) {
      showAlert('error', 'Registration Failed', err instanceof Error ? err.message : "Registration failed");
      setLoading(false);
      throw err;
    }
  };

  // ─── Payment Initiation ───────────────────────────────────────────────────
  const initiatePayment = async (
    amount: number,
    type: 'registration' | 'renewal',
    userId?: string,
    metadata?: any,
    payment_id?: string
  ) => {
    try {
      setStkStatus('initiating');

      const paymentData: any = {
        amount,
        paymentType: type,
        userId,
        userEmail: formData.email,
        userName: formData.full_name,
        paymentMethod,
        metadata: metadata || {
          graduation_year: formData.graduation_year,
          course: formData.course,
          country: formData.country,
          membership_number: formData.membership_number,
          renewal_year: formData.renewal_year
        },
        payment_id,
      };

      // Add payment method specific data
      if (paymentMethod === 'mpesa') {
        paymentData.phoneNumber = formData.phone;
      } else if (paymentMethod === 'visa') {
        paymentData.cardDetails = {
          cardNumber: cardDetails.cardNumber.replace(/\s/g, ''),
          expiryDate: cardDetails.expiryDate,
          cvv: cardDetails.cvv,
          cardholderName: cardDetails.cardholderName,
        };
      } else if (paymentMethod === 'bank_transfer') {
        paymentData.bankDetails = {
          bankName: bankDetails.bankName,
          accountNumber: bankDetails.accountNumber,
          referenceNumber: bankDetails.referenceNumber,
        };
      }

      const endpoint = paymentMethod === 'mpesa' 
        ? '/api/payments/stk-push'
        : '/api/payments/global';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      const data: PaymentResponse = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to initiate payment');

      if (data.success) {
        // Handle different payment methods
        if (paymentMethod === 'mpesa' && data.checkoutRequestID) {
          showAlert('success', 'Payment Request Sent',
            'Please check your phone for the M-PESA prompt and enter your PIN to complete the payment.',
            { autoClose: 5000 }
          );
          setCheckoutRequestID(data.checkoutRequestID);
          setPaymentId(data.paymentId || '');
          setStkStatus('pending');
          setStep(2);
          startPaymentPolling(data.checkoutRequestID);
        } else if (paymentMethod === 'visa' || paymentMethod === 'paypal') {
          // Redirect to payment gateway
          if (data.redirect_url) {
            showAlert('info', 'Redirecting to Payment Gateway',
              'You will be redirected to complete your payment securely.',
              { autoClose: 3000 }
            );
            setTimeout(() => {
              window.location.href = data.redirect_url as string;
            }, 2000);
          } else {
            // Handle card payment success
            setPaymentId(data.paymentId || '');
            setStkStatus('success');
            showAlert('success', 'Payment Successful!',
              'Your payment has been processed successfully.',
              { autoClose: 3000 }
            );
            setTimeout(() => {
              if (type === 'registration') {
                router.push('/login');
              } else {
                router.push('/member/dashboard');
              }
            }, 3000);
          }
        } else if (paymentMethod === 'bank_transfer') {
          // Show bank transfer instructions
          setPaymentId(data.paymentId || '');
          setStkStatus('success');
          showAlert('success', 'Bank Transfer Initiated',
            `Please transfer KES ${amount.toLocaleString()} to the account provided. Reference: ${bankDetails.referenceNumber}`,
            { autoClose: 8000 }
          );
          setTimeout(() => {
            if (type === 'registration') {
              router.push('/login');
            } else {
              router.push('/member/dashboard');
            }
          }, 3000);
        }
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
            showAlert('success', 'Welcome to Old Turians!',
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
    pending: "Awaiting payment confirmation...",
    success: "Payment confirmed successfully!",
    failed: "Payment failed. Please try again.",
    cancelled: "Payment cancelled."
  };

  // ─── Alert Modal ───────────────────────────────────────────────────────────
  const AlertModalComponent = () => {
    const styles = {
      error: { border: 'border-[#1B3A6B]', iconBg: 'bg-[#1B3A6B]/10', icon: <AlertCircle className="text-[#1B3A6B]" size={24} />, btnBg: 'bg-[#1B3A6B] hover:bg-[#152e55]', titleColor: 'text-[#1B3A6B]' },
      success: { border: 'border-[#C9A84C]', iconBg: 'bg-[#C9A84C]/10', icon: <CheckCircle className="text-[#C9A84C]" size={24} />, btnBg: 'bg-[#C9A84C] hover:bg-[#b8973a]', titleColor: 'text-[#C9A84C]' },
      warning: { border: 'border-[#C9A84C]', iconBg: 'bg-[#C9A84C]/10', icon: <AlertCircle className="text-[#C9A84C]" size={24} />, btnBg: 'bg-[#C9A84C] hover:bg-[#b8973a]', titleColor: 'text-[#C9A84C]' },
      info: { border: 'border-[#1B3A6B]', iconBg: 'bg-[#1B3A6B]/10', icon: <Info className="text-[#1B3A6B]" size={24} />, btnBg: 'bg-[#1B3A6B] hover:bg-[#152e55]', titleColor: 'text-[#1B3A6B]' },
    }[alertModal.type];

    return (
      <AnimatePresence>
        {alertModal.show && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={hideAlert}
              className="fixed inset-0 bg-[#1B3A6B]/20 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={`bg-white border-2 ${styles.border} rounded-lg shadow-2xl max-w-md w-full overflow-hidden`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-5">
                    <div className={`${styles.iconBg} p-2.5 rounded-full flex-shrink-0`}>
                      {styles.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-serif font-bold mb-1 ${styles.titleColor}`}>
                        {alertModal.title}
                      </h3>
                      <p className="text-[#1B3A6B]/70 text-sm leading-relaxed">
                        {alertModal.message}
                      </p>
                    </div>
                    <button
                      onClick={hideAlert}
                      className="text-[#1B3A6B]/30 hover:text-[#1B3A6B]/60 transition-colors flex-shrink-0"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="flex gap-3">
                    {alertModal.onCancel && (
                      <button
                        onClick={alertModal.onCancel}
                        className="flex-1 px-4 py-2.5 border border-[#1B3A6B]/20 text-[#1B3A6B] font-medium rounded-lg hover:bg-[#1B3A6B]/5 transition text-sm"
                      >
                        {alertModal.cancelText}
                      </button>
                    )}
                    <button
                      onClick={() => { alertModal.onConfirm?.(); hideAlert(); }}
                      className={`flex-1 px-4 py-2.5 ${styles.btnBg} text-white font-medium rounded-lg transition text-sm`}
                    >
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

  // ─── Payment Method Selection ────────────────────────────────────────────
  const PaymentMethodSelector = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { id: 'mpesa' as PaymentMethod, label: 'M-PESA', icon: Smartphone, description: 'Kenya', color: '#1B3A6B' },
          { id: 'visa' as PaymentMethod, label: 'Visa / Mastercard', icon: CreditCard, description: 'Global', color: '#1B3A6B' },
          { id: 'paypal' as PaymentMethod, label: 'PayPal', icon: Wallet, description: 'Global', color: '#1B3A6B' },
          { id: 'bank_transfer' as PaymentMethod, label: 'Bank Transfer', icon: Building2, description: 'Global', color: '#1B3A6B' },
        ].map(method => (
          <button
            key={method.id}
            type="button"
            onClick={() => setPaymentMethod(method.id)}
            className={`p-4 border-2 rounded-lg transition-all duration-200 text-center ${
              paymentMethod === method.id
                ? 'border-[#C9A84C] bg-[#C9A84C]/5'
                : 'border-[#1B3A6B]/10 hover:border-[#1B3A6B]/20'
            }`}
          >
            <method.icon className={`mx-auto mb-2 ${
              paymentMethod === method.id ? 'text-[#C9A84C]' : 'text-[#1B3A6B]/50'
            }`} size={24} />
            <p className={`text-sm font-medium ${
              paymentMethod === method.id ? 'text-[#1B3A6B]' : 'text-[#1B3A6B]/70'
            }`}>
              {method.label}
            </p>
            <p className="text-xs text-[#1B3A6B]/40">{method.description}</p>
          </button>
        ))}
      </div>

      {/* Payment method specific forms */}
      {paymentMethod === 'mpesa' && (
        <div className="p-4 bg-[#1B3A6B]/5 rounded-lg border border-[#1B3A6B]/10">
          <p className="text-sm text-[#1B3A6B]">
            <span className="font-medium">M-PESA:</span> You'll receive a prompt on your phone to complete payment.
          </p>
        </div>
      )}

      {paymentMethod === 'visa' && (
        <div className="p-4 bg-[#1B3A6B]/5 rounded-lg border border-[#1B3A6B]/10 space-y-4">
          <h4 className="text-sm font-serif font-bold text-[#1B3A6B] uppercase tracking-wider">Card Details</h4>
          <div>
            <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
              Card Number <span className="text-[#C9A84C]">*</span>
            </label>
            <input
              type="text"
              required={paymentMethod === 'visa'}
              maxLength={19}
              value={cardDetails.cardNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
                setCardDetails({...cardDetails, cardNumber: value});
              }}
              className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition placeholder:text-[#1B3A6B]/30 font-mono"
              placeholder="1234 5678 9012 3456"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                Expiry Date <span className="text-[#C9A84C]">*</span>
              </label>
              <input
                type="text"
                required={paymentMethod === 'visa'}
                maxLength={5}
                value={cardDetails.expiryDate}
                onChange={(e) => setCardDetails({...cardDetails, expiryDate: e.target.value})}
                className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition placeholder:text-[#1B3A6B]/30"
                placeholder="MM/YY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                CVV <span className="text-[#C9A84C]">*</span>
              </label>
              <input
                type="password"
                required={paymentMethod === 'visa'}
                maxLength={4}
                value={cardDetails.cvv}
                onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition placeholder:text-[#1B3A6B]/30"
                placeholder="***"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
              Cardholder Name <span className="text-[#C9A84C]">*</span>
            </label>
            <input
              type="text"
              required={paymentMethod === 'visa'}
              value={cardDetails.cardholderName}
              onChange={(e) => setCardDetails({...cardDetails, cardholderName: e.target.value})}
              className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition placeholder:text-[#1B3A6B]/30"
              placeholder="Name on card"
            />
          </div>
          <p className="text-xs text-[#1B3A6B]/50 flex items-center gap-1">
            <Lock size={12} /> Your payment is secured with SSL encryption
          </p>
        </div>
      )}

      {paymentMethod === 'paypal' && (
        <div className="p-4 bg-[#1B3A6B]/5 rounded-lg border border-[#1B3A6B]/10">
          <p className="text-sm text-[#1B3A6B]">
            <span className="font-medium">PayPal:</span> You'll be redirected to PayPal to complete your payment securely.
          </p>
          <button
            type="button"
            className="mt-3 px-6 py-2 bg-[#1B3A6B] text-white font-medium rounded-lg hover:bg-[#152e55] transition text-sm"
            onClick={() => {
              // Trigger PayPal redirect
              handleSubmit(new Event('submit') as any);
            }}
          >
            Pay with PayPal
          </button>
        </div>
      )}

      {paymentMethod === 'bank_transfer' && (
        <div className="p-4 bg-[#1B3A6B]/5 rounded-lg border border-[#1B3A6B]/10 space-y-4">
          <h4 className="text-sm font-serif font-bold text-[#1B3A6B] uppercase tracking-wider">Bank Transfer Details</h4>
          <div>
            <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
              Bank Name <span className="text-[#C9A84C]">*</span>
            </label>
            <select
              required={paymentMethod === 'bank_transfer'}
              value={bankDetails.bankName}
              onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
              className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition bg-white"
            >
              <option value="">Select bank</option>
              <option value="Equity Bank">Equity Bank</option>
              <option value="KCB Bank">KCB Bank</option>
              <option value="Cooperative Bank">Cooperative Bank</option>
              <option value="Absa Bank">Absa Bank</option>
              <option value="Standard Chartered">Standard Chartered</option>
              <option value="Citibank">Citibank</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
              Account Number <span className="text-[#C9A84C]">*</span>
            </label>
            <input
              type="text"
              required={paymentMethod === 'bank_transfer'}
              value={bankDetails.accountNumber}
              onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
              className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition placeholder:text-[#1B3A6B]/30"
              placeholder="Enter account number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
              Reference Number <span className="text-[#C9A84C]">*</span>
            </label>
            <input
              type="text"
              required={paymentMethod === 'bank_transfer'}
              value={bankDetails.referenceNumber}
              onChange={(e) => setBankDetails({...bankDetails, referenceNumber: e.target.value})}
              className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition placeholder:text-[#1B3A6B]/30"
              placeholder="e.g. TURI-REG-2024"
            />
          </div>
          <p className="text-xs text-[#1B3A6B]/50">Reference will be used to identify your payment</p>
        </div>
      )}
    </div>
  );

  // ─── Step 2: Waiting for payment ──────────────────────────────────────────
  if (step === 2) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-white"
      >
        <AlertModalComponent />
        <Header />
        <main className="flex-1 py-16 px-4">
          <div className="max-w-lg mx-auto">
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-lg shadow-lg border border-[#1B3A6B]/10 overflow-hidden"
            >
              <div className="bg-[#1B3A6B] p-8 text-white text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  {paymentMethod === 'mpesa' ? (
                    <Smartphone className="text-white" size={32} />
                  ) : paymentMethod === 'visa' ? (
                    <CreditCard className="text-white" size={32} />
                  ) : paymentMethod === 'paypal' ? (
                    <Wallet className="text-white" size={32} />
                  ) : (
                    <Building2 className="text-white" size={32} />
                  )}
                </div>
                <h2 className="text-2xl font-serif font-bold">Processing Payment</h2>
                <p className="text-white/70 text-sm mt-1">
                  {paymentMethod === 'mpesa' && 'M-PESA prompt sent to'}
                  {paymentMethod === 'visa' && 'Processing card payment for'}
                  {paymentMethod === 'paypal' && 'Redirecting to PayPal for'}
                  {paymentMethod === 'bank_transfer' && 'Bank transfer initiated for'}
                </p>
                {paymentMethod === 'mpesa' && (
                  <p className="text-[#C9A84C] font-serif text-xl mt-1">{formData.phone}</p>
                )}
                <p className="text-[#C9A84C] font-serif text-xl mt-1">KES {paybillInfo.amount.toLocaleString()}</p>
              </div>

              <div className="p-6 space-y-5">
                <div className={`p-4 rounded-lg border ${
                  stkStatus === 'success' ? 'bg-[#C9A84C]/5 border-[#C9A84C]/30' :
                  stkStatus === 'failed' || stkStatus === 'cancelled' ? 'bg-[#1B3A6B]/5 border-[#1B3A6B]/20' :
                  'bg-[#1B3A6B]/5 border-[#1B3A6B]/20'
                }`}>
                  <div className="flex items-center gap-3">
                    {stkStatus === 'pending' && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-7 h-7 border-2 border-[#C9A84C] border-t-transparent rounded-full flex-shrink-0"
                      />
                    )}
                    {stkStatus === 'success' && <CheckCircle className="text-[#C9A84C] flex-shrink-0" size={28} />}
                    {(stkStatus === 'failed' || stkStatus === 'cancelled') && (
                      <AlertCircle className="text-[#1B3A6B] flex-shrink-0" size={28} />
                    )}
                    <div>
                      <p className="font-serif font-semibold text-[#1B3A6B]">
                        {stkStatus === 'pending' && 'Awaiting payment confirmation...'}
                        {stkStatus === 'success' && 'Payment Confirmed!'}
                        {stkStatus === 'failed' && 'Payment Failed'}
                        {stkStatus === 'cancelled' && 'Payment Cancelled'}
                      </p>
                      <p className="text-xs text-[#1B3A6B]/60 mt-0.5">{stkStatusMessages[stkStatus]}</p>
                    </div>
                  </div>
                </div>

                {paymentMethod === 'mpesa' && stkStatus === 'pending' && (
                  <div className="space-y-3 border-t border-[#1B3A6B]/10 pt-4">
                    {[
                      "Check your phone for the M-PESA prompt",
                      "Enter your M-PESA PIN to authorize payment",
                      "Wait for confirmation"
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-[#1B3A6B] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">{i + 1}</span>
                        </div>
                        <p className="text-sm text-[#1B3A6B]/70">{s}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={cancelPayment}
                    className="flex-1 px-4 py-3 border border-[#1B3A6B]/20 text-[#1B3A6B] font-medium rounded-lg hover:bg-[#1B3A6B]/5 transition text-sm"
                  >
                    Cancel
                  </button>
                  {stkStatus === 'failed' && (
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 px-4 py-3 bg-[#1B3A6B] text-white font-medium rounded-lg hover:bg-[#152e55] transition text-sm"
                    >
                      Try Again
                    </button>
                  )}
                </div>

                {stkStatus === 'pending' && (
                  <p className="text-xs text-[#1B3A6B]/50 text-center">
                    Payment status updates automatically. Please wait...
                  </p>
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-white"
    >
      <AlertModalComponent />
      <Header />

      <main className="flex-1 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[#C9A84C]/10 rounded-lg flex items-center justify-center">
                <Shield className="text-[#C9A84C]" size={24} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1B3A6B]">
                  {paymentType === "registration" ? "Join the Old Turians" : "Renew Your Membership"}
                </h1>
                <p className="text-[#1B3A6B]/60 text-sm mt-1">
                  {paymentType === "registration"
                    ? "Become part of a distinguished community of Turi alumni worldwide"
                    : "Maintain your connection to the Turi community"}
                </p>
              </div>
            </div>
            <div className="border-b border-[#1B3A6B]/10" />
          </motion.div>

          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-4 mb-8"
          >
            {[
              {
                id: "registration" as const,
                label: "New Member",
                icon: GraduationCap,
                description: "First-time registration"
              },
              {
                id: "renewal" as const,
                label: "Renew Membership",
                icon: BadgeCheck,
                description: "Annual renewal"
              },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setPaymentType(t.id)}
                className={`p-5 text-left border-2 rounded-lg transition-all duration-200 ${
                  paymentType === t.id
                    ? "border-[#C9A84C] bg-[#C9A84C]/5"
                    : "border-[#1B3A6B]/10 hover:border-[#1B3A6B]/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    paymentType === t.id ? "bg-[#C9A84C]/20" : "bg-[#1B3A6B]/5"
                  }`}>
                    <t.icon className={paymentType === t.id ? "text-[#C9A84C]" : "text-[#1B3A6B]"} size={20} />
                  </div>
                  <div>
                    <p className={`font-serif font-bold ${
                      paymentType === t.id ? "text-[#1B3A6B]" : "text-[#1B3A6B]/80"
                    }`}>
                      {t.label}
                    </p>
                    <p className="text-xs text-[#1B3A6B]/50">{t.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </motion.div>

          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="bg-white border border-[#1B3A6B]/10 rounded-lg shadow-sm overflow-hidden"
          >
            <form onSubmit={handleSubmit}>
              {paymentType === "registration" ? (
                <div className="p-6 md:p-8 space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-8 h-8 bg-[#1B3A6B] text-white rounded-full flex items-center justify-center text-xs font-serif font-bold">
                        1
                      </div>
                      <h2 className="text-sm font-serif font-bold text-[#1B3A6B] uppercase tracking-wider">
                        Personal Details
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                          Full Name <span className="text-[#C9A84C]">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={formData.full_name}
                            onChange={e => setFormData({...formData, full_name: e.target.value})}
                            className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition placeholder:text-[#1B3A6B]/30"
                            placeholder="Your full name"
                          />
                          <User className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B3A6B]/30" size={16} />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                          Email Address <span className="text-[#C9A84C]">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition placeholder:text-[#1B3A6B]/30"
                            placeholder="you@email.com"
                          />
                          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B3A6B]/30" size={16} />
                        </div>
                      </div>

                      {paymentMethod === 'mpesa' && (
                        <div>
                          <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                            Phone Number <span className="text-[#C9A84C]">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="tel"
                              required={paymentMethod === 'mpesa'}
                              value={formData.phone}
                              onChange={e => setFormData({...formData, phone: e.target.value})}
                              className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition placeholder:text-[#1B3A6B]/30"
                              placeholder="0712345678"
                            />
                            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B3A6B]/30" size={16} />
                          </div>
                          <p className="text-xs text-[#1B3A6B]/50 mt-1">M-PESA prompt will be sent here</p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                          Create Password <span className="text-[#C9A84C]">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            minLength={6}
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            className="w-full px-4 py-2.5 pr-10 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition placeholder:text-[#1B3A6B]/30"
                            placeholder="Min. 6 characters"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B3A6B]/30 hover:text-[#1B3A6B]/60 transition"
                          >
                            {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#1B3A6B]/10 pt-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-8 h-8 bg-[#C9A84C] text-white rounded-full flex items-center justify-center text-xs font-serif font-bold">
                        2
                      </div>
                      <h2 className="text-sm font-serif font-bold text-[#1B3A6B] uppercase tracking-wider">
                        Academic Details
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                          Graduation Year <span className="text-[#C9A84C]">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="2000"
                            max="2030"
                            required
                            value={formData.graduation_year}
                            onChange={e => setFormData({...formData, graduation_year: e.target.value})}
                            className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition placeholder:text-[#1B3A6B]/30"
                            placeholder="e.g. 2023"
                          />
                          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B3A6B]/30" size={16} />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                          Course of Study <span className="text-[#1B3A6B]/50">(Optional)</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.course}
                            onChange={e => setFormData({...formData, course: e.target.value})}
                            className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition placeholder:text-[#1B3A6B]/30"
                            placeholder="Your course"
                          />
                          <BookOpen className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B3A6B]/30" size={16} />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                          Country of Residence <span className="text-[#C9A84C]">*</span>
                        </label>
                        <div className="relative">
                          <select
                            required
                            value={formData.country}
                            onChange={e => setFormData({...formData, country: e.target.value})}
                            className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition bg-white appearance-none"
                          >
                            <option value="">Select your country</option>
                            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <Globe className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B3A6B]/30 pointer-events-none" size={16} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Section */}
                  <div className="border-t border-[#1B3A6B]/10 pt-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-8 h-8 bg-[#C9A84C] text-white rounded-full flex items-center justify-center text-xs font-serif font-bold">
                        3
                      </div>
                      <h2 className="text-sm font-serif font-bold text-[#1B3A6B] uppercase tracking-wider">
                        Payment Method
                      </h2>
                    </div>
                    <PaymentMethodSelector />
                  </div>

                  <div className={`border-2 rounded-lg p-5 transition-all duration-300 ${
                    currentFee !== null
                      ? currentFee === 1
                        ? 'border-[#C9A84C] bg-[#C9A84C]/5'
                        : 'border-[#1B3A6B]/20 bg-[#1B3A6B]/5'
                      : 'border-[#1B3A6B]/10 bg-[#1B3A6B]/5'
                  }`}>
                    <div className="flex items-center gap-3 mb-4">
                      <Gift className={currentFee === 1 ? "text-[#C9A84C]" : "text-[#1B3A6B]"} size={20} />
                      <p className="font-serif font-bold text-[#1B3A6B]">Membership Benefits</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                      {[
                        "Lifetime membership access",
                        "Networking opportunities",
                        "Exclusive events & workshops",
                        "Member resources & discounts"
                      ].map(b => (
                        <div key={b} className="flex items-start gap-2">
                          <CheckCircle size={14} className="text-[#C9A84C] mt-0.5 flex-shrink-0" />
                          <span className="text-[#1B3A6B]/70 text-xs">{b}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-[#1B3A6B]/10 pt-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#1B3A6B]/50 font-medium">
                          {paymentType === 'registration' ? 'Registration Fee' : 'Renewal Fee'}
                        </p>
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={feeLabel}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={`text-2xl font-serif font-bold ${
                              currentFee === 1 ? 'text-[#C9A84C]' :
                              currentFee === 1500 ? 'text-[#1B3A6B]' : 'text-[#1B3A6B]/50'
                            }`}
                          >
                            {currentFee !== null ? `KES ${currentFee.toLocaleString()}` : '—'}
                          </motion.p>
                        </AnimatePresence>
                      </div>
                      {currentFee === 1 && (
                        <div className="px-3 py-1 bg-[#C9A84C] text-white text-xs font-medium rounded-full">
                          Free Registration
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-[#1B3A6B]/60 text-center">
                    Already have an account?{" "}
                    <Link href="/login" className="text-[#C9A84C] font-medium hover:underline">
                      Login here
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="p-6 md:p-8 space-y-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 bg-[#1B3A6B] text-white rounded-full flex items-center justify-center text-xs font-serif font-bold">
                      1
                    </div>
                    <h2 className="text-sm font-serif font-bold text-[#1B3A6B] uppercase tracking-wider">
                      Verify Membership
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                        Membership Number <span className="text-[#C9A84C]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={formData.membership_number}
                          onChange={e => setFormData({...formData, membership_number: e.target.value})}
                          className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition font-mono placeholder:text-[#1B3A6B]/30"
                          placeholder="e.g. 100121"
                          pattern="^100\d{3}$"
                        />
                        <BadgeCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B3A6B]/30" size={16} />
                      </div>
                      <p className="text-xs text-[#1B3A6B]/50 mt-1">Format: 100XXX</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                        Full Name <span className="text-[#C9A84C]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={formData.full_name}
                          onChange={e => setFormData({...formData, full_name: e.target.value})}
                          className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition placeholder:text-[#1B3A6B]/30"
                          placeholder="John Doe"
                        />
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B3A6B]/30" size={16} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                        Email Address <span className="text-[#C9A84C]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition placeholder:text-[#1B3A6B]/30"
                          placeholder="john@email.com"
                        />
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B3A6B]/30" size={16} />
                      </div>
                    </div>

                    {paymentMethod === 'mpesa' && (
                      <div>
                        <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                          Phone Number <span className="text-[#C9A84C]">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            required={paymentMethod === 'mpesa'}
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition placeholder:text-[#1B3A6B]/30"
                            placeholder="0712345678"
                          />
                          <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B3A6B]/30" size={16} />
                        </div>
                        <p className="text-xs text-[#1B3A6B]/50 mt-1">M-PESA prompt will be sent here</p>
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                        Renewal Year <span className="text-[#C9A84C]">*</span>
                      </label>
                      <div className="relative">
                        <select
                          required
                          value={formData.renewal_year}
                          onChange={e => setFormData({...formData, renewal_year: e.target.value})}
                          className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition bg-white appearance-none"
                        >
                          {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() + i).map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B3A6B]/30 pointer-events-none" size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Section for Renewal */}
                  <div className="border-t border-[#1B3A6B]/10 pt-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-8 h-8 bg-[#C9A84C] text-white rounded-full flex items-center justify-center text-xs font-serif font-bold">
                        2
                      </div>
                      <h2 className="text-sm font-serif font-bold text-[#1B3A6B] uppercase tracking-wider">
                        Payment Method
                      </h2>
                    </div>
                    <PaymentMethodSelector />
                  </div>

                  <div className="border-2 border-[#1B3A6B]/10 rounded-lg p-5 bg-[#1B3A6B]/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-serif font-bold text-[#1B3A6B]">Annual Membership Renewal</p>
                        <p className="text-sm text-[#1B3A6B]/60 mt-0.5">
                          Paid via {paymentMethod === 'mpesa' ? 'M-PESA' : paymentMethod === 'visa' ? 'Card' : paymentMethod === 'paypal' ? 'PayPal' : 'Bank Transfer'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-serif font-bold text-[#1B3A6B]">
                          KES {FEE_RENEWAL.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className={`px-6 md:px-8 pb-6 md:pb-8 ${paymentType === 'registration' ? '' : 'pt-0'}`}>
                <button
                  type="submit"
                  disabled={loading || (paymentType === 'registration' && currentFee === null)}
                  className={`w-full py-4 bg-[#1B3A6B] text-white font-serif font-bold rounded-lg transition shadow-sm flex items-center justify-center gap-3 text-base ${
                    !loading && currentFee !== null ? 'hover:bg-[#152e55]' : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <><Loader2 className="animate-spin" size={18} />Processing...</>
                  ) : (
                    <>
                      {paymentMethod === 'mpesa' && <Smartphone size={18} />}
                      {paymentMethod === 'visa' && <CreditCard size={18} />}
                      {paymentMethod === 'paypal' && <Wallet size={18} />}
                      {paymentMethod === 'bank_transfer' && <Building2 size={18} />}
                      {paymentType === "registration"
                        ? `Register & Pay ${currentFee ? `KES ${currentFee.toLocaleString()}` : ''}`
                        : `Pay KES ${FEE_RENEWAL.toLocaleString()}`}
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
                <p className="text-xs text-[#1B3A6B]/40 text-center mt-3 flex items-center justify-center gap-1">
                  <Lock size={12} /> Secure payment processed via {
                    paymentMethod === 'mpesa' ? 'M-PESA' :
                    paymentMethod === 'visa' ? 'Stripe/PesaPal' :
                    paymentMethod === 'paypal' ? 'PayPal' :
                    'Bank Transfer'
                  }
                </p>
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