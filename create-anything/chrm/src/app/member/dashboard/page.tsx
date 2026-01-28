"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Footer from "../../components/Footer";
import {
  User,
  Phone,
  Mail,
  PinIcon,
  CreditCard,
  Calendar,
  ShoppingBag,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "../../lib/supabase/client";
import { useAuth } from "../../context/auth";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion"; // Add this import

type MemberDetailsType = {
  id: string;
  email: string;
  full_name: string;
  membership_number: string;
  phone_number: string;
  graduation_year: number;
  course: string;
  county: string;
  status: "pending" | "active" | "expired" | "inactive";
  role: "admin" | "member";
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  registration_source?: "online" | "manual";
  needs_password_setup?: boolean;
};

type PaymentType = {
  id: string;
  created_at: string;
  payment_type: "registration" | "renewal" | "event" | "merchandise";
  account_reference: string;
  amount: number;
  status: "pending" | "processing" | "confirmed" | "failed";
  user_id: string;
  description: string;
  phone_number: string;
  mpesa_receipt_number?: string;
  paid_at?: string;
};

type OrderType = {
  id: string;
  created_at: string;
  items: any[];
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  user_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  shipping_address?: string;
  payment_id?: string;
};

type EventType = {
  id: string;
  name: string;
  description: string;
  event_date?: string;
  price: number;
  member_discount: number;
  location?: string;
  max_attendees?: number;
  current_attendees: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  is_active: boolean;
};

type MembershipType = {
  id: string;
  user_id: string;
  start_date: string;
  expiry_date: string;
  is_active: boolean;
  created_at: string;
};

// Animation variants - Properly typed
const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const }
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" as const }
  }
};

const slideIn: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" as const }
  }
};

const cardHover = {
  hover: { 
    y: -4,
    scale: 1.02,
    transition: { 
      duration: 0.2,
      ease: "easeInOut" as const
    }
  }
};

const tabHover = {
  hover: { 
    scale: 1.05,
    transition: { duration: 0.1 }
  }
};

const pulseAnimation = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: "reverse" as const
    }
  }
};

export default function MemberDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [memberDetails, setMemberDetails] = useState<MemberDetailsType | null>(null);
  const [membership, setMembership] = useState<MembershipType | null>(null);
  const [payments, setPayments] = useState<PaymentType[]>([]);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [events, setEvents] = useState<EventType[]>([]);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        fetchMemberData();
      }
    }
  }, [user, authLoading, router]);

  const fetchMemberData = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching data for user:', user.email);
      const { data: memberData, error: memberError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id) 
        .single();
      
      if (memberError) {
        console.log('Profiles table error:', memberError.message);
        
        if (memberError.message.includes('infinite recursion') || memberError.message.includes('recursion')) {
          console.log('RLS recursion detected, trying alternative query...');
          const fallbackProfile = {
            id: user.id,
            email: user.email,
            full_name: user.email?.split('@')[0] || 'Member',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          setMemberDetails(fallbackProfile as any);
          fetchRemainingData(fallbackProfile);
          return;
        }
        
        setMemberDetails(null);
      } else {
        console.log('Found profile:', memberData);
        setMemberDetails(memberData);
        fetchRemainingData(memberData);
      }
    } catch (error) {
      console.error("Failed to fetch member data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRemainingData = async (profileData: any) => {
    try {
      const userId = profileData?.id || user?.id;
      
      try {
        const { data: membershipData, error: membershipError } = await supabase
          .from("memberships")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .maybeSingle(); 
        
        if (!membershipError && membershipData) {
          console.log('Found membership:', membershipData);
          setMembership(membershipData);
        } else {
          console.log('No active membership found');
        }
      } catch (membershipFetchError) {
        console.log('Memberships fetch failed:', membershipFetchError);
      }
      
      try {
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        
        if (!paymentsError) {
          setPayments(paymentsData || []);
        } else {
          console.log('Payments error:', paymentsError);
        }
      } catch (paymentsError) {
        console.log('Payments fetch failed:', paymentsError);
      }
      
      try {
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        
        if (!ordersError) {
          setOrders(ordersData || []);
        } else {
          console.log('Orders error:', ordersError);
        }
      } catch (ordersError) {
        console.log('Orders fetch failed:', ordersError);
      }
      
      try {
        const { data: eventsData, error: eventsError } = await supabase
          .from("events")
          .select("*")
          .eq("is_active", true)
          .in("status", ["upcoming", "ongoing"])
          .order("event_date", { ascending: true })
          .limit(10);
        
        if (!eventsError) {
          setEvents(eventsData || []);
        } else {
          console.log('Events error:', eventsError.message);
          setEvents([
            {
              id: "fallback-1",
              name: "Grill and Chill",
              description: "A day of networking, awards, and celebration of our alumni achievements.",
              event_date: new Date().toISOString().split('T')[0],
              price: 1000,
              member_discount: 0,
              location: "TBD",
              max_attendees: 100,
              current_attendees: 0,
              status: "upcoming" as const,
              is_active: true
            }
          ]);
        }
      } catch (eventsError) {
        console.log('Events fetch failed:', eventsError);
      }
      
      console.log('Dashboard data loaded successfully');
      
    } catch (error) {
      console.error("Failed to fetch remaining data:", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const getUserDisplayName = () => {
    if (memberDetails?.full_name) {
      return memberDetails.full_name;
    }
    return user?.email?.split('@')[0] || "Member";
  };

  console.log('Render check:', {
    authLoading,
    loading,
    hasUser: !!user,
    userRole: user?.role,
    hasMemberDetails: !!memberDetails,
    memberDetailsRole: memberDetails?.role
  });

  if (authLoading || loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
      </motion.div>
    );
  }

  if (!user) {
    return null;
  }
  
  if (memberDetails && memberDetails.role === "admin") {
    return null;
  }

  const membershipActive = membership?.is_active || false;
  const membershipExpiry = membership?.expiry_date
    ? new Date(membership.expiry_date).toLocaleDateString()
    : "N/A";

  const memberSince = memberDetails?.created_at
    ? new Date(memberDetails.created_at).toLocaleDateString()
    : "N/A";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-b from-blue-50 to-white"
    >
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white shadow-sm border-b"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-bold text-gray-900 font-poppins"
            >
              Member Dashboard
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-600"
            >
              Welcome, {getUserDisplayName()}
            </motion.p>
          </div>
          <div className="flex gap-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/"
                className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow"
              >
                View Site
              </Link>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow"
            >
              Logout
            </motion.button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Membership Status Card */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className={`bg-gradient-to-br p-8 rounded-xl mb-8 shadow-lg transition-all duration-300 ${
            membershipActive 
              ? "from-emerald-100 to-emerald-50 border border-emerald-200" 
              : "from-amber-100 to-amber-50 border border-amber-200"
          }`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3"
              >
                {membershipActive ? (
                  <>
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      <CheckCircle className="text-emerald-600" size={28} />
                    </motion.div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-1 font-poppins">
                        Membership Active
                      </h2>
                      <p className="text-gray-700">
                        Expires: <span className="font-semibold">{membershipExpiry}</span>
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                    >
                      <XCircle className="text-amber-600" size={28} />
                    </motion.div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-1 font-poppins">
                        {memberDetails?.status === "pending" ? "Pending Payment" : "Membership Inactive"}
                      </h2>
                      <p className="text-gray-700">
                        {memberDetails?.status === "pending" 
                          ? "Complete registration to activate membership"
                          : "Renew your membership to continue enjoying benefits"}
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 backdrop-blur-sm p-6 rounded-lg border shadow-sm"
            >
              <p className="text-gray-600 font-medium mb-2">
                Membership Number
              </p>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-bold text-gray-900">
                  {memberDetails?.membership_number || "Pending"}
                </p>
                {membershipActive && (
                  <motion.div
                    variants={pulseAnimation}
                    initial="initial"
                    animate="pulse"
                  >
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
          
          {!membershipActive && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6"
            >
              <Link
                href={memberDetails?.status === "pending" ? "/register/payment" : "/payments"}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {memberDetails?.status === "pending" ? "Complete Registration" : "Renew Membership"}
                <ArrowRight className="ml-1" size={18} />
              </Link>
            </motion.div>
          )}
        </motion.div>

        {/* Tabs */}
        <motion.div 
          variants={slideIn}
          initial="hidden"
          animate="visible"
          className="flex gap-2 mb-8 border-b"
        >
          {["overview", "payments", "orders", "events", "profile"].map(
            (tab) => (
              <motion.button
                key={tab}
                whileHover={{ scale: 1.05 }}
                onMouseEnter={() => setHoveredTab(tab)}
                onMouseLeave={() => setHoveredTab(null)}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-semibold capitalize transition-all duration-200 relative whitespace-nowrap ${
                  activeTab === tab
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab}
                {hoveredTab === tab && activeTab !== tab && (
                  <motion.div
                    layoutId="tabHover"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}
              </motion.button>
            ),
          )}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="min-h-[400px]"
          >
            {activeTab === "overview" && (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                <motion.div variants={fadeIn} className="bg-white p-8 rounded-xl border shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 font-poppins">
                    Quick Stats
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { 
                        icon: CreditCard, 
                        value: payments.filter(p => p.status === "confirmed").length,
                        label: "Confirmed Payments",
                        color: "text-blue-600",
                        bg: "bg-blue-50"
                      },
                      { 
                        icon: ShoppingBag, 
                        value: orders.length,
                        label: "Orders",
                        color: "text-emerald-600",
                        bg: "bg-emerald-50"
                      },
                      { 
                        icon: Calendar, 
                        value: events.filter(e => e.status === "upcoming").length,
                        label: "Upcoming Events",
                        color: "text-amber-600",
                        bg: "bg-amber-50"
                      }
                    ].map((stat, index) => (
                      <motion.div
                        key={index}
                        variants={scaleIn}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className={`${stat.bg} p-6 rounded-lg border transition-all duration-300 hover:shadow-lg`}
                      >
                        <div className="flex items-center gap-4">
                          <motion.div 
                            whileHover={{ rotate: 10 }}
                            className={`p-3 rounded-lg ${stat.bg.replace('50', '100')}`}
                          >
                            <stat.icon className={stat.color} size={24} />
                          </motion.div>
                          <div>
                            <motion.p 
                              initial={{ scale: 0.5 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 200 }}
                              className="text-3xl font-bold text-gray-900"
                            >
                              {stat.value}
                            </motion.p>
                            <p className="text-gray-600">{stat.label}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      href: "/payments",
                      title: "Make a Payment",
                      description: "Renew membership or pay for events",
                      icon: CreditCard,
                      color: "from-blue-500 to-blue-600"
                    },
                    {
                      href: "/merchandise",
                      title: "Shop Merchandise",
                      description: "Browse CHRMAA branded items",
                      icon: ShoppingBag,
                      color: "from-emerald-500 to-emerald-600"
                    }
                  ].map((action, index) => (
                    <motion.div
                      key={index}
                      variants={scaleIn}
                      whileHover={{ y: -4, scale: 1.02 }}
                    >
                      <Link
                        href={action.href}
                        className="block bg-white p-6 rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 font-poppins">
                              {action.title}
                            </h3>
                            <p className="text-gray-600">
                              {action.description}
                            </p>
                          </div>
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className={`p-3 rounded-lg bg-gradient-to-br ${action.color} text-white`}
                          >
                            <action.icon size={24} />
                          </motion.div>
                        </div>
                        <motion.div
                          className="mt-4 flex items-center text-blue-600 font-medium "
                          whileHover={{ x: 5 }}
                        ><Link href={"/merchandise"}>
                          Get started</Link>
                          <ChevronRight size={18} className="ml-1" />
                        </motion.div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {activeTab === "payments" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white p-8 rounded-xl border shadow-sm"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6 font-poppins">
                  Payment History
                </h2>
                {payments.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 text-left text-gray-600 border-b">
                          <th className="pb-3 pl-6 pt-4">Date</th>
                          <th className="pb-3 pt-4">Type</th>
                          <th className="pb-3 pt-4">Amount</th>
                          <th className="pb-3 pr-6 pt-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((payment, index) => (
                          <motion.tr
                            key={payment.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="text-gray-700 border-b hover:bg-gray-50 transition-colors"
                          >
                            <td className="py-4 pl-6">
                              {new Date(payment.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-4 capitalize">
                              {payment.payment_type}
                            </td>
                            <td className="py-4 font-semibold">
                              Ksh {payment.amount.toLocaleString()}
                            </td>
                            <td className="py-4 pr-6 text-right">
                              <motion.span
                                whileHover={{ scale: 1.05 }}
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                                  payment.status === "confirmed" 
                                    ? "bg-emerald-100 text-emerald-800"
                                    : payment.status === "pending"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {payment.status === "confirmed" && <CheckCircle size={14} />}
                                {payment.status}
                              </motion.span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <Clock className="mx-auto mb-4 text-gray-400" size={48} />
                    <p className="text-gray-600 mb-2">No payment history yet</p>
                    <p className="text-gray-500 text-sm mb-6">Make your first payment to see it here</p>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link
                        href="/payments"
                        className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow"
                      >
                        Make a Payment
                        <ArrowRight size={16} />
                      </Link>
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === "orders" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white p-8 rounded-xl border shadow-sm"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6 font-poppins">
                  Merchandise Orders
                </h2>
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order, index) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ x: 4 }}
                        className="bg-white p-5 rounded-lg border hover:shadow-md transition-all duration-300"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <p className="font-semibold text-gray-900">
                                Order #{order.id.slice(0, 8)}...
                              </p>
                              <motion.span
                                whileHover={{ scale: 1.05 }}
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  order.status === "delivered" 
                                    ? "bg-emerald-100 text-emerald-800"
                                    : order.status === "shipped"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {order.status}
                              </motion.span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">
                              Ksh {order.total.toLocaleString()}
                            </p>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View Details →
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <ShoppingBag className="mx-auto mb-4 text-gray-400" size={48} />
                    <p className="text-gray-600 mb-2">No orders yet</p>
                    <p className="text-gray-500 text-sm mb-6">Browse our merchandise collection</p>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link
                        href="/merchandise"
                        className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 shadow"
                      >
                        Shop Merchandise
                        <ArrowRight size={16} />
                      </Link>
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === "profile" && memberDetails && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white p-8 rounded-xl border shadow-sm"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6 font-poppins">
                  Profile Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: "Full Name", value: memberDetails.full_name, icon: User },
                    { label: "Email", value: memberDetails.email, icon: Mail },
                    { label: "Phone", value: memberDetails.phone_number || "N/A", icon: Phone },
                    { label: "Graduation Year", value: memberDetails.graduation_year || "N/A", icon: Calendar },
                    { label: "Course", value: memberDetails.course || "N/A", icon: User },
                    { label: "County", value: memberDetails.county || "N/A", icon: PinIcon },
                  ].map((field, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.01 }}
                      className="bg-gray-50 p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white rounded-lg border">
                          <field.icon className="text-gray-600" size={18} />
                        </div>
                        <p className="text-gray-600 text-sm">{field.label}</p>
                      </div>
                      <p className="text-gray-900 font-medium">{field.value}</p>
                    </motion.div>
                  ))}
                </div>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 pt-6 border-t"
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/member/profile/edit"
                      className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow"
                    >
                      Edit Profile
                      <ArrowRight size={16} />
                    </Link>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <Footer />
    </motion.div>
  );
}