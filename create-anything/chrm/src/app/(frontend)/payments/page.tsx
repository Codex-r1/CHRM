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
  Eye,
  EyeOff,
  X,
  Info,
  GraduationCap,
  Shield,
  ArrowRight,
  Globe,
  CreditCard,
  Wallet,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
type FormData = {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  graduation_year: string;
  course: string;
  country: string;
};

type PaymentMethod = 'mpesa' | 'visa' | 'paypal';
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

export interface CardDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  cardDetails: CardDetails;
  setCardDetails: React.Dispatch<React.SetStateAction<CardDetails>>;
  handleSubmit?: (e: React.FormEvent) => void;
  isLoading?: boolean;
  currentFee?: number;
}

// ─── Helper Functions ──────────────────────────────────────────────────────
const detectCardType = (
  number: string
): "visa" | "mastercard" | "amex" | "unknown" => {
  const clean = number.replace(/\D/g, "");
  if (/^4/.test(clean)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(clean)) return "mastercard";
  if (/^3[47]/.test(clean)) return "amex";
  return "unknown";
};

const formatCardNumber = (value: string): string => {
  const clean = value.replace(/\D/g, "");
  const type = detectCardType(clean);

  if (type === "amex") {
    return clean
      .slice(0, 15)
      .replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_, p1, p2, p3) =>
        [p1, p2, p3].filter(Boolean).join(" ")
      );
  }
  return clean
    .slice(0, 16)
    .replace(/(\d{4})/g, "$1 ")
    .trim();
};

const formatExpiry = (value: string): string => {
  const clean = value.replace(/\D/g, "").slice(0, 4);
  if (clean.length >= 3) {
    return `${clean.slice(0, 2)}/${clean.slice(2)}`;
  }
  return clean;
};

// ─── Fee Logic ────────────────────────────────────────────────────────────────
const REGISTRATION_FEE = 1;

// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

// ─── PaymentMethodSelector Component ──────────────────────────────────────
const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  paymentMethod,
  setPaymentMethod,
  cardDetails,
  setCardDetails,
  handleSubmit,
  isLoading,
  currentFee,
}) => {
  const [hoveredMethod, setHoveredMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods = [
    {
      id: "mpesa" as PaymentMethod,
      label: "M-PESA",
      icon: "/m-pesa-logo_1.png",
      isImage: true,
      description: "Kenya",
    },
    {
      id: "visa" as PaymentMethod,
      label: "Visa / Mastercard",
      icon: "/mastercard.png",
      isImage: true,
      description: "Global",
    },
    {
      id: "paypal" as PaymentMethod,
      label: "PayPal",
      icon: "/paypal-3384015_1280.png",
      isImage: true,
      description: "Global",
    },
  ];

  const cardType = detectCardType(cardDetails.cardNumber);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardDetails((prev) => ({ ...prev, cardNumber: formatted }));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    setCardDetails((prev) => ({ ...prev, expiryDate: formatted }));
  };

  const getCardLogo = () => {
    switch (cardType) {
      case "visa":
        return (
           <img
            src="/images.png"
            alt="Card"
            className="w-8 h-6 object-contain opacity-40"
          />
        );
      case "mastercard":
        return (
          <img
            src="/mastercard.png"
            alt="Card"
            className="w-8 h-6 object-contain opacity-40"
          />
        );
      case "amex":
        return (
           <img
            src="/amex.png"
            alt="Card"
            className="w-8 h-6 object-contain opacity-40"
          />
        );
      default:
        return (
          <img
            src="/mastercard.png"
            alt="Card"
            className="w-8 h-6 object-contain opacity-40"
          />
        );
    }
  };

  // ─── Validate Card Details ──────────────────────────────────────────────
  const validateCardDetails = () => {
    if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length < 15) {
      alert('Please enter a valid card number');
      return false;
    }
    if (!cardDetails.expiryDate || cardDetails.expiryDate.length < 5) {
      alert('Please enter a valid expiry date (MM/YY)');
      return false;
    }
    if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
      alert('Please enter a valid CVV');
      return false;
    }
    if (!cardDetails.cardholderName) {
      alert('Please enter the cardholder name');
      return false;
    }
    return true;
  };

  // ─── Handle Card Payment ────────────────────────────────────────────────
  const handleCardPayment = async () => {
    if (!validateCardDetails()) return;
    if (isProcessing || isLoading) return;
    
    setIsProcessing(true);
    try {
      const paymentData = {
        paymentMethod: 'visa',
        cardDetails: {
          cardNumber: cardDetails.cardNumber,
          expiryDate: cardDetails.expiryDate,
          cvv: cardDetails.cvv,
          cardholderName: cardDetails.cardholderName,
        },
      };
      
      if (handleSubmit) {
        const syntheticEvent = new Event('submit') as any;
        syntheticEvent.paymentData = paymentData;
        await handleSubmit(syntheticEvent);
      }
    } catch (error) {
      console.error('Card payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Handle PayPal Payment ──────────────────────────────────────────────
  const handlePayPalPayment = async () => {
    if (isProcessing || isLoading) return;
    
    setIsProcessing(true);
    try {
      const paymentData = {
        paymentMethod: 'paypal',
      };
      
      if (handleSubmit) {
        const syntheticEvent = new Event('submit') as any;
        syntheticEvent.paymentData = paymentData;
        await handleSubmit(syntheticEvent);
      }
    } catch (error) {
      console.error('PayPal payment error:', error);
      alert('PayPal payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* SELECTION GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {paymentMethods.map((method) => {
          const isSelected = paymentMethod === method.id;
          const isHovered = hoveredMethod === method.id;

          return (
            <motion.button
              key={method.id}
              type="button"
              onClick={() => setPaymentMethod(method.id)}
              onMouseEnter={() => setHoveredMethod(method.id)}
              onMouseLeave={() => setHoveredMethod(null)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className={`relative p-4 border-2 rounded-lg transition-all duration-300 text-center group cursor-pointer ${
                isSelected
                  ? "border-[#C9A84C] bg-[#C9A84C]/5 shadow-sm"
                  : "border-[#1B3A6B]/10 hover:border-[#1B3A6B]/20 hover:bg-[#1B3A6B]/5"
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="payment-selection"
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#C9A84C] rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <CheckCircle className="w-3 h-3 text-white" />
                </motion.div>
              )}

              <motion.div
                animate={{
                  scale: isSelected || isHovered ? 1.05 : 1,
                  rotate: isHovered ? [0, -3, 3, 0] : 0,
                }}
                transition={{ duration: 0.3 }}
                className={`w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-3 transition-all duration-300 ${
                  isSelected
                    ? "bg-[#C9A84C]/10 shadow-md"
                    : "bg-[#1B3A6B]/5 group-hover:shadow-sm"
                }`}
              >
                {method.isImage ? (
                  <img
                    src={method.icon as string}
                    alt={method.label}
                    className={`w-10 h-10 object-contain transition-all duration-300 ${
                      isSelected ? "scale-110" : "group-hover:scale-105"
                    }`}
                  />
                ) : (
                  <method.icon
                    className={`transition-transform duration-300 ${
                      isSelected
                        ? "text-[#C9A84C]"
                        : "text-[#1B3A6B]/50 group-hover:text-[#1B3A6B]"
                    }`}
                    size={28}
                  />
                )}
              </motion.div>

              <p
                className={`text-sm font-medium transition-colors duration-300 ${
                  isSelected
                    ? "text-[#1B3A6B]"
                    : "text-[#1B3A6B]/70 group-hover:text-[#1B3A6B]"
                }`}
              >
                {method.label}
              </p>

              {isSelected && (
                <motion.div
                  layoutId="payment-underline"
                  className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#C9A84C] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: 32 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* METHOD FORMS */}
      <AnimatePresence mode="wait">
        {paymentMethod === "mpesa" && (
          <motion.div
            key="mpesa"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="p-5 bg-[#1B3A6B]/5 rounded-lg border border-[#1B3A6B]/10"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-[#1B3A6B]/10 rounded-lg mt-0.5">
                <img
                  src="/m-pesa-logo_1.png"
                  alt="M-PESA"
                  className="w-10 h-8 object-contain"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-[#1B3A6B]">
                  <span className="font-semibold">M-PESA Express:</span> You'll
                  receive an automated prompt on your phone to complete payment.
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-xs text-[#1B3A6B]/50">
                    <CheckCircle size={12} /> No account needed
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#1B3A6B]/50">
                    <Smartphone size={12} /> STK Push
                  </div>
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || isProcessing}
              className="w-full mt-4 py-3 bg-[#1B3A6B] text-white font-medium rounded-lg hover:bg-[#152e55] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading || isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Processing...
                </>
              ) : (
                <>
                  <Smartphone size={18} />
                  Pay Sh.{currentFee?.toLocaleString()} with M-PESA
                </>
              )}
            </button>
          </motion.div>
        )}

        {paymentMethod === "visa" && (
          <motion.div
            key="visa"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="p-5 bg-[#1B3A6B]/5 rounded-lg border border-[#1B3A6B]/10 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-serif font-bold text-[#1B3A6B] uppercase tracking-wider flex items-center gap-2">
                <CreditCard size={18} className="text-[#C9A84C]" />
                Card Details
              </h4>
              <div className="flex items-center gap-2">{getCardLogo()}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                Card Number <span className="text-[#C9A84C]">*</span>
              </label>
              <div className="relative">
                <CreditCard
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B3A6B]/30"
                  size={16}
                />
                <input
                  type="text"
                  required={paymentMethod === "visa"}
                  maxLength={19}
                  value={cardDetails.cardNumber}
                  onChange={handleCardNumberChange}
                  className="w-full pl-10 pr-20 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition font-mono bg-white"
                  placeholder={
                    cardType === "amex"
                      ? "3782 822463 10005"
                      : "4532 0123 4567 8910"
                  }
                  autoComplete="cc-number"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {cardType !== "unknown" && (
                    <span className="text-[10px] font-bold text-[#1B3A6B] bg-[#1B3A6B]/10 px-1.5 py-0.5 rounded uppercase">
                      {cardType}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                  Expiry Date <span className="text-[#C9A84C]">*</span>
                </label>
                <input
                  type="text"
                  required={paymentMethod === "visa"}
                  maxLength={5}
                  value={cardDetails.expiryDate}
                  onChange={handleExpiryChange}
                  className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition bg-white"
                  placeholder="MM/YY"
                  autoComplete="cc-exp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                  CVV <span className="text-[#C9A84C]">*</span>
                </label>
                <input
                  type="password"
                  required={paymentMethod === "visa"}
                  maxLength={cardType === "amex" ? 4 : 3}
                  value={cardDetails.cvv}
                  onChange={(e) =>
                    setCardDetails((prev) => ({
                      ...prev,
                      cvv: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition font-mono bg-white"
                  placeholder={cardType === "amex" ? "1234" : "123"}
                  autoComplete="cc-csc"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                Cardholder Name <span className="text-[#C9A84C]">*</span>
              </label>
              <input
                type="text"
                required={paymentMethod === "visa"}
                value={cardDetails.cardholderName}
                onChange={(e) =>
                  setCardDetails((prev) => ({
                    ...prev,
                    cardholderName: e.target.value,
                  }))
                }
                className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition bg-white"
                placeholder="Name on card"
                autoComplete="cc-name"
              />
            </div>

            <button
              type="button"
              onClick={handleCardPayment}
              disabled={isLoading || isProcessing}
              className="w-full py-3 bg-[#1B3A6B] text-white font-medium rounded-lg hover:bg-[#152e55] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading || isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  Pay Sh. {currentFee?.toLocaleString()} with Card
                </>
              )}
            </button>

            <div className="flex items-center gap-4 pt-2 text-xs text-[#1B3A6B]/40 border-t border-[#1B3A6B]/10">
              <span className="flex items-center gap-1">
                <Lock size={12} /> 256-bit SSL encryption
              </span>
              <span className="flex items-center gap-1">
                <Shield size={12} /> PCI compliant
              </span>
              {cardType !== "unknown" && cardDetails.cardNumber.length > 2 && (
                <span className="flex items-center gap-1 text-[#C9A84C]">
                  <CheckCircle size={12} /> {cardType} detected
                </span>
              )}
            </div>
          </motion.div>
        )}

        {paymentMethod === "paypal" && (
          <motion.div
            key="paypal"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="p-5 bg-[#1B3A6B]/5 rounded-lg border border-[#1B3A6B]/10"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-[#1B3A6B]/10 rounded-lg">
                <img
                  src="/paypal-3384015_1280.png"
                  alt="PayPal"
                  className="w-12 h-10 object-contain"
                />
              </div>
              
            </div>

            <button
              type="button"
              onClick={handlePayPalPayment}
              disabled={isLoading || isProcessing}
              className="w-full mt-4 py-3 bg-[#0070BA] text-white font-medium rounded-lg hover:bg-[#005EA6] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading || isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Redirecting to PayPal...
                </>
              ) : (
                <>
                  <Wallet size={18} />
                  Pay Sh. {currentFee?.toLocaleString()} with PayPal
                  <ArrowRight size={14} />
                </>
              )}
            </button>
            <p className="text-xs text-[#1B3A6B]/40 text-center mt-2">
              You'll be redirected to PayPal to complete your payment
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CombinedPaymentsPage() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    graduation_year: "",
    course: "",
    country: "",
  });
  const [step, setStep] = useState(1);
  const [paybillInfo, setPaybillInfo] = useState({
    amount: 0,
    account_number: "",
    payment_type: "registration" as const,
    description: "",
  });
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
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });

  const router = useRouter();
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const registrationFee = REGISTRATION_FEE;

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

      // Validate registration form
      if (!formData.full_name || !formData.email || !formData.password ||
        !formData.graduation_year || !formData.country) {
        showAlert('error', 'Missing Information', 'Please fill in all required fields');
        setLoading(false);
        return;
      }
      if (!formData.phone && paymentMethod === 'mpesa') {
        showAlert('error', 'Phone Number Required', 'Please enter your phone number for M-PESA payment');
        setLoading(false);
        return;
      }
      if (paymentMethod === 'mpesa' && !validatePhoneNumber(formData.phone)) {
        showAlert('error', 'Invalid Phone Number', 'Please enter a valid Kenyan phone number (e.g., 0712345678)');
        setLoading(false);
        return;
      }

      const fee = registrationFee;
      setPaybillInfo({
        amount: fee,
        account_number: "PENDING",
        payment_type: "registration",
        description: `New Member Registration - ${formData.full_name}`,
      });

      await handleRegistrationAndPayment(fee);
    } catch (err) {
      showAlert('error', 'Payment Error', err instanceof Error ? err.message : "Payment initiation failed");
      setLoading(false);
    }
  };

  const handleRegistrationAndPayment = async (fee: number) => {
    try {
      setLoading(true);

      // Check if user already exists
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
      await initiatePayment(fee, payment_id);

    } catch (err) {
      showAlert('error', 'Registration Failed', err instanceof Error ? err.message : "Registration failed");
      setLoading(false);
      throw err;
    }
  };

  // ─── Payment Initiation ───────────────────────────────────────────────────
  const initiatePayment = async (amount: number, payment_id?: string) => {
    try {
      setStkStatus('initiating');

      const paymentData: any = {
        amount,
        paymentType: 'registration',
        userEmail: formData.email,
        userName: formData.full_name,
        paymentMethod,
        metadata: {
          graduation_year: formData.graduation_year,
          course: formData.course,
          country: formData.country,
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
      }

      const endpoint = paymentMethod === 'mpesa' 
        ? '/api/payments/stk-push'
        : '/api/payments/cards';

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
              'Your payment has been processed successfully. Redirecting to login...',
              { autoClose: 3000 }
            );
            setTimeout(() => router.push('/login'), 3000);
          }
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

        if (data.status === 'confirmed') {
          setStkStatus('success');
          if (pollingInterval) clearInterval(pollingInterval);
          setPollingInterval(null);

          showAlert(
            'success',
            'Registration & Payment Complete! 🎉',
            'Your payment was confirmed. We have sent a confirmation link to your email address. Please open your inbox, click the confirmation link, and then log in to access your dashboard.',
            {
              confirmText: 'Go to Login',
              onConfirm: () => router.push('/login'),
            }
          );
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
                  ) : (
                    <Wallet className="text-white" size={32} />
                  )}
                </div>
                <h2 className="text-2xl font-serif font-bold">Processing Payment</h2>
                <p className="text-white/70 text-sm mt-1">
                  {paymentMethod === 'mpesa' && 'M-PESA prompt sent to'}
                  {paymentMethod === 'visa' && 'Processing card payment for'}
                  {paymentMethod === 'paypal' && 'Redirecting to PayPal for'}
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
          {/* Header */}
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
                  Join the Old Turians
                </h1>
                <p className="text-[#1B3A6B]/60 text-sm mt-1">
                  Become part of a distinguished community of Turi alumni worldwide
                </p>
              </div>
            </div>
            <div className="border-b border-[#1B3A6B]/10" />
          </motion.div>

          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="bg-white border border-[#1B3A6B]/10 rounded-lg shadow-sm overflow-hidden"
          >
            <form onSubmit={handleSubmit}>
              <div className="p-6 md:p-8 space-y-6">
                {/* Personal Details */}
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

                {/* Academic Details */}
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
                  <PaymentMethodSelector 
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    cardDetails={cardDetails}
                    setCardDetails={setCardDetails}
                    handleSubmit={handleSubmit}
                    isLoading={loading}
                    currentFee={registrationFee}
                  />
                </div>

                {/* Registration Summary */}
                <div className="border-2 border-[#C9A84C]/30 bg-[#C9A84C]/5 rounded-lg p-5 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <Gift className="text-[#C9A84C]" size={20} />
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
                  <div className="border-t border-[#C9A84C]/20 pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#1B3A6B]/50 font-medium">
                        Registration Fee
                      </p>
                      <p className="text-2xl font-serif font-bold text-[#1B3A6B]">
                        KES {registrationFee.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-[#1B3A6B]/60 text-center">
                  Already have an account?{" "}
                  <Link href="/login" className="text-[#C9A84C] font-medium hover:underline">
                    Login here
                  </Link>
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