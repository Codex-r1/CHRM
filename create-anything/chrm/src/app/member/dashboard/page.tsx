import { Suspense } from "react";
import MemberDashboard from "./MemberDashboardClient";

export default function MemberDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] bg-[#F7F9FC] flex items-center justify-center">
        <div className="text-[#2B4C73] text-xl font-poppins">Loading Dashboard...</div>
      </div>
    }>
      <MemberDashboard />
    </Suspense>
  );
}