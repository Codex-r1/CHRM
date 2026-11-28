"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import SiteShell from "../../../components/site/SiteShell";
import { Notice, Section } from "../../../components/site/primitives";
import { ProductGrid, ProductGridSkeleton, ShopNav } from "../../../components/shop/ShopParts";
import { ButtonLink, Empty, NativeSelect } from "../../../components/ui";
import { SHOP_CATEGORIES } from "../../../content/site";
import { categoryHref, inCategory, isStoreCategory, sortProducts, useProducts } from "../../../lib/products";
import type { ProductSort } from "../../../types/merchandise";

const SORT_OPTIONS: Array<{ value: ProductSort; label: string }> = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
];

export default function ShopCategoryPage() {
  const params = useParams<{ category: string }>();
  const raw = params?.category ?? "all";
  const category = isStoreCategory(raw) ? raw : null;
  const meta = SHOP_CATEGORIES.find((c) => c.value === category);

  const { products, loading, error } = useProducts();
  const [sort, setSort] = useState<ProductSort>("featured");
  const [inStockOnly, setInStockOnly] = useState(false);

  const visible = useMemo(() => {
    if (!category) return [];
    const list = products.filter((p) => inCategory(p, category) && (!inStockOnly || p.variants.some((v) => v.is_available && v.stock_quantity > 0)));
    return sortProducts(list, sort);
  }, [products, category, sort, inStockOnly]);

  if (!category || !meta) {
    return (
      <SiteShell>
        <ShopNav />
        <Section spacing="last" style={{ paddingTop: "var(--space-16)" }}>
          <Empty title="Category not found" description="That part of the shop doesn't exist." actions={<ButtonLink href="/merchandise">Back to the shop</ButtonLink>} />
        </Section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <ShopNav active={category} />

      <Section spacing="intro" style={{ paddingTop: "var(--space-10)" }}>
        <nav className="ot-breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: "var(--space-4)" }}>
          <Link href="/merchandise">Shop</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{meta.label}</span>
        </nav>
        <div className="ot-stack" style={{ gap: "var(--space-3)", maxWidth: 720 }}>
          <h1 className="ot-hero">{meta.label}</h1>
          <p className="ot-lede">{meta.blurb}</p>
        </div>
      </Section>

      <Section spacing="last">
        <div
          className="ot-rule-top"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap", marginBottom: "var(--space-8)" }}
        >
          <span className="ot-dense ot-muted" aria-live="polite">
            {loading ? "Loading products…" : `${visible.length} ${visible.length === 1 ? "product" : "products"}`}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
            <label className="ot-dense" style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer" }}>
              <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
              In stock only
            </label>
            <label className="ot-dense" htmlFor="shop-sort" style={{ color: "var(--ink-3)" }}>
              Sort by
            </label>
            <div style={{ width: 200 }}>
              <NativeSelect id="shop-sort" options={SORT_OPTIONS} value={sort} onChange={(e) => setSort(e.target.value as ProductSort)} />
            </div>
          </div>
        </div>

        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : error ? (
          <Notice tone="danger">{error}</Notice>
        ) : visible.length === 0 ? (
          <div style={{ background: "var(--bg-sunken)", padding: "var(--space-16) var(--space-6)" }}>
            <Empty
              title={inStockOnly ? "Nothing in stock here right now" : "Nothing in this category yet"}
              description="New items are added regularly. Browse the rest of the shop in the meantime."
              actions={<ButtonLink href={categoryHref("all")} variant="outline">Shop all</ButtonLink>}
            />
          </div>
        ) : (
          <ProductGrid products={visible} />
        )}
      </Section>
    </SiteShell>
  );
}
