"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import SiteShell from "../components/site/SiteShell";
import { ArrowLink, AutoGrid, FeatureBand, Notice, PageIntro, Section } from "../components/site/primitives";
import { Button, ButtonLink, Field, Input, Textarea } from "../components/ui";
import { CONTACT_CHANNELS, CONTACT_QUICK_LINKS, OFFICE_HOURS, ROUTES } from "../content/site";

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const EMPTY: ContactForm = { name: "", email: "", phone: "", subject: "", message: "" };

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm>(EMPTY);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const update = (key: keyof ContactForm) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);
    const website = (e.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";

    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      setFeedback({ tone: "danger", text: "Please fill in name, email, subject and message." });
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/contact-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to send message");
      setFeedback({ tone: "success", text: "Message sent. Our team will respond within 24 hours." });
      setForm(EMPTY);
    } catch (err) {
      setFeedback({ tone: "danger", text: err instanceof Error ? err.message : "Something went wrong. Please try again." });
    } finally {
      setSending(false);
    }
  };

  return (
    <SiteShell showContactStrip={false}>
      <PageIntro
        eyebrow="Get in touch"
        title="Connect with the Old Turians"
        lede="Whether you have questions about membership, events, or simply want to reconnect with the Turi community, we're here to help."
      />

      {/* Channels */}
      <Section>
        <AutoGrid min={260} gap="var(--space-4)">
          {CONTACT_CHANNELS.map((c) => (
            <div key={c.title} className="ot-panel">
              <h2 className="ot-h3">{c.title}</h2>
              <span className="ot-dense ot-muted">{c.note}</span>
              {c.items.map((item) =>
                "href" in item ? (
                  <a key={item.text} href={item.href} className="ot-body ot-underline" style={{ color: "var(--brand)" }}>
                    {item.text}
                  </a>
                ) : (
                  <span key={item.text} className="ot-body">
                    {item.text}
                  </span>
                ),
              )}
            </div>
          ))}
        </AutoGrid>
      </Section>

      {/* Form + sidebar */}
      <Section>
        <AutoGrid min={340} gap="var(--space-12)" style={{ alignItems: "start" }}>
          <form onSubmit={handleSubmit} className="ot-stack ot-span-2 ot-rule-top" style={{ gap: "var(--space-6)", minWidth: 0 }} noValidate>
            {/* Spam trap: hidden from people, filled in by bots. */}
            <div aria-hidden="true" style={{ position: "absolute", left: -10000, width: 1, height: 1, overflow: "hidden" }}>
              <label htmlFor="c-website">Website</label>
              <input id="c-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
            </div>
            <div className="ot-stack" style={{ gap: "var(--space-1)" }}>
              <h2 className="ot-h2">Send a message</h2>
              <span className="ot-dense ot-muted">Reach out to the alumni office directly</span>
            </div>

            {feedback && <Notice tone={feedback.tone}>{feedback.text}</Notice>}

            <AutoGrid min={220} gap="var(--space-4)">
              <Field label="Full name" htmlFor="c-name" required>
                <Input id="c-name" autoComplete="name" value={form.name} onChange={update("name")} />
              </Field>
              <Field label="Email address" htmlFor="c-email" required>
                <Input id="c-email" type="email" autoComplete="email" value={form.email} onChange={update("email")} />
              </Field>
              <Field label="Phone number (optional)" htmlFor="c-phone">
                <Input id="c-phone" type="tel" autoComplete="tel" value={form.phone} onChange={update("phone")} />
              </Field>
              <Field label="Subject" htmlFor="c-subject" required>
                <Input id="c-subject" value={form.subject} onChange={update("subject")} />
              </Field>
            </AutoGrid>
            <Field label="Message" htmlFor="c-msg" required>
              <Textarea id="c-msg" rows={6} value={form.message} onChange={update("message")} />
            </Field>
            <div>
              <Button type="submit" size="lg" loading={sending}>
                {sending ? "Sending" : "Send message"}
              </Button>
            </div>
          </form>

          <aside className="ot-stack ot-rule-top" style={{ gap: "var(--space-10)" }}>
            <div className="ot-stack" style={{ gap: "var(--space-3)" }}>
              <div className="ot-stack" style={{ gap: "var(--space-1)" }}>
                <h3 className="ot-title" style={{ letterSpacing: "-0.02em" }}>
                  Office hours
                </h3>
                <span className="ot-dense ot-muted">When to reach us (East Africa Time)</span>
              </div>
              <div>
                {OFFICE_HOURS.map((h) => (
                  <div key={h.day} className="ot-hours-row">
                    <span style={{ color: "var(--ink-2)" }}>{h.day}</span>
                    <span>{h.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <nav className="ot-stack" style={{ gap: "var(--space-3)" }} aria-label="Quick links">
              <h3 className="ot-title" style={{ letterSpacing: "-0.02em" }}>
                Quick links
              </h3>
              {CONTACT_QUICK_LINKS.map((l) => (
                <ArrowLink key={l.href} href={l.href}>
                  {l.label}
                </ArrowLink>
              ))}
            </nav>

            <div className="ot-stack" style={{ gap: "var(--space-3)" }}>
              <h3 className="ot-title" style={{ letterSpacing: "-0.02em" }}>
                Find us
              </h3>
              <div className="ot-media ot-media--photo">
                <Image src="/turi1.jpg" alt="St Andrew's Turi campus" fill sizes="(max-width: 767px) 100vw, 360px" style={{ objectFit: "cover" }} />
              </div>
              <div className="ot-stack" style={{ gap: "var(--space-1)" }}>
                <span className="ot-dense" style={{ color: "var(--ink-2)" }}>
                  St Andrews Turi, Kenya
                </span>
                <span className="ot-caption">Interactive map coming soon</span>
              </div>
            </div>
          </aside>
        </AutoGrid>
      </Section>

      <FeatureBand title="Ready to reconnect with Turi?" spacing="last">
        <p className="ot-body-relaxed">Join thousands of Old Turians who stay connected through our alumni network</p>
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <ButtonLink href={ROUTES.membership} variant="accent" size="lg">
            Join now
          </ButtonLink>
          <ButtonLink href={ROUTES.about} variant="secondary" size="lg">
            Learn more
          </ButtonLink>
        </div>
      </FeatureBand>
    </SiteShell>
  );
}
