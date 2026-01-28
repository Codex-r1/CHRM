"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  CreditCard,
  Calendar,
  ShoppingBag,
  CheckCircle,
  Clock,
  XCircle,
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
  items: any[]; // JSONB array
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
  const { user, loading: authLoading, logout } = useAuth(); // Removed refreshUser
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
      
      // If there's an RLS recursion error, try this
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
        
        setMemberDetails(fallbackProfile);
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

// Separate function to fetch remaining data
const fetchRemainingData = async (profileData: any) => {
  try {
    const userId = profileData?.id || user?.id;
    
    // 2. Get membership data
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
    
    // 3. Get payments
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
    
    // 4. Get orders
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
    
    // 5. Get events - this should work without user-specific RLS
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
        // Provide fallback events
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-[#f8fafc] text-xl">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== "member") {
    return null;
  }

  const membershipActive = membership?.is_active || false;
  const membershipExpiry = membership?.expiry_date
    ? new Date(membership.expiry_date).toLocaleDateString()
    : "N/A";

  const memberSince = memberDetails?.created_at
    ? new Date(memberDetails.created_at).toLocaleDateString()
    : "N/A";

  // Calculate member price for events
  const calculateMemberPrice = (price: number, discount: number) => {
    return price - (price * discount) / 100;
  };

  // Parse order items
  const parseOrderItems = (items: any) => {
    if (!items || !Array.isArray(items)) return [];
    return items.map((item: any) => ({
      name: item.name || "Unknown Item",
      quantity: item.quantity || 1,
      price: item.price || 0,
      color: item.color || "N/A",
      size: item.size || "N/A",
    }));
  };

  // Get user display name - use memberDetails first, then user email as fallback
  const getUserDisplayName = () => {
    if (memberDetails?.full_name) {
      return memberDetails.full_name;
    }
    // Use user.email or default to "Member"
    return user?.email?.split('@')[0] || "Member";
  };

  // Replace everything from "return (" to the end with:

return (
  <div className="min-h-screen bg-[#0f172a] font-inter">
    {/* Debug header - remove in production */}
    <div className="bg-blue-500 text-white p-2 text-sm text-center">
      Dashboard Loaded | User: {getUserDisplayName()} | Membership: {memberDetails?.membership_number || 'None'}
    </div>

    {/* Header */}
    <header className="bg-[#1e293b] border-b border-[#334155]">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#f8fafc] font-poppins">
            Member Dashboard
          </h1>
          <p className="text-[#94a3b8]">Welcome, {getUserDisplayName()}</p>
          {memberDetails?.membership_number && (
            <p className="text-sm text-[#94a3b8]">
              Membership: {memberDetails.membership_number}
            </p>
          )}
        </div>
        <div className="flex gap-4">
          <Link
            href="/"
            className="px-4 py-2 bg-[#0f172a] border border-[#334155] text-white rounded hover:bg-[#1e293b] transition"
          >
            View Site
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>

    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Membership Status Card - Always show this first */}
      <div className="bg-gradient-to-br from-[#d69e2e] to-[#b8832a] p-8 rounded-lg mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-[#0f172a] mb-2 font-poppins">
              Membership Status
            </h2>
            <div className="flex items-center gap-3">
              {membershipActive ? (
                <>
                  <CheckCircle className="text-green-700" size={24} />
                  <span className="text-xl text-[#0f172a] font-semibold">
                    Active
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="text-red-700" size={24} />
                  <span className="text-xl text-[#0f172a] font-semibold">
                    {memberDetails?.status === "pending" ? "Pending Payment" : "Inactive"}
                  </span>
                </>
              )}
            </div>
            {membershipActive ? (
              <p className="text-[#1e293b] mt-2">
                Expires: {membershipExpiry}
              </p>
            ) : (
              <p className="text-[#1e293b] mt-2">
                {memberDetails?.status === "pending" 
                  ? "Complete registration payment to activate membership"
                  : "Renew your membership to continue enjoying benefits"}
              </p>
            )}
          </div>
          <div className="text-left md:text-right">
            <p className="text-[#1e293b] font-semibold mb-2">
              Membership Number
            </p>
            <p className="text-2xl font-bold text-[#0f172a]">
              {memberDetails?.membership_number || "Pending"}
            </p>
          </div>
        </div>
        {!membershipActive && (
          <div className="mt-6">
            <Link
              href={memberDetails?.status === "pending" ? "/register/payment" : "/payments"}
              className="inline-block px-6 py-3 bg-[#0f172a] text-white font-bold rounded hover:bg-[#1e293b] transition"
            >
              {memberDetails?.status === "pending" ? "Complete Registration" : "Renew Membership"}
            </Link>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-[#334155] overflow-x-auto">
        {["overview", "payments", "orders", "events", "profile"].map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold capitalize transition whitespace-nowrap ${
                activeTab === tab
                  ? "text-[#d69e2e] border-b-2 border-[#d69e2e]"
                  : "text-[#94a3b8] hover:text-[#f8fafc]"
              }`}
            >
              {tab}
            </button>
          ),
        )}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155]">
              <h2 className="text-2xl font-bold text-[#f8fafc] mb-4 font-poppins">
                Quick Stats
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0f172a] p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="text-blue-500" size={24} />
                    <div>
                      <p className="text-2xl font-bold text-[#f8fafc]">
                        {payments.filter(p => p.status === "confirmed").length}
                      </p>
                      <p className="text-[#94a3b8]">Confirmed Payments</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-[#0f172a] p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <ShoppingBag className="text-amber-500" size={24} />
                    <div>
                      <p className="text-2xl font-bold text-[#f8fafc]">
                        {orders.length}
                      </p>
                      <p className="text-[#94a3b8]">Orders</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-[#0f172a] p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="text-green-500" size={24} />
                    <div>
                      <p className="text-2xl font-bold text-[#f8fafc]">
                        {events.filter(e => e.status === "upcoming").length}
                      </p>
                      <p className="text-[#94a3b8]">Upcoming Events</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link
                href="/payments"
                className="bg-[#1e293b] p-6 rounded-lg border border-[#334155] hover:border-[#d69e2e] transition text-center"
              >
                <h3 className="text-xl font-bold text-[#f8fafc] mb-2 font-poppins">
                  Make a Payment
                </h3>
                <p className="text-[#cbd5e1]">
                  Renew membership or pay for events
                </p>
              </Link>

              <Link
                href="/merchandise"
                className="bg-[#1e293b] p-6 rounded-lg border border-[#334155] hover:border-[#d69e2e] transition text-center"
              >
                <h3 className="text-xl font-bold text-[#f8fafc] mb-2 font-poppins">
                  Shop Merchandise
                </h3>
                <p className="text-[#cbd5e1]">
                  Browse CHRMAA branded items
                </p>
              </Link>
            </div>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155]">
            <h2 className="text-2xl font-bold text-[#f8fafc] mb-4 font-poppins">
              Payment History
            </h2>
            {payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[#94a3b8] border-b border-[#334155]">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="text-[#cbd5e1] border-b border-[#334155]">
                        <td className="py-3">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 capitalize">
                          {payment.payment_type}
                        </td>
                        <td className="py-3">
                          Ksh {payment.amount.toLocaleString()}
                        </td>
                        <td className="py-3">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            payment.status === "confirmed" ? "bg-green-500/20 text-green-500" :
                            payment.status === "pending" ? "bg-yellow-500/20 text-yellow-500" :
                            "bg-red-500/20 text-red-500"
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="mx-auto mb-4 text-[#94a3b8]" size={48} />
                <p className="text-[#cbd5e1]">No payment history yet</p>
                <Link
                  href="/payments"
                  className="inline-block mt-4 px-6 py-2 bg-[#d69e2e] text-[#0f172a] font-bold rounded hover:bg-[#b8832a] transition"
                >
                  Make a Payment
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155]">
            <h2 className="text-2xl font-bold text-[#f8fafc] mb-4 font-poppins">
              Merchandise Orders
            </h2>
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-[#0f172a] p-4 rounded-lg border border-[#334155]">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-[#f8fafc] font-semibold">
                          Order #{order.id.slice(0, 8)}...
                        </p>
                        <p className="text-sm text-[#94a3b8]">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        order.status === "delivered" ? "bg-green-500/20 text-green-500" :
                        order.status === "shipped" ? "bg-blue-500/20 text-blue-500" :
                        order.status === "processing" ? "bg-yellow-500/20 text-yellow-500" :
                        "bg-gray-500/20 text-gray-500"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-[#cbd5e1]">
                      Total: Ksh {order.total.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingBag className="mx-auto mb-4 text-[#94a3b8]" size={48} />
                <p className="text-[#cbd5e1]">No orders yet</p>
                <Link
                  href="/merchandise"
                  className="inline-block mt-4 px-6 py-2 bg-[#d69e2e] text-[#0f172a] font-bold rounded hover:bg-[#b8832a] transition"
                >
                  Shop Merchandise
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && memberDetails && (
          <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155]">
            <h2 className="text-2xl font-bold text-[#f8fafc] mb-6 font-poppins">
              Profile Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <p className="text-[#94a3b8] text-sm">Full Name</p>
                  <p className="text-[#f8fafc] font-semibold">
                    {memberDetails.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-[#94a3b8] text-sm">Email</p>
                  <p className="text-[#f8fafc] font-semibold">
                    {memberDetails.email}
                  </p>
                </div>
                <div>
                  <p className="text-[#94a3b8] text-sm">Phone</p>
                  <p className="text-[#f8fafc] font-semibold">
                    {memberDetails.phone_number}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[#94a3b8] text-sm">Graduation Year</p>
                  <p className="text-[#f8fafc] font-semibold">
                    {memberDetails.graduation_year || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[#94a3b8] text-sm">Course</p>
                  <p className="text-[#f8fafc] font-semibold">
                    {memberDetails.course || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[#94a3b8] text-sm">County</p>
                  <p className="text-[#f8fafc] font-semibold">
                    {memberDetails.county || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
}