"use client";

import type { Dispatch, SetStateAction } from "react";
import { FEATURES } from "../../(backend)/lib/features/features";
import { Field, Input, RadioGroup, type RadioOption } from "./ui";

export type PaymentMethod = "mpesa" | "visa" | "paypal";

export interface CardDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

export type CardBrand = "visa" | "mastercard" | "amex" | "unknown";

export const detectCardType = (number: string): CardBrand => {
  const clean = number.replace(/\D/g, "");
  if (/^4/.test(clean)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(clean)) return "mastercard";
  if (/^3[47]/.test(clean)) return "amex";
  return "unknown";
};

export const formatCardNumber = (value: string) => {
  const clean = value.replace(/\D/g, "");
  if (detectCardType(clean) === "amex") {
    return clean.slice(0, 15).replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_, p1, p2, p3) => [p1, p2, p3].filter(Boolean).join(" "));
  }
  return clean.slice(0, 16).replace(/(\d{4})/g, "$1 ").trim();
};

export const formatExpiry = (value: string) => {
  const clean = value.replace(/\D/g, "").slice(0, 4);
  return clean.length >= 3 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean;
};

const CARD_LOGOS: Record<Exclude<CardBrand, "unknown">, { src: string; alt: string }> = {
  visa: { src: "/images.png", alt: "Visa" },
  mastercard: { src: "/mastercard.png", alt: "Mastercard" },
  amex: { src: "/amex.png", alt: "Amex" },
};

const METHOD_ENABLED: Record<PaymentMethod, boolean> = {
  mpesa: FEATURES.mpesa.enabled,
  visa: FEATURES.card.enabled,
  paypal: FEATURES.paypal.enabled,
};

function methodOptions(): RadioOption<PaymentMethod>[] {
  const base: Array<{ value: PaymentMethod; label: string; description: string }> = [
    { value: "mpesa", label: "M-PESA", description: "Kenya" },
    { value: "visa", label: "Card", description: "Visa / Mastercard" },
    { value: "paypal", label: "PayPal", description: "Global" },
  ];
  return base.map((m) => ({
    ...m,
    disabled: !METHOD_ENABLED[m.value],
    description: METHOD_ENABLED[m.value] ? m.description : `${m.description} · Soon`,
  }));
}

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (m: PaymentMethod) => void;
  cardDetails: CardDetails;
  setCardDetails: Dispatch<SetStateAction<CardDetails>>;
  /** Amount in KES shown in the method notes. */
  currentFee: number;
  isProcessing: boolean;
  /** Show the explanatory note under M-PESA / PayPal. Set false when the parent renders its own. */
  showNotes?: boolean;
}

export default function PaymentMethodSelector({
  paymentMethod,
  setPaymentMethod,
  cardDetails,
  setCardDetails,
  currentFee,
  isProcessing,
  showNotes = true,
}: PaymentMethodSelectorProps) {
  const brand = detectCardType(cardDetails.cardNumber);
  const logo = brand !== "unknown" ? CARD_LOGOS[brand] : null;
  const fee = `KES ${currentFee.toLocaleString()}`;

  return (
    <div className="ot-stack" style={{ gap: "var(--space-4)" }}>
      <RadioGroup
        name="payment-method"
        aria-label="Payment method"
        variant="card"
        orientation="horizontal"
        options={methodOptions()}
        value={paymentMethod}
        onValueChange={setPaymentMethod}
        disabled={isProcessing}
      />

      {showNotes && paymentMethod === "mpesa" && (
        <p className="ot-dense ot-muted">
          You will receive an STK push on your phone. Enter your M-PESA PIN to authorize the payment of {fee}.
        </p>
      )}

      {showNotes && paymentMethod === "paypal" && (
        <p className="ot-dense ot-muted">You will be redirected to PayPal to complete the payment of {fee}.</p>
      )}

      {paymentMethod === "visa" && (
        <div className="ot-stack" style={{ gap: "var(--space-4)" }}>
          <Field label="Card number" htmlFor="card-number" required>
            <Input
              id="card-number"
              inputMode="numeric"
              autoComplete="cc-number"
              maxLength={19}
              placeholder="0000 0000 0000 0000"
              value={cardDetails.cardNumber}
              onChange={(e) => setCardDetails((p) => ({ ...p, cardNumber: formatCardNumber(e.target.value) }))}
              style={{ fontVariantNumeric: "tabular-nums" }}
              trailing={
                // eslint-disable-next-line @next/next/no-img-element
                logo ? <img src={logo.src} alt={logo.alt} style={{ height: 20, width: "auto" }} /> : undefined
              }
            />
          </Field>
          <div className="ot-grid" style={{ ["--ot-min" as string]: "140px", gap: "var(--space-4)" }}>
            <Field label="Expiry" htmlFor="card-expiry" required>
              <Input
                id="card-expiry"
                inputMode="numeric"
                autoComplete="cc-exp"
                maxLength={5}
                placeholder="MM/YY"
                value={cardDetails.expiryDate}
                onChange={(e) => setCardDetails((p) => ({ ...p, expiryDate: formatExpiry(e.target.value) }))}
              />
            </Field>
            <Field label="CVV" htmlFor="card-cvv" required>
              <Input
                id="card-cvv"
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                maxLength={4}
                placeholder="•••"
                value={cardDetails.cvv}
                onChange={(e) => setCardDetails((p) => ({ ...p, cvv: e.target.value.replace(/\D/g, "") }))}
              />
            </Field>
          </div>
          <Field label="Cardholder name" htmlFor="card-name" required>
            <Input
              id="card-name"
              autoComplete="cc-name"
              placeholder="Name as it appears on card"
              value={cardDetails.cardholderName}
              onChange={(e) => setCardDetails((p) => ({ ...p, cardholderName: e.target.value }))}
            />
          </Field>
        </div>
      )}
    </div>
  );
}
