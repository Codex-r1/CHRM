"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import SiteShell from "../components/site/SiteShell";
import { ArrowRightIcon, AutoGrid, FeatureBand, ImageFrame, Section, SectionHeading } from "../components/site/primitives";
import { ABOUT_QUICK_LINKS, COMMITTEE_PLACEHOLDERS, PRINCIPLES } from "../content/site";
import type { Official } from "../types/member";

interface CommitteeSeat {
  key: string;
  name: string;
  role: string;
  image?: string;
}

function useOfficials() {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/public/officials");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: { officials?: Official[] } = await res.json();
        if (!cancelled) setOfficials([...(data.officials ?? [])].sort((a, b) => a.display_order - b.display_order));
      } catch (error) {
        // Endpoint may not be deployed yet; fall back to placeholder seats.
        console.warn("Officials unavailable:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { officials, loading };
}

export default function AboutPage() {
  const { officials, loading } = useOfficials();

  const seats: CommitteeSeat[] =
    officials.length > 0
      ? officials.map((o) => ({ key: o.id, name: o.name, role: o.position, image: o.image_url }))
      : COMMITTEE_PLACEHOLDERS.map((role) => ({ key: role, name: "Committee member", role }));

  return (
    <SiteShell>
      {/* Hero */}
      <Section spacing="none" style={{ paddingTop: "var(--space-3)" }}>
        <div className="ot-media ot-media--banner" style={{ minHeight: 320 }}>
          <Image src="/turi1.jpg" alt="Aerial view of St Andrew's Turi campus" fill priority sizes="(max-width: 1200px) 100vw, 1152px" style={{ objectFit: "cover" }} />
          <div style={{ position: "absolute", left: 0, bottom: 0, background: "#fff", padding: "var(--space-4) var(--space-8) 0 0" }}>
            <h1 className="ot-display-lg">About Turi</h1>
          </div>
        </div>
      </Section>

      {/* Purpose */}
      <Section id="purpose" style={{ paddingTop: "var(--space-10)" }}>
        <AutoGrid min={280} gap="var(--space-12)" style={{ alignItems: "start" }}>
          <div className="ot-stack ot-span-2" style={{ gap: "var(--space-6)", maxWidth: 680 }}>
            <h2 className="ot-h2">The Old Turians Society</h2>
            <p className="ot-lede">
              Founded in 1931, St Andrew&rsquo;s School, Turi has shaped generations of leaders across East Africa and beyond. The
              Old Turians Society serves as a lifelong anchor for alumni, fostering global professional networks, preserving
              school traditions, and supporting current students.
            </p>
            <p className="ot-body-relaxed">
              Whether you attended the Prep School or Senior School, the society exists to keep you connected to the friends,
              mentors, and formative experiences that defined your time in Molo.
            </p>
          </div>
          <nav className="ot-stack" style={{ gap: "var(--space-3)" }} aria-label="On this page">
            <span className="ot-caption">Quick links</span>
            {ABOUT_QUICK_LINKS.map((q) => (
              <a key={q.href} href={q.href} className="ot-arrow-link">
                <ArrowRightIcon />
                {q.label}
              </a>
            ))}
          </nav>
        </AutoGrid>
      </Section>

      {/* History */}
      <FeatureBand id="history" title="How it works">
        <p className="ot-body-relaxed" style={{ maxWidth: 520 }}>
          All Old Turian students become members of the association the minute they depart for pastures new. This means you are
          always welcome back at Turi, at Old Turian events, and can receive regular timely updates on what&rsquo;s going on at
          the School.
        </p>
      </FeatureBand>

      {/* Vision, mission, objectives */}
      <Section id="vision">
        <SectionHeading eyebrow="Guiding principles" title="Vision, mission and objectives" />
        <AutoGrid min={260} gap="var(--space-4)">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="ot-tile">
              <div className="ot-tile-bar">
                <h3 className="ot-title">{p.title}</h3>
              </div>
              <p className="ot-body">{p.body}</p>
            </div>
          ))}
        </AutoGrid>
      </Section>

      {/* Executive committee */}
      <Section id="leadership" spacing="last">
        <SectionHeading ruled title="Executive committee" description="Meet the dedicated Old Turians who lead society operations globally" />
        <AutoGrid min={240} fill gap="var(--space-4)">
          {loading
            ? COMMITTEE_PLACEHOLDERS.map((r) => <div key={r} className="ot-media ot-media--portrait ui-skeleton" aria-hidden="true" />)
            : seats.map((m) => (
                <div key={m.key} className="ot-stack" style={{ gap: "var(--space-3)" }}>
                  <ImageFrame aspect="portrait" src={m.image} alt={m.name} placeholder="Portrait pending" />
                  <span className="ot-title" style={{ letterSpacing: "-0.02em" }}>
                    {m.name}
                  </span>
                  <span className="ot-dense ot-muted">{m.role}</span>
                </div>
              ))}
        </AutoGrid>
      </Section>
    </SiteShell>
  );
}
