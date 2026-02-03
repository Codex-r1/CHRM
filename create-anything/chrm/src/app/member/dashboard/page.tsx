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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900 text-xl">Loading Dashboard...</div>
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
    <div className="min-h-screen bg-gray-50 font-inter flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <User className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-poppins">
                Member Dashboard
              </h1>
              <p className="text-gray-600 text-sm">Welcome back, {getUserDisplayName()}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
            >
              <Home size={16} />
              Home
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
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
            ? "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200" 
            : "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200"
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {membershipActive ? (
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <CheckCircle className="text-emerald-600" size={32} />
                </div>
              ) : (
                <div className="p-3 bg-amber-100 rounded-lg">
                  <XCircle className="text-amber-600" size={32} />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 font-poppins">
                  {membershipActive ? "Active Membership" : memberDetails?.status === "pending" ? "Pending Activation" : "Inactive Membership"}
                </h2>
                <p className="text-gray-700 mt-1">
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
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Membership Number</p>
                <p className="text-xl font-bold text-gray-900">
                  {memberDetails?.membership_number || "Pending"}
                </p>
              </div>
              
              {!membershipActive && (
                <Link
                  href={memberDetails?.status === "pending" ? "/register/payment" : "/payments"}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:opacity-90 transition shadow-md flex items-center gap-2 whitespace-nowrap"
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
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <CreditCard className="text-blue-500" size={28} />
              <DollarSign className="text-green-500" size={20} />
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Spent</p>
              <p className="text-3xl font-bold text-gray-900">Ksh {totalSpent.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">{confirmedPayments.length} payments</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <ShoppingBag className="text-emerald-500" size={28} />
              <Package className="text-blue-500" size={20} />
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Orders</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
                <span className="text-sm text-gray-500">
                  ({orders.filter(o => o.status === 'delivered').length} delivered)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="text-purple-500" size={28} />
              <Activity className="text-pink-500" size={20} />
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Upcoming Events</p>
              <p className="text-3xl font-bold text-gray-900">
                {events.filter(e => e.status === 'upcoming').length}
              </p>
              <p className="text-sm text-gray-500 mt-1">Available to attend</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Award className="text-amber-500" size={28} />
              <TrendingUp className="text-cyan-500" size={20} />
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Member Since</p>
              <p className="text-xl font-bold text-gray-900">
                {memberDetails?.created_at
                  ? new Date(memberDetails.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : "N/A"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {membershipActive ? "Active member" : "Status: " + (memberDetails?.status || "Unknown")}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "payments", label: "Payments", icon: CreditCard },
            { id: "orders", label: "Orders", icon: ShoppingBag },
            { id: "events", label: "Events", icon: Calendar },
            { id: "profile", label: "Profile", icon: User }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 font-medium rounded-lg transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 font-poppins">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Link
                    href="/payments"
                    className="group bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 hover:shadow-lg transition"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-500 rounded-lg">
                        <CreditCard className="text-white" size={24} />
                      </div>
                      <ArrowRight className="text-blue-600 group-hover:translate-x-1 transition" size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 font-poppins">Make a Payment</h3>
                    <p className="text-gray-700">Renew membership, pay for events, or settle invoices</p>
                  </Link>

                  <Link
                    href="/merchandise"
                    className="group bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border border-emerald-200 hover:shadow-lg transition"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-emerald-500 rounded-lg">
                        <ShoppingBag className="text-white" size={24} />
                      </div>
                      <ArrowRight className="text-emerald-600 group-hover:translate-x-1 transition" size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 font-poppins">Shop Merchandise</h3>
                    <p className="text-gray-700">Browse and purchase CHRMAA branded items</p>
                  </Link>

                  <Link
                    href="/events"
                    className="group bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 hover:shadow-lg transition"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-purple-500 rounded-lg">
                        <Calendar className="text-white" size={24} />
                      </div>
                      <ArrowRight className="text-purple-600 group-hover:translate-x-1 transition" size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 font-poppins">Browse Events</h3>
                    <p className="text-gray-700">View and register for upcoming alumni events</p>
                  </Link>

                  <Link
                    href="/member/profile/edit"
                    className="group bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl border border-amber-200 hover:shadow-lg transition"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-amber-500 rounded-lg">
                        <Settings className="text-white" size={24} />
                      </div>
                      <ArrowRight className="text-amber-600 group-hover:translate-x-1 transition" size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 font-poppins">Update Profile</h3>
                    <p className="text-gray-700">Edit your personal information and preferences</p>
                  </Link>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 font-poppins">Recent Activity</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Payments */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <DollarSign size={20} className="text-emerald-500" />
                      Recent Payments
                    </h3>
                    <div className="space-y-3">
                      {payments.slice(0, 3).map((payment) => (
                        <div key={payment.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                          <div>
                            <p className="text-gray-900 font-medium capitalize">{payment.payment_type}</p>
                            <p className="text-sm text-gray-600">{new Date(payment.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-900 font-bold">Ksh {payment.amount.toLocaleString()}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              payment.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                              payment.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {payment.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {payments.length === 0 && (
                        <p className="text-center text-gray-500 py-4">No payments yet</p>
                      )}
                    </div>
                  </div>

                  {/* Recent Orders */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Package size={20} className="text-blue-500" />
                      Recent Orders
                    </h3>
                    <div className="space-y-3">
                      {orders.slice(0, 3).map((order) => (
                        <div key={order.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                          <div>
                            <p className="text-gray-900 font-medium">Order #{order.id.slice(0, 8)}</p>
                            <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-900 font-bold">Ksh {order.total.toLocaleString()}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              order.status === "delivered" ? "bg-emerald-100 text-emerald-700" :
                              order.status === "shipped" ? "bg-blue-100 text-blue-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {orders.length === 0 && (
                        <p className="text-center text-gray-500 py-4">No orders yet</p>
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
                <h2 className="text-2xl font-bold text-gray-900 font-poppins">
                  Payment History ({payments.length})
                </h2>
                <Link
                  href="/payments"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:opacity-90 transition"
                >
                  Make Payment
                </Link>
              </div>
              {payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-600 border-b border-gray-200">
                        <th className="pb-3 px-4 font-semibold">Date</th>
                        <th className="pb-3 px-4 font-semibold">Type</th>
                        <th className="pb-3 px-4 font-semibold">Amount</th>
                        <th className="pb-3 px-4 font-semibold">Status</th>
                        <th className="pb-3 px-4 font-semibold">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4 text-gray-900">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 text-gray-900 capitalize">
                            {payment.payment_type}
                          </td>
                          <td className="py-4 px-4 text-gray-900 font-bold">
                            Ksh {payment.amount.toLocaleString()}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                              payment.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                              payment.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                              payment.status === "processing" ? "bg-blue-100 text-blue-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {payment.status === "confirmed" && <CheckCircle size={14} />}
                              {payment.status === "pending" && <Clock size={14} />}
                              {payment.status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {payment.mpesa_receipt_number && (
                              <span className="text-sm text-gray-600 font-mono">
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
                <div className="text-center py-12">
                  <Clock className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-600 mb-4">No payment history yet</p>
                  <Link
                    href="/payments"
                    className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:opacity-90 transition"
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
                <h2 className="text-2xl font-bold text-gray-900 font-poppins">
                  My Orders ({orders.length})
                </h2>
                <Link
                  href="/merchandise"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:opacity-90 transition"
                >
                  Shop Now
                </Link>
              </div>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-gray-50 p-5 rounded-lg border border-gray-200 hover:shadow-md transition">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</p>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              order.status === "delivered" ? "bg-emerald-100 text-emerald-700" :
                              order.status === "shipped" ? "bg-blue-100 text-blue-700" :
                              order.status === "processing" ? "bg-yellow-100 text-yellow-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-600 mt-1">{order.items?.length || 0} items</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">Ksh {order.total.toLocaleString()}</p>
                          <button className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
                            View Details →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingBag className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-600 mb-4">No orders yet</p>
                  <Link
                    href="/merchandise"
                    className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:opacity-90 transition"
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6 font-poppins">
                Upcoming Events ({events.filter(e => e.status === 'upcoming').length})
              </h2>
              {events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {events.map((event) => (
                    <div key={event.id} className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <Calendar className="text-purple-600" size={24} />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          event.status === "upcoming" ? "bg-blue-100 text-blue-700" :
                          event.status === "ongoing" ? "bg-green-100 text-green-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {event.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{event.name}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">
                            {event.event_date ? new Date(event.event_date).toLocaleDateString() : "TBA"}
                          </p>
                          <p className="text-sm text-gray-600">{event.location || "Location TBA"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">Ksh {event.price.toLocaleString()}</p>
                          {membershipActive && event.member_discount > 0 && (
                            <p className="text-xs text-emerald-600">
                              {event.member_discount}% member discount
                            </p>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/events/register/${event.id}`}
                        className="mt-4 block w-full text-center px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:opacity-90 transition"
                      >
                        Register Now
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-600">No upcoming events at the moment</p>
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && memberDetails && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 font-poppins">
                  Profile Information
                </h2>
                <Link
                  href="/member/profile/edit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
                >
                  <Settings size={16} />
                  Edit Profile
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Full Name", value: memberDetails.full_name, icon: User },
                  { label: "Email", value: memberDetails.email, icon: Mail },
                  { label: "Phone Number", value: memberDetails.phone_number || "Not provided", icon: Phone },
                  { label: "County", value: memberDetails.county || "Not provided", icon: MapPin },
                  { label: "Graduation Year", value: memberDetails.graduation_year || "Not provided", icon: Calendar },
                  { label: "Course", value: memberDetails.course || "Not provided", icon: Award },
                ].map((field, index) => (
                  <div key={index} className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-white rounded-lg border border-gray-200">
                        <field.icon className="text-gray-600" size={18} />
                      </div>
                      <p className="text-sm text-gray-600 font-medium">{field.label}</p>
                    </div>
                    <p className="text-gray-900 font-semibold ml-11">{field.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Account Status</p>
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      memberDetails.status === "active" ? "bg-emerald-100 text-emerald-700" :
                      memberDetails.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {memberDetails.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Member Since</p>
                    <p className="text-gray-900 font-medium">
                      {new Date(memberDetails.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}