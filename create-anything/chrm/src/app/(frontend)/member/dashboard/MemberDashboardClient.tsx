"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../../app/(backend)/lib/supabase/client";
import { useAuth } from "../../../(backend)/context/auth";
import SiteShell from "../../components/site/SiteShell";
import { ArrowLink, AutoGrid, Notice, Section } from "../../components/site/primitives";
import { ButtonLink, Empty, Spinner } from "../../components/ui";
import { ROUTES, SOCIETY } from "../../content/site";
import { kes } from "../../lib/products";

// ─── Types (rows as stored in Supabase) ─────────────────────────────────────
type MemberDetailsType = {
  id: string; email: string; full_name: string; membership_number: string;
  phone_number: string; graduation_year: number; course: string; county: string; country?: string;
  status: "pending" | "active" | "expired" | "inactive"; role: "admin" | "member";
  created_at: string; updated_at: string; avatar_url?: string;
  registration_source?: "online" | "manual"; needs_password_setup?: boolean;
};

type PaymentType = {
  id: string; created_at: string; payment_type: "registration" | "renewal" | "event" | "merchandise";
  account_reference: string; amount: number; status: "pending" | "processing" | "confirmed" | "failed";
  user_id: string; description: string; phone_number: string; mpesa_receipt_number?: string; receipt_number?: string; paid_at?: string;
};

type OrderType = {
  id: string; created_at: string; items: unknown[]; total: number; order_number?: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  user_id: string; customer_name: string; customer_phone: string; customer_email: string;
  shipping_address?: string; payment_id?: string;
};

type EventType = {
  id: string; name: string; description: string; event_date?: string; price: number;
  member_discount: number; location?: string; max_attendees?: number;
  current_attendees: number; status: "upcoming" | "ongoing" | "completed" | "cancelled"; is_active: boolean;
};

type MembershipType = {
  id: string; user_id: string; start_date: string; expiry_date: string; is_active: boolean; created_at: string;
};

type Tab = "overview" | "payments" | "orders" | "events" | "profile";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "payments", label: "Payments" },
  { id: "orders", label: "Orders" },
  { id: "events", label: "Events" },
  { id: "profile", label: "Profile" },
];

const isTab = (v: string | null | undefined): v is Tab => TABS.some((t) => t.id === v);

// ─── Formatting ─────────────────────────────────────────────────────────────
function safeDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}
const longDate = (v?: string | null) => safeDate(v)?.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) ?? "—";
const shortDate = (v?: string | null) => safeDate(v)?.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) ?? "—";
const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const PAYMENT_LABEL: Record<PaymentType["payment_type"], string> = {
  registration: "Membership registration",
  renewal: "Membership renewal",
  event: "Event registration",
  merchandise: "Shop order",
};

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "confirmed" || status === "delivered" || status === "active"
      ? "success"
      : status === "failed" || status === "cancelled" || status === "expired" || status === "inactive"
        ? "danger"
        : status === "shipped"
          ? "brand"
          : "warning";
  return <span className={`ui-badge ui-badge--${tone}`}>{titleCase(status)}</span>;
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function MemberDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");
  const activeTab: Tab = isTab(tabParam) ? tabParam : "overview";

  const [loading, setLoading] = useState(true);
  const [memberDetails, setMemberDetails] = useState<MemberDetailsType | null>(null);
  const [membership, setMembership] = useState<MembershipType | null>(null);
  const [payments, setPayments] = useState<PaymentType[]>([]);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [events, setEvents] = useState<EventType[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const resolveUserId = useCallback(async (): Promise<string | null> => {
    if (user?.id) return user.id;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) return null;
      return data.session?.user?.id ?? null;
    } catch {
      return null;
    }
  }, [user?.id]);

  const fetchRemainingData = useCallback(async (userId: string) => {
    const [membershipRes, paymentsRes, ordersRes, eventsRes] = await Promise.allSettled([
      supabase.from("memberships").select("*").eq("user_id", userId).eq("is_active", true).maybeSingle(),
      supabase.from("payments").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("orders").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("events").select("*").eq("is_active", true).in("status", ["upcoming", "ongoing"]).order("event_date", { ascending: true }).limit(10),
    ]);
    if (membershipRes.status === "fulfilled") setMembership(membershipRes.value.data ?? null);
    if (paymentsRes.status === "fulfilled") setPayments((paymentsRes.value.data as PaymentType[]) ?? []);
    if (ordersRes.status === "fulfilled") setOrders((ordersRes.value.data as OrderType[]) ?? []);
    if (eventsRes.status === "fulfilled") setEvents((eventsRes.value.data as EventType[]) ?? []);
  }, []);

  const fetchMemberData = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const userId = await resolveUserId();
      if (!userId) {
        setLoadError("We couldn't confirm your session. Please sign in again.");
        return;
      }
      const { data: memberData, error: memberError } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (memberData) {
        if (memberData.role === "admin") {
          router.push(ROUTES.adminDashboard);
          return;
        }
        setMemberDetails(memberData as MemberDetailsType);
      } else {
        setMemberDetails({
          id: userId, email: user?.email || "", full_name: user?.email?.split("@")[0] || "Member", status: "active", role: "member",
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(), membership_number: "", phone_number: "",
          graduation_year: 0, course: "", county: "",
        });
        if (memberError) setLoadError("Some of your profile details couldn't be loaded.");
      }
      await fetchRemainingData(userId);
    } catch {
      setLoadError("Something went wrong loading your account. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [resolveUserId, fetchRemainingData, router, user?.email]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`${ROUTES.login}?redirect=${encodeURIComponent("/member/dashboard")}`);
      return;
    }
    fetchMemberData();
  }, [user, authLoading, router, fetchMemberData]);

  if (authLoading || loading || !user) {
    return (
      <SiteShell>
        <Section spacing="last" style={{ paddingTop: "var(--space-24)", display: "flex", justifyContent: "center", color: "var(--brand)" }}>
          <Spinner size={32} label="Loading your account" />
        </Section>
      </SiteShell>
    );
  }

  // ─── Derived ──────────────────────────────────────────────────────────────
  const fullName = memberDetails?.full_name || user.email?.split("@")[0] || "Member";
  const firstName = fullName.split(" ")[0];
  const membershipActive = membership?.is_active || false;
  const confirmedPayments = payments.filter((p) => p.status === "confirmed");
  const totalPaid = confirmedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const upcoming = events.filter((e) => e.status === "upcoming" || e.status === "ongoing");
  const membershipLabel = membershipActive ? "Active" : memberDetails?.status === "pending" ? "Pending activation" : "Inactive";

  const tabHref = (t: Tab) => (t === "overview" ? "/member/dashboard" : `/member/dashboard?tab=${t}`);

  return (
    <SiteShell>
      {/* Intro + membership card */}
      <Section spacing="intro">
        <AutoGrid min={320} gap="var(--space-12)" style={{ alignItems: "end" }}>
          <div className="ot-stack ot-span-2" style={{ gap: "var(--space-4)", maxWidth: 680 }}>
            <span className="ot-caption">Members&rsquo; area</span>
            <h1 className="ot-hero">Welcome back, {firstName}</h1>
            <p className="ot-lede">
              {memberDetails?.graduation_year ? `Class of ${memberDetails.graduation_year}. ` : ""}
              Your membership, payments, orders and events in one place.
            </p>
          </div>

          <div className="ot-member-card" aria-label="Membership card">
            <div className="ot-member-card-top">
              <span className="ot-caption">{SOCIETY.name}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/turi-crest.png" alt="" width={23} height={40} style={{ height: 40, width: "auto" }} />
            </div>
            <div className="ot-stack" style={{ gap: "var(--space-2)" }}>
              <span className="ot-caption">Membership no.</span>
              <span className="ot-member-card-number">{memberDetails?.membership_number || "Pending"}</span>
            </div>
            <div className="ot-member-card-rule" />
            <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
              <div className="ot-stack" style={{ gap: "var(--space-1)" }}>
                <span className="ot-caption">Member</span>
                <span style={{ fontWeight: 700 }}>{fullName}</span>
              </div>
              <div className="ot-stack" style={{ gap: "var(--space-1)", textAlign: "right" }}>
                <span className="ot-caption">{membershipActive ? "Valid until" : "Status"}</span>
                <span style={{ fontWeight: 700 }}>{membershipActive ? longDate(membership?.expiry_date) : membershipLabel}</span>
              </div>
            </div>
          </div>
        </AutoGrid>
      </Section>

      {/* Section bar */}
      <nav className="ot-shop-nav" aria-label="Account sections">
        <div className="ot-container ot-shop-nav-inner">
          {TABS.map((t) => (
            <Link key={t.id} href={tabHref(t.id)} scroll={false} className="ot-shop-nav-link" aria-current={activeTab === t.id ? "page" : undefined}>
              {t.label}
            </Link>
          ))}
        </div>
      </nav>

      <Section spacing="last" style={{ paddingTop: "var(--space-12)" }}>
        {loadError && (
          <div style={{ marginBottom: "var(--space-8)" }}>
            <Notice tone="warning">{loadError}</Notice>
          </div>
        )}

        {activeTab === "overview" && (
          <div className="ot-stack ot-fade-in" style={{ gap: "var(--space-16)" }}>
            {!membershipActive && (
              <Notice tone="info">
                <span>
                  {memberDetails?.status === "pending"
                    ? "Your membership is awaiting payment confirmation. If you've already paid, it will activate shortly."
                    : "Your membership isn't active. Contact the alumni office to renew."}{" "}
                  <Link href={ROUTES.contact} className="ot-underline" style={{ color: "inherit", fontWeight: 600 }}>
                    Contact us
                  </Link>
                </span>
              </Notice>
            )}

            <AutoGrid min={180} className="ot-stat-row">
              {[
                { value: kes(totalPaid), label: "Total paid" },
                { value: confirmedPayments.length, label: "Confirmed payments" },
                { value: orders.length, label: "Shop orders" },
                { value: upcoming.length, label: "Upcoming events" },
              ].map((s) => (
                <div key={s.label}>
                  <span className="ot-stat" style={{ fontSize: "var(--fs-h1)", lineHeight: "var(--lh-40)" }}>
                    {s.value}
                  </span>
                  <span className="ot-dense ot-muted">{s.label}</span>
                </div>
              ))}
            </AutoGrid>

            <AutoGrid min={320} gap="var(--space-12)" style={{ alignItems: "start" }}>
              <div className="ot-stack ot-span-2" style={{ gap: "var(--space-6)", minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "var(--space-4)" }}>
                  <h2 className="ot-h2">Recent activity</h2>
                  {payments.length > 5 && <ArrowLink href={tabHref("payments")}>All payments</ArrowLink>}
                </div>
                {payments.length === 0 ? (
                  <p className="ot-body ot-muted">No activity yet.</p>
                ) : (
                  <PaymentLedger payments={payments.slice(0, 5)} compact />
                )}
              </div>

              <aside className="ot-stack" style={{ gap: "var(--space-10)" }}>
                <div className="ot-stack" style={{ gap: "var(--space-4)" }}>
                  <h2 className="ot-title">Coming up</h2>
                  {upcoming.length === 0 ? (
                    <p className="ot-dense ot-muted">No upcoming events yet.</p>
                  ) : (
                    <ul className="ot-stack" style={{ listStyle: "none", margin: 0, padding: 0, borderTop: "1px solid var(--ink)" }}>
                      {upcoming.slice(0, 3).map((e) => (
                        <li key={e.id} className="ot-stack" style={{ gap: 2, padding: "var(--space-3) 0", borderBottom: "1px solid var(--divider-strong)" }}>
                          <span className="ot-caption">{shortDate(e.event_date)}</span>
                          <Link href={`/events/register/${e.id}`} style={{ fontWeight: 600, color: "var(--ink)" }}>
                            {e.name}
                          </Link>
                          {e.location && <span className="ot-dense ot-muted">{e.location}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                  <ArrowLink href={ROUTES.events}>All events</ArrowLink>
                </div>

                <nav className="ot-stack" style={{ gap: "var(--space-3)" }} aria-label="Shortcuts">
                  <h2 className="ot-title">Shortcuts</h2>
                  <ArrowLink href={ROUTES.profileEdit}>Update your details</ArrowLink>
                  <ArrowLink href={ROUTES.directory}>Find old friends</ArrowLink>
                  <ArrowLink href={ROUTES.store}>Visit the shop</ArrowLink>
                  <ArrowLink href={ROUTES.contact}>Contact the alumni office</ArrowLink>
                </nav>
              </aside>
            </AutoGrid>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="ot-stack ot-fade-in" style={{ gap: "var(--space-6)" }}>
            <h2 className="ot-h2">Payment history</h2>
            {payments.length === 0 ? <Empty title="No payments yet" description="Membership, event and shop payments will appear here." /> : <PaymentLedger payments={payments} />}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="ot-stack ot-fade-in" style={{ gap: "var(--space-6)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "var(--space-4)", flexWrap: "wrap" }}>
              <h2 className="ot-h2">Shop orders</h2>
              <ArrowLink href={ROUTES.store}>Visit the shop</ArrowLink>
            </div>
            {orders.length === 0 ? (
              <Empty title="No orders yet" description="Blazers, crest ties and publications from the official shop." actions={<ButtonLink href={ROUTES.store}>Browse the shop</ButtonLink>} />
            ) : (
              <ul className="ot-ledger">
                <li className="ot-ledger-row ot-ledger-head" aria-hidden="true">
                  <span>Date</span>
                  <span>Order</span>
                  <span>Status</span>
                  <span style={{ textAlign: "right" }}>Total</span>
                </li>
                {orders.map((o) => (
                  <li key={o.id} className="ot-ledger-row">
                    <span className="ot-dense ot-muted">{shortDate(o.created_at)}</span>
                    <span className="ot-stack" style={{ gap: 2, minWidth: 0 }}>
                      <span style={{ fontWeight: 600 }}>{o.order_number || `Order #${o.id.slice(0, 8).toUpperCase()}`}</span>
                      <span className="ot-caption">
                        {o.items?.length || 0} {o.items?.length === 1 ? "item" : "items"}
                        {o.shipping_address ? ` · ${o.shipping_address}` : ""}
                      </span>
                    </span>
                    <StatusBadge status={o.status} />
                    <span className="ot-ledger-amount">{kes(o.total || 0)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === "events" && (
          <div className="ot-stack ot-fade-in" style={{ gap: "var(--space-6)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "var(--space-4)", flexWrap: "wrap" }}>
              <h2 className="ot-h2">Upcoming events</h2>
              <ArrowLink href={ROUTES.events}>All events</ArrowLink>
            </div>
            {upcoming.length === 0 ? (
              <Empty title="No upcoming events" description="Reunions and regional dinners will be listed here once announced." />
            ) : (
              <ul className="ot-ledger">
                {upcoming.map((e) => {
                  const memberPrice = Math.max(0, (e.price || 0) - (e.member_discount || 0));
                  return (
                    <li key={e.id} className="ot-ledger-row">
                      <span className="ot-stack" style={{ gap: 2 }}>
                        <span style={{ fontWeight: 700 }}>{shortDate(e.event_date)}</span>
                        <span className="ot-caption">{e.location || "Location TBC"}</span>
                      </span>
                      <span className="ot-stack" style={{ gap: 2, minWidth: 0 }}>
                        <span style={{ fontWeight: 600 }}>{e.name}</span>
                        {e.description && (
                          <span className="ot-dense ot-muted" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {e.description}
                          </span>
                        )}
                      </span>
                      <span className="ot-ledger-amount">{e.price === 0 ? "Free" : `${kes(memberPrice)}${e.member_discount > 0 ? " (member)" : ""}`}</span>
                      <ButtonLink href={`/events/register/${e.id}`} size="sm" variant="outline">
                        Register
                      </ButtonLink>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="ot-stack ot-fade-in" style={{ gap: "var(--space-6)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "var(--space-4)", flexWrap: "wrap" }}>
              <h2 className="ot-h2">Your details</h2>
              <ButtonLink href={ROUTES.profileEdit} variant="outline">
                Edit profile
              </ButtonLink>
            </div>
            <dl className="ot-dl" style={{ borderTop: "1px solid var(--ink)" }}>
              {[
                { label: "Full name", value: memberDetails?.full_name },
                { label: "Email", value: memberDetails?.email || user.email },
                { label: "Phone", value: memberDetails?.phone_number },
                { label: "Membership no.", value: memberDetails?.membership_number },
                { label: "Graduation year", value: memberDetails?.graduation_year ? String(memberDetails.graduation_year) : "" },
                { label: "Course", value: memberDetails?.course },
                { label: "Country", value: memberDetails?.country },
                { label: "County", value: memberDetails?.county },
                { label: "Membership", value: membershipActive ? `Active until ${longDate(membership?.expiry_date)}` : membershipLabel },
                { label: "Member since", value: longDate(memberDetails?.created_at) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value || "—"}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Section>
    </SiteShell>
  );
}

function PaymentLedger({ payments, compact }: { payments: PaymentType[]; compact?: boolean }) {
  return (
    <ul className="ot-ledger">
      {!compact && (
        <li className="ot-ledger-row ot-ledger-head" aria-hidden="true">
          <span>Date</span>
          <span>Description</span>
          <span>Status</span>
          <span style={{ textAlign: "right" }}>Amount</span>
        </li>
      )}
      {payments.map((p) => (
        <li key={p.id} className="ot-ledger-row">
          <span className="ot-dense ot-muted">{shortDate(p.paid_at || p.created_at)}</span>
          <span className="ot-stack" style={{ gap: 2, minWidth: 0 }}>
            <span style={{ fontWeight: 600 }}>{p.description || PAYMENT_LABEL[p.payment_type] || "Payment"}</span>
            <span className="ot-caption" style={{ overflowWrap: "anywhere" }}>
              {p.description ? `${PAYMENT_LABEL[p.payment_type] ?? titleCase(p.payment_type)} · ` : ""}Ref {p.mpesa_receipt_number || p.receipt_number || p.account_reference}
            </span>
          </span>
          <StatusBadge status={p.status} />
          <span className="ot-ledger-amount">{kes(p.amount || 0)}</span>
        </li>
      ))}
    </ul>
  );
}
