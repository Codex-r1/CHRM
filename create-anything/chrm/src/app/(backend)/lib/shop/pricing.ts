// Shop pricing shared by the checkout page and the server. Safe to import from client code.
// The server recomputes every order total from these values and the product records;
// the figures the browser sends are never charged.
export const SHIPPING_PRICES_KES = {
  dhl_express: 45,
  dhl_economy: 25,
  pickup: 0,
} as const;

export type ShippingMethodId = keyof typeof SHIPPING_PRICES_KES;

export const MAX_ITEM_QUANTITY = 20;
export const MAX_ORDER_LINES = 50;
