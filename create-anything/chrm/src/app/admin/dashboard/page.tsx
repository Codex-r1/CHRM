"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  DollarSign,
  ShoppingBag,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Filter,
  Search,
  BarChart,
  Activity,
  UserPlus,
  Ticket,
  MapPin,
  Users as UsersIcon,
  Tag,
  Image as ImageIcon,
  Globe,
  Shield,
} from "lucide-react";
import { useAuth } from "../../context/auth";
import Footer from "@/app/components/Footer";
import { supabase } from "@/app/lib/supabase/client";

// Type definitions
type User = {
  id: string;
  full_name: string;
  email: string;
  membership_number?: string;
  status: string;
  role: string;
  phone_number?: string;
  graduation_year?: number;
  course?: string;
  county?: string;
  created_at: string;
  memberships?: {
    start_date: string;
    expiry_date: string;
    is_active: boolean;
  }[];
};

type Payment = {
  id: string;
  user_id: string;
  payment_type: string;
  amount: number;
  status: 'pending' | 'processing' | 'confirmed' | 'failed';
  checkout_request_id?: string;
  account_reference?: string;
  phone_number?: string;
  description?: string;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
    membership_number: string;
  };
};

type Order = {
  id: string;
  user_id: string;
  items: any[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  shipping_address?: string;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
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
  current_attendees: number;
  is_active: boolean;
  created_at: string;
  category?: string;
  image_url?: string;
  status: string;
};

type Stats = {
  totalMembers: number;
  activeMembers: number;
  pendingPayments: number;
  totalRevenue: number;
  pendingOrders: number;
  totalEvents: number;
  upcomingEvents: number;
  todayRevenue: number;
};
type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  category: 'tshirt' | 'polo' | 'hoodie' | 'accessory' | 'other';
  is_active: boolean;
  is_out_of_stock: boolean;
  featured_image_url?: string;
  sort_order: number;
  created_at: string;
  product_variants?: ProductVariant[];
  product_images?: ProductImage[];
};

type ProductVariant = {
  id: string;
  product_id: string;
  color_name: string;
  color_hex: string;
  size: string;
  sku: string;
  price_adjustment: number;
  stock_quantity: number;
  is_available: boolean;
  image_url?: string;
};

type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
};
export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
const [showProductForm, setShowProductForm] = useState(false);
const [editingProduct, setEditingProduct] = useState<Product | null>(null);
const [productLoading, setProductLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalMembers: 0,
    activeMembers: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    totalEvents: 0,
    upcomingEvents: 0,
    todayRevenue: 0,
  });
  const [dataLoading, setDataLoading] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // New Event Form State
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    event_date: '',
    location: '',
    price: '',
    member_discount: '5',
    max_attendees: '',
    image_url: '',
    category: '',
    is_active: true,
    status: 'upcoming'
  });
  const [creatingEvent, setCreatingEvent] = useState(false);
const [newProduct, setNewProduct] = useState({
  name: '',
  description: '',
  base_price: '',
  category: 'tshirt',
  featured_image_url: '',
  is_active: true,
  is_out_of_stock: false,
  variants: [] as ProductVariant[],
  images: [] as ProductImage[]
});
// Helper function to get session token
const getSessionToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};
// New Variant State
const [newVariant, setNewVariant] = useState({
  color_name: '',
  color_hex: '#000000',
  size: '',
  sku: '',
  price_adjustment: '0',
  stock_quantity: '0',
  is_available: true,
  image_url: ''
});
  // Fix for admin/dashboard page

// The issue is that checkAdminStatus might be running before the auth context is fully ready
// Here's the corrected useEffect and checkAdminStatus:

useEffect(() => {
  console.log("Admin dashboard useEffect triggered:", {
    authLoading,
    user,
    userEmail: user?.email,
    userId: user?.id
  });

  // Wait for auth loading to complete
  if (authLoading) {
    console.log("Auth still loading...");
    return;
  }

  // Auth loading is complete
  console.log("Auth loading complete");
  
  if (!user) {
    console.log("No user found, redirecting to login");
    router.push("/login");
    return;
  }

  // User exists, check admin status
  console.log("User found, checking admin status");
  checkAdminStatus();
}, [user, authLoading]); // Remove router from dependencies

const checkAdminStatus = async () => {
  try {
    if (!user) {
      router.push("/login");
      return;
    }
    
    console.log("Checking admin status for user:", user.id);
    
    // Method 1: Use the user object directly if it has role info
    if (user.user_metadata?.role === 'admin') {
      console.log('User is admin (from user_metadata), loading admin dashboard');
      fetchData();
      return;
    }

    // Method 2: Query Supabase directly - but DON'T use getSessionToken()
    // Instead, use the Supabase client which already has the session
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single(); // Use single() instead of maybeSingle() to throw error if not found

    console.log("Profile fetch result:", { profile, profileError });

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      // If there's an error fetching profile, redirect to member dashboard
      router.push("/member/dashboard");
      return;
    }

    if (!profile || profile.role !== 'admin') {
      console.log('User is not admin, redirecting to member dashboard');
      router.push("/member/dashboard");
      return;
    }

    // User is admin
    console.log('User is confirmed admin, loading dashboard data');
    fetchData();
    
  } catch (error) {
    console.error("Admin check error:", error);
    // On error, redirect to member dashboard as fallback
    router.push("/member/dashboard");
  }
};

// Also update fetchData to handle the case where token might not be available yet:
const fetchData = async () => {
  try {
    setDataLoading(true);
    
    // Wait a bit for the session to be fully established
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const token = await getSessionToken();
    
    if (!token) {
      console.error("No session token available in fetchData");
      // Try to get session directly from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error("No session available");
        return;
      }
    }

    const headers = {
      'Authorization': `Bearer ${token || (await supabase.auth.getSession()).data.session?.access_token}`,
      'Content-Type': 'application/json'
    };

    // ... rest of fetchData code
  } catch (error) {
    console.error("Failed to fetch data:", error);
  } finally {
    setDataLoading(false);
  }
};

 

const fetchProducts = async () => {
  try {
    setProductLoading(true);
    const token = await getSessionToken();
    if (!token) return;

    const response = await fetch('/api/admin/merchandise', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      setProducts(data.products || []);
    }
  } catch (error) {
    console.error('Error fetching products:', error);
  } finally {
    setProductLoading(false);
  }
};

// Create product
const handleCreateProduct = async (e: React.FormEvent) => {
  e.preventDefault();
  setProductLoading(true);

  try {
    const token = await getSessionToken();
    if (!token) throw new Error('No session');

    const response = await fetch('/api/admin/merchandise', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...newProduct,
        base_price: parseFloat(newProduct.base_price),
        variants: newProduct.variants.map(v => ({
          ...v,
          price_adjustment: parseFloat(v.price_adjustment.toString()),
          stock_quantity: parseInt(v.stock_quantity.toString())
        }))
      })
    });

    if (response.ok) {
      alert('Product created successfully!');
      setNewProduct({
        name: '',
        description: '',
        base_price: '',
        category: 'tshirt',
        featured_image_url: '',
        is_active: true,
        is_out_of_stock: false,
        variants: [],
        images: []
      });
      setShowProductForm(false);
      fetchProducts();
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create product');
    }
  } catch (error: any) {
    alert(error.message || 'Failed to create product');
  } finally {
    setProductLoading(false);
  }
};

// Update product
const handleUpdateProduct = async (productId: string, updates: Partial<Product>) => {
  try {
    const token = await getSessionToken();
    if (!token) return;

    const response = await fetch(`/api/admin/merchandise/${productId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (response.ok) {
      alert('Product updated successfully!');
      fetchProducts();
    }
  } catch (error) {
    alert('Failed to update product');
  }
};

// Delete product (soft delete)
const handleDeleteProduct = async (productId: string) => {
  if (!confirm('Are you sure you want to deactivate this product?')) return;
  
  try {
    const token = await getSessionToken();
    if (!token) return;

    const response = await fetch(`/api/admin/merchandise/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (response.ok) {
      alert('Product deactivated successfully!');
      fetchProducts();
    }
  } catch (error) {
    alert('Failed to delete product');
  }
};

// Add variant to product
const handleAddVariant = () => {
  if (!newVariant.color_name || !newVariant.size || !newVariant.sku) {
    alert('Please fill in all variant fields');
    return;
  }

  setNewProduct({
    ...newProduct,
    variants: [
      ...newProduct.variants,
      {
        id: Date.now().toString(), // Temporary ID
        product_id: '',
        ...newVariant,
        price_adjustment: parseFloat(newVariant.price_adjustment),
        stock_quantity: parseInt(newVariant.stock_quantity)
      }
    ]
  });

  setNewVariant({
    color_name: '',
    color_hex: '#000000',
    size: '',
    sku: '',
    price_adjustment: '0',
    stock_quantity: '0',
    is_available: true,
    image_url: ''
  });
};

// Remove variant
const handleRemoveVariant = (index: number) => {
  const updatedVariants = [...newProduct.variants];
  updatedVariants.splice(index, 1);
  setNewProduct({ ...newProduct, variants: updatedVariants });
};
  // Event Handlers
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingEvent(true);
    
    try {
      const token = getSessionToken();
      if (!token) throw new Error('No session');
      
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newEvent,
          price: parseFloat(newEvent.price),
          member_discount: parseInt(newEvent.member_discount),
          max_attendees: newEvent.max_attendees ? parseInt(newEvent.max_attendees) : null
        })
      });
      
      if (response.ok) {
        alert('Event created successfully!');
        setNewEvent({
          name: '',
          description: '',
          event_date: '',
          location: '',
          price: '',
          member_discount: '5',
          max_attendees: '',
          image_url: '',
          category: '',
          is_active: true,
          status: 'upcoming'
        });
        setShowEventForm(false);
        fetchData();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create event');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to create event');
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to deactivate this event?')) return;
    
    try {
      const token = await getSessionToken();
      if (!token) return;
      
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (response.ok) {
        alert('Event deactivated successfully!');
        fetchData();
      } else {
        throw new Error('Failed to delete event');
      }
    } catch (error) {
      alert('Failed to delete event');
    }
  };

  const updatePaymentStatus = async (paymentId: string, status: 'confirmed' | 'failed') => {
    try {
      const token = getSessionToken();
      if (!token) return;

      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: "PATCH",
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchData();
        alert(`Payment ${status}!`);
      } else {
        throw new Error('Failed to update payment');
      }
    } catch (error) {
      alert("Failed to update payment status");
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const token = await getSessionToken();
      if (!token) return;

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchData();
        alert(`Order ${status}!`);
      } else {
        throw new Error('Failed to update order');
      }
    } catch (error) {
      alert("Failed to update order status");
    }
  };

  const updateUserStatus = async (userId: string, status: string) => {
    try {
      const token = await getSessionToken();
      if (!token) return;

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchData();
        alert(`User ${status}!`);
      } else {
        throw new Error('Failed to update user');
      }
    } catch (error) {
      alert("Failed to update user status");
    }
  };

  // Filter functions
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Loading state
  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading Admin Dashboard...</div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Categories for filtering
  const eventCategories = [
    { id: "all", label: "All Events" },
    { id: "networking", label: "Networking" },
    { id: "workshop", label: "Workshops" },
    { id: "conference", label: "Conferences" },
    { id: "community", label: "Community" },
    { id: "social", label: "Social" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 font-inter">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center">
              <Shield className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-poppins">
                Admin Dashboard
              </h1>
              <p className="text-slate-400 text-sm">Welcome, {user.email}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg hover:bg-slate-700 transition flex items-center gap-2"
            >
              <Globe size={16} />
              View Site
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
            >
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <Users className="text-amber-400" size={28} />
              <Activity className="text-green-400" size={20} />
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Members</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{stats.totalMembers}</span>
                <span className="text-green-400 text-sm">({stats.activeMembers} active)</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="text-emerald-400" size={28} />
              <BarChart className="text-blue-400" size={20} />
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Revenue</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">Ksh {stats.totalRevenue.toLocaleString()}</span>
                <span className="text-blue-400 text-sm">Today: Ksh {stats.todayRevenue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="text-purple-400" size={28} />
              <Ticket className="text-pink-400" size={20} />
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Events</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{stats.totalEvents}</span>
                <span className="text-purple-400 text-sm">({stats.upcomingEvents} upcoming)</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <ShoppingBag className="text-cyan-400" size={28} />
              <Clock className="text-yellow-400" size={20} />
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Pending</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-300">Payments:</span>
                  <span className="text-yellow-400 font-semibold">{stats.pendingPayments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Orders:</span>
                  <span className="text-yellow-400 font-semibold">{stats.pendingOrders}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
  { id: "overview", label: "Overview", icon: Activity },
  { id: "members", label: "Members", icon: Users },
  { id: "payments", label: "Payments", icon: DollarSign },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "events", label: "Events", icon: Calendar },
  { id: "merchandise", label: "Merchandise", icon: Tag }
].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "create-event") setShowEventForm(true);
              }}
              className={`px-5 py-3 font-medium rounded-lg transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 font-poppins">Recent Activity</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Payments */}
                  <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <DollarSign size={20} className="text-emerald-400" />
                      Recent Payments
                    </h3>
                    <div className="space-y-3">
                      {payments.slice(0, 5).map((payment) => (
                        <div key={payment.id} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                          <div>
                            <p className="text-white font-medium">{payment.description || "Payment"}</p>
                            <p className="text-sm text-slate-400">{payment.profiles?.full_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold">Ksh {payment.amount.toLocaleString()}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              payment.status === "confirmed" ? "bg-emerald-500/20 text-emerald-400" :
                              payment.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                              "bg-red-500/20 text-red-400"
                            }`}>
                              {payment.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Members */}
                  <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <UserPlus size={20} className="text-amber-400" />
                      Recent Members
                    </h3>
                    <div className="space-y-3">
                      {users.slice(0, 5).map((user) => (
                        <div key={user.id} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                          <div>
                            <p className="text-white font-medium">{user.full_name}</p>
                            <p className="text-sm text-slate-400">{user.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-300">{user.membership_number || "No membership"}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              user.status === "active" ? "bg-emerald-500/20 text-emerald-400" :
                              "bg-yellow-500/20 text-yellow-400"
                            }`}>
                              {user.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <p className="text-slate-400 text-sm">Avg. Payment</p>
                    <p className="text-white font-bold text-xl">
                      Ksh {payments.length > 0 ? Math.round(payments.reduce((a, b) => a + b.amount, 0) / payments.length).toLocaleString() : "0"}
                    </p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <p className="text-slate-400 text-sm">Conversion Rate</p>
                    <p className="text-white font-bold text-xl">
                      {users.length > 0 ? Math.round((stats.activeMembers / users.length) * 100) : "0"}%
                    </p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <p className="text-slate-400 text-sm">Avg. Order Value</p>
                    <p className="text-white font-bold text-xl">
                      Ksh {orders.length > 0 ? Math.round(orders.reduce((a, b) => a + b.total, 0) / orders.length).toLocaleString() : "0"}
                    </p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <p className="text-slate-400 text-sm">Event Capacity</p>
                    <p className="text-white font-bold text-xl">
                      {events.filter(e => e.is_active).reduce((a, b) => a + (b.current_attendees || 0), 0)} / {
                        events.filter(e => e.is_active).reduce((a, b) => a + (b.max_attendees || 0), 0)
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === "members" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white font-poppins">
                  Member Management ({users.length})
                </h2>
                <button
                  onClick={() => {/* Add export functionality */}}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 flex items-center gap-2"
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-700">
                      <th className="pb-3 px-4">Member</th>
                      <th className="pb-3 px-4">Contact</th>
                      <th className="pb-3 px-4">Membership</th>
                      <th className="pb-3 px-4">Status</th>
                      <th className="pb-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((member) => (
                      <tr key={member.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-white font-medium">{member.full_name}</p>
                            <p className="text-sm text-slate-400">{member.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-white">{member.phone_number}</p>
                          <p className="text-sm text-slate-400">{member.county || "N/A"}</p>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-white font-mono">{member.membership_number || "No membership"}</p>
                            <p className="text-sm text-slate-400">{member.course || "N/A"}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm w-fit ${
                              member.status === "active" ? "bg-emerald-500/20 text-emerald-400" :
                              member.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                              "bg-red-500/20 text-red-400"
                            }`}>
                              {member.status}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm w-fit ${
                              member.role === "admin" ? "bg-purple-500/20 text-purple-400" :
                              "bg-blue-500/20 text-blue-400"
                            }`}>
                              {member.role}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateUserStatus(member.id, "active")}
                              className="px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700"
                              disabled={member.status === "active"}
                            >
                              Activate
                            </button>
                            <button
                              onClick={() => updateUserStatus(member.id, "admin")}
                              className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                              disabled={member.role === "admin"}
                            >
                              Make Admin
                            </button>
                          </div>
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
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 font-poppins">
                Payment Management ({payments.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-700">
                      <th className="pb-3 px-4">Date</th>
                      <th className="pb-3 px-4">User</th>
                      <th className="pb-3 px-4">Type</th>
                      <th className="pb-3 px-4">Amount</th>
                      <th className="pb-3 px-4">Status</th>
                      <th className="pb-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                        <td className="py-4 px-4">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-white">{payment.profiles?.full_name || "Guest"}</p>
                            <p className="text-sm text-slate-400">{payment.phone_number}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="capitalize text-white">{payment.payment_type}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-white font-bold">Ksh {payment.amount.toLocaleString()}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                            payment.status === "confirmed" ? "bg-emerald-500/20 text-emerald-400" :
                            payment.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                            payment.status === "processing" ? "bg-blue-500/20 text-blue-400" :
                            "bg-red-500/20 text-red-400"
                          }`}>
                            {payment.status === "confirmed" && <CheckCircle size={12} />}
                            {payment.status === "pending" && <Clock size={12} />}
                            {payment.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {payment.status === "pending" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => updatePaymentStatus(payment.id, "confirmed")}
                                className="px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 flex items-center gap-1"
                              >
                                <CheckCircle size={12} /> Confirm
                              </button>
                              <button
                                onClick={() => updatePaymentStatus(payment.id, "failed")}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
                              >
                                <XCircle size={12} /> Reject
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
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 font-poppins">
                Merchandise Orders ({orders.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-700">
                      <th className="pb-3 px-4">Order #</th>
                      <th className="pb-3 px-4">Customer</th>
                      <th className="pb-3 px-4">Items</th>
                      <th className="pb-3 px-4">Total</th>
                      <th className="pb-3 px-4">Status</th>
                      <th className="pb-3 px-4">Update Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                        <td className="py-4 px-4">
                          <span className="font-mono text-sm text-slate-300">#{order.id.slice(0, 8)}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-white">{order.customer_name || order.profiles?.full_name || "Guest"}</p>
                            <p className="text-sm text-slate-400">{order.customer_email || order.profiles?.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-white">{order.items?.length || 0} items</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-white font-bold">Ksh {order.total.toLocaleString()}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                            order.status === "delivered" ? "bg-emerald-500/20 text-emerald-400" :
                            order.status === "shipped" ? "bg-blue-500/20 text-blue-400" :
                            order.status === "processing" ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-slate-500/20 text-slate-400"
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                            className="px-3 py-1 bg-slate-900 border border-slate-700 rounded text-white text-sm"
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
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-white font-poppins">
                  Events Management ({events.length})
                </h2>
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    {eventCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {showEventForm ? (
                <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700 mb-6">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Plus size={24} className="text-amber-400" />
                    Create New Event
                  </h3>
                  <form onSubmit={handleCreateEvent} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-white mb-2">Event Name *</label>
                        <input
                          type="text"
                          required
                          value={newEvent.name}
                          onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                          placeholder="Annual Networking Gala"
                        />
                      </div>
                      <div>
                        <label className="block text-white mb-2">Category</label>
                        <select
                          value={newEvent.category}
                          onChange={(e) => setNewEvent({...newEvent, category: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        >
                          <option value="">Select Category</option>
                          {eventCategories.filter(c => c.id !== 'all').map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-white mb-2">Event Date</label>
                        <input
                          type="date"
                          value={newEvent.event_date}
                          onChange={(e) => setNewEvent({...newEvent, event_date: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-white mb-2">Location</label>
                        <input
                          type="text"
                          value={newEvent.location}
                          onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                          placeholder="Virtual / Nairobi, Kenya"
                        />
                      </div>
                      <div>
                        <label className="block text-white mb-2">Price (KES) *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={newEvent.price}
                          onChange={(e) => setNewEvent({...newEvent, price: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                          placeholder="1500"
                        />
                      </div>
                      <div>
                        <label className="block text-white mb-2">Member Discount (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={newEvent.member_discount}
                          onChange={(e) => setNewEvent({...newEvent, member_discount: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                          placeholder="5"
                        />
                      </div>
                      <div>
                        <label className="block text-white mb-2">Max Attendees</label>
                        <input
                          type="number"
                          min="1"
                          value={newEvent.max_attendees}
                          onChange={(e) => setNewEvent({...newEvent, max_attendees: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                          placeholder="Leave empty for unlimited"
                        />
                      </div>
                      <div>
                        <label className="block text-white mb-2">Image URL</label>
                        <input
                          type="url"
                          value={newEvent.image_url}
                          onChange={(e) => setNewEvent({...newEvent, image_url: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-white mb-2">Description *</label>
                      <textarea
                        required
                        rows={4}
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        placeholder="Detailed description of the event..."
                      />
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-white">
                        <input
                          type="checkbox"
                          checked={newEvent.is_active}
                          onChange={(e) => setNewEvent({...newEvent, is_active: e.target.checked})}
                          className="w-5 h-5 rounded border-slate-700"
                        />
                        Active (Visible on site)
                      </label>
                    </div>
                    
                    <div className="flex gap-4">
                      <button
                        type="submit"
                        disabled={creatingEvent}
                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50"
                      >
                        {creatingEvent ? 'Creating...' : 'Create Event'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowEventForm(false);
                          setNewEvent({
                            name: '',
                            description: '',
                            event_date: '',
                            location: '',
                            price: '',
                            member_discount: '5',
                            max_attendees: '',
                            image_url: '',
                            category: '',
                            is_active: true,
                            status: 'upcoming'
                          });
                        }}
                        className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <button
                  onClick={() => setShowEventForm(true)}
                  className="mb-6 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold rounded-lg hover:opacity-90 transition flex items-center gap-2"
                >
                  <Plus size={20} />
                  Create New Event
                </button>
              )}

              {/* Events Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 transition">
                    {/* Event Image */}
                    <div className="h-48 bg-gradient-to-br from-slate-800 to-slate-900 relative">
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon className="text-slate-700" size={48} />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 flex gap-2">
                        {event.category && (
                          <span className="px-3 py-1 bg-slate-900/80 text-amber-400 text-xs font-medium rounded-full">
                            {event.category}
                          </span>
                        )}
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          event.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                          event.status === 'ongoing' ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                      {!event.is_active && (
                        <div className="absolute top-4 left-4 px-3 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
                          Inactive
                        </div>
                      )}
                    </div>

                    {/* Event Content */}
                    <div className="p-5">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-white mb-2 font-poppins">
                          {event.name}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-slate-400 mb-3">
                          {event.event_date && (
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {new Date(event.event_date).toLocaleDateString()}
                            </span>
                          )}
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={14} />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                        {event.description}
                      </p>

                      {/* Event Stats */}
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-1 text-slate-400">
                          <UsersIcon size={16} />
                          <span className="text-sm">
                            {event.current_attendees}/{event.max_attendees || '∞'}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold">
                            Ksh {event.price.toLocaleString()}
                          </div>
                          {event.member_discount > 0 && (
                            <div className="text-sm text-amber-400">
                              {event.member_discount}% member discount
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/events/register/${event.id}`)}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:opacity-90 transition"
                        >
                          View Registration
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          disabled={!event.is_active}
                          className="px-4 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-600 transition disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredEvents.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="mx-auto text-slate-700 mb-4" size={48} />
                  <p className="text-slate-400">No events found</p>
                </div>
              )}
            </div>
          )}

        
          

          {/* Merchandise Tab */}
{activeTab === "merchandise" && (
  <div>
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-white font-poppins">
        Merchandise Management ({products.length})
      </h2>
      <div className="flex gap-4">
        <button
          onClick={() => {
            setShowProductForm(true);
            setEditingProduct(null);
            setNewProduct({
              name: '',
              description: '',
              base_price: '',
              category: 'tshirt',
              featured_image_url: '',
              is_active: true,
              is_out_of_stock: false,
              variants: [],
              images: []
            });
          }}
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:opacity-90 flex items-center gap-2"
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>
    </div>

    {showProductForm && (
      <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700 mb-6">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Tag size={24} className="text-green-400" />
          {editingProduct ? 'Edit Product' : 'Create New Product'}
        </h3>
        <form onSubmit={handleCreateProduct} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white mb-2">Product Name *</label>
              <input
                type="text"
                required
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                placeholder="Premium T-Shirt"
              />
            </div>
            <div>
              <label className="block text-white mb-2">Category *</label>
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({...newProduct, category: e.target.value as any})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
              >
                <option value="tshirt">T-Shirt</option>
                <option value="polo">Polo Shirt</option>
                <option value="hoodie">Hoodie</option>
                <option value="accessory">Accessory</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-white mb-2">Base Price (KES) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={newProduct.base_price}
                onChange={(e) => setNewProduct({...newProduct, base_price: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                placeholder="1500"
              />
            </div>
            <div>
              <label className="block text-white mb-2">Featured Image URL</label>
              <input
                type="url"
                value={newProduct.featured_image_url}
                onChange={(e) => setNewProduct({...newProduct, featured_image_url: e.target.value})}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-white mb-2">Description</label>
            <textarea
              rows={3}
              value={newProduct.description}
              onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="Product description..."
            />
          </div>

          {/* Variants Section */}
          <div className="border-t border-slate-700 pt-6">
            <h4 className="text-lg font-semibold text-white mb-4">Product Variants</h4>
            
            {/* Add Variant Form */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-slate-800/50 rounded-lg">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Color Name</label>
                <input
                  type="text"
                  value={newVariant.color_name}
                  onChange={(e) => setNewVariant({...newVariant, color_name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                  placeholder="Black"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newVariant.color_hex}
                    onChange={(e) => setNewVariant({...newVariant, color_hex: e.target.value})}
                    className="w-10 h-10 rounded border border-slate-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newVariant.color_hex}
                    onChange={(e) => setNewVariant({...newVariant, color_hex: e.target.value})}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                    placeholder="#000000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Size</label>
                <input
                  type="text"
                  value={newVariant.size}
                  onChange={(e) => setNewVariant({...newVariant, size: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                  placeholder="M, L, XL"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">SKU</label>
                <input
                  type="text"
                  value={newVariant.sku}
                  onChange={(e) => setNewVariant({...newVariant, sku: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                  placeholder="TSH-BLK-M"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Stock Qty</label>
                <input
                  type="number"
                  min="0"
                  value={newVariant.stock_quantity}
                  onChange={(e) => setNewVariant({...newVariant, stock_quantity: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                  placeholder="50"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Price Adjust</label>
                <input
                  type="number"
                  step="0.01"
                  value={newVariant.price_adjustment}
                  onChange={(e) => setNewVariant({...newVariant, price_adjustment: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm"
                  placeholder="0"
                />
              </div>
              <div className="md:col-span-2 flex items-end">
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded hover:opacity-90 text-sm"
                >
                  Add Variant
                </button>
              </div>
            </div>

            {/* Variants List */}
            {newProduct.variants.length > 0 && (
              <div className="space-y-2">
                <p className="text-slate-300 text-sm">Added Variants:</p>
                {newProduct.variants.map((variant, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-800/30 rounded">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-6 h-6 rounded border border-slate-600"
                        style={{ backgroundColor: variant.color_hex }}
                      />
                      <span className="text-white text-sm">
                        {variant.color_name} • {variant.size} • SKU: {variant.sku} • 
                        Stock: {variant.stock_quantity} • +Ksh {variant.price_adjustment}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Status */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={newProduct.is_active}
                onChange={(e) => setNewProduct({...newProduct, is_active: e.target.checked})}
                className="w-5 h-5 rounded border-slate-700"
              />
              Active (Visible on site)
            </label>
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={newProduct.is_out_of_stock}
                onChange={(e) => setNewProduct({...newProduct, is_out_of_stock: e.target.checked})}
                className="w-5 h-5 rounded border-slate-700"
              />
              Mark as Out of Stock
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={productLoading}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {productLoading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowProductForm(false);
                setEditingProduct(null);
                setNewProduct({
                  name: '',
                  description: '',
                  base_price: '',
                  category: 'tshirt',
                  featured_image_url: '',
                  is_active: true,
                  is_out_of_stock: false,
                  variants: [],
                  images: []
                });
              }}
              className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>)}
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-slate-400 border-b border-slate-700">
            <th className="pb-3 px-4">Product</th>
            <th className="pb-3 px-4">Category</th>
            <th className="pb-3 px-4">Price</th>
            <th className="pb-3 px-4">Stock Status</th>
            <th className="pb-3 px-4">Variants</th>
            <th className="pb-3 px-4">Status</th>
            <th className="pb-3 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
              <td className="py-4 px-4">
                <div>
                  <p className="text-white font-medium">{product.name}</p>
                  <p className="text-sm text-slate-400 truncate max-w-xs">
                    {product.description}
                  </p>
                </div>
              </td>
              <td className="py-4 px-4">
                <span className="capitalize text-white">{product.category}</span>
              </td>
              <td className="py-4 px-4">
                <span className="text-white font-bold">Ksh {product.base_price.toLocaleString()}</span>
              </td>
              <td className="py-4 px-4">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                  product.is_out_of_stock 
                    ? 'bg-red-500/20 text-red-400' 
                    : 'bg-green-500/20 text-green-400'
                }`}>
                  {product.is_out_of_stock ? 'Out of Stock' : 'In Stock'}
                </span>
              </td>
              <td className="py-4 px-4">
                <span className="text-white">
                  {product.product_variants?.length || 0} variants
                </span>
              </td>
              <td className="py-4 px-4">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                  product.is_active 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="py-4 px-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingProduct(product);
                      setShowProductForm(true);
                      setNewProduct({
                        name: product.name,
                        description: product.description || '',
                        base_price: product.base_price.toString(),
                        category: product.category,
                        featured_image_url: product.featured_image_url || '',
                        is_active: product.is_active,
                        is_out_of_stock: product.is_out_of_stock,
                        variants: product.product_variants || [],
                        images: product.product_images || []
                      });
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Edit size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleUpdateProduct(product.id, { is_active: !product.is_active })}
                    className="px-3 py-1 bg-amber-600 text-white rounded text-sm hover:bg-amber-700"
                  >
                    {product.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {products.length === 0 && !productLoading && (
      <div className="text-center py-12">
        <Tag className="mx-auto text-slate-700 mb-4" size={48} />
        <p className="text-slate-400">No products found</p>
        <button
          onClick={() => setShowProductForm(true)}
          className="mt-4 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:opacity-90"
        >
          Add Your First Product
        </button>
      </div>
    )}
  </div>
)}
          <Footer />
        </div>
      </div>
    </div>
  );
}