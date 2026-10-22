"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../components/Header";
import {
  User, Phone, Mail, CreditCard, Calendar, ShoppingBag, CheckCircle,
  Clock, ArrowRight, Activity, Package, DollarSign, Edit, Shield,
  BadgeCheck, Users, MapPin, GraduationCap, BookOpen, LayoutDashboard,
  Menu, X, LogOut
} from "lucide-react";
import Link from "next/link";
import { supabase } from "../../../../app/(backend)/lib/supabase/client";
import { useAuth } from "../../../(backend)/context/auth";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import SessionWarning from "../../components/SessionWarning";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type MemberDetailsType = {
  id: string; email: string; full_name: string; membership_number: string;
  phone_number: string; graduation_year: number; course: string; county: string;
  status: "pending" | "active" | "expired" | "inactive"; role: "admin" | "member";
  created_at: string; updated_at: string; avatar_url?: string;
  registration_source?: "online" | "manual"; needs_password_setup?: boolean;
};

type PaymentType = {
  id: string; created_at: string; payment_type: "registration" | "renewal" | "event" | "merchandise";
  account_reference: string; amount: number; status: "pending" | "processing" | "confirmed" | "failed";
  user_id: string; description: string; phone_number: string; mpesa_receipt_number?: string; paid_at?: string;
};

type OrderType = {
  id: string; created_at: string; items: any[]; total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  user_id: string; customer_name: string; customer_phone: string; customer_email: string;
  shipping_address?: string; payment_id?: string;
};

type EventType = {
  id: string; name: string; description: string; event_date?: string; price: number;
  member_discount: number; location?: string; max_attendees?: number;
  current_attendees: number; status: "upcoming" | "ongoing" | "completed" | "cancelled"; is_active: boolean;
};

type MembershipType = {
  id: string; user_id: string; start_date: string; expiry_date: string; is_active: boolean; created_at: string;
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function MemberDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const searchParams = useSearchParams();
  const initialTab = searchParams?.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);

  const [memberDetails, setMemberDetails] = useState<MemberDetailsType | null>(null);
  const [membership, setMembership] = useState<MembershipType | null>(null);
  const [payments, setPayments] = useState<PaymentType[]>([]);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [events, setEvents] = useState<EventType[]>([]);

  const [debugError, setDebugError] = useState<string | null>(null);

  const router = useRouter();

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

  const resolveUserId = useCallback(async (): Promise<string | null> => {
    if (user?.id) return user.id;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) return null;
      return data.session?.user?.id ?? null;
    } catch (e) { return null; }
  }, [user?.id]);

  const fetchRemainingData = useCallback(async (userId: string) => {
    const results = await Promise.allSettled([
      supabase.from("memberships").select("*").eq("user_id", userId).eq("is_active", true).maybeSingle(),
      supabase.from("payments").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("orders").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("events").select("*").eq("is_active", true).in("status", ["upcoming", "ongoing"]).order("event_date", { ascending: true }).limit(10),
    ]);

    const [membershipRes, paymentsRes, ordersRes, eventsRes] = results;

    if (membershipRes.status === "fulfilled") setMembership(membershipRes.value.data ?? null);
    if (paymentsRes.status === "fulfilled") setPayments((paymentsRes.value.data as PaymentType[]) ?? []);
    if (ordersRes.status === "fulfilled") setOrders((ordersRes.value.data as OrderType[]) ?? []);
    if (eventsRes.status === "fulfilled") setEvents((eventsRes.value.data as EventType[]) ?? []);
  }, []);

  const fetchMemberData = useCallback(async () => {
    setDebugError(null);
    setLoading(true);

    try {
      const userId = await resolveUserId();
      if (!userId) { setDebugError("Could not resolve user."); setLoading(false); return; }

      const { data: memberData, error: memberError } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

      if (memberData) {
        if (memberData.role === "admin") { router.push("/admin/dashboard"); return; }
        setMemberDetails(memberData as MemberDetailsType);
      } else {
        setMemberDetails({ id: userId, email: user?.email || "", full_name: user?.email?.split("@")[0] || "Member", status: "active", role: "member", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), membership_number: "", phone_number: "", graduation_year: 0, course: "", county: "" });
        if (memberError) setDebugError(memberError.message);
      }

      await fetchRemainingData(userId);
    } catch (error: any) {
      setDebugError(error?.message || "Error loading data.");
    } finally {
      setLoading(false);
    }
  }, [resolveUserId, fetchRemainingData, router, user?.email]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    fetchMemberData();
  }, [user, authLoading, router, fetchMemberData]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const membershipActive = membership?.is_active || false;
  const expiryDate = safeDate(membership?.expiry_date || undefined);
  const membershipExpiry = expiryDate ? expiryDate.toLocaleDateString() : "N/A";
  const confirmedPayments = payments.filter((p) => p.status === "confirmed");
  const totalSpent = confirmedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "events", label: "Events", icon: Calendar },
    { id: "profile", label: "My Profile", icon: User },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1B3A6B] mx-auto"></div>
          <p className="mt-4 text-[#1B3A6B]/60 font-serif">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen w-full flex flex-col font-sans overflow-hidden bg-[#F7F9FC]">
      <SessionWarning />
      
      {/* Header */}
      <div className="flex-shrink-0 z-50">
        <Header />
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-40 bg-white border-r border-[#1B3A6B]/10 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-all duration-300 ease-in-out flex flex-col w-64 h-full`}>
          
          {/* Sidebar Profile & Logout Header */}
          <div className="p-5 border-b border-[#1B3A6B]/5 flex-shrink-0 bg-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1B3A6B] rounded-full flex items-center justify-center text-white font-serif font-bold text-sm shrink-0">
                  {getUserDisplayName().substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-montserrat font-bold text-[#1B3A6B] truncate">{getUserDisplayName()}</p>
                  <p className="text-xs text-[#1B3A6B]/50 truncate">{memberDetails?.membership_number || "Pending"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); router.replace(`/member/dashboard?tab=${tab.id}`); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-[#1B3A6B] text-white shadow-md' : 'text-[#1B3A6B]/60 hover:bg-[#1B3A6B]/5 hover:text-[#1B3A6B]'}`}
                >
                  <tab.icon size={18} className={isActive ? 'text-[#C9A84C]' : 'text-[#1B3A6B]/40'} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer / Help Card */}
          <div className="p-4 border-t border-[#1B3A6B]/5 flex-shrink-0">
            <div className="p-4 bg-[#F9F9F8] border border-[#1B3A6B]/10 rounded-xl">
              <h4 className="font-serif font-bold text-[#1B3A6B] text-sm mb-1">Need Help?</h4>
              <p className="text-xs text-[#1B3A6B]/60 mb-3 leading-relaxed">Contact the alumni office.</p>
              <Link href="/contact" className="text-xs font-semibold text-[#C9A84C] hover:underline uppercase tracking-wider">Contact Support &rarr;</Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-6xl mx-auto space-y-8 pb-12">
            
            {/* Welcome Header */}
            <div className="md:flex md:items-end md:justify-between border-b border-[#1B3A6B]/10 pb-6">
              <div className="flex items-start gap-4">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 bg-white rounded-lg border border-[#1B3A6B]/10 shadow-sm mt-1">
                  <Menu size={20} className="text-[#1B3A6B]" />
                </button>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1B3A6B]">
                    Welcome back, {getUserDisplayName()}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-xs text-[#1B3A6B]/60">
                    <span className="flex items-center gap-1.5"><Mail size={14} /> {user?.email}</span>
                    {memberDetails?.phone_number && <span className="flex items-center gap-1.5"><Phone size={14} /> {memberDetails.phone_number}</span>}
                  </div>
                </div>
              </div>
            
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total", value: `KES ${totalSpent.toLocaleString()}`, icon: DollarSign },
                { label: "Orders", value: orders.length, icon: ShoppingBag },
                { label: "Upcoming Events", value: events.filter(e => e.status === "upcoming").length, icon: Calendar },
                { label: "Payments", value: confirmedPayments.length, icon: CreditCard },
              ].map((stat, i) => (
                <div key={i} className="bg-white border border-[#1B3A6B]/10 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#1B3A6B]/5 p-2 rounded-lg">
                      <stat.icon className="text-[#1B3A6B]" size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#1B3A6B]/50 uppercase tracking-wider font-semibold">{stat.label}</p>
                      <p className="text-lg font-serif font-bold text-[#1B3A6B]">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-[#1B3A6B]/10 rounded-xl shadow-sm overflow-hidden min-h-[400px]"
              >
                {activeTab === "overview" && (
                  <div className="p-6">
                    <h3 className="text-lg font-serif font-bold text-[#1B3A6B] mb-6">Membership Status</h3>
                    
                    <div className={`p-6 rounded-xl border mb-6 ${membershipActive ? "bg-[#1B3A6B]/5 border-[#C9A84C]/30" : "bg-[#1B3A6B]/5 border-[#1B3A6B]/20"}`}>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg ${membershipActive ? 'bg-[#C9A84C]' : 'bg-[#1B3A6B]'}`}>
                            {membershipActive ? <CheckCircle className="text-white" size={24} /> : <Clock className="text-white" size={24} />}
                          </div>
                          <div>
                            <h4 className="text-lg font-sans font-bold ">
                              {membershipActive ? "Active Membership" : memberDetails?.status === "pending" ? "Pending Activation" : "Inactive Membership"}
                            </h4>
                            <p className="text-sm ">
                              {membershipActive ? `Valid until ${membershipExpiry}` : memberDetails?.status === "pending" ? "Complete your payment to activate" : "Renew to continue enjoying benefits"}
                            </p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-[#1B3A6B]/10">
                          <p className="text-[10px] text-[#1B3A6B]/50 uppercase tracking-wider font-semibold">Membership Number</p>
                          <p className="text-lg font-serif font-bold text-[#1B3A6B]">{memberDetails?.membership_number || "Pending"}</p>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-serif font-bold text-[#1B3A6B] mb-4">Recent Activity</h3>
                    {payments.length === 0 && orders.length === 0 ? (
                      <p className="text-[#1B3A6B]/50 text-sm">No recent activity found.</p>
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
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${p.status === "confirmed" ? " text-[#C9A84C]" : "bg-[#1B3A6B]/10 text-[#1B3A6B]/50"}`}>
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
                  <div className="p-6">
                    <h3 className="text-lg font-serif font-bold text-[#1B3A6B] mb-6">Payment History</h3>
                    {payments.length === 0 ? (
                      <p className="text-[#1B3A6B]/50 text-sm">No payments found.</p>
                    ) : (
                      <div className="space-y-3">
                        {payments.map((p) => (
                          <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#1B3A6B]/5 rounded-lg border border-[#1B3A6B]/10 gap-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-[#1B3A6B]/10 rounded-lg hidden sm:block">
                                <CreditCard size={16} className="text-[#1B3A6B]" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#1B3A6B]">{p.description || p.payment_type}</p>
                                <p className="text-xs text-[#1B3A6B]/50">
                                  {new Date(p.created_at).toLocaleDateString()} • {p.mpesa_receipt_number || p.account_reference}
                                </p>
                              </div>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="text-sm font-serif font-bold text-[#1B3A6B]">KES {p.amount?.toLocaleString()}</p>
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 ${p.status === "confirmed" ? " text-[#C9A84C]" : "bg-[#1B3A6B]/10 text-[#1B3A6B]/50"}`}>
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
                  <div className="p-6">
                    <h3 className="text-lg font-serif font-bold text-[#1B3A6B] mb-6">My Orders</h3>
                    {orders.length === 0 ? (
                      <p className="text-[#1B3A6B]/50 text-sm">No orders found.</p>
                    ) : (
                      <div className="space-y-3">
                        {orders.map((o) => (
                          <div key={o.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#1B3A6B]/5 rounded-lg border border-[#1B3A6B]/10 gap-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-[#C9A84C]/10 rounded-lg hidden sm:block">
                                <ShoppingBag size={16} className="text-[#C9A84C]" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#1B3A6B]">Order #{o.id.slice(0, 8).toUpperCase()}</p>
                                <p className="text-xs text-[#1B3A6B]/50">
                                  {new Date(o.created_at).toLocaleDateString()} • {o.items?.length || 0} item(s)
                                </p>
                              </div>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="text-sm font-serif font-bold text-[#1B3A6B]">KES {o.total?.toLocaleString()}</p>
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${o.status === "delivered" ? "bg-[#C9A84C]/10 text-[#C9A84C]" : "bg-[#1B3A6B]/10 text-[#1B3A6B]/50"}`}>
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
                  <div className="p-6">
                    <h3 className="text-lg font-serif font-bold text-[#1B3A6B] mb-6">Upcoming Events</h3>
                    {events.length === 0 ? (
                      <p className="text-[#1B3A6B]/50 text-sm">No upcoming events at the moment.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {events.map((e) => (
                          <div key={e.id} className="p-5 bg-[#1B3A6B]/5 rounded-lg border border-[#1B3A6B]/10">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-sm font-serif font-bold text-[#1B3A6B]">{e.name}</h4>
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#C9A84C]/10 text-[#C9A84C]">{e.status}</span>
                            </div>
                            <p className="text-xs text-[#1B3A6B]/60 mb-3 line-clamp-2">{e.description}</p>
                            <div className="flex items-center justify-between text-xs text-[#1B3A6B]/50 pt-3 border-t border-[#1B3A6B]/10">
                              <span>
                                {e.event_date ? new Date(e.event_date).toLocaleDateString() : "TBD"}
                                {e.location ? ` • ${e.location}` : ""}
                              </span>
                              <span className="font-serif font-bold text-[#1B3A6B]">
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
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-serif font-bold text-[#1B3A6B]">Profile Details</h3>
                      <Link href="/member/dashboard/profile/edit" className="flex items-center gap-2 px-4 py-2 bg-[#1B3A6B] text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-[#152e55] transition">
                        <Edit size={14} /> Edit Profile
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
                            <p className="text-[10px] text-[#1B3A6B]/50 uppercase tracking-wider font-semibold">{label}</p>
                          </div>
                          <p className="text-sm font-medium text-[#1B3A6B]">{value || "—"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}