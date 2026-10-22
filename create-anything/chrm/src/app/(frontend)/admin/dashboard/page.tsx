"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Users, DollarSign, ShoppingBag, Calendar, CheckCircle, XCircle, Clock,
  Plus, Edit, Trash2, Eye, Download, Search, Activity, UserPlus, Ticket,
  MapPin, Tag, Image as ImageIcon, LogOut, AlertCircle, AlertTriangle,
  Info, X, Loader2, Upload, MessageSquare, Mail, Package, TrendingUp,
  RefreshCw, Menu, ChevronRight, ChevronLeft, LayoutDashboard
} from "lucide-react";
import { useAuth } from "../../../(backend)/context/auth";
import { supabase } from "../../../../app/(backend)/lib/supabase/client";
import SessionWarning from "@/app/(frontend)/components/SessionWarning";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type User = {
  id: string; full_name: string; email: string; membership_number?: string;
  status: string; role: string; phone_number?: string; graduation_year?: number;
  course?: string; county?: string; created_at: string;
};

type Payment = {
  id: string; user_id: string; payment_type: string; amount: number;
  status: 'pending' | 'processing' | 'confirmed' | 'failed';
  account_reference?: string; phone_number?: string; description?: string;
  created_at: string; profiles?: { full_name: string; email: string };
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
  location?: string; price: number; max_attendees?: number;
  current_attendees: number; is_active: boolean; created_at: string;
  image_url?: string; status: string;
};

type Stats = {
  totalMembers: number; activeMembers: number; pendingPayments: number;
  totalRevenue: number; pendingOrders: number; totalEvents: number;
  upcomingEvents: number; monthlyRevenue: number;
};

type Product = {
  id: string; name: string; description: string; base_price: number;
  category: 'tshirt' | 'polo' | 'hoodie' | 'accessory' | 'other';
  is_active: boolean; is_out_of_stock: boolean; featured_image_url?: string;
  product_variants?: ProductVariant[];
};

type ProductVariant = {
  id: string; product_id: string; color_name: string; color_value: string;
  color_hex: string; size: string; sku: string; price_adjustment: number;
  stock_quantity: number; is_available: boolean; image_url?: string;
};

type ContactMessage = {
  id: string; name: string; email: string; phone?: string;
  subject: string; message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  created_at: string;
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
  variants: [] as ProductVariant[]
};

// ─── HELPERS & MODALS ────────────────────────────────────────────────────────
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
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition"><X className="text-white" size={20} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel" }: any) => {
  const [loading, setLoading] = useState(false);
  const handleConfirm = async () => {
    setLoading(true);
    try { await onConfirm(); } finally { setLoading(false); onClose(); }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} type="confirm" size="sm">
      <div className="space-y-4">
        <p className="text-[#1B3A6B]/70 text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end pt-4 border-t border-[#1B3A6B]/10">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-100 text-[#1B3A6B] rounded-lg hover:bg-gray-200 transition text-sm font-medium disabled:opacity-50">{cancelText}</button>
          <button onClick={handleConfirm} disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            {loading && <Loader2 className="animate-spin" size={16} />} {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const StatusModal = ({ isOpen, onClose, type, title, message }: any) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} type={type} size="sm">
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <div className={`p-4 rounded-full ${type === 'success' ? 'bg-[#1B3A6B]/10' : type === 'error' ? 'bg-red-50' : 'bg-[#C9A84C]/10'}`}>
          {type === 'success' && <CheckCircle className="text-[#1B3A6B]" size={44} />}
          {type === 'error' && <XCircle className="text-red-600" size={44} />}
          {type === 'warning' && <AlertTriangle className="text-[#C9A84C]" size={44} />}
        </div>
      </div>
      <p className="text-center text-[#1B3A6B]/70 text-sm">{message}</p>
      <div className="flex justify-center pt-2">
        <button onClick={onClose} className="px-6 py-2 bg-[#1B3A6B] text-white rounded-lg hover:bg-[#152e55] transition text-sm font-medium">Continue</button>
      </div>
    </div>
  </Modal>
);

const ImageUploadField = ({ label, preview, onFileChange, onClear, accept = "image/*" }: any) => (
  <div>
    <label className="block text-sm font-medium text-[#1B3A6B] mb-1">{label}</label>
    {preview ? (
      <div className="relative w-full h-40 rounded-lg overflow-hidden border border-[#1B3A6B]/20 mb-2">
        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        <button type="button" onClick={onClear} className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-md transition"><X size={14} /></button>
      </div>
    ) : (
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#1B3A6B]/20 rounded-lg cursor-pointer hover:border-[#C9A84C] hover:bg-[#1B3A6B]/5 transition mb-2">
        <Upload className="text-[#1B3A6B]/50 mb-2" size={24} />
        <span className="text-sm text-[#1B3A6B]/70 font-medium">Click to upload image</span>
        <input type="file" accept={accept} onChange={onFileChange} className="hidden" />
      </label>
    )}
  </div>
);

const CategoryBadge = ({ cat }: { cat: string }) => {
  const map: Record<string, string> = {
    tshirt: 'bg-blue-50 text-blue-700 border-blue-200', polo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    hoodie: 'bg-amber-50 text-amber-700 border-amber-200', accessory: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    other: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${map[cat] || map.other}`}>{cat}</span>;
};

const getSessionToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('access_token');
  if (stored) return stored;
  try {
    const res = await fetch('/api/auth/session', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      if (data.access_token) { localStorage.setItem('access_token', data.access_token); return data.access_token; }
    }
  } catch (err) { console.error('getSessionToken failed:', err); }
  return null;
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const fetchedRef = useRef(false);

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
  const [stats, setStats] = useState<Stats>({ totalMembers: 0, activeMembers: 0, pendingPayments: 0, totalRevenue: 0, pendingOrders: 0, totalEvents: 0, upcomingEvents: 0, monthlyRevenue: 0 });
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

  const [newEvent, setNewEvent] = useState({ name: '', description: '', event_date: '', location: '', price: '', max_attendees: '', image_url: '', is_active: true, status: 'upcoming' });
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

  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [messageSearch, setMessageSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);

  const [bulkSmsMessage, setBulkSmsMessage] = useState("");
  const [bulkSmsSending, setBulkSmsSending] = useState(false);
  const [bulkSmsError, setBulkSmsError] = useState("");
  const [smsRecipientType, setSmsRecipientType] = useState<'all' | 'specific'>('all');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);

  const showSuccessMessage = (title: string, message: string) => { setModalTitle(title); setModalMessage(message); setShowSuccessModal(true); };
  const showErrorMessage = (title: string, message: string) => { setModalTitle(title); setModalMessage(message); setShowErrorModal(true); };
  const showConfirmation = (title: string, message: string, action: () => Promise<void>) => { setModalTitle(title); setModalMessage(message); setConfirmAction(() => action); setShowConfirmModal(true); };

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}/${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicUrl;
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

  const handleFileChange = (file: File, setFile: (f: File | null) => void, setPreview: (s: string) => void) => {
    setFile(file); const reader = new FileReader(); reader.onloadend = () => setPreview(reader.result as string); reader.readAsDataURL(file);
  };

  const removeVariant = (variantId: string) => {
    setNewProduct(prev => ({ ...prev, variants: prev.variants.filter(v => v.id !== variantId) }));
    setVariantImageFiles(prev => { const next = new Map(prev); next.delete(variantId); return next; });
  };

  const handleVariantImageChange = (variantId: string, file: File) => {
    setVariantImageFiles(prev => { const next = new Map(prev); next.set(variantId, file); return next; });
    const reader = new FileReader();
    reader.onloadend = () => { setNewProduct(prev => ({ ...prev, variants: prev.variants.map(v => v.id === variantId ? { ...v, image_url: reader.result as string } : v) })); };
    reader.readAsDataURL(file);
  };

  const handleSendBulkSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkSmsMessage.trim() || (smsRecipientType === 'specific' && selectedRecipients.length === 0)) return showErrorMessage("Validation Error", "Please fill in all required fields.");
    setBulkSmsSending(true); setBulkSmsError("");
    try {
      const token = await getSessionToken(); if (!token) throw new Error('Session missing.');
      const response = await fetch('/api/admin/sms/bulk', {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: bulkSmsMessage.trim(), type: smsRecipientType, recipientIds: smsRecipientType === 'specific' ? selectedRecipients : undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send SMS blast');
      setBulkSmsMessage(""); setSelectedRecipients([]); showSuccessMessage("Bulk SMS sent", `Delivered to ${data.successful} members.`);
    } catch (err: any) { setBulkSmsError(err.message); showErrorMessage("SMS Failure", err.message); }
    finally { setBulkSmsSending(false); }
  };

  const fetchContactMessages = useCallback(async () => {
    try {
      const token = await getSessionToken(); if (!token) return;
      const res = await fetch('/api/admin/contact-messages', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setContactMessages(data.messages || []); }
    } catch (err) { console.error(err); }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setProductLoading(true);
      const token = await getSessionToken(); if (!token) return;
      const res = await fetch('/api/admin/merchandise', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setProducts(data.products || []); }
    } catch (err) { console.error(err); }
    finally { setProductLoading(false); }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setDataLoading(true);
      const token = await getSessionToken(); if (!token) return;
      const dashboardRes = await fetch('/api/admin/dashboard', { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (!dashboardRes.ok) throw new Error("Dashboard fetch failed");
      const data = await dashboardRes.json();
      setUsers(data.recentMembers || []); setPayments(data.payments || []); setOrders(data.orders || []); setEvents(data.events || []);
      setStats({
        totalMembers: data.stats?.totalMembers ?? 0, activeMembers: data.stats?.activeMembers ?? 0, pendingPayments: data.stats?.pendingPayments ?? 0,
        totalRevenue: data.stats?.totalRevenue ?? 0, pendingOrders: data.stats?.pendingOrders ?? 0, totalEvents: data.stats?.totalEvents ?? 0,
        upcomingEvents: data.stats?.upcomingEvents ?? 0, monthlyRevenue: data.stats?.monthlyRevenue ?? 0,
      });
      await Promise.all([fetchProducts(), fetchContactMessages()]);
    } catch (err: any) { showErrorMessage('Data Sync Failed', err.message); }
    finally { setDataLoading(false); }
  }, [fetchProducts, fetchContactMessages]);

  const resetEventForm = () => { setNewEvent({ name: '', description: '', event_date: '', location: '', price: '', max_attendees: '', image_url: '', is_active: true, status: 'upcoming' }); setEventImageFile(null); setEventImagePreview(''); setEditingEvent(null); setShowEventForm(false); };

  const openEventEdit = (event: Event) => {
    setEditingEvent(event); setNewEvent({ name: event.name || '', description: event.description || '', event_date: event.event_date || '', location: event.location || '', price: event.price != null ? String(event.price) : '', max_attendees: event.max_attendees != null ? String(event.max_attendees) : '', image_url: event.image_url || '', is_active: event.is_active ?? true, status: event.status || 'upcoming' });
    setEventImagePreview(event.image_url || ''); setShowEventForm(true);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault(); setCreatingEvent(true);
    try {
      const token = await getSessionToken(); if (!token) throw new Error('No session');
      let imageUrl = newEvent.image_url;
      if (eventImageFile) { setUploadingFiles(true); imageUrl = await uploadFile(eventImageFile, 'events', `events/${Date.now()}`); setUploadingFiles(false); }
      const res = await fetch('/api/admin/events', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newEvent, image_url: imageUrl, price: parseFloat(newEvent.price), max_attendees: newEvent.max_attendees ? parseInt(newEvent.max_attendees) : null }) });
      if (!res.ok) throw new Error("Failed to create event");
      resetEventForm(); showSuccessMessage("Success", "Event published!"); await fetchData();
    } catch (err: any) { showErrorMessage("Error", err.message); }
    finally { setCreatingEvent(false); setUploadingFiles(false); }
  };

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingEvent) return; setCreatingEvent(true);
    try {
      const token = await getSessionToken(); if (!token) throw new Error('No session');
      let imageUrl = newEvent.image_url;
      if (eventImageFile) { setUploadingFiles(true); imageUrl = await uploadFile(eventImageFile, 'events', `events/${Date.now()}`); setUploadingFiles(false); }
      const res = await fetch(`/api/admin/events/${editingEvent.id}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newEvent, image_url: imageUrl, price: parseFloat(newEvent.price), max_attendees: newEvent.max_attendees ? parseInt(newEvent.max_attendees) : null }) });
      if (!res.ok) throw new Error("Failed to update event");
      resetEventForm(); showSuccessMessage("Success", "Event updated!"); await fetchData();
    } catch (err: any) { showErrorMessage("Error", err.message); }
    finally { setCreatingEvent(false); setUploadingFiles(false); }
  };

  const handleDeleteEvent = (eventId: string) => {
    showConfirmation("Deactivate Event", "Are you sure?", async () => {
      const token = await getSessionToken(); if (!token) return;
      const res = await fetch(`/api/admin/events/${eventId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { setEvents(prev => prev.filter(e => e.id !== eventId)); showSuccessMessage("Success", "Event deactivated!"); }
    });
  };

  const updatePaymentStatus = (paymentId: string, status: 'confirmed' | 'failed') => {
    showConfirmation(`Mark ${status}`, `Proceed?`, async () => {
      const token = await getSessionToken(); if (!token) return;
      const res = await fetch(`/api/admin/payments/${paymentId}`, { method: "PATCH", headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      if (res.ok) { setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status } : p)); showSuccessMessage("Success", `Payment ${status}`); }
    });
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    const token = await getSessionToken(); if (!token) return;
    const res = await fetch(`/api/admin/orders/${orderId}`, { method: "PATCH", headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (res.ok) { setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o)); showSuccessMessage("Success", `Order ${status}`); }
  };

  const updateUserStatus = (userId: string, status: string) => {
    showConfirmation(`${status === 'active' ? 'Activate' : 'Deactivate'}`, `Proceed?`, async () => {
      const token = await getSessionToken(); if (!token) return;
      const res = await fetch(`/api/admin/users/${userId}`, { method: "PATCH", headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      if (res.ok) { setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u)); showSuccessMessage("Success", `User ${status}`); }
    });
  };

  const resetProductForm = () => {
    setNewProduct({ ...BLANK_PRODUCT, variants: [] }); setNewVariant({ ...BLANK_VARIANT });
    setProductMainImage(null); setProductMainImagePreview(''); setVariantImageFiles(new Map()); setShowProductForm(false); setEditingProduct(null);
  };

  const openProductEdit = (p: Product) => {
    setEditingProduct(p);
    setNewProduct({ name: p.name, description: p.description, base_price: p.base_price.toString(), category: p.category, featured_image_url: p.featured_image_url || '', is_active: p.is_active, is_out_of_stock: p.is_out_of_stock, variants: p.product_variants ? [...p.product_variants] : [] });
    setNewVariant({ ...BLANK_VARIANT }); setProductMainImagePreview(p.featured_image_url || ''); setVariantImageFiles(new Map()); setShowProductForm(true);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setProductLoading(true);
    try {
      const token = await getSessionToken(); if (!token) throw new Error('No session');
      let mainImageUrl = newProduct.featured_image_url;
      if (productMainImage) mainImageUrl = await uploadFile(productMainImage, 'merchandise', `products/${Date.now()}`);
      const variants = await Promise.all(newProduct.variants.map(async v => {
        let imgUrl = v.image_url; const vFile = variantImageFiles.get(v.id);
        if (vFile) imgUrl = await uploadFile(vFile, 'product-variants', `variants/${Date.now()}`);
        return { ...v, price_adjustment: parseFloat(v.price_adjustment.toString()), stock_quantity: parseInt(v.stock_quantity.toString()), image_url: imgUrl };
      }));
      const res = await fetch('/api/admin/merchandise', { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newProduct, base_price: parseFloat(newProduct.base_price), featured_image_url: mainImageUrl, variants }) });
      if (res.ok) { resetProductForm(); showSuccessMessage("Success", "Product added!"); await fetchProducts(); }
    } catch (err: any) { showErrorMessage("Error", err.message); }
    finally { setProductLoading(false); }
  };

  const handleUpdateProduct = async (productId: string, updates: Partial<Product>) => {
    const token = await getSessionToken(); if (!token) return;
    const res = await fetch(`/api/admin/merchandise/${productId}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    if (res.ok) { showSuccessMessage("Success", "Product updated!"); fetchProducts(); }
  };

  const handleDeleteProduct = (productId: string) => {
    showConfirmation("Deactivate Product", "Are you sure?", async () => {
      const token = await getSessionToken(); if (!token) return;
      const res = await fetch(`/api/admin/merchandise/${productId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { showSuccessMessage("Success", "Product deactivated!"); fetchProducts(); }
    });
  };

  const handleAddVariant = () => {
    if (!newVariant.color_name || !newVariant.color_value || !newVariant.size || !newVariant.sku) return showErrorMessage("Validation Error", "Provide Color, Size, and SKU.");
    const id = Date.now().toString();
    setNewProduct(prev => ({ ...prev, variants: [...prev.variants, { id, product_id: '', color_name: newVariant.color_name, color_value: newVariant.color_value, color_hex: newVariant.color_hex, size: newVariant.size, sku: newVariant.sku, price_adjustment: parseFloat(newVariant.price_adjustment), stock_quantity: parseInt(newVariant.stock_quantity), is_available: newVariant.is_available, image_url: newVariant.image_url }] }));
    setNewVariant({ ...BLANK_VARIANT });
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(merchSearch.toLowerCase()) && (merchCategoryFilter === 'all' || p.category === merchCategoryFilter));
  const filteredEvents = events.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredPayments = payments.filter(p => p.description?.toLowerCase().includes(paymentSearch.toLowerCase()) || p.profiles?.full_name?.toLowerCase().includes(paymentSearch.toLowerCase()));
  const filteredOrders = orders.filter(o => o.customer_name?.toLowerCase().includes(orderSearch.toLowerCase()));

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return showErrorMessage("Export Error", "No records found.");
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })); a.download = `${filename}.csv`; a.click();
  };

  const handleLogout = async () => { await logout(); router.push("/"); };

  useEffect(() => {
    if (authLoading || fetchedRef.current) return;
    if (!user) { router.push("/login"); return; }
    const checkAndLoad = async () => {
      fetchedRef.current = true;
      if (user.role === 'admin') { await fetchData(); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== 'admin') { router.push("/member/dashboard"); return; }
      await fetchData();
    };
    checkAndLoad();
  }, [user, authLoading]);

  if (authLoading) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-[#1B3A6B]" size={32} /></div>;
  if (!user) return null;

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "members", label: "Members", icon: Users },
    { id: "payments", label: "Payments", icon: DollarSign, badge: stats.pendingPayments },
    { id: "orders", label: "Orders", icon: ShoppingBag, badge: stats.pendingOrders },
    { id: "events", label: "Events", icon: Calendar },
    { id: "merchandise", label: "Merchandise", icon: Tag },
    { id: "messages", label: "Messages", icon: MessageSquare, badge: contactMessages.filter(m => m.status === 'unread').length },
    { id: "bulk-sms", label: "Bulk SMS", icon: Mail },
  ];

  return (
    <div className="h-screen w-full flex flex-col font-sans overflow-hidden bg-[#F7F9FC]">
      <SessionWarning />
      
      {/* 1. FIXED HEADER (Never scrolls) */}
      <header className="h-16 flex-shrink-0 bg-[#1B3A6B] text-white shadow-sm z-50 flex items-center">
        <div className="w-full px-4 sm:px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition"><Menu size={20} /></button>
            <h1 className="text-lg font-serif font-bold text-white tracking-wide">Old Turians <span className="text-[#C9A84C] font-normal">| Admin</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchData} className="p-2 hover:bg-white/10 rounded-lg transition"><RefreshCw size={16} className={dataLoading ? 'animate-spin' : ''} /></button>
            <button onClick={handleLogout} className="text-xs font-semibold uppercase tracking-wider text-white/80 hover:text-[#C9A84C] transition-colors flex items-center gap-1.5"><LogOut size={14} /> Logout</button>
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE (Takes remaining height) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* 3. SIDEBAR (Scrolls independently, never overlaps header) */}
        <aside className={`fixed lg:static inset-y-16 left-0 z-40 bg-white border-r border-[#1B3A6B]/10 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-all duration-300 ease-in-out flex flex-col h-full ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
          <div className="p-4 flex justify-end border-b border-[#1B3A6B]/5 flex-shrink-0">
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:block p-1.5 text-[#1B3A6B]/40 hover:bg-[#1B3A6B]/5 rounded-lg transition">{sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}</button>
          </div>
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }} title={sidebarCollapsed ? tab.label : undefined} className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-[#1B3A6B] text-white shadow-md' : 'text-[#1B3A6B]/60 hover:bg-[#1B3A6B]/5 hover:text-[#1B3A6B]'}`}>
                  <div className={`flex items-center ${sidebarCollapsed ? '' : 'gap-3'}`}><tab.icon size={18} className={isActive ? 'text-[#C9A84C]' : 'text-[#1B3A6B]/40'} />{!sidebarCollapsed && <span>{tab.label}</span>}</div>
                  {!sidebarCollapsed && tab.badge != null && tab.badge > 0 && <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${isActive ? 'bg-[#C9A84C] text-[#1B3A6B]' : 'bg-[#1B3A6B]/10 text-[#1B3A6B]'}`}>{tab.badge}</span>}
                  {sidebarCollapsed && tab.badge != null && tab.badge > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-[#C9A84C] rounded-full" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* 4. CONTENT AREA (Scrolls independently) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Members', value: stats.totalMembers, sub: `${stats.activeMembers} active`, icon: Users, color: 'text-[#1B3A6B]', bg: 'bg-[#1B3A6B]/5' },
                { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), sub: `${formatCurrency(stats.monthlyRevenue)} this month`, icon: TrendingUp, color: 'text-[#C9A84C]', bg: 'bg-[#C9A84C]/10' },
                { label: 'Events', value: stats.totalEvents, sub: `${stats.upcomingEvents} upcoming`, icon: Calendar, color: 'text-[#1B3A6B]', bg: 'bg-[#1B3A6B]/5' },
                { label: 'Pending Queue', value: stats.pendingPayments + stats.pendingOrders, sub: `${stats.pendingPayments} payments · ${stats.pendingOrders} orders`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
              ].map((s, i) => (
                <div key={i} className="bg-white p-5 rounded-xl border border-[#1B3A6B]/10 shadow-sm">
                  <div className="w-10 h-10 bg-[#1B3A6B]/5 rounded-lg flex items-center justify-center mb-4"><s.icon size={20} className={s.color} /></div>
                  <p className="text-[#1B3A6B]/50 text-xs font-semibold uppercase tracking-wider">{s.label}</p>
                  <p className="text-2xl font-serif font-bold text-[#1B3A6B] mt-1">{s.value}</p>
                  <p className="text-xs text-[#1B3A6B]/50 mt-1">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Content Switcher */}
            <div className="bg-white rounded-xl border border-[#1B3A6B]/10 shadow-sm overflow-hidden min-h-[500px]">
              {activeTab === "overview" && (
                <div className="p-6">
                  <h2 className="text-lg font-serif font-bold text-[#1B3A6B] mb-4">Recent Activity</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-[#1B3A6B]/5 rounded-xl p-5 border border-[#1B3A6B]/10">
                      <h3 className="font-serif font-bold text-[#1B3A6B] text-sm flex items-center gap-2 mb-4"><DollarSign size={16} className="text-[#C9A84C]" /> Recent Payments</h3>
                      {payments.slice(0,5).map(p => (
                        <div key={p.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-[#1B3A6B]/10 mb-2">
                          <div><p className="text-sm font-medium">{p.description || "Payment"}</p><p className="text-xs text-[#1B3A6B]/60">{p.profiles?.full_name}</p></div>
                          <div className="text-right"><p className="text-sm font-bold">{formatCurrency(p.amount)}</p></div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-[#1B3A6B]/5 rounded-xl p-5 border border-[#1B3A6B]/10">
                      <h3 className="font-serif font-bold text-[#1B3A6B] text-sm flex items-center gap-2 mb-4"><UserPlus size={16} /> New Registrations</h3>
                      {users.slice(0,5).map(u => (
                        <div key={u.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-[#1B3A6B]/10 mb-2">
                          <div><p className="text-sm font-medium">{u.full_name}</p><p className="text-xs text-[#1B3A6B]/60">{u.email}</p></div>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">{u.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "members" && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div><h2 className="text-lg font-serif font-bold text-[#1B3A6B]">Alumni Directory</h2><p className="text-xs text-[#1B3A6B]/60">{users.length} registered</p></div>
                    <button onClick={() => exportToCSV(users, 'members')} className="px-3.5 py-2 bg-[#1B3A6B]/10 text-[#1B3A6B] rounded-lg text-xs font-semibold hover:bg-[#1B3A6B]/20 transition flex items-center gap-2"><Download size={14} /> Export</button>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-[#1B3A6B]/10">
                    <table className="w-full text-left text-xs">
                      <thead><tr className="bg-[#1B3A6B]/5 border-b"><th className="p-3">Member</th><th className="p-3">Contact</th><th className="p-3">Membership</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
                      <tbody className="divide-y divide-[#1B3A6B]/10">
                        {users.map(u => (
                          <tr key={u.id}>
                            <td className="p-3"><p className="font-semibold">{u.full_name}</p><p className="text-[#1B3A6B]/60">{u.email}</p></td>
                            <td className="p-3">{u.phone_number || "—"}</td>
                            <td className="p-3 font-mono text-[#C9A84C]">{u.membership_number || "—"}</td>
                            <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{u.status}</span></td>
                            <td className="p-3 flex gap-2">
                              <button onClick={() => updateUserStatus(u.id, 'active')} className="text-[11px] font-medium text-[#1B3A6B] hover:underline">Activate</button>
                              <button onClick={() => updateUserStatus(u.id, 'inactive')} className="text-[11px] font-medium text-red-600 hover:underline">Deactivate</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "payments" && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div><h2 className="text-lg font-serif font-bold text-[#1B3A6B]">Transactions</h2><p className="text-xs text-[#1B3A6B]/60">{payments.length} total</p></div>
                    <button onClick={() => exportToCSV(payments, 'payments')} className="px-3.5 py-2 bg-[#1B3A6B]/10 text-[#1B3A6B] rounded-lg text-xs font-semibold hover:bg-[#1B3A6B]/20 transition flex items-center gap-2"><Download size={14} /> Export</button>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-[#1B3A6B]/10">
                    <table className="w-full text-left text-xs">
                      <thead><tr className="bg-[#1B3A6B]/5 border-b"><th className="p-3">Transaction</th><th className="p-3">User</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
                      <tbody className="divide-y divide-[#1B3A6B]/10">
                        {filteredPayments.map(p => (
                          <tr key={p.id}>
                            <td className="p-3"><p className="font-semibold">{p.description || "Payment"}</p><p className="text-[#1B3A6B]/60">{formatDate(p.created_at)}</p></td>
                            <td className="p-3">{p.profiles?.full_name || "Guest"}</td>
                            <td className="p-3 font-bold">{formatCurrency(p.amount)}</td>
                            <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : p.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>{p.status}</span></td>
                            <td className="p-3 flex gap-2">
                              {p.status === 'pending' && (
                                <>
                                  <button onClick={() => updatePaymentStatus(p.id, 'confirmed')} className="text-[11px] font-medium text-emerald-600 hover:underline">Confirm</button>
                                  <button onClick={() => updatePaymentStatus(p.id, 'failed')} className="text-[11px] font-medium text-red-600 hover:underline">Reject</button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "orders" && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div><h2 className="text-lg font-serif font-bold text-[#1B3A6B]">Orders</h2><p className="text-xs text-[#1B3A6B]/60">{orders.length} total</p></div>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-[#1B3A6B]/10">
                    <table className="w-full text-left text-xs">
                      <thead><tr className="bg-[#1B3A6B]/5 border-b"><th className="p-3">Customer</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Update</th></tr></thead>
                      <tbody className="divide-y divide-[#1B3A6B]/10">
                        {filteredOrders.map(o => (
                          <tr key={o.id}>
                            <td className="p-3"><p className="font-semibold">{o.customer_name}</p><p className="text-[#1B3A6B]/60">{o.customer_email}</p></td>
                            <td className="p-3 font-bold">{formatCurrency(o.total)}</td>
                            <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${o.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{o.status}</span></td>
                            <td className="p-3">
                              <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value as any)} className="px-2 py-1 border rounded text-xs bg-white">
                                {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "events" && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div><h2 className="text-lg font-serif font-bold text-[#1B3A6B]">Events</h2><p className="text-xs text-[#1B3A6B]/60">{events.length} listed</p></div>
                    <button onClick={() => { resetEventForm(); setShowEventForm(true); }} className="px-3.5 py-2 bg-[#1B3A6B] text-white rounded-lg text-xs font-semibold hover:bg-[#152e55] transition flex items-center gap-1.5"><Plus size={14} /> New Event</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredEvents.map(e => (
                      <div key={e.id} className="bg-white border border-[#1B3A6B]/10 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                        {e.image_url ? <img src={e.image_url} alt={e.name} className="w-full h-32 object-cover" /> : <div className="h-32 bg-[#1B3A6B]/5 flex items-center justify-center"><Calendar className="text-[#1B3A6B]/20" size={32} /></div>}
                        <div className="p-4">
                          <h3 className="font-serif font-bold text-[#1B3A6B] text-sm mb-1">{e.name}</h3>
                          <p className="text-xs text-[#1B3A6B]/60 mb-3 flex items-center gap-1"><Calendar size={12} /> {e.event_date ? new Date(e.event_date).toLocaleDateString() : "TBD"}</p>
                          <div className="flex gap-2">
                            <button onClick={() => openEventEdit(e)} className="flex-1 bg-[#1B3A6B] text-white text-xs py-1.5 rounded font-medium hover:bg-[#152e55]">Edit</button>
                            <button onClick={() => handleDeleteEvent(e.id)} className="px-2.5 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-600 hover:text-white transition"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "merchandise" && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div><h2 className="text-lg font-serif font-bold text-[#1B3A6B]">Merchandise Store</h2><p className="text-xs text-[#1B3A6B]/60">{products.length} products</p></div>
                    <button onClick={() => { resetProductForm(); setShowProductForm(true); }} className="px-3.5 py-2 bg-[#1B3A6B] text-white rounded-lg text-xs font-semibold hover:bg-[#152e55] transition flex items-center gap-1.5"><Plus size={14} /> Add Product</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredProducts.map(p => (
                      <div key={p.id} className="bg-white border border-[#1B3A6B]/10 rounded-xl overflow-hidden shadow-sm">
                        <div className="h-40 bg-[#1B3A6B]/5 relative">
                          {p.featured_image_url && <img src={p.featured_image_url} alt={p.name} className="w-full h-full object-cover" />}
                          <div className="absolute top-2 left-2"><CategoryBadge cat={p.category} /></div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-serif font-bold text-[#1B3A6B] text-sm truncate">{p.name}</h3>
                          <p className="text-xs font-bold mt-1 mb-3">{formatCurrency(p.base_price)}</p>
                          <div className="flex gap-2">
                            <button onClick={() => openProductEdit(p)} className="flex-1 bg-[#1B3A6B] text-white text-xs py-1.5 rounded font-medium">Edit</button>
                            <button onClick={() => handleDeleteProduct(p.id)} className="px-2.5 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-600 hover:text-white transition"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "messages" && (
                <div className="p-6">
                  <h2 className="text-lg font-serif font-bold text-[#1B3A6B] mb-4">Inquiries</h2>
                  <div className="overflow-x-auto rounded-xl border border-[#1B3A6B]/10">
                    <table className="w-full text-left text-xs">
                      <thead><tr className="bg-[#1B3A6B]/5 border-b"><th className="p-3">Sender</th><th className="p-3">Subject</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead>
                      <tbody className="divide-y divide-[#1B3A6B]/10">
                        {contactMessages.map(m => (
                          <tr key={m.id} className={m.status === 'unread' ? 'bg-[#C9A84C]/5' : ''}>
                            <td className="p-3 font-medium">{m.name}<br/><span className="text-[#1B3A6B]/60">{m.email}</span></td>
                            <td className="p-3">{m.subject}</td>
                            <td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.status === 'unread' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'}`}>{m.status}</span></td>
                            <td className="p-3"><button onClick={() => { setSelectedMessage(m); setShowMessageModal(true); }} className="text-[11px] font-medium text-[#1B3A6B] hover:underline">View</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "bulk-sms" && (
                <div className="p-6">
                  <h2 className="text-lg font-serif font-bold text-[#1B3A6B] mb-6">Bulk SMS Center</h2>
                  <div className="bg-[#1B3A6B]/5 rounded-xl border border-[#1B3A6B]/10 p-6 max-w-2xl">
                    <form onSubmit={handleSendBulkSMS} className="space-y-5">
                      <div>
                        <label className="block text-xs font-semibold text-[#1B3A6B] uppercase mb-2">Recipient Scope</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-xs"><input type="radio" checked={smsRecipientType === 'all'} onChange={() => setSmsRecipientType('all')} /> All Members</label>
                          <label className="flex items-center gap-2 text-xs"><input type="radio" checked={smsRecipientType === 'specific'} onChange={() => setSmsRecipientType('specific')} /> Specific</label>
                        </div>
                      </div>
                      {smsRecipientType === 'specific' && (
                        <div className="max-h-40 overflow-y-auto space-y-1 bg-white p-2 rounded border">
                          {users.map(u => (
                            <label key={u.id} className="flex gap-2 text-xs p-1"><input type="checkbox" checked={selectedRecipients.includes(u.id)} onChange={(e) => e.target.checked ? setSelectedRecipients(prev => [...prev, u.id]) : setSelectedRecipients(prev => prev.filter(id => id !== u.id))} /> {u.full_name}</label>
                          ))}
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-semibold text-[#1B3A6B] uppercase mb-2">Message</label>
                        <textarea rows={4} value={bulkSmsMessage} onChange={e => setBulkSmsMessage(e.target.value)} className="w-full p-3 text-sm border rounded-lg focus:border-[#1B3A6B]" placeholder="Type message..." />
                      </div>
                      <button type="submit" disabled={bulkSmsSending} className="w-full py-2.5 bg-[#1B3A6B] text-white text-xs font-bold uppercase rounded-lg hover:bg-[#152e55]">Send</button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      {showEventForm && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <h3 className="text-lg font-serif font-bold text-[#1B3A6B] mb-4">{editingEvent ? "Edit Event" : "Publish Event"}</h3>
            <form onSubmit={editingEvent ? handleEditEvent : handleCreateEvent} className="space-y-4 text-xs">
               <div className="grid grid-cols-2 gap-4">
                  <div><label className="block font-medium mb-1">Name</label><input type="text" required value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block font-medium mb-1">Status</label><select value={newEvent.status} onChange={e => setNewEvent({...newEvent, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg"><option value="upcoming">Upcoming</option><option value="completed">Completed</option></select></div>
                  <div><label className="block font-medium mb-1">Date</label><input type="datetime-local" value={newEvent.event_date} onChange={e => setNewEvent({...newEvent, event_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block font-medium mb-1">Location</label><input type="text" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block font-medium mb-1">Price (KES)</label><input type="number" required value={newEvent.price} onChange={e => setNewEvent({...newEvent, price: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
               </div>
               <div><label className="block font-medium mb-1">Description</label><textarea required rows={3} value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
               <div className="flex gap-3 pt-2">
                  <button type="submit" className="px-5 py-2 bg-[#1B3A6B] text-white rounded-lg">Save</button>
                  <button type="button" onClick={resetEventForm} className="px-5 py-2 bg-gray-100 rounded-lg">Cancel</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {showProductForm && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6">
             <h3 className="text-lg font-serif font-bold text-[#1B3A6B] mb-4">{editingProduct ? "Edit Product" : "New Product"}</h3>
             <form onSubmit={handleCreateProduct} className="space-y-6 text-xs">
                <div className="grid grid-cols-2 gap-4">
                   <div><label className="block font-medium mb-1">Name</label><input type="text" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                   <div><label className="block font-medium mb-1">Price</label><input type="number" required value={newProduct.base_price} onChange={e => setNewProduct({...newProduct, base_price: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                   <div className="col-span-2"><label className="block font-medium mb-1">Description</label><textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                </div>
                <div className="flex gap-3">
                   <button type="submit" className="px-5 py-2 bg-[#1B3A6B] text-white rounded-lg">Save</button>
                   <button type="button" onClick={resetProductForm} className="px-5 py-2 bg-gray-100 rounded-lg">Cancel</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {showMessageModal && selectedMessage && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h3 className="font-serif font-bold mb-4">Message Details</h3>
            <p className="text-xs mb-2"><strong>From:</strong> {selectedMessage.name}</p>
            <p className="text-xs mb-4 bg-gray-50 p-3 rounded border">{selectedMessage.message}</p>
            <button onClick={() => setShowMessageModal(false)} className="px-4 py-2 bg-[#1B3A6B] text-white rounded-lg text-xs">Close</button>
          </div>
        </div>
      )}

      <StatusModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} type="success" title={modalTitle} message={modalMessage} />
      <StatusModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} type="error" title={modalTitle} message={modalMessage} />
      <ConfirmationModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmAction || (async () => {})} title={modalTitle} message={modalMessage} />
    </div>
  );
}








