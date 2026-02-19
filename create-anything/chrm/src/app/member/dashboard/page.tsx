"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Award,
  LogOut,
  Home,
  ChevronDown,
  Edit,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "../../lib/supabase/client";
import { useAuth } from "../../context/auth";

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

// CHRMAA Colors
const COLORS = {
  darkBlue: "#2B4C73",
  gold: "#FF7A00",
  maroon: "#E53E3E",
  lightBlue: "#E8F4FD",
  lightGold: "#FFF4E6",
  lightMaroon: "#FFF0F0",
  white: "#FFFFFF",
  offWhite: "#F7F9FC",
  darkText: "#0B0F1A",
  lightText: "#6D7A8B",
  borderLight: "#E7ECF3",
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

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keep tab synced with URL
  useEffect(() => {
    const tab = searchParams?.get("tab");
    if (tab && tab !== activeTab) setActiveTab(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // IMPORTANT: ensure we have a valid Supabase session in the browser before queries
  const ensureSupabaseSession = useCallback(async () => {
    // This does NOT log in; it just checks if a session exists.
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Supabase getSession error:", error);
      throw error;
    }
    return data.session;
  }, []);

  const fetchRemainingData = useCallback(
    async (userId: string) => {
      // Membership
      try {
        const { data: membershipData, error: membershipError } = await supabase
          .from("memberships")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .maybeSingle();

        if (membershipError) {
          console.log("Memberships error:", membershipError);
        } else {
          setMembership(membershipData || null);
        }
      } catch (e) {
        console.log("Memberships fetch failed:", e);
      }

      // Payments
      try {
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (paymentsError) {
          console.log("Payments error:", paymentsError);
        } else {
          setPayments(paymentsData || []);
        }
      } catch (e) {
        console.log("Payments fetch failed:", e);
      }

      // Orders
      try {
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (ordersError) {
          console.log("Orders error:", ordersError);
        } else {
          setOrders(ordersData || []);
        }
      } catch (e) {
        console.log("Orders fetch failed:", e);
      }

      // Events
      try {
        const { data: eventsData, error: eventsError } = await supabase
          .from("events")
          .select("*")
          .eq("is_active", true)
          .in("status", ["upcoming", "ongoing"])
          .order("event_date", { ascending: true })
          .limit(10);

        if (eventsError) {
          console.log("Events error:", eventsError);
        } else {
          setEvents(eventsData || []);
        }
      } catch (e) {
        console.log("Events fetch failed:", e);
      }
    },
    [setMembership, setPayments, setOrders, setEvents]
  );

  const fetchMemberData = useCallback(async () => {
    if (!user?.id) return;

    setDebugError(null);
    setLoading(true);

    try {
      // 1) Ensure Supabase session exists (RLS depends on JWT)
      const session = await ensureSupabaseSession();
      if (!session) {
        // Your app auth may be "logged in" but supabase client session isn't set.
        // This is the #1 reason dashboards show no data.
        setDebugError(
          "No Supabase session found. Make sure you are signing in via Supabase Auth (supabase.auth.signInWithPassword / OAuth) or you set the session after custom login."
        );
        setMemberDetails(null);
        setMembership(null);
        setPayments([]);
        setOrders([]);
        setEvents([]);
        return;
      }

      // 2) Fetch profile
      const { data: memberData, error: memberError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (memberError) {
        console.log("Profiles table error:", memberError);

        // If profiles RLS blocks, fallback to minimal UI but still fetch other data
        const fallbackProfile: Partial<MemberDetailsType> = {
          id: user.id,
          email: user.email || "",
          full_name: user.email?.split("@")[0] || "Member",
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

        setMemberDetails(fallbackProfile as MemberDetailsType);
        await fetchRemainingData(user.id);
        return;
      }

      if (!memberData) {
        // Profile not found (common if you don't auto-create profiles on signup)
        const fallbackProfile: Partial<MemberDetailsType> = {
          id: user.id,
          email: user.email || "",
          full_name: user.email?.split("@")[0] || "Member",
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

        setMemberDetails(fallbackProfile as MemberDetailsType);
        await fetchRemainingData(user.id);
        return;
      }

      // 3) Admin guard (in case)
      if (memberData.role === "admin") {
        router.push("/admin/dashboard");
        return;
      }

      setMemberDetails(memberData);
      await fetchRemainingData(memberData.id);
    } catch (error: any) {
      console.error("Failed to fetch member data:", error);
      setDebugError(error?.message || "Unknown error fetching dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email, ensureSupabaseSession, fetchRemainingData, router]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    // if your auth context includes role:
    // @ts-ignore
    if (user.role === "admin") {
      router.push("/admin/dashboard");
      return;
    }

    fetchMemberData();
  }, [user, authLoading, router, fetchMemberData]);

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    await logout();
    router.push("/");
  };

  // Derived values
  const membershipActive = membership?.is_active || false;
  const expiryDate = safeDate(membership?.expiry_date || undefined);
  const membershipExpiry = expiryDate ? expiryDate.toLocaleDateString() : "N/A";

  const confirmedPayments = payments.filter((p) => p.status === "confirmed");
  const totalSpent = confirmedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-[100dvh] bg-[#F7F9FC] flex items-center justify-center">
        <div className="text-[#2B4C73] text-xl font-poppins">Loading Dashboard...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-[100dvh] bg-[#F7F9FC] font-poppins flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E7ECF3] sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Logo + Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#2B4C73] to-[#FF7A00] rounded-xl flex items-center justify-center shadow-md">
                <User className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0B0F1A]">Member Dashboard</h1>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/"
                className="hidden md:flex items-center gap-2 px-3 py-2 text-[#6D7A8B] hover:text-[#0B0F1A] hover:bg-[#F7F9FC] rounded-lg transition"
              >
                <Home size={18} />
                <span>Home</span>
              </Link>

              {/* Profile Dropdown (Edit Profile only) */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  className="flex items-center gap-3 p-1 pr-2 sm:pr-3 rounded-full hover:bg-[#F7F9FC] transition group"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#E7ECF3] group-hover:border-[#2B4C73] transition">
                    {memberDetails?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={memberDetails.avatar_url}
                        alt={getUserDisplayName()}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#2B4C73] to-[#1E3A5F] flex items-center justify-center text-white font-bold">
                        {getInitials()}
                      </div>
                    )}
                  </div>

                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-[#0B0F1A]">{getUserDisplayName()}</p>
                    <p className="text-xs text-[#6D7A8B]">{membershipActive ? "Active Member" : "Member"}</p>
                  </div>

                  <ChevronDown
                    size={16}
                    className={`text-[#6D7A8B] transition-transform duration-200 ${
                      profileMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#E7ECF3] overflow-hidden z-50">
                    <div className="p-2">
                      <Link
                        href="/member/dashboard/profile/edit"
                        className="flex items-center gap-3 px-3 py-2 text-[#0B0F1A] hover:bg-[#F7F9FC] rounded-lg transition"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <Edit size={16} className="text-[#FF7A00]" />
                        <span className="font-medium">Edit Profile</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 text-[#0B0F1A] hover:bg-[#F7F9FC] rounded-lg transition"
                        
                      >
                        <LogOut size={16} className="text-[#E53E3E]" />
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* /Right side */}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="w-full flex-1">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Debug message if session missing / errors */}
          {debugError && (
            <div className="mb-6 bg-[#FFF0F0] border border-[#E53E3E]/30 text-[#0B0F1A] rounded-xl p-4">
              <p className="font-semibold mb-1">Dashboard data not loading</p>
              <p className="text-sm text-[#6D7A8B]">{debugError}</p>
              <p className="text-sm text-[#6D7A8B] mt-2">
                Fix: Ensure your login uses Supabase Auth so the browser has a valid JWT session (check
                <code className="mx-1">supabase.auth.getSession()</code> in console).
              </p>
            </div>
          )}

          {/* Top section: Welcome + Membership expiry card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Welcome */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-[#E7ECF3] p-6 shadow-sm">
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#0B0F1A] mb-1">
                    Welcome back, {getUserDisplayName()}
                  </h2>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-[#6D7A8B]" />
                      <span className="text-[#6D7A8B]">{user?.email}</span>
                    </div>

                    {memberDetails?.phone_number ? (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-[#6D7A8B]" />
                        <span className="text-[#6D7A8B]">{memberDetails.phone_number}</span>
                      </div>
                    ) : null}

                    {memberDetails?.membership_number ? (
                      <div className="flex items-center gap-2">
                        <Award size={14} className="text-[#FF7A00]" />
                        <span className="text-[#FF7A00] font-medium">#{memberDetails.membership_number}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E7ECF3] bg-[#F7F9FC]">
                    {membershipActive ? (
                      <CheckCircle size={14} className="text-[#2B4C73]" />
                    ) : (
                      <Clock size={14} className="text-[#FF7A00]" />
                    )}
                    <span className="text-sm font-medium text-[#0B0F1A]">
                      {membershipActive ? "Active" : memberDetails?.status === "pending" ? "Pending" : "Inactive"}
                    </span>
                  </div>

                  <div className="text-sm text-[#6D7A8B]">
                    Member since{" "}
                    <span className="font-semibold text-[#0B0F1A]">
                      {memberDetails?.created_at
                        ? new Date(memberDetails.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Membership expiry card */}
            <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-[#E7ECF3] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-[#E8F4FD] rounded-lg">
                  <Clock className="text-[#2B4C73]" size={24} />
                </div>
                <Activity className="text-[#FF7A00]" size={20} />
              </div>
              <div>
                <p className="text-[#6D7A8B] text-sm mb-1 font-medium">Membership Expires</p>
                <p className="text-xl font-bold text-[#0B0F1A]">{membershipExpiry}</p>
                <p className="text-sm text-[#6D7A8B] mt-1">
                  {membershipActive ? "You’re covered" : "Renew to activate benefits"}
                </p>
              </div>
            </div>
          </div>

          {/* Membership status banner */}
          <div
            className={`p-6 rounded-xl mb-8 border shadow-sm ${
              membershipActive
                ? "bg-gradient-to-r from-[#E8F4FD] to-[#d4e9fa] border-[#2B4C73]/20"
                : "bg-gradient-to-r from-[#FFF4E6] to-[#ffe9cc] border-[#FF7A00]/20"
            }`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {membershipActive ? (
                  <div className="p-3 bg-[#2B4C73] rounded-xl shadow-sm">
                    <CheckCircle className="text-white" size={32} />
                  </div>
                ) : (
                  <div className="p-3 bg-[#FF7A00] rounded-xl shadow-sm">
                    <XCircle className="text-white" size={32} />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-[#0B0F1A]">
                    {membershipActive
                      ? "Active Membership"
                      : memberDetails?.status === "pending"
                      ? "Pending Activation"
                      : "Inactive Membership"}
                  </h2>
                  <p className="text-[#6D7A8B] mt-1 font-medium">
                    {membershipActive
                      ? `Valid until ${membershipExpiry}`
                      : memberDetails?.status === "pending"
                      ? "Complete your payment to activate"
                      : "Renew to continue enjoying benefits"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-white p-4 rounded-lg border border-[#E7ECF3] shadow-sm">
                  <p className="text-sm text-[#6D7A8B] mb-1 font-medium">Membership Number</p>
                  <p className="text-xl font-bold text-[#2B4C73]">
                    {memberDetails?.membership_number || "Pending"}
                  </p>
                </div>

                {!membershipActive && (
                  <Link
                    href={memberDetails?.status === "pending" ? "/register/payment" : "/payments"}
                    className="px-6 py-3 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white font-semibold rounded-lg hover:opacity-90 transition shadow-md flex items-center gap-2 whitespace-nowrap hover:shadow-lg"
                  >
                    {memberDetails?.status === "pending" ? "Complete Payment" : "Renew Now"}
                    <ArrowRight size={18} />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-[#E7ECF3] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-[#E8F4FD] rounded-lg">
                  <CreditCard className="text-[#2B4C73]" size={24} />
                </div>
                <DollarSign className="text-[#FF7A00]" size={20} />
              </div>
              <div>
                <p className="text-[#6D7A8B] text-sm mb-1 font-medium">Total Spent</p>
                <p className="text-2xl font-bold text-[#0B0F1A]">Ksh {totalSpent.toLocaleString()}</p>
                <p className="text-sm text-[#6D7A8B] mt-1">{confirmedPayments.length} payments</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#E7ECF3] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-[#FFF0F0] rounded-lg">
                  <ShoppingBag className="text-[#E53E3E]" size={24} />
                </div>
                <Package className="text-[#FF7A00]" size={20} />
              </div>
              <div>
                <p className="text-[#6D7A8B] text-sm mb-1 font-medium">Orders</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-[#0B0F1A]">{orders.length}</p>
                  <span className="text-sm text-[#6D7A8B]">
                    ({orders.filter((o) => o.status === "delivered").length} delivered)
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#E7ECF3] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-[#FFF4E6] rounded-lg">
                  <Calendar className="text-[#FF7A00]" size={24} />
                </div>
                <Activity className="text-[#2B4C73]" size={20} />
              </div>
              <div>
                <p className="text-[#6D7A8B] text-sm mb-1 font-medium">Upcoming Events</p>
                <p className="text-2xl font-bold text-[#0B0F1A]">
                  {events.filter((e) => e.status === "upcoming").length}
                </p>
                <p className="text-sm text-[#6D7A8B] mt-1">Available to attend</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#E7ECF3] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-[#E8F4FD] rounded-lg">
                  <Award className="text-[#2B4C73]" size={24} />
                </div>
                <Activity className="text-[#FF7A00]" size={20} />
              </div>
              <div>
                <p className="text-[#6D7A8B] text-sm mb-1 font-medium">Payments Confirmed</p>
                <p className="text-2xl font-bold text-[#0B0F1A]">{confirmedPayments.length}</p>
                <p className="text-sm text-[#6D7A8B] mt-1">
                  {confirmedPayments.length ? "Thanks for your support" : "No confirmed payments yet"}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { id: "overview", label: "Overview", icon: Activity, color: COLORS.darkBlue },
              { id: "payments", label: "Payments", icon: CreditCard, color: COLORS.gold },
              { id: "orders", label: "Orders", icon: ShoppingBag, color: COLORS.maroon },
              { id: "events", label: "Events", icon: Calendar, color: COLORS.darkBlue },
              { id: "profile", label: "Profile", icon: User, color: COLORS.gold },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  router.replace(`/member/dashboard?tab=${tab.id}`);
                }}
                className={`px-5 py-3 font-medium rounded-lg transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? `text-white shadow-md`
                    : "bg-white text-[#6D7A8B] hover:bg-[#F7F9FC] border border-[#E7ECF3]"
                }`}
                style={{
                  background:
                    activeTab === tab.id
                      ? `linear-gradient(135deg, ${tab.color}, ${
                          tab.color === COLORS.darkBlue
                            ? COLORS.darkBlue
                            : tab.color === COLORS.gold
                            ? "#FF8C00"
                            : "#F56565"
                        })`
                      : "white",
                }}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content placeholder (keep your existing content) */}
          <div className="bg-white rounded-xl border border-[#E7ECF3] p-6 shadow-sm">
            <p className="text-[#6D7A8B]">
              Render your <span className="font-semibold text-[#0B0F1A]">{activeTab}</span> tab content here.
            </p>
          </div>
        </div>
      </main>

      {/* Global font */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap");
        .font-poppins {
          font-family: "Poppins", sans-serif;
        }
      `}</style>

      <Footer />
    </div>
  );
}
