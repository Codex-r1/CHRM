"use client";

import { useState, type FormEvent } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "./ui";
import { Notice } from "./site/primitives";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface StripeCheckoutProps {
  clientSecret: string;
  /** Label for the pay button, e.g. "Pay KES 4,500". */
  payLabel?: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (message: string) => void;
}

function CheckoutForm({ payLabel = "Pay securely", onSuccess, onError }: Omit<StripeCheckoutProps, "clientSecret">) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/payment-success` },
      redirect: "if_required",
    });

    if (error) {
      onError(error.message || "Payment failed");
      setLoading(false);
    } else if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
      onSuccess(paymentIntent.id);
    } else {
      onError(`Payment was not completed (status: ${paymentIntent?.status ?? "unknown"}).`);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="ot-stack" style={{ gap: "var(--space-6)" }}>
      <PaymentElement />
      <Button type="submit" size="lg" block loading={loading} disabled={!stripe}>
        {payLabel}
      </Button>
      <p className="ot-caption">Card details are handled by Stripe and never reach our servers.</p>
    </form>
  );
}

/** Stripe Payment Element bound to an existing PaymentIntent. */
export default function StripeCheckout({ clientSecret, ...rest }: StripeCheckoutProps) {
  if (!stripePromise) {
    return <Notice tone="danger">Card payments are not configured (missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).</Notice>;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#1e3a8a",
            colorText: "#0d0d1a",
            colorDanger: "#a6182c",
            fontFamily: "Manrope, system-ui, sans-serif",
            borderRadius: "12px",
          },
        },
        fonts: [{ cssSrc: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap" }],
      }}
    >
      <CheckoutForm {...rest} />
    </Elements>
  );
}
