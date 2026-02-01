"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { 
  CheckCircle, Users, User, CreditCard, Shield, ArrowRight, Lock, Mail, Phone, 
  Calendar, BookOpen, Gift, Smartphone, Loader2, AlertCircle, Key, Eye, EyeOff,
  X, Info
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants, Transition } from "framer-motion";

// Define types
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

// STK Push types
type STKPushStatus = 'idle' | 'initiating' | 'pending' | 'success' | 'failed' | 'cancelled';
type PaymentResponse = {
  success: boolean;
  message: string;
  checkoutRequestID?: string;
  merchantRequestID?: string;
  paymentId?: string;
  data?: any;
};

// Alert modal types
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

// Animation Variants
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const buttonHover = {
  scale: 1.02,
  y: -2,
  boxShadow: "0 10px 25px rgba(43, 76, 115, 0.3)",
  transition: { type: "spring" as const, stiffness: 400, damping: 15 },
};

const buttonTap = { scale: 0.98 };

const inputHover = {
  scale: 1.01,
  borderColor: "#2563eb",
  transition: { type: "spring" as const, stiffness: 300, damping: 20 },
};

const inputFocus = {
  scale: 1.02,
  borderColor: "#2B4C73",
  boxShadow: "0 0 0 3px rgba(43, 76, 115, 0.1)",
  transition: { type: "spring" as const, stiffness: 400, damping: 15 },
};

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
  
  // New alert modal state
  const [alertModal, setAlertModal] = useState<AlertModal>({
    show: false,
    type: 'error',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel'
  });
  
  const router = useRouter();
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [pollingInterval]);

  // Cleanup alert timeout on unmount
  useEffect(() => {
    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, []);

  // Show alert modal
  const showAlert = (
    type: AlertType,
    title: string,
    message: string,
    options?: {
      onConfirm?: () => void;
      confirmText?: string;
      onCancel?: () => void;
      cancelText?: string;
      autoClose?: number; // Auto close after milliseconds
    }
  ) => {
    // Clear any existing timeout
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = null;
    }

    setAlertModal({
      show: true,
      type,
      title,
      message,
      onConfirm: options?.onConfirm,
      confirmText: options?.confirmText || 'OK',
      onCancel: options?.onCancel,
      cancelText: options?.cancelText || 'Cancel'
    });

    // Auto close if specified
    if (options?.autoClose) {
      alertTimeoutRef.current = setTimeout(() => {
        hideAlert();
      }, options.autoClose);
    }
  };

  // Hide alert modal
  const hideAlert = () => {
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = null;
    }
    setAlertModal(prev => ({ ...prev, show: false }));
  };

  // Validate phone number format
  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^(07\d{8}|7\d{8}|\+2547\d{8}|2547\d{8})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  // Format phone for M-PESA (2547...)
  const formatPhoneForMpesa = (phone: string): string => {
    const cleaned = phone.replace(/\s/g, '');
    if (cleaned.startsWith('0')) return `254${cleaned.slice(1)}`;
    if (cleaned.startsWith('7')) return `254${cleaned}`;
    if (cleaned.startsWith('+254')) return cleaned.slice(1);
    return cleaned;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (paymentType === "registration") {
        // Registration form validation
        if (!formData.full_name || !formData.email || !formData.password || 
            !formData.graduation_year || !formData.course || !formData.county) {
          showAlert('error', 'Missing Information', 'Please fill in all required fields');
          setLoading(false);
          return;
        }

        // Validate phone for STK Push
        if (!formData.phone || !validatePhoneNumber(formData.phone)) {
          showAlert('error', 'Invalid Phone Number', 'Please enter a valid Kenyan phone number (e.g., 0712345678)');
          setLoading(false);
          return;
        }

        const registrationFee = 1500;
        
        // Set pending account number - will be updated after registration
        setPaybillInfo({
          amount: registrationFee,
          account_number: "PENDING", // Will be updated after registration
          payment_type: "registration",
          description: `New Member Registration - ${formData.full_name}`,
        });

        // Create user first, then initiate STK Push
        await handleRegistrationAndPayment();
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

        // Validate membership number format (100XXX)
        if (!/^100\d{3}$/.test(formData.membership_number)) {
          showAlert('error', 'Invalid Membership Number', 'Membership number must be in format 100XXX (e.g., 100121)');
          setLoading(false);
          return;
        }

        try {
          // Lookup user by membership number
          const lookupRes = await fetch(`/api/users/lookup?membership_number=${formData.membership_number}`);
          let userId = null;
          let userEmail = formData.email;
          let userName = formData.full_name;

          if (lookupRes.ok) {
            const lookupData = await lookupRes.json();
            userId = lookupData.user.id;
            userEmail = lookupData.user.email;
            userName = lookupData.user.full_name;
            
            // Verify email matches
            if (lookupData.user.email.toLowerCase() !== formData.email.toLowerCase()) {
              showAlert('error', 'Email Mismatch', 'Email address does not match our records for this membership number');
              setLoading(false);
              return;
            }
          } else {
            // User not found - show error
            showAlert('error', 'Member Not Found', 'Membership number not found. Please check and try again.');
            setLoading(false);
            return;
          }

          setPaybillInfo({
            amount: 1,
            account_number: formData.membership_number,
            payment_type: "renewal",
            description: `Membership Renewal - ${formData.renewal_year}`,
          });

          // Initiate STK Push for renewal with user ID
          await initiateSTKPush(1, 'renewal', userId, {
            membership_number: formData.membership_number,
            renewal_year: formData.renewal_year,
            full_name: formData.full_name,
            email: formData.email
          });
          
        } catch (lookupError) {
          console.error('User lookup error:', lookupError);
          showAlert('error', 'Verification Failed', 'Failed to verify membership. Please try again.');
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Payment initiation error:', err);
      showAlert('error', 'Payment Error', err instanceof Error ? err.message : "Payment initiation failed");
      setLoading(false);
    }
  };

  // Handle registration and payment
  const handleRegistrationAndPayment = async () => {
    try {
      // First, create the user account
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
          password: formData.password
        })
      });

      const registrationData = await registrationResponse.json();
      
      if (!registrationResponse.ok) {
        throw new Error(registrationData.error || 'Registration failed');
      }

      // Get the generated membership number from response
      const membershipNumber = registrationData.user?.user_metadata?.membership_number;
      
      if (!membershipNumber) {
        throw new Error('Failed to generate membership number');
      }

      // Update form with generated membership number
      setFormData(prev => ({
        ...prev,
        membership_number: membershipNumber
      }));

      // Update paybill info with actual membership number
      setPaybillInfo(prev => ({
        ...prev,
        account_number: membershipNumber
      }));

      // Then initiate STK Push
      await initiateSTKPush(1500, 'registration', registrationData.user?.id, {
        graduation_year: formData.graduation_year,
        course: formData.course,
        county: formData.county,
        membership_number: membershipNumber
      });

    } catch (err) {
      console.error('Registration error:', err);
      showAlert('error', 'Registration Failed', err instanceof Error ? err.message : "Registration failed");
      setLoading(false);
      throw err;
    }
  };

  // Initiate STK Push
  const initiateSTKPush = async (
    amount: number, 
    paymentType: 'registration' | 'renewal', 
    userId?: string,
    metadata?: any
  ) => {
    try {
      setStkStatus('initiating');
      
      const response = await fetch('/api/payments/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: formData.phone,
          amount: amount,
          paymentType: paymentType,
          userId: userId,
          userEmail: formData.email,
          userName: formData.full_name,
          metadata: metadata || {
            graduation_year: formData.graduation_year,
            course: formData.course,
            county: formData.county,
            membership_number: formData.membership_number,
            renewal_year: formData.renewal_year
          }
        })
      });

      const data: PaymentResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to initiate payment');
      }

      if (data.success && data.checkoutRequestID) {
        // Show success alert
        showAlert('success', 'Payment Request Sent', 
          'Please check your phone for the M-PESA prompt and enter your PIN to complete the payment.',
          { autoClose: 5000 }
        );
        
        setCheckoutRequestID(data.checkoutRequestID);
        setPaymentId(data.paymentId || '');
        setStkStatus('pending');
        setStep(2); // Move to payment status page
        
        // Start polling for payment status
        startPaymentPolling(data.checkoutRequestID);
      } else {
        throw new Error(data.message || 'Payment initiation failed');
      }
    } catch (err) {
      console.error('STK Push error:', err);
      setStkStatus('failed');
      showAlert('error', 'Payment Failed', err instanceof Error ? err.message : 'Failed to initiate payment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Start polling for payment status
  const startPaymentPolling = (checkoutID: string) => {
    const interval = setInterval(async () => {
      try {
         const response = await fetch(`/api/payments/${checkoutID}`);
        const data = await response.json();
        
        if (data.status === 'confirmed') {
          setStkStatus('success');
          clearInterval(interval);
          setPollingInterval(null);
          
          // Show success alert
          showAlert('success', 'Payment Confirmed!', 
            'Your payment has been successfully processed.',
            { autoClose: 3000 }
          );
          
          // Auto-redirect to success after 2 seconds
          setTimeout(() => {
            setStep(3);
          }, 2000);
          
        } else if (data.status === 'failed') {
          setStkStatus('failed');
          clearInterval(interval);
          setPollingInterval(null);
          showAlert('error', 'Payment Failed', 'The payment was not completed. Please try again.');
          
        } else if (data.status === 'cancelled') {
          setStkStatus('cancelled');
          clearInterval(interval);
          setPollingInterval(null);
          showAlert('warning', 'Payment Cancelled', 'The payment was cancelled.');
        }
        // If still pending, continue polling
      } catch (err) {
        console.error('Polling error:', err);
        showAlert('error', 'Connection Error', 'Failed to check payment status. Please refresh the page.');
      }
    }, 3000); // Poll every 3 seconds

    setPollingInterval(interval);
  };

  // Cancel payment polling
  const cancelPayment = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setStkStatus('cancelled');
    setStep(1);
    
    showAlert('info', 'Payment Cancelled', 'You can restart the payment process when ready.',
      { autoClose: 3000 }
    );
  };

  const paymentSteps = [
    "Enter your M-PESA phone number in the form",
    "Click 'Pay via M-PESA' button",
    "Check your phone for STK Push prompt",
    "Enter your M-PESA PIN when prompted",
    "Wait for payment confirmation"
  ];

  // Fixed TypeScript error: Added 'idle' to the object
  const stkStatusMessages: Record<STKPushStatus, string> = {
    idle: "Ready to initiate payment",
    initiating: "Initiating payment request...",
    pending: "Awaiting payment on your phone. Check for STK Push prompt.",
    success: "Payment confirmed successfully!",
    failed: "Payment failed. Please try again.",
    cancelled: "Payment cancelled."
  };

  // Success messages based on payment type
  const successMessages = {
    registration: {
      title: "Welcome to CHRMAA!",
      message: "Your account has been created and payment confirmed successfully! You can now log in and access your dashboard with full member benefits.",
      membershipNumber: (paymentType === "registration" && formData.membership_number) ? formData.membership_number : ''
    },
    renewal: {
      title: "Renewal Successful!",
      message: "Your membership renewal payment has been confirmed. Your membership is now active for the selected year."
    }
  };

  // Alert Modal Component
  const AlertModalComponent = () => {
    const getAlertStyles = () => {
      switch (alertModal.type) {
        case 'error':
          return {
            bg: 'bg-gradient-to-br from-red-50 to-pink-50',
            border: 'border-red-200',
            icon: <AlertCircle className="text-red-600" size={32} />,
            buttonBg: 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700',
            titleColor: 'text-red-900',
            messageColor: 'text-red-800'
          };
        case 'success':
          return {
            bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
            border: 'border-green-200',
            icon: <CheckCircle className="text-green-600" size={32} />,
            buttonBg: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
            titleColor: 'text-green-900',
            messageColor: 'text-green-800'
          };
        case 'warning':
          return {
            bg: 'bg-gradient-to-br from-amber-50 to-yellow-50',
            border: 'border-amber-200',
            icon: <AlertCircle className="text-amber-600" size={32} />,
            buttonBg: 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600',
            titleColor: 'text-amber-900',
            messageColor: 'text-amber-800'
          };
        case 'info':
          return {
            bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
            border: 'border-blue-200',
            icon: <Info className="text-blue-600" size={32} />,
            buttonBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
            titleColor: 'text-blue-900',
            messageColor: 'text-blue-800'
          };
      }
    };

    const styles = getAlertStyles();

    return (
      <AnimatePresence>
        {alertModal.show && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={hideAlert}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            
            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={`${styles.bg} border-2 ${styles.border} rounded-2xl shadow-2xl max-w-md w-full overflow-hidden`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0">
                      {styles.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-xl font-bold font-poppins mb-2 ${styles.titleColor}`}>
                        {alertModal.title}
                      </h3>
                      <p className={`${styles.messageColor} leading-relaxed`}>
                        {alertModal.message}
                      </p>
                    </div>
                    <button
                      onClick={hideAlert}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="flex gap-3">
                    {alertModal.onCancel && (
                      <button
                        onClick={alertModal.onCancel}
                        className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200"
                      >
                        {alertModal.cancelText}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (alertModal.onConfirm) {
                          alertModal.onConfirm();
                        }
                        hideAlert();
                      }}
                      className={`flex-1 px-4 py-3 ${styles.buttonBg} text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-200`}
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

  if (step === 3) {
    const successInfo = successMessages[paybillInfo.payment_type];
    
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-br from-gray-50 to-white"
      >
        {/* Alert Modal */}
        <AlertModalComponent />
        
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

                {paymentType === "registration" && formData.membership_number && (
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.15 }}
                    className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100"
                  >
                    <p className="text-sm text-blue-700 font-semibold mb-2">Your Membership Number:</p>
                    <p className="text-2xl font-bold text-blue-900 font-mono">{formData.membership_number}</p>
                    <p className="text-xs text-blue-600 mt-2">
                      Save this number! You'll need it for future renewals and member services.
                    </p>
                  </motion.div>
                )}
                
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.2 }}
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  <Link
                    href={paybillInfo.payment_type === "registration" ? "/login" : "/member/dashboard"}
                    className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300"
                  >
                    {paybillInfo.payment_type === "registration" ? "Go to Login" : "Go to Dashboard"}
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
        {/* Alert Modal */}
        <AlertModalComponent />
        
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
                    <Smartphone className="text-white" size={24} />
                  </div>
                  <h1 className="text-3xl font-bold font-poppins text-gray-900">
                    Complete Payment on Your Phone
                  </h1>
                </motion.div>

                {/* Payment Status Card */}
                <motion.div
                  variants={scaleIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className={`p-6 rounded-2xl mb-8 border ${
                    stkStatus === 'success' 
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-100'
                      : stkStatus === 'failed' || stkStatus === 'cancelled'
                      ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-100'
                      : 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold font-poppins mb-2">
                        {paybillInfo.payment_type === "registration" 
                          ? "Registration Fee" 
                          : "Renewal Fee"}
                      </h2>
                      <p className="text-sm opacity-80">{paybillInfo.description}</p>
                    </div>
                    <div className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full font-bold text-lg">
                      Ksh {paybillInfo.amount.toLocaleString()}
                    </div>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="flex items-center gap-3 mb-4">
                    {stkStatus === 'pending' && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full"
                      />
                    )}
                    {stkStatus === 'success' && (
                      <CheckCircle className="text-green-500" size={32} />
                    )}
                    {(stkStatus === 'failed' || stkStatus === 'cancelled') && (
                      <AlertCircle className="text-red-500" size={32} />
                    )}
                    <div>
                      <p className="font-semibold">
                        {stkStatus === 'initiating' && 'Initiating Payment...'}
                        {stkStatus === 'pending' && 'Awaiting Payment on Phone'}
                        {stkStatus === 'success' && 'Payment Confirmed!'}
                        {stkStatus === 'failed' && 'Payment Failed'}
                        {stkStatus === 'cancelled' && 'Payment Cancelled'}
                      </p>
                      <p className="text-sm opacity-80">
                        {stkStatusMessages[stkStatus]}
                      </p>
                    </div>
                  </div>

                  {/* Payment Instructions */}
                  <div className="space-y-3">
                    {paymentSteps.map((stepText, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-white/50 rounded-full flex items-center justify-center">
                          <span className="font-bold text-sm">{index + 1}</span>
                        </div>
                        <p className="text-sm">{stepText}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Phone Number Display */}
                <motion.div
                  variants={scaleIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl mb-8 border border-blue-100"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Phone className="text-blue-600" size={20} />
                    <div>
                      <div className="text-sm text-blue-800 font-medium">Payment will be sent to:</div>
                      <div className="text-xl font-bold text-gray-900">{formData.phone}</div>
                    </div>
                  </div>
                  <p className="text-sm text-blue-700">
                    💡 Keep your phone nearby. You should receive a payment prompt shortly.
                  </p>
                </motion.div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={cancelPayment}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200"
                  >
                    Cancel Payment
                  </button>
                  
                  {stkStatus === 'failed' && (
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-200"
                    >
                      Try Again
                    </button>
                  )}
                </div>

                {stkStatus === 'pending' && (
                  <motion.p
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-sm text-gray-500 text-center mt-4"
                  >
                    ⏳ Payment status updates automatically. Please wait...
                  </motion.p>
                )}
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
      {/* Alert Modal */}
      <AlertModalComponent />
      
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
                  Register as a new member or renew your membership
                </p>
              </motion.div>

              {/* Payment Type Selection */}
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
              >
                {[
                  { id: "registration" as const, label: "New Member", icon: BookOpen, color: "from-blue-500 to-cyan-600", desc: "Join CHRMAA community" },
                  { id: "renewal" as const, label: "Membership Renewal", icon: Users, color: "from-amber-500 to-yellow-500", desc: "Renew your annual membership" },
                ].map((type, index) => (
                  <motion.button
                    key={type.id}
                    variants={scaleIn}
                    custom={index}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPaymentType(type.id)}
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

              {/* Old error display (kept as fallback) */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 opacity-75"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}

              {/* Main form container */}
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
                            Phone Number (M-PESA) *
                          </label>
                          <div className="relative">
                            <motion.input
                              whileHover={inputHover}
                              whileFocus={inputFocus}
                              type="tel"
                              required
                              value={formData.phone}
                              onChange={(e) =>
                                setFormData({ ...formData, phone: e.target.value })
                              }
                              className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none transition-all duration-200"
                              placeholder="0712345678"
                              pattern="^(07\d{8}|7\d{8}|\+2547\d{8}|2547\d{8})$"
                              title="Enter a valid Kenyan phone number"
                            />
                            <Phone size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            You'll receive a prompt on this number
                          </p>
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

                        {/* Course Selection Field */}
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

                        {/* County Selection Field */}
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

                      <motion.div variants={scaleIn} className="relative">
                        <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                          <Lock size={16} className="text-gray-500" />
                          Password *
                        </label>
                        <motion.input
                          whileHover={inputHover}
                          whileFocus={inputFocus}
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={6}
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                          }
                          className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none transition-all duration-200"
                          placeholder="Minimum 6 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                        </button>
                      </motion.div>

                      <motion.div
                        variants={scaleIn}
                        className="bg-gradient-to-r from-blue-50 to-blue-50 p-6 rounded-2xl border border-blue-100 mt-6"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <Gift className="text-blue-600" size={24} />
                          <p className="text-blue-700 font-semibold text-lg">Registration Benefits:</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          <div className="flex items-start gap-2">
                            <CheckCircle size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">Lifetime membership access</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">Networking opportunities</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">Exclusive events & workshops</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">Member resources & discounts</span>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-blue-200">
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-bold text-blue-700">
                              Registration Fee:
                            </p>
                            <p className="text-2xl font-bold text-blue-700">
                              Ksh 1,500
                            </p>
                          </div>
                          <p className="text-sm text-blue-600 mt-2">
                            Payment will be requested via STK Push on your phone
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
                      
                      <div className="mt-8 border-t pt-8">
                        <div className="text-center">
                          <p className="text-gray-600 mb-4">
                            Already have a CHRMAA membership number?
                          </p>
                          <Link
                            href="/claim-account"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold hover:underline transition-colors"
                          >
                            <Key size={16} />
                            Click here to claim your account
                          </Link>
                        </div>
                      </div>
                    </>
                  ) : (
                    // Renewal form
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div variants={scaleIn}>
                          <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2">
                            Membership Number *
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
                            placeholder="e.g., 100121"
                            pattern="^100\d{3}$"
                            title="Enter your 6-digit membership number (e.g., 100121)"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Format: 100XXX (e.g., 100121)
                          </p>
                        </motion.div>

                        <motion.div variants={scaleIn}>
                          <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2">
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
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all duration-200"
                            placeholder="John Doe"
                          />
                        </motion.div>

                        <motion.div variants={scaleIn}>
                          <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2">
                            Email *
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
                            Phone Number (M-PESA) *
                          </label>
                          <div className="relative">
                            <motion.input
                              whileHover={inputHover}
                              whileFocus={inputFocus}
                              type="tel"
                              required
                              value={formData.phone}
                              onChange={(e) =>
                                setFormData({ ...formData, phone: e.target.value })
                              }
                              className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all duration-200"
                              placeholder="0712345678"
                              pattern="^(07\d{8}|7\d{8}|\+2547\d{8}|2547\d{8})$"
                              title="Enter a valid Kenyan phone number"
                            />
                            <Phone size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            You'll receive a prompt on this number
                          </p>
                        </motion.div>

                        <motion.div variants={scaleIn} className="md:col-span-2">
                          <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2">
                            Renewal Year *
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
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-amber-700">
                            Annual Membership Fee:
                          </p>
                          <p className="text-2xl font-bold text-amber-700">
                            Ksh 1,000
                          </p>
                        </div>
                        <p className="text-sm text-amber-600 mt-2">
                          Payment will be requested via STK Push on your phone
                        </p>
                      </motion.div>
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
                        <Smartphone size={20} />
                        {paymentType === "registration" ? "Register & Pay via M-PESA" : "Pay via M-PESA"}
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                      </>
                    )}
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

const CHRM_COURSES = [
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

const COUNTIES_IN_KENYA = [
  "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita Taveta", "Garissa", 
  "Wajir", "Mandera", "Marsabit", "Isiolo", "Meru", "Tharaka Nithi", "Embu", 
  "Kitui", "Machakos", "Makueni", "Nyandarua", "Nyeri", "Kirinyaga", "Murang'a", 
  "Kiambu", "Turkana", "West Pokot", "Samburu", "Trans Nzoia", "Uasin Gishu", 
  "Elgeyo Marakwet", "Nandi", "Baringo", "Laikipia", "Nakuru", "Narok", "Kajiado", 
  "Kericho", "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia", "Siaya", 
  "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi"
];