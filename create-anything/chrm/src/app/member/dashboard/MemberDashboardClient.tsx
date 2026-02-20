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

  // Close profile menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync tab with URL
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

  // ─── FIX: Robust session resolution ────────────────────────────────────────
  // Returns the best user ID we can get — from auth context or live Supabase session.
  const resolveUserId = useCallback(async (): Promise<string | null> => {
    // 1) Trust auth context first (already resolved in the app)
    if (user?.id) return user.id;

    // 2) Fall back to a live Supabase session check
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

  // ─── FIX: Fetch all secondary data in parallel ──────────────────────────────
  const fetchRemainingData = useCallback(async (userId: string) => {
    const results = await Promise.allSettled([
      // Membership
      supabase
        .from("memberships")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle(),

      // Payments
      supabase
        .from("payments")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),

      // Orders
      supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),

      // Events (not user-scoped — public list)
      supabase
        .from("events")
        .select("*")
        .eq("is_active", true)
        .in("status", ["upcoming", "ongoing"])
        .order("event_date", { ascending: true })
        .limit(10),
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

  // ─── FIX: Main fetch — no longer bails on missing Supabase session ──────────
  const fetchMemberData = useCallback(async () => {
    setDebugError(null);
    setLoading(true);

    try {
      // 1) Resolve user ID — from context OR live session
      const userId = await resolveUserId();

      if (!userId) {
        setDebugError(
          "Could not resolve a user ID. Make sure login uses Supabase Auth " +
            "(supabase.auth.signInWithPassword / OAuth). Check the browser console for details."
        );
        setLoading(false);
        return;
      }

      // 2) Fetch profile — but never hard-fail; always show *something*
      const { data: memberData, error: memberError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (memberError) {
        console.warn("Profiles fetch error (RLS or schema issue):", memberError.message);
        // Non-fatal: build a minimal fallback profile so the UI still renders
      }

      if (memberData) {
        // ── FIX: Guard admin redirect ONLY after profile is loaded ──
        if (memberData.role === "admin") {
          router.push("/admin/dashboard");
          return;
        }
        setMemberDetails(memberData as MemberDetailsType);
      } else {
        // Profile row missing or blocked by RLS — use fallback
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
          setDebugError(
            `Profile table error: "${memberError.message}". ` +
              "Check your RLS policies on the 'profiles' table — the logged-in user must be able to SELECT their own row."
          );
        }
      }

      // 3) Always fetch remaining data regardless of profile result
      await fetchRemainingData(userId);
    } catch (error: any) {
      console.error("fetchMemberData exception:", error);
      setDebugError(error?.message || "Unexpected error loading dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [resolveUserId, fetchRemainingData, router, user?.email]);

  // ─── FIX: Effect — removed premature role check on raw auth user ────────────
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    // Do NOT check user.role here — it's on the profile row, not the auth user.
    // The redirect is handled inside fetchMemberData after profile is loaded.
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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#2B4C73] to-[#FF7A00] rounded-xl flex items-center justify-center shadow-md">
                <User className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#0B0F1A]">Member Dashboard</h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/"
                className="hidden md:flex items-center gap-2 px-3 py-2 text-[#6D7A8B] hover:text-[#0B0F1A] hover:bg-[#F7F9FC] rounded-lg transition"
              >
                <Home size={18} />
                <span>Home</span>
              </Link>

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
                        className="w-full flex items-center gap-3 px-3 py-2 text-[#0B0F1A] hover:bg-[#F7F9FC] rounded-lg transition"
                      >
                        <LogOut size={16} className="text-[#E53E3E]" />
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="w-full flex-1">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

          {/* Debug banner — only shown when there's an error */}
          {debugError && (
            <div className="mb-6 bg-[#FFF0F0] border border-[#E53E3E]/30 text-[#0B0F1A] rounded-xl p-4">
              <p className="font-semibold mb-1">⚠️ Some data could not be loaded</p>
              <p className="text-sm text-[#6D7A8B]">{debugError}</p>
              <p className="text-sm text-[#6D7A8B] mt-2">
                Check your Supabase RLS policies and ensure the user is authenticated via{" "}
                <code className="mx-1 bg-[#F7F9FC] px-1 rounded">supabase.auth.signInWithPassword</code>.
              </p>
            </div>
          )}

          {/* Welcome + Membership expiry */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
                      {membershipActive
                        ? "Active"
                        : memberDetails?.status === "pending"
                        ? "Pending"
                        : "Inactive"}
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
                  {membershipActive ? "You're covered" : "Renew to activate benefits"}
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

          {/* Stats */}
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
                    ? "text-white shadow-md"
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
                      : undefined,
                }}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="bg-white rounded-xl border border-[#E7ECF3] p-6 shadow-sm">
            {activeTab === "overview" && (
              <div>
                <h3 className="text-lg font-semibold text-[#0B0F1A] mb-4">Recent Activity</h3>
                {payments.length === 0 && orders.length === 0 ? (
                  <p className="text-[#6D7A8B]">No recent activity found.</p>
                ) : (
                  <div className="space-y-3">
                    {payments.slice(0, 5).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 bg-[#F7F9FC] rounded-lg border border-[#E7ECF3]"
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard size={16} className="text-[#2B4C73]" />
                          <div>
                            <p className="text-sm font-medium text-[#0B0F1A]">{p.description || p.payment_type}</p>
                            <p className="text-xs text-[#6D7A8B]">
                              {new Date(p.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[#0B0F1A]">Ksh {p.amount?.toLocaleString()}</p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              p.status === "confirmed"
                                ? "bg-[#E8F4FD] text-[#2B4C73]"
                                : p.status === "failed"
                                ? "bg-[#FFF0F0] text-[#E53E3E]"
                                : "bg-[#FFF4E6] text-[#FF7A00]"
                            }`}
                          >
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
                <h3 className="text-lg font-semibold text-[#0B0F1A] mb-4">Payment History</h3>
                {payments.length === 0 ? (
                  <p className="text-[#6D7A8B]">No payments found.</p>
                ) : (
                  <div className="space-y-3">
                    {payments.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-4 bg-[#F7F9FC] rounded-lg border border-[#E7ECF3]"
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard size={16} className="text-[#2B4C73]" />
                          <div>
                            <p className="text-sm font-medium text-[#0B0F1A]">{p.description || p.payment_type}</p>
                            <p className="text-xs text-[#6D7A8B]">
                              {new Date(p.created_at).toLocaleDateString()} •{" "}
                              {p.mpesa_receipt_number || p.account_reference}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[#0B0F1A]">Ksh {p.amount?.toLocaleString()}</p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              p.status === "confirmed"
                                ? "bg-[#E8F4FD] text-[#2B4C73]"
                                : p.status === "failed"
                                ? "bg-[#FFF0F0] text-[#E53E3E]"
                                : "bg-[#FFF4E6] text-[#FF7A00]"
                            }`}
                          >
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
                <h3 className="text-lg font-semibold text-[#0B0F1A] mb-4">My Orders</h3>
                {orders.length === 0 ? (
                  <p className="text-[#6D7A8B]">No orders found.</p>
                ) : (
                  <div className="space-y-3">
                    {orders.map((o) => (
                      <div
                        key={o.id}
                        className="flex items-center justify-between p-4 bg-[#F7F9FC] rounded-lg border border-[#E7ECF3]"
                      >
                        <div className="flex items-center gap-3">
                          <ShoppingBag size={16} className="text-[#E53E3E]" />
                          <div>
                            <p className="text-sm font-medium text-[#0B0F1A]">
                              Order #{o.id.slice(0, 8).toUpperCase()}
                            </p>
                            <p className="text-xs text-[#6D7A8B]">
                              {new Date(o.created_at).toLocaleDateString()} • {o.items?.length || 0} item(s)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[#0B0F1A]">Ksh {o.total?.toLocaleString()}</p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              o.status === "delivered"
                                ? "bg-[#E8F4FD] text-[#2B4C73]"
                                : o.status === "cancelled"
                                ? "bg-[#FFF0F0] text-[#E53E3E]"
                                : "bg-[#FFF4E6] text-[#FF7A00]"
                            }`}
                          >
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
                <h3 className="text-lg font-semibold text-[#0B0F1A] mb-4">Upcoming Events</h3>
                {events.length === 0 ? (
                  <p className="text-[#6D7A8B]">No upcoming events at the moment.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map((e) => (
                      <div
                        key={e.id}
                        className="p-4 bg-[#F7F9FC] rounded-lg border border-[#E7ECF3]"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-semibold text-[#0B0F1A]">{e.name}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#E8F4FD] text-[#2B4C73]">
                            {e.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#6D7A8B] mb-2 line-clamp-2">{e.description}</p>
                        <div className="flex items-center justify-between text-xs text-[#6D7A8B]">
                          <span>
                            {e.event_date ? new Date(e.event_date).toLocaleDateString() : "TBD"}
                            {e.location ? ` • ${e.location}` : ""}
                          </span>
                          <span className="font-semibold text-[#FF7A00]">
                            {e.price === 0 ? "Free" : `Ksh ${e.price?.toLocaleString()}`}
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
                  <h3 className="text-lg font-semibold text-[#0B0F1A]">Profile Details</h3>
                  <Link
                    href="/member/dashboard/profile/edit"
                    className="flex items-center gap-2 px-4 py-2 bg-[#2B4C73] text-white text-sm rounded-lg hover:opacity-90 transition"
                  >
                    <Edit size={14} />
                    Edit Profile
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Full Name", value: memberDetails?.full_name },
                    { label: "Email", value: memberDetails?.email || user?.email },
                    { label: "Phone", value: memberDetails?.phone_number },
                    { label: "Membership No.", value: memberDetails?.membership_number },
                    { label: "Course", value: memberDetails?.course },
                    { label: "Graduation Year", value: memberDetails?.graduation_year?.toString() },
                    { label: "County", value: memberDetails?.county },
                    { label: "Status", value: memberDetails?.status },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-4 bg-[#F7F9FC] rounded-lg border border-[#E7ECF3]">
                      <p className="text-xs text-[#6D7A8B] mb-1">{label}</p>
                      <p className="text-sm font-medium text-[#0B0F1A]">{value || "—"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

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