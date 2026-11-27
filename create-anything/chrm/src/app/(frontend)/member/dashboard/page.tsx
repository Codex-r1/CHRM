import { Suspense } from "react";
import MemberDashboard from "./MemberDashboardClient";
import { Spinner } from "../../components/ui";

export default function MemberDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="ot-scope" style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)" }}>
          <Spinner size={32} label="Loading your account" />
        </div>
      }
    >
      <MemberDashboard />
    </Suspense>
  );
}
