"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import SiteShell from "../components/site/SiteShell";
import { ArrowLink, AutoGrid, FeatureBand, Notice, Section } from "../components/site/primitives";
import { CategoryTile, ProductGrid, ProductGridSkeleton, ShopNav, ShopSectionHeading } from "../components/shop/ShopParts";
import { ButtonLink, Empty } from "../components/ui";
import { ROUTES, SHOP_CATEGORIES } from "../content/site";
import { categoryHref, inCategory, primaryImage, sortProducts, useProducts } from "../lib/products";

const NEW_IN_COUNT = 8;

export default function ShopHomePage() {
  const { products, loading, error } = useProducts();

  // Only show tiles for categories that have stock to browse (all of them while the store is empty).
  const tiles = useMemo(() => {
    const cats = SHOP_CATEGORIES.filter((c) => c.value !== "all");
    const withProducts = cats
      .map((c) => {
        const inCat = products.filter((p) => inCategory(p, c.value));
        return { ...c, count: inCat.length, image: inCat.map(primaryImage).find(Boolean) ?? null };
      })
      .filter((c) => c.count > 0);
    return products.length === 0 ? cats.map((c) => ({ ...c, count: 0, image: null })) : withProducts;
  }, [products]);

  const newIn = useMemo(() => sortProducts(products, "newest").slice(0, NEW_IN_COUNT), [products]);

  return (
    <SiteShell>
      {/* Hero */}
      <section className="ot-feature" style={{ minHeight: 420, display: "flex", alignItems: "flex-end" }}>
        <Image src="/images/campus-aerial.jpg" alt="" fill priority sizes="100vw" style={{ objectFit: "cover" }} />
        <div className="ot-container">
          <div className="ot-feature-body" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <span className="ot-caption">The official Old Turian shop</span>
            <h1 className="ot-hero" style={{ color: "#fff" }}>
              Official memorabilia
            </h1>
            <p className="ot-lede" style={{ color: "rgba(255,255,255,0.9)" }}>
              Tailored blazers, crest ties and archival publications, dispatched worldwide via DHL.
            </p>
            <ButtonLink href={categoryHref("all")} variant="accent" size="lg">
              Shop all
            </ButtonLink>
          </div>
        </div>
      </section>

      <ShopNav active="home" />

      {/* Shop by category */}
      <Section style={{ paddingTop: "var(--space-16)" }}>
        <ShopSectionHeading title="Shop by category" />
        {loading ? (
          <ProductGridSkeleton count={5} min={180} />
        ) : (
          <AutoGrid min={180} gap="var(--space-8) var(--space-4)">
            {tiles.map((c) => (
              <CategoryTile key={c.value} category={c.value} label={c.label} image={c.image} />
            ))}
          </AutoGrid>
        )}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "var(--space-12)" }}>
          <Link href={categoryHref("all")} className="ot-pill">
            View all
          </Link>
        </div>
      </Section>

      {/* New in */}
      <Section>
        <ShopSectionHeading title="New in" action={<ArrowLink href={categoryHref("all")}>See everything</ArrowLink>} />
        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : error ? (
          <Notice tone="danger">{error}</Notice>
        ) : newIn.length === 0 ? (
          <div style={{ background: "var(--bg-sunken)", padding: "var(--space-16) var(--space-6)" }}>
            <Empty title="The shop is being stocked" description="Blazers, crest ties and archival publications will appear here as they become available." />
          </div>
        ) : (
          <ProductGrid products={newIn} />
        )}
      </Section>

      {/* Featured story */}
      <Section>
        <div className="ot-feature">
          <Image src="/turi1.jpg" alt="" fill sizes="(max-width: 1200px) 100vw, 1152px" style={{ objectFit: "cover" }} />
          <div className="ot-feature-body">
            <span className="ot-caption">From the school, since 1931</span>
            <h2 className="ot-display-sm">Seeking the Highest</h2>
            <p className="ot-body-relaxed">
              Crest ties, blazers and keepsakes for Old Turians across East Africa and around the world. Wear your school with pride
              at reunions, regional dinners and everywhere in between.
            </p>
            <ButtonLink href={categoryHref("accessory")} variant="secondary" size="lg">
              Shop accessories
            </ButtonLink>
          </div>
        </div>
      </Section>

      <FeatureBand title="Shipping worldwide" spacing="last">
        <p className="ot-body-relaxed">Orders are dispatched worldwide via DHL international shipping, or collect from the school for free.</p>
        <ArrowLink href={ROUTES.contact}>Questions about an order</ArrowLink>
      </FeatureBand>
    </SiteShell>
  );
}
