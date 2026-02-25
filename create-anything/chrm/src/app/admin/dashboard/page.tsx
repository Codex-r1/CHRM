"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Users, DollarSign, ShoppingBag, Calendar, CheckCircle, XCircle, Clock,
  Plus, Edit, Heart, Trash2, Eye, Download, Search, Activity,
  UserPlus, Ticket, MapPin, Users as UsersIcon, Tag, Image as ImageIcon,
  Shield, ChevronRight, LogOut, AlertCircle,
  AlertTriangle, Info, X, Loader2, Upload, MessageSquare, Mail, Package,
  BarChart3, TrendingUp, Filter, RefreshCw, ChevronDown, Grid, List
} from "lucide-react";
import { useAuth } from "../../context/auth";
import Footer from "@/app/components/Footer";
import { supabase } from "@/app/lib/supabase/client";

type User = {
  id: string; full_name: string; email: string; membership_number?: string;
  status: string; role: string; phone_number?: string; graduation_year?: number;
  course?: string; county?: string; created_at: string;
  memberships?: { start_date: string; expiry_date: string; is_active: boolean }[];
};

type Payment = {
  id: string; user_id: string; payment_type: string; amount: number;
  status: 'pending' | 'processing' | 'confirmed' | 'failed';
  checkout_request_id?: string; account_reference?: string; phone_number?: string;
  description?: string; created_at: string; updated_at: string;
  profiles?: { full_name: string; email: string; membership_number: string };
};

type Order = {
  id: string; user_id: string; items: any[]; total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  customer_name?: string; customer_phone?: string; customer_email?: string;
  shipping_address?: string; created_at: string;
  profiles?: { full_name: string; email: string };
};

type Event = {
  id: string; name: string; description: string; event_date?: string;
  location?: string; price: number; member_discount: number;
  max_attendees?: number; current_attendees: number; is_active: boolean;
  created_at: string; image_url?: string; status: string;
};

type Stats = {
  totalMembers: number; activeMembers: number; pendingPayments: number;
  totalRevenue: number; pendingOrders: number; totalEvents: number;
  upcomingEvents: number; monthlyRevenue: number;
};

type Product = {
  id: string; name: string; slug: string; description: string;
  base_price: number; category: 'tshirt' | 'polo' | 'hoodie' | 'accessory' | 'other';
  is_active: boolean; is_out_of_stock: boolean; featured_image_url?: string;
  sort_order: number; created_at: string;
  product_variants?: ProductVariant[]; product_images?: ProductImage[];
};

type ProductVariant = {
  id: string; product_id: string;
  color_name: string; color_value: string; color_hex: string;
  size: string; sku: string; price_adjustment: number;
  stock_quantity: number; is_available: boolean; image_url?: string;
};

type ProductImage = {
  id: string; product_id: string; image_url: string; is_primary: boolean; sort_order: number;
};

type CSREvent = {
  id: string;
  event_type: 'tree_planting' | 'community_service' | 'charity_drive' | 'educational' | 'health_campaign' | 'other';
  title: string; description: string; event_date: string; location: string;
  main_image_url?: string; is_published: boolean; created_at: string; updated_at: string;
  photos?: CSREventPhoto[];
};

type CSREventPhoto = {
  id: string; csr_event_id: string; image_url: string; caption?: string;
  display_order: number; created_at: string;
};

type Official = {
  id: string; name: string; position: string; image_url: string;
  display_order: number; is_active: boolean; created_at: string;
};

type ContactMessage = {
  id: string; name: string; email: string; phone?: string;
  subject: string; message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  user_id?: string; created_at: string; updated_at: string;
};

// ─── BLANK VARIANT TEMPLATE ───────────────────────────────────────────────────
const BLANK_VARIANT = {
  color_name: '', color_value: '', color_hex: '#2B4C73',
  size: '', sku: '', price_adjustment: '0', stock_quantity: '0',
  is_available: true, image_url: ''
};

// ─── BLANK PRODUCT TEMPLATE ────────────────────────────────────────────────────
const BLANK_PRODUCT = {
  name: '', description: '', base_price: '',
  category: 'tshirt' as Product['category'],
  featured_image_url: '', is_active: true, is_out_of_stock: false,
  variants: [] as ProductVariant[], images: [] as ProductImage[]
};

// ─── Modal Components ─────────────────────────────────────────────────────────
const Modal = ({
  isOpen, onClose, title, children, type = 'info', size = 'md'
}: {
  isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode;
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm'; size?: 'sm' | 'md' | 'lg' | 'xl';
}) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`bg-white rounded-xl w-full ${sizeClasses[size]} shadow-2xl`} onClick={e => e.stopPropagation()}>
        <div className={`p-4 rounded-t-xl ${typeColors[type]} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">{typeIcons[type]}</div>
            <h3 className="text-lg font-bold text-white font-poppins">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition">
            <X className="text-white" size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const ConfirmationModal = ({
  isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = 'confirm'
}: {
  isOpen: boolean; onClose: () => void; onConfirm: () => Promise<void>;
  title: string; message: string; confirmText?: string; cancelText?: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
}) => {
  const [loading, setLoading] = useState(false);
  const handleConfirm = async () => {
    setLoading(true);
    try { await onConfirm(); } finally { setLoading(false); onClose(); }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} type={type} size="sm">
      <div className="space-y-4">
        <p className="text-[#6D7A8B]">{message}</p>
        <div className="flex gap-3 justify-end pt-4">
          <button onClick={onClose} disabled={loading}
            className="px-4 py-2 bg-[#E7ECF3] text-[#6D7A8B] rounded-lg hover:bg-[#d4dae3] transition disabled:opacity-50">
            {cancelText}
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-[#E53E3E] to-[#C53030] text-white rounded-lg hover:opacity-90 transition flex items-center gap-2 disabled:opacity-50">
            {loading && <Loader2 className="animate-spin" size={16} />}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const StatusModal = ({
  isOpen, onClose, type, title, message
}: {
  isOpen: boolean; onClose: () => void;
  type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string;
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} type={type} size="sm">
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <div className={`p-4 rounded-full ${type === 'success' ? 'bg-[#E8F4FD]' : type === 'error' ? 'bg-[#FFF0F0]' : type === 'warning' ? 'bg-[#FFF4E6]' : 'bg-[#E8F4FD]'}`}>
          {type === 'success' && <CheckCircle className="text-[#2B4C73]" size={48} />}
          {type === 'error' && <XCircle className="text-[#E53E3E]" size={48} />}
          {type === 'warning' && <AlertTriangle className="text-[#FF7A00]" size={48} />}
          {type === 'info' && <Info className="text-[#2B4C73]" size={48} />}
        </div>
      </div>
      <p className="text-center text-[#6D7A8B]">{message}</p>
      <div className="flex justify-center pt-4">
        <button onClick={onClose}
          className="px-6 py-2 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white rounded-lg hover:opacity-90 transition">
          Continue
        </button>
      </div>
    </div>
  </Modal>
);

const ImageUploadField = ({
  label, preview, onFileChange, onClear, accept = "image/*"
}: {
  label: string; preview: string; onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void; accept?: string;
}) => (
  <div>
    <label className="block text-sm font-medium text-[#6D7A8B] mb-1">{label}</label>
    {preview ? (
      <div className="relative w-full h-40 rounded-lg overflow-hidden border border-[#E7ECF3] mb-2">
        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        <button type="button" onClick={onClear}
          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md">
          <X size={14} />
        </button>
      </div>
    ) : (
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#E7ECF3] rounded-lg cursor-pointer hover:border-[#FF7A00] hover:bg-[#FFF4E6] transition mb-2">
        <Upload className="text-[#6D7A8B] mb-2" size={24} />
        <span className="text-sm text-[#6D7A8B]">Click to upload</span>
        <span className="text-xs text-[#6D7A8B] mt-1">PNG, JPG, WEBP up to 10MB</span>
        <input type="file" accept={accept} onChange={onFileChange} className="hidden" />
      </label>
    )}
  </div>
);

// ─── Category Badge ────────────────────────────────────────────────────────────
const CategoryBadge = ({ cat }: { cat: string }) => {
  const map: Record<string, string> = {
    tshirt: 'bg-blue-100 text-blue-700',
    polo: 'bg-purple-100 text-purple-700',
    hoodie: 'bg-orange-100 text-orange-700',
    accessory: 'bg-green-100 text-green-700',
    other: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${map[cat] || map.other}`}>
      {cat}
    </span>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const fetchedRef = useRef(false);

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
    totalMembers: 0, activeMembers: 0, pendingPayments: 0, totalRevenue: 0,
    pendingOrders: 0, totalEvents: 0, upcomingEvents: 0, monthlyRevenue: 0,
  });
  const [dataLoading, setDataLoading] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const [csrEvents, setCSREvents] = useState<CSREvent[]>([]);
  const [showCSREventForm, setShowCSREventForm] = useState(false);
  const [editingCSREvent, setEditingCSREvent] = useState<CSREvent | null>(null);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [selectedCSREventId, setSelectedCSREventId] = useState<string | null>(null);
  const [csrLoading, setCsrLoading] = useState(false);
  const [newCSREvent, setNewCSREvent] = useState({
    event_type: 'tree_planting' as CSREvent['event_type'],
    title: '', description: '', event_date: '', location: '', main_image_url: '', is_published: true
  });
  const [csrMainImage, setCsrMainImage] = useState<File | null>(null);
  const [csrMainImagePreview, setCsrMainImagePreview] = useState<string>('');
  const [csrPhotoFiles, setCsrPhotoFiles] = useState<File[]>([]);
  const [csrPhotoPreviews, setCsrPhotoPreviews] = useState<string[]>([]);

  const [newEvent, setNewEvent] = useState({
    name: '', description: '', event_date: '', location: '', price: '',
    member_discount: '5', max_attendees: '', image_url: '', is_active: true, status: 'upcoming'
  });
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState<string>('');
  const [creatingEvent, setCreatingEvent] = useState(false);

  // ── FIX: product form state uses BLANK_PRODUCT so it's always a clean slate
  const [newProduct, setNewProduct] = useState({ ...BLANK_PRODUCT });
  const [newVariant, setNewVariant] = useState({ ...BLANK_VARIANT });
  const [productMainImage, setProductMainImage] = useState<File | null>(null);
  const [productMainImagePreview, setProductMainImagePreview] = useState<string>('');
  const [variantImageFiles, setVariantImageFiles] = useState<Map<string, File>>(new Map());

  // Merch UI state
  const [merchSearch, setMerchSearch] = useState("");
  const [merchCategoryFilter, setMerchCategoryFilter] = useState<string>("all");
  const [merchView, setMerchView] = useState<'grid' | 'list'>('grid');

  const [officials, setOfficials] = useState<Official[]>([]);
  const [showOfficialForm, setShowOfficialForm] = useState(false);
  const [editingOfficial, setEditingOfficial] = useState<Official | null>(null);
  const [officialLoading, setOfficialLoading] = useState(false);
  const [newOfficial, setNewOfficial] = useState({ name: '', position: '', image_url: '', display_order: 0, is_active: true });
  const [officialImageFile, setOfficialImageFile] = useState<File | null>(null);
  const [officialImagePreview, setOfficialImagePreview] = useState<string>('');

  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
const csrSubmittingRef = useRef(false);
  // ─── Helpers ───────────────────────────────────────────────────────────────
  const getSessionToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  const showSuccessMessage = (title: string, message: string) => { setModalTitle(title); setModalMessage(message); setShowSuccessModal(true); };
  const showErrorMessage = (title: string, message: string) => { setModalTitle(title); setModalMessage(message); setShowErrorModal(true); };
  const showConfirmation = (title: string, message: string, action: () => Promise<void>) => {
    setModalTitle(title); setModalMessage(message); setConfirmAction(() => action); setShowConfirmModal(true);
  };

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}/${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicUrl;
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const formatCurrency = (amount: number) => `Ksh ${amount.toLocaleString()}`;
  const getEventTypeLabel = (type: CSREvent['event_type']) => ({
    tree_planting: 'Tree Planting', community_service: 'Community Service',
    charity_drive: 'Charity Drive', educational: 'Educational',
    health_campaign: 'Health Campaign', other: 'Other'
  })[type] || type;

  const handleFileChange = (file: File, setFile: (f: File | null) => void, setPreview: (s: string) => void) => {
    setFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCsrPhotoFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setCsrPhotoFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setCsrPhotoPreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeVariant = (variantId: string) => {
    setNewProduct(prev => ({ ...prev, variants: prev.variants.filter(v => v.id !== variantId) }));
    setVariantImageFiles(prev => { const next = new Map(prev); next.delete(variantId); return next; });
  };

  const handleVariantImageChange = (variantId: string, file: File) => {
    setVariantImageFiles(prev => { const next = new Map(prev); next.set(variantId, file); return next; });
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewProduct(prev => ({
        ...prev,
        variants: prev.variants.map(v => v.id === variantId ? { ...v, image_url: reader.result as string } : v)
      }));
    };
    reader.readAsDataURL(file);
  };

  // ─── Data fetching ─────────────────────────────────────────────────────────
  const fetchOfficials = useCallback(async () => {
    try {
      const token = await getSessionToken(); if (!token) return;
      const res = await fetch('/api/admin/officials', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setOfficials(data.officials || []); }
    } catch (err) { console.error('Officials fetch error:', err); }
  }, []);

  const fetchContactMessages = useCallback(async () => {
    try {
      setMessagesLoading(true);
      const token = await getSessionToken(); if (!token) return;
      const res = await fetch('/api/admin/contact-messages', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setContactMessages(data.messages || []); }
    } catch (err) { console.error('Error fetching contact messages:', err); }
    finally { setMessagesLoading(false); }
  }, []);

  const fetchCSREvents = useCallback(async () => {
    try {
      const token = await getSessionToken(); if (!token) return;
      const res = await fetch('/api/admin/csr-events', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setCSREvents(data.events || []); }
    } catch (err) { console.error('CSR fetch error:', err); }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setProductLoading(true);
      const token = await getSessionToken(); if (!token) return;
      const res = await fetch('/api/admin/merchandise', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setProducts(data.products || []); }
    } catch (err) { console.error('Products fetch error:', err); }
    finally { setProductLoading(false); }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setDataLoading(true);
      const token = await getSessionToken(); if (!token) return;
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      const [usersRes, paymentsRes, ordersRes, eventsRes] = await Promise.all([
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/payments', { headers }),
        fetch('/api/admin/orders', { headers }),
        fetch('/api/admin/events', { headers })
      ]);

      let fetchedUsers: User[] = [], fetchedPayments: Payment[] = [], fetchedOrders: Order[] = [], fetchedEvents: Event[] = [];
      if (usersRes.ok) { const d = await usersRes.json(); fetchedUsers = d.users || []; setUsers(fetchedUsers); }
      if (paymentsRes.ok) { const d = await paymentsRes.json(); fetchedPayments = d.payments || []; setPayments(fetchedPayments); }
      if (ordersRes.ok) { const d = await ordersRes.json(); fetchedOrders = d.orders || []; setOrders(fetchedOrders); }
      if (eventsRes.ok) { const d = await eventsRes.json(); fetchedEvents = d.events || []; setEvents(fetchedEvents); }

      await Promise.all([fetchProducts(), fetchCSREvents(), fetchOfficials(), fetchContactMessages()]);

      setStats({
        totalMembers: fetchedUsers.length,
        activeMembers: fetchedUsers.filter(u => u.status === 'active').length,
        pendingPayments: fetchedPayments.filter(p => p.status === 'pending').length,
        totalRevenue: fetchedPayments.filter(p => p.status === 'confirmed').reduce((a, p) => a + p.amount, 0),
        pendingOrders: fetchedOrders.filter(o => o.status === 'pending').length,
        totalEvents: fetchedEvents.length,
        upcomingEvents: fetchedEvents.filter(e => e.status === 'upcoming' && e.is_active).length,
        monthlyRevenue: fetchedPayments
          .filter(p => p.status === 'confirmed' && new Date(p.created_at).getMonth() === new Date().getMonth())
          .reduce((a, p) => a + p.amount, 0),
      });
    } catch (err) {
      console.error("Failed to fetch data:", err);
      showErrorMessage("Data Fetch Error", "Failed to load dashboard data.");
    } finally { setDataLoading(false); }
  }, [fetchProducts, fetchCSREvents, fetchOfficials, fetchContactMessages]);

  // ─── Event handlers ────────────────────────────────────────────────────────
  const resetEventForm = () => {
    setNewEvent({ name: '', description: '', event_date: '', location: '', price: '', member_discount: '5', max_attendees: '', image_url: '', is_active: true, status: 'upcoming' });
    setEventImageFile(null); setEventImagePreview(''); setEditingEvent(null); setShowEventForm(false);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault(); setCreatingEvent(true);
    try {
      const token = await getSessionToken(); if (!token) throw new Error('No session');
      let imageUrl = newEvent.image_url;
      if (eventImageFile) { setUploadingFiles(true); imageUrl = await uploadFile(eventImageFile, 'events', `events/${Date.now()}`); setUploadingFiles(false); }
      const res = await fetch('/api/admin/events', {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newEvent, image_url: imageUrl, price: parseFloat(newEvent.price), member_discount: parseInt(newEvent.member_discount), max_attendees: newEvent.max_attendees ? parseInt(newEvent.max_attendees) : null })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to create event'); }
      resetEventForm(); showSuccessMessage("Success", "Event created!");
      const t2 = await getSessionToken();
      const evRes = await fetch('/api/admin/events', { headers: { 'Authorization': `Bearer ${t2}` } });
      if (evRes.ok) { const d = await evRes.json(); setEvents(d.events || []); }
    } catch (err: any) { showErrorMessage("Error", err.message); }
    finally { setCreatingEvent(false); setUploadingFiles(false); }
  };

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingEvent) return; setCreatingEvent(true);
    try {
      const token = await getSessionToken(); if (!token) throw new Error('No session');
      let imageUrl = newEvent.image_url;
      if (eventImageFile) { setUploadingFiles(true); imageUrl = await uploadFile(eventImageFile, 'events', `events/${Date.now()}`); setUploadingFiles(false); }
      const res = await fetch(`/api/admin/events/${editingEvent.id}`, {
        method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newEvent, image_url: imageUrl, price: parseFloat(newEvent.price), member_discount: parseInt(newEvent.member_discount), max_attendees: newEvent.max_attendees ? parseInt(newEvent.max_attendees) : null })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to update event'); }
      resetEventForm(); showSuccessMessage("Success", "Event updated!");
      const t2 = await getSessionToken();
      const evRes = await fetch('/api/admin/events', { headers: { 'Authorization': `Bearer ${t2}` } });
      if (evRes.ok) { const d = await evRes.json(); setEvents(d.events || []); }
    } catch (err: any) { showErrorMessage("Error", err.message); }
    finally { setCreatingEvent(false); setUploadingFiles(false); }
  };

  const handleDeleteEvent = (eventId: string) => {
    showConfirmation("Delete Event", "Deactivate this event?", async () => {
      const token = await getSessionToken(); if (!token) return;
      const res = await fetch(`/api/admin/events/${eventId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { setEvents(prev => prev.filter(e => e.id !== eventId)); showSuccessMessage("Success", "Event deactivated!"); }
      else { showErrorMessage("Error", "Failed to delete event"); }
    });
  };

  // ─── CSR handlers ──────────────────────────────────────────────────────────
  const resetCsrForm = () => {
    setNewCSREvent({ event_type: 'tree_planting', title: '', description: '', event_date: '', location: '', main_image_url: '', is_published: true });
    setCsrMainImage(null); setCsrMainImagePreview(''); setCsrPhotoFiles([]); setCsrPhotoPreviews([]);
    setShowCSREventForm(false); setEditingCSREvent(null);
  };
// Replace handleCreateCSREvent in your dashboard
const handleCreateCSREvent = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Prevent double submission
  if (csrSubmittingRef.current) {
    console.log('Already submitting, ignoring duplicate call');
    return;
  }
  
  csrSubmittingRef.current = true;
  setCsrLoading(true);
  
  try {
    const token = await getSessionToken();
    if (!token) throw new Error('No session');
    
    // Upload main image if provided
    let mainImageUrl = newCSREvent.main_image_url;
    if (csrMainImage) {
      mainImageUrl = await uploadFile(csrMainImage, 'csr-events', `main/${Date.now()}`);
    }
    
    // Create the CSR event first
    const res = await fetch('/api/admin/csr-events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...newCSREvent,
        main_image_url: mainImageUrl
      })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create CSR event');
    }
    
    const data = await res.json();
    console.log('CSR event created:', data.event.id);
    
    // Upload photos if provided (only during creation, not edit)
    if (csrPhotoFiles.length > 0) {
      console.log(`Uploading ${csrPhotoFiles.length} photos...`);
      
      // Upload files to storage and get URLs
      const photoUrls = await Promise.all(
        csrPhotoFiles.map(async (file, index) => {
          const url = await uploadFile(file, 'csr-events', `photos/${data.event.id}`);
          return {
            image_url: url,
            caption: `Photo ${index + 1}`,
            display_order: index
          };
        })
      );
      
      console.log('Photo URLs ready:', photoUrls);
      
      // Send photos to API
      const photosRes = await fetch(`/api/admin/csr-events/${data.event.id}/photos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ photos: photoUrls })
      });
      
      if (!photosRes.ok) {
        console.error('Failed to save photos to database');
      } else {
        const photosData = await photosRes.json();
        console.log('Photos saved:', photosData.photos?.length);
      }
    }
    
    // Reset form and reload events
    resetCsrForm();
    showSuccessMessage("Success", "CSR Event created successfully!");
    await fetchCSREvents();
    
  } catch (err: any) {
    console.error('Error creating CSR event:', err);
    showErrorMessage("Error", err.message || 'Failed to create CSR event');
  } finally {
    setCsrLoading(false);
    csrSubmittingRef.current = false;
  }
};

  const handleUpdateCSREvent = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingCSREvent) return; setCsrLoading(true);
    try {
      const token = await getSessionToken(); if (!token) throw new Error('No session');
      let mainImageUrl = newCSREvent.main_image_url;
      if (csrMainImage) mainImageUrl = await uploadFile(csrMainImage, 'csr-events', `main/${Date.now()}`);
      const res = await fetch(`/api/admin/csr-events/${editingCSREvent.id}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newCSREvent, main_image_url: mainImageUrl }) });
      if (!res.ok) throw new Error('Failed to update CSR event');
      resetCsrForm(); showSuccessMessage("Success", "CSR Event updated!"); await fetchCSREvents();
    } catch (err: any) { showErrorMessage("Error", err.message); }
    finally { setCsrLoading(false); }
  };

  const handleDeleteCSREvent = (eventId: string) => {
    showConfirmation("Delete CSR Event", "Delete this event and all its photos?", async () => {
      const token = await getSessionToken(); if (!token) return;
      const res = await fetch(`/api/admin/csr-events/${eventId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { setCSREvents(prev => prev.filter(e => e.id !== eventId)); showSuccessMessage("Success", "CSR Event deleted!"); }
      else { showErrorMessage("Error", "Failed to delete CSR event"); }
    });
  };

  const openCSREventEdit = (event: CSREvent) => {
    setEditingCSREvent(event);
    setNewCSREvent({ event_type: event.event_type, title: event.title, description: event.description, event_date: event.event_date, location: event.location, main_image_url: event.main_image_url || '', is_published: event.is_published });
    setCsrMainImagePreview(event.main_image_url || ''); setShowCSREventForm(true);
  };

  const handleUploadPhotos = async () => {
  if (!selectedCSREventId || csrPhotoFiles.length === 0) {
    showErrorMessage("Validation", "Add at least one photo");
    return;
  }
  
  if (csrLoading) {
    console.log('Already uploading, ignoring duplicate call');
    return;
  }
  
  setCsrLoading(true);
  
  try {
    const token = await getSessionToken();
    if (!token) throw new Error('No session');
    
    console.log(`Uploading ${csrPhotoFiles.length} photos to event ${selectedCSREventId}...`);
    
    // Upload all files to storage first
    const photoUrls = await Promise.all(
      csrPhotoFiles.map(async (file, index) => {
        const url = await uploadFile(file, 'csr-events', `photos/${selectedCSREventId}`);
        return {
          image_url: url,
          caption: `Photo ${index + 1}`,
          display_order: index
        };
      })
    );
    
    console.log('Photo URLs ready, saving to database:', photoUrls);
    
    // Save photo records to database
    const res = await fetch(`/api/admin/csr-events/${selectedCSREventId}/photos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ photos: photoUrls })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to upload photos');
    }
    
    const data = await res.json();
    console.log('Photos saved successfully:', data.photos?.length);
    
    showSuccessMessage("Success", `${data.photos?.length || 0} photos uploaded!`);
    
    // Clean up and refresh
    setCsrPhotoFiles([]);
    setCsrPhotoPreviews([]);
    setShowPhotoUploadModal(false);
    setSelectedCSREventId(null);
    await fetchCSREvents();
    
  } catch (err: any) {
    console.error('Error uploading photos:', err);
    showErrorMessage("Error", err.message || 'Failed to upload photos');
  } finally {
    setCsrLoading(false);
  }
};

 
  const resetOfficialForm = () => {
    setNewOfficial({ name: '', position: '', image_url: '', display_order: 0, is_active: true });
    setOfficialImageFile(null); setOfficialImagePreview(''); setEditingOfficial(null); setShowOfficialForm(false);
  };

  const handleCreateOfficial = async (e: React.FormEvent) => {
    e.preventDefault(); setOfficialLoading(true);
    try {
      const token = await getSessionToken(); if (!token) throw new Error('No session');
      let imageUrl = newOfficial.image_url;
      if (officialImageFile) imageUrl = await uploadFile(officialImageFile, 'officials', `officials/${Date.now()}`);
      const res = await fetch('/api/admin/officials', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newOfficial, image_url: imageUrl }) });
      if (!res.ok) throw new Error('Failed to create official');
      resetOfficialForm(); showSuccessMessage("Success", "Official added!"); await fetchOfficials();
    } catch (err: any) { showErrorMessage("Error", err.message); }
    finally { setOfficialLoading(false); }
  };

  const handleUpdateOfficial = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingOfficial) return; setOfficialLoading(true);
    try {
      const token = await getSessionToken(); if (!token) throw new Error('No session');
      let imageUrl = newOfficial.image_url;
      if (officialImageFile) imageUrl = await uploadFile(officialImageFile, 'officials', `officials/${Date.now()}`);
      const res = await fetch(`/api/admin/officials/${editingOfficial.id}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newOfficial, image_url: imageUrl }) });
      if (!res.ok) throw new Error('Failed to update official');
      resetOfficialForm(); showSuccessMessage("Success", "Official updated!"); await fetchOfficials();
    } catch (err: any) { showErrorMessage("Error", err.message); }
    finally { setOfficialLoading(false); }
  };

  const handleDeleteOfficial = (officialId: string) => {
    showConfirmation("Delete Official", "Delete this official?", async () => {
      const token = await getSessionToken(); if (!token) return;
      const res = await fetch(`/api/admin/officials/${officialId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { setOfficials(prev => prev.filter(o => o.id !== officialId)); showSuccessMessage("Success", "Official deleted!"); }
      else { showErrorMessage("Error", "Failed to delete"); }
    });
  };

  const updatePaymentStatus = (paymentId: string, status: 'confirmed' | 'failed') => {
    showConfirmation(`Mark as ${status}`, `Mark this payment as ${status}?`, async () => {
      const token = await getSessionToken(); if (!token) return;
      const res = await fetch(`/api/admin/payments/${paymentId}`, { method: "PATCH", headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      if (res.ok) { setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status } : p)); showSuccessMessage("Success", `Payment marked as ${status}!`); }
      else { showErrorMessage("Error", "Failed to update"); }
    });
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const token = await getSessionToken(); if (!token) return;
    const res = await fetch(`/api/admin/orders/${orderId}`, { method: "PATCH", headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (res.ok) { setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o)); showSuccessMessage("Success", `Order updated!`); }
    else { showErrorMessage("Error", "Failed to update order"); }
  };

  const updateUserStatus = (userId: string, status: string) => {
    showConfirmation(`Mark User as ${status}`, `${status === 'active' ? 'Activate' : 'Deactivate'} this user?`, async () => {
      const token = await getSessionToken(); if (!token) return;
      const res = await fetch(`/api/admin/users/${userId}`, { method: "PATCH", headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      if (res.ok) { setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u)); showSuccessMessage("Success", `User ${status}!`); }
      else { showErrorMessage("Error", "Failed to update"); }
    });
  };

  // ── FIX: resetProductForm now fully resets ALL form state ──────────────────
  const resetProductForm = () => {
    setNewProduct({ ...BLANK_PRODUCT, variants: [], images: [] });
    setNewVariant({ ...BLANK_VARIANT });
    setProductMainImage(null);
    setProductMainImagePreview('');
    setVariantImageFiles(new Map());
    setShowProductForm(false);
    setEditingProduct(null);
  };

  // ── FIX: openProductEdit explicitly resets newVariant to BLANK ─────────────
  const openProductEdit = (p: Product) => {
    setEditingProduct(p);
    setNewProduct({
      name: p.name, description: p.description, base_price: p.base_price.toString(),
      category: p.category, featured_image_url: p.featured_image_url || '',
      is_active: p.is_active, is_out_of_stock: p.is_out_of_stock,
      variants: p.product_variants ? [...p.product_variants] : [],
      images: p.product_images ? [...p.product_images] : []
    });
    setNewVariant({ ...BLANK_VARIANT }); // always clear the add-variant form
    setProductMainImagePreview(p.featured_image_url || '');
    setVariantImageFiles(new Map()); // clear any pending upload files
    setShowProductForm(true);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setProductLoading(true);
    try {
      const token = await getSessionToken(); if (!token) throw new Error('No session');
      let mainImageUrl = newProduct.featured_image_url;
      if (productMainImage) mainImageUrl = await uploadFile(productMainImage, 'merchandise', `products/${Date.now()}`);
      const variants = await Promise.all(newProduct.variants.map(async v => {
        let imgUrl = v.image_url;
        const vFile = variantImageFiles.get(v.id);
        if (vFile) imgUrl = await uploadFile(vFile, 'product-variants', `variants/${Date.now()}`);
        return { ...v, price_adjustment: parseFloat(v.price_adjustment.toString()), stock_quantity: parseInt(v.stock_quantity.toString()), image_url: imgUrl };
      }));
      const res = await fetch('/api/admin/merchandise', {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newProduct, base_price: parseFloat(newProduct.base_price), featured_image_url: mainImageUrl, variants })
      });
      if (res.ok) { resetProductForm(); showSuccessMessage("Success", "Product created!"); await fetchProducts(); }
      else { const err = await res.json(); throw new Error(err.error || 'Failed'); }
    } catch (err: any) { showErrorMessage("Error", err.message); }
    finally { setProductLoading(false); }
  };

  const handleUpdateProduct = async (productId: string, updates: Partial<Product>) => {
    const token = await getSessionToken(); if (!token) return;
    const res = await fetch(`/api/admin/merchandise/${productId}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    if (res.ok) { showSuccessMessage("Success", "Product updated!"); fetchProducts(); }
    else { showErrorMessage("Error", "Failed to update"); }
  };

  const handleDeleteProduct = (productId: string) => {
    showConfirmation("Delete Product", "Deactivate this product?", async () => {
      const token = await getSessionToken(); if (!token) return;
      const res = await fetch(`/api/admin/merchandise/${productId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { showSuccessMessage("Success", "Product deactivated!"); fetchProducts(); }
      else { showErrorMessage("Error", "Failed"); }
    });
  };

  const handleAddVariant = () => {
    if (!newVariant.color_name || !newVariant.color_value || !newVariant.size || !newVariant.sku) {
      showErrorMessage("Validation", "Fill in color name, color value, size, and SKU");
      return;
    }
    const id = Date.now().toString();
    setNewProduct(prev => ({
      ...prev,
      variants: [...prev.variants, {
        id, product_id: '',
        color_name: newVariant.color_name, color_value: newVariant.color_value,
        color_hex: newVariant.color_hex, size: newVariant.size, sku: newVariant.sku,
        price_adjustment: parseFloat(newVariant.price_adjustment),
        stock_quantity: parseInt(newVariant.stock_quantity),
        is_available: newVariant.is_available, image_url: newVariant.image_url
      }]
    }));
    // ── FIX: reset variant form after adding ──────────────────────────────────
    setNewVariant({ ...BLANK_VARIANT });
  };

  // ─── Merch filter ──────────────────────────────────────────────────────────
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(merchSearch.toLowerCase()) || p.description?.toLowerCase().includes(merchSearch.toLowerCase());
    const matchCat = merchCategoryFilter === 'all' || p.category === merchCategoryFilter;
    return matchSearch && matchCat;
  });

  const filteredEvents = events.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.description.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredPayments = payments.filter(p => {
    const s = paymentSearch.toLowerCase();
    return p.description?.toLowerCase().includes(s) || p.profiles?.full_name?.toLowerCase().includes(s) || p.phone_number?.includes(paymentSearch) || p.account_reference?.includes(paymentSearch);
  });
  const filteredOrders = orders.filter(o => {
    const s = orderSearch.toLowerCase();
    return o.customer_name?.toLowerCase().includes(s) || o.customer_email?.toLowerCase().includes(s) || o.profiles?.full_name?.toLowerCase().includes(s);
  });

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) { showErrorMessage("Export Error", "No data to export"); return; }
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(row => headers.map(h => { const v = row[h]; if (!v) return ''; const s = String(v); return (s.includes(',') || s.includes('"')) ? `"${s.replace(/"/g, '""')}"` : s; }).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleLogout = async () => { await logout(); router.push("/"); };

  useEffect(() => {
    if (authLoading || fetchedRef.current) return;
    if (!user) { router.push("/login"); return; }
    const checkAndLoad = async () => {
      fetchedRef.current = true;
      if (user.user_metadata?.role === 'admin') { await fetchData(); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (!profile || profile.role !== 'admin') { router.push("/member/dashboard"); return; }
      await fetchData();
    };
    checkAndLoad();
  }, [user, authLoading]); // eslint-disable-line

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#2B4C73] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-[#2B4C73] text-xl font-poppins">Loading Admin Dashboard...</div>
        </div>
      </div>
    );
  }
  if (!user) return null;

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "members", label: "Members", icon: Users },
    { id: "payments", label: "Payments", icon: DollarSign },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "events", label: "Events", icon: Calendar },
    { id: "merchandise", label: "Merchandise", icon: Tag },
    { id: "gallery", label: "Gallery", icon: Heart },
    { id: "officials", label: "Officials", icon: UsersIcon },
    { id: "messages", label: "Messages", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-poppins flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E7ECF3] sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#2B4C73] to-[#FF7A00] rounded-xl flex items-center justify-center shadow-md">
              <Shield className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#0B0F1A] leading-tight">Admin Dashboard</h1>
              <p className="text-[#6D7A8B] text-xs">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} disabled={dataLoading}
              className="p-2 text-[#6D7A8B] hover:text-[#2B4C73] hover:bg-[#E8F4FD] rounded-lg transition">
              <RefreshCw size={18} className={dataLoading ? 'animate-spin' : ''} />
            </button>
            <button onClick={handleLogout}
              className="px-4 py-2 bg-gradient-to-r from-[#E53E3E] to-[#FF7A00] text-white rounded-lg hover:opacity-90 flex items-center gap-2 font-medium text-sm">
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Members', value: stats.totalMembers, sub: `${stats.activeMembers} active`, icon: Users, bg: 'bg-[#E8F4FD]', color: 'text-[#2B4C73]', accent: 'text-[#2B4C73]' },
            { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), sub: `${formatCurrency(stats.monthlyRevenue)} this month`, icon: TrendingUp, bg: 'bg-[#FFF0F0]', color: 'text-[#E53E3E]', accent: 'text-[#E53E3E]' },
            { label: 'Events', value: stats.totalEvents, sub: `${stats.upcomingEvents} upcoming`, icon: Calendar, bg: 'bg-[#FFF4E6]', color: 'text-[#FF7A00]', accent: 'text-[#FF7A00]' },
            { label: 'Pending Items', value: stats.pendingPayments + stats.pendingOrders, sub: `${stats.pendingPayments} payments · ${stats.pendingOrders} orders`, icon: Clock, bg: 'bg-[#E8F4FD]', color: 'text-[#2B4C73]', accent: 'text-[#2B4C73]' },
          ].map((s, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-[#E7ECF3] shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
                <s.icon size={20} className={s.color} />
              </div>
              <p className="text-[#6D7A8B] text-xs font-medium mb-0.5">{s.label}</p>
              <p className="text-xl font-bold text-[#0B0F1A]">{s.value}</p>
              {s.sub && <p className={`text-xs mt-0.5 ${s.accent} opacity-80`}>{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="bg-white rounded-xl border border-[#E7ECF3] shadow-sm mb-6 overflow-x-auto">
          <div className="flex gap-1 p-2 min-w-max">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 font-medium rounded-lg transition-all flex items-center gap-2 text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white shadow-md'
                    : 'text-[#6D7A8B] hover:bg-[#F7F9FC] hover:text-[#0B0F1A]'
                }`}>
                <tab.icon size={16} />{tab.label}
                {tab.id === 'messages' && contactMessages.filter(m => m.status === 'unread').length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-[#FF7A00] text-white text-xs rounded-full font-bold leading-none">
                    {contactMessages.filter(m => m.status === 'unread').length}
                  </span>
                )}
                {tab.id === 'payments' && stats.pendingPayments > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-[#E53E3E] text-white text-xs rounded-full font-bold leading-none">
                    {stats.pendingPayments}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content panels */}
        <div className="bg-white rounded-xl border border-[#E7ECF3] shadow-sm p-6">

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-[#0B0F1A]">Recent Activity</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#F7F9FC] rounded-xl p-5 border border-[#E7ECF3]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-[#0B0F1A] flex items-center gap-2"><DollarSign size={18} className="text-[#FF7A00]" />Recent Payments</h3>
                    <button onClick={() => setActiveTab("payments")} className="text-sm text-[#2B4C73] flex items-center gap-1 hover:underline">View all<ChevronRight size={14} /></button>
                  </div>
                  <div className="space-y-2">
                    {payments.slice(0, 5).map(p => (
                      <div key={p.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-[#E7ECF3]">
                        <div><p className="text-[#0B0F1A] font-medium text-sm">{p.description || "Payment"}</p><p className="text-xs text-[#6D7A8B]">{p.profiles?.full_name}</p></div>
                        <div className="text-right">
                          <p className="font-bold text-sm">Ksh {p.amount.toLocaleString()}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "confirmed" ? "bg-[#E8F4FD] text-[#2B4C73]" : p.status === "pending" ? "bg-[#FFF4E6] text-[#FF7A00]" : "bg-[#FFF0F0] text-[#E53E3E]"}`}>{p.status}</span>
                        </div>
                      </div>
                    ))}
                    {payments.length === 0 && <p className="text-sm text-[#6D7A8B] text-center py-4">No payments yet</p>}
                  </div>
                </div>
                <div className="bg-[#F7F9FC] rounded-xl p-5 border border-[#E7ECF3]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-[#0B0F1A] flex items-center gap-2"><UserPlus size={18} className="text-[#2B4C73]" />Recent Members</h3>
                    <button onClick={() => setActiveTab("members")} className="text-sm text-[#2B4C73] flex items-center gap-1 hover:underline">View all<ChevronRight size={14} /></button>
                  </div>
                  <div className="space-y-2">
                    {users.slice(0, 5).map(u => (
                      <div key={u.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-[#E7ECF3]">
                        <div><p className="text-[#0B0F1A] font-medium text-sm">{u.full_name}</p><p className="text-xs text-[#6D7A8B]">{u.email}</p></div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === "active" ? "bg-[#E8F4FD] text-[#2B4C73]" : "bg-[#FFF4E6] text-[#FF7A00]"}`}>{u.status}</span>
                      </div>
                    ))}
                    {users.length === 0 && <p className="text-sm text-[#6D7A8B] text-center py-4">No members yet</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MEMBERS */}
          {activeTab === "members" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[#0B0F1A]">Members</h2>
                  <p className="text-sm text-[#6D7A8B]">{users.length} total · {users.filter(u => u.status === 'active').length} active</p>
                </div>
                <button onClick={() => exportToCSV(users.map(u => ({ Name: u.full_name, Email: u.email, Phone: u.phone_number || '', 'Membership #': u.membership_number || '', Status: u.status })), 'members')}
                  className="px-4 py-2 bg-[#E8F4FD] text-[#2B4C73] rounded-lg flex items-center gap-2 border border-[#2B4C73]/20 text-sm hover:bg-[#d4e9fa] transition">
                  <Download size={15} /> Export CSV
                </button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-[#E7ECF3]">
                <table className="w-full">
                  <thead><tr className="text-left text-[#6D7A8B] border-b border-[#E7ECF3] bg-[#F7F9FC] text-sm">
                    {['Member', 'Contact', 'Membership', 'Status', 'Actions'].map(h => <th key={h} className="py-3 px-4 font-semibold">{h}</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-[#F7F9FC]">
                    {users.map(m => (
                      <tr key={m.id} className="hover:bg-[#F7F9FC] transition-colors">
                        <td className="py-4 px-4"><p className="font-medium text-sm text-[#0B0F1A]">{m.full_name}</p><p className="text-xs text-[#6D7A8B]">{m.email}</p></td>
                        <td className="py-4 px-4"><p className="text-sm">{m.phone_number || "—"}</p><p className="text-xs text-[#6D7A8B]">{m.county || "—"}</p></td>
                        <td className="py-4 px-4"><p className="text-sm font-mono font-medium">{m.membership_number || "None"}</p><p className="text-xs text-[#6D7A8B]">{m.course || "—"}</p></td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${m.status === "active" ? "bg-[#E8F4FD] text-[#2B4C73]" : "bg-[#FFF0F0] text-[#E53E3E]"}`}>{m.status}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <button onClick={() => updateUserStatus(m.id, "active")} disabled={m.status === "active"}
                              className="px-3 py-1.5 bg-[#2B4C73] text-white rounded-lg text-xs font-medium hover:bg-[#1E3A5F] disabled:opacity-40 transition">Activate</button>
                            <button onClick={() => updateUserStatus(m.id, "inactive")} disabled={m.status === "inactive"}
                              className="px-3 py-1.5 bg-[#E53E3E] text-white rounded-lg text-xs font-medium hover:bg-[#C53030] disabled:opacity-40 transition">Deactivate</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && <div className="text-center py-12 text-[#6D7A8B]">No members found</div>}
              </div>
            </div>
          )}

          {/* PAYMENTS */}
          {activeTab === "payments" && (
            <div>
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#0B0F1A]">Payments</h2>
                  <p className="text-sm text-[#6D7A8B]">{payments.length} total · {stats.pendingPayments} pending</p>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6D7A8B]" size={16} />
                    <input type="text" placeholder="Search payments..." value={paymentSearch} onChange={e => setPaymentSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-[#E7ECF3] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4C73]/30" />
                  </div>
                  <button onClick={() => exportToCSV(filteredPayments.map(p => ({ User: p.profiles?.full_name, Amount: p.amount, Status: p.status, Type: p.payment_type, Date: p.created_at })), 'payments')}
                    className="px-4 py-2 bg-[#E8F4FD] text-[#2B4C73] rounded-lg flex items-center gap-2 border border-[#2B4C73]/20 text-sm hover:bg-[#d4e9fa] transition">
                    <Download size={15} /> Export
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-[#E7ECF3]">
                <table className="w-full">
                  <thead><tr className="text-left text-[#6D7A8B] bg-[#F7F9FC] border-b border-[#E7ECF3] text-sm">
                    {['Transaction', 'User', 'Amount', 'Date', 'Status', 'Actions'].map(h => <th key={h} className="py-3 px-4 font-semibold">{h}</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-[#F7F9FC]">
                    {filteredPayments.map(p => (
                      <tr key={p.id} className="hover:bg-[#F7F9FC] transition-colors">
                        <td className="py-4 px-4"><p className="font-medium text-sm text-[#0B0F1A]">{p.description || "Payment"}</p><p className="text-xs text-[#6D7A8B]">{p.payment_type}</p></td>
                        <td className="py-4 px-4"><p className="font-medium text-sm">{p.profiles?.full_name || "N/A"}</p><p className="text-xs text-[#6D7A8B]">{p.phone_number}</p></td>
                        <td className="py-4 px-4"><p className="font-bold text-sm">{formatCurrency(p.amount)}</p></td>
                        <td className="py-4 px-4"><p className="text-xs text-[#6D7A8B]">{formatDate(p.created_at)}</p></td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.status === "confirmed" ? "bg-[#E8F4FD] text-[#2B4C73]" : p.status === "pending" ? "bg-[#FFF4E6] text-[#FF7A00]" : "bg-[#FFF0F0] text-[#E53E3E]"}`}>{p.status}</span>
                        </td>
                        <td className="py-4 px-4">
                          {p.status === "pending" && (
                            <div className="flex gap-2">
                              <button onClick={() => updatePaymentStatus(p.id, "confirmed")} className="px-3 py-1.5 bg-[#2B4C73] text-white rounded-lg text-xs font-medium hover:bg-[#1E3A5F] transition">Confirm</button>
                              <button onClick={() => updatePaymentStatus(p.id, "failed")} className="px-3 py-1.5 bg-[#E53E3E] text-white rounded-lg text-xs font-medium hover:bg-[#C53030] transition">Reject</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredPayments.length === 0 && <div className="text-center py-12 text-[#6D7A8B]">No payments found</div>}
              </div>
            </div>
          )}

          {/* ORDERS */}
          {activeTab === "orders" && (
            <div>
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#0B0F1A]">Orders</h2>
                  <p className="text-sm text-[#6D7A8B]">{orders.length} total · {stats.pendingOrders} pending</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6D7A8B]" size={16} />
                  <input type="text" placeholder="Search orders..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-[#E7ECF3] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4C73]/30" />
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-[#E7ECF3]">
                <table className="w-full">
                  <thead><tr className="text-left text-[#6D7A8B] bg-[#F7F9FC] border-b border-[#E7ECF3] text-sm">
                    {['Customer', 'Items', 'Total', 'Date', 'Status', 'Update'].map(h => <th key={h} className="py-3 px-4 font-semibold">{h}</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-[#F7F9FC]">
                    {filteredOrders.map(o => (
                      <tr key={o.id} className="hover:bg-[#F7F9FC] transition-colors">
                        <td className="py-4 px-4"><p className="font-medium text-sm text-[#0B0F1A]">{o.customer_name || o.profiles?.full_name}</p><p className="text-xs text-[#6D7A8B]">{o.customer_email || o.profiles?.email}</p></td>
                        <td className="py-4 px-4 text-sm">{o.items?.length || 0} items</td>
                        <td className="py-4 px-4 font-bold text-sm">{formatCurrency(o.total)}</td>
                        <td className="py-4 px-4 text-xs text-[#6D7A8B]">{formatDate(o.created_at)}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${o.status === "delivered" ? "bg-[#E8F4FD] text-[#2B4C73]" : o.status === "shipped" ? "bg-[#FFF4E6] text-[#FF7A00]" : "bg-[#FFF0F0] text-[#E53E3E]"}`}>{o.status}</span>
                        </td>
                        <td className="py-4 px-4">
                          <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value as Order['status'])}
                            className="px-2 py-1.5 border border-[#E7ECF3] rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#2B4C73]/30">
                            {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredOrders.length === 0 && <div className="text-center py-12 text-[#6D7A8B]">No orders found</div>}
              </div>
            </div>
          )}

          {/* EVENTS */}
          {activeTab === "events" && (
            <div>
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#0B0F1A]">Events</h2>
                  <p className="text-sm text-[#6D7A8B]">{events.length} total · {stats.upcomingEvents} upcoming</p>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6D7A8B]" size={16} />
                    <input type="text" placeholder="Search events..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-[#E7ECF3] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4C73]/30" />
                  </div>
                  <button onClick={() => { resetEventForm(); setShowEventForm(true); }}
                    className="px-4 py-2 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm hover:opacity-90 transition">
                    <Plus size={16} /> New Event
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredEvents.map(event => (
                  <div key={event.id} className="bg-white border border-[#E7ECF3] rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                    {event.image_url ? (
                      <div className="h-40 overflow-hidden"><img src={event.image_url} alt={event.name} className="w-full h-full object-cover" /></div>
                    ) : (
                      <div className="h-40 bg-gradient-to-br from-[#E8F4FD] to-[#d4e9fa] flex items-center justify-center">
                        <Calendar className="text-[#2B4C73] opacity-30" size={48} />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-base font-bold text-[#0B0F1A] leading-tight">{event.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ml-2 shrink-0 ${event.status === "upcoming" ? "bg-[#E8F4FD] text-[#2B4C73]" : "bg-[#F7F9FC] text-[#6D7A8B]"}`}>{event.status}</span>
                      </div>
                      <p className="text-xs text-[#6D7A8B] mb-3 line-clamp-2">{event.description}</p>
                      <div className="space-y-1 mb-4 text-xs text-[#6D7A8B]">
                        <div className="flex items-center gap-2"><Calendar size={12} />{event.event_date ? new Date(event.event_date).toLocaleDateString() : "TBD"}</div>
                        <div className="flex items-center gap-2"><MapPin size={12} />{event.location || "TBD"}</div>
                        <div className="flex items-center gap-2"><Ticket size={12} />Ksh {event.price} · {event.current_attendees}/{event.max_attendees || '∞'} attendees</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingEvent(event); setNewEvent({ name: event.name, description: event.description, event_date: event.event_date || '', location: event.location || '', price: event.price.toString(), member_discount: event.member_discount.toString(), max_attendees: event.max_attendees?.toString() || '', image_url: event.image_url || '', is_active: event.is_active, status: event.status }); setEventImagePreview(event.image_url || ''); setShowEventForm(true); }}
                          className="flex-1 px-3 py-2 bg-[#2B4C73] text-white rounded-lg text-xs font-medium hover:bg-[#1E3A5F] transition flex items-center justify-center gap-1">
                          <Edit size={13} /> Edit
                        </button>
                        <button onClick={() => handleDeleteEvent(event.id)}
                          className="px-3 py-2 bg-[#FFF0F0] text-[#E53E3E] border border-[#E53E3E]/20 rounded-lg text-xs font-medium hover:bg-[#E53E3E] hover:text-white transition">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredEvents.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-[#F7F9FC] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="text-[#E7ECF3]" size={32} />
                  </div>
                  <p className="text-[#6D7A8B] mb-4">No events found</p>
                  <button onClick={() => { resetEventForm(); setShowEventForm(true); }}
                    className="px-5 py-2 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white rounded-lg text-sm font-medium">Create First Event</button>
                </div>
              )}
            </div>
          )}

          {activeTab === "merchandise" && (
            <div>
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[#0B0F1A]">Merchandise</h2>
                  <p className="text-sm text-[#6D7A8B]">{products.length} products · {products.filter(p => p.is_active).length} active</p>
                </div>
                <button onClick={() => { resetProductForm(); setShowProductForm(true); }}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#FF7A00] to-[#FF9500] text-white rounded-xl flex items-center gap-2 text-sm font-semibold shadow-sm hover:opacity-90 transition">
                  <Plus size={16} /> Add Product
                </button>
              </div>

              {/* Filter bar */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6 items-stretch sm:items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6D7A8B]" size={16} />
                  <input type="text" placeholder="Search products..." value={merchSearch} onChange={e => setMerchSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-[#E7ECF3] rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/30" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['all', 'tshirt', 'polo', 'hoodie', 'accessory', 'other'].map(cat => (
                    <button key={cat} onClick={() => setMerchCategoryFilter(cat)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition ${
                        merchCategoryFilter === cat
                          ? 'bg-[#FF7A00] text-white shadow-sm'
                          : 'bg-[#F7F9FC] text-[#6D7A8B] border border-[#E7ECF3] hover:border-[#FF7A00]/40'
                      }`}>
                      {cat === 'all' ? 'All' : cat}
                    </button>
                  ))}
                </div>
                <div className="flex border border-[#E7ECF3] rounded-xl overflow-hidden">
                  <button onClick={() => setMerchView('grid')} className={`p-2 ${merchView === 'grid' ? 'bg-[#FF7A00] text-white' : 'bg-white text-[#6D7A8B] hover:bg-[#F7F9FC]'}`}><Grid size={16} /></button>
                  <button onClick={() => setMerchView('list')} className={`p-2 ${merchView === 'list' ? 'bg-[#FF7A00] text-white' : 'bg-white text-[#6D7A8B] hover:bg-[#F7F9FC]'}`}><List size={16} /></button>
                </div>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Total Products', value: products.length, color: 'text-[#2B4C73]', bg: 'bg-[#E8F4FD]' },
                  { label: 'Active', value: products.filter(p => p.is_active).length, color: 'text-green-700', bg: 'bg-green-50' },
                  { label: 'Out of Stock', value: products.filter(p => p.is_out_of_stock).length, color: 'text-[#E53E3E]', bg: 'bg-[#FFF0F0]' },
                  { label: 'Total Variants', value: products.reduce((sum, p) => sum + (p.product_variants?.length || 0), 0), color: 'text-[#FF7A00]', bg: 'bg-[#FFF4E6]' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-[#6D7A8B] mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Product grid / list */}
              {productLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="animate-spin text-[#FF7A00]" size={32} />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-[#FFF4E6] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="text-[#FF7A00]" size={28} />
                  </div>
                  <p className="text-[#6D7A8B] mb-2 font-medium">No products found</p>
                  <p className="text-xs text-[#6D7A8B] mb-4">Try adjusting your filters or add a new product</p>
                  <button onClick={() => { resetProductForm(); setShowProductForm(true); }}
                    className="px-5 py-2 bg-gradient-to-r from-[#FF7A00] to-[#FF9500] text-white rounded-xl text-sm font-semibold">Add First Product</button>
                </div>
              ) : merchView === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredProducts.map(p => (
                    <div key={p.id} className="bg-white border border-[#E7ECF3] rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                      {/* Image */}
                      <div className="relative h-44 bg-[#F7F9FC] overflow-hidden">
                        {p.featured_image_url ? (
                          <img src={p.featured_image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="text-[#E7ECF3]" size={40} />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 flex gap-1.5">
                          <CategoryBadge cat={p.category} />
                          {!p.is_active && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-800 text-white">Inactive</span>}
                          {p.is_out_of_stock && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E53E3E] text-white">OOS</span>}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-bold text-[#0B0F1A] mb-0.5 truncate">{p.name}</h3>
                        <p className="text-xs text-[#6D7A8B] mb-3 line-clamp-2">{p.description}</p>

                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg font-bold text-[#FF7A00]">{formatCurrency(p.base_price)}</span>
                          <span className="text-xs text-[#6D7A8B] bg-[#F7F9FC] px-2 py-1 rounded-lg border border-[#E7ECF3]">
                            {p.product_variants?.length || 0} variant{(p.product_variants?.length || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Color swatches */}
                        {p.product_variants && p.product_variants.length > 0 && (
                          <div className="flex gap-1 mb-3 flex-wrap">
                            {[...new Map(p.product_variants.map(v => [v.color_value, v])).values()].slice(0, 6).map(v => (
                              <div key={v.color_value} title={v.color_name}
                                className="w-5 h-5 rounded-full border-2 border-white shadow-sm ring-1 ring-[#E7ECF3]"
                                style={{ background: v.color_hex }} />
                            ))}
                            {[...new Set(p.product_variants.map(v => v.color_value))].length > 6 && (
                              <span className="text-xs text-[#6D7A8B] self-center">+{[...new Set(p.product_variants.map(v => v.color_value))].length - 6}</span>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button onClick={() => openProductEdit(p)}
                            className="flex-1 px-3 py-2 bg-[#2B4C73] text-white rounded-lg text-xs font-semibold hover:bg-[#1E3A5F] transition flex items-center justify-center gap-1">
                            <Edit size={13} /> Edit
                          </button>
                          <button onClick={() => handleUpdateProduct(p.id, { is_active: !p.is_active })}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold transition border ${p.is_active ? 'bg-[#FFF4E6] text-[#FF7A00] border-[#FF7A00]/20 hover:bg-[#FF7A00] hover:text-white' : 'bg-[#E8F4FD] text-[#2B4C73] border-[#2B4C73]/20 hover:bg-[#2B4C73] hover:text-white'}`}>
                            {p.is_active ? 'Disable' : 'Enable'}
                          </button>
                          <button onClick={() => handleDeleteProduct(p.id)}
                            className="px-3 py-2 bg-[#FFF0F0] text-[#E53E3E] border border-[#E53E3E]/20 rounded-lg text-xs hover:bg-[#E53E3E] hover:text-white transition">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* List view */
                <div className="rounded-xl border border-[#E7ECF3] overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-[#6D7A8B] bg-[#F7F9FC] border-b border-[#E7ECF3]">
                        <th className="py-3 px-4 font-semibold">Product</th>
                        <th className="py-3 px-4 font-semibold">Category</th>
                        <th className="py-3 px-4 font-semibold">Price</th>
                        <th className="py-3 px-4 font-semibold">Variants</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F7F9FC]">
                      {filteredProducts.map(p => (
                        <tr key={p.id} className="hover:bg-[#F7F9FC] transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#F7F9FC] border border-[#E7ECF3] shrink-0">
                                {p.featured_image_url ? <img src={p.featured_image_url} className="w-full h-full object-cover" /> : <Package className="text-[#E7ECF3] m-auto mt-2" size={16} />}
                              </div>
                              <div>
                                <p className="font-semibold text-sm text-[#0B0F1A]">{p.name}</p>
                                <p className="text-xs text-[#6D7A8B] truncate max-w-[180px]">{p.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4"><CategoryBadge cat={p.category} /></td>
                          <td className="py-3 px-4 font-bold text-sm text-[#FF7A00]">{formatCurrency(p.base_price)}</td>
                          <td className="py-3 px-4 text-sm text-[#6D7A8B]">{p.product_variants?.length || 0}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {p.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button onClick={() => openProductEdit(p)} className="px-3 py-1.5 bg-[#2B4C73] text-white rounded-lg text-xs font-medium hover:bg-[#1E3A5F] transition">Edit</button>
                              <button onClick={() => handleDeleteProduct(p.id)} className="px-3 py-1.5 bg-[#FFF0F0] text-[#E53E3E] border border-[#E53E3E]/20 rounded-lg text-xs hover:bg-[#E53E3E] hover:text-white transition">Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CSR */}
          {activeTab === "csr" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[#0B0F1A]">Gallery</h2>
                  <p className="text-sm text-[#6D7A8B]">{csrEvents.length} total</p>
                </div>
                <button onClick={() => { resetCsrForm(); setShowCSREventForm(true); }}
                  className="px-4 py-2 bg-gradient-to-r from-[#E53E3E] to-[#FF7A00] text-white rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm hover:opacity-90 transition">
                  <Plus size={16} /> Add Event Photos
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {csrEvents.map(event => (
                  <div key={event.id} className="bg-white border border-[#E7ECF3] rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                    {event.main_image_url ? (
                      <div className="h-44 overflow-hidden"><img src={event.main_image_url} alt={event.title} className="w-full h-full object-cover" /></div>
                    ) : (
                      <div className="h-44 bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center"><Heart className="text-green-200" size={40} /></div>
                    )}
                    <div className="p-4">
                      <div className="flex gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-semibold">{getEventTypeLabel(event.event_type)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${event.is_published ? "bg-[#E8F4FD] text-[#2B4C73]" : "bg-[#FFF0F0] text-[#E53E3E]"}`}>{event.is_published ? "Published" : "Draft"}</span>
                      </div>
                      <h3 className="font-bold text-[#0B0F1A] mb-1">{event.title}</h3>
                      <p className="text-xs text-[#6D7A8B] mb-3 line-clamp-2">{event.description}</p>
                      <div className="text-xs text-[#6D7A8B] space-y-1 mb-4">
                        <div className="flex items-center gap-2"><Calendar size={12} />{new Date(event.event_date).toLocaleDateString()}</div>
                        <div className="flex items-center gap-2"><MapPin size={12} />{event.location}</div>
                        <div className="flex items-center gap-2"><ImageIcon size={12} />{event.photos?.length || 0} photos</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openCSREventEdit(event)} className="flex-1 px-3 py-2 bg-[#2B4C73] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:bg-[#1E3A5F] transition"><Edit size={13} /> Edit</button>
                        <button onClick={() => { setSelectedCSREventId(event.id); setCsrPhotoFiles([]); setCsrPhotoPreviews([]); setShowPhotoUploadModal(true); }}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-[#FF7A00] to-[#FF9500] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:opacity-90 transition"><ImageIcon size={13} /> Photos</button>
                        <button onClick={() => handleDeleteCSREvent(event.id)} className="px-3 py-2 bg-[#FFF0F0] text-[#E53E3E] border border-[#E53E3E]/20 rounded-lg text-xs hover:bg-[#E53E3E] hover:text-white transition"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {csrEvents.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4"><Heart className="text-green-300" size={28} /></div>
                  <p className="text-[#6D7A8B] mb-4">No photos added yet</p>
                  <button onClick={() => { resetCsrForm(); setShowCSREventForm(true); }} className="px-5 py-2 bg-gradient-to-r from-[#E53E3E] to-[#FF7A00] text-white rounded-lg text-sm font-medium">Add Event Photos</button>
                </div>
              )}
            </div>
          )}

          {/* OFFICIALS */}
          {activeTab === "officials" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[#0B0F1A]">Officials</h2>
                  <p className="text-sm text-[#6D7A8B]">{officials.length} total</p>
                </div>
                <button onClick={() => { resetOfficialForm(); setShowOfficialForm(true); }}
                  className="px-4 py-2 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm hover:opacity-90 transition">
                  <Plus size={16} /> Add Official
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {officials.map(official => (
                  <div key={official.id} className="bg-white border border-[#E7ECF3] rounded-xl overflow-hidden hover:shadow-md transition-shadow text-center">
                    <div className="h-56 overflow-hidden"><img src={official.image_url} alt={official.name} className="w-full h-full object-cover" /></div>
                    <div className="p-4">
                      <h3 className="font-bold text-[#0B0F1A]">{official.name}</h3>
                      <p className="text-[#2B4C73] font-semibold text-sm mb-3">{official.position}</p>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingOfficial(official); setNewOfficial({ name: official.name, position: official.position, image_url: official.image_url, display_order: official.display_order, is_active: official.is_active }); setOfficialImagePreview(official.image_url); setShowOfficialForm(true); }}
                          className="flex-1 px-3 py-2 bg-[#2B4C73] text-white rounded-lg text-xs font-semibold hover:bg-[#1E3A5F] transition flex items-center justify-center gap-1">
                          <Edit size={13} /> Edit
                        </button>
                        <button onClick={() => handleDeleteOfficial(official.id)}
                          className="px-3 py-2 bg-[#FFF0F0] text-[#E53E3E] border border-[#E53E3E]/20 rounded-lg text-xs hover:bg-[#E53E3E] hover:text-white transition"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {officials.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-[#E8F4FD] rounded-full flex items-center justify-center mx-auto mb-4"><Users className="text-[#2B4C73] opacity-30" size={28} /></div>
                  <p className="text-[#6D7A8B] mb-4">No officials added yet</p>
                  <button onClick={() => { resetOfficialForm(); setShowOfficialForm(true); }} className="px-5 py-2 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white rounded-lg text-sm font-medium">Add First Official</button>
                </div>
              )}
            </div>
          )}

          {/* MESSAGES */}
          {activeTab === "messages" && (
            <div>
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#0B0F1A]">Contact Messages</h2>
                  <p className="text-sm text-[#6D7A8B]">{contactMessages.length} total · {contactMessages.filter(m => m.status === 'unread').length} unread</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6D7A8B]" size={16} />
                  <input type="text" placeholder="Search messages..." value={messageSearch} onChange={e => setMessageSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-[#E7ECF3] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4C73]/30" />
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-[#E7ECF3]">
                <table className="w-full">
                  <thead><tr className="text-left text-xs text-[#6D7A8B] bg-[#F7F9FC] border-b border-[#E7ECF3]">
                    {['Name', 'Subject', 'Email', 'Date', 'Status', 'Actions'].map(h => <th key={h} className="py-3 px-4 font-semibold">{h}</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-[#F7F9FC]">
                    {contactMessages.filter(m => m.name.toLowerCase().includes(messageSearch.toLowerCase()) || m.email.toLowerCase().includes(messageSearch.toLowerCase()) || m.subject.toLowerCase().includes(messageSearch.toLowerCase()))
                      .map(message => (
                        <tr key={message.id} className={`hover:bg-[#F7F9FC] transition-colors ${message.status === 'unread' ? 'bg-[#FFFDF8]' : ''}`}>
                          <td className="py-3 px-4"><p className="font-semibold text-sm text-[#0B0F1A]">{message.name}</p>{message.phone && <p className="text-xs text-[#6D7A8B]">{message.phone}</p>}</td>
                          <td className="py-3 px-4"><p className="font-medium text-sm">{message.subject}</p><p className="text-xs text-[#6D7A8B] truncate max-w-[180px]">{message.message}</p></td>
                          <td className="py-3 px-4 text-sm">{message.email}</td>
                          <td className="py-3 px-4 text-xs text-[#6D7A8B]">{formatDate(message.created_at)}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${message.status === 'unread' ? 'bg-[#FFF4E6] text-[#FF7A00]' : message.status === 'read' ? 'bg-[#E8F4FD] text-[#2B4C73]' : message.status === 'replied' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{message.status}</span>
                          </td>
                          <td className="py-3 px-4">
                            <button onClick={() => { setSelectedMessage(message); setShowMessageModal(true); }}
                              className="px-3 py-1.5 bg-[#2B4C73] text-white rounded-lg text-xs font-medium hover:bg-[#1E3A5F] transition flex items-center gap-1">
                              <Eye size={12} /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {contactMessages.length === 0 && (
                  <div className="text-center py-12">
                    <MessageSquare className="mx-auto text-[#E7ECF3] mb-4" size={40} />
                    <p className="text-[#6D7A8B]">No messages yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════ MODALS ════ */}

      {/* Event Form */}
      {showEventForm && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) resetEventForm(); }}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#0B0F1A]">{editingEvent ? "Edit Event" : "Create Event"}</h3>
                <button onClick={resetEventForm} className="p-2 text-[#6D7A8B] hover:text-[#0B0F1A] hover:bg-[#F7F9FC] rounded-lg"><X size={20} /></button>
              </div>
              <form onSubmit={editingEvent ? handleEditEvent : handleCreateEvent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-[#6D7A8B] mb-1">Event Name *</label><input type="text" required value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00]/30 focus:outline-none" /></div>
                  <div><label className="block text-sm font-medium text-[#6D7A8B] mb-1">Status</label><select value={newEvent.status} onChange={e => setNewEvent({...newEvent, status: e.target.value})} className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00]/30 focus:outline-none"><option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option></select></div>
                  <div><label className="block text-sm font-medium text-[#6D7A8B] mb-1">Event Date</label><input type="datetime-local" value={newEvent.event_date} onChange={e => setNewEvent({...newEvent, event_date: e.target.value})} className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00]/30 focus:outline-none" /></div>
                  <div><label className="block text-sm font-medium text-[#6D7A8B] mb-1">Location</label><input type="text" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00]/30 focus:outline-none" /></div>
                  <div><label className="block text-sm font-medium text-[#6D7A8B] mb-1">Price (Ksh) *</label><input type="number" required value={newEvent.price} onChange={e => setNewEvent({...newEvent, price: e.target.value})} className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00]/30 focus:outline-none" /></div>
                  <div><label className="block text-sm font-medium text-[#6D7A8B] mb-1">Member Discount (Ksh)</label><input type="number" value={newEvent.member_discount} onChange={e => setNewEvent({...newEvent, member_discount: e.target.value})} className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00]/30 focus:outline-none" /></div>
                  <div><label className="block text-sm font-medium text-[#6D7A8B] mb-1">Max Attendees</label><input type="number" value={newEvent.max_attendees} onChange={e => setNewEvent({...newEvent, max_attendees: e.target.value})} className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00]/30 focus:outline-none" /></div>
                  <div><ImageUploadField label="Event Image" preview={eventImagePreview} onFileChange={e => { const f = e.target.files?.[0]; if (f) handleFileChange(f, setEventImageFile, setEventImagePreview); }} onClear={() => { setEventImageFile(null); setEventImagePreview(''); setNewEvent({...newEvent, image_url: ''}); }} /></div>
                </div>
                <div><label className="block text-sm font-medium text-[#6D7A8B] mb-1">Description *</label><textarea required rows={3} value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00]/30 focus:outline-none resize-none" /></div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={creatingEvent || uploadingFiles} className="px-6 py-2 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white rounded-lg hover:opacity-90 flex items-center gap-2 font-medium disabled:opacity-50">
                    {(creatingEvent || uploadingFiles) && <Loader2 className="animate-spin" size={16} />}
                    {creatingEvent || uploadingFiles ? "Saving..." : editingEvent ? "Update Event" : "Create Event"}
                  </button>
                  <button type="button" onClick={resetEventForm} className="px-6 py-2 bg-[#F7F9FC] text-[#6D7A8B] rounded-lg hover:bg-[#E7ECF3] border border-[#E7ECF3]">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PRODUCT FORM MODAL — with variant bug fix
      ═══════════════════════════════════════════════════════════════════════ */}
      {showProductForm && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) resetProductForm(); }}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-[#E7ECF3] px-6 py-4 flex justify-between items-center z-10 rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-[#0B0F1A]">{editingProduct ? `Edit: ${editingProduct.name}` : "New Product"}</h3>
                <p className="text-xs text-[#6D7A8B]">{editingProduct ? "Update product details and variants" : "Fill in the details to create a new product"}</p>
              </div>
              <button onClick={resetProductForm} className="p-2 text-[#6D7A8B] hover:text-[#0B0F1A] hover:bg-[#F7F9FC] rounded-lg"><X size={20} /></button>
            </div>

            <div className="p-6">
              <form onSubmit={editingProduct ? (e) => { e.preventDefault(); handleUpdateProduct(editingProduct.id, { ...newProduct, base_price: parseFloat(newProduct.base_price) }); } : handleCreateProduct} className="space-y-8">

                {/* ── Section 1: Basic Info ── */}
                <div>
                  <h4 className="text-sm font-bold text-[#0B0F1A] uppercase tracking-wide mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-[#2B4C73] text-white rounded-full text-xs flex items-center justify-center font-bold">1</span>
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-[#6D7A8B] mb-1">Product Name *</label><input type="text" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00]/30 focus:outline-none" /></div>
                    <div><label className="block text-sm font-medium text-[#6D7A8B] mb-1">Category *</label><select required value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value as any})} className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00]/30 focus:outline-none">{['tshirt','polo','hoodie','accessory','other'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-[#6D7A8B] mb-1">Base Price (Ksh) *</label><input type="number" required value={newProduct.base_price} onChange={e => setNewProduct({...newProduct, base_price: e.target.value})} className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00]/30 focus:outline-none" /></div>
                    <div className="flex items-center gap-6 pt-6">
                      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={newProduct.is_active} onChange={e => setNewProduct({...newProduct, is_active: e.target.checked})} className="rounded accent-[#2B4C73]" /><span className="text-sm text-[#6D7A8B]">Active</span></label>
                      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={newProduct.is_out_of_stock} onChange={e => setNewProduct({...newProduct, is_out_of_stock: e.target.checked})} className="rounded accent-[#E53E3E]" /><span className="text-sm text-[#6D7A8B]">Out of Stock</span></label>
                    </div>
                    <div className="md:col-span-2"><label className="block text-sm font-medium text-[#6D7A8B] mb-1">Description *</label><textarea required rows={3} value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00]/30 focus:outline-none resize-none" /></div>
                    <div className="md:col-span-2"><ImageUploadField label="Featured Image" preview={productMainImagePreview} onFileChange={e => { const f = e.target.files?.[0]; if (f) handleFileChange(f, setProductMainImage, setProductMainImagePreview); }} onClear={() => { setProductMainImage(null); setProductMainImagePreview(''); setNewProduct({...newProduct, featured_image_url: ''}); }} /></div>
                  </div>
                </div>

                {/* ── Section 2: Variants ── */}
                <div className="border-t border-[#E7ECF3] pt-6">
                  <h4 className="text-sm font-bold text-[#0B0F1A] uppercase tracking-wide mb-1 flex items-center gap-2">
                    <span className="w-6 h-6 bg-[#FF7A00] text-white rounded-full text-xs flex items-center justify-center font-bold">2</span>
                    Variants
                    <span className="px-2 py-0.5 bg-[#FFF4E6] text-[#FF7A00] rounded-full text-xs font-semibold">{newProduct.variants.length} added</span>
                  </h4>
                  <p className="text-xs text-[#6D7A8B] mb-4 ml-8">Each variant is a unique combination of color + size. Add them one at a time.</p>

                  {/* Add variant form */}
                  <div className="bg-[#F7F9FC] rounded-xl border border-[#E7ECF3] p-4 mb-4">
                    <p className="text-xs font-semibold text-[#0B0F1A] mb-3 uppercase tracking-wide">Add New Variant</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div><label className="block text-xs font-medium text-[#6D7A8B] mb-1">Color Name *</label><input value={newVariant.color_name} onChange={e => setNewVariant({...newVariant, color_name: e.target.value})} placeholder="e.g. Coral Pink" className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/30" /></div>
                      <div><label className="block text-xs font-medium text-[#6D7A8B] mb-1">Color Key *</label><input value={newVariant.color_value} onChange={e => setNewVariant({...newVariant, color_value: e.target.value.toLowerCase().replace(/\s+/g,'')})} placeholder="e.g. coral-pink" className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/30" /></div>
                      <div><label className="block text-xs font-medium text-[#6D7A8B] mb-1">Color (pick)</label><input type="color" value={newVariant.color_hex} onChange={e => setNewVariant({...newVariant, color_hex: e.target.value})} className="w-full h-[38px] border border-[#E7ECF3] rounded-lg bg-white cursor-pointer" /></div>
                      <div><label className="block text-xs font-medium text-[#6D7A8B] mb-1">Size *</label><select value={newVariant.size} onChange={e => setNewVariant({...newVariant, size: e.target.value})} className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/30"><option value="">Select size</option>{['S','M','L','XL','XXL','ONE'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                      <div><label className="block text-xs font-medium text-[#6D7A8B] mb-1">SKU *</label><input value={newVariant.sku} onChange={e => setNewVariant({...newVariant, sku: e.target.value})} placeholder="e.g. HOODIE-PINK-M" className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/30" /></div>
                      <div><label className="block text-xs font-medium text-[#6D7A8B] mb-1">Stock Qty</label><input type="number" value={newVariant.stock_quantity} onChange={e => setNewVariant({...newVariant, stock_quantity: e.target.value})} className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/30" /></div>
                      <div><label className="block text-xs font-medium text-[#6D7A8B] mb-1">Price Adj (Ksh)</label><input type="number" value={newVariant.price_adjustment} onChange={e => setNewVariant({...newVariant, price_adjustment: e.target.value})} className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/30" /></div>
                      <div className="flex items-center gap-2 mt-4"><input type="checkbox" id="va_avail" checked={newVariant.is_available} onChange={e => setNewVariant({...newVariant, is_available: e.target.checked})} className="rounded accent-[#2B4C73]" /><label htmlFor="va_avail" className="text-xs text-[#6D7A8B]">Available</label></div>
                    </div>
                    <div className="flex justify-end mt-3">
                      <button type="button" onClick={handleAddVariant}
                        className="px-5 py-2 bg-gradient-to-r from-[#FF7A00] to-[#FF9500] text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition">
                        <Plus size={16} /> Add Variant
                      </button>
                    </div>
                  </div>

                  {/* Variant list */}
                  {newProduct.variants.length > 0 ? (
                    <div className="space-y-2">
                      {newProduct.variants.map((v, idx) => (
                        <div key={v.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white rounded-xl border border-[#E7ECF3]">
                          <span className="text-xs font-bold text-[#6D7A8B] w-5 text-center">{idx + 1}</span>
                          <div className="w-8 h-8 rounded-full border-2 border-white shadow ring-1 ring-[#E7ECF3] shrink-0" style={{ background: v.color_hex }} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-[#0B0F1A]">{v.color_name} — {v.size}</p>
                            <p className="text-xs text-[#6D7A8B]">SKU: {v.sku} · Stock: {v.stock_quantity} · Adj: Ksh {v.price_adjustment}</p>
                          </div>
                          {v.image_url && <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#E7ECF3] shrink-0"><img src={v.image_url} className="w-full h-full object-cover" /></div>}
                          <label className="px-3 py-1.5 bg-[#E8F4FD] text-[#2B4C73] rounded-lg cursor-pointer border border-[#2B4C73]/20 flex items-center gap-1 text-xs font-medium hover:bg-[#2B4C73] hover:text-white transition shrink-0">
                            <Upload size={13} /> Image
                            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleVariantImageChange(v.id, f); }} />
                          </label>
                          <button type="button" onClick={() => removeVariant(v.id)} className="p-1.5 bg-[#FFF0F0] text-[#E53E3E] rounded-lg border border-[#E53E3E]/20 hover:bg-[#E53E3E] hover:text-white transition shrink-0"><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-[#F7F9FC] rounded-xl border-2 border-dashed border-[#E7ECF3]">
                      <Package className="mx-auto text-[#E7ECF3] mb-2" size={32} />
                      <p className="text-sm text-[#6D7A8B]">No variants added yet</p>
                      <p className="text-xs text-[#6D7A8B]">Use the form above to add color/size combinations</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2 border-t border-[#E7ECF3]">
                  <button type="submit" disabled={productLoading}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white rounded-lg hover:opacity-90 flex items-center gap-2 font-semibold disabled:opacity-50">
                    {productLoading && <Loader2 className="animate-spin" size={16} />}
                    {productLoading ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                  </button>
                  <button type="button" onClick={resetProductForm} className="px-6 py-2.5 bg-[#F7F9FC] text-[#6D7A8B] rounded-lg hover:bg-[#E7ECF3] border border-[#E7ECF3] font-medium">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CSR Event Form */}
      {showCSREventForm && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) resetCsrForm(); }}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#0B0F1A]">{editingCSREvent ? "Edit CSR Event" : "Add CSR Event"}</h3>
                <button onClick={resetCsrForm} className="p-2 text-[#6D7A8B] hover:bg-[#F7F9FC] rounded-lg"><X size={20} /></button>
              </div>
              <form onSubmit={editingCSREvent ? handleUpdateCSREvent : handleCreateCSREvent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-[#6D7A8B] mb-1">Event Type *</label><select required value={newCSREvent.event_type} onChange={e => setNewCSREvent({...newCSREvent, event_type: e.target.value as CSREvent['event_type']})} className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00]/30 focus:outline-none"><option value="tree_planting">Tree Planting</option><option value="community_service">Community Service</option><option value="charity_drive">Charity Drive</option><option value="educational">Educational</option><option value="health_campaign">Health Campaign</option><option value="other">Other</option></select></div>
                  <div><label className="block text-sm font-medium text-[#6D7A8B] mb-1">Title *</label><input type="text" required value={newCSREvent.title} onChange={e => setNewCSREvent({...newCSREvent, title: e.target.value})} className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00]/30 focus:outline-none" /></div>
                  <div><label className="block text-sm font-medium text-[#6D7A8B] mb-1">Event Date *</label><input type="date" required value={newCSREvent.event_date} onChange={e => setNewCSREvent({...newCSREvent, event_date: e.target.value})} className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00]/30 focus:outline-none" /></div>
                  <div><label className="block text-sm font-medium text-[#6D7A8B] mb-1">Location *</label><input type="text" required value={newCSREvent.location} onChange={e => setNewCSREvent({...newCSREvent, location: e.target.value})} className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00]/30 focus:outline-none" /></div>
                  <div className="md:col-span-2"><ImageUploadField label="Main Image" preview={csrMainImagePreview} onFileChange={e => { const f = e.target.files?.[0]; if (f) handleFileChange(f, setCsrMainImage, setCsrMainImagePreview); }} onClear={() => { setCsrMainImage(null); setCsrMainImagePreview(''); }} /></div>
                  {!editingCSREvent && (<div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Event Photos (optional)</label>
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#E7ECF3] rounded-lg cursor-pointer hover:border-[#FF7A00] hover:bg-[#FFF4E6] transition">
                      <Upload className="text-[#6D7A8B] mb-1" size={20} /><span className="text-sm text-[#6D7A8B]">Upload multiple photos</span>
                      <input type="file" accept="image/*" multiple onChange={handleCsrPhotoFilesChange} className="hidden" />
                    </label>
                    {csrPhotoPreviews.length > 0 && <div className="flex flex-wrap gap-2 mt-3">{csrPhotoPreviews.map((preview, i) => (<div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#E7ECF3]"><img src={preview} className="w-full h-full object-cover" /><button type="button" onClick={() => { setCsrPhotoFiles(prev => prev.filter((_, idx) => idx !== i)); setCsrPhotoPreviews(prev => prev.filter((_, idx) => idx !== i)); }} className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full"><X size={10} /></button></div>))}</div>}
                  </div>)}
                </div>
                <div><label className="block text-sm font-medium text-[#6D7A8B] mb-1">Description *</label><textarea required rows={4} value={newCSREvent.description} onChange={e => setNewCSREvent({...newCSREvent, description: e.target.value})} className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00]/30 focus:outline-none resize-none" /></div>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={newCSREvent.is_published} onChange={e => setNewCSREvent({...newCSREvent, is_published: e.target.checked})} className="rounded accent-[#2B4C73]" /><span className="text-sm text-[#6D7A8B]">Publish immediately</span></label>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={csrLoading} className="px-6 py-2 bg-gradient-to-r from-[#E53E3E] to-[#FF7A00] text-white rounded-lg hover:opacity-90 flex items-center gap-2 font-medium disabled:opacity-50">{csrLoading && <Loader2 className="animate-spin" size={16} />}{csrLoading ? "Saving..." : editingCSREvent ? "Update Event" : "Create Event"}</button>
                  <button type="button" onClick={resetCsrForm} className="px-6 py-2 bg-[#F7F9FC] text-[#6D7A8B] rounded-lg hover:bg-[#E7ECF3] border border-[#E7ECF3]">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Message modal */}
      {showMessageModal && selectedMessage && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowMessageModal(false); }}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#0B0F1A]">Message Details</h3>
                <button onClick={() => setShowMessageModal(false)} className="p-2 text-[#6D7A8B] hover:bg-[#F7F9FC] rounded-lg"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div className="bg-[#F7F9FC] p-4 rounded-xl border border-[#E7ECF3]">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div><p className="text-xs text-[#6D7A8B]">Name</p><p className="font-semibold">{selectedMessage.name}</p></div>
                    <div><p className="text-xs text-[#6D7A8B]">Date</p><p className="font-semibold">{formatDate(selectedMessage.created_at)}</p></div>
                    <div><p className="text-xs text-[#6D7A8B]">Email</p><a href={`mailto:${selectedMessage.email}`} className="font-semibold text-[#2B4C73] hover:underline">{selectedMessage.email}</a></div>
                    {selectedMessage.phone && <div><p className="text-xs text-[#6D7A8B]">Phone</p><a href={`tel:${selectedMessage.phone}`} className="font-semibold text-[#2B4C73] hover:underline">{selectedMessage.phone}</a></div>}
                  </div>
                  <div className="mb-3"><p className="text-xs text-[#6D7A8B]">Subject</p><p className="font-semibold">{selectedMessage.subject}</p></div>
                  <div><p className="text-xs text-[#6D7A8B] mb-1">Message</p><p className="text-gray-700 whitespace-pre-wrap bg-white p-3 rounded-lg border border-[#E7ECF3] text-sm">{selectedMessage.message}</p></div>
                </div>
                <div className="flex gap-3">
                  <select value={selectedMessage.status}
                    onChange={async e => {
                      const newStatus = e.target.value as ContactMessage['status'];
                      const token = await getSessionToken(); if (!token) return;
                      const res = await fetch(`/api/admin/contact-messages/${selectedMessage.id}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
                      if (res.ok) { setContactMessages(prev => prev.map(m => m.id === selectedMessage.id ? { ...m, status: newStatus } : m)); setSelectedMessage({ ...selectedMessage, status: newStatus }); showSuccessMessage("Success", "Status updated!"); }
                    }}
                    className="px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white text-sm focus:outline-none">
                    <option value="unread">Unread</option>
                    <option value="read">Read</option>
                    <option value="replied">Replied</option>
                    <option value="archived">Archived</option>
                  </select>
                  <button onClick={() => window.location.href = `mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                    className="px-4 py-2 bg-[#2B4C73] text-white rounded-lg hover:bg-[#1E3A5F] flex items-center gap-2 text-sm font-medium transition">
                    <Mail size={15} /> Reply via Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo upload modal */}
      {showPhotoUploadModal && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowPhotoUploadModal(false); }}>
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#0B0F1A]">Upload Event Photos</h3>
                <button onClick={() => { setShowPhotoUploadModal(false); setCsrPhotoFiles([]); setCsrPhotoPreviews([]); }} className="p-2 text-[#6D7A8B] hover:bg-[#F7F9FC] rounded-lg"><X size={20} /></button>
              </div>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#E7ECF3] rounded-xl cursor-pointer hover:border-[#FF7A00] hover:bg-[#FFF4E6] transition mb-4">
                <Upload className="text-[#6D7A8B] mb-2" size={24} /><span className="text-sm text-[#6D7A8B]">Click to select photos</span>
                <input type="file" accept="image/*" multiple onChange={handleCsrPhotoFilesChange} className="hidden" />
              </label>
              {csrPhotoPreviews.length > 0 && <div className="flex flex-wrap gap-2 mb-4">{csrPhotoPreviews.map((preview, i) => (<div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#E7ECF3]"><img src={preview} className="w-full h-full object-cover" /><button onClick={() => { setCsrPhotoFiles(prev => prev.filter((_, idx) => idx !== i)); setCsrPhotoPreviews(prev => prev.filter((_, idx) => idx !== i)); }} className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full"><X size={10} /></button></div>))}</div>}
              <p className="text-sm text-[#6D7A8B] mb-4">{csrPhotoFiles.length} photo(s) selected</p>
              <div className="flex gap-3">
                <button onClick={handleUploadPhotos} disabled={csrLoading || csrPhotoFiles.length === 0}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#FF7A00] to-[#FF9500] text-white rounded-lg hover:opacity-90 flex items-center justify-center gap-2 font-medium disabled:opacity-50">
                  {csrLoading && <Loader2 className="animate-spin" size={16} />}{csrLoading ? "Uploading..." : "Upload Photos"}
                </button>
                <button onClick={() => { setShowPhotoUploadModal(false); setCsrPhotoFiles([]); setCsrPhotoPreviews([]); }} className="px-4 py-2 bg-[#F7F9FC] text-[#6D7A8B] rounded-lg hover:bg-[#E7ECF3] border border-[#E7ECF3]">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Form */}
      {showOfficialForm && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) resetOfficialForm(); }}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#0B0F1A]">{editingOfficial ? "Edit Official" : "Add Official"}</h3>
                <button onClick={resetOfficialForm} className="p-2 text-[#6D7A8B] hover:bg-[#F7F9FC] rounded-lg"><X size={20} /></button>
              </div>
              <form onSubmit={editingOfficial ? handleUpdateOfficial : handleCreateOfficial} className="space-y-4">
                <div><label className="block text-sm font-medium text-[#6D7A8B] mb-1">Name *</label><input type="text" required value={newOfficial.name} onChange={e => setNewOfficial({...newOfficial, name: e.target.value})} className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00]/30 focus:outline-none" /></div>
                <div><label className="block text-sm font-medium text-[#6D7A8B] mb-1">Position *</label><input type="text" required value={newOfficial.position} onChange={e => setNewOfficial({...newOfficial, position: e.target.value})} className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00]/30 focus:outline-none" /></div>
                <div><label className="block text-sm font-medium text-[#6D7A8B] mb-1">Display Order</label><input type="number" value={newOfficial.display_order} onChange={e => setNewOfficial({...newOfficial, display_order: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg focus:ring-2 focus:ring-[#FF7A00]/30 focus:outline-none" /></div>
                <ImageUploadField label="Official Photo" preview={officialImagePreview} onFileChange={e => { const f = e.target.files?.[0]; if (f) handleFileChange(f, setOfficialImageFile, setOfficialImagePreview); }} onClear={() => { setOfficialImageFile(null); setOfficialImagePreview(''); }} />
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={newOfficial.is_active} onChange={e => setNewOfficial({...newOfficial, is_active: e.target.checked})} className="rounded accent-[#2B4C73]" /><span className="text-sm text-[#6D7A8B]">Active (visible on site)</span></label>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={officialLoading} className="px-6 py-2 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white rounded-lg hover:opacity-90 flex items-center gap-2 font-medium disabled:opacity-50">{officialLoading && <Loader2 className="animate-spin" size={16} />}{officialLoading ? "Saving..." : editingOfficial ? "Update Official" : "Add Official"}</button>
                  <button type="button" onClick={resetOfficialForm} className="px-6 py-2 bg-[#F7F9FC] text-[#6D7A8B] rounded-lg hover:bg-[#E7ECF3] border border-[#E7ECF3]">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Status modals */}
      <StatusModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} type="success" title={modalTitle} message={modalMessage} />
      <StatusModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} type="error" title={modalTitle} message={modalMessage} />
      <ConfirmationModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmAction || (async () => {})} title={modalTitle} message={modalMessage} />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        .font-poppins { font-family: 'Poppins', sans-serif; }
      `}</style>

      <Footer />
    </div>
  );
}