export const FEATURES = {
  paypal: {
    enabled: false,
    comingSoonMessage: "PayPal payments are coming soon. Please use M-PESA or Card.",
  },
  card: {
    enabled: true,
  },
  mpesa: {
    enabled: true,
  },
} as const;