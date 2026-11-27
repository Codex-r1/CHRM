"use client";

import { useEffect, useState } from "react";
import { SHOP_CATEGORIES } from "../content/site";
import type { Product, ProductSort, ProductVariant, StoreCategory } from "../types/merchandise";

export const kes = (n: number) => `KES ${n.toLocaleString()}`;

/* ── Fetching ──────────────────────────────────────────────────────────── */

let cache: Promise<Product[]> | null = null;

function fetchProducts(): Promise<Product[]> {
  if (!cache) {
    cache = fetch("/api/products/list")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { products?: Product[] }) => data.products ?? [])
      .catch((err) => {
        cache = null; // allow a retry on the next mount
        throw err;
      });
  }
  return cache;
}

/** Active products, fetched once per page load and shared by every shop page. */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchProducts()
      .then((p) => alive && setProducts(p))
      .catch(() => alive && setError("We couldn't load the shop right now. Please try again shortly."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { products, loading, error };
}

/* ── Categories ────────────────────────────────────────────────────────── */

export function categoryLabel(value: StoreCategory | null | undefined) {
  return SHOP_CATEGORIES.find((c) => c.value === (value ?? "other"))?.label ?? "Gifts & publications";
}

export function isStoreCategory(value: string): value is StoreCategory {
  return SHOP_CATEGORIES.some((c) => c.value === value);
}

export function inCategory(p: Product, cat: StoreCategory) {
  return cat === "all" || (p.category ?? "other") === cat;
}

export const categoryHref = (cat: StoreCategory) => `/merchandise/category/${cat}`;
export const productHref = (p: Pick<Product, "id">) => `/merchandise/product/${p.id}`;

/* ── Product helpers ───────────────────────────────────────────────────── */

/** Distinct colours, in first-seen order. */
export function colorsOf(p: Product): ProductVariant[] {
  return Array.from(new Map(p.variants.map((v) => [v.color_value, v])).values());
}

export function sizesFor(p: Product, color: string) {
  return p.variants
    .filter((v) => v.color_value === color)
    .map((v) => ({ size: v.size, variant: v, available: v.is_available && v.stock_quantity > 0 }));
}

export function inStock(p: Product) {
  return !p.is_out_of_stock && p.variants.some((v) => v.is_available && v.stock_quantity > 0);
}

/** Gallery for a product: featured image, extra images, then colour images (deduplicated). */
export function galleryOf(p: Product, color?: string): string[] {
  const colorImages = p.variants.filter((v) => !color || v.color_value === color).map((v) => v.image_url);
  const all = color
    ? [...colorImages, p.featured_image_url, ...p.images]
    : [p.featured_image_url, ...p.images, ...colorImages];
  return Array.from(new Set(all.filter((u): u is string => !!u)));
}

export const primaryImage = (p: Product) => galleryOf(p)[0] ?? null;

export function sortProducts(list: Product[], sort: ProductSort): Product[] {
  const copy = [...list];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.base_price - b.base_price);
    case "price-desc":
      return copy.sort((a, b) => b.base_price - a.base_price);
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "newest":
      return copy.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    default:
      return copy; // API order (admin sort_order)
  }
}
