"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../(backend)/context/auth";
import SiteShell from "../../components/site/SiteShell";
import { AutoGrid, ImageFrame, Notice, Section } from "../../components/site/primitives";
import { ShopNav } from "../../components/shop/ShopParts";
import PaymentMethodSelector, { type CardDetails, type PaymentMethod } from "../../components/PaymentMethodSelector";
import StripeCheckout from "../../components/StripeCheckout";
import { Button, ButtonLink, Empty, Field, Input, NativeSelect, RadioGroup, Spinner } from "../../components/ui";
import { ROUTES, SHIPPING_COUNTRIES, SHIPPING_METHODS } from "../../content/site";
import { useCart } from "../../lib/cart";
import { categoryHref, kes } from "../../lib/products";
import type { ShippingMethod } from "../../types/merchandise";

type Step = "checkout" | "awaiting-pin" | "card-payment" | "success";

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 40;

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { items: cart, ready: cartReady, subtotal, clear } = useCart();
  const [step, setStep] = useState<Step>("checkout");

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
  const [cardClientSecret, setCardClientSecret] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  // Amount actually charged, kept after the basket is cleared on success.
  const [chargedTotal, setChargedTotal] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  };
  useEffect(() => stopPolling, []);

  useEffect(() => {
    if (user) setCustomer((prev) => ({ ...prev, name: user.user_metadata?.full_name || "", email: user.email || "" }));
  }, [user]);

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
          clear();
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
      router.push(`${ROUTES.login}?redirect=${ROUTES.storeCheckout}`);
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    setChargedTotal(total);
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
      // Show the total the server priced the order at.
      if (typeof order.order?.total === "number") setChargedTotal(order.order.total);

      if (paymentMethod === "mpesa") {
        const mpesaRes = await fetch("/api/payments/stk-push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: customer.phone, paymentType: "merchandise", metadata: { order_id: order.order.id } }),
        });
        const mpesaData = await mpesaRes.json();
        if (!mpesaRes.ok) throw new Error(mpesaData.message);
        setStep("awaiting-pin");
        startPolling(mpesaData.checkoutRequestID);
      } else if (paymentMethod === "visa") {
        // Card: create a PaymentIntent for this order. The server charges the order total from the
        // database; the card itself is collected by Stripe's Payment Element on the next step.
        const intentRes = await fetch("/api/payments/stripe/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Math.round(total * 100),
            currency: "KES",
            customerEmail: customer.email,
            metadata: {
              payment_type: "merchandise",
              order_id: order.order.id,
              user_id: user.id,
              attendee_name: customer.name,
              attendee_email: customer.email,
              attendee_phone: customer.phone,
            },
          }),
        });
        const intent = await intentRes.json();
        if (!intentRes.ok || !intent.clientSecret) throw new Error(intent.error || "Could not start card payment.");
        setCardClientSecret(intent.clientSecret);
        setStep("card-payment");
      } else {
        throw new Error("This payment method is not available yet.");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !cartReady) {
    return (
      <SiteShell>
        <Section spacing="last" style={{ paddingTop: "var(--space-24)", display: "flex", justifyContent: "center", color: "var(--brand)" }}>
          <Spinner size={32} label="Loading" />
        </Section>
      </SiteShell>
    );
  }

  /* ── Admin accounts don't shop ── */
  if (user?.role === "admin") {
    return (
      <SiteShell>
        <Section spacing="last" style={{ paddingTop: "var(--space-16)" }}>
          <Empty
            title="Shop checkout is for members"
            description="Admin accounts can't place orders. Log in with a member account to buy from the shop."
            actions={<ButtonLink href={ROUTES.adminDashboard}>Back to the society office</ButtonLink>}
          />
        </Section>
      </SiteShell>
    );
  }

  /* ── Card payment (Stripe Payment Element) ── */
  if (step === "card-payment" && cardClientSecret) {
    return (
      <SiteShell>
        <Section spacing="last" style={{ paddingTop: "var(--space-16)" }}>
          <div className="ot-stack ot-fade-in" style={{ maxWidth: 520, margin: "0 auto", gap: "var(--space-6)" }}>
            <div className="ot-stack" style={{ gap: "var(--space-2)" }}>
              <span className="ot-caption">Secure card payment</span>
              <h1 className="ot-h2">Pay {kes(chargedTotal)}</h1>
              <p className="ot-body ot-muted">Your order has been created and will be confirmed as soon as the payment succeeds.</p>
            </div>
            {errorMsg && <Notice tone="danger">{errorMsg}</Notice>}
            <StripeCheckout
              clientSecret={cardClientSecret}
              payLabel={`Pay ${kes(chargedTotal)}`}
              onSuccess={() => {
                setErrorMsg("");
                clear();
                setStep("success");
              }}
              onError={setErrorMsg}
            />
            <Button
              variant="ghost"
              onClick={() => {
                setCardClientSecret(null);
                setErrorMsg("");
                setStep("checkout");
              }}
            >
              Back to checkout
            </Button>
          </div>
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
              <strong>{kes(chargedTotal)}</strong>.
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
  if (step === "checkout" && cart.length === 0) {
    return (
      <SiteShell>
        <ShopNav />
        <Section spacing="last" style={{ paddingTop: "var(--space-16)" }}>
          <Empty title="Your basket is empty" description="Add something from the shop before checking out." actions={<ButtonLink href={categoryHref("all")}>Browse the shop</ButtonLink>} />
        </Section>
      </SiteShell>
    );
  }

  if (step === "checkout") {
    const set = (key: keyof typeof customer) => (e: { target: { value: string } }) => setCustomer((p) => ({ ...p, [key]: e.target.value }));
    return (
      <SiteShell>
        <Section spacing="intro">
          <div className="ot-intro" style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: "var(--space-4)", flexWrap: "wrap" }}>
            <h1 className="ot-hero">Checkout</h1>
            <Link href={ROUTES.storeBasket} className="ot-arrow-link">
              Back to basket
            </Link>
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
                  collectCardDetails={false}
                />
              </fieldset>
            </form>

            <aside className="ot-panel ot-panel--lg ot-sticky">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "var(--space-3)" }}>
                <h2 className="ot-title">Order summary</h2>
                <Link href={ROUTES.storeBasket} className="ot-dense ot-underline">
                  Edit basket
                </Link>
              </div>
              <ul className="ot-stack" style={{ gap: "var(--space-4)", listStyle: "none", margin: 0, padding: 0 }}>
                {cart.map((item) => (
                  <li key={item.variant_id} style={{ display: "grid", gridTemplateColumns: "56px 1fr auto", gap: "var(--space-3)", alignItems: "center" }} className="ot-dense">
                    <ImageFrame aspect="square" src={item.image} alt="" placeholder="" />
                    <span>
                      {item.name}
                      <span className="ot-muted" style={{ display: "block" }}>
                        {item.color_name}, {item.size} · Qty {item.quantity}
                      </span>
                    </span>
                    <strong>{kes(item.price * item.quantity)}</strong>
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

  return null;
}
