"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header"; 
import Footer from "../components/Footer";  

type FormData = {
  email: string;
  password: string;
};

type User = {
  role: "admin" | "member";
  // Add other user properties as needed
};

export default function LoginPage() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Fixed: lowercase 'l'
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => { // Fixed: camelCase
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Login failed");
      }

      const user: User = await response.json();

      // Store user data
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(user));
      }

      // Redirect based on role
      if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/member/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col font-inter">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-[#1e293b] p-8 rounded-lg border border-[#334155]">
            <h1 className="text-3xl font-bold text-[#f8fafc] mb-2 text-center font-poppins">
              Welcome Back
            </h1>
            <p className="text-[#cbd5e1] text-center mb-6">
              Sign in to access your dashboard
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-[#f8fafc] mb-2 font-semibold">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded text-[#f8fafc] focus:outline-none focus:border-[#d69e2e]"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-[#2563eb] text-white font-bold rounded hover:bg-[#1d4ed8] transition disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[#cbd5e1]">
                Don't have an account?{" "}
                <a
                  href="/register"
                  className="text-[#d69e2e] hover:underline font-semibold"
                >
                  Register here
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}