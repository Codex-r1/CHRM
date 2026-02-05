"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Footer from "../../components/Footer";
import {
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Calendar,
  ShoppingBag,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  Activity,
  TrendingUp,
  Package,
  DollarSign,
  Award,
  Settings,
  LogOut,
  Home,
  ChevronRight,
  ExternalLink,
  Star,
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

// CHRMAA Colors from About Page
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
  const [activeTab, setActiveTab] = useState("overview");
  const [memberDetails, setMemberDetails] = useState<MemberDetailsType | null>(null);
  const [membership, setMembership] = useState<MembershipType | null>(null);
  const [payments, setPayments] = useState<PaymentType[]>([]);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [events, setEvents] = useState<EventType[]>([]);
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
        <div className="text-[#2B4C73] text-xl font-poppins">Loading Dashboard...</div>
      </div>
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

  const confirmedPayments = payments.filter(p => p.status === "confirmed");
  const totalSpent = confirmedPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-poppins flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E7ECF3] sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2B4C73] to-[#FF7A00] rounded-xl flex items-center justify-center shadow-md">
              <User className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0B0F1A]">
                Member Dashboard
              </h1>
              <p className="text-[#6D7A8B] text-sm">Welcome back, {getUserDisplayName()}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="px-4 py-2 bg-white border border-[#E7ECF3] text-[#6D7A8B] rounded-lg hover:bg-[#F7F9FC] transition flex items-center gap-2 font-medium"
            >
              <Home size={16} />
              Home
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gradient-to-r from-[#E53E3E] to-[#FF7A00] text-white rounded-lg hover:opacity-90 transition flex items-center gap-2 font-medium shadow-sm"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 flex-1">
        {/* Membership Status Banner */}
        <div className={`p-6 rounded-xl mb-8 border shadow-sm ${
          membershipActive 
            ? "bg-gradient-to-r from-[#E8F4FD] to-[#d4e9fa] border-[#2B4C73]/20" 
            : "bg-gradient-to-r from-[#FFF4E6] to-[#ffe9cc] border-[#FF7A00]/20"
        }`}>
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
                  {membershipActive ? "Active Membership" : memberDetails?.status === "pending" ? "Pending Activation" : "Inactive Membership"}
                </h2>
                <p className="text-[#6D7A8B] mt-1 font-medium">
                  {membershipActive 
                    ? `Valid until ${membershipExpiry}`
                    : memberDetails?.status === "pending"
                    ? "Complete your payment to activate"
                    : "Renew to continue enjoying benefits"
                  }
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

        {/* Stats Cards */}
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
                  ({orders.filter(o => o.status === 'delivered').length} delivered)
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
                {events.filter(e => e.status === 'upcoming').length}
              </p>
              <p className="text-sm text-[#6D7A8B] mt-1">Available to attend</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#E7ECF3] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#E8F4FD] rounded-lg">
                <Award className="text-[#2B4C73]" size={24} />
              </div>
              <TrendingUp className="text-[#E53E3E]" size={20} />
            </div>
            <div>
              <p className="text-[#6D7A8B] text-sm mb-1 font-medium">Member Since</p>
              <p className="text-xl font-bold text-[#0B0F1A]">
                {memberDetails?.created_at
                  ? new Date(memberDetails.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : "N/A"}
              </p>
              <p className="text-sm text-[#6D7A8B] mt-1">
                {membershipActive ? "Active member" : "Status: " + (memberDetails?.status || "Unknown")}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: "overview", label: "Overview", icon: Activity, color: COLORS.darkBlue },
            { id: "payments", label: "Payments", icon: CreditCard, color: COLORS.gold },
            { id: "orders", label: "Orders", icon: ShoppingBag, color: COLORS.maroon },
            { id: "events", label: "Events", icon: Calendar, color: COLORS.darkBlue },
            { id: "profile", label: "Profile", icon: User, color: COLORS.gold }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? `text-white shadow-md`
                  : "bg-white text-[#6D7A8B] hover:bg-[#F7F9FC] border border-[#E7ECF3]"
              }`}
              style={{
                background: activeTab === tab.id 
                  ? `linear-gradient(135deg, ${tab.color}, ${tab.color === COLORS.darkBlue ? COLORS.darkBlue : tab.color === COLORS.gold ? '#FF8C00' : '#F56565'})`
                  : 'white'
              }}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl border border-[#E7ECF3] p-6 shadow-sm">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-[#0B0F1A] mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Link
                    href="/payments"
                    className="group bg-[#E8F4FD] p-6 rounded-xl border border-[#2B4C73]/20 hover:shadow-lg transition-all hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-[#2B4C73] rounded-lg">
                        <CreditCard className="text-white" size={24} />
                      </div>
                      <ArrowRight className="text-[#2B4C73] group-hover:translate-x-1 transition" size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-[#0B0F1A] mb-2">Make a Payment</h3>
                    <p className="text-[#6D7A8B]">Renew membership, pay for events, or settle invoices</p>
                  </Link>

                  <Link
                    href="/merchandise"
                    className="group bg-[#FFF0F0] p-6 rounded-xl border border-[#E53E3E]/20 hover:shadow-lg transition-all hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-[#E53E3E] rounded-lg">
                        <ShoppingBag className="text-white" size={24} />
                      </div>
                      <ArrowRight className="text-[#E53E3E] group-hover:translate-x-1 transition" size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-[#0B0F1A] mb-2">Shop Merchandise</h3>
                    <p className="text-[#6D7A8B]">Browse and purchase CHRMAA branded items</p>
                  </Link>

                  <Link
                    href="/events"
                    className="group bg-[#FFF4E6] p-6 rounded-xl border border-[#FF7A00]/20 hover:shadow-lg transition-all hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-[#FF7A00] rounded-lg">
                        <Calendar className="text-white" size={24} />
                      </div>
                      <ArrowRight className="text-[#FF7A00] group-hover:translate-x-1 transition" size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-[#0B0F1A] mb-2">Browse Events</h3>
                    <p className="text-[#6D7A8B]">View and register for upcoming alumni events</p>
                  </Link>

                  <Link
                    href="/member/profile/edit"
                    className="group bg-[#E8F4FD] p-6 rounded-xl border border-[#2B4C73]/20 hover:shadow-lg transition-all hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-[#2B4C73] rounded-lg">
                        <Settings className="text-white" size={24} />
                      </div>
                      <ArrowRight className="text-[#2B4C73] group-hover:translate-x-1 transition" size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-[#0B0F1A] mb-2">Update Profile</h3>
                    <p className="text-[#6D7A8B]">Edit your personal information and preferences</p>
                  </Link>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h2 className="text-2xl font-bold text-[#0B0F1A] mb-4">Recent Activity</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Payments */}
                  <div className="bg-[#F7F9FC] rounded-xl p-5 border border-[#E7ECF3]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-[#0B0F1A] flex items-center gap-2">
                        <DollarSign size={20} className="text-[#FF7A00]" />
                        Recent Payments
                      </h3>
                      <Link href="/payments" className="text-sm text-[#2B4C73] hover:text-[#1E3A5F] flex items-center gap-1">
                        View all <ChevronRight size={14} />
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {payments.slice(0, 3).map((payment) => (
                        <div key={payment.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-[#E7ECF3] hover:shadow-sm transition">
                          <div>
                            <p className="text-[#0B0F1A] font-medium capitalize">{payment.payment_type}</p>
                            <p className="text-sm text-[#6D7A8B]">{new Date(payment.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[#0B0F1A] font-bold">Ksh {payment.amount.toLocaleString()}</p>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              payment.status === "confirmed" ? "bg-[#E8F4FD] text-[#2B4C73]" :
                              payment.status === "pending" ? "bg-[#FFF4E6] text-[#FF7A00]" :
                              "bg-[#FFF0F0] text-[#E53E3E]"
                            }`}>
                              {payment.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {payments.length === 0 && (
                        <div className="text-center text-[#6D7A8B] py-4 bg-white rounded-lg border border-[#E7ECF3]">
                          <Clock className="mx-auto mb-2 text-[#E7ECF3]" size={24} />
                          <p>No payments yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Orders */}
                  <div className="bg-[#F7F9FC] rounded-xl p-5 border border-[#E7ECF3]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-[#0B0F1A] flex items-center gap-2">
                        <Package size={20} className="text-[#2B4C73]" />
                        Recent Orders
                      </h3>
                      <Link href="/orders" className="text-sm text-[#2B4C73] hover:text-[#1E3A5F] flex items-center gap-1">
                        View all <ChevronRight size={14} />
                      </Link>
                    </div>
                    <div className="space-y-3">
                      {orders.slice(0, 3).map((order) => (
                        <div key={order.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-[#E7ECF3] hover:shadow-sm transition">
                          <div>
                            <p className="text-[#0B0F1A] font-medium">Order #{order.id.slice(0, 8)}</p>
                            <p className="text-sm text-[#6D7A8B]">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[#0B0F1A] font-bold">Ksh {order.total.toLocaleString()}</p>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              order.status === "delivered" ? "bg-[#E8F4FD] text-[#2B4C73]" :
                              order.status === "shipped" ? "bg-[#FFF4E6] text-[#FF7A00]" :
                              "bg-[#FFF0F0] text-[#E53E3E]"
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {orders.length === 0 && (
                        <div className="text-center text-[#6D7A8B] py-4 bg-white rounded-lg border border-[#E7ECF3]">
                          <ShoppingBag className="mx-auto mb-2 text-[#E7ECF3]" size={24} />
                          <p>No orders yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#0B0F1A]">
                  Payment History ({payments.length})
                </h2>
                <Link
                  href="/payments"
                  className="px-4 py-2 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white rounded-lg hover:opacity-90 transition hover:shadow-md flex items-center gap-2"
                >
                  <CreditCard size={16} />
                  Make Payment
                </Link>
              </div>
              {payments.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-[#E7ECF3]">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-[#6D7A8B] border-b border-[#E7ECF3]">
                        <th className="pb-3 px-4 font-semibold bg-[#F7F9FC]">Date</th>
                        <th className="pb-3 px-4 font-semibold bg-[#F7F9FC]">Type</th>
                        <th className="pb-3 px-4 font-semibold bg-[#F7F9FC]">Amount</th>
                        <th className="pb-3 px-4 font-semibold bg-[#F7F9FC]">Status</th>
                        <th className="pb-3 px-4 font-semibold bg-[#F7F9FC]">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id} className="border-b border-[#F7F9FC] hover:bg-[#F7F9FC]">
                          <td className="py-4 px-4 text-[#0B0F1A]">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 text-[#0B0F1A] capitalize">
                            {payment.payment_type}
                          </td>
                          <td className="py-4 px-4 text-[#0B0F1A] font-bold">
                            Ksh {payment.amount.toLocaleString()}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                              payment.status === "confirmed" ? "bg-[#E8F4FD] text-[#2B4C73]" :
                              payment.status === "pending" ? "bg-[#FFF4E6] text-[#FF7A00]" :
                              payment.status === "processing" ? "bg-[#FFF0F0] text-[#E53E3E]" :
                              "bg-[#F7F9FC] text-[#6D7A8B]"
                            }`}>
                              {payment.status === "confirmed" && <CheckCircle size={14} />}
                              {payment.status === "pending" && <Clock size={14} />}
                              {payment.status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {payment.mpesa_receipt_number && (
                              <span className="text-sm text-[#2B4C73] font-medium font-mono">
                                {payment.mpesa_receipt_number}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-[#F7F9FC] rounded-lg border border-[#E7ECF3]">
                  <Clock className="mx-auto text-[#E7ECF3] mb-4" size={48} />
                  <p className="text-[#6D7A8B] mb-4 font-medium">No payment history yet</p>
                  <Link
                    href="/payments"
                    className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white rounded-lg hover:opacity-90 transition hover:shadow-md"
                  >
                    Make Your First Payment
                    <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#0B0F1A]">
                  My Orders ({orders.length})
                </h2>
                <Link
                  href="/merchandise"
                  className="px-4 py-2 bg-gradient-to-r from-[#E53E3E] to-[#C53030] text-white rounded-lg hover:opacity-90 transition hover:shadow-md flex items-center gap-2"
                >
                  <ShoppingBag size={16} />
                  Shop Now
                </Link>
              </div>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-[#F7F9FC] p-5 rounded-lg border border-[#E7ECF3] hover:shadow-md transition">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-semibold text-[#0B0F1A]">Order #{order.id.slice(0, 8)}</p>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              order.status === "delivered" ? "bg-[#E8F4FD] text-[#2B4C73]" :
                              order.status === "shipped" ? "bg-[#FFF4E6] text-[#FF7A00]" :
                              order.status === "processing" ? "bg-[#FFF0F0] text-[#E53E3E]" :
                              "bg-[#F7F9FC] text-[#6D7A8B]"
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm text-[#6D7A8B]">{new Date(order.created_at).toLocaleDateString()}</p>
                          <p className="text-sm text-[#6D7A8B] mt-1">{order.items?.length || 0} items</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-[#0B0F1A]">Ksh {order.total.toLocaleString()}</p>
                          <Link href={`/orders/${order.id}`} className="mt-2 text-sm text-[#2B4C73] hover:text-[#1E3A5F] font-medium flex items-center gap-1 justify-end">
                            View Details <ChevronRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-[#F7F9FC] rounded-lg border border-[#E7ECF3]">
                  <ShoppingBag className="mx-auto text-[#E7ECF3] mb-4" size={48} />
                  <p className="text-[#6D7A8B] mb-4 font-medium">No orders yet</p>
                  <Link
                    href="/merchandise"
                    className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#E53E3E] to-[#C53030] text-white rounded-lg hover:opacity-90 transition hover:shadow-md"
                  >
                    Start Shopping
                    <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Events Tab */}
          {activeTab === "events" && (
            <div>
              <h2 className="text-2xl font-bold text-[#0B0F1A] mb-6">
                Upcoming Events ({events.filter(e => e.status === 'upcoming').length})
              </h2>
              {events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {events.map((event) => (
                    <div key={event.id} className="bg-[#F7F9FC] p-6 rounded-lg border border-[#E7ECF3] hover:shadow-md transition hover:-translate-y-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-[#FFF4E6] rounded-lg">
                          <Calendar className="text-[#FF7A00]" size={24} />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          event.status === "upcoming" ? "bg-[#E8F4FD] text-[#2B4C73]" :
                          event.status === "ongoing" ? "bg-[#FFF0F0] text-[#E53E3E]" :
                          "bg-[#F7F9FC] text-[#6D7A8B]"
                        }`}>
                          {event.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#0B0F1A] mb-2">{event.name}</h3>
                      <p className="text-sm text-[#6D7A8B] mb-4 line-clamp-2">{event.description}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-[#6D7A8B]">
                            {event.event_date ? new Date(event.event_date).toLocaleDateString() : "TBA"}
                          </p>
                          <p className="text-sm text-[#6D7A8B]">{event.location || "Location TBA"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#0B0F1A]">Ksh {event.price.toLocaleString()}</p>
                          {membershipActive && event.member_discount > 0 && (
                            <p className="text-xs text-[#FF7A00] font-medium">
                              {event.member_discount}% member discount
                            </p>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/events/register/${event.id}`}
                        className="mt-4 block w-full text-center px-4 py-2 bg-gradient-to-r from-[#FF7A00] to-[#FF9500] text-white rounded-lg hover:opacity-90 transition hover:shadow-md"
                      >
                        Register Now
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-[#F7F9FC] rounded-lg border border-[#E7ECF3]">
                  <Calendar className="mx-auto text-[#E7ECF3] mb-4" size={48} />
                  <p className="text-[#6D7A8B] font-medium">No upcoming events at the moment</p>
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && memberDetails && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#0B0F1A]">
                  Profile Information
                </h2>
                <Link
                  href="/member/dashboard/profile/edit"
                  className="px-4 py-2 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white rounded-lg hover:opacity-90 transition hover:shadow-md flex items-center gap-2"
                >
                  <Settings size={16} />
                  Edit Profile
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Full Name", value: memberDetails.full_name, icon: User, color: COLORS.darkBlue },
                  { label: "Email", value: memberDetails.email, icon: Mail, color: COLORS.gold },
                  { label: "Phone Number", value: memberDetails.phone_number || "Not provided", icon: Phone, color: COLORS.maroon },
                  { label: "County", value: memberDetails.county || "Not provided", icon: MapPin, color: COLORS.darkBlue },
                  { label: "Graduation Year", value: memberDetails.graduation_year || "Not provided", icon: Calendar, color: COLORS.gold },
                  { label: "Course", value: memberDetails.course || "Not provided", icon: Award, color: COLORS.maroon },
                ].map((field, index) => (
                  <div key={index} className="bg-[#F7F9FC] p-5 rounded-lg border border-[#E7ECF3] hover:shadow-sm transition">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-white rounded-lg border border-[#E7ECF3]" style={{ color: field.color }}>
                        <field.icon size={18} />
                      </div>
                      <p className="text-sm text-[#6D7A8B] font-medium">{field.label}</p>
                    </div>
                    <p className="text-[#0B0F1A] font-semibold ml-11">{field.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-[#E8F4FD] rounded-lg border border-[#2B4C73]/20">
                <h3 className="text-lg font-semibold text-[#0B0F1A] mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[#6D7A8B] mb-1 font-medium">Account Status</p>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      memberDetails.status === "active" ? "bg-[#E8F4FD] text-[#2B4C73]" :
                      memberDetails.status === "pending" ? "bg-[#FFF4E6] text-[#FF7A00]" :
                      "bg-[#FFF0F0] text-[#E53E3E]"
                    }`}>
                      {memberDetails.status === "active" && <CheckCircle size={14} />}
                      {memberDetails.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-[#6D7A8B] mb-1 font-medium">Member Since</p>
                    <p className="text-[#0B0F1A] font-medium">
                      {new Date(memberDetails.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Add global font style */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        
        .font-poppins {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>
      
      <Footer />
    </div>
  );
}