"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "../../../../(backend)/context/auth";
import SiteShell from "../../../components/site/SiteShell";
import { AutoGrid, ImageFrame, Notice, Section } from "../../../components/site/primitives";
import PaymentMethodSelector, { type CardDetails, type PaymentMethod } from "../../../components/PaymentMethodSelector";
import StripeCheckout from "../../../components/StripeCheckout";
import { Button, ButtonLink, Empty, Field, Input, Spinner } from "../../../components/ui";
import { ROUTES } from "../../../content/site";
import { kes } from "../../../lib/products";
import type { AlumniEvent } from "../../../types/event";

type Step = "form" | "awaiting-pin" | "card-payment" | "success";

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 40;

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export default function EventRegistrationPage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params?.eventId;
  const { user } = useAuth();

  const [event, setEvent] = useState<AlumniEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa");
  const [cardDetails, setCardDetails] = useState<CardDetails>({ cardNumber: "", expiryDate: "", cvv: "", cardholderName: "" });
  const [cardClientSecret, setCardClientSecret] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  };
  useEffect(() => stopPolling, []);

  useEffect(() => {
    if (user) setForm((prev) => ({ ...prev, name: prev.name || user.user_metadata?.full_name || "", email: prev.email || user.email || "" }));
  }, [user]);

  useEffect(() => {
    if (!eventId) return;
    fetch(`/api/events/${eventId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setEvent(data && data.id ? { ...data, id: String(data.id) } : null))
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [eventId]);

  const update = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const startPolling = (checkoutRequestId: string) => {
    stopPolling();
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > POLL_MAX_ATTEMPTS) {
        stopPolling();
        setStep("form");
        setError("We didn't receive confirmation from M-PESA in time. If you were charged, contact the alumni office.");
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
          setStep("form");
          setError("The M-PESA payment failed or was cancelled. Please try again.");
        }
      } catch {
        // keep polling
      }
    }, POLL_INTERVAL_MS);
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setSubmitting(true);
    setError("");
    const attendee = { attendee_name: form.name, attendee_email: form.email, attendee_phone: form.phone };

    try {
      if (!event.price) {
        // Free event: register directly.
        const res = await fetch("/api/events/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_id: event.id, user_id: user?.id ?? null, is_member: !!user, ...attendee }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Registration failed. Please try again.");
        setStep("success");
      } else if (paymentMethod === "mpesa") {
        const res = await fetch("/api/payments/stk-push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: form.phone,
            amount: event.price,
            paymentType: "event",
            userId: user?.id || null,
            metadata: { event_id: event.id, ...attendee },
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.checkoutRequestID) throw new Error(data.message || "Could not start the M-PESA payment.");
        setStep("awaiting-pin");
        startPolling(data.checkoutRequestID);
      } else if (paymentMethod === "visa") {
        // The server prices the PaymentIntent from the event record; the webhook records the registration.
        const res = await fetch("/api/payments/stripe/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Math.round(event.price * 100),
            currency: "KES",
            customerEmail: form.email,
            metadata: { payment_type: "event", event_id: event.id, event_name: event.name, user_id: user?.id || "", ...attendee, registration_type: user ? "member" : "guest" },
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.clientSecret) throw new Error(data.error || "Could not start card payment.");
        setCardClientSecret(data.clientSecret);
        setStep("card-payment");
      } else {
        throw new Error("This payment method is not available yet.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading / not found ── */
  if (loading) {
    return (
      <SiteShell>
        <Section spacing="last" style={{ paddingTop: "var(--space-24)", display: "flex", justifyContent: "center", color: "var(--brand)" }}>
          <Spinner size={32} label="Loading event" />
        </Section>
      </SiteShell>
    );
  }
  if (!event) {
    return (
      <SiteShell>
        <Section spacing="last" style={{ paddingTop: "var(--space-16)" }}>
          <Empty title="Event not found" description="It may have ended or been removed." actions={<ButtonLink href={ROUTES.events}>See all events</ButtonLink>} />
        </Section>
      </SiteShell>
    );
  }

  const isFull = !!event.max_attendees && event.current_attendees >= event.max_attendees;
  const isPast = new Date(event.event_date) < new Date(new Date().toDateString());

  /* ── Result / payment screens ── */
  if (step === "success") {
    return (
      <SiteShell>
        <Section spacing="last" style={{ paddingTop: "var(--space-24)" }}>
          <div className="ot-stack ot-fade-in" style={{ maxWidth: 560, margin: "0 auto", alignItems: "center", textAlign: "center", gap: "var(--space-4)" }}>
            <span className="ui-badge ui-badge--success">Registration confirmed</span>
            <h1 className="ot-display-sm">See you at {event.name}</h1>
            <p className="ot-body">
              {longDate(event.event_date)}
              {event.location ? `, ${event.location}` : ""}. A confirmation email is on its way to {form.email}.
            </p>
            <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", justifyContent: "center" }}>
              <ButtonLink href={ROUTES.events} size="lg">
                More events
              </ButtonLink>
              {user && (
                <ButtonLink href={`${ROUTES.memberDashboard}?tab=events`} size="lg" variant="outline">
                  My dashboard
                </ButtonLink>
              )}
            </div>
          </div>
        </Section>
      </SiteShell>
    );
  }

  if (step === "awaiting-pin") {
    return (
      <SiteShell>
        <Section spacing="last" style={{ paddingTop: "var(--space-24)" }}>
          <div className="ot-panel ot-panel--lg ot-fade-in" style={{ maxWidth: 480, margin: "0 auto", alignItems: "center", textAlign: "center" }} aria-live="polite">
            <h1 className="ot-h2">Enter your M-PESA PIN</h1>
            <p className="ot-body">
              A prompt was sent to <strong>{form.phone}</strong> to pay <strong>{kes(event.price)}</strong> for {event.name}.
            </p>
            <div className="ot-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <Button variant="ghost" onClick={() => { stopPolling(); setStep("form"); }}>
              Cancel
            </Button>
          </div>
        </Section>
      </SiteShell>
    );
  }

  if (step === "card-payment" && cardClientSecret) {
    return (
      <SiteShell>
        <Section spacing="last" style={{ paddingTop: "var(--space-16)" }}>
          <div className="ot-stack ot-fade-in" style={{ maxWidth: 520, margin: "0 auto", gap: "var(--space-6)" }}>
            <div className="ot-stack" style={{ gap: "var(--space-2)" }}>
              <span className="ot-caption">Secure card payment</span>
              <h1 className="ot-h2">Pay {kes(event.price)}</h1>
              <p className="ot-body ot-muted">{event.name}</p>
            </div>
            {error && <Notice tone="danger">{error}</Notice>}
            <StripeCheckout clientSecret={cardClientSecret} payLabel={`Pay ${kes(event.price)}`} onSuccess={() => setStep("success")} onError={setError} />
            <Button variant="ghost" onClick={() => { setCardClientSecret(null); setError(""); setStep("form"); }}>
              Back
            </Button>
          </div>
        </Section>
      </SiteShell>
    );
  }

  /* ── Form ── */
  return (
    <SiteShell>
      <Section spacing="intro" style={{ paddingTop: "var(--space-10)" }}>
        <nav className="ot-breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: "var(--space-6)" }}>
          <Link href={ROUTES.events}>Events</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{event.name}</span>
        </nav>
        <AutoGrid min={320} className="ot-intro">
          <div className="ot-stack" style={{ gap: "var(--space-3)" }}>
            <span className="ot-caption">Event registration</span>
            <h1 className="ot-hero">{event.name}</h1>
          </div>
          <dl className="ot-dl" style={{ gridTemplateColumns: "1fr" }}>
            <div>
              <dt>When</dt>
              <dd>{longDate(event.event_date)}</dd>
            </div>
            {event.location && (
              <div>
                <dt>Where</dt>
                <dd>{event.location}</dd>
              </div>
            )}
            {event.max_attendees ? (
              <div>
                <dt>Places</dt>
                <dd>
                  {event.current_attendees} of {event.max_attendees} taken
                </dd>
              </div>
            ) : null}
          </dl>
        </AutoGrid>
      </Section>

      <Section spacing="last">
        <AutoGrid min={340} gap="var(--space-12)" style={{ alignItems: "start" }}>
          <div className="ot-stack ot-span-2" style={{ gap: "var(--space-10)", minWidth: 0 }}>
            {event.image_url && <ImageFrame aspect="wide" src={event.image_url} alt={event.name} />}
            {event.description && (
              <div className="ot-stack" style={{ gap: "var(--space-3)" }}>
                <h2 className="ot-h3">About this event</h2>
                <p className="ot-body-relaxed" style={{ whiteSpace: "pre-line" }}>
                  {event.description}
                </p>
              </div>
            )}

            {isPast || isFull ? (
              <Notice tone="info">{isPast ? "This event has already taken place." : "This event is fully booked."}</Notice>
            ) : (
              <form id="event-form" onSubmit={handleRegister} className="ot-stack ot-rule-top" style={{ gap: "var(--space-6)" }}>
                <h2 className="ot-h3">Your details</h2>
                {error && <Notice tone="danger">{error}</Notice>}
                <AutoGrid min={220} gap="var(--space-4)">
                  <Field label="Full name" htmlFor="ev-name" required>
                    <Input id="ev-name" autoComplete="name" required value={form.name} onChange={update("name")} />
                  </Field>
                  <Field label="Email address" htmlFor="ev-email" required>
                    <Input id="ev-email" type="email" autoComplete="email" required value={form.email} onChange={update("email")} />
                  </Field>
                </AutoGrid>
                <Field
                  label={paymentMethod === "mpesa" && event.price ? "M-PESA phone number" : "Phone number"}
                  htmlFor="ev-phone"
                  required
                  description={paymentMethod === "mpesa" && event.price ? "You'll receive an STK push to authorise the payment." : undefined}
                >
                  <Input id="ev-phone" type="tel" autoComplete="tel" placeholder="07** *** ***" required value={form.phone} onChange={update("phone")} />
                </Field>

                {event.price > 0 && (
                  <div className="ot-stack" style={{ gap: "var(--space-4)" }}>
                    <h2 className="ot-h3">Payment method</h2>
                    <PaymentMethodSelector
                      paymentMethod={paymentMethod}
                      setPaymentMethod={setPaymentMethod}
                      cardDetails={cardDetails}
                      setCardDetails={setCardDetails}
                      currentFee={event.price}
                      isProcessing={submitting}
                      showNotes={paymentMethod !== "mpesa"}
                      collectCardDetails={false}
                    />
                  </div>
                )}
              </form>
            )}
          </div>

          <aside className="ot-panel ot-panel--lg ot-sticky">
            <div className="ot-stack" style={{ gap: "var(--space-2)" }}>
              <span className="ot-caption">Ticket price</span>
              <span className="ot-stat">{event.price ? kes(event.price) : "Free"}</span>
            </div>
            {!isPast && !isFull && (
              <Button type="submit" form="event-form" size="lg" block loading={submitting}>
                {event.price ? `Register and pay ${kes(event.price)}` : "Register"}
              </Button>
            )}
            {!user && (
              <p className="ot-dense ot-muted">
                Already a member?{" "}
                <Link href={`${ROUTES.login}?redirect=${encodeURIComponent(`/events/register/${event.id}`)}`} className="ot-underline">
                  Sign in
                </Link>{" "}
                to fill in your details.
              </p>
            )}
          </aside>
        </AutoGrid>
      </Section>
    </SiteShell>
  );
}
