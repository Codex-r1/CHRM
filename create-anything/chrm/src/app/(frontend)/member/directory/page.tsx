"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import SiteShell from "@/app/(frontend)/components/site/SiteShell";
import { AutoGrid, Notice, PageIntro, Section } from "@/app/(frontend)/components/site/primitives";
import { Button, Empty, Input, NativeSelect } from "@/app/(frontend)/components/ui";
import { ROUTES } from "@/app/(frontend)/content/site";

type AlumniProfile = {
  id: string;
  full_name: string;
  graduation_year: number | null;
  course: string | null;
  country: string | null;
  bio?: string | null;
  linkedin_url?: string | null;
};

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [
  { value: "", label: "All class years" },
  ...Array.from({ length: CURRENT_YEAR - 1980 + 1 }, (_, i) => CURRENT_YEAR - i).map((yr) => ({ value: String(yr), label: `Class of ${yr}` })),
];

/** Only allow http(s) LinkedIn links from profile data. */
function safeUrl(url?: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

export default function DirectoryPage() {
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlumni = useCallback(async (q: string, y: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/alumni/search", window.location.origin);
      if (q.trim()) url.searchParams.append("query", q.trim());
      if (y) url.searchParams.append("year", y);
      const res = await fetch(url.toString());
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error();
      setAlumni(data.alumni || []);
    } catch {
      setError("The directory couldn't be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Year changes search immediately; the name search runs on submit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void fetchAlumni(query, year), [year, fetchAlumni]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    fetchAlumni(query, year);
  };

  return (
    <SiteShell>
      <PageIntro
        eyebrow="Members' area"
        title="Find old friends"
        lede="Reconnect with classmates and Old Turians across East Africa and around the world."
      />

      <Section spacing="last">
        <form onSubmit={onSubmit} role="search" style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "var(--space-6)" }}>
          <div style={{ flex: "2 1 260px" }}>
            <label htmlFor="dir-q" className="ot-sr-only">
              Search by name
            </label>
            <Input id="dir-q" type="search" placeholder="Search by name" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div style={{ flex: "1 1 180px" }}>
            <label htmlFor="dir-year" className="ot-sr-only">
              Class year
            </label>
            <NativeSelect id="dir-year" options={YEAR_OPTIONS} value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <p className="ot-caption" style={{ marginBottom: "var(--space-8)" }}>
          All active members are listed by name, class year, course and country. To change how you appear, or to be removed,{" "}
          <Link href={ROUTES.profileEdit} className="ot-underline">
            update your profile
          </Link>{" "}
          or{" "}
          <Link href={ROUTES.contact} className="ot-underline">
            contact the alumni office
          </Link>
          .
        </p>

        <div className="ot-rule-top" style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-6)" }}>
          <span className="ot-dense ot-muted" aria-live="polite">
            {loading ? "Searching…" : `${alumni.length} ${alumni.length === 1 ? "member" : "members"}${alumni.length === 50 ? " (showing the first 50; refine your search)" : ""}`}
          </span>
        </div>

        {error ? (
          <Notice tone="danger">{error}</Notice>
        ) : loading ? (
          <AutoGrid min={260} fill gap="var(--space-4)">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="ui-skeleton" style={{ height: 120 }} aria-hidden="true" />
            ))}
          </AutoGrid>
        ) : alumni.length === 0 ? (
          <div style={{ background: "var(--bg-sunken)", padding: "var(--space-16) var(--space-6)" }}>
            <Empty title="No members found" description="Try a different name or class year." />
          </div>
        ) : (
          <AutoGrid min={260} fill gap="0 var(--space-8)" as="ul" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {alumni.map((person) => {
              const linkedin = safeUrl(person.linkedin_url);
              return (
                <li key={person.id} style={{ display: "flex", gap: "var(--space-4)", padding: "var(--space-5) 0", borderBottom: "1px solid var(--divider-strong)" }}>
                  <span
                    aria-hidden="true"
                    style={{ flex: "none", width: 48, height: 48, borderRadius: 999, background: "var(--brand-tint)", color: "var(--brand)", display: "grid", placeItems: "center", fontWeight: 700 }}
                  >
                    {initials(person.full_name)}
                  </span>
                  <div className="ot-stack" style={{ gap: 2, minWidth: 0 }}>
                    <span style={{ fontWeight: 700 }}>{person.full_name}</span>
                    <span className="ot-caption">{person.graduation_year ? `Class of ${person.graduation_year}` : "Old Turian"}</span>
                    {(person.course || person.country) && (
                      <span className="ot-dense" style={{ color: "var(--ink-2)" }}>
                        {[person.course, person.country].filter(Boolean).join(" · ")}
                      </span>
                    )}
                    {linkedin && (
                      <a href={linkedin} target="_blank" rel="noopener noreferrer" className="ot-dense ot-underline" style={{ marginTop: "var(--space-1)" }}>
                        LinkedIn profile
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </AutoGrid>
        )}
      </Section>
    </SiteShell>
  );
}
