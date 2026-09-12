"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, Loader2 } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

function PaymentFailureContent() {
  const searchParams = useSearchParams();
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    const redirectStatus = searchParams.get("redirect_status");
    if (redirectStatus === "failed" || redirectStatus === "canceled") {
      setReason(redirectStatus);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="text-red-500" size={40} />
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#1B3A6B] mb-4">Payment Failed</h1>
          <p className="text-[#1B3A6B]/60 mb-8">
            {reason === "canceled"
              ? "You cancelled the payment. No charge was made."
              : "Something went wrong. You were not charged. Please try again."}
          </p>
          <Link href="/events" className="inline-block px-6 py-3 bg-[#1B3A6B] text-white font-medium rounded-lg hover:bg-[#152e55] transition">
            Try Again
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#1B3A6B] animate-spin" />
      </div>
    }>
      <PaymentFailureContent />
    </Suspense>
  );
}