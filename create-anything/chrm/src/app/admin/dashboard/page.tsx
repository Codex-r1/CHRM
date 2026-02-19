"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Users, DollarSign, ShoppingBag, Calendar, CheckCircle, XCircle, Clock,
  Plus, Edit, Heart, Trash2, Eye, Download, Search, Activity,
  UserPlus, Ticket, MapPin, Users as UsersIcon, Tag, Image as ImageIcon,
  Shield, ChevronRight, LogOut, AlertCircle,
  AlertTriangle, Info, X, Loader2, Upload,MessageSquare, Mail
} from "lucide-react";
import { useAuth } from "../../context/auth";
import Footer from "@/app/components/Footer";
import { supabase } from "@/app/lib/supabase/client";

// ─── Type definitions ────────────────────────────────────────────────────────
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
  id: string; product_id: string; color_name: string; color_hex: string;
  size: string; sku: string; price_adjustment: number; stock_quantity: number;
  is_available: boolean; image_url?: string;
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
  id: string;
  name: string;
  position: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
};
type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  user_id?: string;
  created_at: string;
  updated_at: string;
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
      <div className={`bg-white rounded-xl w-full ${sizeClasses[size]} shadow-2xl`}
           onClick={e => e.stopPropagation()}>
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
  isOpen, onClose, onConfirm, title, message,
  confirmText = "Confirm", cancelText = "Cancel", type = 'confirm'
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
        <div className={`p-4 rounded-full ${
          type === 'success' ? 'bg-[#E8F4FD]' : type === 'error' ? 'bg-[#FFF0F0]' :
          type === 'warning' ? 'bg-[#FFF4E6]' : 'bg-[#E8F4FD]'}`}>
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

// ─── Image Upload Component ───────────────────────────────────────────────────
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
        <span className="text-sm text-[#6D7A8B]">Click to upload image</span>
        <span className="text-xs text-[#6D7A8B] mt-1">PNG, JPG, WEBP up to 10MB</span>
        <input type="file" accept={accept} onChange={onFileChange} className="hidden" />
      </label>
    )}
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const fetchedRef = useRef(false);

  // Core state
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

  // Modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  // CSR state
  const [csrEvents, setCSREvents] = useState<CSREvent[]>([]);
  const [showCSREventForm, setShowCSREventForm] = useState(false);
  const [editingCSREvent, setEditingCSREvent] = useState<CSREvent | null>(null);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [selectedCSREventId, setSelectedCSREventId] = useState<string | null>(null);
  const [csrLoading, setCsrLoading] = useState(false);

  // CSR form state
  const [newCSREvent, setNewCSREvent] = useState({
    event_type: 'tree_planting' as CSREvent['event_type'],
    title: '', description: '', event_date: '', location: '',
    main_image_url: '', is_published: true
  });
  const [csrMainImage, setCsrMainImage] = useState<File | null>(null);
  const [csrMainImagePreview, setCsrMainImagePreview] = useState<string>('');
  const [csrPhotoFiles, setCsrPhotoFiles] = useState<File[]>([]);
  const [csrPhotoPreviews, setCsrPhotoPreviews] = useState<string[]>([]);

  // Event form state
  const [newEvent, setNewEvent] = useState({
    name: '', description: '', event_date: '', location: '', price: '',
    member_discount: '5', max_attendees: '', image_url: '', is_active: true, status: 'upcoming'
  });
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState<string>('');
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Product form state
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', base_price: '',
    category: 'tshirt' as 'tshirt' | 'polo' | 'hoodie' | 'accessory' | 'other',
    featured_image_url: '', is_active: true, is_out_of_stock: false,
    variants: [] as ProductVariant[], images: [] as ProductImage[]
  });
  const [newVariant, setNewVariant] = useState({
    color_name: '', color_hex: '#2B4C73', size: '', sku: '',
    price_adjustment: '0', stock_quantity: '0', is_available: true, image_url: ''
  });
  const [productMainImage, setProductMainImage] = useState<File | null>(null);
  const [productMainImagePreview, setProductMainImagePreview] = useState<string>('');
  const [variantImageFiles, setVariantImageFiles] = useState<Map<string, File>>(new Map());

  // Officials state
  const [officials, setOfficials] = useState<Official[]>([]);
  const [showOfficialForm, setShowOfficialForm] = useState(false);
  const [editingOfficial, setEditingOfficial] = useState<Official | null>(null);
  const [officialLoading, setOfficialLoading] = useState(false);
  const [newOfficial, setNewOfficial] = useState({
    name: '',
    position: '',
    image_url: '',
    display_order: 0,
    is_active: true
  });
  const [officialImageFile, setOfficialImageFile] = useState<File | null>(null);
  const [officialImagePreview, setOfficialImagePreview] = useState<string>('');
const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
const [messagesLoading, setMessagesLoading] = useState(false);
const [messageSearch, setMessageSearch] = useState("");
const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
const [showMessageModal, setShowMessageModal] = useState(false);
const [replyText, setReplyText] = useState("");
const [replying, setReplying] = useState(false);
  // ─── Helpers ───────────────────────────────────────────────────────────────
  const getSessionToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  const showSuccessMessage = (title: string, message: string) => {
    setModalTitle(title); setModalMessage(message); setShowSuccessModal(true);
  };
  const showErrorMessage = (title: string, message: string) => {
    setModalTitle(title); setModalMessage(message); setShowErrorModal(true);
  };
  const showConfirmation = (title: string, message: string, action: () => Promise<void>) => {
    setModalTitle(title); setModalMessage(message);
    setConfirmAction(() => action); setShowConfirmModal(true);
  };

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}/${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
      cacheControl: '3600', upsert: false
    });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicUrl;
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  const formatCurrency = (amount: number) => `Ksh ${amount.toLocaleString()}`;

  const getEventTypeLabel = (type: CSREvent['event_type']) => ({
    tree_planting: 'Tree Planting', community_service: 'Community Service',
    charity_drive: 'Charity Drive', educational: 'Educational',
    health_campaign: 'Health Campaign', other: 'Other'
  })[type] || type;

  // ─── Image handlers ────────────────────────────────────────────────────────
  const handleFileChange = (
    file: File,
    setFile: (f: File | null) => void,
    setPreview: (s: string) => void
  ) => {
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

  // ─── Data fetching ─────────────────────────────────────────────────────────
  const fetchOfficials = useCallback(async () => {
    try {
      const token = await getSessionToken();
      if (!token) return;
      const res = await fetch('/api/admin/officials', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOfficials(data.officials || []);
      }
    } catch (err) {
      console.error('Officials fetch error:', err);
    }
  }, []);
const fetchContactMessages = useCallback(async () => {
  try {
    setMessagesLoading(true);
    const token = await getSessionToken();
    if (!token) return;
    const res = await fetch('/api/admin/contact-messages', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setContactMessages(data.messages || []);
    }
  } catch (err) {
    console.error('Error fetching contact messages:', err);
  } finally {
    setMessagesLoading(false);
  }
}, []);
  const fetchCSREvents = useCallback(async () => {
    try {
      const token = await getSessionToken();
      if (!token) return;
      const res = await fetch('/api/admin/csr-events', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCSREvents(data.events || []);
      }
    } catch (err) { console.error('CSR fetch error:', err); }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setProductLoading(true);
      const token = await getSessionToken();
      if (!token) return;
      const res = await fetch('/api/admin/merchandise', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { const data = await res.json(); setProducts(data.products || []); }
    } catch (err) { console.error('Products fetch error:', err); }
    finally { setProductLoading(false); }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setDataLoading(true);
      const token = await getSessionToken();
      if (!token) return;

      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      const [usersRes, paymentsRes, ordersRes, eventsRes] = await Promise.all([
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/payments', { headers }),
        fetch('/api/admin/orders', { headers }),
        fetch('/api/admin/events', { headers })
      ]);

      let fetchedUsers: User[] = [];
      let fetchedPayments: Payment[] = [];
      let fetchedOrders: Order[] = [];
      let fetchedEvents: Event[] = [];

      if (usersRes.ok) { const d = await usersRes.json(); fetchedUsers = d.users || []; setUsers(fetchedUsers); }
      if (paymentsRes.ok) { const d = await paymentsRes.json(); fetchedPayments = d.payments || []; setPayments(fetchedPayments); }
      if (ordersRes.ok) { const d = await ordersRes.json(); fetchedOrders = d.orders || []; setOrders(fetchedOrders); }
      if (eventsRes.ok) { const d = await eventsRes.json(); fetchedEvents = d.events || []; setEvents(fetchedEvents); }

      await Promise.all([fetchProducts(), fetchCSREvents(), fetchOfficials()]);

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
  }, [fetchProducts, fetchCSREvents, fetchOfficials]);

  // ─── Event handlers ────────────────────────────────────────────────────────
  const resetEventForm = () => {
    setNewEvent({ name: '', description: '', event_date: '', location: '', price: '',
      member_discount: '5', max_attendees: '', image_url: '', is_active: true, status: 'upcoming' });
    setEventImageFile(null);
    setEventImagePreview('');
    setEditingEvent(null);
    setShowEventForm(false);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingEvent(true);
    try {
      const token = await getSessionToken();
      if (!token) throw new Error('No session');

      let imageUrl = newEvent.image_url;
      if (eventImageFile) {
        setUploadingFiles(true);
        imageUrl = await uploadFile(eventImageFile, 'events', `events/${Date.now()}`);
        setUploadingFiles(false);
      }

      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newEvent, image_url: imageUrl,
          price: parseFloat(newEvent.price),
          member_discount: parseInt(newEvent.member_discount),
          max_attendees: newEvent.max_attendees ? parseInt(newEvent.max_attendees) : null
        })
      });

      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to create event'); }
      resetEventForm();
      showSuccessMessage("Success", "Event created successfully!");
      const token2 = await getSessionToken();
      const evRes = await fetch('/api/admin/events', { headers: { 'Authorization': `Bearer ${token2}` } });
      if (evRes.ok) { const d = await evRes.json(); setEvents(d.events || []); }
    } catch (err: any) {
      showErrorMessage("Error", err.message || 'Failed to create event');
    } finally { setCreatingEvent(false); setUploadingFiles(false); }
  };

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    setCreatingEvent(true);
    try {
      const token = await getSessionToken();
      if (!token) throw new Error('No session');

      let imageUrl = newEvent.image_url;
      if (eventImageFile) {
        setUploadingFiles(true);
        imageUrl = await uploadFile(eventImageFile, 'events', `events/${Date.now()}`);
        setUploadingFiles(false);
      }

      const res = await fetch(`/api/admin/events/${editingEvent.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newEvent, image_url: imageUrl,
          price: parseFloat(newEvent.price),
          member_discount: parseInt(newEvent.member_discount),
          max_attendees: newEvent.max_attendees ? parseInt(newEvent.max_attendees) : null
        })
      });

      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to update event'); }
      resetEventForm();
      showSuccessMessage("Success", "Event updated successfully!");
      const token2 = await getSessionToken();
      const evRes = await fetch('/api/admin/events', { headers: { 'Authorization': `Bearer ${token2}` } });
      if (evRes.ok) { const d = await evRes.json(); setEvents(d.events || []); }
    } catch (err: any) {
      showErrorMessage("Error", err.message || 'Failed to update event');
    } finally { setCreatingEvent(false); setUploadingFiles(false); }
  };

  const handleDeleteEvent = (eventId: string) => {
    showConfirmation("Delete Event", "Are you sure you want to deactivate this event?", async () => {
      const token = await getSessionToken();
      if (!token) return;
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setEvents(prev => prev.filter(e => e.id !== eventId));
        showSuccessMessage("Success", "Event deactivated successfully!");
      } else { showErrorMessage("Error", "Failed to delete event"); }
    });
  };

  // ─── CSR handlers ──────────────────────────────────────────────────────────
  const resetCsrForm = () => {
    setNewCSREvent({ event_type: 'tree_planting', title: '', description: '',
      event_date: '', location: '', main_image_url: '', is_published: true });
    setCsrMainImage(null); setCsrMainImagePreview('');
    setCsrPhotoFiles([]); setCsrPhotoPreviews([]);
    setShowCSREventForm(false); setEditingCSREvent(null);
  };

  const handleCreateCSREvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCsrLoading(true);
    try {
      const token = await getSessionToken();
      if (!token) throw new Error('No session');

      let mainImageUrl = newCSREvent.main_image_url;
      if (csrMainImage) {
        mainImageUrl = await uploadFile(csrMainImage, 'csr-events', `main/${Date.now()}`);
      }

      const res = await fetch('/api/admin/csr-events', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newCSREvent, main_image_url: mainImageUrl })
      });

      if (!res.ok) throw new Error('Failed to create CSR event');
      const event = await res.json();

      if (csrPhotoFiles.length > 0) {
        const photos = await Promise.all(csrPhotoFiles.map(async (file, i) => ({
          image_url: await uploadFile(file, 'csr-events', `photos/${event.id}`),
          caption: `Photo ${i + 1}`, display_order: i
        })));
        
        const photoRes = await fetch(`/api/admin/csr-events/${event.id}/photos`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ photos })
        });
        
        if (!photoRes.ok) {
          console.error('Failed to upload photos, but event was created');
        }
      }

      resetCsrForm();
      showSuccessMessage("Success", "CSR Event created successfully!");
      await fetchCSREvents();
    } catch (err: any) {
      showErrorMessage("Error", err.message || 'Failed to create CSR event');
    } finally { setCsrLoading(false); }
  };

  const handleUpdateCSREvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCSREvent) return;
    setCsrLoading(true);
    try {
      const token = await getSessionToken();
      if (!token) throw new Error('No session');

      let mainImageUrl = newCSREvent.main_image_url;
      if (csrMainImage) {
        mainImageUrl = await uploadFile(csrMainImage, 'csr-events', `main/${Date.now()}`);
      }

      const res = await fetch(`/api/admin/csr-events/${editingCSREvent.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newCSREvent, main_image_url: mainImageUrl })
      });

      if (!res.ok) throw new Error('Failed to update CSR event');
      resetCsrForm();
      showSuccessMessage("Success", "CSR Event updated successfully!");
      await fetchCSREvents();
    } catch (err: any) {
      showErrorMessage("Error", err.message || 'Failed to update CSR event');
    } finally { setCsrLoading(false); }
  };

  const handleDeleteCSREvent = (eventId: string) => {
    showConfirmation("Delete CSR Event", "Are you sure? This will also delete all associated photos.", async () => {
      const token = await getSessionToken();
      if (!token) return;
      const res = await fetch(`/api/admin/csr-events/${eventId}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCSREvents(prev => prev.filter(e => e.id !== eventId));
        showSuccessMessage("Success", "CSR Event deleted successfully!");
      } else { showErrorMessage("Error", "Failed to delete CSR event"); }
    });
  };

  const openCSREventEdit = (event: CSREvent) => {
    setEditingCSREvent(event);
    setNewCSREvent({
      event_type: event.event_type, title: event.title, description: event.description,
      event_date: event.event_date, location: event.location,
      main_image_url: event.main_image_url || '', is_published: event.is_published
    });
    setCsrMainImagePreview(event.main_image_url || '');
    setShowCSREventForm(true);
  };

  const handleUploadPhotos = async () => {
    if (!selectedCSREventId || csrPhotoFiles.length === 0) {
      showErrorMessage("Validation Error", "Please add at least one photo");
      return;
    }
    setCsrLoading(true);
    try {
      const token = await getSessionToken();
      if (!token) throw new Error('No session');
      
      const photos = await Promise.all(csrPhotoFiles.map(async (file, i) => ({
        image_url: await uploadFile(file, 'csr-events', `photos/${selectedCSREventId}`),
        caption: `Photo ${i + 1}`, 
        display_order: i
      })));
      
      const res = await fetch(`/api/admin/csr-events/${selectedCSREventId}/photos`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos })
      });
      
      if (res.ok) {
        showSuccessMessage("Success", "Photos uploaded successfully!");
        // Clear the files AFTER successful upload
        setCsrPhotoFiles([]);
        setCsrPhotoPreviews([]);
        setShowPhotoUploadModal(false);
        setSelectedCSREventId(null);
        await fetchCSREvents();
      } else { 
        throw new Error('Failed to upload photos'); 
      }
    } catch (err: any) {
      showErrorMessage("Error", err.message || 'Failed to upload photos');
    } finally { 
      setCsrLoading(false); 
    }
  };

  // ─── Official handlers ─────────────────────────────────────────────────────
  const resetOfficialForm = () => {
    setNewOfficial({
      name: '',
      position: '',
      image_url: '',
      display_order: 0,
      is_active: true
    });
    setOfficialImageFile(null);
    setOfficialImagePreview('');
    setEditingOfficial(null);
    setShowOfficialForm(false);
  };

  const handleCreateOfficial = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfficialLoading(true);
    try {
      const token = await getSessionToken();
      if (!token) throw new Error('No session');

      let imageUrl = newOfficial.image_url;
      if (officialImageFile) {
        imageUrl = await uploadFile(officialImageFile, 'officials', `officials/${Date.now()}`);
      }

      const res = await fetch('/api/admin/officials', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newOfficial, image_url: imageUrl })
      });

      if (!res.ok) throw new Error('Failed to create official');
      resetOfficialForm();
      showSuccessMessage("Success", "Official added successfully!");
      await fetchOfficials();
    } catch (err: any) {
      showErrorMessage("Error", err.message);
    } finally {
      setOfficialLoading(false);
    }
  };

  const handleUpdateOfficial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOfficial) return;
    setOfficialLoading(true);
    try {
      const token = await getSessionToken();
      if (!token) throw new Error('No session');

      let imageUrl = newOfficial.image_url;
      if (officialImageFile) {
        imageUrl = await uploadFile(officialImageFile, 'officials', `officials/${Date.now()}`);
      }

      const res = await fetch(`/api/admin/officials/${editingOfficial.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newOfficial, image_url: imageUrl })
      });

      if (!res.ok) throw new Error('Failed to update official');
      resetOfficialForm();
      showSuccessMessage("Success", "Official updated successfully!");
      await fetchOfficials();
    } catch (err: any) {
      showErrorMessage("Error", err.message);
    } finally {
      setOfficialLoading(false);
    }
  };

  const handleDeleteOfficial = (officialId: string) => {
    showConfirmation("Delete Official", "Are you sure you want to delete this official?", async () => {
      const token = await getSessionToken();
      if (!token) return;
      const res = await fetch(`/api/admin/officials/${officialId}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setOfficials(prev => prev.filter(o => o.id !== officialId));
        showSuccessMessage("Success", "Official deleted successfully!");
      } else {
        showErrorMessage("Error", "Failed to delete official");
      }
    });
  };

  // ─── Payment / Order / User handlers ──────────────────────────────────────
  const updatePaymentStatus = (paymentId: string, status: 'confirmed' | 'failed') => {
    showConfirmation(`Mark as ${status}`, `Mark this payment as ${status}?`, async () => {
      const token = await getSessionToken();
      if (!token) return;
      const res = await fetch(`/api/admin/payments/${paymentId}`, {
        method: "PATCH",
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status } : p));
        showSuccessMessage("Success", `Payment marked as ${status}!`);
      } else { showErrorMessage("Error", "Failed to update payment status"); }
    });
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const token = await getSessionToken();
    if (!token) return;
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      showSuccessMessage("Success", `Order updated to ${status}!`);
    } else { showErrorMessage("Error", "Failed to update order status"); }
  };

  const updateUserStatus = (userId: string, status: string) => {
    showConfirmation(`Mark User as ${status}`, `${status === 'active' ? 'Activate' : 'Deactivate'} this user?`, async () => {
      const token = await getSessionToken();
      if (!token) return;
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
        showSuccessMessage("Success", `User ${status}!`);
      } else { showErrorMessage("Error", "Failed to update user status"); }
    });
  };

  // ─── Product handlers ──────────────────────────────────────────────────────
  const resetProductForm = () => {
    setNewProduct({ name: '', description: '', base_price: '', category: 'tshirt',
      featured_image_url: '', is_active: true, is_out_of_stock: false, variants: [], images: [] });
    setProductMainImage(null); setProductMainImagePreview('');
    setVariantImageFiles(new Map()); setShowProductForm(false); setEditingProduct(null);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductLoading(true);
    try {
      const token = await getSessionToken();
      if (!token) throw new Error('No session');
      let mainImageUrl = newProduct.featured_image_url;
      if (productMainImage) mainImageUrl = await uploadFile(productMainImage, 'merchandise', `products/${Date.now()}`);
      const variants = await Promise.all(newProduct.variants.map(async v => {
        let imgUrl = v.image_url;
        const vFile = variantImageFiles.get(v.id);
        if (vFile) imgUrl = await uploadFile(vFile, 'product-variants', `variants/${Date.now()}`);
        return { ...v, price_adjustment: parseFloat(v.price_adjustment.toString()),
          stock_quantity: parseInt(v.stock_quantity.toString()), image_url: imgUrl };
      }));
      const res = await fetch('/api/admin/merchandise', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newProduct, base_price: parseFloat(newProduct.base_price), featured_image_url: mainImageUrl, variants })
      });
      if (res.ok) { resetProductForm(); showSuccessMessage("Success", "Product created!"); await fetchProducts(); }
      else { const err = await res.json(); throw new Error(err.error || 'Failed to create product'); }
    } catch (err: any) { showErrorMessage("Error", err.message); }
    finally { setProductLoading(false); }
  };

  const handleUpdateProduct = async (productId: string, updates: Partial<Product>) => {
    const token = await getSessionToken();
    if (!token) return;
    const res = await fetch(`/api/admin/merchandise/${productId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (res.ok) { showSuccessMessage("Success", "Product updated!"); fetchProducts(); }
    else { showErrorMessage("Error", "Failed to update product"); }
  };

  const handleDeleteProduct = (productId: string) => {
    showConfirmation("Delete Product", "Deactivate this product?", async () => {
      const token = await getSessionToken();
      if (!token) return;
      const res = await fetch(`/api/admin/merchandise/${productId}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { showSuccessMessage("Success", "Product deactivated!"); fetchProducts(); }
      else { showErrorMessage("Error", "Failed to delete product"); }
    });
  };

  const handleAddVariant = () => {
    if (!newVariant.color_name || !newVariant.size || !newVariant.sku) {
      showErrorMessage("Validation Error", "Please fill in all variant fields"); return;
    }
    setNewProduct({ ...newProduct, variants: [...newProduct.variants, {
      id: Date.now().toString(), product_id: '', ...newVariant,
      price_adjustment: parseFloat(newVariant.price_adjustment),
      stock_quantity: parseInt(newVariant.stock_quantity)
    }]});
    setNewVariant({ color_name: '', color_hex: '#2B4C73', size: '', sku: '',
      price_adjustment: '0', stock_quantity: '0', is_available: true, image_url: '' });
  };

  // ─── Filter helpers ────────────────────────────────────────────────────────
  const filteredEvents = events.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredPayments = payments.filter(p => {
    const s = paymentSearch.toLowerCase();
    return p.description?.toLowerCase().includes(s) || p.profiles?.full_name?.toLowerCase().includes(s) ||
      p.phone_number?.includes(paymentSearch) || p.account_reference?.includes(paymentSearch);
  });
  const filteredOrders = orders.filter(o => {
    const s = orderSearch.toLowerCase();
    return o.customer_name?.toLowerCase().includes(s) || o.customer_email?.toLowerCase().includes(s) ||
      o.profiles?.full_name?.toLowerCase().includes(s);
  });

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) { showErrorMessage("Export Error", "No data to export"); return; }
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(row =>
      headers.map(h => { const v = row[h]; if (!v) return ''; const s = String(v);
        return (s.includes(',') || s.includes('"')) ? `"${s.replace(/"/g, '""')}"` : s; }).join(',')
    )].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleLogout = async () => { await logout(); router.push("/"); };

  // ─── Auth effect — runs ONCE ───────────────────────────────────────────────
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

  // ─── Loading ───────────────────────────────────────────────────────────────
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

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F7F9FC] font-poppins flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E7ECF3] sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2B4C73] to-[#FF7A00] rounded-xl flex items-center justify-center shadow-md">
              <Shield className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0B0F1A]">Admin Dashboard</h1>
              <p className="text-[#6D7A8B] text-sm">{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="px-4 py-2 bg-gradient-to-r from-[#E53E3E] to-[#FF7A00] text-white rounded-lg hover:opacity-90 flex items-center gap-2 font-medium">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Members', value: stats.totalMembers, sub: `${stats.activeMembers} active`, icon: Users, bg: '#E8F4FD', color: '#2B4C73' },
            { label: 'Revenue', value: `Ksh ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, bg: '#FFF0F0', color: '#E53E3E' },
            { label: 'Events', value: stats.totalEvents, sub: `${stats.upcomingEvents} upcoming`, icon: Calendar, bg: '#FFF4E6', color: '#FF7A00' },
            { label: 'Pending', value: `Pay: ${stats.pendingPayments} / Orders: ${stats.pendingOrders}`, icon: Clock, bg: '#E8F4FD', color: '#2B4C73' },
          ].map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-[#E7ECF3] shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-lg" style={{ background: s.bg }}>
                  <s.icon size={24} style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-[#6D7A8B] text-sm font-medium">{s.label}</p>
              <p className="text-xl font-bold text-[#0B0F1A] mt-1">{s.value}</p>
              {s.sub && <p className="text-sm text-[#FF7A00]">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "members", label: "Members", icon: Users },
            { id: "payments", label: "Payments", icon: DollarSign },
            { id: "orders", label: "Orders", icon: ShoppingBag },
            { id: "events", label: "Events", icon: Calendar },
            { id: "merchandise", label: "Merchandise", icon: Tag },
            { id: "csr", label: "CSR Events", icon: Heart },
            { id: "officials", label: "Officials", icon: UsersIcon },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 font-medium rounded-lg transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white shadow-md'
                  : 'bg-white text-[#6D7A8B] hover:bg-[#F7F9FC] border border-[#E7ECF3]'}`}>
              <tab.icon size={18} />{tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-[#E7ECF3] p-6 shadow-sm">

          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-[#0B0F1A]">Recent Activity</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#F7F9FC] rounded-xl p-5 border border-[#E7ECF3]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-[#0B0F1A] flex items-center gap-2">
                      <DollarSign size={20} className="text-[#FF7A00]" /> Recent Payments
                    </h3>
                    <button onClick={() => setActiveTab("payments")} className="text-sm text-[#2B4C73] flex items-center gap-1">
                      View all <ChevronRight size={14} />
                    </button>
                  </div>
                  {payments.slice(0, 5).map(p => (
                    <div key={p.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-[#E7ECF3] mb-2">
                      <div><p className="text-[#0B0F1A] font-medium">{p.description || "Payment"}</p>
                        <p className="text-sm text-[#6D7A8B]">{p.profiles?.full_name}</p></div>
                      <div className="text-right">
                        <p className="font-bold">Ksh {p.amount.toLocaleString()}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          p.status === "confirmed" ? "bg-[#E8F4FD] text-[#2B4C73]" :
                          p.status === "pending" ? "bg-[#FFF4E6] text-[#FF7A00]" : "bg-[#FFF0F0] text-[#E53E3E]"}`}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-[#F7F9FC] rounded-xl p-5 border border-[#E7ECF3]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-[#0B0F1A] flex items-center gap-2">
                      <UserPlus size={20} className="text-[#2B4C73]" /> Recent Members
                    </h3>
                    <button onClick={() => setActiveTab("members")} className="text-sm text-[#2B4C73] flex items-center gap-1">
                      View all <ChevronRight size={14} />
                    </button>
                  </div>
                  {users.slice(0, 5).map(u => (
                    <div key={u.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-[#E7ECF3] mb-2">
                      <div><p className="text-[#0B0F1A] font-medium">{u.full_name}</p>
                        <p className="text-sm text-[#6D7A8B]">{u.email}</p></div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        u.status === "active" ? "bg-[#E8F4FD] text-[#2B4C73]" : "bg-[#FFF4E6] text-[#FF7A00]"}`}>
                        {u.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── MEMBERS TAB ── */}
          {activeTab === "members" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#0B0F1A]">Members ({users.length})</h2>
                <button onClick={() => exportToCSV(users.map(u => ({ Name: u.full_name, Email: u.email, Phone: u.phone_number || '', 'Membership #': u.membership_number || '', Status: u.status })), 'members')}
                  className="px-4 py-2 bg-[#E8F4FD] text-[#2B4C73] rounded-lg flex items-center gap-2 border border-[#2B4C73]/20">
                  <Download size={16} /> Export CSV
                </button>
              </div>
              <div className="overflow-x-auto rounded-lg border border-[#E7ECF3]">
                <table className="w-full">
                  <thead><tr className="text-left text-[#6D7A8B] border-b border-[#E7ECF3] bg-[#F7F9FC]">
                    {['Member','Contact','Membership','Status','Actions'].map(h => (
                      <th key={h} className="pb-3 px-4 font-semibold">{h}</th>))}
                  </tr></thead>
                  <tbody>
                    {users.map(m => (
                      <tr key={m.id} className="border-b border-[#F7F9FC] hover:bg-[#F7F9FC]">
                        <td className="py-4 px-4"><p className="font-medium">{m.full_name}</p><p className="text-sm text-[#6D7A8B]">{m.email}</p></td>
                        <td className="py-4 px-4"><p>{m.phone_number || "N/A"}</p><p className="text-sm text-[#6D7A8B]">{m.county || "N/A"}</p></td>
                        <td className="py-4 px-4"><p className="font-mono">{m.membership_number || "None"}</p><p className="text-sm text-[#6D7A8B]">{m.course || "N/A"}</p></td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${m.status === "active" ? "bg-[#E8F4FD] text-[#2B4C73]" : "bg-[#FFF0F0] text-[#E53E3E]"}`}>{m.status}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <button onClick={() => updateUserStatus(m.id, "active")} disabled={m.status === "active"}
                              className="px-3 py-1 bg-[#2B4C73] text-white rounded text-sm hover:bg-[#1E3A5F] disabled:opacity-40">Activate</button>
                            <button onClick={() => updateUserStatus(m.id, "inactive")} disabled={m.status === "inactive"}
                              className="px-3 py-1 bg-[#E53E3E] text-white rounded text-sm hover:bg-[#C53030] disabled:opacity-40">Deactivate</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PAYMENTS TAB ── */}
          {activeTab === "payments" && (
            <div>
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-[#0B0F1A]">Payments ({payments.length})</h2>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6D7A8B]" size={18} />
                    <input type="text" placeholder="Search..." value={paymentSearch} onChange={e => setPaymentSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-[#E7ECF3] rounded-lg bg-white" />
                  </div>
                  <button onClick={() => exportToCSV(filteredPayments.map(p => ({ User: p.profiles?.full_name, Amount: p.amount, Status: p.status, Type: p.payment_type, Date: p.created_at })), 'payments')}
                    className="px-4 py-2 bg-[#E8F4FD] text-[#2B4C73] rounded-lg flex items-center gap-2 border border-[#2B4C73]/20">
                    <Download size={16} /> Export
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg border border-[#E7ECF3]">
                <table className="w-full">
                  <thead><tr className="text-left text-[#6D7A8B] bg-[#F7F9FC] border-b border-[#E7ECF3]">
                    {['Transaction','User','Amount','Date','Status','Actions'].map(h => (
                      <th key={h} className="pb-3 px-4 font-semibold">{h}</th>))}
                  </tr></thead>
                  <tbody>
                    {filteredPayments.map(p => (
                      <tr key={p.id} className="border-b border-[#F7F9FC] hover:bg-[#F7F9FC]">
                        <td className="py-4 px-4"><p className="font-medium">{p.description || "Payment"}</p><p className="text-sm text-[#6D7A8B]">{p.payment_type}</p></td>
                        <td className="py-4 px-4"><p className="font-medium">{p.profiles?.full_name || "N/A"}</p><p className="text-sm text-[#6D7A8B]">{p.phone_number}</p></td>
                        <td className="py-4 px-4"><p className="font-bold">{formatCurrency(p.amount)}</p></td>
                        <td className="py-4 px-4"><p className="text-[#6D7A8B]">{formatDate(p.created_at)}</p></td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            p.status === "confirmed" ? "bg-[#E8F4FD] text-[#2B4C73]" :
                            p.status === "pending" ? "bg-[#FFF4E6] text-[#FF7A00]" : "bg-[#FFF0F0] text-[#E53E3E]"}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {p.status === "pending" && (
                            <div className="flex gap-2">
                              <button onClick={() => updatePaymentStatus(p.id, "confirmed")}
                                className="px-3 py-1 bg-[#2B4C73] text-white rounded text-sm hover:bg-[#1E3A5F]">Confirm</button>
                              <button onClick={() => updatePaymentStatus(p.id, "failed")}
                                className="px-3 py-1 bg-[#E53E3E] text-white rounded text-sm hover:bg-[#C53030]">Reject</button>
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

          {/* ── ORDERS TAB ── */}
          {activeTab === "orders" && (
            <div>
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-[#0B0F1A]">Orders ({orders.length})</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6D7A8B]" size={18} />
                  <input type="text" placeholder="Search..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-[#E7ECF3] rounded-lg bg-white" />
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg border border-[#E7ECF3]">
                <table className="w-full">
                  <thead><tr className="text-left text-[#6D7A8B] bg-[#F7F9FC] border-b border-[#E7ECF3]">
                    {['Customer','Items','Total','Date','Status','Actions'].map(h => (
                      <th key={h} className="pb-3 px-4 font-semibold">{h}</th>))}
                  </tr></thead>
                  <tbody>
                    {filteredOrders.map(o => (
                      <tr key={o.id} className="border-b border-[#F7F9FC] hover:bg-[#F7F9FC]">
                        <td className="py-4 px-4"><p className="font-medium">{o.customer_name || o.profiles?.full_name}</p>
                          <p className="text-sm text-[#6D7A8B]">{o.customer_email || o.profiles?.email}</p></td>
                        <td className="py-4 px-4">{o.items?.length || 0} items</td>
                        <td className="py-4 px-4 font-bold">{formatCurrency(o.total)}</td>
                        <td className="py-4 px-4 text-[#6D7A8B]">{formatDate(o.created_at)}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            o.status === "delivered" ? "bg-[#E8F4FD] text-[#2B4C73]" :
                            o.status === "shipped" ? "bg-[#FFF4E6] text-[#FF7A00]" : "bg-[#FFF0F0] text-[#E53E3E]"}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value as Order['status'])}
                            className="px-2 py-1 border border-[#E7ECF3] rounded text-sm bg-white">
                            {['pending','processing','shipped','delivered','cancelled'].map(s => (
                              <option key={s} value={s}>{s}</option>))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── EVENTS TAB ── */}
          {activeTab === "events" && (
            <div>
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-[#0B0F1A]">Events ({events.length})</h2>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6D7A8B]" size={18} />
                    <input type="text" placeholder="Search events..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-[#E7ECF3] rounded-lg bg-white" />
                  </div>
                  <button onClick={() => { resetEventForm(); setShowEventForm(true); }}
                    className="px-4 py-2 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white rounded-lg flex items-center gap-2">
                    <Plus size={16} /> Create Event
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map(event => (
                  <div key={event.id} className="bg-white border border-[#E7ECF3] rounded-xl overflow-hidden hover:shadow-md transition">
                    {event.image_url && (
                      <div className="h-40 overflow-hidden">
                        <img src={event.image_url} alt={event.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-[#0B0F1A]">{event.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.status === "upcoming" ? "bg-[#E8F4FD] text-[#2B4C73]" : "bg-[#F7F9FC] text-[#6D7A8B]"}`}>
                          {event.status}
                        </span>
                      </div>
                      <p className="text-sm text-[#6D7A8B] mb-3">{event.description?.substring(0, 80)}...</p>
                      <div className="space-y-1 mb-4 text-sm text-[#6D7A8B]">
                        <div className="flex items-center gap-2"><Calendar size={13} />{event.event_date ? formatDate(event.event_date) : "TBD"}</div>
                        <div className="flex items-center gap-2"><MapPin size={13} />{event.location || "TBD"}</div>
                        <div className="flex items-center gap-2"><UsersIcon size={13} />{event.current_attendees} / {event.max_attendees || '∞'}</div>
                        <div className="flex items-center gap-2"><Ticket size={13} />Ksh {event.price} (Members -Ksh {event.member_discount})</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => {
                          setEditingEvent(event);
                          setNewEvent({ name: event.name, description: event.description, event_date: event.event_date || '',
                            location: event.location || '', price: event.price.toString(),
                            member_discount: event.member_discount.toString(),
                            max_attendees: event.max_attendees?.toString() || '',
                            image_url: event.image_url || '', is_active: event.is_active, status: event.status });
                          setEventImagePreview(event.image_url || '');
                          setShowEventForm(true);
                        }} className="flex-1 px-3 py-2 bg-[#2B4C73] text-white rounded text-sm hover:bg-[#1E3A5F]">Edit</button>
                        <button onClick={() => handleDeleteEvent(event.id)}
                          className="px-3 py-2 bg-[#E53E3E] text-white rounded text-sm hover:bg-[#C53030]">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {filteredEvents.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="mx-auto text-[#E7ECF3] mb-4" size={48} />
                  <p className="text-[#6D7A8B]">No events found</p>
                </div>
              )}
            </div>
          )}

          {/* ── MERCHANDISE TAB ── */}
          {activeTab === "merchandise" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#0B0F1A]">Products ({products.length})</h2>
                <button onClick={() => setShowProductForm(true)}
                  className="px-4 py-2 bg-gradient-to-r from-[#FF7A00] to-[#FF9500] text-white rounded-lg flex items-center gap-2">
                  <Plus size={16} /> Add Product
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(p => (
                  <div key={p.id} className="bg-white border border-[#E7ECF3] rounded-xl p-5 hover:shadow-md transition">
                    {p.featured_image_url && (
                      <div className="h-36 rounded-lg overflow-hidden mb-3">
                        <img src={p.featured_image_url} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <h3 className="font-semibold text-[#0B0F1A] mb-1">{p.name}</h3>
                    <p className="text-sm text-[#6D7A8B] mb-3">{p.description?.substring(0, 60)}...</p>
                    <div className="text-sm mb-4">
                      <div className="flex justify-between"><span className="text-[#6D7A8B]">Price:</span><span className="font-bold">{formatCurrency(p.base_price)}</span></div>
                      <div className="flex justify-between"><span className="text-[#6D7A8B]">Category:</span><span>{p.category}</span></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingProduct(p); setNewProduct({ name: p.name, description: p.description, base_price: p.base_price.toString(), category: p.category, featured_image_url: p.featured_image_url || '', is_active: p.is_active, is_out_of_stock: p.is_out_of_stock, variants: p.product_variants || [], images: p.product_images || [] }); setProductMainImagePreview(p.featured_image_url || ''); setShowProductForm(true); }}
                        className="flex-1 px-3 py-2 bg-[#2B4C73] text-white rounded text-sm hover:bg-[#1E3A5F]">Edit</button>
                      <button onClick={() => handleDeleteProduct(p.id)}
                        className="px-3 py-2 bg-[#E53E3E] text-white rounded text-sm hover:bg-[#C53030]">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CSR TAB ── */}
          {activeTab === "csr" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#0B0F1A]">CSR Events ({csrEvents.length})</h2>
                <button onClick={() => { resetCsrForm(); setShowCSREventForm(true); }}
                  className="px-4 py-2 bg-gradient-to-r from-[#E53E3E] to-[#FF7A00] text-white rounded-lg flex items-center gap-2">
                  <Plus size={16} /> Add CSR Event
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {csrEvents.map(event => (
                  <div key={event.id} className="bg-white border border-[#E7ECF3] rounded-xl overflow-hidden hover:shadow-md transition">
                    {event.main_image_url && (
                      <div className="h-48 overflow-hidden"><img src={event.main_image_url} alt={event.title} className="w-full h-full object-cover" /></div>
                    )}
                    <div className="p-5">
                      <div className="flex gap-2 mb-2">
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">{getEventTypeLabel(event.event_type)}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${event.is_published ? "bg-[#E8F4FD] text-[#2B4C73]" : "bg-[#FFF0F0] text-[#E53E3E]"}`}>
                          {event.is_published ? "Published" : "Draft"}
                        </span>
                      </div>
                      <h3 className="font-semibold text-[#0B0F1A] mb-1">{event.title}</h3>
                      <p className="text-sm text-[#6D7A8B] mb-3 line-clamp-2">{event.description}</p>
                      <div className="text-sm text-[#6D7A8B] space-y-1 mb-4">
                        <div className="flex items-center gap-2"><Calendar size={13} />{new Date(event.event_date).toLocaleDateString()}</div>
                        <div className="flex items-center gap-2"><MapPin size={13} />{event.location}</div>
                        <div className="flex items-center gap-2"><ImageIcon size={13} />{event.photos?.length || 0} photos</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openCSREventEdit(event)} className="flex-1 px-3 py-2 bg-[#2B4C73] text-white rounded-lg text-sm flex items-center justify-center gap-1">
                          <Edit size={14} /> Edit
                        </button>
                        <button onClick={() => { setSelectedCSREventId(event.id); setCsrPhotoFiles([]); setCsrPhotoPreviews([]); setShowPhotoUploadModal(true); }}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-[#FF7A00] to-[#FF9500] text-white rounded-lg text-sm flex items-center justify-center gap-1">
                          <ImageIcon size={14} /> Photos
                        </button>
                        <button onClick={() => handleDeleteCSREvent(event.id)}
                          className="px-3 py-2 bg-[#E53E3E] text-white rounded-lg text-sm">
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
                  <p className="text-[#6D7A8B] mb-4">No CSR events yet</p>
                  <button onClick={() => { resetCsrForm(); setShowCSREventForm(true); }}
                    className="px-4 py-2 bg-gradient-to-r from-[#E53E3E] to-[#FF7A00] text-white rounded-lg flex items-center gap-2 mx-auto">
                    <Plus size={16} /> Add First CSR Event
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── OFFICIALS TAB ── */}
          {activeTab === "officials" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#0B0F1A]">Officials ({officials.length})</h2>
                <button onClick={() => { resetOfficialForm(); setShowOfficialForm(true); }}
                  className="px-4 py-2 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white rounded-lg flex items-center gap-2">
                  <Plus size={16} /> Add Official
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {officials.map(official => (
                  <div key={official.id} className="bg-white border border-[#E7ECF3] rounded-xl overflow-hidden hover:shadow-md transition">
                    <div className="h-64 overflow-hidden">
                      <img src={official.image_url} alt={official.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-[#0B0F1A] text-lg">{official.name}</h3>
                      <p className="text-[#2B4C73] font-semibold text-sm mb-3">{official.position}</p>
                      <div className="flex gap-2">
                        <button onClick={() => {
                          setEditingOfficial(official);
                          setNewOfficial({
                            name: official.name,
                            position: official.position,
                            image_url: official.image_url,
                            display_order: official.display_order,
                            is_active: official.is_active
                          });
                          setOfficialImagePreview(official.image_url);
                          setShowOfficialForm(true);
                        }} className="flex-1 px-3 py-2 bg-[#2B4C73] text-white rounded text-sm hover:bg-[#1E3A5F]">
                          <Edit size={14} className="inline mr-1" /> Edit
                        </button>
                        <button onClick={() => handleDeleteOfficial(official.id)}
                          className="px-3 py-2 bg-[#E53E3E] text-white rounded text-sm hover:bg-[#C53030]">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {officials.length === 0 && (
                <div className="text-center py-12">
                  <Users className="mx-auto text-[#E7ECF3] mb-4" size={48} />
                  <p className="text-[#6D7A8B] mb-4">No officials added yet</p>
                  <button onClick={() => { resetOfficialForm(); setShowOfficialForm(true); }}
                    className="px-4 py-2 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white rounded-lg flex items-center gap-2 mx-auto">
                    <Plus size={16} /> Add First Official
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
{/* ── CONTACT MESSAGES TAB ── */}
{activeTab === "messages" && (
  <div>
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-[#0B0F1A]">
        Contact Messages ({contactMessages.filter(m => m.status === 'unread').length} unread)
      </h2>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6D7A8B]" size={18} />
        <input
          type="text"
          placeholder="Search messages..."
          value={messageSearch}
          onChange={e => setMessageSearch(e.target.value)}
          className="pl-10 pr-4 py-2 border border-[#E7ECF3] rounded-lg bg-white"
        />
      </div>
    </div>

    <div className="overflow-x-auto rounded-lg border border-[#E7ECF3]">
      <table className="w-full">
        <thead>
          <tr className="text-left text-[#6D7A8B] bg-[#F7F9FC] border-b border-[#E7ECF3]">
            {['Name', 'Subject', 'Email', 'Date', 'Status', 'Actions'].map(h => (
              <th key={h} className="pb-3 px-4 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {contactMessages
            .filter(m => 
              m.name.toLowerCase().includes(messageSearch.toLowerCase()) ||
              m.email.toLowerCase().includes(messageSearch.toLowerCase()) ||
              m.subject.toLowerCase().includes(messageSearch.toLowerCase())
            )
            .map(message => (
              <tr key={message.id} className="border-b border-[#F7F9FC] hover:bg-[#F7F9FC]">
                <td className="py-4 px-4">
                  <p className="font-medium">{message.name}</p>
                  {message.phone && <p className="text-xs text-[#6D7A8B]">{message.phone}</p>}
                </td>
                <td className="py-4 px-4">
                  <p className="font-medium">{message.subject}</p>
                  <p className="text-xs text-[#6D7A8B] truncate max-w-[200px]">{message.message}</p>
                </td>
                <td className="py-4 px-4">
                  <p className="text-sm">{message.email}</p>
                </td>
                <td className="py-4 px-4">
                  <p className="text-sm text-[#6D7A8B]">{formatDate(message.created_at)}</p>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    message.status === 'unread' ? 'bg-[#FFF4E6] text-[#FF7A00]' :
                    message.status === 'read' ? 'bg-[#E8F4FD] text-[#2B4C73]' :
                    message.status === 'replied' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {message.status}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <button
                    onClick={() => {
                      setSelectedMessage(message);
                      setShowMessageModal(true);
                    }}
                    className="px-3 py-1 bg-[#2B4C73] text-white rounded text-sm hover:bg-[#1E3A5F] flex items-center gap-1"
                  >
                    <Eye size={14} /> View
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>

    {contactMessages.length === 0 && (
      <div className="text-center py-12">
        <MessageSquare className="mx-auto text-[#E7ECF3] mb-4" size={48} />
        <p className="text-[#6D7A8B]">No messages yet</p>
      </div>
    )}
  </div>
)}
      {/* ════════════════════════════════════════════════════════════════════
          ALL MODALS — rendered at root level with z-[200]
      ════════════════════════════════════════════════════════════════════ */}

      {/* ── Event Form Modal ── */}
      {showEventForm && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
             onClick={e => { if (e.target === e.currentTarget) resetEventForm(); }}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
               onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#0B0F1A]">{editingEvent ? "Edit Event" : "Create New Event"}</h3>
                <button onClick={resetEventForm} className="text-[#6D7A8B] hover:text-[#0B0F1A]"><X size={20} /></button>
              </div>
              <form onSubmit={editingEvent ? handleEditEvent : handleCreateEvent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Event Name *</label>
                    <input type="text" required value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})}
                      className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white focus:ring-2 focus:ring-[#FF7A00]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Status</label>
                    <select value={newEvent.status} onChange={e => setNewEvent({...newEvent, status: e.target.value})}
                      className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white focus:ring-2 focus:ring-[#FF7A00]">
                      <option value="upcoming">Upcoming</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Event Date</label>
                    <input type="datetime-local" value={newEvent.event_date} onChange={e => setNewEvent({...newEvent, event_date: e.target.value})}
                      className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white focus:ring-2 focus:ring-[#FF7A00]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Location</label>
                    <input type="text" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                      className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white focus:ring-2 focus:ring-[#FF7A00]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Price (Ksh) *</label>
                    <input type="number" required value={newEvent.price} onChange={e => setNewEvent({...newEvent, price: e.target.value})}
                      className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white focus:ring-2 focus:ring-[#FF7A00]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Member Discount (Ksh)</label>
                    <input type="number" value={newEvent.member_discount} onChange={e => setNewEvent({...newEvent, member_discount: e.target.value})}
                      className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white focus:ring-2 focus:ring-[#FF7A00]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Max Attendees</label>
                    <input type="number" value={newEvent.max_attendees} onChange={e => setNewEvent({...newEvent, max_attendees: e.target.value})}
                      className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white focus:ring-2 focus:ring-[#FF7A00]" />
                  </div>
                  <div className="md:col-span-1">
                    <ImageUploadField
                      label="Event Image"
                      preview={eventImagePreview}
                      onFileChange={e => { const f = e.target.files?.[0]; if (f) handleFileChange(f, setEventImageFile, setEventImagePreview); }}
                      onClear={() => { setEventImageFile(null); setEventImagePreview(''); setNewEvent({...newEvent, image_url: ''}); }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Description *</label>
                  <textarea required rows={4} value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                    className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white focus:ring-2 focus:ring-[#FF7A00]" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" disabled={creatingEvent || uploadingFiles}
                    className="px-6 py-2 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white rounded-lg hover:opacity-90 flex items-center gap-2 disabled:opacity-50">
                    {(creatingEvent || uploadingFiles) && <Loader2 className="animate-spin" size={16} />}
                    {creatingEvent || uploadingFiles ? "Saving..." : editingEvent ? "Update Event" : "Create Event"}
                  </button>
                  <button type="button" onClick={resetEventForm}
                    className="px-6 py-2 bg-[#E7ECF3] text-[#6D7A8B] rounded-lg hover:bg-[#d4dae3]">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── CSR Event Form Modal ── */}
      {showCSREventForm && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
             onClick={e => { if (e.target === e.currentTarget) resetCsrForm(); }}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
               onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#0B0F1A]">{editingCSREvent ? "Edit CSR Event" : "Add CSR Event"}</h3>
                <button onClick={resetCsrForm} className="text-[#6D7A8B] hover:text-[#0B0F1A]"><X size={20} /></button>
              </div>
              <form onSubmit={editingCSREvent ? handleUpdateCSREvent : handleCreateCSREvent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Event Type *</label>
                    <select required value={newCSREvent.event_type} onChange={e => setNewCSREvent({...newCSREvent, event_type: e.target.value as CSREvent['event_type']})}
                      className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white focus:ring-2 focus:ring-[#FF7A00]">
                      <option value="tree_planting">Tree Planting</option>
                      <option value="community_service">Community Service</option>
                      <option value="charity_drive">Charity Drive</option>
                      <option value="educational">Educational</option>
                      <option value="health_campaign">Health Campaign</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Title *</label>
                    <input type="text" required value={newCSREvent.title} onChange={e => setNewCSREvent({...newCSREvent, title: e.target.value})}
                      className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white focus:ring-2 focus:ring-[#FF7A00]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Event Date *</label>
                    <input type="date" required value={newCSREvent.event_date} onChange={e => setNewCSREvent({...newCSREvent, event_date: e.target.value})}
                      className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white focus:ring-2 focus:ring-[#FF7A00]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Location *</label>
                    <input type="text" required value={newCSREvent.location} onChange={e => setNewCSREvent({...newCSREvent, location: e.target.value})}
                      className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white focus:ring-2 focus:ring-[#FF7A00]" />
                  </div>
                  <div className="md:col-span-2">
                    <ImageUploadField
                      label="Main Image"
                      preview={csrMainImagePreview}
                      onFileChange={e => { const f = e.target.files?.[0]; if (f) handleFileChange(f, setCsrMainImage, setCsrMainImagePreview); }}
                      onClear={() => { setCsrMainImage(null); setCsrMainImagePreview(''); }}
                    />
                  </div>
                  {!editingCSREvent && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Event Photos (optional)</label>
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#E7ECF3] rounded-lg cursor-pointer hover:border-[#FF7A00] hover:bg-[#FFF4E6] transition">
                        <Upload className="text-[#6D7A8B] mb-1" size={20} />
                        <span className="text-sm text-[#6D7A8B]">Upload multiple photos</span>
                        <input type="file" accept="image/*" multiple onChange={handleCsrPhotoFilesChange} className="hidden" />
                      </label>
                      {csrPhotoPreviews.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {csrPhotoPreviews.map((preview, i) => (
                            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#E7ECF3]">
                              <img src={preview} alt={`Photo ${i+1}`} className="w-full h-full object-cover" />
                              <button type="button" onClick={() => { setCsrPhotoFiles(prev => prev.filter((_, idx) => idx !== i)); setCsrPhotoPreviews(prev => prev.filter((_, idx) => idx !== i)); }}
                                className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full">
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Description *</label>
                  <textarea required rows={4} value={newCSREvent.description} onChange={e => setNewCSREvent({...newCSREvent, description: e.target.value})}
                    className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white focus:ring-2 focus:ring-[#FF7A00]" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_published" checked={newCSREvent.is_published}
                    onChange={e => setNewCSREvent({...newCSREvent, is_published: e.target.checked})}
                    className="rounded border-[#E7ECF3]" />
                  <label htmlFor="is_published" className="text-sm text-[#6D7A8B]">Publish immediately</label>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" disabled={csrLoading}
                    className="px-6 py-2 bg-gradient-to-r from-[#E53E3E] to-[#FF7A00] text-white rounded-lg hover:opacity-90 flex items-center gap-2 disabled:opacity-50">
                    {csrLoading && <Loader2 className="animate-spin" size={16} />}
                    {csrLoading ? "Saving..." : editingCSREvent ? "Update Event" : "Create Event"}
                  </button>
                  <button type="button" onClick={resetCsrForm}
                    className="px-6 py-2 bg-[#E7ECF3] text-[#6D7A8B] rounded-lg hover:bg-[#d4dae3]">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
{/* ── Message View Modal ── */}
{showMessageModal && selectedMessage && (
  <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
       onClick={e => { if (e.target === e.currentTarget) setShowMessageModal(false); }}>
    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
         onClick={e => e.stopPropagation()}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-[#0B0F1A]">Message Details</h3>
          <button onClick={() => setShowMessageModal(false)} className="text-[#6D7A8B] hover:text-[#0B0F1A]">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-[#F7F9FC] p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-xs text-[#6D7A8B]">Name</p>
                <p className="font-medium">{selectedMessage.name}</p>
              </div>
              <div>
                <p className="text-xs text-[#6D7A8B]">Date</p>
                <p className="font-medium">{formatDate(selectedMessage.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-[#6D7A8B]">Email</p>
                <a href={`mailto:${selectedMessage.email}`} className="font-medium text-[#2B4C73] hover:underline">
                  {selectedMessage.email}
                </a>
              </div>
              {selectedMessage.phone && (
                <div>
                  <p className="text-xs text-[#6D7A8B]">Phone</p>
                  <a href={`tel:${selectedMessage.phone}`} className="font-medium text-[#2B4C73] hover:underline">
                    {selectedMessage.phone}
                  </a>
                </div>
              )}
            </div>
            <div className="mb-3">
              <p className="text-xs text-[#6D7A8B]">Subject</p>
              <p className="font-medium">{selectedMessage.subject}</p>
            </div>
            <div>
              <p className="text-xs text-[#6D7A8B] mb-1">Message</p>
              <p className="text-gray-700 whitespace-pre-wrap bg-white p-3 rounded-lg border border-[#E7ECF3]">
                {selectedMessage.message}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <select
              value={selectedMessage.status}
              onChange={async (e) => {
                const newStatus = e.target.value as ContactMessage['status'];
                const token = await getSessionToken();
                if (!token) return;
                
                const res = await fetch(`/api/admin/contact-messages/${selectedMessage.id}`, {
                  method: 'PATCH',
                  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: newStatus })
                });
                
                if (res.ok) {
                  setContactMessages(prev => prev.map(m => 
                    m.id === selectedMessage.id ? { ...m, status: newStatus } : m
                  ));
                  setSelectedMessage({ ...selectedMessage, status: newStatus });
                  showSuccessMessage("Success", "Status updated!");
                }
              }}
              className="px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white"
            >
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
              <option value="archived">Archived</option>
            </select>

            <button
              onClick={() => window.location.href = `mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
              className="px-4 py-2 bg-[#2B4C73] text-white rounded-lg hover:bg-[#1E3A5F] flex items-center gap-2"
            >
              <Mail size={16} /> Reply via Email
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
      {/* ── Photo Upload Modal ── */}
      {showPhotoUploadModal && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
             onClick={e => { if (e.target === e.currentTarget) setShowPhotoUploadModal(false); }}>
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#0B0F1A]">Upload Photos</h3>
                <button onClick={() => { setShowPhotoUploadModal(false); setCsrPhotoFiles([]); setCsrPhotoPreviews([]); }}
                  className="text-[#6D7A8B] hover:text-[#0B0F1A]"><X size={20} /></button>
              </div>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#E7ECF3] rounded-lg cursor-pointer hover:border-[#FF7A00] hover:bg-[#FFF4E6] transition mb-4">
                <Upload className="text-[#6D7A8B] mb-2" size={24} />
                <span className="text-sm text-[#6D7A8B]">Click to select photos</span>
                <input type="file" accept="image/*" multiple onChange={handleCsrPhotoFilesChange} className="hidden" />
              </label>
              {csrPhotoPreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {csrPhotoPreviews.map((preview, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#E7ECF3]">
                      <img src={preview} alt={`Photo ${i+1}`} className="w-full h-full object-cover" />
                      <button onClick={() => { setCsrPhotoFiles(prev => prev.filter((_, idx) => idx !== i)); setCsrPhotoPreviews(prev => prev.filter((_, idx) => idx !== i)); }}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm text-[#6D7A8B] mb-4">{csrPhotoFiles.length} photo(s) selected</p>
              <div className="flex gap-3">
                <button onClick={handleUploadPhotos} disabled={csrLoading || csrPhotoFiles.length === 0}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#FF7A00] to-[#FF9500] text-white rounded-lg hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50">
                  {csrLoading && <Loader2 className="animate-spin" size={16} />}
                  {csrLoading ? "Uploading..." : "Upload Photos"}
                </button>
                <button onClick={() => { setShowPhotoUploadModal(false); setCsrPhotoFiles([]); setCsrPhotoPreviews([]); }}
                  className="px-4 py-2 bg-[#E7ECF3] text-[#6D7A8B] rounded-lg hover:bg-[#d4dae3]">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Official Form Modal ── */}
      {showOfficialForm && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
             onClick={e => { if (e.target === e.currentTarget) resetOfficialForm(); }}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
               onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#0B0F1A]">{editingOfficial ? "Edit Official" : "Add Official"}</h3>
                <button onClick={resetOfficialForm} className="text-[#6D7A8B] hover:text-[#0B0F1A]"><X size={20} /></button>
              </div>
              <form onSubmit={editingOfficial ? handleUpdateOfficial : handleCreateOfficial} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Name *</label>
                  <input type="text" required value={newOfficial.name} onChange={e => setNewOfficial({...newOfficial, name: e.target.value})}
                    className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white focus:ring-2 focus:ring-[#FF7A00]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Position *</label>
                  <input type="text" required value={newOfficial.position} onChange={e => setNewOfficial({...newOfficial, position: e.target.value})}
                    className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white focus:ring-2 focus:ring-[#FF7A00]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Display Order</label>
                  <input type="number" value={newOfficial.display_order} onChange={e => setNewOfficial({...newOfficial, display_order: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white focus:ring-2 focus:ring-[#FF7A00]" />
                </div>
                <ImageUploadField
                  label="Official Photo *"
                  preview={officialImagePreview}
                  onFileChange={e => { const f = e.target.files?.[0]; if (f) handleFileChange(f, setOfficialImageFile, setOfficialImagePreview); }}
                  onClear={() => { setOfficialImageFile(null); setOfficialImagePreview(''); }}
                />
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="official_active" checked={newOfficial.is_active}
                    onChange={e => setNewOfficial({...newOfficial, is_active: e.target.checked})}
                    className="rounded border-[#E7ECF3]" />
                  <label htmlFor="official_active" className="text-sm text-[#6D7A8B]">Active (visible on site)</label>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" disabled={officialLoading}
                    className="px-6 py-2 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white rounded-lg hover:opacity-90 flex items-center gap-2 disabled:opacity-50">
                    {officialLoading && <Loader2 className="animate-spin" size={16} />}
                    {officialLoading ? "Saving..." : editingOfficial ? "Update Official" : "Add Official"}
                  </button>
                  <button type="button" onClick={resetOfficialForm}
                    className="px-6 py-2 bg-[#E7ECF3] text-[#6D7A8B] rounded-lg hover:bg-[#d4dae3]">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Product Form Modal ── */}
      {showProductForm && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
             onClick={e => { if (e.target === e.currentTarget) resetProductForm(); }}>
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
               onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#0B0F1A]">{editingProduct ? "Edit Product" : "Add Product"}</h3>
                <button onClick={resetProductForm} className="text-[#6D7A8B] hover:text-[#0B0F1A]"><X size={20} /></button>
              </div>
              <form onSubmit={editingProduct ? (e) => { e.preventDefault(); handleUpdateProduct(editingProduct.id, { ...newProduct, base_price: parseFloat(newProduct.base_price) }); } : handleCreateProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Product Name *</label>
                    <input type="text" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                      className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white focus:ring-2 focus:ring-[#FF7A00]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Category *</label>
                    <select required value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value as any})}
                      className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white focus:ring-2 focus:ring-[#FF7A00]">
                      {['tshirt','polo','hoodie','accessory','other'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Base Price (Ksh) *</label>
                    <input type="number" required value={newProduct.base_price} onChange={e => setNewProduct({...newProduct, base_price: e.target.value})}
                      className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white focus:ring-2 focus:ring-[#FF7A00]" />
                  </div>
                  <div>
                    <ImageUploadField
                      label="Product Image"
                      preview={productMainImagePreview}
                      onFileChange={e => { const f = e.target.files?.[0]; if (f) handleFileChange(f, setProductMainImage, setProductMainImagePreview); }}
                      onClear={() => { setProductMainImage(null); setProductMainImagePreview(''); }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#6D7A8B] mb-1">Description *</label>
                  <textarea required rows={3} value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                    className="w-full px-3 py-2 border border-[#E7ECF3] rounded-lg bg-white focus:ring-2 focus:ring-[#FF7A00]" />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={newProduct.is_active} onChange={e => setNewProduct({...newProduct, is_active: e.target.checked})} className="rounded" />
                    <span className="text-sm text-[#6D7A8B]">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={newProduct.is_out_of_stock} onChange={e => setNewProduct({...newProduct, is_out_of_stock: e.target.checked})} className="rounded" />
                    <span className="text-sm text-[#6D7A8B]">Out of Stock</span>
                  </label>
                </div>
                <div className="flex gap-4 pt-4 border-t border-[#E7ECF3]">
                  <button type="submit" disabled={productLoading}
                    className="px-6 py-2 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white rounded-lg hover:opacity-90 flex items-center gap-2 disabled:opacity-50">
                    {productLoading && <Loader2 className="animate-spin" size={16} />}
                    {productLoading ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                  </button>
                  <button type="button" onClick={resetProductForm}
                    className="px-6 py-2 bg-[#E7ECF3] text-[#6D7A8B] rounded-lg hover:bg-[#d4dae3]">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Status Modals */}
      <StatusModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} type="success" title={modalTitle} message={modalMessage} />
      <StatusModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} type="error" title={modalTitle} message={modalMessage} />
      <ConfirmationModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmAction || (async () => {})} title={modalTitle} message={modalMessage} />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        .font-poppins { font-family: 'Poppins', sans-serif; }
      `}</style>

      <Footer />
    </div>
  );
}