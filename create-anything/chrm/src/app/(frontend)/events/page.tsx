"use client";

import { useEffect, useMemo, useState } from "react";
import SiteShell from "../components/site/SiteShell";
import { AutoGrid, ImageFrame, Notice, PageIntro, Section, Tile } from "../components/site/primitives";
import { Button, ButtonLink, Dialog, Empty, ToggleGroup, type ToggleOption } from "../components/ui";
import { supabase } from "../../(backend)/lib/supabase/client";
import { ROUTES } from "../content/site";
import type { AlumniEvent, EventTab } from "../types/event";

const TABS: ToggleOption<EventTab>[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
];

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
const formatKes = (n: number) => `KES ${n.toLocaleString()}`;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function EventMeta({ event }: { event: AlumniEvent }) {
  return (
    <dl className="ot-stack ot-dense" style={{ gap: "var(--space-1)", margin: 0, color: "var(--ink-2)" }}>
      <div>
        <dt className="ot-sr-only">Date</dt>
        <dd style={{ margin: 0 }}>{formatDate(event.event_date)}</dd>
      </div>
      {event.location && (
        <div>
          <dt className="ot-sr-only">Location</dt>
          <dd style={{ margin: 0 }}>{event.location}</dd>
        </div>
      )}
      {event.max_attendees ? (
        <div>
          <dt className="ot-sr-only">Attendance</dt>
          <dd style={{ margin: 0 }} className="ot-muted">
            {event.current_attendees} / {event.max_attendees} registered
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

function EventPrice({ event }: { event: AlumniEvent }) {
  return (
    <div className="ot-stack" style={{ gap: "var(--space-1)" }}>
      <span className="ot-title" style={{ color: "var(--brand)" }}>
        {formatKes(event.price)}
      </span>
      {event.member_discount > 0 && <span className="ot-caption">Members: {formatKes(event.price - event.member_discount)}</span>}
    </div>
  );
}

export default function EventsPage() {
  const [tab, setTab] = useState<EventTab>("upcoming");
  const [events, setEvents] = useState<AlumniEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AlumniEvent | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error: dbError } = await supabase
          .from("events")
          .select("*")
          .eq("is_active", true)
          .order("event_date", { ascending: true });
        if (dbError) throw dbError;
        setEvents((data ?? []).map((e: AlumniEvent) => ({ ...e, id: String(e.id) })));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load events.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const visible = useMemo(() => {
    const today = startOfToday();
    const list = events.filter((e) => (tab === "upcoming" ? new Date(e.event_date) >= today : new Date(e.event_date) < today));
    // Most recent past events first.
    return tab === "past" ? list.reverse() : list;
  }, [events, tab]);

  const isUpcoming = tab === "upcoming";

  return (
    <SiteShell>
      <PageIntro title="Alumni events" lede="Professional networking, workshops, and community initiatives for the Turi alumni community" />

      <Section spacing="last">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap", marginBottom: "var(--space-8)" }}>
          <h2 className="ot-h2">{isUpcoming ? "Upcoming events" : "Past events"}</h2>
          <ToggleGroup options={TABS} value={tab} onValueChange={setTab} aria-label="Filter events" />
        </div>

        {loading ? (
          <AutoGrid min={280} gap="var(--space-6)" fill>
            {[1, 2, 3].map((i) => (
              <div key={i} className="ot-media ot-media--photo ui-skeleton" aria-hidden="true" />
            ))}
          </AutoGrid>
        ) : error ? (
          <div className="ot-stack" style={{ gap: "var(--space-4)", alignItems: "flex-start" }}>
            <Notice tone="danger">{error}</Notice>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <div style={{ background: "var(--bg-sunken)", padding: "var(--space-16) var(--space-6)" }}>
            <Empty
              title={isUpcoming ? "No upcoming events listed" : "No past events listed"}
              description="Join the society to receive reunion invites and regional event access."
            />
            <div style={{ display: "flex", justifyContent: "center", marginTop: "var(--space-6)" }}>
              <ButtonLink href={ROUTES.membership}>Join the society</ButtonLink>
            </div>
          </div>
        ) : (
          <AutoGrid min={280} gap="var(--space-8) var(--space-6)" fill>
            {visible.map((event) => (
              <Tile
                key={event.id}
                title={event.name}
                onClick={() => setSelected(event)}
                media={<ImageFrame aspect="photo" src={event.image_url} alt={event.name} placeholder="Event photo pending" />}
              >
                <EventMeta event={event} />
                {event.description && (
                  <p className="ot-body" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {event.description}
                  </p>
                )}
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
                  <EventPrice event={event} />
                  {isUpcoming && <ButtonLink href={`/events/register/${event.id}`}>Register</ButtonLink>}
                </div>
              </Tile>
            ))}
          </AutoGrid>
        )}
      </Section>

      <Dialog open={!!selected} onClose={() => setSelected(null)} title={selected?.name}>
        {selected && (
          <div className="ot-scope ot-stack" style={{ gap: "var(--space-6)" }}>
            {selected.image_url && <ImageFrame aspect="wide" src={selected.image_url} alt={selected.name} />}
            <EventMeta event={selected} />
            {selected.description && <p className="ot-body-relaxed">{selected.description}</p>}
            <div className="ot-panel">
              <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)" }} className="ot-dense">
                <span className="ot-muted">General</span>
                <strong>{formatKes(selected.price)}</strong>
              </div>
              {selected.member_discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)" }} className="ot-dense">
                  <span className="ot-muted">Alumni members</span>
                  <strong style={{ color: "var(--brand)" }}>
                    {formatKes(selected.price - selected.member_discount)} (save {formatKes(selected.member_discount)})
                  </strong>
                </div>
              )}
              {new Date(selected.event_date) >= startOfToday() && (
                <ButtonLink href={`/events/register/${selected.id}`} size="lg" block style={{ marginTop: "var(--space-3)" }}>
                  Register now
                </ButtonLink>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </SiteShell>
  );
}
