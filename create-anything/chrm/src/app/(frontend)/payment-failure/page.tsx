"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ResultPanel from "../components/site/ResultPanel";
import { ButtonLink, Spinner } from "../components/ui";
import { ROUTES } from "../content/site";

function PaymentFailureContent() {
  const cancelled = useSearchParams()?.get("redirect_status") === "canceled";
  return (
    <ResultPanel
      tone="danger"
      badge={cancelled ? "Payment cancelled" : "Payment failed"}
      title={cancelled ? "You cancelled the payment" : "Your payment didn't go through"}
      actions={
        <>
          <ButtonLink href={ROUTES.events} size="lg">
            Try again
          </ButtonLink>
          <ButtonLink href={ROUTES.contact} size="lg" variant="outline">
            Contact us
          </ButtonLink>
        </>
      }
    >
      {cancelled ? "No charge was made." : "Something went wrong and you were not charged. Please try again."}
    </ResultPanel>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense
      fallback={
        <div className="ot-scope" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)" }}>
          <Spinner size={32} label="Loading" />
        </div>
      }
    >
      <PaymentFailureContent />
    </Suspense>
  );
}
