"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteShell from "../components/site/SiteShell";
import { AutoGrid, Notice, PageIntro, Section } from "../components/site/primitives";
import PaymentMethodSelector, { type CardDetails, type PaymentMethod } from "../components/PaymentMethodSelector";
import StripeCheckout from "../components/StripeCheckout";
import { Button, Dialog, Field, Input, NativeSelect, Spinner } from "../components/ui";
import { COUNTRIES, REGISTRATION_FEE, ROUTES } from "../content/site";
import type { MembershipFormData, STKPushStatus } from "../types/member";

type AlertTone = "error" | "success" | "info";

interface AlertState {
  tone: AlertTone;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void;
}

const FORM_ID = "membership-form";
const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 60;

const EMPTY_FORM: MembershipFormData = {
  full_name: "",
  email: "",
  phone: "",
  password: "",
  graduation_year: "",
  course: "",
  country: "",
};

/** Numbered form block: "01 Personal details" on the left, fields on the right. */
function FormStep({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    <AutoGrid min={200} gap="var(--space-6)" className="ot-rule-top">
      <div className="ot-stack" style={{ gap: "var(--space-1)" }}>
        <span className="ot-caption">{index}</span>
        <h2 className="ot-h3">{title}</h2>
      </div>
      <div className="ot-stack ot-span-2" style={{ gap: "var(--space-4)", minWidth: 0 }}>
        {children}
      </div>
    </AutoGrid>
  );
}

export default function RegistrationPage() {
  const router = useRouter();
  const [form, setForm] = useState<MembershipFormData>(EMPTY_FORM);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa");
  const [cardDetails, setCardDetails] = useState<CardDetails>({ cardNumber: "", expiryDate: "", cvv: "", cardholderName: "" });
  const [showPassword, setShowPassword] = useState(false);
  // 1 = form, "card" = Stripe card entry, 2 = waiting for confirmation
  const [step, setStep] = useState<1 | "card" | 2>(1);
  const [card, setCard] = useState<{ clientSecret: string; intentId: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [stkStatus, setStkStatus] = useState<STKPushStatus>("idle");
  const [alert, setAlert] = useState<AlertState | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  };
  useEffect(() => stopPolling, []);

  const update = (key: keyof MembershipFormData) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const startPolling = (checkoutRequestID: string) => {
    stopPolling();
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > POLL_MAX_ATTEMPTS) {
        stopPolling();
        setStkStatus("failed");
        return;
      }
      try {
        const res = await fetch(`/api/payments/${checkoutRequestID}?verify_user=true`);
        const data = await res.json();
        if (data.status === "confirmed") {
          stopPolling();
          setStkStatus("success");
          setAlert({
            tone: "success",
            title: "Welcome to the Society",
            message: "Registration complete. Please check your email to verify and log in.",
            confirmText: "Log in",
            onConfirm: () => router.push(ROUTES.login),
          });
        } else if (data.status === "failed") {
          stopPolling();
          setStkStatus("failed");
        }
      } catch {
        // Transient network error: keep polling until the attempt limit.
      }
    }, POLL_INTERVAL_MS);
  };

  /** Card: the server creates the PaymentIntent and fixes the amount; Stripe collects the card. */
  const startCardPayment = async () => {
    const res = await fetch("/api/payments/stripe/registration-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationData: form }),
    });
    const data = await res.json();
    if (res.status === 409 && data.code === "account_exists") {
      setAlert({
        tone: "error",
        title: "Account exists",
        message: "This email is already registered.",
        confirmText: "Log in",
        onConfirm: () => router.push(ROUTES.login),
      });
      setLoading(false);
      return;
    }
    if (!res.ok || !data.clientSecret) throw new Error(data.error || "Could not start card payment.");
    setCard({ clientSecret: data.clientSecret, intentId: data.paymentIntentId });
    setStep("card");
    setLoading(false);
  };

  const initiatePayment = async (amount: number) => {
    if (paymentMethod === "visa") return startCardPayment();
    setStkStatus("initiating");
    const payload: Record<string, unknown> = {
      phoneNumber: form.phone,
      amount,
      paymentType: "registration",
      userEmail: form.email,
      userName: form.full_name,
      paymentMethod,
      registrationData: { ...form },
      metadata: { graduation_year: form.graduation_year, course: form.course, country: form.country },
    };
    // PayPal is disabled via FEATURES; only M-PESA reaches this point.
    if (paymentMethod !== "mpesa") throw new Error("This payment method is not available yet.");
    const res = await fetch("/api/payments/stk-push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Payment failed");

    if (paymentMethod === "mpesa" && data.checkoutRequestID) {
      setStkStatus("pending");
      setStep(2);
      startPolling(data.checkoutRequestID);
    } else if (data.redirect_url) {
      window.location.href = data.redirect_url;
    } else {
      router.push(ROUTES.login);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!form.full_name || !form.email || !form.password || !form.graduation_year || !form.country) {
        throw new Error("Please fill in all required fields.");
      }
      if (paymentMethod === "mpesa" && !form.phone) throw new Error("Phone number is required for M-PESA.");

      const check = await fetch(`/api/users/check?email=${encodeURIComponent(form.email)}`);
      const checkData = await check.json();
      if (checkData.exists) {
        setAlert({
          tone: "error",
          title: "Account exists",
          message: "This email is already registered.",
          confirmText: "Log in",
          onConfirm: () => router.push(ROUTES.login),
        });
        setLoading(false);
        return;
      }

      await initiatePayment(REGISTRATION_FEE);
    } catch (err) {
      setAlert({ tone: "error", title: "Something went wrong", message: err instanceof Error ? err.message : "Please try again." });
      setLoading(false);
    }
  };

  const alertDialog = (
    <Dialog open={!!alert} onClose={() => setAlert(null)} title={alert?.title} size="sm">
      {alert && (
        <div className="ot-scope ot-stack" style={{ gap: "var(--space-6)" }}>
          <Notice tone={alert.tone === "error" ? "danger" : alert.tone}>{alert.message}</Notice>
          <Button
            block
            onClick={() => {
              const next = alert.onConfirm;
              setAlert(null);
              next?.();
            }}
          >
            {alert.confirmText ?? "OK"}
          </Button>
        </div>
      )}
    </Dialog>
  );

  // ─── Step 2: waiting for M-PESA confirmation ───
  if (step === 2) {
    const copy = {
      pending:
        paymentMethod === "visa"
          ? { title: "Confirming your payment", body: "Your card payment went through. We're setting up your membership; this usually takes a few seconds." }
          : { title: "Check your phone", body: `Enter your M-PESA PIN on ${form.phone} to complete payment.` },
      success: { title: "Registration complete", body: "Check your email to verify your account, then log in." },
      failed: { title: "Payment failed", body: "Please contact support if payment was deducted." },
    } as const;
    const state = stkStatus === "success" ? "success" : stkStatus === "failed" ? "failed" : "pending";

    return (
      <SiteShell>
        <Section spacing="last" style={{ paddingTop: "var(--space-24)" }}>
          <div className="ot-panel ot-panel--lg ot-fade-in" style={{ maxWidth: 480, margin: "0 auto", alignItems: "center", textAlign: "center" }} aria-live="polite">
            {state === "pending" && (
              <span style={{ color: "var(--brand)" }}>
                <Spinner size={40} label="Waiting for payment" />
              </span>
            )}
            <h1 className="ot-h2">{copy[state].title}</h1>
            <p className="ot-body">{copy[state].body}</p>
            {state === "failed" && (
              <Button
                variant="outline"
                onClick={() => {
                  setStep(1);
                  setLoading(false);
                  setStkStatus("idle");
                }}
              >
                Try again
              </Button>
            )}
            {state === "success" && (
              <Button onClick={() => router.push(ROUTES.login)}>Log in</Button>
            )}
          </div>
        </Section>
        {alertDialog}
      </SiteShell>
    );
  }

  // ─── Card step: Stripe Payment Element ───
  if (step === "card" && card) {
    return (
      <SiteShell>
        <Section spacing="last" style={{ paddingTop: "var(--space-16)" }}>
          <div className="ot-stack ot-fade-in" style={{ maxWidth: 520, margin: "0 auto", gap: "var(--space-6)" }}>
            <div className="ot-stack" style={{ gap: "var(--space-2)" }}>
              <span className="ot-caption">Secure card payment</span>
              <h1 className="ot-h2">Pay KES {REGISTRATION_FEE.toLocaleString()}</h1>
              <p className="ot-body ot-muted">
                Lifetime membership for {form.full_name}. Your account is created as soon as the payment succeeds.
              </p>
            </div>
            <StripeCheckout
              clientSecret={card.clientSecret}
              payLabel={`Pay KES ${REGISTRATION_FEE.toLocaleString()}`}
              onSuccess={() => {
                setStkStatus("pending");
                setStep(2);
                startPolling(card.intentId);
              }}
              onError={(message) => setAlert({ tone: "error", title: "Payment failed", message })}
            />
            <Button
              variant="ghost"
              onClick={() => {
                setCard(null);
                setStep(1);
              }}
            >
              Back to registration
            </Button>
          </div>
        </Section>
        {alertDialog}
      </SiteShell>
    );
  }

  // ─── Step 1: registration form ───
  return (
    <SiteShell>
      <PageIntro eyebrow="Membership registration" title="Join the Old Turians" lede="Become part of a distinguished community of Turi alumni worldwide." />

      <Section spacing="last">
        <AutoGrid min={340} gap="var(--space-12)" style={{ alignItems: "start" }}>
          <form id={FORM_ID} onSubmit={handleSubmit} className="ot-stack ot-span-2" style={{ gap: "var(--space-12)", minWidth: 0 }}>
            <FormStep index="01" title="Personal details">
              <Field label="Full name" htmlFor="m-name" required>
                <Input id="m-name" autoComplete="name" required value={form.full_name} onChange={update("full_name")} />
              </Field>
              <Field label="Email address" htmlFor="m-email" required>
                <Input id="m-email" type="email" autoComplete="email" required value={form.email} onChange={update("email")} />
              </Field>
              <Field label="Password" htmlFor="m-pass" required description="At least 6 characters.">
                <Input
                  id="m-pass"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={form.password}
                  onChange={update("password")}
                  trailing={
                    <button
                      type="button"
                      className="ot-dense"
                      style={{ background: "none", border: 0, padding: 0, cursor: "pointer", color: "var(--brand)", fontWeight: 600, fontFamily: "inherit" }}
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  }
                />
              </Field>
            </FormStep>

            <FormStep index="02" title="Academic details">
              <AutoGrid min={180} gap="var(--space-4)">
                <Field label="Graduation year" htmlFor="m-year" required>
                  <Input id="m-year" inputMode="numeric" placeholder="e.g. 2004" required pattern="\d{4}" maxLength={4} value={form.graduation_year} onChange={update("graduation_year")} />
                </Field>
                <Field label="Course (optional)" htmlFor="m-course">
                  <Input id="m-course" value={form.course} onChange={update("course")} />
                </Field>
              </AutoGrid>
              <Field label="Country of residence" htmlFor="m-country" required>
                <NativeSelect id="m-country" options={COUNTRIES} placeholder="Select country" required value={form.country} onChange={update("country")} />
              </Field>
            </FormStep>

            <FormStep index="03" title="Payment method">
              <PaymentMethodSelector
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                cardDetails={cardDetails}
                setCardDetails={setCardDetails}
                currentFee={REGISTRATION_FEE}
                isProcessing={loading}
                showNotes={paymentMethod !== "mpesa"}
                collectCardDetails={false}
              />
              {paymentMethod === "mpesa" && (
                <Field
                  label="M-PESA phone number"
                  htmlFor="m-phone"
                  required
                  description={`You will receive an STK push on your phone. Enter your M-PESA PIN to authorize the payment of KES ${REGISTRATION_FEE.toLocaleString()}.`}
                >
                  <Input id="m-phone" type="tel" autoComplete="tel" placeholder="07** *** ***" required value={form.phone} onChange={update("phone")} />
                </Field>
              )}
            </FormStep>
          </form>

          <aside className="ot-panel ot-panel--lg ot-sticky">
            <div className="ot-stack" style={{ gap: "var(--space-2)" }}>
              <span className="ot-caption">Total due</span>
              <span className="ot-stat">KES {REGISTRATION_FEE.toLocaleString()}</span>
              <span className="ot-dense" style={{ color: "var(--ink-2)" }}>
                Lifetime membership
              </span>
            </div>
            <Button type="submit" form={FORM_ID} size="lg" block loading={loading}>
              Complete registration
            </Button>
            <p className="ot-dense ot-muted">
              Already a member?{" "}
              <Link href={ROUTES.login} className="ot-underline">
                Sign in to your account
              </Link>
            </p>
          </aside>
        </AutoGrid>
      </Section>
      {alertDialog}
    </SiteShell>
  );
}
