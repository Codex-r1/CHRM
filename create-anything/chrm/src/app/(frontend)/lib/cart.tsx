"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartItem } from "../types/merchandise";

const STORAGE_KEY = "ot-basket-v1";

interface CartContextValue {
  items: CartItem[];
  /** False until the saved basket has been read, so pages don't flash "empty". */
  ready: boolean;
  count: number;
  subtotal: number;
  /** Adds `quantity` of a variant, capped at its stock. */
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  /** Quantity of a variant already in the basket. */
  quantityOf: (variantId: string) => number;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function readStored(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((i) => i && typeof i.variant_id === "string" && i.quantity > 0) : [];
  } catch {
    return [];
  }
}

/** Shop basket, persisted in this browser so it survives navigation and reloads. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readStored());
    setReady(true);
    // Keep several open tabs in sync.
    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && setItems(readStored());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage unavailable (private mode): basket still works for this page view.
    }
  }, [items, ready]);

  const add = useCallback<CartContextValue["add"]>((item, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variant_id === item.variant_id);
      const next = Math.min(item.stock_available, (existing?.quantity ?? 0) + quantity);
      if (next <= (existing?.quantity ?? 0)) return prev;
      return existing
        ? prev.map((i) => (i.variant_id === item.variant_id ? { ...i, ...item, quantity: next } : i))
        : [...prev, { ...item, quantity: next }];
    });
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) => (i.variant_id === variantId ? { ...i, quantity: Math.min(i.stock_available, Math.max(1, quantity)) } : i)),
    );
  }, []);

  const remove = useCallback((variantId: string) => setItems((prev) => prev.filter((i) => i.variant_id !== variantId)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      ready,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
      add,
      quantityOf: (variantId: string) => items.find((i) => i.variant_id === variantId)?.quantity ?? 0,
      setQuantity,
      remove,
      clear,
    }),
    [items, ready, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
