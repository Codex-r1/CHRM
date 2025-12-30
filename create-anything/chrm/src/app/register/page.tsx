"use client";

import { useState, FormEvent } from "react";
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

export default function RegisterPage() {
  const [step, setStep] = useState(1); // 1: form, 2: payment instructions, 3: success
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    graduation_year: "",
  });
  const [registrationFee] = useState(1000); // Set your registration fee here
  const [accountNumber, setAccountNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Generate account number for payment
    const generatedAccountNumber = `R-${formData.full_name.replace(/\s+/g, '')}`;
    setAccountNumber(generatedAccountNumber);
    
    // Move to payment instructions
    setStep(2);
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    setError("");
    
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

      // Account created successfully, move to success page
      setStep(3);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const navigateHome = (): void => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  if (step === 3) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#121212] transition-colors duration-200">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md text-center">
            <div className="bg-white dark:bg-[#1E1E1E] border border-[#E7ECF3] dark:border-[#2A2A2A] rounded-xl p-8 transition-colors duration-200">
              <div className="bg-green(1000/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="text-green(1000" size={48} />
              </div>
              <h1 className="text-3xl font-bold font-poppins text-[#0B0F1A] dark:text-[#E5E7EB] mb-4 transition-colors duration-200">
                Account Created Successfully!
              </h1>
              <p className="text-[#6D7A8B] dark:text-[#9CA3AF] font-inter mb-6 transition-colors duration-200">
                Your account has been created and you can now log in. Your payment will be verified by the admin, and once confirmed, you'll have full access to all member benefits.
              </p>
              <Link
                href="/login"
                className="inline-block px-8 py-3 bg-[#2B4C73] text-white font-montserrat font-semibold rounded-lg hover:bg-[#1E3A5F] transition-colors duration-200"
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
      <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#121212] transition-colors duration-200">
        <Header />
        <main className="flex-1 py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-[#1E1E1E] border border-[#E7ECF3] dark:border-[#2A2A2A] rounded-xl p-8 md:p-12 transition-colors duration-200">
              <h1 className="text-3xl font-bold font-poppins text-[#0B0F1A] dark:text-[#E5E7EB] mb-6 text-center transition-colors duration-200">
                Complete Your Payment
              </h1>

              {error && (
                <div className="bg-red(1000/10 border border-red(1000 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6 font-inter transition-colors duration-200">
                  {error}
                </div>
              )}

              <div className="bg-[#E8F4FD] dark:bg-[#1A2F42] p-6 rounded-lg mb-6 transition-colors duration-200">
                <h2 className="text-2xl font-bold font-poppins text-[#2B4C73] dark:text-[#4A6B8A] mb-4 transition-colors duration-200">
                  Registration Fee: Ksh {registrationFee.toLocaleString()}
                </h2>
                <div className="space-y-3 text-[#0B0F1A] dark:text-[#E5E7EB] font-inter transition-colors duration-200">
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

              <div className="bg-[#FFF4E6] dark:bg-[#3D2B1A] p-6 rounded-lg mb-6 transition-colors duration-200">
                <h3 className="text-xl font-bold font-poppins text-[#0B0F1A] dark:text-[#E5E7EB] mb-3 transition-colors duration-200">
                  Payment Instructions:
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-[#6D7A8B] dark:text-[#9CA3AF] font-inter transition-colors duration-200">
                  <li>Go to M-PESA on your phone</li>
                  <li>Select Lipa na M-PESA</li>
                  <li>Select Pay Bill</li>
                  <li>
                    Enter Business Number:{" "}
                    <strong className="text-[#FF7A00]">263532</strong>
                  </li>
                  <li>
                    Enter Account Number:{" "}
                    <strong className="text-[#FF7A00]">{accountNumber}</strong>
                  </li>
                  <li>
                    Enter Amount:{" "}
                    <strong className="text-[#FF7A00]">
                      Ksh {registrationFee}
                    </strong>
                  </li>
                  <li>Enter your M-PESA PIN and confirm</li>
                </ol>
              </div>

              <button
                onClick={handleConfirmPayment}
                disabled={loading}
                className="w-full px-4 py-3 bg-[#2B4C73] text-white font-montserrat font-semibold rounded-lg hover:bg-[#1E3A5F] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating Account..." : "I Have Completed Payment"}
              </button>

              <p className="text-sm text-[#6D7A8B] dark:text-[#9CA3AF] font-inter text-center mt-4 transition-colors duration-200">
                Your account will be created when you click the button above. You can log in immediately, but full member benefits will be available once the admin confirms your payment.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF]  transition-colors duration-200">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white  p-8 md:p-12 transition-colors duration-200">
            <h1 className="text-3xl md:text-4xl font-bold font-poppins text-[#000]  mb-2 text-center transition-colors duration-200">
              Join CHRMAA
            </h1>
            <p className="text-[#000] font-inter text-center mb-8 transition-colors duration-200">
              Register to become a member of the CHRM Alumni Association
            </p>

            {error && (
              <div className="bg-red(1000/10 border border-red(1000 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6 font-inter transition-colors duration-200">
                {error}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div>
                <label className="block font-poppins font-semibold text-sm text-[#000] mb-2 transition-colors duration-200">
                  Full Name <span className="text-red(1000">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-[#2B4C73] rounded-lg font-inter text-[#000] bg-white light:bg-[#fff] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2B4C73] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block font-poppins font-semibold text-sm text-[#000] mb-2 transition-colors duration-200">
                  Email <span className="text-red(1000">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-[#2B4C73] rounded-lg font-inter text-[#000] bg-white light:bg-[#fff] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2B4C73] focus:border-transparent"
                  
                />
              </div>

              <div>
                <label className="block font-poppins font-semibold text-sm text-[#000] mb-2 transition-colors duration-200">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-[#2B4C73] rounded-lg font-inter text-[#000] bg-white light:bg-[#fff] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2B4C73] focus:border-transparent"
                  
                />
              </div>

              <div>
                <label className="block font-poppins font-semibold text-sm text-[#000] mb-2 transition-colors duration-200">
                  Graduation Year <span className="text-red(1000">*</span>
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
                  className="w-full px-4 py-3 border border-[#2B4C73] rounded-lg font-inter text-[#000] bg-white light:bg-[#fff] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2B4C73] focus:border-transparent"
                  placeholder="2024"
                />
              </div>

              <div>
                <label className="block font-poppins font-semibold text-sm text-[#000] mb-2 transition-colors duration-200">
                  Password <span className="text-red(1000">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-[#2B4C73] rounded-lg font-inter text-[#000] bg-white light:bg-[#fff] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#2B4C73] focus:border-transparent"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-4 bg-[#2B4C73] text-white font-montserrat font-semibold text-lg rounded-lg hover:bg-[#1E3A5F] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Payment
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-[#000] font-inter transition-colors duration-200">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-[#2B4C73] dark:text-[#4A6B8A] hover:underline font-semibold transition-colors duration-200"
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