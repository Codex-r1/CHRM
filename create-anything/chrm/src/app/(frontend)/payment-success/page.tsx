"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'succeeded' | 'processing' | 'failed'>('loading');

  useEffect(() => {
    const redirectStatus = searchParams.get("redirect_status");
    if (redirectStatus === "succeeded") setStatus("succeeded");
    else if (redirectStatus === "processing") setStatus("processing");
    else if (redirectStatus === "failed" || redirectStatus === "canceled") setStatus("failed");
    else setStatus("succeeded");
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-12 h-12 text-[#1B3A6B] animate-spin mx-auto mb-4" />
              <p className="text-[#1B3A6B]/60">Confirming payment…</p>
            </>
          )}
          {status === "succeeded" && (
            <>
              <div className="w-20 h-20 bg-[#C9A84C]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="text-[#C9A84C]" size={40} />
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#1B3A6B] mb-4">Payment Confirmed</h1>
              <p className="text-[#1B3A6B]/60 mb-8">
                Your payment has been received. You'll get a confirmation email shortly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/events" className="px-6 py-3 bg-[#1B3A6B] text-white font-medium rounded-lg hover:bg-[#152e55] transition">
                  Back to Events
                </Link>
                <Link href="/member/dashboard" className="px-6 py-3 border border-[#1B3A6B]/20 text-[#1B3A6B] font-medium rounded-lg hover:bg-[#1B3A6B]/5 transition">
                  My Dashboard
                </Link>
              </div>
            </>
          )}
          {status === "processing" && (
            <>
              <Loader2 className="w-12 h-12 text-[#C9A84C] animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-serif font-bold text-[#1B3A6B] mb-2">Payment Processing</h1>
              <p className="text-[#1B3A6B]/60">We'll notify you by email once it's confirmed.</p>
            </>
          )}
          {status === "failed" && (
            <>
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="text-red-500" size={40} />
              </div>
              <h1 className="text-3xl font-serif font-bold text-[#1B3A6B] mb-4">Payment Failed</h1>
              <p className="text-[#1B3A6B]/60 mb-8">You were not charged. Please try again.</p>
              <Link href="/events" className="inline-block px-6 py-3 bg-[#1B3A6B] text-white font-medium rounded-lg hover:bg-[#152e55] transition">
                Try Again
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#1B3A6B] animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}