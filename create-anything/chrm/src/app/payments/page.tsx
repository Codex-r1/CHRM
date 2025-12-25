"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

// Define types
type EventType = {
  id: number;
  name: string;
  price: number;
  member_discount: number;
};

type FormData = {
  membership_number: string;
  full_name: string;
  email: string;
  phone: string;
  renewal_year: string;
  event_id: string;
};

type PaybillInfo = {
  amount: number;
  account_number: string;
};

export default function PaymentsPage() {
  const [paymentType, setPaymentType] = useState<"renewal" | "event">("renewal");
  const [events, setEvents] = useState<EventType[]>([]);
  const [formData, setFormData] = useState<FormData>({
    membership_number: "",
    full_name: "",
    email: "",
    phone: "",
    renewal_year: new Date().getFullYear().toString(),
    event_id: "",
  });
  const [step, setStep] = useState(1); // 1: form, 2: payment instructions, 3: success
  const [paybillInfo, setPaybillInfo] = useState<PaybillInfo>({
    amount: 0,
    account_number: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      if (response.ok) {
        const data: EventType[] = await response.json();
        setEvents(data);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (paymentType === "renewal") {
      setPaybillInfo({
        amount: 1000,
        account_number: `R-${formData.full_name}`,
      });
    } else {
      const selectedEvent = events.find(
        (e) => e.id === parseInt(formData.event_id),
      );
      if (selectedEvent) {
        const discount = selectedEvent.member_discount || 5;
        const discountedPrice =
          selectedEvent.price - (selectedEvent.price * discount) / 100;
        setPaybillInfo({
          amount: discountedPrice,
          account_number: `EVT-${formData.full_name}`,
        });
      }
    }

    setStep(2);
  };

  const handleConfirmPayment = () => {
    setStep(3);
  };

  if (step === 3) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col font-inter">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md text-center">
            <div className="bg-[#1e293b] p-8 rounded-lg border border-[#334155]">
              <div className="bg-green-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="text-green-500" size={48} />
              </div>
              <h1 className="text-3xl font-bold text-[#f8fafc] mb-4 font-poppins">
                Payment Submitted!
              </h1>
              <p className="text-[#cbd5e1] mb-6">
                Your payment will be verified by the admin. You'll be notified
                once it's confirmed.
              </p>
              <Link
                href="/"
                className="inline-block px-8 py-3 bg-[#2563eb] text-white font-bold rounded hover:bg-[#1d4ed8] transition"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col font-inter">
        <Header />
        <main className="flex-1 py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#1e293b] p-8 rounded-lg border border-[#334155]">
              <h1 className="text-3xl font-bold text-[#f8fafc] mb-6 text-center font-poppins">
                Complete Your Payment
              </h1>

              <div className="bg-[#d69e2e] p-6 rounded-lg mb-6">
                <h2 className="text-2xl font-bold text-[#0f172a] mb-4 font-poppins">
                  Amount: Ksh {paybillInfo.amount.toLocaleString()}
                </h2>
                <div className="space-y-3 text-[#1e293b]">
                  <p className="text-lg">
                    <strong>Paybill Number:</strong> 263532
                  </p>
                  <p className="text-lg">
                    <strong>Account Number:</strong>{" "}
                    {paybillInfo.account_number}
                  </p>
                  <p className="text-lg">
                    <strong>Amount:</strong> Ksh {paybillInfo.amount}
                  </p>
                </div>
              </div>

              <div className="bg-[#0f172a] p-6 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-[#f8fafc] mb-3 font-poppins">
                  Payment Instructions:
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-[#cbd5e1]">
                  <li>Go to M-PESA on your phone</li>
                  <li>Select Lipa na M-PESA</li>
                  <li>Select Pay Bill</li>
                  <li>
                    Enter Business Number:{" "}
                    <strong className="text-[#d69e2e]">263532</strong>
                  </li>
                  <li>
                    Enter Account Number:{" "}
                    <strong className="text-[#d69e2e]">
                      {paybillInfo.account_number}
                    </strong>
                  </li>
                  <li>
                    Enter Amount:{" "}
                    <strong className="text-[#d69e2e]">
                      Ksh {paybillInfo.amount}
                    </strong>
                  </li>
                  <li>Enter your M-PESA PIN and confirm</li>
                </ol>
              </div>

              <button
                onClick={handleConfirmPayment}
                className="w-full px-4 py-3 bg-[#2563eb] text-white font-bold rounded hover:bg-[#1d4ed8] transition"
              >
                I Have Completed Payment
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col font-inter">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#1e293b] p-8 rounded-lg border border-[#334155]">
            <h1 className="text-3xl font-bold text-[#f8fafc] mb-6 text-center font-poppins">
              Make a Payment
            </h1>

            {/* Payment Type Selection */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setPaymentType("renewal")}
                className={`px-6 py-4 rounded-lg font-bold transition ${
                  paymentType === "renewal"
                    ? "bg-[#d69e2e] text-[#0f172a]"
                    : "bg-[#0f172a] text-[#f8fafc] border border-[#334155]"
                }`}
              >
                Membership Renewal
              </button>
              <button
                onClick={() => setPaymentType("event")}
                className={`px-6 py-4 rounded-lg font-bold transition ${
                  paymentType === "event"
                    ? "bg-[#d69e2e] text-[#0f172a]"
                    : "bg-[#0f172a] text-[#f8fafc] border border-[#334155]"
                }`}
              >
                Event Payment
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {paymentType === "renewal" ? (
                <>
                  <div>
                    <label className="block text-[#f8fafc] mb-2 font-semibold">
                      Membership Number
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.membership_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          membership_number: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded text-[#f8fafc] focus:outline-none focus:border-[#d69e2e]"
                      placeholder="M-1234567890"
                    />
                  </div>

                  <div>
                    <label className="block text-[#f8fafc] mb-2 font-semibold">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded text-[#f8fafc] focus:outline-none focus:border-[#d69e2e]"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-[#f8fafc] mb-2 font-semibold">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded text-[#f8fafc] focus:outline-none focus:border-[#d69e2e]"
                      placeholder="john.doe@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-[#f8fafc] mb-2 font-semibold">
                      Phone
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded text-[#f8fafc] focus:outline-none focus:border-[#d69e2e]"
                      placeholder="0712345678"
                    />
                  </div>

                  <div>
                    <label className="block text-[#f8fafc] mb-2 font-semibold">
                      Renewal Year
                    </label>
                    <select
                      required
                      value={formData.renewal_year}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          renewal_year: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded text-[#f8fafc] focus:outline-none focus:border-[#d69e2e]"
                    >
                      {Array.from(
                        { length: 7 },
                        (_, i) => new Date().getFullYear() + i,
                      ).map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-[#0f172a] p-4 rounded border border-[#334155]">
                    <p className="text-[#cbd5e1]">
                      <strong className="text-[#d69e2e]">Amount:</strong> Ksh
                      1,000
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-[#f8fafc] mb-2 font-semibold">
                      Select Event
                    </label>
                    <select
                      required
                      value={formData.event_id}
                      onChange={(e) =>
                        setFormData({ ...formData, event_id: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded text-[#f8fafc] focus:outline-none focus:border-[#d69e2e]"
                    >
                      <option value="">Choose an event...</option>
                      {events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.name} - Ksh {event.price.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#f8fafc] mb-2 font-semibold">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded text-[#f8fafc] focus:outline-none focus:border-[#d69e2e]"
                      placeholder="John Doe"
                    />
                  </div>

                  {formData.event_id && (
                    <div className="bg-[#0f172a] p-4 rounded border border-[#334155]">
                      {(() => {
                        const selectedEvent = events.find(
                          (e) => e.id === parseInt(formData.event_id),
                        );
                        if (selectedEvent) {
                          const discount = selectedEvent.member_discount || 5;
                          const discountedPrice =
                            selectedEvent.price -
                            (selectedEvent.price * discount) / 100;
                          return (
                            <div className="space-y-2 text-[#cbd5e1]">
                              <p>
                                <strong className="text-[#d69e2e]">
                                  Original Price:
                                </strong>{" "}
                                Ksh {selectedEvent.price.toLocaleString()}
                              </p>
                              <p>
                                <strong className="text-[#d69e2e]">
                                  Member Discount:
                                </strong>{" "}
                                {discount}%
                              </p>
                              <p className="text-xl font-bold text-[#d69e2e]">
                                Final Amount: Ksh{" "}
                                {discountedPrice.toLocaleString()}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-[#d69e2e] text-[#0f172a] font-bold rounded hover:bg-[#b8832a] transition disabled:opacity-50"
              >
                Continue to Payment
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}