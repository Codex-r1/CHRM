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

// Define types
type UserType = {
  email: string;
  name: string;
  role: "admin" | "member";
};

type MemberDetailsType = {
  id?: number;
  email: string;
  full_name?: string;
  membership_paid?: boolean;
  membership_expiry?: string;
  membership_number?: string;
  phone?: string;
  graduation_year?: string;
  created_at?: string;
};

type PaymentType = {
  id: number;
  created_at: string;
  payment_type: string;
  reference_code: string;
  amount: number;
  status: "confirmed" | "pending" | "failed";
  user_id?: number;
};

type OrderType = {
  id: number;
  created_at: string;
  items: string;
  total: number;
  status: "delivered" | "shipped" | "processing" | "pending";
  user_id?: number;
};

type EventType = {
  id: number;
  name: string;
  description: string;
  event_date?: string;
  price: number;
  member_discount: number;
};

export default function MemberDashboard() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [memberDetails, setMemberDetails] = useState<MemberDetailsType | null>(null);
  const [payments, setPayments] = useState<PaymentType[]>([]);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [events, setEvents] = useState<EventType[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const checkUser = () => {
      if (typeof window !== "undefined") {
        const userData = localStorage.getItem("user");
        if (userData) {
          const parsedUser: UserType = JSON.parse(userData);
          setUser(parsedUser);
          
          if (parsedUser.role === "admin") {
            router.push("/admin/dashboard");
          } else if (parsedUser.role === "member") {
            fetchMemberData(parsedUser);
          }
        } else {
          router.push("/login");
        }
      }
      setLoading(false);
    };

    checkUser();
  }, [router]);

  const fetchMemberData = async (userData: UserType) => {
    try {
      // Fetch member details from users table
      const usersRes = await fetch("/api/users");
      if (usersRes.ok) {
        const allUsers: MemberDetailsType[] = await usersRes.json();
        const currentMember = allUsers.find((u) => u.email === userData.email);
        setMemberDetails(currentMember || null);

        // Fetch payments
        const paymentsRes = await fetch("/api/payments");
        if (paymentsRes.ok) {
          const allPayments: PaymentType[] = await paymentsRes.json();
          // Filter payments for current user
          const userPayments = allPayments.filter(
            (p) => p.user_id === currentMember?.id,
          );
          setPayments(userPayments);
        }

        // Fetch orders
        const ordersRes = await fetch("/api/orders");
        if (ordersRes.ok) {
          const allOrders: OrderType[] = await ordersRes.json();
          const userOrders = allOrders.filter(
            (o) => o.user_id === currentMember?.id,
          );
          setOrders(userOrders);
        }

        // Fetch events
        const eventsRes = await fetch("/api/events");
        if (eventsRes.ok) {
          const eventsData: EventType[] = await eventsRes.json();
          setEvents(eventsData);
        }
      }
    } catch (error) {
      console.error("Failed to fetch member data:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-[#f8fafc] text-xl">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== "member") {
    return null;
  }

  const membershipActive = memberDetails?.membership_paid;
  const membershipExpiry = memberDetails?.membership_expiry
    ? new Date(memberDetails.membership_expiry).toLocaleDateString()
    : "N/A";

  return (
    <div className="min-h-screen bg-[#0f172a] font-inter">
      {/* Header */}
      <header className="bg-[#1e293b] border-b border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#f8fafc] font-poppins">
              Member Dashboard
            </h1>
            <p className="text-[#94a3b8]">Welcome, {user.name}</p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/"
              className="px-4 py-2 bg-[#0f172a] border border-[#334155] text-white rounded hover:bg-[#1e293b] transition"
            >
              View Site
            </Link>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.removeItem("user");
                  router.push("/login");
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Membership Status Card */}
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
                      Inactive
                    </span>
                  </>
                )}
              </div>
              {membershipActive && (
                <p className="text-[#1e293b] mt-2">
                  Expires: {membershipExpiry}
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
                href="/payments"
                className="inline-block px-6 py-3 bg-[#0f172a] text-white font-bold rounded hover:bg-[#1e293b] transition"
              >
                Renew Membership
              </Link>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155]">
            <div className="flex items-center justify-between mb-2">
              <CreditCard className="text-[#2563eb]" size={32} />
              <span className="text-3xl font-bold text-[#f8fafc]">
                {payments.length}
              </span>
            </div>
            <p className="text-[#94a3b8]">Total Payments</p>
          </div>

          <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155]">
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag className="text-[#d69e2e]" size={32} />
              <span className="text-3xl font-bold text-[#f8fafc]">
                {orders.length}
              </span>
            </div>
            <p className="text-[#94a3b8]">Merchandise Orders</p>
          </div>

          <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155]">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="text-green-500" size={32} />
              <span className="text-3xl font-bold text-[#f8fafc]">
                {events.length}
              </span>
            </div>
            <p className="text-[#94a3b8]">Upcoming Events</p>
          </div>
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

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155]">
              <h2 className="text-2xl font-bold text-[#f8fafc] mb-4 font-poppins">
                Recent Activity
              </h2>
              <p className="text-[#cbd5e1]">
                Welcome to your member dashboard! Here you can view your
                membership status, payment history, merchandise orders, and
                upcoming events. Use the tabs above to navigate.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link
                href="/payments"
                className="bg-[#1e293b] p-6 rounded-lg border border-[#334155] hover:border-[#d69e2e] transition"
              >
                <h3 className="text-xl font-bold text-[#f8fafc] mb-2 font-poppins">
                  Make a Payment
                </h3>
                <p className="text-[#cbd5e1]">
                  Renew your membership or register for an event
                </p>
              </Link>

              <Link
                href="/merchandise"
                className="bg-[#1e293b] p-6 rounded-lg border border-[#334155] hover:border-[#d69e2e] transition"
              >
                <h3 className="text-xl font-bold text-[#f8fafc] mb-2 font-poppins">
                  Shop Merchandise
                </h3>
                <p className="text-[#cbd5e1]">
                  Browse and purchase CHRMAA branded items
                </p>
              </Link>
            </div>
          </div>
        )}

        {/* Payments Tab */}
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
                      <th className="pb-3">Reference</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="text-[#cbd5e1] border-b border-[#334155]"
                      >
                        <td className="py-3">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 capitalize">
                          {payment.payment_type}
                        </td>
                        <td className="py-3">
                          {payment.reference_code || "N/A"}
                        </td>
                        <td className="py-3">
                          Ksh {payment.amount.toLocaleString()}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              payment.status === "confirmed"
                                ? "bg-green-500/20 text-green-500"
                                : payment.status === "pending"
                                  ? "bg-yellow-500/20 text-yellow-500"
                                  : "bg-red-500/20 text-red-500"
                            }`}
                          >
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

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155]">
            <h2 className="text-2xl font-bold text-[#f8fafc] mb-4 font-poppins">
              Merchandise Orders
            </h2>
            {orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[#94a3b8] border-b border-[#334155]">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Items</th>
                      <th className="pb-3">Total</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="text-[#cbd5e1] border-b border-[#334155]"
                      >
                        <td className="py-3">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          {JSON.parse(order.items || "[]").length} items
                        </td>
                        <td className="py-3">
                          Ksh {order.total.toLocaleString()}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              order.status === "delivered"
                                ? "bg-green-500/20 text-green-500"
                                : order.status === "shipped"
                                  ? "bg-blue-500/20 text-blue-500"
                                  : order.status === "processing"
                                    ? "bg-yellow-500/20 text-yellow-500"
                                    : "bg-gray-500/20 text-gray-500"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingBag
                  className="mx-auto mb-4 text-[#94a3b8]"
                  size={48}
                />
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

        {/* Events Tab */}
        {activeTab === "events" && (
          <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155]">
            <h2 className="text-2xl font-bold text-[#f8fafc] mb-6 font-poppins">
              Upcoming Events
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-[#0f172a] p-6 rounded-lg border border-[#334155]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Calendar className="text-[#d69e2e]" size={24} />
                    <span className="text-sm text-[#94a3b8]">
                      {event.event_date
                        ? new Date(event.event_date).toLocaleDateString()
                        : "Date TBD"}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#f8fafc] mb-2 font-poppins">
                    {event.name}
                  </h3>
                  <p className="text-[#cbd5e1] mb-4 text-sm">
                    {event.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#94a3b8]">Regular Price:</span>
                      <span className="text-[#cbd5e1]">
                        Ksh {event.price.toLocaleString()}
                      </span>
                    </div>
                    {membershipActive && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#94a3b8]">
                            Member Discount:
                          </span>
                          <span className="text-green-500">
                            {event.member_discount}%
                          </span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span className="text-[#d69e2e]">Your Price:</span>
                          <span className="text-[#d69e2e]">
                            Ksh{" "}
                            {(
                              event.price -
                              (event.price * event.member_discount) / 100
                            ).toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <Link
                    href={`/payments?event=${event.id}`}
                    className="block mt-4 text-center px-4 py-2 bg-[#2563eb] text-white font-semibold rounded hover:bg-[#1d4ed8] transition"
                  >
                    Register
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155]">
            <h2 className="text-2xl font-bold text-[#f8fafc] mb-6 font-poppins">
              Profile Information
            </h2>
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-4 p-4 bg-[#0f172a] rounded border border-[#334155]">
                <User className="text-[#d69e2e]" size={24} />
                <div>
                  <p className="text-[#94a3b8] text-sm">Full Name</p>
                  <p className="text-[#f8fafc] font-semibold">
                    {memberDetails?.full_name || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-[#0f172a] rounded border border-[#334155]">
                <CreditCard className="text-[#d69e2e]" size={24} />
                <div>
                  <p className="text-[#94a3b8] text-sm">Email</p>
                  <p className="text-[#f8fafc] font-semibold">
                    {memberDetails?.email || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-[#0f172a] rounded border border-[#334155]">
                <User className="text-[#d69e2e]" size={24} />
                <div>
                  <p className="text-[#94a3b8] text-sm">Phone</p>
                  <p className="text-[#f8fafc] font-semibold">
                    {memberDetails?.phone || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-[#0f172a] rounded border border-[#334155]">
                <Calendar className="text-[#d69e2e]" size={24} />
                <div>
                  <p className="text-[#94a3b8] text-sm">Graduation Year</p>
                  <p className="text-[#f8fafc] font-semibold">
                    {memberDetails?.graduation_year || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-[#0f172a] rounded border border-[#334155]">
                <CreditCard className="text-[#d69e2e]" size={24} />
                <div>
                  <p className="text-[#94a3b8] text-sm">Membership Number</p>
                  <p className="text-[#f8fafc] font-semibold">
                    {memberDetails?.membership_number || "Pending"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-[#0f172a] rounded border border-[#334155]">
                <Calendar className="text-[#d69e2e]" size={24} />
                <div>
                  <p className="text-[#94a3b8] text-sm">Member Since</p>
                  <p className="text-[#f8fafc] font-semibold">
                    {memberDetails?.created_at
                      ? new Date(memberDetails.created_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}