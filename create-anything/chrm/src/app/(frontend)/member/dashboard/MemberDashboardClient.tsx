"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  User,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  ShoppingBag,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  Activity,
  Package,
  DollarSign,
 
  Edit,
  Shield,
  BadgeCheck,
  Sparkles,
  Users,
  MapPin,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "../../../../app/(backend)/lib/supabase/client";
import { useAuth } from "../../../(backend)/context/auth";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";

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

// ─── Animation Variants ──────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export default function MemberDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const initialTab = searchParams?.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);

  const [memberDetails, setMemberDetails] = useState<MemberDetailsType | null>(null);
  const [membership, setMembership] = useState<MembershipType | null>(null);
  const [payments, setPayments] = useState<PaymentType[]>([]);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [events, setEvents] = useState<EventType[]>([]);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [debugError, setDebugError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const tab = searchParams?.get("tab");
    if (tab && tab !== activeTab) setActiveTab(tab);
  }, [searchParams]);

  const safeDate = (value?: string) => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };

  const getUserDisplayName = useCallback(() => {
    if (memberDetails?.full_name) return memberDetails.full_name;
    return user?.email?.split("@")[0] || "Member";
  }, [memberDetails?.full_name, user?.email]);

  const getInitials = useCallback(() => {
    const name = getUserDisplayName();
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }, [getUserDisplayName]);

  const resolveUserId = useCallback(async (): Promise<string | null> => {
    if (user?.id) return user.id;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("getSession error:", error);
        return null;
      }
      return data.session?.user?.id ?? null;
    } catch (e) {
      console.error("resolveUserId failed:", e);
      return null;
    }
  }, [user?.id]);

  const fetchRemainingData = useCallback(async (userId: string) => {
    const results = await Promise.allSettled([
      supabase.from("memberships").select("*").eq("user_id", userId).eq("is_active", true).maybeSingle(),
      supabase.from("payments").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("orders").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("events").select("*").eq("is_active", true).in("status", ["upcoming", "ongoing"]).order("event_date", { ascending: true }).limit(10),
    ]);

    const [membershipRes, paymentsRes, ordersRes, eventsRes] = results;

    if (membershipRes.status === "fulfilled") {
      const { data, error } = membershipRes.value;
      if (error) console.warn("Memberships error:", error.message);
      else setMembership(data ?? null);
    }
    if (paymentsRes.status === "fulfilled") {
      const { data, error } = paymentsRes.value;
      if (error) console.warn("Payments error:", error.message);
      else setPayments((data as PaymentType[]) ?? []);
    }
    if (ordersRes.status === "fulfilled") {
      const { data, error } = ordersRes.value;
      if (error) console.warn("Orders error:", error.message);
      else setOrders((data as OrderType[]) ?? []);
    }
    if (eventsRes.status === "fulfilled") {
      const { data, error } = eventsRes.value;
      if (error) console.warn("Events error:", error.message);
      else setEvents((data as EventType[]) ?? []);
    }
  }, []);

  const fetchMemberData = useCallback(async () => {
    setDebugError(null);
    setLoading(true);

    try {
      const userId = await resolveUserId();

      if (!userId) {
        setDebugError("Could not resolve a user ID. Please ensure you're logged in.");
        setLoading(false);
        return;
      }

      const { data: memberData, error: memberError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (memberError) {
        console.warn("Profiles fetch error:", memberError.message);
      }

      if (memberData) {
        if (memberData.role === "admin") {
          router.push("/admin/dashboard");
          return;
        }
        setMemberDetails(memberData as MemberDetailsType);
      } else {
        const fallback: MemberDetailsType = {
          id: userId,
          email: user?.email || "",
          full_name: user?.email?.split("@")[0] || "Member",
          status: "active",
          role: "member",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          membership_number: "",
          phone_number: "",
          graduation_year: 0,
          course: "",
          county: "",
        };
        setMemberDetails(fallback);
        if (memberError) {
          setDebugError(`Profile table error: "${memberError.message}"`);
        }
      }

      await fetchRemainingData(userId);
    } catch (error: any) {
      console.error("fetchMemberData exception:", error);
      setDebugError(error?.message || "Unexpected error loading dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [resolveUserId, fetchRemainingData, router, user?.email]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    fetchMemberData();
  }, [user, authLoading, router, fetchMemberData]);

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await logout();
    router.push("/");
  };

  const membershipActive = membership?.is_active || false;
  const expiryDate = safeDate(membership?.expiry_date || undefined);
  const membershipExpiry = expiryDate ? expiryDate.toLocaleDateString() : "N/A";

  const confirmedPayments = payments.filter((p) => p.status === "confirmed");
  const totalSpent = confirmedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "events", label: "Events", icon: Calendar },
    { id: "profile", label: "Profile", icon: User },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B3A6B] mx-auto"></div>
          <p className="mt-4 text-[#1B3A6B]/60">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Debug banner */}
        {debugError && (
          <div className="mb-6 bg-[#1B3A6B]/5 border border-[#1B3A6B]/20 text-[#1B3A6B] rounded-lg p-4">
            <p className="font-semibold mb-1">⚠️ Some data could not be loaded</p>
            <p className="text-sm text-[#1B3A6B]/60">{debugError}</p>
          </div>
        )}

        {/* Welcome Section */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1B3A6B]">
                Welcome back, {getUserDisplayName()}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[#1B3A6B]/60">
                <span className="flex items-center gap-1.5">
                  <Mail size={14} /> {user?.email}
                </span>
                {memberDetails?.phone_number && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={14} /> {memberDetails.phone_number}
                  </span>
                )}
                {memberDetails?.membership_number && (
                  <span className="flex items-center gap-1.5 text-[#C9A84C] font-medium">
                    <BadgeCheck size={14} /> #{memberDetails.membership_number}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-[#1B3A6B]/5 rounded-lg border border-[#1B3A6B]/10">
                {membershipActive ? (
                  <CheckCircle className="text-[#C9A84C]" size={16} />
                ) : (
                  <Clock className="text-[#1B3A6B]/40" size={16} />
                )}
                <span className={`font-medium ${membershipActive ? 'text-[#1B3A6B]' : 'text-[#1B3A6B]/50'}`}>
                  {membershipActive ? "Active Member" : memberDetails?.status === "pending" ? "Pending" : "Inactive"}
                </span>
              </div>
              {!membershipActive && (
                <Link
                  href={memberDetails?.status === "pending" ? "/register/payment" : "/payments"}
                  className="px-5 py-2 bg-[#C9A84C] text-[#1B3A6B] font-medium rounded-lg hover:bg-[#b8973a] transition flex items-center gap-2"
                >
                  {memberDetails?.status === "pending" ? "Complete Payment" : "Renew Now"}
                  <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>
          <div className="border-b border-[#1B3A6B]/10 mt-4" />
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            {
              label: "Total Spent",
              value: `KES ${totalSpent.toLocaleString()}`,
              icon: DollarSign,
              bg: "bg-[#1B3A6B]/5",
              iconColor: "text-[#1B3A6B]",
            },
            {
              label: "Orders",
              value: orders.length,
              icon: ShoppingBag,
              bg: "bg-[#C9A84C]/10",
              iconColor: "text-[#C9A84C]",
            },
            {
              label: "Upcoming Events",
              value: events.filter((e) => e.status === "upcoming").length,
              icon: Calendar,
              bg: "bg-[#1B3A6B]/5",
              iconColor: "text-[#1B3A6B]",
            },
            {
              label: "Payments",
              value: confirmedPayments.length,
              icon: CreditCard,
              bg: "bg-[#C9A84C]/10",
              iconColor: "text-[#C9A84C]",
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              variants={scaleIn}
              className="bg-white border border-[#1B3A6B]/10 rounded-lg p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center gap-3">
                <div className={`${stat.bg} p-2.5 rounded-lg`}>
                  <stat.icon className={stat.iconColor} size={20} />
                </div>
                <div>
                  <p className="text-xs text-[#1B3A6B]/50 uppercase tracking-wider font-medium">{stat.label}</p>
                  <p className="text-xl font-serif font-bold text-[#1B3A6B]">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Membership Status Banner */}
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className={`p-6 rounded-lg mb-8 border ${
            membershipActive
              ? "bg-[#1B3A6B]/5 border-[#C9A84C]/30"
              : "bg-[#1B3A6B]/5 border-[#1B3A6B]/20"
          }`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${membershipActive ? 'bg-[#C9A84C]' : 'bg-[#1B3A6B]'}`}>
                {membershipActive ? (
                  <CheckCircle className="text-white" size={24} />
                ) : (
                  <Clock className="text-white" size={24} />
                )}
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-[#1B3A6B]">
                  {membershipActive ? "Active Membership" : memberDetails?.status === "pending" ? "Pending Activation" : "Inactive Membership"}
                </h2>
                <p className="text-sm text-[#1B3A6B]/60">
                  {membershipActive
                    ? `Valid until ${membershipExpiry}`
                    : memberDetails?.status === "pending"
                    ? "Complete your payment to activate"
                    : "Renew to continue enjoying benefits"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-[#1B3A6B]/50 uppercase tracking-wider font-medium">Membership Number</p>
                <p className="text-lg font-serif font-bold text-[#1B3A6B]">
                  {memberDetails?.membership_number || "Pending"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-[#1B3A6B]/10 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                router.replace(`/member/dashboard?tab=${tab.id}`);
              }}
              className={`px-5 py-3 font-medium text-sm transition-all border-b-2 ${
                activeTab === tab.id
                  ? "border-[#C9A84C] text-[#1B3A6B]"
                  : "border-transparent text-[#1B3A6B]/50 hover:text-[#1B3A6B]/70 hover:border-[#1B3A6B]/20"
              } flex items-center gap-2`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-[#1B3A6B]/10 rounded-lg p-6 shadow-sm"
          >
            {activeTab === "overview" && (
              <div>
                <h3 className="text-lg font-serif font-bold text-[#1B3A6B] mb-4">Recent Activity</h3>
                {payments.length === 0 && orders.length === 0 ? (
                  <p className="text-[#1B3A6B]/50">No recent activity found.</p>
                ) : (
                  <div className="space-y-3">
                    {payments.slice(0, 5).map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-[#1B3A6B]/5 rounded-lg border border-[#1B3A6B]/10">
                        <div className="flex items-center gap-3">
                          <CreditCard size={16} className="text-[#1B3A6B]" />
                          <div>
                            <p className="text-sm font-medium text-[#1B3A6B]">{p.description || p.payment_type}</p>
                            <p className="text-xs text-[#1B3A6B]/50">{new Date(p.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-serif font-bold text-[#1B3A6B]">KES {p.amount?.toLocaleString()}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            p.status === "confirmed" ? "bg-[#C9A84C]/10 text-[#C9A84C]" :
                            p.status === "failed" ? "bg-[#1B3A6B]/10 text-[#1B3A6B]/50" :
                            "bg-[#1B3A6B]/10 text-[#1B3A6B]/50"
                          }`}>
                            {p.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "payments" && (
              <div>
                <h3 className="text-lg font-serif font-bold text-[#1B3A6B] mb-4">Payment History</h3>
                {payments.length === 0 ? (
                  <p className="text-[#1B3A6B]/50">No payments found.</p>
                ) : (
                  <div className="space-y-3">
                    {payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-4 bg-[#1B3A6B]/5 rounded-lg border border-[#1B3A6B]/10">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#1B3A6B]/10 rounded-lg">
                            <CreditCard size={16} className="text-[#1B3A6B]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#1B3A6B]">{p.description || p.payment_type}</p>
                            <p className="text-xs text-[#1B3A6B]/50">
                              {new Date(p.created_at).toLocaleDateString()} • {p.mpesa_receipt_number || p.account_reference}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-serif font-bold text-[#1B3A6B]">KES {p.amount?.toLocaleString()}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            p.status === "confirmed" ? "bg-[#C9A84C]/10 text-[#C9A84C]" :
                            p.status === "failed" ? "bg-[#1B3A6B]/10 text-[#1B3A6B]/50" :
                            "bg-[#1B3A6B]/10 text-[#1B3A6B]/50"
                          }`}>
                            {p.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "orders" && (
              <div>
                <h3 className="text-lg font-serif font-bold text-[#1B3A6B] mb-4">My Orders</h3>
                {orders.length === 0 ? (
                  <p className="text-[#1B3A6B]/50">No orders found.</p>
                ) : (
                  <div className="space-y-3">
                    {orders.map((o) => (
                      <div key={o.id} className="flex items-center justify-between p-4 bg-[#1B3A6B]/5 rounded-lg border border-[#1B3A6B]/10">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#C9A84C]/10 rounded-lg">
                            <ShoppingBag size={16} className="text-[#C9A84C]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#1B3A6B]">Order #{o.id.slice(0, 8).toUpperCase()}</p>
                            <p className="text-xs text-[#1B3A6B]/50">
                              {new Date(o.created_at).toLocaleDateString()} • {o.items?.length || 0} item(s)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-serif font-bold text-[#1B3A6B]">KES {o.total?.toLocaleString()}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            o.status === "delivered" ? "bg-[#C9A84C]/10 text-[#C9A84C]" :
                            o.status === "cancelled" ? "bg-[#1B3A6B]/10 text-[#1B3A6B]/50" :
                            "bg-[#1B3A6B]/10 text-[#1B3A6B]/50"
                          }`}>
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "events" && (
              <div>
                <h3 className="text-lg font-serif font-bold text-[#1B3A6B] mb-4">Upcoming Events</h3>
                {events.length === 0 ? (
                  <p className="text-[#1B3A6B]/50">No upcoming events at the moment.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map((e) => (
                      <div key={e.id} className="p-4 bg-[#1B3A6B]/5 rounded-lg border border-[#1B3A6B]/10">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-serif font-semibold text-[#1B3A6B]">{e.name}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#C9A84C]/10 text-[#C9A84C]">{e.status}</span>
                        </div>
                        <p className="text-xs text-[#1B3A6B]/50 mb-2 line-clamp-2">{e.description}</p>
                        <div className="flex items-center justify-between text-xs text-[#1B3A6B]/50">
                          <span>
                            {e.event_date ? new Date(e.event_date).toLocaleDateString() : "TBD"}
                            {e.location ? ` • ${e.location}` : ""}
                          </span>
                          <span className="font-serif font-semibold text-[#1B3A6B]">
                            {e.price === 0 ? "Free" : `KES ${e.price?.toLocaleString()}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "profile" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-serif font-bold text-[#1B3A6B]">Profile Details</h3>
                  <Link
                    href="/member/dashboard/profile/edit"
                    className="flex items-center gap-2 px-4 py-2 bg-[#1B3A6B] text-white text-sm font-medium rounded-lg hover:bg-[#152e55] transition"
                  >
                    <Edit size={14} />
                    Edit Profile
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Full Name", value: memberDetails?.full_name, icon: User },
                    { label: "Email", value: memberDetails?.email || user?.email, icon: Mail },
                    { label: "Phone", value: memberDetails?.phone_number, icon: Phone },
                    { label: "Membership No.", value: memberDetails?.membership_number, icon: BadgeCheck },
                    { label: "Course", value: memberDetails?.course, icon: BookOpen },
                    { label: "Graduation Year", value: memberDetails?.graduation_year?.toString(), icon: GraduationCap },
                    { label: "County", value: memberDetails?.county, icon: MapPin },
                    { label: "Status", value: memberDetails?.status, icon: Shield },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="p-4 bg-[#1B3A6B]/5 rounded-lg border border-[#1B3A6B]/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={14} className="text-[#C9A84C]" />
                        <p className="text-xs text-[#1B3A6B]/50 uppercase tracking-wider font-medium">{label}</p>
                      </div>
                      <p className="text-sm font-medium text-[#1B3A6B]">{value || "—"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}