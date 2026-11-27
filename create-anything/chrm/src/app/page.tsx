import Image from "next/image";
import SiteShell from "./(frontend)/components/site/SiteShell";
import { ArrowLink, AutoGrid, FeatureBand, ImageFrame, Section, Tile } from "./(frontend)/components/site/primitives";
import { ButtonLink } from "./(frontend)/components/ui";
import { HOME_STATS, PILLARS, ROUTES } from "./(frontend)/content/site";

export default function HomePage() {
  return (
    <SiteShell>
      {/* Intro */}
      <Section spacing="intro">
        <AutoGrid min={280} gap="var(--space-12)" style={{ alignItems: "end" }}>
          <div className="ot-stack ot-span-2" style={{ gap: "var(--space-6)", maxWidth: 760 }}>
            <h1 className="ot-hero">Welcome home, Old Turian</h1>
            <p className="ot-lede">
              Connecting the Turi community across the world. Preserving our heritage, fostering lifelong connections across East
              Africa and globally, and supporting future generations since 1931.
            </p>
          </div>
          <div className="ot-stack" style={{ gap: "var(--space-3)" }}>
            <ArrowLink href={ROUTES.membership}>Join the society</ArrowLink>
            <ArrowLink href={ROUTES.login}>Alumni directory</ArrowLink>
          </div>
        </AutoGrid>

        <div className="ot-media ot-media--banner" style={{ marginTop: "var(--space-12)" }}>
          <Image
            src="/images/campus-aerial.jpg"
            alt="Aerial view of St Andrew's Turi campus"
            fill
            priority
            sizes="(max-width: 1200px) 100vw, 1152px"
            style={{ objectFit: "cover" }}
          />
        </div>

        <AutoGrid min={200} style={{ marginTop: "var(--space-12)", borderTop: "1px solid var(--divider-strong)" }}>
          {HOME_STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="ot-stack"
              style={{
                gap: "var(--space-2)",
                padding: i === 0 ? "var(--space-6) var(--space-6) 0 0" : "var(--space-6) var(--space-6) 0",
                borderLeft: i === 0 ? undefined : "1px solid var(--divider-strong)",
              }}
            >
              <span className="ot-stat">{stat.value}</span>
              <span className="ot-dense ot-muted">{stat.label}</span>
            </div>
          ))}
        </AutoGrid>
      </Section>

      {/* Pillars */}
      <Section>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
          <h2 className="ot-h2">Society pillars</h2>
          <span className="ot-caption">Portal services</span>
        </div>
        <AutoGrid min={260} gap="var(--space-8) var(--space-6)">
          {PILLARS.map((p) => (
            <Tile key={p.title} title={p.title} href={p.href} media={<ImageFrame aspect="wide" placeholder={p.photoNote} />}>
              <p className="ot-body">{p.body}</p>
            </Tile>
          ))}
        </AutoGrid>
      </Section>

      {/* Membership band */}
      <FeatureBand title="Are you an Old Turian?" spacing="last">
        <p className="ot-body-relaxed">
          Join thousands of alumni across the globe. Keep your contact details updated to receive society updates, reunion
          invites, and regional event access.
        </p>
        <ButtonLink href={ROUTES.membership} variant="accent" size="lg">
          Join the society today
        </ButtonLink>
      </FeatureBand>
    </SiteShell>
  );
}
