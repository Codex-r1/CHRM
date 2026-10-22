"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  CheckCircle, User, Mail, Phone, Lock, Calendar, BookOpen,
  Smartphone, Loader2, AlertCircle, Eye, EyeOff, X, Info,
  Shield, ArrowRight, Globe, CreditCard, Wallet, Sparkles
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { FEATURES } from "../../(backend)/lib/features/features";

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

type AlertType = 'error' | 'success' | 'info' | 'warning';
type AlertModal = {
  show: boolean;
  type: AlertType;
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
};

export interface CardDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const detectCardType = (number: string) => {
  const clean = number.replace(/\D/g, "");
  if (/^4/.test(clean)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(clean)) return "mastercard";
  if (/^3[47]/.test(clean)) return "amex";
  return "unknown";
};

const formatCardNumber = (value: string) => {
  const clean = value.replace(/\D/g, "");
  if (detectCardType(clean) === "amex") {
    return clean.slice(0, 15).replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_, p1, p2, p3) => [p1, p2, p3].filter(Boolean).join(" "));
  }
  return clean.slice(0, 16).replace(/(\d{4})/g, "$1 ").trim();
};

const formatExpiry = (value: string) => {
  const clean = value.replace(/\D/g, "").slice(0, 4);
  return clean.length >= 3 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean;
};

const REGISTRATION_FEE = 1; // Update as needed

// ─── Animations ───────────────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

// ─── Payment Selector (Simplified) ───────────────────────────────────────────
const PaymentMethodSelector = ({
  paymentMethod, setPaymentMethod, cardDetails, setCardDetails, currentFee, isLoading
}: {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (m: PaymentMethod) => void;
  cardDetails: CardDetails;
  setCardDetails: React.Dispatch<React.SetStateAction<CardDetails>>;
  currentFee: number;
  isLoading: boolean;
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const methods = [
    { id: 'mpesa' as PaymentMethod, label: 'M-PESA', sub: 'Kenya', icon: Smartphone, enabled: true },
    { id: 'visa' as PaymentMethod, label: 'Card', sub: 'Visa / Mastercard', icon: CreditCard, enabled: true },
    { id: 'paypal' as PaymentMethod, label: 'PayPal', sub: 'Global', icon: Wallet, enabled: FEATURES.paypal.enabled },
  ];

  const cardType = detectCardType(cardDetails.cardNumber);

  return (
    <div className="space-y-6">
      {/* Method Selection - Minimal horizontal list */}
      <div className="grid grid-cols-3 gap-2">
        {methods.map((m) => {
          const isSelected = paymentMethod === m.id;
          const isDisabled = !m.enabled;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => !isDisabled && setPaymentMethod(m.id)}
              disabled={isDisabled}
              className={`relative flex flex-col items-center justify-center gap-1 border py-3 px-2 transition-all ${
                isDisabled
                  ? "opacity-40 cursor-not-allowed border-gray-200 bg-gray-50"
                  : isSelected
                  ? "border-[#1B3A6B] bg-[#1B3A6B]/5"
                  : "border-[#1B3A6B]/15 hover:border-[#1B3A6B]/30"
              }`}
            >
              {isDisabled && (
                <span className="absolute -top-2 right-1 text-[8px] font-bold uppercase bg-white px-1 border border-[#C9A84C] text-[#C9A84C]">
                  Soon
                </span>
              )}
              <m.icon size={18} className={isSelected ? "text-[#1B3A6B]" : "text-[#1B3A6B]/50"} />
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${isSelected ? "text-[#1B3A6B]" : "text-[#1B3A6B]/50"}`}>
                {m.label}
              </span>
              <span className="text-[9px] text-[#1B3A6B]/40">{m.sub}</span>
            </button>
          );
        })}
      </div>

      {/* Payment Details - Contextual Reveal */}
      <AnimatePresence mode="wait">
        {paymentMethod === 'mpesa' && (
          <motion.div key="mpesa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-[#F9F9F8] p-4 border border-[#1B3A6B]/10 text-sm text-[#1B3A6B]/80">
            You will receive an STK push on your phone. Enter your M-PESA PIN to authorize the payment of <strong>KES {currentFee.toLocaleString()}</strong>.
          </motion.div>
        )}

        {paymentMethod === 'visa' && (
          <motion.div key="visa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1B3A6B] mb-1">Card Number</label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={19}
                  value={cardDetails.cardNumber}
                  onChange={(e) => setCardDetails(p => ({ ...p, cardNumber: formatCardNumber(e.target.value) }))}
                  className="w-full border-b border-[#1B3A6B]/30 bg-transparent py-2 text-sm text-[#1B3A6B] focus:border-[#1B3A6B] focus:outline-none transition-colors font-mono"
                  placeholder="0000 0000 0000 0000"
                />
                {cardType !== 'unknown' && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-[#C9A84C]">{cardType}</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1B3A6B] mb-1">Expiry</label>
                <input
                  type="text"
                  maxLength={5}
                  value={cardDetails.expiryDate}
                  onChange={(e) => setCardDetails(p => ({ ...p, expiryDate: formatExpiry(e.target.value) }))}
                  className="w-full border-b border-[#1B3A6B]/30 bg-transparent py-2 text-sm text-[#1B3A6B] focus:border-[#1B3A6B] focus:outline-none transition-colors"
                  placeholder="MM/YY"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1B3A6B] mb-1">CVV</label>
                <input
                  type="password"
                  maxLength={4}
                  value={cardDetails.cvv}
                  onChange={(e) => setCardDetails(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '') }))}
                  className="w-full border-b border-[#1B3A6B]/30 bg-transparent py-2 text-sm text-[#1B3A6B] focus:border-[#1B3A6B] focus:outline-none transition-colors"
                  placeholder="•••"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1B3A6B] mb-1">Cardholder Name</label>
              <input
                type="text"
                value={cardDetails.cardholderName}
                onChange={(e) => setCardDetails(p => ({ ...p, cardholderName: e.target.value }))}
                className="w-full border-b border-[#1B3A6B]/30 bg-transparent py-2 text-sm text-[#1B3A6B] focus:border-[#1B3A6B] focus:outline-none transition-colors"
                placeholder="Name as it appears on card"
              />
            </div>
          </motion.div>
        )}

        {paymentMethod === 'paypal' && (
          <motion.div key="paypal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-[#F9F9F8] p-4 border border-[#1B3A6B]/10 text-sm text-[#1B3A6B]/80">
            You will be redirected to PayPal to complete your payment securely.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RegistrationPage() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [formData, setFormData] = useState<FormData>({
    full_name: "", email: "", phone: "", password: "",
    graduation_year: "", course: "", country: "",
  });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [stkStatus, setStkStatus] = useState<STKPushStatus>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [checkoutRequestID, setCheckoutRequestID] = useState('');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [alertModal, setAlertModal] = useState<AlertModal>({ show: false, type: 'error', title: '', message: '', confirmText: 'OK' });
  const [cardDetails, setCardDetails] = useState<CardDetails>({ cardNumber: '', expiryDate: '', cvv: '', cardholderName: '' });

  const router = useRouter();
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => { if (pollingInterval) clearInterval(pollingInterval); };
  }, [pollingInterval]);

  const showAlert = (type: AlertType, title: string, message: string, options?: { onConfirm?: () => void, confirmText?: string }) => {
    setAlertModal({ show: true, type, title, message, onConfirm: options?.onConfirm, confirmText: options?.confirmText || 'OK' });
  };
  const hideAlert = () => setAlertModal(prev => ({ ...prev, show: false }));

  // ─── Submit Logic (Same as before, just cleaned up) ─────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.full_name || !formData.email || !formData.password || !formData.graduation_year || !formData.country) {
        throw new Error("Please fill in all required fields.");
      }
      if (paymentMethod === 'mpesa' && !formData.phone) throw new Error("Phone number is required for M-PESA.");
      
      // Check user exists
      const check = await fetch(`/api/users/check?email=${encodeURIComponent(formData.email)}`);
      const checkData = await check.json();
      if (checkData.exists) {
        showAlert('error', 'Account Exists', 'This email is already registered.', { confirmText: 'Login', onConfirm: () => router.push('/login') });
        setLoading(false);
        return;
      }

      // Initiate Payment
      await initiatePayment(REGISTRATION_FEE);
    } catch (err: any) {
      showAlert('error', 'Error', err.message);
      setLoading(false);
    }
  };

  const initiatePayment = async (amount: number) => {
    setStkStatus('initiating');
   const payload: any = {
  phoneNumber: formData.phone,
  amount: amount,
  paymentType: 'registration',
  userEmail: formData.email,
  userName: formData.full_name,
  paymentMethod,
  registrationData: { ...formData },
  metadata: { graduation_year: formData.graduation_year, course: formData.course, country: formData.country },
};

if (paymentMethod === 'visa') payload.cardDetails = cardDetails;
    if (paymentMethod === 'visa') payload.cardDetails = cardDetails;

    const endpoint = paymentMethod === 'mpesa' ? '/api/payments/stk-push' : '/api/payments/cards';
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.message || "Payment failed");

    if (paymentMethod === 'mpesa' && data.checkoutRequestID) {
      setCheckoutRequestID(data.checkoutRequestID);
      setStkStatus('pending');
      setStep(2);
      startPolling(data.checkoutRequestID);
    } else if (data.redirect_url) {
      window.location.href = data.redirect_url;
    } else {
      router.push('/login');
    }
  };

  const startPolling = (id: string) => {
    let count = 0;
    const interval = setInterval(async () => {
      count++;
      if (count > 60) { clearInterval(interval); setStkStatus('failed'); return; }
      const res = await fetch(`/api/payments/${id}?verify_user=true`);
      const data = await res.json();
      if (data.status === 'confirmed') {
        clearInterval(interval); setStkStatus('success');
        showAlert('success', 'Welcome to the Society', 'Registration complete. Please check your email to verify and log in.', { confirmText: 'Login', onConfirm: () => router.push('/login') });
      } else if (data.status === 'failed') {
        clearInterval(interval); setStkStatus('failed');
      }
    }, 3000);
    setPollingInterval(interval);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-sm w-full text-center space-y-6">
            {stkStatus === 'pending' && <Loader2 className="animate-spin mx-auto text-[#1B3A6B]" size={40} />}
            {stkStatus === 'success' && <CheckCircle className="mx-auto text-[#C9A84C]" size={40} />}
            {stkStatus === 'failed' && <AlertCircle className="mx-auto text-[#1B3A6B]" size={40} />}
            
            <h2 className="font-serif text-2xl text-[#1B3A6B]">
              {stkStatus === 'pending' ? 'Check Your Phone' : stkStatus === 'success' ? 'Registration Complete' : 'Payment Failed'}
            </h2>
            <p className="text-sm text-[#1B3A6B]/60">
              {stkStatus === 'pending' ? `Enter your M-PESA PIN on ${formData.phone} to complete payment.` : 'Please contact support if payment was deducted.'}
            </p>
            {stkStatus === 'failed' && (
              <button onClick={() => setStep(1)} className="text-sm font-semibold text-[#C9A84C] underline">Try again</button>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 py-12 px-4 sm:px-6">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-xl mx-auto">
          
          {/* Editorial Header */}
          <div className="mb-10 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C9A84C]">Membership Registration</span>
            <h1 className="mt-2 font-serif text-3xl md:text-4xl text-[#1B3A6B]">Join the Old Turians</h1>
            <p className="mt-2 text-sm text-[#1B3A6B]/60">Become part of a distinguished community of Turi alumni worldwide.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section 1: Identity */}
            <div className="space-y-6">
              <h2 className="font-serif text-lg text-[#1B3A6B] border-b border-[#1B3A6B]/10 pb-2">Personal Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]/60 mb-1">Full Name</label>
                  <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full border-b border-[#1B3A6B]/30 bg-transparent py-2.5 text-sm text-[#1B3A6B] focus:border-[#1B3A6B] focus:outline-none transition-colors" placeholder="e.g. John Kamau" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]/60 mb-1">Email Address</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border-b border-[#1B3A6B]/30 bg-transparent py-2.5 text-sm text-[#1B3A6B] focus:border-[#1B3A6B] focus:outline-none transition-colors" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]/60 mb-1">Password</label>
                  <div className="relative">
                    <input required type={showPassword ? 'text' : 'password'} minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border-b border-[#1B3A6B]/30 bg-transparent py-2.5 pr-8 text-sm text-[#1B3A6B] focus:border-[#1B3A6B] focus:outline-none transition-colors" placeholder="Min. 6 characters" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-[#1B3A6B]/40 hover:text-[#1B3A6B]">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Academic */}
            <div className="space-y-6">
              <h2 className="font-serif text-lg text-[#1B3A6B] border-b border-[#1B3A6B]/10 pb-2">Academic Details</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]/60 mb-1">Graduation Year</label>
                  <input required type="number" min="2000" max="2030" value={formData.graduation_year} onChange={e => setFormData({...formData, graduation_year: e.target.value})} className="w-full border-b border-[#1B3A6B]/30 bg-transparent py-2.5 text-sm text-[#1B3A6B] focus:border-[#1B3A6B] focus:outline-none transition-colors" placeholder="2023" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]/60 mb-1">Course <span className="text-[10px] normal-case text-[#1B3A6B]/40">(Optional)</span></label>
                  <input type="text" value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})} className="w-full border-b border-[#1B3A6B]/30 bg-transparent py-2.5 text-sm text-[#1B3A6B] focus:border-[#1B3A6B] focus:outline-none transition-colors" placeholder="e.g. Sciences" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]/60 mb-1">Country of Residence</label>
                <select required value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full border-b border-[#1B3A6B]/30 bg-transparent py-2.5 text-sm text-[#1B3A6B] focus:border-[#1B3A6B] focus:outline-none transition-colors appearance-none">
                  <option value="">Select Country</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Section 3: Payment */}
            <div className="space-y-6">
              <h2 className="font-serif text-lg text-[#1B3A6B] border-b border-[#1B3A6B]/10 pb-2">Payment Method</h2>
              
              {paymentMethod === 'mpesa' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]/60 mb-1">M-PESA Phone Number</label>
                  <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border-b border-[#1B3A6B]/30 bg-transparent py-2.5 text-sm text-[#1B3A6B] focus:border-[#1B3A6B] focus:outline-none transition-colors" placeholder="0712 345 678" />
                </div>
              )}

              <PaymentMethodSelector paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} cardDetails={cardDetails} setCardDetails={setCardDetails} currentFee={REGISTRATION_FEE} isLoading={loading} />
            </div>

            {/* Order Summary & Submit */}
            <div className="pt-6 border-t border-[#1B3A6B]/10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]/50">Total Due</p>
                  <p className="font-serif text-2xl font-bold text-[#1B3A6B]">KES {REGISTRATION_FEE.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#1B3A6B]/40 uppercase tracking-wider">Lifetime Membership</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1B3A6B] py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-[#152e55] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Complete Registration'}
              </button>
              
              <p className="mt-4 text-center text-[11px] text-[#1B3A6B]/40">
                Already a member? <Link href="/login" className="text-[#C9A84C] hover:underline">Sign in to your account</Link>
              </p>
            </div>
          </form>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas",
  "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin",
  "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei",
  "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon",
  "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia",
  "Comoros", "Congo, Democratic Republic of the", "Congo, Republic of the", 
  "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", 
  "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", 
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", 
  "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", 
  "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", 
  "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", 
  "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", 
  "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", 
  "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", 
  "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", 
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", 
  "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", 
  "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", 
  "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", 
  "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", 
  "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", 
  "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", 
  "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", 
  "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", 
  "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", 
  "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", 
  "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", 
  "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", 
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", 
  "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", 
  "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", 
  "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", 
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];