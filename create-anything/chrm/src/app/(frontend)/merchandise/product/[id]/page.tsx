"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import SiteShell from "../../../components/site/SiteShell";
import { AutoGrid, ImageFrame, Notice, Section } from "../../../components/site/primitives";
import { ProductGrid, ShopNav, ShopSectionHeading } from "../../../components/shop/ShopParts";
import { Button, ButtonLink, Empty, Spinner } from "../../../components/ui";
import { ROUTES, SHOP_POLICIES } from "../../../content/site";
import { useCart } from "../../../lib/cart";
import { categoryHref, categoryLabel, colorsOf, galleryOf, inCategory, kes, sizesFor, useProducts } from "../../../lib/products";

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const { products, loading, error } = useProducts();
  const product = products.find((p) => p.id === params?.id);
  const { add, quantityOf } = useCart();

  const colors = useMemo(() => (product ? colorsOf(product) : []), [product]);
  const [color, setColor] = useState("");
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [added, setAdded] = useState(false);

  // Preselect the first colour that has stock.
  useEffect(() => {
    if (!product || color) return;
    const firstInStock = colors.find((c) => sizesFor(product, c.color_value).some((s) => s.available)) ?? colors[0];
    if (firstInStock) setColor(firstInStock.color_value);
  }, [product, colors, color]);

  const gallery = useMemo(() => (product ? galleryOf(product, color || undefined) : []), [product, color]);
  useEffect(() => setImageIndex(0), [color]);

  if (loading) {
    return (
      <SiteShell>
        <ShopNav />
        <Section spacing="last" style={{ paddingTop: "var(--space-24)", display: "flex", justifyContent: "center", color: "var(--brand)" }}>
          <Spinner size={32} label="Loading product" />
        </Section>
      </SiteShell>
    );
  }

  if (error || !product) {
    return (
      <SiteShell>
        <ShopNav />
        <Section spacing="last" style={{ paddingTop: "var(--space-16)" }}>
          {error ? (
            <Notice tone="danger">{error}</Notice>
          ) : (
            <Empty title="Product not found" description="It may have sold out or been removed." actions={<ButtonLink href={categoryHref("all")}>Browse the shop</ButtonLink>} />
          )}
        </Section>
      </SiteShell>
    );
  }

  const sizes = color ? sizesFor(product, color) : [];
  const variant = product.variants.find((v) => v.id === variantId);
  const colorName = colors.find((c) => c.color_value === color)?.color_name;
  const remaining = variant ? Math.max(0, variant.stock_quantity - quantityOf(variant.id)) : 0;
  const canAdd = !!variant && !product.is_out_of_stock && remaining > 0;
  const related = products.filter((p) => p.id !== product.id && inCategory(p, product.category ?? "other")).slice(0, 4);

  const handleAdd = () => {
    if (!variant || !canAdd) return;
    add(
      {
        variant_id: variant.id,
        product_id: product.id,
        name: product.name,
        price: product.base_price,
        color_name: variant.color_name,
        size: variant.size,
        image: variant.image_url || gallery[0] || "",
        stock_available: variant.stock_quantity,
      },
      Math.min(quantity, remaining),
    );
    setAdded(true);
    setQuantity(1);
  };

  return (
    <SiteShell>
      <ShopNav active={product.category ?? "other"} />

      <Section spacing="default" style={{ paddingTop: "var(--space-8)" }}>
        <nav className="ot-breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: "var(--space-6)" }}>
          <Link href="/merchandise">Shop</Link>
          <span aria-hidden="true">/</span>
          <Link href={categoryHref(product.category ?? "other")}>{categoryLabel(product.category)}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{product.name}</span>
        </nav>

        <AutoGrid min={340} gap="var(--space-12)" style={{ alignItems: "start" }}>
          {/* Gallery */}
          <div className="ot-gallery">
            <ImageFrame aspect="square" src={gallery[imageIndex]} alt={`${product.name}${colorName ? `, ${colorName}` : ""}`} placeholder="Product photo pending" />
            {gallery.length > 1 && (
              <div className="ot-thumbs" role="group" aria-label="Product images">
                {gallery.map((src, i) => (
                  <button key={src} type="button" className="ot-thumb" aria-pressed={i === imageIndex} aria-label={`Image ${i + 1}`} onClick={() => setImageIndex(i)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="ot-stack" style={{ gap: "var(--space-6)", minWidth: 0 }}>
            <div className="ot-stack" style={{ gap: "var(--space-2)" }}>
              <span className="ot-caption">{categoryLabel(product.category)}</span>
              <h1 className="ot-display-sm">{product.name}</h1>
              <span className="ot-title" style={{ color: "var(--brand)" }}>
                {kes(product.base_price)}
              </span>
            </div>

            {colors.length > 0 && (
              <div className="ot-stack" style={{ gap: "var(--space-2)" }}>
                <span className="ot-dense">
                  Colour: <strong>{colorName ?? "Choose a colour"}</strong>
                </span>
                <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                  {colors.map((c) => (
                    <button
                      key={c.color_value}
                      type="button"
                      className="ot-swatch"
                      style={{ backgroundColor: c.color_hex, width: 36, height: 36 }}
                      aria-pressed={color === c.color_value}
                      aria-label={c.color_name}
                      title={c.color_name}
                      onClick={() => {
                        setColor(c.color_value);
                        setVariantId("");
                        setAdded(false);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {color && (
              <div className="ot-stack" style={{ gap: "var(--space-2)" }}>
                <span className="ot-dense">
                  Size: <strong>{variant?.size ?? "Choose a size"}</strong>
                </span>
                <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                  {sizes.map((s) => (
                    <button
                      key={s.variant.id}
                      type="button"
                      className="ot-size"
                      style={{ minWidth: 52, height: 44 }}
                      disabled={!s.available}
                      aria-pressed={variantId === s.variant.id}
                      onClick={() => {
                        setVariantId(s.variant.id);
                        setQuantity(1);
                        setAdded(false);
                      }}
                    >
                      {s.size}
                    </button>
                  ))}
                </div>
                {variant && (
                  <span className="ot-caption" style={{ color: variant.stock_quantity > 5 ? "var(--leaf-ink)" : variant.stock_quantity > 0 ? "var(--honey-ink)" : "var(--signal-ink)" }}>
                    {variant.stock_quantity > 5 ? "In stock" : variant.stock_quantity > 0 ? `Only ${variant.stock_quantity} left` : "Out of stock"}
                  </span>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "stretch" }}>
              <div className="ot-qty" role="group" aria-label="Quantity">
                <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((q) => q - 1)}>
                  −
                </button>
                <span aria-live="polite">{quantity}</span>
                <button type="button" aria-label="Increase quantity" disabled={!variant || quantity >= remaining} onClick={() => setQuantity((q) => q + 1)}>
                  +
                </button>
              </div>
              <Button size="lg" onClick={handleAdd} disabled={!canAdd} style={{ flex: "1 1 200px" }}>
                {product.is_out_of_stock
                  ? "Out of stock"
                  : !variant
                    ? "Choose a size"
                    : remaining === 0
                      ? "All available stock is in your basket"
                      : "Add to basket"}
              </Button>
            </div>

            {added && (
              <Notice tone="success">
                <span style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap", width: "100%" }}>
                  Added to your basket.
                  <Link href={ROUTES.storeBasket} className="ot-underline" style={{ color: "inherit", fontWeight: 600 }}>
                    View basket
                  </Link>
                </span>
              </Notice>
            )}

            <div className="ot-accordion">
              {product.description && (
                <details open>
                  <summary>Details</summary>
                  <div>
                    <p className="ot-body" style={{ whiteSpace: "pre-line" }}>
                      {product.description}
                    </p>
                  </div>
                </details>
              )}
              <details>
                <summary>Delivery</summary>
                <div>
                  <p className="ot-body">{SHOP_POLICIES.delivery}</p>
                </div>
              </details>
              <details>
                <summary>Returns</summary>
                <div>
                  <p className="ot-body">{SHOP_POLICIES.returns}</p>
                </div>
              </details>
            </div>
          </div>
        </AutoGrid>
      </Section>

      {related.length > 0 && (
        <Section spacing="last">
          <ShopSectionHeading title="You may also like" />
          <ProductGrid products={related} />
        </Section>
      )}
    </SiteShell>
  );
}
