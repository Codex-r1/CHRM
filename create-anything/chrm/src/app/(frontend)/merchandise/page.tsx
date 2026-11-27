"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../(backend)/context/auth";
import SiteShell from "../components/site/SiteShell";
import { ArrowLink, AutoGrid, FeatureBand, ImageFrame, Notice, PageIntro, Section, Tile } from "../components/site/primitives";
import PaymentMethodSelector, { type CardDetails, type PaymentMethod } from "../components/PaymentMethodSelector";
import { Button, ButtonLink, Empty, Field, Input, NativeSelect, RadioGroup, Spinner, ToggleGroup } from "../components/ui";
import { ROUTES, SHIPPING_COUNTRIES, SHIPPING_METHODS, STORE_CATEGORIES } from "../content/site";
import type { CartItem, Product, ShippingMethod, StoreCategory, VariantSelection } from "../types/merchandise";

type Step = "shop" | "checkout" | "awaiting-pin" | "success";

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 40;
const kes = (n: number) => `KES ${n.toLocaleString()}`;

/* ── Product helpers ─────────────────────────────────────────────────── */

const uniqueColors = (p: Product) => Array.from(new Map(p.variants.map((v) => [v.color_value, v])).values());
const sizesFor = (p: Product, color: string) =>
  p.variants.filter((v) => v.color_value === color).map((v) => ({ size: v.size, available: v.stock_quantity > 0, variant_id: v.id }));
const imageFor = (p: Product, color: string) => p.variants.find((v) => v.color_value === color)?.image_url || p.variants[0]?.image_url;

/**
 * Products have no category column yet, so categories are matched by keyword
 * in the name/description. Replace with a real `category` field when added.
 */
function inCategory(p: Product, cat: StoreCategory) {
  if (cat === "all") return true;
  const keywords = STORE_CATEGORIES.find((c) => c.value === cat)?.keywords ?? [];
  const text = `${p.name} ${p.description}`.toLowerCase();
  return keywords.some((k) => new RegExp(`\\b${k}`).test(text));
}

/* ── Product card ────────────────────────────────────────────────────── */

function ProductCard({
  product,
  selection,
  onColor,
  onSize,
  onAdd,
}: {
  product: Product;
  selection: VariantSelection;
  onColor: (color: string) => void;
  onSize: (size: string, variantId: string) => void;
  onAdd: () => void;
}) {
  const colors = uniqueColors(product);
  const sizes = selection.color ? sizesFor(product, selection.color) : [];
  const variant = product.variants.find((v) => v.id === selection.variant_id);
  const canAdd = !!selection.variant_id && !product.is_out_of_stock && (variant?.stock_quantity ?? 0) > 0;

  return (
    <Tile
      title={
        <span style={{ display: "flex", flexDirection: "column" }}>
          {product.name}
          <span className="ot-dense" style={{ fontWeight: 600, opacity: 0.85 }}>
            {kes(product.base_price)}
          </span>
        </span>
      }
      media={<ImageFrame aspect="photo" src={imageFor(product, selection.color)} alt={product.name} placeholder="Product photo pending" />}
    >
      {product.description && <p className="ot-body">{product.description}</p>}

      {colors.length > 0 && (
        <div className="ot-stack" style={{ gap: "var(--space-2)" }}>
          <span className="ot-caption">Colour{selection.color ? `: ${colors.find((c) => c.color_value === selection.color)?.color_name}` : ""}</span>
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
            {colors.map((c) => (
              <button
                key={c.color_value}
                type="button"
                className="ot-swatch"
                style={{ backgroundColor: c.color_hex }}
                aria-pressed={selection.color === c.color_value}
                aria-label={c.color_name}
                title={c.color_name}
                onClick={() => onColor(c.color_value)}
              />
            ))}
          </div>
        </div>
      )}

      {selection.color && (
        <div className="ot-stack" style={{ gap: "var(--space-2)" }}>
          <span className="ot-caption">Size</span>
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
            {sizes.map((s) => (
              <button
                key={s.variant_id}
                type="button"
                className="ot-size"
                disabled={!s.available}
                aria-pressed={selection.size === s.size}
                onClick={() => onSize(s.size, s.variant_id)}
              >
                {s.size}
              </button>
            ))}
          </div>
        </div>
      )}

      {variant && (
        <span className="ot-caption" style={{ color: variant.stock_quantity > 5 ? "var(--leaf-ink)" : variant.stock_quantity > 0 ? "var(--honey-ink)" : "var(--signal-ink)" }}>
          {variant.stock_quantity > 5 ? `${variant.stock_quantity} in stock` : variant.stock_quantity > 0 ? `Only ${variant.stock_quantity} left` : "Out of stock"}
        </span>
      )}

      <Button variant={canAdd ? "primary" : "outline"} disabled={!canAdd} onClick={onAdd} block>
        {product.is_out_of_stock ? "Out of stock" : selection.variant_id ? "Add to cart" : "Choose colour and size"}
      </Button>
    </Tile>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function MerchandisePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [category, setCategory] = useState<StoreCategory>("all");
  const [selections, setSelections] = useState<Record<string, VariantSelection>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState<Step>("shop");

  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "Kenya",
    shippingMethod: "dhl_express" as ShippingMethod,
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa");
  const [cardDetails, setCardDetails] = useState<CardDetails>({ cardNumber: "", expiryDate: "", cvv: "", cardholderName: "" });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  };
  useEffect(() => stopPolling, []);

  useEffect(() => {
    fetch("/api/products/list")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { products?: Product[] }) => setProducts(data.products ?? []))
      .catch(() => setProductsError("We couldn't load the store right now. Please try again shortly."))
      .finally(() => setProductsLoading(false));
  }, []);

  useEffect(() => {
    if (user) setCustomer((prev) => ({ ...prev, name: user.user_metadata?.full_name || "", email: user.email || "" }));
  }, [user]);

  const visibleProducts = useMemo(() => products.filter((p) => inCategory(p, category)), [products, category]);

  /* Cart */
  const addToCart = (product: Product) => {
    const sel = selections[product.id];
    const variant = sel?.variant_id ? product.variants.find((v) => v.id === sel.variant_id) : undefined;
    if (!variant) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.variant_id === variant.id);
      if (existing) {
        if (existing.quantity >= variant.stock_quantity) return prev;
        return prev.map((i) => (i.variant_id === variant.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [
        ...prev,
        {
          variant_id: variant.id,
          product_id: product.id,
          name: product.name,
          price: product.base_price,
          color_name: variant.color_name,
          size: variant.size,
          image: variant.image_url,
          quantity: 1,
          stock_available: variant.stock_quantity,
        },
      ];
    });
  };
  const updateQty = (idx: number, delta: number) =>
    setCart((prev) => prev.map((i, n) => (n === idx ? { ...i, quantity: Math.min(i.stock_available, Math.max(1, i.quantity + delta)) } : i)));
  const removeItem = (idx: number) => setCart((prev) => prev.filter((_, n) => n !== idx));

  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingOption = SHIPPING_METHODS.find((m) => m.id === customer.shippingMethod);
  const shippingCost = shippingOption?.price ?? 0;
  const total = subtotal + shippingCost;

  /* Checkout */
  const startPolling = (checkoutRequestId: string) => {
    stopPolling();
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > POLL_MAX_ATTEMPTS) {
        stopPolling();
        setStep("checkout");
        setErrorMsg("Payment timed out.");
        return;
      }
      try {
        const res = await fetch(`/api/payments/${checkoutRequestId}`);
        const data = await res.json();
        if (data.status === "confirmed") {
          stopPolling();
          setStep("success");
        } else if (data.status === "failed" || data.status === "cancelled") {
          stopPolling();
          setStep("checkout");
          setErrorMsg("Payment failed or was cancelled.");
        }
      } catch {
        // keep polling
      }
    }, POLL_INTERVAL_MS);
  };

  const handleCheckout = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`${ROUTES.login}?redirect=${ROUTES.store}`);
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          items: cart,
          total,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          shipping_address: customer.shippingMethod === "pickup" ? "Pickup from School" : `${customer.address}, ${customer.city}, ${customer.country}`,
          shipping_method: customer.shippingMethod,
          payment_method: paymentMethod,
        }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error);

      if (paymentMethod === "mpesa") {
        const mpesaRes = await fetch("/api/payments/stk-push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: customer.phone, amount: total, paymentType: "merchandise", userId: user.id, metadata: { order_id: order.order.id, items: cart } }),
        });
        const mpesaData = await mpesaRes.json();
        if (!mpesaRes.ok) throw new Error(mpesaData.message);
        setStep("awaiting-pin");
        startPolling(mpesaData.checkoutRequestID);
      } else {
        // TODO: card payments are not charged here yet (unchanged from the previous implementation).
        setStep("success");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <SiteShell>
        <Section spacing="last" style={{ paddingTop: "var(--space-24)", display: "flex", justifyContent: "center", color: "var(--brand)" }}>
          <Spinner size={32} label="Loading" />
        </Section>
      </SiteShell>
    );
  }

  /* ── Awaiting M-PESA PIN ── */
  if (step === "awaiting-pin") {
    return (
      <SiteShell>
        <Section spacing="last" style={{ paddingTop: "var(--space-24)" }}>
          <div className="ot-panel ot-panel--lg ot-fade-in" style={{ maxWidth: 480, margin: "0 auto", alignItems: "center", textAlign: "center" }} aria-live="polite">
            <h1 className="ot-h2">Enter your M-PESA PIN</h1>
            <p className="ot-body">
              A prompt was sent to <strong>{customer.phone}</strong>. Enter your PIN on your phone to authorise the payment of{" "}
              <strong>{kes(total)}</strong>.
            </p>
            <div className="ot-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                stopPolling();
                setStep("checkout");
              }}
            >
              Cancel payment
            </Button>
          </div>
        </Section>
      </SiteShell>
    );
  }

  /* ── Success ── */
  if (step === "success") {
    return (
      <SiteShell>
        <Section spacing="last" style={{ paddingTop: "var(--space-24)" }}>
          <div className="ot-stack ot-fade-in" style={{ maxWidth: 520, margin: "0 auto", alignItems: "center", textAlign: "center", gap: "var(--space-4)" }}>
            <span className="ui-badge ui-badge--success">Order confirmed</span>
            <h1 className="ot-display-sm">Thank you for your order</h1>
            <p className="ot-body">We will email you DHL tracking information shortly.</p>
            <ButtonLink href={ROUTES.memberDashboard} size="lg">
              View orders
            </ButtonLink>
          </div>
        </Section>
      </SiteShell>
    );
  }

  /* ── Checkout ── */
  if (step === "checkout") {
    const set = (key: keyof typeof customer) => (e: { target: { value: string } }) => setCustomer((p) => ({ ...p, [key]: e.target.value }));
    return (
      <SiteShell>
        <Section spacing="intro">
          <div className="ot-intro" style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: "var(--space-4)", flexWrap: "wrap" }}>
            <h1 className="ot-hero">Checkout</h1>
            <Button variant="ghost" onClick={() => setStep("shop")}>
              Return to shop
            </Button>
          </div>
        </Section>

        <Section spacing="last">
          <AutoGrid min={340} gap="var(--space-12)" style={{ alignItems: "start" }}>
            <form id="checkout-form" onSubmit={handleCheckout} className="ot-stack ot-span-2" style={{ gap: "var(--space-10)", minWidth: 0 }}>
              {errorMsg && <Notice tone="danger">{errorMsg}</Notice>}
              {!user && <Notice tone="info">You&rsquo;ll be asked to log in before payment.</Notice>}

              <fieldset className="ot-stack ot-rule-top" style={{ gap: "var(--space-4)", border: 0, margin: 0, padding: "var(--space-6) 0 0" }}>
                <legend className="ot-h3" style={{ float: "left", marginBottom: "var(--space-2)" }}>
                  Contact
                </legend>
                <AutoGrid min={220} gap="var(--space-4)">
                  <Field label="Email address" htmlFor="co-email" required>
                    <Input id="co-email" type="email" autoComplete="email" required value={customer.email} onChange={set("email")} />
                  </Field>
                  <Field label="Phone (M-PESA)" htmlFor="co-phone" required>
                    <Input id="co-phone" type="tel" autoComplete="tel" placeholder="07** *** ***" required value={customer.phone} onChange={set("phone")} />
                  </Field>
                </AutoGrid>
              </fieldset>

              <fieldset className="ot-stack ot-rule-top" style={{ gap: "var(--space-4)", border: 0, margin: 0, padding: "var(--space-6) 0 0" }}>
                <legend className="ot-h3" style={{ float: "left", marginBottom: "var(--space-2)" }}>
                  Shipping
                </legend>
                <Field label="Full name" htmlFor="co-name" required>
                  <Input id="co-name" autoComplete="name" required value={customer.name} onChange={set("name")} />
                </Field>
                {customer.shippingMethod !== "pickup" && (
                  <>
                    <Field label="Address" htmlFor="co-address" required>
                      <Input id="co-address" autoComplete="street-address" required value={customer.address} onChange={set("address")} />
                    </Field>
                    <AutoGrid min={200} gap="var(--space-4)">
                      <Field label="City" htmlFor="co-city" required>
                        <Input id="co-city" autoComplete="address-level2" required value={customer.city} onChange={set("city")} />
                      </Field>
                      <Field label="Country" htmlFor="co-country" required>
                        <NativeSelect id="co-country" options={SHIPPING_COUNTRIES} required value={customer.country} onChange={set("country")} />
                      </Field>
                    </AutoGrid>
                  </>
                )}
                <RadioGroup
                  name="shipping"
                  aria-label="Shipping method"
                  variant="card"
                  options={SHIPPING_METHODS.map((m) => ({
                    value: m.id,
                    label: `${m.label} · ${m.price === 0 ? "Free" : kes(m.price)}`,
                    description: m.time,
                  }))}
                  value={customer.shippingMethod}
                  onValueChange={(v) => setCustomer((p) => ({ ...p, shippingMethod: v }))}
                />
              </fieldset>

              <fieldset className="ot-stack ot-rule-top" style={{ gap: "var(--space-4)", border: 0, margin: 0, padding: "var(--space-6) 0 0" }}>
                <legend className="ot-h3" style={{ float: "left", marginBottom: "var(--space-2)" }}>
                  Payment
                </legend>
                <PaymentMethodSelector
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  cardDetails={cardDetails}
                  setCardDetails={setCardDetails}
                  currentFee={total}
                  isProcessing={submitting}
                />
              </fieldset>
            </form>

            <aside className="ot-panel ot-panel--lg ot-sticky">
              <h2 className="ot-title">Order summary</h2>
              <ul className="ot-stack" style={{ gap: "var(--space-4)", listStyle: "none", margin: 0, padding: 0 }}>
                {cart.map((item, i) => (
                  <li key={item.variant_id} className="ot-stack" style={{ gap: "var(--space-2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }} className="ot-dense">
                      <span>
                        {item.name}
                        <span className="ot-muted">
                          {" "}
                          · {item.color_name}, {item.size}
                        </span>
                      </span>
                      <strong>{kes(item.price * item.quantity)}</strong>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <Button size="sm" variant="outline" aria-label={`Decrease ${item.name}`} onClick={() => updateQty(i, -1)} disabled={item.quantity <= 1}>
                        −
                      </Button>
                      <span className="ot-dense" style={{ minWidth: 24, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                        {item.quantity}
                      </span>
                      <Button size="sm" variant="outline" aria-label={`Increase ${item.name}`} onClick={() => updateQty(i, 1)} disabled={item.quantity >= item.stock_available}>
                        +
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => removeItem(i)}>
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="ot-stack ot-dense ot-rule-top" style={{ gap: "var(--space-2)", paddingTop: "var(--space-4)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="ot-muted">Subtotal</span>
                  <span>{kes(subtotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <span className="ot-muted">Shipping ({shippingOption?.label})</span>
                  <span>{kes(shippingCost)}</span>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span className="ot-caption">Total</span>
                <span className="ot-h2" style={{ color: "var(--brand)" }}>
                  {kes(total)}
                </span>
              </div>
              <Button type="submit" form="checkout-form" size="lg" block loading={submitting} disabled={cart.length === 0}>
                {user ? `Pay ${kes(total)}` : "Log in to pay"}
              </Button>
            </aside>
          </AutoGrid>
        </Section>
      </SiteShell>
    );
  }

  /* ── Shop ── */
  return (
    <SiteShell bottomInset={cart.length > 0 ? 96 : undefined}>
      <PageIntro title="Official memorabilia" lede="Tailored blazers, crest ties and archival publications dispatchable worldwide via DHL international shipping." />

      <Section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap", marginBottom: "var(--space-8)" }}>
          <h2 className="ot-h2">Shop by category</h2>
          <ToggleGroup options={STORE_CATEGORIES} value={category} onValueChange={setCategory} aria-label="Product category" />
        </div>

        {productsLoading ? (
          <AutoGrid min={260} gap="var(--space-4)" fill>
            {[1, 2, 3].map((i) => (
              <div key={i} className="ot-media ot-media--photo ui-skeleton" aria-hidden="true" />
            ))}
          </AutoGrid>
        ) : productsError ? (
          <Notice tone="danger">{productsError}</Notice>
        ) : visibleProducts.length === 0 ? (
          <div style={{ background: "var(--bg-sunken)", padding: "var(--space-16) var(--space-6)" }}>
            <Empty
              title={products.length === 0 ? "The store is being stocked" : "Nothing in this category yet"}
              description="Blazers, crest ties and archival publications will appear here as they become available."
            />
          </div>
        ) : (
          <AutoGrid min={260} gap="var(--space-8) var(--space-4)" fill>
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                selection={selections[product.id] ?? { color: "", size: "", variant_id: "" }}
                onColor={(color) => setSelections((prev) => ({ ...prev, [product.id]: { color, size: "", variant_id: "" } }))}
                onSize={(size, variantId) => setSelections((prev) => ({ ...prev, [product.id]: { ...prev[product.id], size, variant_id: variantId } }))}
                onAdd={() => addToCart(product)}
              />
            ))}
          </AutoGrid>
        )}
      </Section>

      <FeatureBand title="Shipping worldwide" spacing="last">
        <p className="ot-body-relaxed">Orders are dispatched worldwide via DHL international shipping.</p>
        <ArrowLink href={ROUTES.contact}>Questions about an order</ArrowLink>
      </FeatureBand>

      {cart.length > 0 && (
          <div className="ot-cart-bar ot-scope" role="region" aria-label="Cart">
            <div className="ot-container ot-cart-bar-inner">
              <div className="ot-stack">
                <span className="ot-title">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
                <span className="ot-dense ot-muted">Subtotal {kes(subtotal)}</span>
              </div>
              <Button size="lg" onClick={() => setStep("checkout")}>
                Proceed to checkout
              </Button>
            </div>
          </div>
      )}
    </SiteShell>
  );
}
