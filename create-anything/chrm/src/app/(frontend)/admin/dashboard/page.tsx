"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Users, DollarSign, ShoppingBag, Calendar, CheckCircle, XCircle, Clock,
  Plus, Edit, Heart, Trash2, Eye, Download, Search, Activity,
  UserPlus, Ticket, MapPin, Tag, Image as ImageIcon,
  LogOut, AlertCircle, AlertTriangle, Info, X, Loader2, Upload, MessageSquare, Mail, Package,
  TrendingUp, RefreshCw, Grid, List, Menu, ChevronRight, ChevronLeft
} from "lucide-react";
import { useAuth } from "../../../(backend)/context/auth";
import Footer from "@/app/(frontend)/components/Footer";
import { supabase } from "../../../../app/(backend)/lib/supabase/client";

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
  location?: string; price: number; 
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

type ContactMessage = {
  id: string; name: string; email: string; phone?: string;
  subject: string; message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  user_id?: string; created_at: string; updated_at: string;
};

const BLANK_VARIANT = {
  color_name: '', color_value: '', color_hex: '#1B3A6B',
  size: '', sku: '', price_adjustment: '0', stock_quantity: '0',
  is_available: true, image_url: ''
};

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
    success: 'bg-[#1B3A6B]',
    error: 'bg-red-600',
    warning: 'bg-[#C9A84C]',
    info: 'bg-[#1B3A6B]',
    confirm: 'bg-[#1B3A6B]'
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`bg-white rounded-xl w-full ${sizeClasses[size]} shadow-2xl overflow-hidden`} onClick={e => e.stopPropagation()}>
        <div className={`p-4 ${typeColors[type]} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/10 rounded-lg">{typeIcons[type]}</div>
            <h3 className="text-lg font-serif font-bold text-white">{title}</h3>
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
        <p className="text-[#1B3A6B]/70 text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end pt-4 border-t border-[#1B3A6B]/10">
          <button onClick={onClose} disabled={loading}
            className="px-4 py-2 bg-gray-100 text-[#1B3A6B] rounded-lg hover:bg-gray-200 transition text-sm font-medium disabled:opacity-50">
            {cancelText}
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium flex items-center gap-2 disabled:opacity-50">
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
        <div className={`p-4 rounded-full ${type === 'success' ? 'bg-[#1B3A6B]/10' : type === 'error' ? 'bg-red-50' : type === 'warning' ? 'bg-[#C9A84C]/10' : 'bg-[#1B3A6B]/10'}`}>
          {type === 'success' && <CheckCircle className="text-[#1B3A6B]" size={44} />}
          {type === 'error' && <XCircle className="text-red-600" size={44} />}
          {type === 'warning' && <AlertTriangle className="text-[#C9A84C]" size={44} />}
          {type === 'info' && <Info className="text-[#1B3A6B]" size={44} />}
        </div>
      </div>
      <p className="text-center text-[#1B3A6B]/70 text-sm">{message}</p>
      <div className="flex justify-center pt-2">
        <button onClick={onClose}
          className="px-6 py-2 bg-[#1B3A6B] text-white rounded-lg hover:bg-[#152e55] transition text-sm font-medium">
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
    <label className="block text-sm font-medium text-[#1B3A6B] mb-1">{label}</label>
    {preview ? (
      <div className="relative w-full h-40 rounded-lg overflow-hidden border border-[#1B3A6B]/20 mb-2">
        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        <button type="button" onClick={onClear}
          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-md transition">
          <X size={14} />
        </button>
      </div>
    ) : (
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#1B3A6B]/20 rounded-lg cursor-pointer hover:border-[#C9A84C] hover:bg-[#1B3A6B]/5 transition mb-2">
        <Upload className="text-[#1B3A6B]/50 mb-2" size={24} />
        <span className="text-sm text-[#1B3A6B]/70 font-medium">Click to upload image</span>
        <span className="text-xs text-[#1B3A6B]/40 mt-1">PNG, JPG, WEBP up to 10MB</span>
        <input type="file" accept={accept} onChange={onFileChange} className="hidden" />
      </label>
    )}
  </div>
);

const CategoryBadge = ({ cat }: { cat: string }) => {
  const map: Record<string, string> = {
    tshirt: 'bg-blue-50 text-blue-700 border-blue-200',
    polo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    hoodie: 'bg-amber-50 text-amber-700 border-amber-200',
    accessory: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    other: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${map[cat] || map.other}`}>
      {cat}
    </span>
  );
};

const getSessionToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem('access_token');
  if (stored) return stored;

  try {
    const res = await fetch('/api/auth/session', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        return data.access_token;
      }
    }
  } catch (err) {
    console.error('getSessionToken fallback failed:', err);
  }

  return null;
};

// ─── Main Dashboard Component ────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const fetchedRef = useRef(false);
  const csrSubmittingRef = useRef(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
     max_attendees: '', image_url: '', is_active: true, status: 'upcoming'
  });
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState<string>('');
  const [creatingEvent, setCreatingEvent] = useState(false);

  const [newProduct, setNewProduct] = useState({ ...BLANK_PRODUCT });
  const [newVariant, setNewVariant] = useState({ ...BLANK_VARIANT });
  const [productMainImage, setProductMainImage] = useState<File | null>(null);
  const [productMainImagePreview, setProductMainImagePreview] = useState<string>('');
  const [variantImageFiles, setVariantImageFiles] = useState<Map<string, File>>(new Map());

  const [merchSearch, setMerchSearch] = useState("");
  const [merchCategoryFilter, setMerchCategoryFilter] = useState<string>("all");
  const [merchView, setMerchView] = useState<'grid' | 'list'>('grid');

  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);

  // Bulk SMS State
  const [bulkSmsMessage, setBulkSmsMessage] = useState("");
  const [bulkSmsSending, setBulkSmsSending] = useState(false);
  const [bulkSmsResult, setBulkSmsResult] = useState<null | { total: number; successful: number; failed: number; failedNumbers: string[] }>(null);
  const [bulkSmsError, setBulkSmsError] = useState("");
  const [smsRecipientType, setSmsRecipientType] = useState<'all' | 'specific'>('all');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);

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
  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;
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

  const handleSendBulkSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkSmsMessage.trim()) {
      showErrorMessage("Validation Error", "Please enter a message to send.");
      return;
    }

    if (smsRecipientType === 'specific' && selectedRecipients.length === 0) {
      showErrorMessage("Validation Error", "Please select at least one recipient from the list.");
      return;
    }

    setBulkSmsSending(true);
    setBulkSmsError("");
    setBulkSmsResult(null);

    try {
      const token = await getSessionToken();
      if (!token) throw new Error('Session authentication missing.');

      const response = await fetch('/api/admin/sms/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: bulkSmsMessage.trim(),
          type: smsRecipientType,
          recipientIds: smsRecipientType === 'specific' ? selectedRecipients : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send SMS blast');
      }

      setBulkSmsResult(data);
      setBulkSmsMessage("");
      setSelectedRecipients([]);
      showSuccessMessage("Bulk SMS sended", `Successfully delivered message to ${data.successful} alumni members.`);
    } catch (err: any) {
      setBulkSmsError(err.message || 'Failed to send SMS batch.');
      showErrorMessage("SMS send Failure", err.message || 'Failed to send SMS batch.');
    } finally {
      setBulkSmsSending(false);
    }
  };

  const fetchContactMessages = useCallback(async () => {
    try {
      setMessagesLoading(true);
      const token = await getSessionToken(); if (!token) return;
      const res = await fetch('/api/admin/contact-messages', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setContactMessages(data.messages || []); }
    } catch (err) { console.error('Error fetching messages:', err); }
    finally { setMessagesLoading(false); }
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
      const token = await getSessionToken();
      if (!token) {
        console.warn('No session token available');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const dashboardRes = await fetch('/api/admin/dashboard', { headers });

      if (!dashboardRes.ok) {
        const errBody = await dashboardRes.json().catch(() => ({}));
        console.error('Dashboard API failed:', dashboardRes.status, errBody);
        throw new Error(errBody.error || `Dashboard fetch failed (${dashboardRes.status})`);
      }

      const data = await dashboardRes.json();

      setUsers(data.recentMembers || []);
      setPayments(data.payments || []);
      setOrders(data.orders || []);
      setEvents(data.events || []);
      setStats({
        totalMembers: data.stats?.totalMembers ?? 0,
        activeMembers: data.stats?.activeMembers ?? 0,
        pendingPayments: data.stats?.pendingPayments ?? 0,
        totalRevenue: data.stats?.totalRevenue ?? 0,
        pendingOrders: data.stats?.pendingOrders ?? 0,
        totalEvents: data.stats?.totalEvents ?? 0,
        upcomingEvents: data.stats?.upcomingEvents ?? 0,
        monthlyRevenue: data.stats?.monthlyRevenue ?? 0,
      });

      await Promise.all([fetchProducts(), fetchContactMessages()]);
    } catch (err: any) {
      console.error('Dashboard Sync Error:', err);
      showErrorMessage('Data Sync Failed', err.message || 'Unable to load administrative data.');
    } finally {
      setDataLoading(false);
    }
  }, [fetchProducts, fetchContactMessages]);

  const resetEventForm = () => {
    setNewEvent({ name: '', description: '', event_date: '', location: '', price: '', max_attendees: '', image_url: '', is_active: true, status: 'upcoming' });
    setEventImageFile(null); setEventImagePreview(''); setEditingEvent(null); setShowEventForm(false);
  };

  // ✅ NEW: Safe event edit opener (fixes null .toString() crash)
  const openEventEdit = (event: Event) => {
    setEditingEvent(event);
    setNewEvent({
      name: event.name || '',
      description: event.description || '',
      event_date: event.event_date || '',
      location: event.location || '',
      price: event.price != null ? String(event.price) : '',
      max_attendees: event.max_attendees != null ? String(event.max_attendees) : '',
      image_url: event.image_url || '',
      is_active: event.is_active ?? true,
      status: event.status || 'upcoming',
    });
    setEventImagePreview(event.image_url || '');
    setShowEventForm(true);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault(); setCreatingEvent(true);
    try {
      const token = await getSessionToken(); if (!token) throw new Error('No session');
      let imageUrl = newEvent.image_url;
      if (eventImageFile) { setUploadingFiles(true); imageUrl = await uploadFile(eventImageFile, 'events', `events/${Date.now()}`); setUploadingFiles(false); }
      const res = await fetch('/api/admin/events', {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newEvent, image_url: imageUrl, price: parseFloat(newEvent.price), max_attendees: newEvent.max_attendees ? parseInt(newEvent.max_attendees) : null })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to create event'); }
      resetEventForm(); showSuccessMessage("Success", "Event published successfully!");
      await fetchData();
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
        body: JSON.stringify({ ...newEvent, image_url: imageUrl, price: parseFloat(newEvent.price), max_attendees: newEvent.max_attendees ? parseInt(newEvent.max_attendees) : null })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to update event'); }
      resetEventForm(); showSuccessMessage("Success", "Event updated!");
      await fetchData();
    } catch (err: any) { showErrorMessage("Error", err.message); }
    finally { setCreatingEvent(false); setUploadingFiles(false); }
  };

  const handleDeleteEvent = (eventId: string) => {
    showConfirmation("Deactivate Event", "Are you sure you want to deactivate this event?", async () => {
      const token = await getSessionToken(); if (!token) return;
      const res = await fetch(`/api/admin/events/${eventId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { setEvents(prev => prev.filter(e => e.id !== eventId)); showSuccessMessage("Success", "Event deactivated!"); }
      else { showErrorMessage("Error", "Failed to delete event"); }
    });
  };

  const updatePaymentStatus = (paymentId: string, status: 'confirmed' | 'failed') => {
    showConfirmation(`Mark Payment ${status}`, `Mark this payment record as ${status}?`, async () => {
      const token = await getSessionToken(); if (!token) return;
      const res = await fetch(`/api/admin/payments/${paymentId}`, { method: "PATCH", headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      if (res.ok) { setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status } : p)); showSuccessMessage("Success", `Payment record marked as ${status}!`); }
      else { showErrorMessage("Error", "Failed to update payment status"); }
    });
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const token = await getSessionToken(); if (!token) return;
    const res = await fetch(`/api/admin/orders/${orderId}`, { method: "PATCH", headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (res.ok) { setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o)); showSuccessMessage("Success", `Order status updated to ${status}`); }
    else { showErrorMessage("Error", "Failed to update order status"); }
  };

  const updateUserStatus = (userId: string, status: string) => {
    showConfirmation(`${status === 'active' ? 'Activate' : 'Deactivate'} User`, `Are you sure you want to ${status === 'active' ? 'activate' : 'deactivate'} this member?`, async () => {
      const token = await getSessionToken(); if (!token) return;
      const res = await fetch(`/api/admin/users/${userId}`, { method: "PATCH", headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      if (res.ok) { setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u)); showSuccessMessage("Success", `Member set to ${status}!`); }
      else { showErrorMessage("Error", "Failed to update user status"); }
    });
  };

  const resetProductForm = () => {
    setNewProduct({ ...BLANK_PRODUCT, variants: [], images: [] });
    setNewVariant({ ...BLANK_VARIANT });
    setProductMainImage(null);
    setProductMainImagePreview('');
    setVariantImageFiles(new Map());
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const openProductEdit = (p: Product) => {
    setEditingProduct(p);
    setNewProduct({
      name: p.name, description: p.description, base_price: p.base_price.toString(),
      category: p.category, featured_image_url: p.featured_image_url || '',
      is_active: p.is_active, is_out_of_stock: p.is_out_of_stock,
      variants: p.product_variants ? [...p.product_variants] : [],
      images: p.product_images ? [...p.product_images] : []
    });
    setNewVariant({ ...BLANK_VARIANT });
    setProductMainImagePreview(p.featured_image_url || '');
    setVariantImageFiles(new Map());
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
      if (res.ok) { resetProductForm(); showSuccessMessage("Success", "Product added!"); await fetchProducts(); }
      else { const err = await res.json(); throw new Error(err.error || 'Failed'); }
    } catch (err: any) { showErrorMessage("Error", err.message); }
    finally { setProductLoading(false); }
  };

  const handleUpdateProduct = async (productId: string, updates: Partial<Product>) => {
    const token = await getSessionToken(); if (!token) return;
    const res = await fetch(`/api/admin/merchandise/${productId}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    if (res.ok) { showSuccessMessage("Success", "Product updated!"); fetchProducts(); }
    else { showErrorMessage("Error", "Failed to update product"); }
  };

  const handleDeleteProduct = (productId: string) => {
    showConfirmation("Deactivate Product", "Are you sure you want to deactivate this item?", async () => {
      const token = await getSessionToken(); if (!token) return;
      const res = await fetch(`/api/admin/merchandise/${productId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { showSuccessMessage("Success", "Product deactivated!"); fetchProducts(); }
      else { showErrorMessage("Error", "Failed to deactivate item"); }
    });
  };

  const handleAddVariant = () => {
    if (!newVariant.color_name || !newVariant.color_value || !newVariant.size || !newVariant.sku) {
      showErrorMessage("Validation Error", "Please provide Color Name, Key, Size, and SKU.");
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
    setNewVariant({ ...BLANK_VARIANT });
  };

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
    if (!data.length) { showErrorMessage("Export Error", "No records found to export."); return; }
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
      if (user.role === 'admin') { await fetchData(); return; }

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error || !profile || profile.role !== 'admin') {
          router.push("/member/dashboard");
          return;
        }
        await fetchData();
      } catch (err) {
        router.push("/login");
      }
    };

    checkAndLoad();
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1B3A6B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-[#1B3A6B] text-base font-serif font-semibold">Loading Portal Admin...</div>
        </div>
      </div>
    );
  }
  if (!user) return null;

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "members", label: "Members", icon: Users, badge: null },
    { id: "payments", label: "Payments", icon: DollarSign, badge: stats.pendingPayments },
    { id: "orders", label: "Orders", icon: ShoppingBag, badge: stats.pendingOrders },
    { id: "events", label: "Events", icon: Calendar, badge: null },
    { id: "merchandise", label: "Merchandise", icon: Tag, badge: null },
    { id: "gallery", label: "Gallery", icon: Heart, badge: null },
    { id: "messages", label: "Messages", icon: MessageSquare, badge: contactMessages.filter(m => m.status === 'unread').length },
    { id: "bulk-sms", label: "Bulk SMS", icon: Mail, badge: null },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col font-sans">

      {/* Top Header */}
      <header className="bg-[#1B3A6B] text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-serif font-bold text-white leading-tight">Admin</h1>
              <p className="text-white/60 text-xs hidden sm:block">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={dataLoading}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
              title="Refresh Data"
            >
              <RefreshCw size={18} className={dataLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-[#C9A84C] hover:bg-[#b8973b] text-[#1B3A6B] font-semibold rounded-lg transition flex items-center gap-2 text-xs sm:text-sm"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace with Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 gap-6">

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside
          className={`
            fixed lg:sticky lg:top-24 inset-y-0 left-0 z-50
            bg-white border border-[#1B3A6B]/10 rounded-xl shadow-sm
            transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
            transition-all duration-200 ease-in-out
            flex flex-col p-3
            h-[calc(100vh-2rem)] lg:h-[calc(100vh-8rem)] lg:max-h-[calc(100vh-8rem)]
            ${sidebarCollapsed ? 'w-20 lg:w-20' : 'w-64'}
          `}
        >
          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => setSidebarCollapsed((v) => !v)}
            className="hidden lg:flex items-center justify-center w-full mb-2 p-2 text-[#1B3A6B]/60 hover:bg-[#1B3A6B]/5 rounded-lg transition"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          <div className="space-y-1 flex-1 overflow-y-auto">
            {!sidebarCollapsed && (
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-[#1B3A6B]/50 mb-2">
                Management
              </p>
            )}

            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const hasBadge = tab.badge != null && tab.badge > 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false);
                  }}
                  title={sidebarCollapsed ? tab.label : undefined}
                  className={`
                    w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'}
                    px-3 py-2.5 rounded-lg text-sm font-medium transition relative
                    ${isActive
                      ? 'bg-[#1B3A6B] text-white shadow-sm'
                      : 'text-[#1B3A6B]/70 hover:bg-[#1B3A6B]/5 hover:text-[#1B3A6B]'}
                  `}
                >
                  <div className={`flex items-center ${sidebarCollapsed ? '' : 'gap-3'}`}>
                    <tab.icon
                      size={18}
                      className={isActive ? 'text-[#C9A84C]' : 'text-[#1B3A6B]/60'}
                    />
                    {!sidebarCollapsed && <span>{tab.label}</span>}
                  </div>

                  {!sidebarCollapsed && hasBadge && (
                    <span
                      className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        isActive ? 'bg-[#C9A84C] text-[#1B3A6B]' : 'bg-red-500 text-white'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}

                  {sidebarCollapsed && hasBadge && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Dynamic Content Panel */}
        <main className="flex-1 min-w-0">

          {/* Top Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Members', value: stats.totalMembers, sub: `${stats.activeMembers} active`, icon: Users, color: 'text-[#1B3A6B]', bg: 'bg-[#1B3A6B]/10' },
              { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), sub: `${formatCurrency(stats.monthlyRevenue)} this month`, icon: TrendingUp, color: 'text-[#C9A84C]', bg: 'bg-[#C9A84C]/10' },
              { label: 'Events', value: stats.totalEvents, sub: `${stats.upcomingEvents} upcoming`, icon: Calendar, color: 'text-[#1B3A6B]', bg: 'bg-[#1B3A6B]/10' },
              { label: 'Pending Queue', value: stats.pendingPayments + stats.pendingOrders, sub: `${stats.pendingPayments} payments · ${stats.pendingOrders} orders`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map((s, i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-[#1B3A6B]/10 shadow-sm">
                <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>
                  <s.icon size={18} className={s.color} />
                </div>
                <p className="text-[#1B3A6B]/60 text-xs font-medium">{s.label}</p>
                <p className="text-lg font-serif font-bold text-[#1B3A6B]">{s.value}</p>
                {s.sub && <p className="text-xs text-[#1B3A6B]/50 mt-0.5 truncate">{s.sub}</p>}
              </div>
            ))}
          </div>

          {/* Tab Views */}
          <div className="bg-white rounded-xl border border-[#1B3A6B]/10 shadow-sm p-6">

            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <h2 className="text-lg font-serif font-bold text-[#1B3A6B]">Recent Activity</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Recent Payments */}
                  <div className="bg-[#1B3A6B]/5 rounded-xl p-5 border border-[#1B3A6B]/10">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-serif font-bold text-[#1B3A6B] text-sm flex items-center gap-2">
                        <DollarSign size={16} className="text-[#C9A84C]" />
                        Recent Payments
                      </h3>
                      <button onClick={() => setActiveTab("payments")} className="text-xs text-[#1B3A6B] hover:underline font-medium flex items-center gap-1">
                        View all <ChevronRight size={12} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {payments.slice(0, 5).map(p => (
                        <div key={p.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-[#1B3A6B]/10">
                          <div>
                            <p className="text-[#1B3A6B] font-medium text-sm">{p.description || "Payment"}</p>
                            <p className="text-xs text-[#1B3A6B]/60">{p.profiles?.full_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-serif font-bold text-sm text-[#1B3A6B]">{formatCurrency(p.amount)}</p>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              p.status === "confirmed" ? "bg-emerald-100 text-emerald-800" : p.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                            }`}>{p.status}</span>
                          </div>
                        </div>
                      ))}
                      {payments.length === 0 && <p className="text-xs text-[#1B3A6B]/50 text-center py-4">No payment activity recorded.</p>}
                    </div>
                  </div>

                  {/* Recent Members */}
                  <div className="bg-[#1B3A6B]/5 rounded-xl p-5 border border-[#1B3A6B]/10">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-serif font-bold text-[#1B3A6B] text-sm flex items-center gap-2">
                        <UserPlus size={16} className="text-[#1B3A6B]" />
                        New Registrations
                      </h3>
                      <button onClick={() => setActiveTab("members")} className="text-xs text-[#1B3A6B] hover:underline font-medium flex items-center gap-1">
                        View all <ChevronRight size={12} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {users.slice(0, 5).map(u => (
                        <div key={u.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-[#1B3A6B]/10">
                          <div>
                            <p className="text-[#1B3A6B] font-medium text-sm">{u.full_name}</p>
                            <p className="text-xs text-[#1B3A6B]/60">{u.email}</p>
                          </div>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            u.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"
                          }`}>{u.status}</span>
                        </div>
                      ))}
                      {users.length === 0 && <p className="text-xs text-[#1B3A6B]/50 text-center py-4">No member profiles found.</p>}
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
                    <h2 className="text-lg font-serif font-bold text-[#1B3A6B]">Alumni Directory</h2>
                    <p className="text-xs text-[#1B3A6B]/60">{users.length} registered · {users.filter(u => u.status === 'active').length} active</p>
                  </div>
                  <button onClick={() => exportToCSV(users.map(u => ({ Name: u.full_name, Email: u.email, Phone: u.phone_number || '', 'Membership #': u.membership_number || '', Status: u.status })), 'members')}
                    className="px-3.5 py-2 bg-[#1B3A6B]/10 text-[#1B3A6B] rounded-lg flex items-center gap-2 text-xs font-semibold hover:bg-[#1B3A6B]/20 transition">
                    <Download size={14} /> Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-[#1B3A6B]/10">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1B3A6B]/10 bg-[#1B3A6B]/5 text-[#1B3A6B] text-xs uppercase font-semibold">
                        {['Member', 'Contact', 'Membership', 'Status', 'Actions'].map(h => <th key={h} className="py-3 px-4">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1B3A6B]/10 text-xs text-[#1B3A6B]">
                      {users.map(m => (
                        <tr key={m.id} className="hover:bg-[#1B3A6B]/5 transition-colors">
                          <td className="py-3.5 px-4"><p className="font-semibold text-sm">{m.full_name}</p><p className="text-[#1B3A6B]/60">{m.email}</p></td>
                          <td className="py-3.5 px-4"><p>{m.phone_number || "—"}</p><p className="text-[#1B3A6B]/60">{m.county || "—"}</p></td>
                          <td className="py-3.5 px-4"><p className="font-mono font-bold text-[#C9A84C]">{m.membership_number || "None"}</p><p className="text-[#1B3A6B]/60">{m.course || "—"}</p></td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${m.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{m.status}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex gap-2">
                              <button onClick={() => updateUserStatus(m.id, "active")} disabled={m.status === "active"}
                                className="px-2.5 py-1 bg-[#1B3A6B] text-white rounded text-[11px] font-medium hover:bg-[#152e55] disabled:opacity-40 transition">Activate</button>
                              <button onClick={() => updateUserStatus(m.id, "inactive")} disabled={m.status === "inactive"}
                                className="px-2.5 py-1 bg-red-600 text-white rounded text-[11px] font-medium hover:bg-red-700 disabled:opacity-40 transition">Deactivate</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && <div className="text-center py-8 text-xs text-[#1B3A6B]/50">No members registered.</div>}
                </div>
              </div>
            )}

            {/* PAYMENTS */}
            {activeTab === "payments" && (
              <div>
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                  <div>
                    <h2 className="text-lg font-serif font-bold text-[#1B3A6B]">Transactions</h2>
                    <p className="text-xs text-[#1B3A6B]/60">{payments.length} total · {stats.pendingPayments} pending</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B3A6B]/40" size={14} />
                      <input type="text" placeholder="Search reference..." value={paymentSearch} onChange={e => setPaymentSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 border border-[#1B3A6B]/20 rounded-lg text-xs focus:outline-none focus:border-[#1B3A6B]" />
                    </div>
                    <button onClick={() => exportToCSV(filteredPayments.map(p => ({ User: p.profiles?.full_name, Amount: p.amount, Status: p.status, Type: p.payment_type, Date: p.created_at })), 'payments')}
                      className="px-3 py-1.5 bg-[#1B3A6B]/10 text-[#1B3A6B] rounded-lg flex items-center gap-2 text-xs font-semibold hover:bg-[#1B3A6B]/20 transition">
                      <Download size={14} /> Export
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-xl border border-[#1B3A6B]/10">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1B3A6B]/10 bg-[#1B3A6B]/5 text-[#1B3A6B] text-xs uppercase font-semibold">
                        {['Transaction', 'User', 'Amount', 'Date', 'Status', 'Actions'].map(h => <th key={h} className="py-3 px-4">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1B3A6B]/10 text-xs text-[#1B3A6B]">
                      {filteredPayments.map(p => (
                        <tr key={p.id} className="hover:bg-[#1B3A6B]/5 transition-colors">
                          <td className="py-3.5 px-4"><p className="font-semibold text-sm">{p.description || "Payment"}</p><p className="text-[#1B3A6B]/60 uppercase">{p.payment_type}</p></td>
                          <td className="py-3.5 px-4"><p className="font-medium">{p.profiles?.full_name || "Guest"}</p><p className="text-[#1B3A6B]/60">{p.phone_number}</p></td>
                          <td className="py-3.5 px-4 font-serif font-bold text-sm text-[#1B3A6B]">{formatCurrency(p.amount)}</td>
                          <td className="py-3.5 px-4 text-[#1B3A6B]/60">{formatDate(p.created_at)}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${p.status === "confirmed" ? "bg-emerald-100 text-emerald-800" : p.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>{p.status}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            {p.status === "pending" && (
                              <div className="flex gap-2">
                                <button onClick={() => updatePaymentStatus(p.id, "confirmed")} className="px-2.5 py-1 bg-[#1B3A6B] text-white rounded text-[11px] font-medium hover:bg-[#152e55]">Confirm</button>
                                <button onClick={() => updatePaymentStatus(p.id, "failed")} className="px-2.5 py-1 bg-red-600 text-white rounded text-[11px] font-medium hover:bg-red-700">Reject</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredPayments.length === 0 && <div className="text-center py-8 text-xs text-[#1B3A6B]/50">No payments match your search.</div>}
                </div>
              </div>
            )}

            {/* ORDERS */}
            {activeTab === "orders" && (
              <div>
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                  <div>
                    <h2 className="text-lg font-serif font-bold text-[#1B3A6B]">Merchandise Orders</h2>
                    <p className="text-xs text-[#1B3A6B]/60">{orders.length} total · {stats.pendingOrders} pending fulfillment</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B3A6B]/40" size={14} />
                    <input type="text" placeholder="Search orders..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 border border-[#1B3A6B]/20 rounded-lg text-xs focus:outline-none focus:border-[#1B3A6B]" />
                  </div>
                </div>
                <div className="overflow-x-auto rounded-xl border border-[#1B3A6B]/10">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1B3A6B]/10 bg-[#1B3A6B]/5 text-[#1B3A6B] text-xs uppercase font-semibold">
                        {['Customer', 'Items', 'Total', 'Date', 'Status', 'Update'].map(h => <th key={h} className="py-3 px-4">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1B3A6B]/10 text-xs text-[#1B3A6B]">
                      {filteredOrders.map(o => (
                        <tr key={o.id} className="hover:bg-[#1B3A6B]/5 transition-colors">
                          <td className="py-3.5 px-4"><p className="font-semibold text-sm">{o.customer_name || o.profiles?.full_name}</p><p className="text-[#1B3A6B]/60">{o.customer_email || o.profiles?.email}</p></td>
                          <td className="py-3.5 px-4 font-medium">{o.items?.length || 0} items</td>
                          <td className="py-3.5 px-4 font-serif font-bold text-sm text-[#1B3A6B]">{formatCurrency(o.total)}</td>
                          <td className="py-3.5 px-4 text-[#1B3A6B]/60">{formatDate(o.created_at)}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${o.status === "delivered" ? "bg-emerald-100 text-emerald-800" : o.status === "shipped" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>{o.status}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value as Order['status'])}
                              className="px-2 py-1 border border-[#1B3A6B]/20 rounded text-xs bg-white focus:outline-none">
                              {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredOrders.length === 0 && <div className="text-center py-8 text-xs text-[#1B3A6B]/50">No orders found.</div>}
                </div>
              </div>
            )}

            {/* EVENTS */}
            {activeTab === "events" && (
              <div>
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                  <div>
                    <h2 className="text-lg font-serif font-bold text-[#1B3A6B]">Events</h2>
                    <p className="text-xs text-[#1B3A6B]/60">{events.length} listed · {stats.upcomingEvents} upcoming</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B3A6B]/40" size={14} />
                      <input type="text" placeholder="Search events..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 border border-[#1B3A6B]/20 rounded-lg text-xs focus:outline-none focus:border-[#1B3A6B]" />
                    </div>
                    <button onClick={() => { resetEventForm(); setShowEventForm(true); }}
                      className="px-3.5 py-1.5 bg-[#1B3A6B] text-white rounded-lg flex items-center gap-1.5 text-xs font-semibold hover:bg-[#152e55] transition shadow-sm">
                      <Plus size={14} /> New Event
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredEvents.map(event => (
                    <div key={event.id} className="bg-white border border-[#1B3A6B]/10 rounded-xl overflow-hidden hover:shadow-md transition">
                      {event.image_url ? (
                        <div className="h-36 overflow-hidden"><img src={event.image_url} alt={event.name} className="w-full h-full object-cover" /></div>
                      ) : (
                        <div className="h-36 bg-[#1B3A6B]/5 flex items-center justify-center">
                          <Calendar className="text-[#1B3A6B]/20" size={40} />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-serif font-bold text-[#1B3A6B] text-sm leading-snug">{event.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${event.status === "upcoming" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"}`}>{event.status}</span>
                        </div>
                        <p className="text-xs text-[#1B3A6B]/60 mb-3 line-clamp-2">{event.description}</p>
                        <div className="space-y-1 mb-4 text-xs text-[#1B3A6B]/70">
                          <div className="flex items-center gap-1.5"><Calendar size={12} className="text-[#C9A84C]" />{event.event_date ? new Date(event.event_date).toLocaleDateString() : "TBD"}</div>
                          <div className="flex items-center gap-1.5"><MapPin size={12} className="text-[#C9A84C]" />{event.location || "TBD"}</div>
                          <div className="flex items-center gap-1.5"><Ticket size={12} className="text-[#C9A84C]" />KES {event.price} · {event.current_attendees}/{event.max_attendees || '∞'} booked</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => openEventEdit(event)}
                            className="flex-1 px-3 py-1.5 bg-[#1B3A6B] text-white rounded text-xs font-medium hover:bg-[#152e55] transition flex items-center justify-center gap-1">
                            <Edit size={12} /> Edit
                          </button>
                          <button onClick={() => handleDeleteEvent(event.id)}
                            className="px-2.5 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded text-xs font-medium hover:bg-red-600 hover:text-white transition">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MERCHANDISE */}
            {activeTab === "merchandise" && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-serif font-bold text-[#1B3A6B]">Merchandise Store</h2>
                    <p className="text-xs text-[#1B3A6B]/60">{products.length} products · {products.filter(p => p.is_active).length} active</p>
                  </div>
                  <button onClick={() => { resetProductForm(); setShowProductForm(true); }}
                    className="px-3.5 py-2 bg-[#1B3A6B] text-white rounded-lg flex items-center gap-1.5 text-xs font-semibold hover:bg-[#152e55] transition shadow-sm">
                    <Plus size={14} /> Add Product
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-6 items-stretch sm:items-center">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B3A6B]/40" size={14} />
                    <input type="text" placeholder="Search catalog..." value={merchSearch} onChange={e => setMerchSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border border-[#1B3A6B]/20 rounded-lg text-xs focus:outline-none focus:border-[#1B3A6B]" />
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {['all', 'tshirt', 'polo', 'hoodie', 'accessory', 'other'].map(cat => (
                      <button key={cat} onClick={() => setMerchCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition ${
                          merchCategoryFilter === cat
                            ? 'bg-[#1B3A6B] text-white'
                            : 'bg-[#1B3A6B]/5 text-[#1B3A6B] hover:bg-[#1B3A6B]/10'
                        }`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredProducts.map(p => (
                    <div key={p.id} className="bg-white border border-[#1B3A6B]/10 rounded-xl overflow-hidden hover:shadow-md transition">
                      <div className="relative h-40 bg-[#1B3A6B]/5 overflow-hidden">
                        {p.featured_image_url ? (
                          <img src={p.featured_image_url} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="text-[#1B3A6B]/20" size={36} />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 flex gap-1">
                          <CategoryBadge cat={p.category} />
                          {!p.is_active && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-800 text-white">Inactive</span>}
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="font-serif font-bold text-[#1B3A6B] text-sm truncate">{p.name}</h3>
                        <p className="text-xs text-[#1B3A6B]/60 mb-3 line-clamp-2">{p.description}</p>

                        <div className="flex items-center justify-between mb-3">
                          <span className="text-base font-serif font-bold text-[#1B3A6B]">{formatCurrency(p.base_price)}</span>
                          <span className="text-xs text-[#1B3A6B]/60 bg-[#1B3A6B]/5 px-2 py-0.5 rounded">
                            {p.product_variants?.length || 0} variant(s)
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button onClick={() => openProductEdit(p)}
                            className="flex-1 px-3 py-1.5 bg-[#1B3A6B] text-white rounded text-xs font-semibold hover:bg-[#152e55] transition flex items-center justify-center gap-1">
                            <Edit size={12} /> Edit
                          </button>
                          <button onClick={() => handleDeleteProduct(p.id)}
                            className="px-2.5 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded text-xs font-semibold hover:bg-red-600 hover:text-white transition">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GALLERY */}
            {activeTab === "gallery" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-serif font-bold text-[#1B3A6B]">CSR & Event Gallery</h2>
                    <p className="text-xs text-[#1B3A6B]/60">{csrEvents.length} events published</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {csrEvents.map(event => (
                    <div key={event.id} className="bg-white border border-[#1B3A6B]/10 rounded-xl overflow-hidden hover:shadow-md transition">
                      {event.main_image_url ? (
                        <div className="h-40 overflow-hidden"><img src={event.main_image_url} alt={event.title} className="w-full h-full object-cover" /></div>
                      ) : (
                        <div className="h-40 bg-[#1B3A6B]/5 flex items-center justify-center"><Heart className="text-[#1B3A6B]/20" size={36} /></div>
                      )}
                      <div className="p-4">
                        <div className="flex gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1B3A6B]/10 text-[#1B3A6B]">{getEventTypeLabel(event.event_type)}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${event.is_published ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"}`}>{event.is_published ? "Published" : "Draft"}</span>
                        </div>
                        <h3 className="font-serif font-bold text-[#1B3A6B] text-sm mb-1">{event.title}</h3>
                        <p className="text-xs text-[#1B3A6B]/60 mb-3 line-clamp-2">{event.description}</p>

                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MESSAGES */}
            {activeTab === "messages" && (
              <div>
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                  <div>
                    <h2 className="text-lg font-serif font-bold text-[#1B3A6B]">Inquiries & Feedback</h2>
                    <p className="text-xs text-[#1B3A6B]/60">{contactMessages.length} total · {contactMessages.filter(m => m.status === 'unread').length} unread</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B3A6B]/40" size={14} />
                    <input type="text" placeholder="Search messages..." value={messageSearch} onChange={e => setMessageSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 border border-[#1B3A6B]/20 rounded-lg text-xs focus:outline-none focus:border-[#1B3A6B]" />
                  </div>
                </div>
                <div className="overflow-x-auto rounded-xl border border-[#1B3A6B]/10">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1B3A6B]/10 bg-[#1B3A6B]/5 text-[#1B3A6B] text-xs uppercase font-semibold">
                        {['Sender', 'Subject', 'Email', 'Date', 'Status', 'Actions'].map(h => <th key={h} className="py-3 px-4">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1B3A6B]/10 text-xs text-[#1B3A6B]">
                      {contactMessages.filter(m => m.name.toLowerCase().includes(messageSearch.toLowerCase()) || m.email.toLowerCase().includes(messageSearch.toLowerCase()) || m.subject.toLowerCase().includes(messageSearch.toLowerCase()))
                        .map(message => (
                          <tr key={message.id} className={`hover:bg-[#1B3A6B]/5 transition-colors ${message.status === 'unread' ? 'bg-[#C9A84C]/5 font-semibold' : ''}`}>
                            <td className="py-3.5 px-4"><p className="text-sm">{message.name}</p>{message.phone && <p className="text-[11px] text-[#1B3A6B]/60">{message.phone}</p>}</td>
                            <td className="py-3.5 px-4"><p className="text-sm">{message.subject}</p><p className="text-[11px] text-[#1B3A6B]/60 truncate max-w-[180px]">{message.message}</p></td>
                            <td className="py-3.5 px-4">{message.email}</td>
                            <td className="py-3.5 px-4 text-[#1B3A6B]/60">{formatDate(message.created_at)}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${message.status === 'unread' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'}`}>{message.status}</span>
                            </td>
                            <td className="py-3.5 px-4">
                              <button onClick={() => { setSelectedMessage(message); setShowMessageModal(true); }}
                                className="px-2.5 py-1 bg-[#1B3A6B] text-white rounded text-[11px] font-medium hover:bg-[#152e55] transition flex items-center gap-1">
                                <Eye size={12} /> View
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* BULK SMS */}
            {activeTab === "bulk-sms" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-serif font-bold text-[#1B3A6B]">Bulk SMS Center</h2>
                    <p className="text-xs text-[#1B3A6B]/60">Send notifications directly to members' Mobile Phones</p>
                  </div>
                  <div className="text-xs text-[#1B3A6B]/70 bg-[#1B3A6B]/5 px-3 py-1.5 rounded-lg border border-[#1B3A6B]/10">
                    <span className="font-bold text-[#1B3A6B]">{users.filter(u => u.phone_number).length}</span> members reachable via SMS
                  </div>
                </div>

                <div className="bg-[#1B3A6B]/5 rounded-xl border border-[#1B3A6B]/10 p-6">
                  <form onSubmit={handleSendBulkSMS} className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-[#1B3A6B] uppercase tracking-wider mb-2">
                        Recipient Scope <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#1B3A6B]">
                          <input
                            type="radio"
                            value="all"
                            checked={smsRecipientType === 'all'}
                            onChange={() => setSmsRecipientType('all')}
                            className="accent-[#1B3A6B]"
                          />
                          All Active Members
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#1B3A6B]">
                          <input
                            type="radio"
                            value="specific"
                            checked={smsRecipientType === 'specific'}
                            onChange={() => setSmsRecipientType('specific')}
                            className="accent-[#1B3A6B]"
                          />
                          Select Specific Members
                        </label>
                      </div>
                    </div>

                    {smsRecipientType === 'specific' && (
                      <div>
                        <label className="block text-xs font-semibold text-[#1B3A6B] uppercase tracking-wider mb-2">
                          Select Recipients
                        </label>
                        <div className="bg-white border border-[#1B3A6B]/20 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
                          {users.filter(u => u.phone_number).map(user => (
                            <label key={user.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-[#1B3A6B]/5 rounded px-2 text-xs">
                              <input
                                type="checkbox"
                                checked={selectedRecipients.includes(user.id)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedRecipients(prev => [...prev, user.id]);
                                  else setSelectedRecipients(prev => prev.filter(id => id !== user.id));
                                }}
                                className="accent-[#1B3A6B]"
                              />
                              <span className="font-medium text-[#1B3A6B]">{user.full_name}</span>
                              <span className="text-[#1B3A6B]/50 ml-auto font-mono">{user.phone_number}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-[#1B3A6B] uppercase tracking-wider mb-2">
                        Message Content <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={bulkSmsMessage}
                        onChange={(e) => setBulkSmsMessage(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-[#1B3A6B]/20 rounded-lg text-sm focus:outline-none focus:border-[#1B3A6B] bg-white resize-none"
                        placeholder="Type broadcast message..."
                        required
                      />
                      <div className="flex justify-between mt-1 text-[11px] text-[#1B3A6B]/50">
                        <span>{bulkSmsMessage.length} Characters</span>
                        <span>{bulkSmsMessage.length > 160 ? `${Math.ceil(bulkSmsMessage.length / 160)} SMS Parts` : '1 SMS Part'}</span>
                      </div>
                    </div>

                    {bulkSmsError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 flex items-center gap-2">
                        <AlertCircle size={14} /> {bulkSmsError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={bulkSmsSending || !bulkSmsMessage.trim() || (smsRecipientType === 'specific' && selectedRecipients.length === 0)}
                      className="w-full py-2.5 bg-[#1B3A6B] text-white font-medium rounded-lg hover:bg-[#152e55] transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50"
                    >
                      {bulkSmsSending ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          sending...
                        </>
                      ) : (
                        <>
                          <Mail size={16} />
                          Send
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* ════ MODALS STACK ════ */}

      {/* Event Form Modal */}
      {showEventForm && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b border-[#1B3A6B]/10 pb-4">
                <h3 className="text-lg font-serif font-bold text-[#1B3A6B]">{editingEvent ? "Edit Event" : "Publish Event"}</h3>
                <button onClick={resetEventForm} className="p-1.5 text-[#1B3A6B]/50 hover:bg-[#1B3A6B]/5 rounded-lg"><X size={18} /></button>
              </div>
              <form onSubmit={editingEvent ? handleEditEvent : handleCreateEvent} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block font-medium text-[#1B3A6B] mb-1">Event Name *</label><input type="text" required value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} className="w-full px-3 py-2 border border-[#1B3A6B]/20 rounded-lg" /></div>
                  <div><label className="block font-medium text-[#1B3A6B] mb-1">Status</label><select value={newEvent.status} onChange={e => setNewEvent({...newEvent, status: e.target.value})} className="w-full px-3 py-2 border border-[#1B3A6B]/20 rounded-lg"><option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option></select></div>
                  <div><label className="block font-medium text-[#1B3A6B] mb-1">Event Date</label><input type="datetime-local" value={newEvent.event_date} onChange={e => setNewEvent({...newEvent, event_date: e.target.value})} className="w-full px-3 py-2 border border-[#1B3A6B]/20 rounded-lg" /></div>
                  <div><label className="block font-medium text-[#1B3A6B] mb-1">Location</label><input type="text" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} className="w-full px-3 py-2 border border-[#1B3A6B]/20 rounded-lg" /></div>
                  <div><label className="block font-medium text-[#1B3A6B] mb-1">Price (KES) *</label><input type="number" required value={newEvent.price} onChange={e => setNewEvent({...newEvent, price: e.target.value})} className="w-full px-3 py-2 border border-[#1B3A6B]/20 rounded-lg" /></div>
                  <div><label className="block font-medium text-[#1B3A6B] mb-1">Max Capacity</label><input type="number" value={newEvent.max_attendees} onChange={e => setNewEvent({...newEvent, max_attendees: e.target.value})} className="w-full px-3 py-2 border border-[#1B3A6B]/20 rounded-lg" /></div>
                </div>
                <div><label className="block font-medium text-[#1B3A6B] mb-1">Description *</label><textarea required rows={3} value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full px-3 py-2 border border-[#1B3A6B]/20 rounded-lg resize-none" /></div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={creatingEvent || uploadingFiles} className="px-5 py-2 bg-[#1B3A6B] text-white rounded-lg hover:bg-[#152e55] font-medium flex items-center gap-2">
                    {(creatingEvent || uploadingFiles) && <Loader2 className="animate-spin" size={14} />}
                    {editingEvent ? "Update Event" : "Publish Event"}
                  </button>
                  <button type="button" onClick={resetEventForm} className="px-5 py-2 bg-gray-100 text-[#1B3A6B] rounded-lg border border-[#1B3A6B]/10 font-medium">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Message View Modal */}
      {showMessageModal && selectedMessage && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4 border-b border-[#1B3A6B]/10 pb-3">
                <h3 className="text-base font-serif font-bold text-[#1B3A6B]">Inquiry Details</h3>
                <button onClick={() => setShowMessageModal(false)} className="p-1 text-[#1B3A6B]/50 hover:bg-[#1B3A6B]/5 rounded"><X size={18} /></button>
              </div>
              <div className="space-y-3 text-xs text-[#1B3A6B]">
                <div><p className="text-[#1B3A6B]/50">From:</p><p className="font-semibold text-sm">{selectedMessage.name} ({selectedMessage.email})</p></div>
                <div><p className="text-[#1B3A6B]/50">Subject:</p><p className="font-medium">{selectedMessage.subject}</p></div>
                <div><p className="text-[#1B3A6B]/50">Message</p><p className="bg-[#1B3A6B]/5 p-3 rounded border border-[#1B3A6B]/10 mt-1 whitespace-pre-wrap">{selectedMessage.message}</p></div>
                <div className="pt-2 flex gap-3">
                  <button onClick={() => window.location.href = `mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                    className="px-4 py-2 bg-[#1B3A6B] text-white rounded font-medium flex items-center gap-2">
                    <Mail size={14} /> Reply via Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Modals */}
      <StatusModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} type="success" title={modalTitle} message={modalMessage} />
      <StatusModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} type="error" title={modalTitle} message={modalMessage} />
      <ConfirmationModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmAction || (async () => {})} title={modalTitle} message={modalMessage} />

      <Footer />
    </div>
  );
}