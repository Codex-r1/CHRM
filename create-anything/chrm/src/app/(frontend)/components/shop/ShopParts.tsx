"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { SHOP_CATEGORIES } from "../../content/site";
import { categoryHref, colorsOf, inStock, kes, primaryImage, productHref } from "../../lib/products";
import type { Product, StoreCategory } from "../../types/merchandise";
import { AutoGrid, ImageFrame } from "../site/primitives";

/** Category link bar shown at the top of every shop page. */
export function ShopNav({ active }: { active?: StoreCategory | "home" }) {
  return (
    <nav className="ot-shop-nav" aria-label="Shop categories">
      <div className="ot-container ot-shop-nav-inner">
        <Link href="/merchandise" className="ot-shop-nav-link" aria-current={active === "home" ? "page" : undefined}>
          Shop home
        </Link>
        {SHOP_CATEGORIES.map((c) => (
          <Link key={c.value} href={categoryHref(c.value)} className="ot-shop-nav-link" aria-current={active === c.value ? "page" : undefined}>
            {c.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const colors = colorsOf(product);
  const available = inStock(product);
  return (
    <Link href={productHref(product)} className="ot-product-card">
      <ImageFrame aspect="square" src={primaryImage(product)} alt={product.name} placeholder="Product photo pending">
        {!available && <span className="ui-badge ui-badge--danger ot-product-card-badge">Out of stock</span>}
      </ImageFrame>
      <div className="ot-stack" style={{ gap: "var(--space-1)" }}>
        <span className="ot-product-card-name">{product.name}</span>
        <span className="ot-dense" style={{ color: "var(--ink-2)" }}>
          {kes(product.base_price)}
        </span>
        {colors.length > 1 && (
          <span className="ot-dots-row" aria-label={`${colors.length} colours`}>
            {colors.slice(0, 6).map((c) => (
              <i key={c.color_value} style={{ background: c.color_hex }} title={c.color_name} />
            ))}
            {colors.length > 6 && <span className="ot-caption">+{colors.length - 6}</span>}
          </span>
        )}
      </div>
    </Link>
  );
}

export function ProductGrid({ products, min = 220 }: { products: Product[]; min?: number }) {
  return (
    <AutoGrid min={min} fill gap="var(--space-10) var(--space-6)">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </AutoGrid>
  );
}

export function ProductGridSkeleton({ count = 4, min = 220 }: { count?: number; min?: number }) {
  return (
    <AutoGrid min={min} fill gap="var(--space-10) var(--space-6)">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="ot-stack" style={{ gap: "var(--space-3)" }} aria-hidden="true">
          <div className="ot-media ot-media--square ui-skeleton" />
          <div className="ui-skeleton" style={{ height: 16, width: "70%" }} />
          <div className="ui-skeleton" style={{ height: 14, width: "35%" }} />
        </div>
      ))}
    </AutoGrid>
  );
}

export function CategoryTile({ category, label, image }: { category: StoreCategory; label: string; image: string | null }) {
  return (
    <Link href={categoryHref(category)} className="ot-cat-tile">
      <ImageFrame aspect="square" src={image} alt="" placeholder="Photo pending" />
      <span className="ot-cat-tile-label">{label}</span>
    </Link>
  );
}

/** Heading row with an optional right-hand link. */
export function ShopSectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap", marginBottom: "var(--space-8)" }}>
      <h2 className="ot-h2">{title}</h2>
      {action}
    </div>
  );
}
