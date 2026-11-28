"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../(backend)/context/auth";
import SiteShell from "../components/site/SiteShell";
import { ArrowLink, AutoGrid, Notice, Section } from "../components/site/primitives";
import { Button, Field, Input, Spinner } from "../components/ui";
import { ROUTES } from "../content/site";

/** Only allow same-site relative paths, so `?redirect=` can't send users to another domain. */
function safeRedirect(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

function LoginForm() {
  const { user, loading: authLoading, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const redirectTo = safeRedirect(searchParams?.get("redirect") ?? null);

  // Already signed in (or just signed in): go to the requested page or the right dashboard.
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectTo ?? (user.role === "admin" ? ROUTES.adminDashboard : ROUTES.memberDashboard));
    }
  }, [user, authLoading, router, redirectTo]);

  useEffect(() => {
    if (searchParams?.get("reason") !== "session_expired") return;
    setSessionExpired(true);
    window.history.replaceState({}, "", window.location.pathname);
    const timer = setTimeout(() => setSessionExpired(false), 10000);
    return () => clearTimeout(timer);
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      setSignedIn(true);
      // The effect above redirects once `user` is populated; this is a fallback.
      setTimeout(() => router.replace(redirectTo ?? ROUTES.memberDashboard), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <SiteShell>
      <Section spacing="last" style={{ paddingTop: "var(--space-16)" }}>
        <AutoGrid min={320} gap="var(--space-12)" style={{ alignItems: "start" }}>
          {/* Intro */}
          <div className="ot-stack" style={{ gap: "var(--space-6)", maxWidth: 480 }}>
            <div className="ot-stack" style={{ gap: "var(--space-3)" }}>
              <span className="ot-caption">Members&rsquo; area</span>
              <h1 className="ot-hero">Welcome back</h1>
            </div>
            <p className="ot-lede">Sign in to manage your profile, membership, event registrations and orders.</p>
            <div className="ot-stack ot-rule-top" style={{ gap: "var(--space-3)" }}>
              <span className="ot-dense ot-muted">Not yet registered with the Old Turian Society?</span>
              <ArrowLink href={ROUTES.membership}>Join the society</ArrowLink>
            </div>
          </div>

          {/* Form */}
          <div className="ot-panel ot-panel--lg" style={{ maxWidth: 520, width: "100%" }}>
            <h2 className="ot-h3">Sign in</h2>

            {sessionExpired && (
              <Notice tone="warning">
                <span>
                  <strong>Session timed out.</strong> You were signed out after 20 minutes of inactivity. Please sign in again.
                </span>
              </Notice>
            )}
            {error && <Notice tone="danger">{error}</Notice>}
            {signedIn && <Notice tone="success">Signed in. Redirecting&hellip;</Notice>}

            <form onSubmit={handleSubmit} className="ot-stack" style={{ gap: "var(--space-4)" }}>
              <Field label="Email address" htmlFor="login-email" required>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
              </Field>

              <Field label="Password" htmlFor="login-password" required>
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  trailing={
                    <button
                      type="button"
                      className="ot-dense"
                      style={{ background: "none", border: 0, padding: 0, cursor: "pointer", color: "var(--brand)", fontWeight: 600, fontFamily: "inherit" }}
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  }
                />
              </Field>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Link href="/forgot-password" className="ot-dense ot-underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" size="lg" block loading={submitting}>
                {submitting ? "Signing in" : "Sign in"}
              </Button>
            </form>
          </div>
        </AutoGrid>
      </Section>
    </SiteShell>
  );
}

function LoadingState() {
  return (
    <div className="ot-scope" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)" }}>
      <Spinner size={32} label="Loading" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <LoginForm />
    </Suspense>
  );
}
