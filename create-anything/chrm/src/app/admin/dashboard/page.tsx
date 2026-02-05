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
  Heart,
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
  ChevronRight,
  TrendingUp,
  Award,
  Settings,
  LogOut,
  Home,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Loader2,
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
// Add to your type definitions
type CSREvent = {
  id: string;
  event_type: 'tree_planting' | 'community_service' | 'charity_drive' | 'educational' | 'health_campaign' | 'other';
  title: string;
  description: string;
  event_date: string;
  location: string;
  main_image_url?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  photos?: CSREventPhoto[];
};

type CSREventPhoto = {
  id: string;
  csr_event_id: string;
  image_url: string;
  caption?: string;
  display_order: number;
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

// Modal Component
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  type = 'info',
  size = 'md'
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  const typeIcons = {
    success: <CheckCircle className="text-white" size={24} />,
    error: <XCircle className="text-white" size={24} />,
    warning: <AlertTriangle className="text-white" size={24} />,
    info: <Info className="text-white" size={24} />,
    confirm: <AlertCircle className="text-white" size={24} />
  };

  const typeColors = {
    success: 'bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F]',
    error: 'bg-gradient-to-r from-[#E53E3E] to-[#C53030]',
    warning: 'bg-gradient-to-r from-[#FF7A00] to-[#FF9500]',
    info: 'bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F]',
    confirm: 'bg-gradient-to-r from-[#FF7A00] to-[#FF9500]'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`bg-white rounded-xl w-full ${sizeClasses[size]} animate-in fade-in zoom-in-95 duration-200`}>
        <div className={`p-4 rounded-t-xl ${typeColors[type]} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              {typeIcons[type]}
            </div>
            <h3 className="text-lg font-bold text-white font-poppins">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition"
          >
            <X className="text-white" size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Confirmation Modal Component
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = 'confirm'
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      type={type}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-[#6D7A8B]">{message}</p>
        <div className="flex gap-3 justify-end pt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-[#E7ECF3] text-[#6D7A8B] rounded-lg hover:bg-[#d4dae3] transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-[#E53E3E] to-[#C53030] text-white rounded-lg hover:opacity-90 transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Status Modal Component
const StatusModal = ({
  isOpen,
  onClose,
  type,
  title,
  message
}: {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      type={type}
      size="sm"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <div className={`p-4 rounded-full ${
            type === 'success' ? 'bg-[#E8F4FD]' :
            type === 'error' ? 'bg-[#FFF0F0]' :
            type === 'warning' ? 'bg-[#FFF4E6]' :
            'bg-[#E8F4FD]'
          }`}>
            {type === 'success' && <CheckCircle className="text-[#2B4C73]" size={48} />}
            {type === 'error' && <XCircle className="text-[#E53E3E]" size={48} />}
            {type === 'warning' && <AlertTriangle className="text-[#FF7A00]" size={48} />}
            {type === 'info' && <Info className="text-[#2B4C73]" size={48} />}
          </div>
        </div>
        <p className="text-center text-[#6D7A8B]">{message}</p>
        <div className="flex justify-center pt-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white rounded-lg hover:opacity-90 transition"
          >
            Continue
          </button>
        </div>
      </div>
    </Modal>
  );
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

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

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
    category: 'tshirt' as 'tshirt' | 'polo' | 'hoodie' | 'accessory' | 'other',
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
    color_hex: '#2B4C73',
    size: '',
    sku: '',
    price_adjustment: '0',
    stock_quantity: '0',
    is_available: true,
    image_url: ''
  });
  const [csrEvents, setCSREvents] = useState<CSREvent[]>([]);
  const [showCSREventForm, setShowCSREventForm] = useState(false);
  const [editingCSREvent, setEditingCSREvent] = useState<CSREvent | null>(null);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [selectedCSREventId, setSelectedCSREventId] = useState<string | null>(null);
  const [newCSREvent, setNewCSREvent] = useState({
    event_type: 'tree_planting' as CSREvent['event_type'],
    title: '',
    description: '',
    event_date: '',
    location: '',
    main_image_url: '',
    is_published: true
  });
  const [photoUpload, setPhotoUpload] = useState({
    image_url: '',
    caption: '',
    display_order: 0
  });
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{image_url: string; caption: string; display_order: number}>>([]);
  // Helper functions for modals
  const showSuccessMessage = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setShowSuccessModal(true);
  };

  const showErrorMessage = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setShowErrorModal(true);
  };

  const showConfirmation = (title: string, message: string, action: () => Promise<void>) => {
    setModalTitle(title);
    setModalMessage(message);
    setConfirmAction(() => action);
    setShowConfirmModal(true);
  };

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
  }, [user, authLoading, router]);

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
       await fetchCSREvents();
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
      showErrorMessage("Data Fetch Error", "Failed to load dashboard data. Please try again.");
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
      showErrorMessage("Products Error", "Failed to load products. Please try again.");
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
        showSuccessMessage("Success", "Product created successfully!");
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
      showErrorMessage("Error", error.message || 'Failed to create product');
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
        showSuccessMessage("Success", "Product updated successfully!");
        fetchProducts();
      } else {
        throw new Error('Failed to update product');
      }
    } catch (error) {
      showErrorMessage("Error", "Failed to update product");
    }
  };

  // Delete product (soft delete)
  const handleDeleteProduct = async (productId: string) => {
    showConfirmation(
      "Delete Product",
      "Are you sure you want to deactivate this product? This action cannot be undone.",
      async () => {
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
            showSuccessMessage("Success", "Product deactivated successfully!");
            fetchProducts();
          } else {
            throw new Error('Failed to delete product');
          }
        } catch (error) {
          showErrorMessage("Error", "Failed to delete product");
        }
      }
    );
  };

  // Add variant to product
  const handleAddVariant = () => {
    if (!newVariant.color_name || !newVariant.size || !newVariant.sku) {
      showErrorMessage("Validation Error", "Please fill in all variant fields");
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
      color_hex: '#2B4C73',
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
    showConfirmation(
      "Remove Variant",
      "Are you sure you want to remove this variant?",
      async () => {
        const updatedVariants = [...newProduct.variants];
        updatedVariants.splice(index, 1);
        setNewProduct({ ...newProduct, variants: updatedVariants });
        showSuccessMessage("Success", "Variant removed successfully!");
      }
    );
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
        showSuccessMessage("Success", "Event created successfully!");
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
      showErrorMessage("Error", error.message || 'Failed to create event');
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    showConfirmation(
      "Delete Event",
      "Are you sure you want to deactivate this event? This action cannot be undone.",
      async () => {
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
            showSuccessMessage("Success", "Event deactivated successfully!");
            fetchData();
          } else {
            throw new Error('Failed to delete event');
          }
        } catch (error) {
          showErrorMessage("Error", "Failed to delete event");
        }
      }
    );
  };

  const updatePaymentStatus = async (paymentId: string, status: 'confirmed' | 'failed') => {
    showConfirmation(
      `Mark Payment as ${status === 'confirmed' ? 'Confirmed' : 'Failed'}`,
      `Are you sure you want to mark this payment as ${status}?`,
      async () => {
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
            showSuccessMessage("Success", `Payment marked as ${status}!`);
          } else {
            throw new Error('Failed to update payment');
          }
        } catch (error) {
          showErrorMessage("Error", "Failed to update payment status");
        }
      }
    );
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
        showSuccessMessage("Success", `Order status updated to ${status}!`);
      } else {
        throw new Error('Failed to update order');
      }
    } catch (error) {
      showErrorMessage("Error", "Failed to update order status");
    }
  };
// Fetch CSR events
const fetchCSREvents = async () => {
  try {
    const token = await getSessionToken();
    if (!token) return;

    const response = await fetch('/api/admin/csr-events', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      setCSREvents(data.events || []);
    }
  } catch (error) {
    console.error('Error fetching CSR events:', error);
    showErrorMessage("CSR Events Error", "Failed to load CSR events");
  }
};

// Create CSR event
const handleCreateCSREvent = async (e: React.FormEvent) => {
  e.preventDefault();
  setDataLoading(true);

  try {
    const token = await getSessionToken();
    if (!token) throw new Error('No session');

    const response = await fetch('/api/admin/csr-events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newCSREvent)
    });

    if (response.ok) {
      showSuccessMessage("Success", "CSR Event created successfully!");
      setNewCSREvent({
        event_type: 'tree_planting',
        title: '',
        description: '',
        event_date: '',
        location: '',
        main_image_url: '',
        is_published: true
      });
      setShowCSREventForm(false);
      fetchCSREvents();
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create CSR event');
    }
  } catch (error: any) {
    showErrorMessage("Error", error.message || 'Failed to create CSR event');
  } finally {
    setDataLoading(false);
  }
};

// Update CSR event
const handleUpdateCSREvent = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingCSREvent) return;

  setDataLoading(true);
  try {
    const token = await getSessionToken();
    if (!token) throw new Error('No session');

    const response = await fetch(`/api/admin/csr-events/${editingCSREvent.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newCSREvent)
    });

    if (response.ok) {
      showSuccessMessage("Success", "CSR Event updated successfully!");
      setEditingCSREvent(null);
      setShowCSREventForm(false);
      fetchCSREvents();
    } else {
      throw new Error('Failed to update CSR event');
    }
  } catch (error: any) {
    showErrorMessage("Error", error.message || 'Failed to update CSR event');
  } finally {
    setDataLoading(false);
  }
};

// Delete CSR event
const handleDeleteCSREvent = async (eventId: string) => {
  showConfirmation(
    "Delete CSR Event",
    "Are you sure you want to delete this CSR event? This will also delete all associated photos.",
    async () => {
      try {
        const token = await getSessionToken();
        if (!token) return;

        const response = await fetch(`/api/admin/csr-events/${eventId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (response.ok) {
          showSuccessMessage("Success", "CSR Event deleted successfully!");
          fetchCSREvents();
        } else {
          throw new Error('Failed to delete CSR event');
        }
      } catch (error) {
        showErrorMessage("Error", "Failed to delete CSR event");
      }
    }
  );
};

// Add photo to upload list
const handleAddPhotoToList = () => {
  if (!photoUpload.image_url) {
    showErrorMessage("Validation Error", "Please enter an image URL");
    return;
  }

  setUploadedPhotos([...uploadedPhotos, { ...photoUpload }]);
  setPhotoUpload({
    image_url: '',
    caption: '',
    display_order: uploadedPhotos.length + 1
  });
};

// Remove photo from upload list
const handleRemovePhotoFromList = (index: number) => {
  const updated = [...uploadedPhotos];
  updated.splice(index, 1);
  setUploadedPhotos(updated);
};

// Upload photos to event
const handleUploadPhotos = async () => {
  if (!selectedCSREventId || uploadedPhotos.length === 0) {
    showErrorMessage("Validation Error", "Please add at least one photo");
    return;
  }

  setDataLoading(true);
  try {
    const token = await getSessionToken();
    if (!token) throw new Error('No session');

    const response = await fetch(`/api/admin/csr-events/${selectedCSREventId}/photos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ photos: uploadedPhotos })
    });

    if (response.ok) {
      showSuccessMessage("Success", "Photos uploaded successfully!");
      setUploadedPhotos([]);
      setShowPhotoUploadModal(false);
      setSelectedCSREventId(null);
      fetchCSREvents();
    } else {
      throw new Error('Failed to upload photos');
    }
  } catch (error: any) {
    showErrorMessage("Error", error.message || 'Failed to upload photos');
  } finally {
    setDataLoading(false);
  }
};

// Helper functions
const getEventTypeLabel = (type: CSREvent['event_type']) => {
  const labels = {
    tree_planting: 'Tree Planting',
    community_service: 'Community Service',
    charity_drive: 'Charity Drive',
    educational: 'Educational',
    health_campaign: 'Health Campaign',
    other: 'Other'
  };
  return labels[type] || type;
};

const openCSREventEdit = (event: CSREvent) => {
  setEditingCSREvent(event);
  setNewCSREvent({
    event_type: event.event_type,
    title: event.title,
    description: event.description,
    event_date: event.event_date,
    location: event.location,
    main_image_url: event.main_image_url || '',
    is_published: event.is_published
  });
  setShowCSREventForm(true);
};

const openPhotoUpload = (eventId: string) => {
  setSelectedCSREventId(eventId);
  setShowPhotoUploadModal(true);
};
  const updateUserStatus = async (userId: string, status: string) => {
    showConfirmation(
      `Mark User as ${status === 'active' ? 'Active' : 'Inactive'}`,
      `Are you sure you want to ${status === 'active' ? 'activate' : 'deactivate'} this user?`,
      async () => {
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
            showSuccessMessage("Success", `User ${status}!`);
          } else {
            throw new Error('Failed to update user');
          }
        } catch (error) {
          showErrorMessage("Error", "Failed to update user status");
        }
      }
    );
  };

  // Filter functions
  const filteredEvents = events.filter(event => {
    return event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           event.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredPayments = payments.filter(payment => {
    const searchLower = paymentSearch.toLowerCase();
    return (
      payment.description?.toLowerCase().includes(searchLower) ||
      payment.profiles?.full_name?.toLowerCase().includes(searchLower) ||
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
      order.profiles?.full_name?.toLowerCase().includes(searchLower)
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

  // Handle logout
  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // Loading state
  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#2B4C73] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-[#2B4C73] text-xl font-poppins">Loading Admin Dashboard...</div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-poppins flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E7ECF3] sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2B4C73] to-[#FF7A00] rounded-xl flex items-center justify-center shadow-md">
              <Shield className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0B0F1A]">
                Admin Dashboard
              </h1>
              <p className="text-[#6D7A8B] text-sm">Welcome, {user.email}</p>
            </div>
          </div>
          <div className="flex gap-3">
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
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-[#E7ECF3] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#E8F4FD] rounded-lg">
                <Users className="text-[#2B4C73]" size={24} />
              </div>
              <Activity className="text-[#FF7A00]" size={20} />
            </div>
            <div>
              <p className="text-[#6D7A8B] text-sm mb-1 font-medium">Total Members</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#0B0F1A]">{stats.totalMembers}</span>
                <span className="text-[#FF7A00] text-sm font-medium">({stats.activeMembers} active)</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#E7ECF3] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#FFF0F0] rounded-lg">
                <DollarSign className="text-[#E53E3E]" size={24} />
              </div>
              <BarChart className="text-[#2B4C73]" size={20} />
            </div>
            <div>
              <p className="text-[#6D7A8B] text-sm mb-1 font-medium">Revenue</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#0B0F1A]">Ksh {stats.totalRevenue.toLocaleString()}</span>
                <span className="text-[#2B4C73] text-sm font-medium">Today: Ksh {stats.todayRevenue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#E7ECF3] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#FFF4E6] rounded-lg">
                <Calendar className="text-[#FF7A00]" size={24} />
              </div>
              <Ticket className="text-[#E53E3E]" size={20} />
            </div>
            <div>
              <p className="text-[#6D7A8B] text-sm mb-1 font-medium">Events</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#0B0F1A]">{stats.totalEvents}</span>
                <span className="text-[#FF7A00] text-sm font-medium">({stats.upcomingEvents} upcoming)</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#E7ECF3] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#E8F4FD] rounded-lg">
                <ShoppingBag className="text-[#2B4C73]" size={24} />
              </div>
              <Clock className="text-[#FF7A00]" size={20} />
            </div>
            <div>
              <p className="text-[#6D7A8B] text-sm mb-1 font-medium">Pending</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#6D7A8B]">Payments:</span>
                  <span className="text-[#FF7A00] font-semibold">{stats.pendingPayments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6D7A8B]">Orders:</span>
                  <span className="text-[#FF7A00] font-semibold">{stats.pendingOrders}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: "overview", label: "Overview", icon: Activity, color: COLORS.darkBlue },
            { id: "members", label: "Members", icon: Users, color: COLORS.gold },
            { id: "payments", label: "Payments", icon: DollarSign, color: COLORS.maroon },
            { id: "orders", label: "Orders", icon: ShoppingBag, color: COLORS.darkBlue },
            { id: "events", label: "Events", icon: Calendar, color: COLORS.gold },
            { id: "merchandise", label: "Merchandise", icon: Tag, color: COLORS.maroon },
            { id: "csr", label: "CSR Events", icon: Heart, color: COLORS.maroon }
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
                  ? `linear-gradient(135deg, ${tab.color}, ${tab.color === COLORS.darkBlue ? '#1E3A5F' : tab.color === COLORS.gold ? '#FF8C00' : '#F56565'})`
                  : 'white'
              }}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl border border-[#E7ECF3] p-6 shadow-sm">
          
          {/* Members Tab */}
          {activeTab === "members" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#0B0F1A]">
                  Member Management ({users.length})
                </h2>
                <button
                  onClick={() => {/* Add export functionality */}}
                  className="px-4 py-2 bg-[#E8F4FD] text-[#2B4C73] rounded-lg hover:bg-[#d4e9fa] flex items-center gap-2 border border-[#2B4C73]/20 font-medium"
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>
              <div className="overflow-x-auto rounded-lg border border-[#E7ECF3]">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[#6D7A8B] border-b border-[#E7ECF3]">
                      <th className="pb-3 px-4 font-semibold bg-[#F7F9FC]">Member</th>
                      <th className="pb-3 px-4 font-semibold bg-[#F7F9FC]">Contact</th>
                      <th className="pb-3 px-4 font-semibold bg-[#F7F9FC]">Membership</th>
                      <th className="pb-3 px-4 font-semibold bg-[#F7F9FC]">Status</th>
                      <th className="pb-3 px-4 font-semibold bg-[#F7F9FC]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((member) => (
                      <tr key={member.id} className="border-b border-[#F7F9FC] hover:bg-[#F7F9FC]">
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-[#0B0F1A] font-medium">{member.full_name}</p>
                            <p className="text-sm text-[#6D7A8B]">{member.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-[#0B0F1A]">{member.phone_number || "N/A"}</p>
                          <p className="text-sm text-[#6D7A8B]">{member.county || "N/A"}</p>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-[#0B0F1A] font-mono">{member.membership_number || "No membership"}</p>
                            <p className="text-sm text-[#6D7A8B]">{member.course || "N/A"}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm w-fit font-medium ${
                              member.status === "active" ? "bg-[#E8F4FD] text-[#2B4C73]" :
                              member.status === "pending" ? "bg-[#FFF4E6] text-[#FF7A00]" :
                              "bg-[#FFF0F0] text-[#E53E3E]"
                            }`}>
                              {member.status}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm w-fit font-medium ${
                              member.role === "admin" ? "bg-[#E8F4FD] text-[#2B4C73]" :
                              "bg-[#FFF4E6] text-[#FF7A00]"
                            }`}>
                              {member.role}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateUserStatus(member.id, "active")}
                              className="px-3 py-1 bg-[#2B4C73] text-white rounded text-sm hover:bg-[#1E3A5F] disabled:opacity-50"
                              disabled={member.status === "active"}
                            >
                              Activate
                            </button>
                            <button
                              onClick={() => updateUserStatus(member.id, "inactive")}
                              className="px-3 py-1 bg-[#E53E3E] text-white rounded text-sm hover:bg-[#C53030] disabled:opacity-50"
                              disabled={member.status === "inactive"}
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
                  <Users className="mx-auto text-[#E7ECF3] mb-4" size={48} />
                  <p className="text-[#6D7A8B] font-medium">No members found</p>
                </div>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#0B0F1A]">
                  Payment Management ({payments.length})
                </h2>
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6D7A8B]" size={18} />
                    <input
                      type="text"
                      placeholder="Search payments..."
                      value={paymentSearch}
                      onChange={(e) => setPaymentSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
                    />
                  </div>
                  <button
                    onClick={() => {/* Add export functionality */}}
                    className="px-4 py-2 bg-[#E8F4FD] text-[#2B4C73] rounded-lg hover:bg-[#d4e9fa] flex items-center gap-2 border border-[#2B4C73]/20 font-medium"
                  >
                    <Download size={16} />
                    Export
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto rounded-lg border border-[#E7ECF3]">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[#6D7A8B] border-b border-[#E7ECF3]">
                      <th className="pb-3 px-4 font-semibold bg-[#F7F9FC]">Transaction</th>
                      <th className="pb-3 px-4 font-semibold bg-[#F7F9FC]">User</th>
                      <th className="pb-3 px-4 font-semibold bg-[#F7F9FC]">Amount</th>
                      <th className="pb-3 px-4 font-semibold bg-[#F7F9FC]">Date</th>
                      <th className="pb-3 px-4 font-semibold bg-[#F7F9FC]">Status</th>
                      <th className="pb-3 px-4 font-semibold bg-[#F7F9FC]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="border-b border-[#F7F9FC] hover:bg-[#F7F9FC]">
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-[#0B0F1A] font-medium">{payment.description || "Payment"}</p>
                            <p className="text-sm text-[#6D7A8B]">{payment.payment_type}</p>
                            {payment.account_reference && (
                              <p className="text-xs text-[#6D7A8B]">Ref: {payment.account_reference}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-[#0B0F1A] font-medium">{payment.profiles?.full_name || "N/A"}</p>
                            <p className="text-sm text-[#6D7A8B]">{payment.phone_number || payment.profiles?.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-[#0B0F1A] font-bold">{formatCurrency(payment.amount)}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-[#6D7A8B]">{formatDate(payment.created_at)}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                            payment.status === "confirmed" ? "bg-[#E8F4FD] text-[#2B4C73]" :
                            payment.status === "pending" ? "bg-[#FFF4E6] text-[#FF7A00]" :
                            payment.status === "processing" ? "bg-[#FFF0F0] text-[#E53E3E]" :
                            "bg-[#F7F9FC] text-[#6D7A8B]"
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
                                  className="px-3 py-1 bg-[#2B4C73] text-white rounded text-sm hover:bg-[#1E3A5F] flex items-center gap-1"
                                >
                                  <CheckCircle size={12} />
                                  Confirm
                                </button>
                                <button
                                  onClick={() => updatePaymentStatus(payment.id, "failed")}
                                  className="px-3 py-1 bg-[#E53E3E] text-white rounded text-sm hover:bg-[#C53030] flex items-center gap-1"
                                >
                                  <XCircle size={12} />
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => {/* View details */}}
                              className="px-3 py-1 bg-[#6D7A8B] text-white rounded text-sm hover:bg-[#5A6575] flex items-center gap-1"
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
                  <CreditCard className="mx-auto text-[#E7ECF3] mb-4" size={48} />
                  <p className="text-[#6D7A8B] font-medium">No payments found</p>
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#0B0F1A]">
                  Order Management ({orders.length})
                </h2>
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6D7A8B]" size={18} />
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
                    />
                  </div>
                  <button
                    onClick={() => {/* Add export functionality */}}
                    className="px-4 py-2 bg-[#E8F4FD] text-[#2B4C73] rounded-lg hover:bg-[#d4e9fa] flex items-center gap-2 border border-[#2B4C73]/20 font-medium"
                  >
                    <Download size={16} />
                    Export
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto rounded-lg border border-[#E7ECF3]">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-[#6D7A8B] border-b border-[#E7ECF3]">
                      <th className="pb-3 px-4 font-semibold bg-[#F7F9FC]">Order ID</th>
                      <th className="pb-3 px-4 font-semibold bg-[#F7F9FC]">Customer</th>
                      <th className="pb-3 px-4 font-semibold bg-[#F7F9FC]">Items</th>
                      <th className="pb-3 px-4 font-semibold bg-[#F7F9FC]">Total</th>
                      <th className="pb-3 px-4 font-semibold bg-[#F7F9FC]">Date</th>
                      <th className="pb-3 px-4 font-semibold bg-[#F7F9FC]">Status</th>
                      <th className="pb-3 px-4 font-semibold bg-[#F7F9FC]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b border-[#F7F9FC] hover:bg-[#F7F9FC]">
                        <td className="py-4 px-4">
                          <p className="text-[#0B0F1A] font-mono text-sm">{order.id.slice(0, 8)}...</p>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-[#0B0F1A] font-medium">{order.customer_name || order.profiles?.full_name}</p>
                            <p className="text-sm text-[#6D7A8B]">{order.customer_email || order.profiles?.email}</p>
                            {order.customer_phone && (
                              <p className="text-xs text-[#6D7A8B]">{order.customer_phone}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-[#6D7A8B]">{order.items?.length || 0} items</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-[#0B0F1A] font-bold">{formatCurrency(order.total)}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-[#6D7A8B]">{formatDate(order.created_at)}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                            order.status === "delivered" ? "bg-[#E8F4FD] text-[#2B4C73]" :
                            order.status === "shipped" ? "bg-[#FFF4E6] text-[#FF7A00]" :
                            order.status === "processing" ? "bg-[#FFF0F0] text-[#E53E3E]" :
                            order.status === "pending" ? "bg-[#FFF4E6] text-[#FF7A00]" :
                            "bg-[#F7F9FC] text-[#6D7A8B]"
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-2">
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                              className="px-2 py-1 border border-[#E7ECF3] rounded text-sm bg-white text-[#0B0F1A] focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent"
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            <button
                              onClick={() => {/* View order details */}}
                              className="px-2 py-1 bg-[#6D7A8B] text-white rounded text-sm hover:bg-[#5A6575] flex items-center gap-1"
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
                  <Package className="mx-auto text-[#E7ECF3] mb-4" size={48} />
                  <p className="text-[#6D7A8B] font-medium">No orders found</p>
                </div>
              )}
            </div>
          )}

          {/* Events Tab */}
          {activeTab === "events" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#0B0F1A]">
                  Event Management ({events.length})
                </h2>
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6D7A8B]" size={18} />
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
                    />
                  </div>
                  <button
                    onClick={() => setShowEventForm(true)}
                    className="px-4 py-2 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white rounded-lg hover:opacity-90 transition hover:shadow-md flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Create Event
                  </button>
                </div>
              </div>

              {/* Events Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="bg-white border border-[#E7ECF3] rounded-xl overflow-hidden hover:shadow-md transition hover:-translate-y-1">
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-[#0B0F1A] mb-1">{event.name}</h3>
                          <p className="text-sm text-[#6D7A8B] mb-2">{event.description.substring(0, 100)}...</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          event.status === "upcoming" ? "bg-[#E8F4FD] text-[#2B4C73]" :
                          event.status === "ongoing" ? "bg-[#FFF0F0] text-[#E53E3E]" :
                          "bg-[#F7F9FC] text-[#6D7A8B]"
                        }`}>
                          {event.status}
                        </span>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-[#6D7A8B]">
                          <Calendar size={14} />
                          <span className="text-sm">{event.event_date ? formatDate(event.event_date) : "Date TBD"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#6D7A8B]">
                          <MapPin size={14} />
                          <span className="text-sm">{event.location || "Location TBD"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#6D7A8B]">
                          <UsersIcon size={14} />
                          <span className="text-sm">{event.current_attendees} / {event.max_attendees || '∞'} attendees</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#6D7A8B]">
                          <Ticket size={14} />
                          <span className="text-sm">Ksh {event.price} (Members: Ksh {event.price - event.member_discount})</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          event.is_active ? "bg-[#E8F4FD] text-[#2B4C73]" : "bg-[#FFF0F0] text-[#E53E3E]"
                        }`}>
                          {event.is_active ? "Active" : "Inactive"}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {/* Edit event */}}
                            className="px-3 py-1 bg-[#2B4C73] text-white rounded text-sm hover:bg-[#1E3A5F]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="px-3 py-1 bg-[#E53E3E] text-white rounded text-sm hover:bg-[#C53030]"
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
                  <Calendar className="mx-auto text-[#E7ECF3] mb-4" size={48} />
                  <p className="text-[#6D7A8B] font-medium">No events found</p>
                </div>
              )}

              {/* Event Form Modal */}
              {showEventForm && (
                <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                  <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-[#0B0F1A]">Create New Event</h3>
                        <button
                          onClick={() => setShowEventForm(false)}
                          className="text-[#6D7A8B] hover:text-[#0B0F1A]"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <form onSubmit={handleCreateEvent} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Event Name</label>
                            <input
                              type="text"
                              value={newEvent.name}
                              onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                              className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Status</label>
                            <select
                              value={newEvent.status}
                              onChange={(e) => setNewEvent({...newEvent, status: e.target.value})}
                              className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
                            >
                              <option value="upcoming">Upcoming</option>
                              <option value="ongoing">Ongoing</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Event Date</label>
                            <input
                              type="datetime-local"
                              value={newEvent.event_date}
                              onChange={(e) => setNewEvent({...newEvent, event_date: e.target.value})}
                              className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Location</label>
                            <input
                              type="text"
                              value={newEvent.location}
                              onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                              className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Price (Ksh)</label>
                            <input
                              type="number"
                              value={newEvent.price}
                              onChange={(e) => setNewEvent({...newEvent, price: e.target.value})}
                              className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Member Discount (Ksh)</label>
                            <input
                              type="number"
                              value={newEvent.member_discount}
                              onChange={(e) => setNewEvent({...newEvent, member_discount: e.target.value})}
                              className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Max Attendees</label>
                            <input
                              type="number"
                              value={newEvent.max_attendees}
                              onChange={(e) => setNewEvent({...newEvent, max_attendees: e.target.value})}
                              className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Image URL</label>
                            <input
                              type="text"
                              value={newEvent.image_url}
                              onChange={(e) => setNewEvent({...newEvent, image_url: e.target.value})}
                              className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Description</label>
                          <textarea
                            value={newEvent.description}
                            onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                            className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
                            rows={4}
                            required
                          />
                        </div>
                        <div className="flex gap-4 pt-4">
                          <button
                            type="submit"
                            disabled={creatingEvent}
                            className="px-6 py-2 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white rounded-lg hover:opacity-90 transition hover:shadow-md flex items-center gap-2 disabled:opacity-50"
                          >
                            {creatingEvent && <Loader2 className="animate-spin" size={16} />}
                            {creatingEvent ? "Creating..." : "Create Event"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowEventForm(false)}
                            className="px-6 py-2 bg-[#E7ECF3] text-[#6D7A8B] rounded-lg hover:bg-[#d4dae3] transition"
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
                <h2 className="text-2xl font-bold text-[#0B0F1A]">
                  Product Management ({products.length})
                </h2>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowProductForm(true)}
                    className="px-4 py-2 bg-gradient-to-r from-[#FF7A00] to-[#FF9500] text-white rounded-lg hover:opacity-90 transition hover:shadow-md flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Product
                  </button>
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="bg-white border border-[#E7ECF3] rounded-xl overflow-hidden hover:shadow-md transition hover:-translate-y-1">
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-[#0B0F1A] mb-1">{product.name}</h3>
                          <p className="text-sm text-[#6D7A8B] mb-2">{product.description.substring(0, 80)}...</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            product.is_active ? "bg-[#E8F4FD] text-[#2B4C73]" : "bg-[#FFF0F0] text-[#E53E3E]"
                          }`}>
                            {product.is_active ? "Active" : "Inactive"}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            product.is_out_of_stock ? "bg-[#FFF0F0] text-[#E53E3E]" : "bg-[#E8F4FD] text-[#2B4C73]"
                          }`}>
                            {product.is_out_of_stock ? "Out of Stock" : "In Stock"}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between">
                          <span className="text-[#6D7A8B]">Category:</span>
                          <span className="font-medium text-[#0B0F1A]">{product.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6D7A8B]">Base Price:</span>
                          <span className="font-bold text-[#0B0F1A]">{formatCurrency(product.base_price)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6D7A8B]">Variants:</span>
                          <span className="font-medium text-[#0B0F1A]">{product.product_variants?.length || 0} variants</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[#6D7A8B]">Created: {formatDate(product.created_at)}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setNewProduct({
                                name: product.name,
                                description: product.description,
                                base_price: product.base_price.toString(),
                                category: product.category,
                                featured_image_url: product.featured_image_url || '',
                                is_active: product.is_active,
                                is_out_of_stock: product.is_out_of_stock,
                                variants: product.product_variants || [],
                                images: product.product_images || []
                              });
                            }}
                            className="px-3 py-1 bg-[#2B4C73] text-white rounded text-sm hover:bg-[#1E3A5F]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="px-3 py-1 bg-[#E53E3E] text-white rounded text-sm hover:bg-[#C53030]"
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
                  <Package className="mx-auto text-[#E7ECF3] mb-4" size={48} />
                  <p className="text-[#6D7A8B] font-medium">No products found</p>
                  <button
                    onClick={() => setShowProductForm(true)}
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-[#FF7A00] to-[#FF9500] text-white rounded-lg hover:opacity-90 transition hover:shadow-md flex items-center gap-2 mx-auto"
                  >
                    <Plus size={16} />
                    Add Your First Product
                  </button>
                </div>
              )}

              {/* Product Form Modal */}
              {(showProductForm || editingProduct) && (
                <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                  <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-[#0B0F1A]">
                          {editingProduct ? "Edit Product" : "Create New Product"}
                        </h3>
                        <button
                          onClick={() => {
                            setShowProductForm(false);
                            setEditingProduct(null);
                          }}
                          className="text-[#6D7A8B] hover:text-[#0B0F1A]"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <form onSubmit={editingProduct ? (e) => {
                        e.preventDefault();
                        handleUpdateProduct(editingProduct.id, {
                          ...newProduct,
                        base_price: parseFloat(newProduct.base_price)
                                });
                      } : handleCreateProduct} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Product Name</label>
                            <input
                              type="text"
                              value={newProduct.name}
                              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                              className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Category</label>
                            <select
                              value={newProduct.category}
                              onChange={(e) => setNewProduct({...newProduct, category: e.target.value as any})}
                              className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
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
                            <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Base Price (Ksh)</label>
                            <input
                              type="number"
                              value={newProduct.base_price}
                              onChange={(e) => setNewProduct({...newProduct, base_price: e.target.value})}
                              className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Featured Image URL</label>
                            <input
                              type="text"
                              value={newProduct.featured_image_url}
                              onChange={(e) => setNewProduct({...newProduct, featured_image_url: e.target.value})}
                              className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Description</label>
                          <textarea
                            value={newProduct.description}
                            onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                            className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
                            rows={3}
                            required
                          />
                        </div>
                        
                        {/* Variants Section */}
                        <div className="border-t border-[#E7ECF3] pt-6">
                          <h4 className="text-lg font-semibold text-[#0B0F1A] mb-4">Product Variants</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Color Name</label>
                              <input
                                type="text"
                                value={newVariant.color_name}
                                onChange={(e) => setNewVariant({...newVariant, color_name: e.target.value})}
                                className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white"
                                placeholder="e.g., Navy Blue"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Color</label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="color"
                                  value={newVariant.color_hex}
                                  onChange={(e) => setNewVariant({...newVariant, color_hex: e.target.value})}
                                  className="w-10 h-10 p-1 border border-[#E7ECF3] rounded-lg"
                                />
                                <span className="text-sm text-[#6D7A8B]">{newVariant.color_hex}</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Size</label>
                              <input
                                type="text"
                                value={newVariant.size}
                                onChange={(e) => setNewVariant({...newVariant, size: e.target.value})}
                                className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white"
                                placeholder="e.g., M, L, XL"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#6D7A8B] mb-1">SKU</label>
                              <input
                                type="text"
                                value={newVariant.sku}
                                onChange={(e) => setNewVariant({...newVariant, sku: e.target.value})}
                                className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white"
                                placeholder="Unique SKU"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Price Adjustment (Ksh)</label>
                              <input
                                type="number"
                                value={newVariant.price_adjustment}
                                onChange={(e) => setNewVariant({...newVariant, price_adjustment: e.target.value})}
                                className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Stock Quantity</label>
                              <input
                                type="number"
                                value={newVariant.stock_quantity}
                                onChange={(e) => setNewVariant({...newVariant, stock_quantity: e.target.value})}
                                className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleAddVariant}
                            className="px-4 py-2 bg-[#6D7A8B] text-white rounded-lg hover:bg-[#5A6575] transition flex items-center gap-2"
                          >
                            <Plus size={16} />
                            Add Variant
                          </button>
                          
                          {/* Display added variants */}
                          {newProduct.variants.length > 0 && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-[#6D7A8B] mb-2">Added Variants:</h5>
                              <div className="space-y-2">
                                {newProduct.variants.map((variant, index) => (
                                  <div key={index} className="flex items-center justify-between p-3 bg-[#F7F9FC] rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <div 
                                        className="w-8 h-8 rounded border border-[#E7ECF3] shadow-sm"
                                        style={{ backgroundColor: variant.color_hex }}
                                      />
                                      <div>
                                        <p className="text-sm font-medium text-[#0B0F1A]">{variant.color_name} - {variant.size}</p>
                                        <p className="text-xs text-[#6D7A8B]">SKU: {variant.sku} | Stock: {variant.stock_quantity}</p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveVariant(index)}
                                      className="text-[#E53E3E] hover:text-[#C53030]"
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
                              className="rounded border-[#E7ECF3] text-[#FF7A00] focus:ring-[#FF7A00]"
                            />
                            <span className="text-sm text-[#6D7A8B]">Active Product</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={newProduct.is_out_of_stock}
                              onChange={(e) => setNewProduct({...newProduct, is_out_of_stock: e.target.checked})}
                              className="rounded border-[#E7ECF3] text-[#FF7A00] focus:ring-[#FF7A00]"
                            />
                            <span className="text-sm text-[#6D7A8B]">Out of Stock</span>
                          </label>
                        </div>
                        
                        <div className="flex gap-4 pt-6 border-t border-[#E7ECF3]">
                          <button
                            type="submit"
                            disabled={productLoading}
                            className="px-6 py-2 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white rounded-lg hover:opacity-90 transition hover:shadow-md flex items-center gap-2 disabled:opacity-50"
                          >
                            {productLoading && <Loader2 className="animate-spin" size={16} />}
                            {productLoading ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowProductForm(false);
                              setEditingProduct(null);
                            }}
                            className="px-6 py-2 bg-[#E7ECF3] text-[#6D7A8B] rounded-lg hover:bg-[#d4dae3] transition"
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
                <h2 className="text-2xl font-bold text-[#0B0F1A] mb-4">Recent Activity</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Payments */}
                  <div className="bg-[#F7F9FC] rounded-xl p-5 border border-[#E7ECF3]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-[#0B0F1A] flex items-center gap-2">
                        <DollarSign size={20} className="text-[#FF7A00]" />
                        Recent Payments
                      </h3>
                      <button
                        onClick={() => setActiveTab("payments")}
                        className="text-sm text-[#2B4C73] hover:text-[#1E3A5F] flex items-center gap-1 font-medium"
                      >
                        View all <ChevronRight size={14} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {payments.slice(0, 5).map((payment) => (
                        <div key={payment.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-[#E7ECF3] hover:shadow-sm transition">
                          <div>
                            <p className="text-[#0B0F1A] font-medium">{payment.description || "Payment"}</p>
                            <p className="text-sm text-[#6D7A8B]">{payment.profiles?.full_name}</p>
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
                    </div>
                  </div>

                  {/* Recent Members */}
                  <div className="bg-[#F7F9FC] rounded-xl p-5 border border-[#E7ECF3]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-[#0B0F1A] flex items-center gap-2">
                        <UserPlus size={20} className="text-[#2B4C73]" />
                        Recent Members
                      </h3>
                      <button
                        onClick={() => setActiveTab("members")}
                        className="text-sm text-[#2B4C73] hover:text-[#1E3A5F] flex items-center gap-1 font-medium"
                      >
                        View all <ChevronRight size={14} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {users.slice(0, 5).map((user) => (
                        <div key={user.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-[#E7ECF3] hover:shadow-sm transition">
                          <div>
                            <p className="text-[#0B0F1A] font-medium">{user.full_name}</p>
                            <p className="text-sm text-[#6D7A8B]">{user.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-[#6D7A8B]">{user.membership_number || "No membership"}</p>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              user.status === "active" ? "bg-[#E8F4FD] text-[#2B4C73]" :
                              "bg-[#FFF4E6] text-[#FF7A00]"
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
                <h2 className="text-2xl font-bold text-[#0B0F1A] mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setShowEventForm(true)}
                    className="p-4 bg-white border border-[#E7ECF3] rounded-xl hover:shadow-md transition hover:-translate-y-1 flex items-center gap-3 group"
                  >
                    <div className="w-12 h-12 bg-[#FFF4E6] rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                      <Calendar className="text-[#FF7A00]" size={24} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-[#0B0F1A]">Create Event</p>
                      <p className="text-sm text-[#6D7A8B]">Organize a new event</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setShowProductForm(true)}
                    className="p-4 bg-white border border-[#E7ECF3] rounded-xl hover:shadow-md transition hover:-translate-y-1 flex items-center gap-3 group"
                  >
                    <div className="w-12 h-12 bg-[#FFF0F0] rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                      <Tag className="text-[#E53E3E]" size={24} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-[#0B0F1A]">Add Product</p>
                      <p className="text-sm text-[#6D7A8B]">Add new merchandise</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("members")}
                    className="p-4 bg-white border border-[#E7ECF3] rounded-xl hover:shadow-md transition hover:-translate-y-1 flex items-center gap-3 group"
                  >
                    <div className="w-12 h-12 bg-[#E8F4FD] rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                      <Users className="text-[#2B4C73]" size={24} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-[#0B0F1A]">Manage Members</p>
                      <p className="text-sm text-[#6D7A8B]">View all members</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
{/* CSR Events Tab */}
{activeTab === "csr" && (
  <div>
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-[#0B0F1A]">
        CSR Event Management ({csrEvents.length})
      </h2>
      <div className="flex gap-4">
        <button
          onClick={() => {
            setEditingCSREvent(null);
            setNewCSREvent({
              event_type: 'tree_planting',
              title: '',
              description: '',
              event_date: '',
              location: '',
              main_image_url: '',
              is_published: true
            });
            setShowCSREventForm(true);
          }}
          className="px-4 py-2 bg-gradient-to-r from-[#E53E3E] to-[#FF7A00] text-white rounded-lg hover:opacity-90 transition hover:shadow-md flex items-center gap-2"
        >
          <Plus size={16} />
          Add CSR Event
        </button>
      </div>
    </div>

    {/* CSR Events Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {csrEvents.map((event) => (
        <div key={event.id} className="bg-white border border-[#E7ECF3] rounded-xl overflow-hidden hover:shadow-md transition hover:-translate-y-1">
          {/* Event Image */}
          {event.main_image_url && (
            <div className="h-48 overflow-hidden bg-[#F7F9FC]">
              <img 
                src={event.main_image_url} 
                alt={event.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=No+Image';
                }}
              />
            </div>
          )}
          
          <div className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    event.event_type === 'tree_planting' ? 'bg-green-100 text-green-700' :
                    event.event_type === 'community_service' ? 'bg-blue-100 text-blue-700' :
                    event.event_type === 'charity_drive' ? 'bg-purple-100 text-purple-700' :
                    event.event_type === 'educational' ? 'bg-yellow-100 text-yellow-700' :
                    event.event_type === 'health_campaign' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {getEventTypeLabel(event.event_type)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    event.is_published ? "bg-[#E8F4FD] text-[#2B4C73]" : "bg-[#FFF0F0] text-[#E53E3E]"
                  }`}>
                    {event.is_published ? "Published" : "Draft"}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[#0B0F1A] mb-1">{event.title}</h3>
                <p className="text-sm text-[#6D7A8B] mb-2 line-clamp-2">{event.description}</p>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-[#6D7A8B]">
                <Calendar size={14} />
                <span className="text-sm">{new Date(event.event_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              <div className="flex items-center gap-2 text-[#6D7A8B]">
                <MapPin size={14} />
                <span className="text-sm">{event.location}</span>
              </div>
              <div className="flex items-center gap-2 text-[#6D7A8B]">
                <ImageIcon size={14} />
                <span className="text-sm">{event.photos?.length || 0} photos</span>
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => openCSREventEdit(event)}
                className="flex-1 px-3 py-2 bg-[#2B4C73] text-white rounded-lg text-sm hover:bg-[#1E3A5F] flex items-center justify-center gap-1"
              >
                <Edit size={14} />
                Edit
              </button>
              <button
                onClick={() => openPhotoUpload(event.id)}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-[#FF7A00] to-[#FF9500] text-white rounded-lg text-sm hover:opacity-90 flex items-center justify-center gap-1"
              >
                <ImageIcon size={14} />
                Photos
              </button>
              <button
                onClick={() => handleDeleteCSREvent(event.id)}
                className="px-3 py-2 bg-[#E53E3E] text-white rounded-lg text-sm hover:bg-[#C53030] flex items-center justify-center"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
    
    {csrEvents.length === 0 && (
      <div className="text-center py-12">
        <Heart className="mx-auto text-[#E7ECF3] mb-4" size={48} />
        <p className="text-[#6D7A8B] font-medium mb-4">No CSR events found</p>
        <button
          onClick={() => setShowCSREventForm(true)}
          className="px-4 py-2 bg-gradient-to-r from-[#E53E3E] to-[#FF7A00] text-white rounded-lg hover:opacity-90 transition hover:shadow-md flex items-center gap-2 mx-auto"
        >
          <Plus size={16} />
          Add Your First CSR Event
        </button>
      </div>
    )}

    {/* CSR Event Form Modal */}
    {showCSREventForm && (
      <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#0B0F1A]">
                {editingCSREvent ? "Edit CSR Event" : "Create New CSR Event"}
              </h3>
              <button
                onClick={() => {
                  setShowCSREventForm(false);
                  setEditingCSREvent(null);
                }}
                className="text-[#6D7A8B] hover:text-[#0B0F1A]"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={editingCSREvent ? handleUpdateCSREvent : handleCreateCSREvent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Event Type *</label>
                  <select
                    value={newCSREvent.event_type}
                    onChange={(e) => setNewCSREvent({...newCSREvent, event_type: e.target.value as CSREvent['event_type']})}
                    className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
                    required
                  >
                    <option value="tree_planting">Tree Planting</option>
                    <option value="community_service">Community Service</option>
                    <option value="charity_drive">Charity Drive</option>
                    <option value="educational">Educational</option>
                    <option value="health_campaign">Health Campaign</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Event Date *</label>
                  <input
                    type="date"
                    value={newCSREvent.event_date}
                    onChange={(e) => setNewCSREvent({...newCSREvent, event_date: e.target.value})}
                    className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Title *</label>
                  <input
                    type="text"
                    value={newCSREvent.title}
                    onChange={(e) => setNewCSREvent({...newCSREvent, title: e.target.value})}
                    className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
                    placeholder="e.g., Community Tree Planting Drive 2024"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Location *</label>
                  <input
                    type="text"
                    value={newCSREvent.location}
                    onChange={(e) => setNewCSREvent({...newCSREvent, location: e.target.value})}
                    className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
                    placeholder="e.g., Karura Forest, Nairobi"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Main Image URL</label>
                  <input
                    type="url"
                    value={newCSREvent.main_image_url}
                    onChange={(e) => setNewCSREvent({...newCSREvent, main_image_url: e.target.value})}
                    className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-[#6D7A8B] mt-1">Optional: Add a cover image for the event</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Description *</label>
                <textarea
                  value={newCSREvent.description}
                  onChange={(e) => setNewCSREvent({...newCSREvent, description: e.target.value})}
                  className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
                  rows={4}
                  placeholder="Describe the event, its purpose, and impact..."
                  required
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={newCSREvent.is_published}
                  onChange={(e) => setNewCSREvent({...newCSREvent, is_published: e.target.checked})}
                  className="rounded border-[#E7ECF3] text-[#FF7A00] focus:ring-[#FF7A00]"
                />
                <label htmlFor="is_published" className="text-sm text-[#6D7A8B]">
                  Publish event (visible to public)
                </label>
              </div>
              
              <div className="flex gap-4 pt-4 border-t border-[#E7ECF3]">
                <button
                  type="submit"
                  disabled={dataLoading}
                  className="px-6 py-2 bg-gradient-to-r from-[#E53E3E] to-[#FF7A00] text-white rounded-lg hover:opacity-90 transition hover:shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {dataLoading && <Loader2 className="animate-spin" size={16} />}
                  {dataLoading ? "Saving..." : editingCSREvent ? "Update Event" : "Create Event"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCSREventForm(false);
                    setEditingCSREvent(null);
                  }}
                  className="px-6 py-2 bg-[#E7ECF3] text-[#6D7A8B] rounded-lg hover:bg-[#d4dae3] transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )}

    {/* Photo Upload Modal */}
    {showPhotoUploadModal && (
      <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#0B0F1A] flex items-center gap-2">
                <ImageIcon size={24} className="text-[#FF7A00]" />
                Add Event Photos
              </h3>
              <button
                onClick={() => {
                  setShowPhotoUploadModal(false);
                  setUploadedPhotos([]);
                  setSelectedCSREventId(null);
                }}
                className="text-[#6D7A8B] hover:text-[#0B0F1A]"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Add Photo Form */}
            <div className="mb-6 p-4 bg-[#F7F9FC] rounded-xl border border-[#E7ECF3]">
              <h4 className="text-sm font-semibold text-[#0B0F1A] mb-3">Add New Photo</h4>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Image URL *</label>
                  <input
                    type="url"
                    value={photoUpload.image_url}
                    onChange={(e) => setPhotoUpload({...photoUpload, image_url: e.target.value})}
                    className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Caption (Optional)</label>
                  <input
                    type="text"
                    value={photoUpload.caption}
                    onChange={(e) => setPhotoUpload({...photoUpload, caption: e.target.value})}
                    className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
                    placeholder="Describe what's happening in this photo"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Display Order</label>
                  <input
                    type="number"
                    value={photoUpload.display_order}
                    onChange={(e) => setPhotoUpload({...photoUpload, display_order: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent bg-white"
                    min="0"
                  />
                  <p className="text-xs text-[#6D7A8B] mt-1">Lower numbers appear first</p>
                </div>
                
                <button
                  type="button"
                  onClick={handleAddPhotoToList}
                  className="px-4 py-2 bg-[#2B4C73] text-white rounded-lg hover:bg-[#1E3A5F] transition flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Add to List
                </button>
              </div>
            </div>
            
            {/* Photos List */}
            {uploadedPhotos.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-[#0B0F1A] mb-3">
                  Photos to Upload ({uploadedPhotos.length})
                </h4>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {uploadedPhotos.map((photo, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-[#E7ECF3]">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#F7F9FC] flex-shrink-0">
                        <img 
                          src={photo.image_url} 
                          alt={photo.caption || `Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Image';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0B0F1A] truncate">{photo.caption || "No caption"}</p>
                        <p className="text-xs text-[#6D7A8B] truncate">{photo.image_url}</p>
                        <p className="text-xs text-[#6D7A8B] mt-1">Order: {photo.display_order}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePhotoFromList(index)}
                        className="text-[#E53E3E] hover:text-[#C53030] flex-shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Upload Actions */}
            <div className="flex gap-4 pt-4 border-t border-[#E7ECF3]">
              <button
                onClick={handleUploadPhotos}
                disabled={dataLoading || uploadedPhotos.length === 0}
                className="px-6 py-2 bg-gradient-to-r from-[#E53E3E] to-[#FF7A00] text-white rounded-lg hover:opacity-90 transition hover:shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {dataLoading && <Loader2 className="animate-spin" size={16} />}
                {dataLoading ? "Uploading..." : `Upload ${uploadedPhotos.length} Photo${uploadedPhotos.length !== 1 ? 's' : ''}`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPhotoUploadModal(false);
                  setUploadedPhotos([]);
                  setSelectedCSREventId(null);
                }}
                className="px-6 py-2 bg-[#E7ECF3] text-[#6D7A8B] rounded-lg hover:bg-[#d4dae3] transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
)}
      {/* Success Modal */}
      <StatusModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        type="success"
        title={modalTitle}
        message={modalMessage}
      />

      {/* Error Modal */}
      <StatusModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        type="error"
        title={modalTitle}
        message={modalMessage}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction || (async () => {})}
        title={modalTitle}
        message={modalMessage}
      />

      {/* Add global font style */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        
        .font-poppins {
          font-family: 'Poppins', sans-serif;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes zoomIn {
          from {
            transform: scale(0.95);
          }
          to {
            transform: scale(1);
          }
        }

        .animate-in {
          animation: fadeIn 0.2s ease-out;
        }

        .zoom-in-95 {
          animation: zoomIn 0.2s ease-out;
        }
      `}</style>
      
      <Footer />
    </div>
  );
}