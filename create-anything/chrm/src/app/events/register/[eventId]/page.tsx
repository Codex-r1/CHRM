"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { 
  Calendar, MapPin, Users, CheckCircle, 
  AlertCircle, Smartphone, ArrowRight, Loader2,
  Ticket, ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useAuth } from "../../../context/auth";

// Animation Variants
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.6,
      ease: "easeOut" 
    } 
  },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { 
      duration: 0.6, 
      ease: "easeOut" 
    },
  },
};

type EventType = {
  id: string;
  name: string;
  description: string;
  event_date: string;
  location: string;
  price: number;
  member_discount: number;
  max_attendees: number;
  current_attendees: number;
  status: string;
  is_active: boolean;
  image_url?: string;
};

type STKPushStatus = 'idle' | 'initiating' | 'pending' | 'success' | 'failed' | 'cancelled';

export default function EventRegistrationPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.eventId as string | undefined;
  
  const { user: authUser, loading: authLoading } = useAuth();
  
  const [event, setEvent] = useState<EventType | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [stkStatus, setStkStatus] = useState<STKPushStatus>('idle');
  const [checkoutRequestID, setCheckoutRequestID] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    membership_number: "",
    is_alumni_member: "yes"
  });

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [pollingInterval]);

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      // Check if eventId exists
      if (!eventId) {
        console.error('No event ID in URL params:', params);
        setError("No event ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching event with ID:', eventId);
        
        const response = await fetch(`/api/events/${eventId}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Event fetch failed:', response.status, errorData);
          throw new Error(errorData.error || `Event not found (${response.status})`);
        }
        
        const data = await response.json();
        console.log('Event data received:', data);
        setEvent(data);
        setError("");
      } catch (err: any) {
        console.error('Event fetch error:', err);
        setError(err.message || "Event not found or is no longer available");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, params]);

  // Pre-fill user data if logged in
  useEffect(() => {
    if (authUser && !authLoading) {
      setFormData(prev => ({
        ...prev,
        full_name: authUser.user_metadata?.full_name || "",
        email: authUser.email || "",
        phone: authUser.user_metadata?.phone || "",
        membership_number: authUser.user_metadata?.membership_number || ""
      }));
    }
  }, [authUser, authLoading]);

  const calculateMemberPrice = () => {
    if (!event) return 0;
    return event.price - (event.price * event.member_discount) / 100;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^(07\d{8}|7\d{8}|\+2547\d{8}|2547\d{8})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
if (!event) {
    setError("Event information is still loading. Please wait.");
    return;
  }

    // Validation
    if (!formData.full_name || !formData.email || !formData.phone) {
      setError("Please fill in all required fields");
      return;
    }

    if (!validatePhoneNumber(formData.phone)) {
      setError("Please enter a valid Kenyan phone number (e.g., 0712345678)");
      return;
    }

    if (formData.is_alumni_member === "yes" && !formData.membership_number) {
      setError("Please enter your membership number");
      return;
    }

    try {
      setStkStatus('initiating');
      
      // Get user ID if logged in or lookup by membership number
      let userId = authUser?.id;
      let userEmail = authUser?.email || formData.email;
      let userName = authUser?.user_metadata?.full_name || formData.full_name;

      // If member but not logged in, try to find user
      if (formData.is_alumni_member === "yes" && !userId && formData.membership_number) {
        try {
          const response = await fetch(`/api/users/lookup?membership_number=${formData.membership_number}`);
          if (response.ok) {
            const data = await response.json();
            userId = data.user.id;
            userEmail = data.user.email;
            userName = data.user.full_name;
          }
        } catch (lookupError) {
          console.log("User lookup failed, continuing as guest registration");
        }
      }

      const amount = formData.is_alumni_member === "yes" ? calculateMemberPrice() : event!.price;
      
      // Initiate STK Push
      const response = await fetch('/api/payments/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: formData.phone,
          amount: amount,
          paymentType: 'event',
          userId: userId,
          userEmail: userEmail,
          userName: userName,
          description: `Event Registration - ${event!.name}`,
          metadata: {
            event_id: eventId,
            event_name: event!.name,
            membership_number: formData.membership_number || null,
            is_alumni_member: formData.is_alumni_member,
            registration_type: formData.is_alumni_member === "yes" ? "member" : "guest"
          }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate payment');
      }

      if (data.success && data.data.checkoutRequestID) {
        setCheckoutRequestID(data.data.checkoutRequestID);
        setPaymentId(data.data.paymentId);
        setStkStatus('pending');
        setStep(2);
        
        // Start polling
        startPaymentPolling(data.data.checkoutRequestID);
      } else {
        throw new Error(data.message || 'Payment initiation failed');
      }

    } catch (err: any) {
      console.error('Registration error:', err);
      setStkStatus('failed');
      setError(err.message || 'Failed to register for event');
    }
  };

  // Start polling for payment status
  const startPaymentPolling = (checkoutID: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/status/${checkoutID}`);
        const data = await response.json();
        
        if (data.status === 'confirmed') {
          setStkStatus('success');
          clearInterval(interval);
          setPollingInterval(null);
          
          // Auto-redirect to success after 2 seconds
          setTimeout(() => {
            setStep(3);
          }, 2000);
          
        } else if (data.status === 'failed' || data.status === 'cancelled') {
          setStkStatus(data.status);
          clearInterval(interval);
          setPollingInterval(null);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);

    setPollingInterval(interval);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-gray-900 text-xl">Loading event details...</p>
        </div>
      </div>
    );
  }

  // Error state - event not found
  if (!event || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
            <p className="text-gray-600 mb-6">{error || "The event you're looking for doesn't exist or is no longer available."}</p>
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-700 mb-2">Debug Info:</p>
              <p className="text-xs text-gray-600">Event ID: {eventId || 'Not provided'}</p>
              <p className="text-xs text-gray-600">Params: {JSON.stringify(params)}</p>
            </div>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              <ArrowLeft size={20} />
              Back to Events
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Success screen (Step 3)
  if (step === 3) {
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
                  Registration Complete!
                </motion.h1>
                
                <motion.p
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.1 }}
                  className="text-gray-600 mb-6 leading-relaxed"
                >
                  You have successfully registered for <strong>{event.name}</strong>.
                </motion.p>
                
                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700">Event Date:</span>
                    <span className="font-semibold">
                      {new Date(event.event_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Location:</span>
                    <span className="font-semibold">{event.location}</span>
                  </div>
                </div>
                
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.2 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <Link
                    href={`/events`}
                    className="group inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300"
                  >
                    <Ticket size={20} />
                    Back to Events
                  </Link>
                  <Link
                    href={authUser ? "/member/dashboard?tab=events" : "/"}
                    className="group inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300"
                  >
                    <Calendar size={20} />
                    {authUser ? "My Dashboard" : "Home"}
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

  // Payment waiting screen (Step 2)
  if (step === 2) {
    const amount = formData.is_alumni_member === "yes" ? calculateMemberPrice() : event.price;
    
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
                    <Smartphone className="text-white" size={24} />
                  </div>
                  <h1 className="text-3xl font-bold font-poppins text-gray-900">
                    Complete Payment on Your Phone
                  </h1>
                </motion.div>

                {/* Event Info */}
                <motion.div
                  variants={scaleIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl mb-8 border border-blue-100"
                >
                  <h2 className="text-2xl font-bold font-poppins text-gray-900 mb-4">
                    {event.name}
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="text-blue-600" size={18} />
                      <span className="text-gray-700">
                        {new Date(event.event_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="text-blue-600" size={18} />
                      <span className="text-gray-700">{event.location}</span>
                    </div>
                  </div>
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
                      <h3 className="text-xl font-bold font-poppins mb-2">
                        Event Registration Fee
                      </h3>
                      <p className="text-sm opacity-80">{formData.full_name}</p>
                    </div>
                    <div className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full font-bold text-lg">
                      Ksh {amount.toLocaleString()}
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
                        Payment to: {formData.phone}
                      </p>
                    </div>
                  </div>

                  {/* Payment Instructions */}
                  <div className="space-y-3">
                    {[
                      "Check your phone for M-PESA STK Push prompt",
                      "Enter your M-PESA PIN to authorize payment",
                      "Wait for payment confirmation",
                      "You'll be redirected automatically"
                    ].map((stepText, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-white/50 rounded-full flex items-center justify-center">
                          <span className="font-bold text-sm">{index + 1}</span>
                        </div>
                        <p className="text-sm">{stepText}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      if (pollingInterval) clearInterval(pollingInterval);
                      setStkStatus('cancelled');
                      setStep(1);
                    }}
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
              </div>
            </div>
          </motion.div>
        </main>
        <Footer />
      </motion.div>
    );
  }

  // Step 1: Registration Form
  const memberPrice = calculateMemberPrice();
  const isMember = authUser || formData.is_alumni_member === "yes";

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-white"
    >
      <Header />
      
      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link
              href={`/events`}
              className="inline-flex items-center text-blue-700 hover:text-blue-900 font-poppins font-medium text-sm transition-colors duration-200"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back to Events
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Event Details Card */}
            <motion.div
              variants={scaleIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg"
            >
              <h1 className="text-2xl font-bold font-poppins text-gray-900 mb-4">
                {event.name}
              </h1>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <Calendar className="text-blue-600 mt-1" size={18} />
                  <div>
                    <p className="font-medium text-gray-900">Date & Time</p>
                    <p className="text-gray-700">
                      {new Date(event.event_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="text-blue-600 mt-1" size={18} />
                  <div>
                    <p className="font-medium text-gray-900">Location</p>
                    <p className="text-gray-700">{event.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="text-blue-600 mt-1" size={18} />
                  <div>
                    <p className="font-medium text-gray-900">Availability</p>
                    <p className="text-gray-700">
                      {event.current_attendees}/{event.max_attendees} seats booked
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                <p className="text-gray-700">{event.description}</p>
              </div>
            </motion.div>

            {/* Registration Form */}
            <motion.div
              variants={scaleIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg"
            >
              <h2 className="text-2xl font-bold font-poppins text-gray-900 mb-6">
                Register for Event
              </h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {!authUser && (
                  <div className="space-y-4">
                    <div>
                      <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2">
                        Are you a CHRM Alumni Association member?
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                          <input
                            type="radio"
                            name="is_alumni_member"
                            value="yes"
                            checked={formData.is_alumni_member === "yes"}
                            onChange={(e) => setFormData({ ...formData, is_alumni_member: e.target.value })}
                            className="mr-3 text-blue-600"
                          />
                          <span className="font-medium">Yes, I am a member</span>
                        </label>
                        <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                          <input
                            type="radio"
                            name="is_alumni_member"
                            value="no"
                            checked={formData.is_alumni_member === "no"}
                            onChange={(e) => setFormData({ ...formData, is_alumni_member: e.target.value })}
                            className="mr-3 text-blue-600"
                          />
                          <span className="font-medium">No, I am not a member</span>
                        </label>
                      </div>
                    </div>

                    {formData.is_alumni_member === "yes" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.3 }}
                      >
                        <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2">
                          Membership Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.membership_number}
                          onChange={(e) => setFormData({ ...formData, membership_number: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:border-blue-500 transition-all duration-200"
                          placeholder="CHRM-2024-0001"
                        />
                      </motion.div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:border-blue-500 transition-all duration-200"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:border-blue-500 transition-all duration-200"
                    placeholder="john.doe@example.com"
                  />
                </div>

                <div>
                  <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2">
                    Phone Number (M-PESA) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:border-blue-500 transition-all duration-200"
                    placeholder="0712345678"
                    pattern="^(07\d{8}|7\d{8}|\+2547\d{8}|2547\d{8})$"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You'll receive STK Push prompt on this number
                  </p>
                </div>

                {/* Pricing Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
                  <h3 className="font-bold text-gray-900 mb-4">Pricing Summary</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Regular Price:</span>
                      <span className="font-semibold">Ksh {event.price.toLocaleString()}</span>
                    </div>
                    
                    {isMember && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Member Discount:</span>
                          <span className="font-semibold text-green-600">{event.member_discount}%</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t border-blue-200 pt-3">
                          <span className="text-blue-700">Your Price:</span>
                          <span className="text-blue-700">Ksh {memberPrice.toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={stkStatus === 'initiating' || stkStatus === 'pending'}
                  className="w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {stkStatus === 'initiating' || stkStatus === 'pending' ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Smartphone size={20} />
                      Pay via M-PESA
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>

                {authUser && (
                  <p className="text-sm text-gray-500 text-center">
                    You are logged in as <span className="font-semibold">{authUser.email}</span>
                  </p>
                )}
              </form>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
}