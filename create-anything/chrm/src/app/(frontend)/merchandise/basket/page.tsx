"use client";

import Link from "next/link";
import SiteShell from "../../components/site/SiteShell";
import { ArrowLink, AutoGrid, ImageFrame, Section } from "../../components/site/primitives";
import { ShopNav } from "../../components/shop/ShopParts";
import { Button, ButtonLink, Empty, Spinner } from "../../components/ui";
import { ROUTES } from "../../content/site";
import { useCart } from "../../lib/cart";
import { categoryHref, kes } from "../../lib/products";

export default function BasketPage() {
  const { items, ready, count, subtotal, setQuantity, remove } = useCart();

  return (
    <SiteShell>
      <ShopNav />

      <Section spacing="intro" style={{ paddingTop: "var(--space-10)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: "var(--space-4)", flexWrap: "wrap" }}>
          <h1 className="ot-hero">Your basket</h1>
          {ready && count > 0 && (
            <span className="ot-dense ot-muted">
              {count} {count === 1 ? "item" : "items"}
            </span>
          )}
        </div>
      </Section>

      <Section spacing="last">
        {!ready ? (
          <div style={{ display: "flex", justifyContent: "center", color: "var(--brand)" }}>
            <Spinner size={32} label="Loading basket" />
          </div>
        ) : items.length === 0 ? (
          <div style={{ background: "var(--bg-sunken)", padding: "var(--space-16) var(--space-6)" }}>
            <Empty
              title="Your basket is empty"
              description="Browse blazers, crest ties and publications from the official Old Turian shop."
              actions={<ButtonLink href={categoryHref("all")}>Start shopping</ButtonLink>}
            />
          </div>
        ) : (
          <AutoGrid min={340} gap="var(--space-12)" style={{ alignItems: "start" }}>
            <ul className="ot-stack ot-span-2" style={{ listStyle: "none", margin: 0, padding: 0, minWidth: 0 }}>
              {items.map((item) => (
                <li
                  key={item.variant_id}
                  style={{ display: "grid", gridTemplateColumns: "96px 1fr", gap: "var(--space-4)", padding: "var(--space-6) 0", borderTop: "1px solid var(--divider-strong)" }}
                >
                  <Link href={`/merchandise/product/${item.product_id}`} aria-label={item.name}>
                    <ImageFrame aspect="square" src={item.image} alt="" placeholder="" />
                  </Link>
                  <div className="ot-stack" style={{ gap: "var(--space-3)", minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
                      <div className="ot-stack" style={{ gap: "var(--space-1)" }}>
                        <Link href={`/merchandise/product/${item.product_id}`} className="ot-product-card-name" style={{ color: "var(--ink)" }}>
                          {item.name}
                        </Link>
                        <span className="ot-dense ot-muted">
                          {item.color_name} · {item.size} · {kes(item.price)} each
                        </span>
                      </div>
                      <strong className="ot-body" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {kes(item.price * item.quantity)}
                      </strong>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
                      <div className="ot-qty" role="group" aria-label={`Quantity of ${item.name}`} style={{ height: 40 }}>
                        <button type="button" aria-label="Decrease quantity" disabled={item.quantity <= 1} onClick={() => setQuantity(item.variant_id, item.quantity - 1)}>
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          disabled={item.quantity >= item.stock_available}
                          onClick={() => setQuantity(item.variant_id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => remove(item.variant_id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <aside className="ot-panel ot-panel--lg ot-sticky">
              <h2 className="ot-title">Order summary</h2>
              <div className="ot-stack ot-dense" style={{ gap: "var(--space-2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="ot-muted">Subtotal</span>
                  <span>{kes(subtotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="ot-muted">Delivery</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>
              <ButtonLink href={ROUTES.storeCheckout} size="lg" block>
                Checkout
              </ButtonLink>
              <ArrowLink href={categoryHref("all")}>Continue shopping</ArrowLink>
            </aside>
          </AutoGrid>
        )}
      </Section>
    </SiteShell>
  );
}
