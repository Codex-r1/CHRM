"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../(backend)/context/auth";
import { supabase } from "../../../../app/(backend)/lib/supabase/client";
import SiteShell from "../../components/site/SiteShell";
import { AutoGrid, Notice, Section } from "../../components/site/primitives";
import { Button, Dialog, Empty, Field, Input, NativeSelect, Spinner, Textarea } from "../../components/ui";
import { ROUTES, SHOP_CATEGORIES } from "../../content/site";

// ─── Types (rows from the admin API) ────────────────────────────────────────
type Member = {
  id: string; full_name: string; email: string; membership_number?: string;
  status: string; role: string; phone_number?: string; graduation_year?: number;
  course?: string; county?: string; country?: string; created_at: string;
};

type Payment = {
  id: string; user_id: string; payment_type: string; amount: number;
  status: "pending" | "processing" | "confirmed" | "failed";
  account_reference?: string; phone_number?: string; description?: string; receipt_number?: string;
  created_at: string; profiles?: { full_name: string; email: string };
};

type Order = {
  id: string; user_id: string; items: Array<{ name?: string; quantity?: number; size?: string; color_name?: string }>; total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"; order_number?: string;
  customer_name?: string; customer_phone?: string; customer_email?: string;
  shipping_address?: string; created_at: string;
};

type EventRow = {
  id: string; name: string; description: string; event_date?: string;
  location?: string; price: number; max_attendees?: number | null;
  current_attendees: number; is_active: boolean; created_at: string;
  image_url?: string; status: string;
};

type Stats = {
  totalMembers: number; activeMembers: number; pendingPayments: number;
  totalRevenue: number; pendingOrders: number; totalEvents: number;
  upcomingEvents: number; monthlyRevenue: number;
};

type ProductCategory = "tshirt" | "polo" | "hoodie" | "accessory" | "other";

type ProductVariant = {
  id: string; product_id?: string; color_name: string; color_value: string;
  color_hex: string; size: string; sku: string; price_adjustment: number;
  stock_quantity: number; is_available: boolean; image_url?: string;
};

type Product = {
  id: string; name: string; description: string; base_price: number;
  category: ProductCategory; is_active: boolean; is_out_of_stock: boolean;
  featured_image_url?: string; product_variants?: ProductVariant[];
};

type ContactMessage = {
  id: string; name: string; email: string; phone?: string;
  subject: string; message: string;
  status: "unread" | "read" | "replied" | "archived";
  created_at: string;
};

type Tab = "overview" | "members" | "payments" | "orders" | "events" | "shop" | "messages" | "sms";

const ORDER_STATUSES: Order["status"][] = ["pending", "processing", "shipped", "delivered", "cancelled"];
const EVENT_STATUSES = ["upcoming", "ongoing", "completed", "cancelled"];
const CATEGORY_OPTIONS = SHOP_CATEGORIES.filter((c) => c.value !== "all").map((c) => ({ value: c.value, label: c.label }));

const BLANK_EVENT = { name: "", description: "", event_date: "", location: "", price: "", max_attendees: "", image_url: "", is_active: true, status: "upcoming" };
const BLANK_PRODUCT = { name: "", description: "", base_price: "", category: "tshirt" as ProductCategory, featured_image_url: "", is_active: true, is_out_of_stock: false, variants: [] as ProductVariant[] };
const BLANK_VARIANT = { color_name: "", color_hex: "#1e3a8a", size: "", sku: "", stock_quantity: "0" };

// ─── Helpers ────────────────────────────────────────────────────────────────
const kes = (n: number) => `KES ${(n || 0).toLocaleString()}`;
const shortDate = (v?: string) => (v ? new Date(v).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
const dateTime = (v?: string) => (v ? new Date(v).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const toLocalInput = (iso?: string) => (iso ? iso.slice(0, 16) : "");

function StatusBadge({ status }: { status: string }) {
  const tone = ["confirmed", "delivered", "active", "replied"].includes(status)
    ? "success"
    : ["failed", "cancelled", "inactive", "expired"].includes(status)
      ? "danger"
      : ["shipped", "read", "upcoming", "ongoing"].includes(status)
        ? "brand"
        : "warning";
  return <span className={`ui-badge ui-badge--${tone}`}>{titleCase(status)}</span>;
}

const getSessionToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("access_token");
  if (stored) return stored;
  try {
    const res = await fetch("/api/auth/session", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        return data.access_token;
      }
    }
  } catch (err) {
    console.error("getSessionToken failed:", err);
  }
  return null;
};

/** Escapes values for CSV and flattens nested objects. */
function exportToCSV(rows: object[], filename: string): boolean {
  if (!rows.length) return false;
  const headers = Object.keys(rows[0]);
  const cell = (v: unknown) => `"${(v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v)).replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => cell((r as Record<string, unknown>)[h])).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  return true;
}

function Toolbar({ title, count, children }: { title: string; count?: string; children?: ReactNode }) {
  return (
    <div className="ot-toolbar">
      <div className="ot-stack" style={{ gap: 2 }}>
        <h2 className="ot-h2">{title}</h2>
        {count && <span className="ot-dense ot-muted">{count}</span>}
      </div>
      {children && <div className="ot-toolbar-actions">{children}</div>}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ width: 240 }}>
      <Input type="search" aria-label={placeholder} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ImagePicker({ label, preview, onPick, onClear }: { label: string; preview: string; onPick: (f: File) => void; onClear: () => void }) {
  return (
    <div className="ui-field">
      <span className="ui-label">{label}</span>
      <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "center", flexWrap: "wrap" }}>
        <div className="ot-media ot-media--square" style={{ width: 96, flex: "none" }}>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" />
          ) : (
            <div className="ot-placeholder" aria-hidden="true" />
          )}
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <label className="ui-btn ui-btn--outline ui-btn--sm" style={{ cursor: "pointer" }}>
            <input
              type="file"
              accept="image/*"
              className="ot-sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) onPick(f);
              }}
            />
            {preview ? "Replace" : "Upload"}
          </label>
          {preview && (
            <Button size="sm" variant="ghost" onClick={onClear}>
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const fetchedRef = useRef(false);

  const [tab, setTab] = useState<Tab>("overview");
  const [authorised, setAuthorised] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [flash, setFlash] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; message: string; action: () => Promise<void> } | null>(null);
  const [confirming, setConfirming] = useState(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [stats, setStats] = useState<Stats>({ totalMembers: 0, activeMembers: 0, pendingPayments: 0, totalRevenue: 0, pendingOrders: 0, totalEvents: 0, upcomingEvents: 0, monthlyRevenue: 0 });

  const [memberSearch, setMemberSearch] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");

  // Event form
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null);
  const [eventForm, setEventForm] = useState({ ...BLANK_EVENT });
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState("");
  const [savingEvent, setSavingEvent] = useState(false);

  // Product form
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ ...BLANK_PRODUCT });
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState("");
  const [variantDraft, setVariantDraft] = useState({ ...BLANK_VARIANT });
  const [variantImageFiles, setVariantImageFiles] = useState<Map<string, File>>(new Map());
  const [savingProduct, setSavingProduct] = useState(false);
  const [productError, setProductError] = useState("");

  const [openMessage, setOpenMessage] = useState<ContactMessage | null>(null);

  const ok = (text: string) => setFlash({ tone: "success", text });
  const fail = (text: string) => setFlash({ tone: "danger", text });
  const ask = (title: string, message: string, action: () => Promise<void>) => setConfirm({ title, message, action });

  const authed = useCallback(async (path: string, init: RequestInit = {}) => {
    const token = await getSessionToken();
    if (!token) throw new Error("Your session has expired. Please sign in again.");
    return fetch(path, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) } });
  }, []);

  const uploadFile = async (file: File, bucket: string, folder: string): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw new Error(`Image upload failed: ${error.message}`);
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  };

  // ─── Data ──────────────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    try {
      const res = await authed("/api/admin/contact-messages");
      if (res.ok) setMessages((await res.json()).messages || []);
    } catch (err) {
      console.error(err);
    }
  }, [authed]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await authed("/api/admin/merchandise");
      if (res.ok) setProducts((await res.json()).products || []);
    } catch (err) {
      console.error(err);
    }
  }, [authed]);

  const fetchData = useCallback(async () => {
    setDataLoading(true);
    try {
      const res = await authed("/api/admin/dashboard");
      if (!res.ok) throw new Error("The dashboard data couldn't be loaded.");
      const data = await res.json();
      setMembers(data.recentMembers || []);
      setPayments(data.payments || []);
      setOrders(data.orders || []);
      setEvents(data.events || []);
      setStats({
        totalMembers: data.stats?.totalMembers ?? 0, activeMembers: data.stats?.activeMembers ?? 0, pendingPayments: data.stats?.pendingPayments ?? 0,
        totalRevenue: data.stats?.totalRevenue ?? 0, pendingOrders: data.stats?.pendingOrders ?? 0, totalEvents: data.stats?.totalEvents ?? 0,
        upcomingEvents: data.stats?.upcomingEvents ?? 0, monthlyRevenue: data.stats?.monthlyRevenue ?? 0,
      });
      await Promise.all([fetchProducts(), fetchMessages()]);
      setLastSynced(new Date());
    } catch (err) {
      fail(err instanceof Error ? err.message : "Sync failed.");
    } finally {
      setDataLoading(false);
    }
  }, [authed, fetchProducts, fetchMessages]);

  useEffect(() => {
    if (authLoading || fetchedRef.current) return;
    if (!user) {
      router.push(`${ROUTES.login}?redirect=${encodeURIComponent(ROUTES.adminDashboard)}`);
      return;
    }
    fetchedRef.current = true;
    (async () => {
      if (user.role !== "admin") {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (profile?.role !== "admin") {
          router.push(ROUTES.memberDashboard);
          return;
        }
      }
      setAuthorised(true);
      await fetchData();
    })();
  }, [user, authLoading, router, fetchData]);

  // ─── Members / payments / orders ───────────────────────────────────────────
  const updateMemberStatus = (m: Member, status: "active" | "inactive") =>
    ask(`${status === "active" ? "Activate" : "Deactivate"} ${m.full_name}?`, status === "active" ? "They will regain access to the members' area." : "They will lose access to the members' area until reactivated.", async () => {
      const res = await authed(`/api/admin/users/${m.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      if (!res.ok) return fail("The member couldn't be updated.");
      setMembers((prev) => prev.map((u) => (u.id === m.id ? { ...u, status } : u)));
      ok(`${m.full_name} is now ${status}.`);
    });

  const updatePaymentStatus = (p: Payment, status: "confirmed" | "failed") =>
    ask(status === "confirmed" ? "Confirm this payment?" : "Mark this payment as failed?", `${p.description || "Payment"} · ${kes(p.amount)} · ${p.profiles?.full_name || "Guest"}`, async () => {
      const res = await authed(`/api/admin/payments/${p.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      if (!res.ok) return fail("The payment couldn't be updated.");
      setPayments((prev) => prev.map((x) => (x.id === p.id ? { ...x, status } : x)));
      ok(`Payment marked ${status}.`);
    });

  const updateOrderStatus = async (o: Order, status: Order["status"]) => {
    try {
      const res = await authed(`/api/admin/orders/${o.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      if (!res.ok) throw new Error();
      setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status } : x)));
      ok(`Order updated to ${status}.`);
    } catch {
      fail("The order couldn't be updated.");
    }
  };

  // ─── Events ────────────────────────────────────────────────────────────────
  const openEventForm = (e?: EventRow) => {
    setEditingEvent(e ?? null);
    setEventForm(
      e
        ? { name: e.name || "", description: e.description || "", event_date: toLocalInput(e.event_date), location: e.location || "", price: e.price != null ? String(e.price) : "", max_attendees: e.max_attendees != null ? String(e.max_attendees) : "", image_url: e.image_url || "", is_active: e.is_active ?? true, status: e.status || "upcoming" }
        : { ...BLANK_EVENT },
    );
    setEventImageFile(null);
    setEventImagePreview(e?.image_url || "");
    setEventFormOpen(true);
  };

  const saveEvent = async (ev: FormEvent) => {
    ev.preventDefault();
    setSavingEvent(true);
    try {
      let imageUrl = eventImagePreview ? eventForm.image_url : "";
      if (eventImageFile) imageUrl = await uploadFile(eventImageFile, "events", "events");
      const body = JSON.stringify({ ...eventForm, image_url: imageUrl || null, price: parseFloat(eventForm.price) || 0, max_attendees: eventForm.max_attendees ? parseInt(eventForm.max_attendees, 10) : null });
      const res = editingEvent ? await authed(`/api/admin/events/${editingEvent.id}`, { method: "PATCH", body }) : await authed("/api/admin/events", { method: "POST", body });
      if (!res.ok) throw new Error(editingEvent ? "The event couldn't be updated." : "The event couldn't be created.");
      setEventFormOpen(false);
      ok(editingEvent ? "Event updated." : "Event published.");
      await fetchData();
    } catch (err) {
      fail(err instanceof Error ? err.message : "Saving the event failed.");
    } finally {
      setSavingEvent(false);
    }
  };

  const deactivateEvent = (e: EventRow) =>
    ask(`Deactivate ${e.name}?`, "It will be hidden from the public events page. Existing registrations are kept.", async () => {
      const res = await authed(`/api/admin/events/${e.id}`, { method: "DELETE" });
      if (!res.ok) return fail("The event couldn't be deactivated.");
      setEvents((prev) => prev.filter((x) => x.id !== e.id));
      ok("Event deactivated.");
    });

  // ─── Products ──────────────────────────────────────────────────────────────
  const openProductForm = (p?: Product) => {
    setEditingProduct(p ?? null);
    setProductForm(
      p
        ? { name: p.name, description: p.description || "", base_price: String(p.base_price), category: p.category || "other", featured_image_url: p.featured_image_url || "", is_active: p.is_active, is_out_of_stock: p.is_out_of_stock, variants: (p.product_variants || []).map((v) => ({ ...v })) }
        : { ...BLANK_PRODUCT, variants: [] },
    );
    setProductImageFile(null);
    setProductImagePreview(p?.featured_image_url || "");
    setVariantDraft({ ...BLANK_VARIANT });
    setVariantImageFiles(new Map());
    setProductError("");
    setProductFormOpen(true);
  };

  const addVariant = () => {
    const d = variantDraft;
    if (!d.color_name.trim() || !d.size.trim()) return setProductError("Each variant needs a colour and a size.");
    const colorValue = slug(d.color_name);
    if (productForm.variants.some((v) => v.color_value === colorValue && v.size.toLowerCase() === d.size.trim().toLowerCase())) {
      return setProductError(`${d.color_name} / ${d.size} already exists.`);
    }
    const sku = d.sku.trim() || `${slug(productForm.name || "item")}-${colorValue}-${slug(d.size)}`.toUpperCase();
    setProductForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { id: `new-${Date.now()}`, color_name: d.color_name.trim(), color_value: colorValue, color_hex: d.color_hex, size: d.size.trim(), sku, price_adjustment: 0, stock_quantity: Math.max(0, parseInt(d.stock_quantity, 10) || 0), is_available: true, image_url: "" },
      ],
    }));
    setVariantDraft((prev) => ({ ...BLANK_VARIANT, color_name: prev.color_name, color_hex: prev.color_hex }));
    setProductError("");
  };

  const updateVariant = (id: string, patch: Partial<ProductVariant>) =>
    setProductForm((prev) => ({ ...prev, variants: prev.variants.map((v) => (v.id === id ? { ...v, ...patch } : v)) }));

  const removeVariant = (id: string) => {
    setProductForm((prev) => ({ ...prev, variants: prev.variants.filter((v) => v.id !== id) }));
    setVariantImageFiles((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  const pickVariantImage = (id: string, file: File) => {
    setVariantImageFiles((prev) => new Map(prev).set(id, file));
    const reader = new FileReader();
    reader.onloadend = () => updateVariant(id, { image_url: reader.result as string });
    reader.readAsDataURL(file);
  };

  const saveProduct = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!productForm.name.trim() || !productForm.base_price) return setProductError("Name and price are required.");
    setSavingProduct(true);
    setProductError("");
    try {
      let featured = productImagePreview ? productForm.featured_image_url : "";
      if (productImageFile) featured = await uploadFile(productImageFile, "merchandise", "products");

      // Upload new variant images; never send temporary ids or data: URLs to the API.
      const variants = await Promise.all(
        productForm.variants.map(async (v) => {
          const file = variantImageFiles.get(v.id);
          const imageUrl = file ? await uploadFile(file, "product-variants", "variants") : v.image_url?.startsWith("data:") ? null : v.image_url || null;
          return {
            color_name: v.color_name, color_value: v.color_value || slug(v.color_name), color_hex: v.color_hex, size: v.size,
            sku: v.sku, price_adjustment: Number(v.price_adjustment) || 0, stock_quantity: Number(v.stock_quantity) || 0,
            is_available: v.is_available !== false, image_url: imageUrl,
          };
        }),
      );

      const payload = {
        name: productForm.name.trim(), description: productForm.description, base_price: parseFloat(productForm.base_price),
        category: productForm.category, featured_image_url: featured || null, is_active: productForm.is_active,
        is_out_of_stock: productForm.is_out_of_stock, variants,
      };
      const res = editingProduct
        ? await authed(`/api/admin/merchandise/${editingProduct.id}`, { method: "PATCH", body: JSON.stringify(payload) })
        : await authed("/api/admin/merchandise", { method: "POST", body: JSON.stringify(payload) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "The product couldn't be saved.");
      }
      setProductFormOpen(false);
      ok(editingProduct ? "Product updated." : "Product added to the shop.");
      await fetchProducts();
    } catch (err) {
      setProductError(err instanceof Error ? err.message : "The product couldn't be saved.");
    } finally {
      setSavingProduct(false);
    }
  };

  const deactivateProduct = (p: Product) =>
    ask(`Remove ${p.name} from the shop?`, "It will be hidden from the shop. You can reactivate it by editing the product.", async () => {
      const res = await authed(`/api/admin/merchandise/${p.id}`, { method: "DELETE" });
      if (!res.ok) return fail("The product couldn't be removed.");
      ok("Product removed from the shop.");
      await fetchProducts();
    });

  // ─── Messages ──────────────────────────────────────────────────────────────
  const setMessageStatus = async (m: ContactMessage, status: ContactMessage["status"], quiet = false) => {
    try {
      const res = await authed(`/api/admin/contact-messages/${m.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      if (!res.ok) throw new Error();
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, status } : x)));
      setOpenMessage((cur) => (cur?.id === m.id ? { ...cur, status } : cur));
      if (!quiet) ok(`Message marked ${status}.`);
    } catch {
      if (!quiet) fail("The message couldn't be updated.");
    }
  };

  const viewMessage = (m: ContactMessage) => {
    setOpenMessage(m);
    if (m.status === "unread") setMessageStatus(m, "read", true);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  if (authLoading || !authorised) {
    return (
      <SiteShell showContactStrip={false}>
        <Section spacing="last" style={{ paddingTop: "var(--space-24)", display: "flex", justifyContent: "center", color: "var(--brand)" }}>
          <Spinner size={32} label="Checking access" />
        </Section>
      </SiteShell>
    );
  }

  const q = (s: string) => s.trim().toLowerCase();
  const has = (needle: string, ...hay: Array<string | undefined | null>) => !needle || hay.some((h) => h?.toLowerCase().includes(needle));
  const fMembers = members.filter((m) => has(q(memberSearch), m.full_name, m.email, m.membership_number, m.phone_number));
  const fPayments = payments.filter((p) => has(q(paymentSearch), p.description, p.profiles?.full_name, p.profiles?.email, p.account_reference, p.receipt_number));
  const fOrders = orders.filter((o) => has(q(orderSearch), o.customer_name, o.customer_email, o.order_number, o.id));
  const fEvents = events.filter((e) => has(q(eventSearch), e.name, e.location));
  const fProducts = products.filter((p) => has(q(productSearch), p.name, p.category));
  const fMessages = messages.filter((m) => has(q(messageSearch), m.name, m.email, m.subject));
  const unread = messages.filter((m) => m.status === "unread").length;

  const tabs: Array<{ id: Tab; label: string; count?: number }> = [
    { id: "overview", label: "Overview" },
    { id: "members", label: "Members" },
    { id: "payments", label: "Payments", count: stats.pendingPayments },
    { id: "orders", label: "Orders", count: stats.pendingOrders },
    { id: "events", label: "Events" },
    { id: "shop", label: "Shop" },
    { id: "messages", label: "Messages", count: unread },
    { id: "sms", label: "Bulk SMS" },
  ];

  return (
    <SiteShell showContactStrip={false}>
      {/* Intro */}
      <Section spacing="intro">
        <div className="ot-intro" style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: "var(--space-6)", flexWrap: "wrap" }}>
          <div className="ot-stack" style={{ gap: "var(--space-3)" }}>
            <span className="ot-caption">Administration</span>
            <h1 className="ot-hero">Society office</h1>
          </div>
          <div className="ot-stack" style={{ gap: "var(--space-2)", alignItems: "flex-end" }}>
            <Button variant="outline" onClick={fetchData} loading={dataLoading}>
              {dataLoading ? "Syncing" : "Refresh data"}
            </Button>
            <span className="ot-caption">{lastSynced ? `Last synced ${lastSynced.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : "Not synced yet"}</span>
          </div>
        </div>
      </Section>

      {/* Stats */}
      <Section spacing="none" style={{ paddingBottom: "var(--space-12)" }}>
        <AutoGrid min={200} className="ot-stat-row">
          {[
            { value: stats.totalMembers.toLocaleString(), label: "Members", sub: `${stats.activeMembers.toLocaleString()} active` },
            { value: kes(stats.totalRevenue), label: "Total revenue", sub: `${kes(stats.monthlyRevenue)} this month` },
            { value: stats.totalEvents.toLocaleString(), label: "Events", sub: `${stats.upcomingEvents} upcoming` },
            { value: (stats.pendingPayments + stats.pendingOrders).toLocaleString(), label: "Needs attention", sub: `${stats.pendingPayments} payments · ${stats.pendingOrders} orders` },
          ].map((s) => (
            <div key={s.label}>
              <span className="ot-stat" style={{ fontSize: "var(--fs-h1)", lineHeight: "var(--lh-40)" }}>
                {s.value}
              </span>
              <span className="ot-dense">{s.label}</span>
              <span className="ot-caption">{s.sub}</span>
            </div>
          ))}
        </AutoGrid>
      </Section>

      {/* Section bar */}
      <nav className="ot-shop-nav" aria-label="Admin sections">
        <div className="ot-container ot-shop-nav-inner" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              aria-current={tab === t.id ? "page" : undefined}
              className="ot-shop-nav-link"
              style={{ background: "none", border: 0, borderBottom: "2px solid transparent", cursor: "pointer", font: "inherit", fontWeight: 600, fontSize: "var(--fs-dense)", ...(tab === t.id ? { color: "var(--brand)", borderBottomColor: "var(--brand)" } : {}) }}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {!!t.count && <span className="ot-tab-count">{t.count}</span>}
            </button>
          ))}
        </div>
      </nav>

      <Section spacing="last" style={{ paddingTop: "var(--space-10)" }}>
        {flash && (
          <div style={{ marginBottom: "var(--space-8)" }}>
            <Notice tone={flash.tone}>
              <span style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", width: "100%" }}>
                {flash.text}
                <button type="button" className="ot-link-btn" style={{ color: "inherit" }} onClick={() => setFlash(null)}>
                  Dismiss
                </button>
              </span>
            </Notice>
          </div>
        )}

        {/* Overview */}
        {tab === "overview" && (
          <AutoGrid min={360} gap="var(--space-12)" style={{ alignItems: "start" }} className="ot-fade-in">
            <div className="ot-stack" style={{ gap: "var(--space-4)", minWidth: 0 }}>
              <Toolbar title="Recent payments">
                <button type="button" className="ot-link-btn" onClick={() => setTab("payments")}>
                  All payments
                </button>
              </Toolbar>
              <ul className="ot-ledger">
                {payments.slice(0, 6).map((p) => (
                  <li key={p.id} className="ot-ledger-row">
                    <span className="ot-dense ot-muted">{shortDate(p.created_at)}</span>
                    <span className="ot-stack" style={{ gap: 2, minWidth: 0 }}>
                      <span style={{ fontWeight: 600 }}>{p.description || titleCase(p.payment_type)}</span>
                      <span className="ot-caption">{p.profiles?.full_name || "Guest"}</span>
                    </span>
                    <StatusBadge status={p.status} />
                    <span className="ot-ledger-amount">{kes(p.amount)}</span>
                  </li>
                ))}
                {payments.length === 0 && <li className="ot-dense ot-muted" style={{ padding: "var(--space-4) 0" }}>No payments yet.</li>}
              </ul>
            </div>
            <div className="ot-stack" style={{ gap: "var(--space-4)", minWidth: 0 }}>
              <Toolbar title="New members">
                <button type="button" className="ot-link-btn" onClick={() => setTab("members")}>
                  All members
                </button>
              </Toolbar>
              <ul className="ot-ledger">
                {members.slice(0, 6).map((m) => (
                  <li key={m.id} className="ot-ledger-row">
                    <span className="ot-dense ot-muted">{shortDate(m.created_at)}</span>
                    <span className="ot-stack" style={{ gap: 2, minWidth: 0 }}>
                      <span style={{ fontWeight: 600 }}>{m.full_name}</span>
                      <span className="ot-caption" style={{ overflowWrap: "anywhere" }}>{m.email}</span>
                    </span>
                    <StatusBadge status={m.status} />
                    <span className="ot-ledger-amount ot-dense">{m.membership_number || "—"}</span>
                  </li>
                ))}
                {members.length === 0 && <li className="ot-dense ot-muted" style={{ padding: "var(--space-4) 0" }}>No members yet.</li>}
              </ul>
            </div>
          </AutoGrid>
        )}

        {/* Members */}
        {tab === "members" && (
          <div className="ot-fade-in">
            <Toolbar title="Members" count={`${fMembers.length} of ${members.length} shown`}>
              <SearchBox value={memberSearch} onChange={setMemberSearch} placeholder="Search name, email, number" />
              <Button variant="outline" onClick={() => exportToCSV(fMembers, "members") || fail("Nothing to export.")}>
                Export CSV
              </Button>
            </Toolbar>
            <div className="ot-table-wrap">
              <table className="ot-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Phone</th>
                    <th>Class</th>
                    <th>Membership no.</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fMembers.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <strong>{m.full_name}</strong>
                        <span className="ot-sub">{m.email}</span>
                      </td>
                      <td>{m.phone_number || "—"}</td>
                      <td>{m.graduation_year || "—"}</td>
                      <td style={{ fontVariantNumeric: "tabular-nums" }}>{m.membership_number || "—"}</td>
                      <td>
                        <StatusBadge status={m.status} />
                      </td>
                      <td>
                        {m.status === "active" ? (
                          <button type="button" className="ot-link-btn ot-link-btn--danger" onClick={() => updateMemberStatus(m, "inactive")}>
                            Deactivate
                          </button>
                        ) : (
                          <button type="button" className="ot-link-btn" onClick={() => updateMemberStatus(m, "active")}>
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {fMembers.length === 0 && <Empty title="No members match" />}
          </div>
        )}

        {/* Payments */}
        {tab === "payments" && (
          <div className="ot-fade-in">
            <Toolbar title="Payments" count={`${fPayments.length} of ${payments.length} shown`}>
              <SearchBox value={paymentSearch} onChange={setPaymentSearch} placeholder="Search name, reference" />
              <Button variant="outline" onClick={() => exportToCSV(fPayments, "payments") || fail("Nothing to export.")}>
                Export CSV
              </Button>
            </Toolbar>
            <div className="ot-table-wrap">
              <table className="ot-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Payment</th>
                    <th>Payer</th>
                    <th>Reference</th>
                    <th>Status</th>
                    <th className="num">Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fPayments.map((p) => (
                    <tr key={p.id} className={p.status === "pending" ? "is-highlight" : undefined}>
                      <td style={{ whiteSpace: "nowrap" }}>{dateTime(p.created_at)}</td>
                      <td>
                        <strong>{p.description || "Payment"}</strong>
                        <span className="ot-sub">{titleCase(p.payment_type || "payment")}</span>
                      </td>
                      <td>
                        {p.profiles?.full_name || "Guest"}
                        {p.profiles?.email && <span className="ot-sub">{p.profiles.email}</span>}
                      </td>
                      <td style={{ overflowWrap: "anywhere" }}>{p.receipt_number || p.account_reference || "—"}</td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="num">
                        <strong>{kes(p.amount)}</strong>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {p.status === "pending" && (
                          <span style={{ display: "inline-flex", gap: "var(--space-3)" }}>
                            <button type="button" className="ot-link-btn" onClick={() => updatePaymentStatus(p, "confirmed")}>
                              Confirm
                            </button>
                            <button type="button" className="ot-link-btn ot-link-btn--danger" onClick={() => updatePaymentStatus(p, "failed")}>
                              Reject
                            </button>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {fPayments.length === 0 && <Empty title="No payments match" />}
          </div>
        )}

        {/* Orders */}
        {tab === "orders" && (
          <div className="ot-fade-in">
            <Toolbar title="Shop orders" count={`${fOrders.length} of ${orders.length} shown`}>
              <SearchBox value={orderSearch} onChange={setOrderSearch} placeholder="Search customer, order no." />
              <Button variant="outline" onClick={() => exportToCSV(fOrders, "orders") || fail("Nothing to export.")}>
                Export CSV
              </Button>
            </Toolbar>
            <div className="ot-table-wrap">
              <table className="ot-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Delivery</th>
                    <th className="num">Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fOrders.map((o) => (
                    <tr key={o.id} className={o.status === "pending" ? "is-highlight" : undefined}>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {shortDate(o.created_at)}
                        <span className="ot-sub">{o.order_number || `#${o.id.slice(0, 8).toUpperCase()}`}</span>
                      </td>
                      <td>
                        <strong>{o.customer_name || "—"}</strong>
                        <span className="ot-sub">{o.customer_email}</span>
                        {o.customer_phone && <span className="ot-sub">{o.customer_phone}</span>}
                      </td>
                      <td>
                        {(o.items || []).map((it, i) => (
                          <span key={i} style={{ display: "block" }}>
                            {it.quantity ?? 1}× {it.name || "Item"}
                            {it.size ? ` (${[it.color_name, it.size].filter(Boolean).join(", ")})` : ""}
                          </span>
                        ))}
                      </td>
                      <td style={{ maxWidth: 220 }}>{o.shipping_address || "—"}</td>
                      <td className="num">
                        <strong>{kes(o.total)}</strong>
                      </td>
                      <td style={{ minWidth: 150 }}>
                        <NativeSelect
                          aria-label={`Status of order ${o.order_number || o.id.slice(0, 8)}`}
                          options={ORDER_STATUSES.map((s) => ({ value: s, label: titleCase(s) }))}
                          value={o.status}
                          onChange={(e) => updateOrderStatus(o, e.target.value as Order["status"])}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {fOrders.length === 0 && <Empty title="No orders match" />}
          </div>
        )}

        {/* Events */}
        {tab === "events" && (
          <div className="ot-fade-in">
            <Toolbar title="Events" count={`${fEvents.length} listed`}>
              <SearchBox value={eventSearch} onChange={setEventSearch} placeholder="Search events" />
              <Button onClick={() => openEventForm()}>New event</Button>
            </Toolbar>
            <div className="ot-table-wrap">
              <table className="ot-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Event</th>
                    <th>Places</th>
                    <th className="num">Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fEvents.map((e) => (
                    <tr key={e.id}>
                      <td style={{ whiteSpace: "nowrap" }}>{shortDate(e.event_date)}</td>
                      <td>
                        <strong>{e.name}</strong>
                        <span className="ot-sub">{e.location || "Location TBC"}</span>
                      </td>
                      <td>
                        {e.current_attendees || 0}
                        {e.max_attendees ? ` / ${e.max_attendees}` : ""}
                      </td>
                      <td className="num">{e.price ? kes(e.price) : "Free"}</td>
                      <td>
                        <StatusBadge status={e.status} />
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <span style={{ display: "inline-flex", gap: "var(--space-3)" }}>
                          <button type="button" className="ot-link-btn" onClick={() => openEventForm(e)}>
                            Edit
                          </button>
                          <Link href={`/events/register/${e.id}`} className="ot-dense ot-underline" target="_blank">
                            View
                          </Link>
                          <button type="button" className="ot-link-btn ot-link-btn--danger" onClick={() => deactivateEvent(e)}>
                            Deactivate
                          </button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {fEvents.length === 0 && <Empty title="No events yet" actions={<Button onClick={() => openEventForm()}>New event</Button>} />}
          </div>
        )}

        {/* Shop */}
        {tab === "shop" && (
          <div className="ot-fade-in">
            <Toolbar title="Shop products" count={`${fProducts.length} of ${products.length} shown`}>
              <SearchBox value={productSearch} onChange={setProductSearch} placeholder="Search products" />
              <Button onClick={() => openProductForm()}>Add product</Button>
            </Toolbar>
            <div className="ot-table-wrap">
              <table className="ot-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Variants</th>
                    <th>Stock</th>
                    <th className="num">Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fProducts.map((p) => {
                    const stock = (p.product_variants || []).reduce((s, v) => s + (v.stock_quantity || 0), 0);
                    return (
                      <tr key={p.id}>
                        <td>
                          <span style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
                            <span className="ot-media ot-media--square" style={{ width: 48, flex: "none" }}>
                              {p.featured_image_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.featured_image_url} alt="" />
                              )}
                            </span>
                            <strong>{p.name}</strong>
                          </span>
                        </td>
                        <td>{CATEGORY_OPTIONS.find((c) => c.value === p.category)?.label || p.category}</td>
                        <td>{p.product_variants?.length || 0}</td>
                        <td style={{ color: stock === 0 ? "var(--signal-ink)" : undefined }}>{stock}</td>
                        <td className="num">{kes(p.base_price)}</td>
                        <td>
                          <StatusBadge status={!p.is_active ? "inactive" : p.is_out_of_stock ? "out of stock" : "active"} />
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <span style={{ display: "inline-flex", gap: "var(--space-3)" }}>
                            <button type="button" className="ot-link-btn" onClick={() => openProductForm(p)}>
                              Edit
                            </button>
                            {p.is_active && (
                              <button type="button" className="ot-link-btn ot-link-btn--danger" onClick={() => deactivateProduct(p)}>
                                Remove
                              </button>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {fProducts.length === 0 && <Empty title="No products yet" actions={<Button onClick={() => openProductForm()}>Add product</Button>} />}
          </div>
        )}

        {/* Messages */}
        {tab === "messages" && (
          <div className="ot-fade-in">
            <Toolbar title="Messages" count={`${unread} unread · ${messages.length} total`}>
              <SearchBox value={messageSearch} onChange={setMessageSearch} placeholder="Search sender, subject" />
            </Toolbar>
            <div className="ot-table-wrap">
              <table className="ot-table">
                <thead>
                  <tr>
                    <th>Received</th>
                    <th>From</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {fMessages.map((m) => (
                    <tr key={m.id} className={m.status === "unread" ? "is-highlight" : undefined}>
                      <td style={{ whiteSpace: "nowrap" }}>{dateTime(m.created_at)}</td>
                      <td>
                        <strong>{m.name}</strong>
                        <span className="ot-sub">{m.email}</span>
                      </td>
                      <td>{m.subject}</td>
                      <td>
                        <StatusBadge status={m.status} />
                      </td>
                      <td>
                        <button type="button" className="ot-link-btn" onClick={() => viewMessage(m)}>
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {fMessages.length === 0 && <Empty title="No messages" />}
          </div>
        )}

        {/* Bulk SMS */}
        {tab === "sms" && (
          <div className="ot-stack ot-fade-in" style={{ gap: "var(--space-6)", maxWidth: 640 }}>
            <h2 className="ot-h2">Bulk SMS</h2>
            <Notice tone="warning">
              Bulk SMS isn&rsquo;t connected yet: there is no SMS provider or <code>/api/admin/sms/bulk</code> endpoint in the
              app. Once a provider (e.g. Africa&rsquo;s Talking) is chosen, this screen can send to all or selected members.
            </Notice>
          </div>
        )}
      </Section>

      {/* ─── Event form ─── */}
      <Dialog open={eventFormOpen} onClose={() => !savingEvent && setEventFormOpen(false)} title={editingEvent ? `Edit ${editingEvent.name}` : "New event"} size="lg">
        <form onSubmit={saveEvent} className="ot-scope ot-stack" style={{ gap: "var(--space-4)" }}>
          <Field label="Name" htmlFor="ev-name" required>
            <Input id="ev-name" required value={eventForm.name} onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })} />
          </Field>
          <AutoGrid min={200} gap="var(--space-4)">
            <Field label="Date and time" htmlFor="ev-date" required>
              <Input id="ev-date" type="datetime-local" required value={eventForm.event_date} onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })} />
            </Field>
            <Field label="Location" htmlFor="ev-loc">
              <Input id="ev-loc" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} />
            </Field>
            <Field label="Price (KES)" htmlFor="ev-price" required description="Use 0 for a free event.">
              <Input id="ev-price" type="number" min={0} step="1" required value={eventForm.price} onChange={(e) => setEventForm({ ...eventForm, price: e.target.value })} />
            </Field>
            <Field label="Capacity" htmlFor="ev-max" description="Leave empty for no limit.">
              <Input id="ev-max" type="number" min={1} step="1" value={eventForm.max_attendees} onChange={(e) => setEventForm({ ...eventForm, max_attendees: e.target.value })} />
            </Field>
            <Field label="Status" htmlFor="ev-status">
              <NativeSelect id="ev-status" options={EVENT_STATUSES.map((s) => ({ value: s, label: titleCase(s) }))} value={eventForm.status} onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })} />
            </Field>
          </AutoGrid>
          <Field label="Description" htmlFor="ev-desc" required>
            <Textarea id="ev-desc" rows={4} required value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
          </Field>
          <ImagePicker
            label="Image"
            preview={eventImagePreview}
            onPick={(f) => {
              setEventImageFile(f);
              const r = new FileReader();
              r.onloadend = () => setEventImagePreview(r.result as string);
              r.readAsDataURL(f);
            }}
            onClear={() => {
              setEventImageFile(null);
              setEventImagePreview("");
            }}
          />
          <label className="ot-check-row">
            <input type="checkbox" checked={eventForm.is_active} onChange={(e) => setEventForm({ ...eventForm, is_active: e.target.checked })} />
            Visible on the public events page
          </label>
          <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", paddingTop: "var(--space-4)", borderTop: "1px solid var(--divider-strong)" }}>
            <Button variant="ghost" onClick={() => setEventFormOpen(false)} disabled={savingEvent}>
              Cancel
            </Button>
            <Button type="submit" loading={savingEvent}>
              {editingEvent ? "Save changes" : "Publish event"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── Product form ─── */}
      <Dialog open={productFormOpen} onClose={() => !savingProduct && setProductFormOpen(false)} title={editingProduct ? `Edit ${editingProduct.name}` : "Add product"} size="lg">
        <form onSubmit={saveProduct} className="ot-scope ot-stack" style={{ gap: "var(--space-6)" }}>
          {productError && <Notice tone="danger">{productError}</Notice>}
          <AutoGrid min={220} gap="var(--space-4)">
            <Field label="Name" htmlFor="pr-name" required>
              <Input id="pr-name" required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
            </Field>
            <Field label="Price (KES)" htmlFor="pr-price" required>
              <Input id="pr-price" type="number" min={0} step="1" required value={productForm.base_price} onChange={(e) => setProductForm({ ...productForm, base_price: e.target.value })} />
            </Field>
            <Field label="Category" htmlFor="pr-cat" required description="Decides where it appears in the shop.">
              <NativeSelect id="pr-cat" options={CATEGORY_OPTIONS} value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value as ProductCategory })} />
            </Field>
          </AutoGrid>
          <Field label="Description" htmlFor="pr-desc">
            <Textarea id="pr-desc" rows={3} value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
          </Field>
          <AutoGrid min={220} gap="var(--space-4)" style={{ alignItems: "start" }}>
            <ImagePicker
              label="Main photo"
              preview={productImagePreview}
              onPick={(f) => {
                setProductImageFile(f);
                const r = new FileReader();
                r.onloadend = () => setProductImagePreview(r.result as string);
                r.readAsDataURL(f);
              }}
              onClear={() => {
                setProductImageFile(null);
                setProductImagePreview("");
              }}
            />
            <div className="ot-stack" style={{ gap: "var(--space-3)" }}>
              <label className="ot-check-row">
                <input type="checkbox" checked={productForm.is_active} onChange={(e) => setProductForm({ ...productForm, is_active: e.target.checked })} />
                Show in the shop
              </label>
              <label className="ot-check-row">
                <input type="checkbox" checked={productForm.is_out_of_stock} onChange={(e) => setProductForm({ ...productForm, is_out_of_stock: e.target.checked })} />
                Mark the whole product out of stock
              </label>
            </div>
          </AutoGrid>

          {/* Variants */}
          <div className="ot-stack" style={{ gap: "var(--space-3)" }}>
            <div className="ot-stack" style={{ gap: 2 }}>
              <h3 className="ot-title">Colours and sizes</h3>
              <span className="ot-caption">Each colour and size combination is a variant with its own stock. Customers can only buy variants with stock.</span>
            </div>
            {productForm.variants.length > 0 && (
              <div className="ot-table-wrap">
                <table className="ot-table">
                  <thead>
                    <tr>
                      <th>Colour</th>
                      <th>Size</th>
                      <th>SKU</th>
                      <th>Stock</th>
                      <th>Photo</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {productForm.variants.map((v) => (
                      <tr key={v.id}>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 999, background: v.color_hex, border: "1px solid var(--divider-strong)", verticalAlign: "middle", marginRight: 8 }} />
                          {v.color_name}
                        </td>
                        <td>{v.size}</td>
                        <td style={{ overflowWrap: "anywhere" }}>{v.sku}</td>
                        <td style={{ width: 96 }}>
                          <Input type="number" min={0} aria-label={`Stock for ${v.color_name} ${v.size}`} value={String(v.stock_quantity)} onChange={(e) => updateVariant(v.id, { stock_quantity: Math.max(0, parseInt(e.target.value, 10) || 0) })} />
                        </td>
                        <td>
                          <label className="ot-link-btn" style={{ cursor: "pointer" }}>
                            <input type="file" accept="image/*" className="ot-sr-only" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) pickVariantImage(v.id, f); }} />
                            {v.image_url ? "Replace" : "Add"}
                          </label>
                        </td>
                        <td>
                          <button type="button" className="ot-link-btn ot-link-btn--danger" onClick={() => removeVariant(v.id)}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="ot-panel" style={{ gap: "var(--space-3)" }}>
              <span className="ot-dense" style={{ fontWeight: 600 }}>
                Add a variant
              </span>
              <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: "2 1 140px" }}>
                  <Field label="Colour" htmlFor="vr-color">
                    <Input id="vr-color" placeholder="e.g. Navy" value={variantDraft.color_name} onChange={(e) => setVariantDraft({ ...variantDraft, color_name: e.target.value })} />
                  </Field>
                </div>
                <div style={{ flex: "0 0 64px" }}>
                  <Field label="Swatch" htmlFor="vr-hex">
                    <input id="vr-hex" type="color" value={variantDraft.color_hex} onChange={(e) => setVariantDraft({ ...variantDraft, color_hex: e.target.value })} style={{ width: 56, height: 40, border: "1px solid var(--divider-strong)", padding: 2, background: "#fff" }} />
                  </Field>
                </div>
                <div style={{ flex: "1 1 90px" }}>
                  <Field label="Size" htmlFor="vr-size">
                    <Input id="vr-size" placeholder="e.g. M" value={variantDraft.size} onChange={(e) => setVariantDraft({ ...variantDraft, size: e.target.value })} />
                  </Field>
                </div>
                <div style={{ flex: "1 1 90px" }}>
                  <Field label="Stock" htmlFor="vr-stock">
                    <Input id="vr-stock" type="number" min={0} value={variantDraft.stock_quantity} onChange={(e) => setVariantDraft({ ...variantDraft, stock_quantity: e.target.value })} />
                  </Field>
                </div>
                <div style={{ flex: "2 1 140px" }}>
                  <Field label="SKU (optional)" htmlFor="vr-sku">
                    <Input id="vr-sku" placeholder="Auto-generated" value={variantDraft.sku} onChange={(e) => setVariantDraft({ ...variantDraft, sku: e.target.value })} />
                  </Field>
                </div>
                <Button variant="outline" onClick={addVariant}>
                  Add
                </Button>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", paddingTop: "var(--space-4)", borderTop: "1px solid var(--divider-strong)" }}>
            <Button variant="ghost" onClick={() => setProductFormOpen(false)} disabled={savingProduct}>
              Cancel
            </Button>
            <Button type="submit" loading={savingProduct}>
              {editingProduct ? "Save changes" : "Add product"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ─── Message ─── */}
      <Dialog open={!!openMessage} onClose={() => setOpenMessage(null)} title={openMessage?.subject || "Message"}>
        {openMessage && (
          <div className="ot-scope ot-stack" style={{ gap: "var(--space-6)" }}>
            <dl className="ot-dl" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", columnGap: "var(--space-6)" }}>
              <div>
                <dt>From</dt>
                <dd>{openMessage.name}</dd>
              </div>
              <div>
                <dt>Received</dt>
                <dd>{dateTime(openMessage.created_at)}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd style={{ overflowWrap: "anywhere" }}>{openMessage.email}</dd>
              </div>
              {openMessage.phone && (
                <div>
                  <dt>Phone</dt>
                  <dd>{openMessage.phone}</dd>
                </div>
              )}
            </dl>
            <p className="ot-body-relaxed" style={{ whiteSpace: "pre-wrap" }}>
              {openMessage.message}
            </p>
            <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", justifyContent: "flex-end", paddingTop: "var(--space-4)", borderTop: "1px solid var(--divider-strong)" }}>
              <Button variant="ghost" onClick={() => setMessageStatus(openMessage, "archived")}>
                Archive
              </Button>
              <Button variant="outline" onClick={() => setMessageStatus(openMessage, "replied")}>
                Mark replied
              </Button>
              <a className="ui-btn ui-btn--primary" href={`mailto:${openMessage.email}?subject=${encodeURIComponent(`Re: ${openMessage.subject}`)}`}>
                Reply by email
              </a>
            </div>
          </div>
        )}
      </Dialog>

      {/* ─── Confirm ─── */}
      <Dialog open={!!confirm} onClose={() => !confirming && setConfirm(null)} title={confirm?.title || ""} size="sm">
        {confirm && (
          <div className="ot-scope ot-stack" style={{ gap: "var(--space-6)" }}>
            <p className="ot-body">{confirm.message}</p>
            <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => setConfirm(null)} disabled={confirming}>
                Cancel
              </Button>
              <Button
                loading={confirming}
                onClick={async () => {
                  setConfirming(true);
                  try {
                    await confirm.action();
                  } catch (err) {
                    fail(err instanceof Error ? err.message : "That didn't work.");
                  } finally {
                    setConfirming(false);
                    setConfirm(null);
                  }
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </SiteShell>
  );
}
