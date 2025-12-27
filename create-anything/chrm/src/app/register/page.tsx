"use client";

import { useState, FormEvent } from "react"; // Added FormEvent import
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

type FormData = {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  graduation_year: string;
};

type RegistrationResponse = {
  registration_fee: number;
  account_number: string;
};

export default function RegisterPage() {
  const [step, setStep] = useState(1); // 1: form, 2: payment instructions, 3: success
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    graduation_year: "",
  });
  const [registrationFee, setRegistrationFee] = useState(0);
  const [accountNumber, setAccountNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Registration failed");
      }

      const data: RegistrationResponse = await response.json();
      setRegistrationFee(data.registration_fee);
      setAccountNumber(data.account_number);
      setStep(2); // Move to payment instructions
    } catch (err) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = () => {
    setStep(3); // Move to success
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
                Registration Successful!
              </h1>
              <p className="text-[#cbd5e1] mb-6">
                Your account has been created. Once your payment is confirmed by
                the admin, you'll be able to access all member benefits.
              </p>
              <Link
                href="/login"
                className="inline-block px-8 py-3 bg-[#2563eb] text-white font-bold rounded hover:bg-[#1d4ed8] transition"
              >
                Go to Login
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
                  Registration Fee: Ksh {registrationFee.toLocaleString()}
                </h2>
                <div className="space-y-3 text-[#1e293b]">
                  <p className="text-lg">
                    <strong>Paybill Number:</strong> 263532
                  </p>
                  <p className="text-lg">
                    <strong>Account Number:</strong> {accountNumber}
                  </p>
                  <p className="text-lg">
                    <strong>Amount:</strong> Ksh {registrationFee}
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
                    <strong className="text-[#d69e2e]">{accountNumber}</strong>
                  </li>
                  <li>
                    Enter Amount:{" "}
                    <strong className="text-[#d69e2e]">
                      Ksh {registrationFee}
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

              <p className="text-sm text-[#94a3b8] text-center mt-4">
                Your account will be activated once the admin confirms your
                payment
              </p>
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
            <h1 className="text-3xl font-bold text-[#f8fafc] mb-2 text-center font-poppins">
              Join CHRMAA
            </h1>
            <p className="text-[#cbd5e1] text-center mb-6">
              Register to become a member of the CHRM Alumni Association
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[#f8fafc] mb-2 font-semibold">
                  Full Name <span className="text-red-500">*</span>
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
                  Email <span className="text-red-500">*</span>
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
                  Phone Number
                </label>
                <input
                  type="tel"
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
                  Graduation Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="2000"
                  max="2030"
                  value={formData.graduation_year}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      graduation_year: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded text-[#f8fafc] focus:outline-none focus:border-[#d69e2e]"
                  placeholder="2024"
                />
               
              </div>

              <div>
                <label className="block text-[#f8fafc] mb-2 font-semibold">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded text-[#f8fafc] focus:outline-none focus:border-[#d69e2e]"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-[#d69e2e] text-[#0f172a] font-bold rounded hover:bg-[#b8832a] transition disabled:opacity-50"
              >
                {loading ? "Processing..." : "Continue to Payment"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[#cbd5e1]">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-[#d69e2e] hover:underline font-semibold"
                >
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}