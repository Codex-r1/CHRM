"use client";

import { Smartphone, CreditCard, Wallet } from "lucide-react";
import { FEATURES } from "../../(backend)/lib/features/features";

export type PaymentMethod = 'mpesa' | 'visa' | 'paypal';

export interface CardDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

export const detectCardType = (number: string) => {
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

export default function PaymentMethodSelector({
  paymentMethod, setPaymentMethod, cardDetails, setCardDetails, currentFee, isProcessing
}: {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (m: PaymentMethod) => void;
  cardDetails: CardDetails;
  setCardDetails: React.Dispatch<React.SetStateAction<CardDetails>>;
  currentFee: number;
  isProcessing: boolean;
}) {
  const methods = [
    { id: 'mpesa' as PaymentMethod, label: 'M-PESA', sub: 'Kenya', icon: Smartphone, enabled: true },
    { id: 'visa' as PaymentMethod, label: 'Card', sub: 'Visa / Mastercard', icon: CreditCard, enabled: true },
    { id: 'paypal' as PaymentMethod, label: 'PayPal', sub: 'Global', icon: Wallet, enabled: FEATURES.paypal.enabled },
  ];

  const cardType = detectCardType(cardDetails.cardNumber);

  const getCardLogo = () => {
    switch (cardType) {
      case "visa": return <img src="/images.png" alt="Visa" className="h-6 w-auto object-contain" />;
      case "mastercard": return <img src="/mastercard.png" alt="Mastercard" className="h-6 w-auto object-contain" />;
      case "amex": return <img src="/amex.png" alt="Amex" className="h-6 w-auto object-contain" />;
      default: return <CreditCard size={18} className="text-[#1B3A6B]/20" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-2">
        {methods.map((m) => {
          const isSelected = paymentMethod === m.id;
          const isDisabled = !m.enabled || isProcessing;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => !isDisabled && setPaymentMethod(m.id)}
              disabled={isDisabled}
              className={`relative flex flex-col items-center justify-center gap-1 border py-3 px-2 transition-all ${
                !m.enabled ? "opacity-40 cursor-not-allowed border-gray-200 bg-gray-50" :
                isSelected ? "border-[#1B3A6B] bg-[#1B3A6B]/5" : "border-[#1B3A6B]/15 hover:border-[#1B3A6B]/30"
              }`}
            >
              {!m.enabled && (
                <span className="absolute -top-2 right-1 text-[8px] font-bold uppercase bg-white px-1 border border-[#C9A84C] text-[#C9A84C]">Soon</span>
              )}
              <m.icon size={18} className={isSelected ? "text-[#1B3A6B]" : "text-[#1B3A6B]/50"} />
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${isSelected ? "text-[#1B3A6B]" : "text-[#1B3A6B]/50"}`}>{m.label}</span>
              <span className="text-[9px] text-[#1B3A6B]/40">{m.sub}</span>
            </button>
          );
        })}
      </div>

      {paymentMethod === 'visa' && (
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1B3A6B] mb-1">Card Number</label>
            <div className="relative flex items-center">
              <input
                type="text" maxLength={19} value={cardDetails.cardNumber}
                onChange={(e) => setCardDetails(p => ({ ...p, cardNumber: formatCardNumber(e.target.value) }))}
                className="w-full border-b border-[#1B3A6B]/30 bg-transparent py-2 pr-12 text-sm text-[#1B3A6B] focus:border-[#1B3A6B] focus:outline-none transition-colors font-mono"
                placeholder="0000 0000 0000 0000"
              />
              <div className="absolute right-0 top-1/2 -translate-y-1/2">{getCardLogo()}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1B3A6B] mb-1">Expiry</label>
              <input
                type="text" maxLength={5} value={cardDetails.expiryDate}
                onChange={(e) => setCardDetails(p => ({ ...p, expiryDate: formatExpiry(e.target.value) }))}
                className="w-full border-b border-[#1B3A6B]/30 bg-transparent py-2 text-sm text-[#1B3A6B] focus:border-[#1B3A6B] focus:outline-none transition-colors" placeholder="MM/YY"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1B3A6B] mb-1">CVV</label>
              <input
                type="password" maxLength={4} value={cardDetails.cvv}
                onChange={(e) => setCardDetails(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '') }))}
                className="w-full border-b border-[#1B3A6B]/30 bg-transparent py-2 text-sm text-[#1B3A6B] focus:border-[#1B3A6B] focus:outline-none transition-colors" placeholder="•••"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}