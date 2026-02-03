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
  Package,
  CreditCard,
  FileText,
  CheckSquare,
  XSquare,
  MoreVertical,
  ExternalLink,
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
  updated_at: string;
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
  const [paymentSearch, setPaymentSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");

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

  useEffect(() => {
    console.log("Admin dashboard useEffect triggered:", {
      authLoading,
      user,
      userEmail: user?.email,
      userId: user?.id
    });

    if (authLoading) {
      console.log("Auth still loading...");
      return;
    }

    console.log("Auth loading complete");
    
    if (!user) {
      console.log("No user found, redirecting to login");
      router.push("/login");
      return;
    }

    console.log("User found, checking admin status");
    checkAdminStatus();
  }, [user, authLoading]);

  const checkAdminStatus = async () => {
    try {
      if (!user) {
        router.push("/login");
        return;
      }
      
      console.log("Checking admin status for user:", user.id);
      
      if (user.user_metadata?.role === 'admin') {
        console.log('User is admin (from user_metadata), loading admin dashboard');
        fetchData();
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      console.log("Profile fetch result:", { profile, profileError });

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        router.push("/member/dashboard");
        return;
      }

      if (!profile || profile.role !== 'admin') {
        console.log('User is not admin, redirecting to member dashboard');
        router.push("/member/dashboard");
        return;
      }

      console.log('User is confirmed admin, loading dashboard data');
      fetchData();
      
    } catch (error) {
      console.error("Admin check error:", error);
      router.push("/member/dashboard");
    }
  };

  const fetchData = async () => {
    try {
      setDataLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const token = await getSessionToken();
      
      if (!token) {
        console.error("No session token available in fetchData");
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

      // Fetch all data in parallel
      const [usersRes, paymentsRes, ordersRes, eventsRes] = await Promise.all([
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/payments', { headers }),
        fetch('/api/admin/orders', { headers }),
        fetch('/api/admin/events', { headers })
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        console.log("Users data:", data);
        setUsers(data.users || []);
      }

      if (paymentsRes.ok) {
        const data = await paymentsRes.json();
        console.log("Payments data:", data);
        setPayments(data.payments || []);
      }

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        console.log("Orders data:", data);
        setOrders(data.orders || []);
      }

      if (eventsRes.ok) {
        const data = await eventsRes.json();
        console.log("Events data:", data);
        setEvents(data.events || []);
      }

      // Fetch products
      await fetchProducts();

      // Calculate stats with proper TypeScript typing
      const totalMembers = users.length;
      const activeMembers = users.filter((u: User) => u.status === 'active').length;
      const pendingPayments = payments.filter((p: Payment) => p.status === 'pending').length;
      const totalRevenue = payments
        .filter((p: Payment) => p.status === 'confirmed')
        .reduce((acc: number, p: Payment) => acc + p.amount, 0);
      const pendingOrders = orders.filter((o: Order) => o.status === 'pending').length;
      const totalEvents = events.length;
      const upcomingEvents = events.filter((e: Event) => e.status === 'upcoming' && e.is_active).length;
      const today = new Date().toDateString();
      const todayRevenue = payments
        .filter((p: Payment) => p.status === 'confirmed' && new Date(p.created_at).toDateString() === today)
        .reduce((acc: number, p: Payment) => acc + p.amount, 0);

      setStats({
        totalMembers,
        activeMembers,
        pendingPayments,
        totalRevenue,
        pendingOrders,
        totalEvents,
        upcomingEvents,
        todayRevenue
      });

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
          id: Date.now().toString(),
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
      const token = await getSessionToken();
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
      const token = await getSessionToken();
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
  });

  const filteredPayments = payments.filter(payment => {
    const searchLower = paymentSearch.toLowerCase();
    return (
      payment.description?.toLowerCase().includes(searchLower) ||
      payment.profiles?.full_name.toLowerCase().includes(searchLower) ||
      payment.phone_number?.includes(paymentSearch) ||
      payment.account_reference?.includes(paymentSearch) ||
      payment.status.includes(paymentSearch.toLowerCase())
    );
  });

  const filteredOrders = orders.filter(order => {
    const searchLower = orderSearch.toLowerCase();
    return (
      order.customer_name?.toLowerCase().includes(searchLower) ||
      order.customer_email?.toLowerCase().includes(searchLower) ||
      order.customer_phone?.includes(orderSearch) ||
      order.status.includes(orderSearch.toLowerCase()) ||
      order.profiles?.full_name.toLowerCase().includes(searchLower)
    );
  });

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `Ksh ${amount.toLocaleString()}`;
  };

  // Loading state
  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900 text-xl">Loading Admin Dashboard...</div>
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
    <div className="min-h-screen bg-gray-50 font-inter flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center">
              <Shield className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-poppins">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 text-sm">Welcome, {user.email}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
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
      <div className="max-w-7xl mx-auto px-4 py-8 flex-1">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Users className="text-amber-500" size={28} />
              <Activity className="text-green-500" size={20} />
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Members</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{stats.totalMembers}</span>
                <span className="text-green-600 text-sm">({stats.activeMembers} active)</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="text-emerald-500" size={28} />
              <BarChart className="text-blue-500" size={20} />
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Revenue</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">Ksh {stats.totalRevenue.toLocaleString()}</span>
                <span className="text-blue-600 text-sm">Today: Ksh {stats.todayRevenue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="text-purple-500" size={28} />
              <Ticket className="text-pink-500" size={20} />
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Events</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{stats.totalEvents}</span>
                <span className="text-purple-600 text-sm">({stats.upcomingEvents} upcoming)</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <ShoppingBag className="text-cyan-500" size={28} />
              <Clock className="text-yellow-500" size={20} />
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Pending</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-700">Payments:</span>
                  <span className="text-yellow-600 font-semibold">{stats.pendingPayments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Orders:</span>
                  <span className="text-yellow-600 font-semibold">{stats.pendingOrders}</span>
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
              }}
              className={`px-5 py-3 font-medium rounded-lg transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          
          {/* Members Tab */}
          {activeTab === "members" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 font-poppins">
                  Member Management ({users.length})
                </h2>
                <button
                  onClick={() => {/* Add export functionality */}}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 border border-gray-300"
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-600 border-b border-gray-200">
                      <th className="pb-3 px-4 font-semibold">Member</th>
                      <th className="pb-3 px-4 font-semibold">Contact</th>
                      <th className="pb-3 px-4 font-semibold">Membership</th>
                      <th className="pb-3 px-4 font-semibold">Status</th>
                      <th className="pb-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((member) => (
                      <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-gray-900 font-medium">{member.full_name}</p>
                            <p className="text-sm text-gray-600">{member.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-gray-900">{member.phone_number}</p>
                          <p className="text-sm text-gray-600">{member.county || "N/A"}</p>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-gray-900 font-mono">{member.membership_number || "No membership"}</p>
                            <p className="text-sm text-gray-600">{member.course || "N/A"}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm w-fit ${
                              member.status === "active" ? "bg-emerald-100 text-emerald-700" :
                              member.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {member.status}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm w-fit ${
                              member.role === "admin" ? "bg-purple-100 text-purple-700" :
                              "bg-blue-100 text-blue-700"
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
                              onClick={() => updateUserStatus(member.id, "inactive")}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                              disabled={member.role === "inactive"}
                            >
                              Deactivate
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {users.length === 0 && (
                <div className="text-center py-12">
                  <Users className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">No members found</p>
                </div>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 font-poppins">
                  Payment Management ({payments.length})
                </h2>
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search payments..."
                      value={paymentSearch}
                      onChange={(e) => setPaymentSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => {/* Add export functionality */}}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 border border-gray-300"
                  >
                    <Download size={16} />
                    Export
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-600 border-b border-gray-200">
                      <th className="pb-3 px-4 font-semibold">Transaction</th>
                      <th className="pb-3 px-4 font-semibold">User</th>
                      <th className="pb-3 px-4 font-semibold">Amount</th>
                      <th className="pb-3 px-4 font-semibold">Date</th>
                      <th className="pb-3 px-4 font-semibold">Status</th>
                      <th className="pb-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-gray-900 font-medium">{payment.description || "Payment"}</p>
                            <p className="text-sm text-gray-600">{payment.payment_type}</p>
                            {payment.account_reference && (
                              <p className="text-xs text-gray-500">Ref: {payment.account_reference}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-gray-900 font-medium">{payment.profiles?.full_name || "N/A"}</p>
                            <p className="text-sm text-gray-600">{payment.phone_number || payment.profiles?.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-gray-900 font-bold">{formatCurrency(payment.amount)}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-gray-700">{formatDate(payment.created_at)}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                            payment.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                            payment.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                            payment.status === "processing" ? "bg-blue-100 text-blue-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {payment.status === "pending" && <Clock size={12} />}
                            {payment.status === "confirmed" && <CheckCircle size={12} />}
                            {payment.status === "failed" && <XCircle size={12} />}
                            {payment.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            {payment.status === "pending" && (
                              <>
                                <button
                                  onClick={() => updatePaymentStatus(payment.id, "confirmed")}
                                  className="px-3 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 flex items-center gap-1"
                                >
                                  <CheckCircle size={12} />
                                  Confirm
                                </button>
                                <button
                                  onClick={() => updatePaymentStatus(payment.id, "failed")}
                                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
                                >
                                  <XCircle size={12} />
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => {/* View details */}}
                              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 flex items-center gap-1"
                            >
                              <Eye size={12} />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredPayments.length === 0 && (
                <div className="text-center py-12">
                  <CreditCard className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">No payments found</p>
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 font-poppins">
                  Order Management ({orders.length})
                </h2>
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => {/* Add export functionality */}}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 border border-gray-300"
                  >
                    <Download size={16} />
                    Export
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-600 border-b border-gray-200">
                      <th className="pb-3 px-4 font-semibold">Order ID</th>
                      <th className="pb-3 px-4 font-semibold">Customer</th>
                      <th className="pb-3 px-4 font-semibold">Items</th>
                      <th className="pb-3 px-4 font-semibold">Total</th>
                      <th className="pb-3 px-4 font-semibold">Date</th>
                      <th className="pb-3 px-4 font-semibold">Status</th>
                      <th className="pb-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <p className="text-gray-900 font-mono text-sm">{order.id.slice(0, 8)}...</p>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-gray-900 font-medium">{order.customer_name || order.profiles?.full_name}</p>
                            <p className="text-sm text-gray-600">{order.customer_email || order.profiles?.email}</p>
                            {order.customer_phone && (
                              <p className="text-xs text-gray-500">{order.customer_phone}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-gray-700">{order.items?.length || 0} items</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-gray-900 font-bold">{formatCurrency(order.total)}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-gray-700">{formatDate(order.created_at)}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                            order.status === "delivered" ? "bg-emerald-100 text-emerald-700" :
                            order.status === "shipped" ? "bg-blue-100 text-blue-700" :
                            order.status === "processing" ? "bg-yellow-100 text-yellow-700" :
                            order.status === "pending" ? "bg-orange-100 text-orange-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-2">
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                              className="px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            <button
                              onClick={() => {/* View order details */}}
                              className="px-2 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 flex items-center gap-1"
                            >
                              <Eye size={12} />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                  <Package className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">No orders found</p>
                </div>
              )}
            </div>
          )}

          {/* Events Tab */}
          {activeTab === "events" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 font-poppins">
                  Event Management ({events.length})
                </h2>
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => setShowEventForm(true)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Create Event
                  </button>
                </div>
              </div>

              {/* Events Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition">
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{event.description.substring(0, 100)}...</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                          event.status === "upcoming" ? "bg-blue-100 text-blue-700" :
                          event.status === "ongoing" ? "bg-emerald-100 text-emerald-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {event.status}
                        </span>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar size={14} />
                          <span className="text-sm">{event.event_date ? formatDate(event.event_date) : "Date TBD"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin size={14} />
                          <span className="text-sm">{event.location || "Location TBD"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <UsersIcon size={14} />
                          <span className="text-sm">{event.current_attendees} / {event.max_attendees || '∞'} attendees</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Ticket size={14} />
                          <span className="text-sm">Ksh {event.price} (Members: Ksh {event.price - event.member_discount})</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          event.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        }`}>
                          {event.is_active ? "Active" : "Inactive"}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {/* Edit event */}}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredEvents.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">No events found</p>
                </div>
              )}

              {/* Event Form Modal */}
              {showEventForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900">Create New Event</h3>
                        <button
                          onClick={() => setShowEventForm(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      </div>
                      <form onSubmit={handleCreateEvent} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                            <input
                              type="text"
                              value={newEvent.name}
                              onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                            <input
                              type="datetime-local"
                              value={newEvent.event_date}
                              onChange={(e) => setNewEvent({...newEvent, event_date: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                              type="text"
                              value={newEvent.location}
                              onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price (Ksh)</label>
                            <input
                              type="number"
                              value={newEvent.price}
                              onChange={(e) => setNewEvent({...newEvent, price: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Member Discount (Ksh)</label>
                            <input
                              type="number"
                              value={newEvent.member_discount}
                              onChange={(e) => setNewEvent({...newEvent, member_discount: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Attendees</label>
                            <input
                              type="number"
                              value={newEvent.max_attendees}
                              onChange={(e) => setNewEvent({...newEvent, max_attendees: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                            <input
                              type="text"
                              value={newEvent.image_url}
                              onChange={(e) => setNewEvent({...newEvent, image_url: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={newEvent.description}
                            onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            rows={4}
                            required
                          />
                        </div>
                        <div className="flex gap-4 pt-4">
                          <button
                            type="submit"
                            disabled={creatingEvent}
                            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2 disabled:opacity-50"
                          >
                            {creatingEvent ? "Creating..." : "Create Event"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowEventForm(false)}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Merchandise Tab */}
          {activeTab === "merchandise" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 font-poppins">
                  Product Management ({products.length})
                </h2>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowProductForm(true)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Product
                  </button>
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition">
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{product.description.substring(0, 80)}...</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 rounded text-xs ${
                            product.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                          }`}>
                            {product.is_active ? "Active" : "Inactive"}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            product.is_out_of_stock ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {product.is_out_of_stock ? "Out of Stock" : "In Stock"}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Category:</span>
                          <span className="font-medium">{product.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Base Price:</span>
                          <span className="font-bold">{formatCurrency(product.base_price)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Variants:</span>
                          <span className="font-medium">{product.product_variants?.length || 0} variants</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Created: {formatDate(product.created_at)}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {products.length === 0 && (
                <div className="text-center py-12">
                  <Package className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500">No products found</p>
                  <button
                    onClick={() => setShowProductForm(true)}
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2 mx-auto"
                  >
                    <Plus size={16} />
                    Add Your First Product
                  </button>
                </div>
              )}

              {/* Product Form Modal */}
              {(showProductForm || editingProduct) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900">
                          {editingProduct ? "Edit Product" : "Create New Product"}
                        </h3>
                        <button
                          onClick={() => {
                            setShowProductForm(false);
                            setEditingProduct(null);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      </div>
                      <form onSubmit={editingProduct ? (e) => {
                        e.preventDefault();
                        handleUpdateProduct(editingProduct.id, newProduct);
                      } : handleCreateProduct} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                            <input
                              type="text"
                              value={newProduct.name}
                              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                              value={newProduct.category}
                              onChange={(e) => setNewProduct({...newProduct, category: e.target.value as any})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              required
                            >
                              <option value="tshirt">T-Shirt</option>
                              <option value="polo">Polo</option>
                              <option value="hoodie">Hoodie</option>
                              <option value="accessory">Accessory</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (Ksh)</label>
                            <input
                              type="number"
                              value={newProduct.base_price}
                              onChange={(e) => setNewProduct({...newProduct, base_price: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image URL</label>
                            <input
                              type="text"
                              value={newProduct.featured_image_url}
                              onChange={(e) => setNewProduct({...newProduct, featured_image_url: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={newProduct.description}
                            onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            rows={3}
                            required
                          />
                        </div>
                        
                        {/* Variants Section */}
                        <div className="border-t border-gray-200 pt-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Product Variants</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Color Name</label>
                              <input
                                type="text"
                                value={newVariant.color_name}
                                onChange={(e) => setNewVariant({...newVariant, color_name: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                placeholder="e.g., Navy Blue"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                              <input
                                type="color"
                                value={newVariant.color_hex}
                                onChange={(e) => setNewVariant({...newVariant, color_hex: e.target.value})}
                                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                              <input
                                type="text"
                                value={newVariant.size}
                                onChange={(e) => setNewVariant({...newVariant, size: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                placeholder="e.g., M, L, XL"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                              <input
                                type="text"
                                value={newVariant.sku}
                                onChange={(e) => setNewVariant({...newVariant, sku: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                placeholder="Unique SKU"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Price Adjustment (Ksh)</label>
                              <input
                                type="number"
                                value={newVariant.price_adjustment}
                                onChange={(e) => setNewVariant({...newVariant, price_adjustment: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                              <input
                                type="number"
                                value={newVariant.stock_quantity}
                                onChange={(e) => setNewVariant({...newVariant, stock_quantity: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleAddVariant}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
                          >
                            <Plus size={16} />
                            Add Variant
                          </button>
                          
                          {/* Display added variants */}
                          {newProduct.variants.length > 0 && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Added Variants:</h5>
                              <div className="space-y-2">
                                {newProduct.variants.map((variant, index) => (
                                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <div 
                                        className="w-6 h-6 rounded border border-gray-300"
                                        style={{ backgroundColor: variant.color_hex }}
                                      />
                                      <div>
                                        <p className="text-sm font-medium">{variant.color_name} - {variant.size}</p>
                                        <p className="text-xs text-gray-500">SKU: {variant.sku} | Stock: {variant.stock_quantity}</p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveVariant(index)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={newProduct.is_active}
                              onChange={(e) => setNewProduct({...newProduct, is_active: e.target.checked})}
                              className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                            />
                            <span className="text-sm text-gray-700">Active Product</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={newProduct.is_out_of_stock}
                              onChange={(e) => setNewProduct({...newProduct, is_out_of_stock: e.target.checked})}
                              className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                            />
                            <span className="text-sm text-gray-700">Out of Stock</span>
                          </label>
                        </div>
                        
                        <div className="flex gap-4 pt-6 border-t border-gray-200">
                          <button
                            type="submit"
                            disabled={productLoading}
                            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2 disabled:opacity-50"
                          >
                            {productLoading ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowProductForm(false);
                              setEditingProduct(null);
                            }}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-8">
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
                      {payments.slice(0, 5).map((payment) => (
                        <div key={payment.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                          <div>
                            <p className="text-gray-900 font-medium">{payment.description || "Payment"}</p>
                            <p className="text-sm text-gray-600">{payment.profiles?.full_name}</p>
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
                    </div>
                  </div>

                  {/* Recent Members */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <UserPlus size={20} className="text-amber-500" />
                      Recent Members
                    </h3>
                    <div className="space-y-3">
                      {users.slice(0, 5).map((user) => (
                        <div key={user.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                          <div>
                            <p className="text-gray-900 font-medium">{user.full_name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-700">{user.membership_number || "No membership"}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              user.status === "active" ? "bg-emerald-100 text-emerald-700" :
                              "bg-yellow-100 text-yellow-700"
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
              
              {/* Quick Actions */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 font-poppins">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setShowEventForm(true)}
                    className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition flex items-center gap-3"
                  >
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Calendar className="text-purple-600" size={24} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Create Event</p>
                      <p className="text-sm text-gray-600">Organize a new event</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setShowProductForm(true)}
                    className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition flex items-center gap-3"
                  >
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Tag className="text-amber-600" size={24} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Add Product</p>
                      <p className="text-sm text-gray-600">Add new merchandise</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("members")}
                    className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition flex items-center gap-3"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="text-blue-600" size={24} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Manage Members</p>
                      <p className="text-sm text-gray-600">View all members</p>
                    </div>
                  </button>
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