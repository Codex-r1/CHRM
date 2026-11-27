"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ResultPanel from "../components/site/ResultPanel";
import { ButtonLink, Spinner } from "../components/ui";
import { ROUTES } from "../content/site";

/** Stripe redirects here (return_url) after card payments that needed an extra step such as 3-D Secure. */
function PaymentSuccessContent() {
  const redirectStatus = useSearchParams()?.get("redirect_status");

  if (redirectStatus === "failed" || redirectStatus === "canceled") {
    return (
      <ResultPanel
        tone="danger"
        badge="Payment not completed"
        title="Your payment didn't go through"
        actions={<ButtonLink href={ROUTES.events} size="lg">Try again</ButtonLink>}
      >
        You were not charged. Please try again, or contact the alumni office if the problem continues.
      </ResultPanel>
    );
  }

  if (redirectStatus === "processing") {
    return (
      <ResultPanel tone="warning" badge="Processing" title="Your payment is being processed" actions={<ButtonLink href={ROUTES.memberDashboard} size="lg" variant="outline">My dashboard</ButtonLink>}>
        Your bank is confirming the payment. We&rsquo;ll email you as soon as it&rsquo;s complete.
      </ResultPanel>
    );
  }

  return (
    <ResultPanel
      tone="success"
      badge="Payment confirmed"
      title="Thank you"
      actions={
        <>
          <ButtonLink href={ROUTES.memberDashboard} size="lg">
            My dashboard
          </ButtonLink>
          <ButtonLink href={ROUTES.events} size="lg" variant="outline">
            Events
          </ButtonLink>
        </>
      }
    >
      Your payment has been received. You&rsquo;ll get a confirmation email shortly.
    </ResultPanel>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="ot-scope" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)" }}>
          <Spinner size={32} label="Confirming payment" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
