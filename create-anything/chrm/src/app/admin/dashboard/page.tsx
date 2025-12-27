"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import {
  Users,
  DollarSign,
  ShoppingBag,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

// Type definitions
type User = {
  id: string;
  full_name: string;
  email: string;
  membership_number?: string;
  membership_paid: boolean;
  membership_expiry?: string;
  role: string;
  phone_number?: string;
  address?: string;
  created_at: string;
};

type Payment = {
  id: string;
  user_id: string;
  payment_type: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'rejected';
  reference_code?: string;
  payment_method?: string;
  mpesa_code?: string;
  description?: string;
  created_at: string;
};

type Order = {
  id: string;
  user_id: string;
  items: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address?: string;
  notes?: string;
  created_at: string;
};

type Event = {
  id: string;
  name: string;
  description: string;
  event_date?: string;
  location?: string;
  price: number;
  member_discount: number;
  max_attendees?: number;
  current_attendees?: number;
  image_url?: string;
  created_at: string;
};

type Stats = {
  totalMembers: number;
  pendingPayments: number;
  totalRevenue: number;
  pendingOrders: number;
};

// Extended session types
interface ExtendedSessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalMembers: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });

  // Type-safe session user access
  const sessionUser = session?.user as ExtendedSessionUser | undefined;
  const userRole = sessionUser?.role;

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && userRole !== "admin") {
      router.push("/member/dashboard");
    } else if (status === "authenticated" && userRole === "admin") {
      fetchData();
    }
  }, [session, status, router, userRole]);

  const fetchData = async () => {
    try {
      const [usersRes, paymentsRes, ordersRes, eventsRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/payments"),
        fetch("/api/orders"),
        fetch("/api/events"),
      ]);

      if (usersRes.ok) {
        const usersData: User[] = await usersRes.json();
        setUsers(usersData);
        setStats((prev) => ({ ...prev, totalMembers: usersData.length }));
      }

      if (paymentsRes.ok) {
        const paymentsData: Payment[] = await paymentsRes.json();
        setPayments(paymentsData);
        const pending = paymentsData.filter(
          (p) => p.status === "pending",
        ).length;
        const total = paymentsData
          .filter((p) => p.status === "confirmed")
          .reduce((sum, p) => sum + p.amount, 0);
        setStats((prev) => ({
          ...prev,
          pendingPayments: pending,
          totalRevenue: total,
        }));
      }

      if (ordersRes.ok) {
        const ordersData: Order[] = await ordersRes.json();
        setOrders(ordersData);
        const pending = ordersData.filter((o) => o.status === "pending").length;
        setStats((prev) => ({ ...prev, pendingOrders: pending }));
      }

      if (eventsRes.ok) {
        const eventsData: Event[] = await eventsRes.json();
        setEvents(eventsData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  const updatePaymentStatus = async (paymentId: string, status: 'confirmed' | 'rejected') => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchData();
        alert(`Payment ${status}!`);
      }
    } catch (error) {
      console.error("Failed to update payment:", error);
      alert("Failed to update payment status");
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchData();
        alert(`Order ${status}!`);
      }
    } catch (error) {
      console.error("Failed to update order:", error);
      alert("Failed to update order status");
    }
  };

  const updateUserMembership = async (
    userId: string,
    membershipPaid: boolean,
    membershipExpiry: string,
  ) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membership_paid: membershipPaid,
          membership_expiry: membershipExpiry,
        }),
      });

      if (response.ok) {
        fetchData();
        alert("User membership updated!");
      }
    } catch (error) {
      console.error("Failed to update user:", error);
      alert("Failed to update user membership");
    }
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-[#f8fafc] text-xl">Loading...</div>
      </div>
    );
  }

  // Not authenticated or not admin
  if (status !== "authenticated" || userRole !== "admin") {
    return null;
  }

  const user = sessionUser;

  return (
    <div className="min-h-screen bg-[#0f172a] font-inter">
      {/* Header */}
      <header className="bg-[#1e293b] border-b border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#f8fafc] font-poppins">
              Admin Dashboard
            </h1>
            <p className="text-[#94a3b8]">Welcome, {user?.name || 'Admin'}</p>
          </div>
          <div className="flex gap-4">
            <a
              href="/"
              className="px-4 py-2 bg-[#0f172a] border border-[#334155] text-white rounded hover:bg-[#1e293b] transition"
            >
              View Site
            </a>
            <a
              href="/account/logout"
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Logout
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155]">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-[#d69e2e]" size={32} />
              <span className="text-3xl font-bold text-[#f8fafc]">
                {stats.totalMembers}
              </span>
            </div>
            <p className="text-[#94a3b8]">Total Members</p>
          </div>

          <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155]">
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-yellow-500" size={32} />
              <span className="text-3xl font-bold text-[#f8fafc]">
                {stats.pendingPayments}
              </span>
            </div>
            <p className="text-[#94a3b8]">Pending Payments</p>
          </div>

          <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155]">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="text-green-500" size={32} />
              <span className="text-3xl font-bold text-[#f8fafc]">
                Ksh {stats.totalRevenue.toLocaleString()}
              </span>
            </div>
            <p className="text-[#94a3b8]">Total Revenue</p>
          </div>

          <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155]">
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag className="text-[#2563eb]" size={32} />
              <span className="text-3xl font-bold text-[#f8fafc]">
                {stats.pendingOrders}
              </span>
            </div>
            <p className="text-[#94a3b8]">Pending Orders</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-[#334155] overflow-x-auto">
          {["overview", "members", "payments", "orders", "events"].map(
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
                Recent Payments
              </h2>
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
                    {payments.slice(0, 5).map((payment) => (
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
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155]">
            <h2 className="text-2xl font-bold text-[#f8fafc] mb-4 font-poppins">
              All Members
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[#94a3b8] border-b border-[#334155]">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Membership #</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Expiry</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((member) => (
                    <tr
                      key={member.id}
                      className="text-[#cbd5e1] border-b border-[#334155]"
                    >
                      <td className="py-3">{member.full_name}</td>
                      <td className="py-3">{member.email}</td>
                      <td className="py-3">
                        {member.membership_number || "N/A"}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            member.membership_paid
                              ? "bg-green-500/20 text-green-500"
                              : "bg-red-500/20 text-red-500"
                          }`}
                        >
                          {member.membership_paid ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3">
                        {member.membership_expiry
                          ? new Date(
                              member.membership_expiry,
                            ).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="py-3">
                        {!member.membership_paid && (
                          <button
                            onClick={() => {
                              const expiry = new Date();
                              expiry.setFullYear(expiry.getFullYear() + 1);
                              updateUserMembership(
                                member.id,
                                true,
                                expiry.toISOString().split("T")[0],
                              );
                            }}
                            className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155]">
            <h2 className="text-2xl font-bold text-[#f8fafc] mb-4 font-poppins">
              Payment Management
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[#94a3b8] border-b border-[#334155]">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">User</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Reference</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Actions</th>
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
                      <td className="py-3">User #{payment.user_id}</td>
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
                      <td className="py-3">
                        {payment.status === "pending" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                updatePaymentStatus(payment.id, "confirmed")
                              }
                              className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                            >
                              <CheckCircle size={14} /> Confirm
                            </button>
                            <button
                              onClick={() =>
                                updatePaymentStatus(payment.id, "rejected")
                              }
                              className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1"
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155]">
            <h2 className="text-2xl font-bold text-[#f8fafc] mb-4 font-poppins">
              Merchandise Orders
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[#94a3b8] border-b border-[#334155]">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">User</th>
                    <th className="pb-3">Items</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Actions</th>
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
                      <td className="py-3">User #{order.user_id}</td>
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
                      <td className="py-3">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            updateOrderStatus(order.id, e.target.value as Order['status'])
                          }
                          className="text-sm px-3 py-1 bg-[#0f172a] border border-[#334155] rounded text-[#f8fafc]"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155]">
            <h2 className="text-2xl font-bold text-[#f8fafc] mb-4 font-poppins">
              Events Management
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
                  <p className="text-[#cbd5e1] mb-4">{event.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-[#d69e2e] font-bold">
                      Ksh {event.price.toLocaleString()}
                    </span>
                    <span className="text-sm text-[#94a3b8]">
                      {event.member_discount}% member discount
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}