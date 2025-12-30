import Header from "./components/Header";
import Footer from "./components/Footer";
import { Users, Calendar, ShoppingBag, Award } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-inter">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#FFF] to-[#FFF] py-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-[#] mb-6 font-poppins">
              Welcome to CHRM Alumni Association
            </h1>
            <p className="text-xl text-[#] mb-8 max-w-3xl mx-auto">
              Connecting HR professionals, fostering growth, and building
              lasting relationships among CHRM College graduates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="px-8 py-4 bg-[#d69e2e] text-[#0f172a] font-bold rounded-lg hover:bg-[#b8832a] transition text-lg"
              >
                Join the Association
              </Link>
              <Link
                href="/about"
                className="px-8 py-4 bg-[#2563eb] text-white font-bold rounded-lg hover:bg-[#1d4ed8] transition text-lg"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0f172a] text-center mb-12 font-poppins">
              What We Offer
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155] hover:border-[#d69e2e] transition">
                <div className="bg-[#d69e2e] w-14 h-14 rounded-full flex items-center justify-center mb-4">
                  <Users className="text-[#0f172a]" size={28} />
                </div>
                <h3 className="text-xl font-bold text-[#fff]
 mb-3 font-poppins">
                  Networking
                </h3>
                <p className="text-[#cbd5e1]">
                  Connect with fellow HR professionals and expand your network
                  across industries.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155] hover:border-[#d69e2e] transition">
                <div className="bg-[#2563eb] w-14 h-14 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="text-white" size={28} />
                </div>
                <h3 className="text-xl font-bold text-[#fff]
 mb-3 font-poppins">
                  Events
                </h3>
                <p className="text-[#cbd5e1]">
                  Attend exclusive alumni events, workshops, and professional
                  development sessions.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155] hover:border-[#d69e2e] transition">
                <div className="bg-[#d69e2e] w-14 h-14 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="text-[#0f172a]" size={28} />
                </div>
                <h3 className="text-xl font-bold text-[#fff]
 mb-3 font-poppins">
                  Merchandise
                </h3>
                <p className="text-[#cbd5e1]">
                  Get exclusive CHRMAA branded merchandise to show your alumni
                  pride.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155] hover:border-[#d69e2e] transition">
                <div className="bg-[#2563eb] w-14 h-14 rounded-full flex items-center justify-center mb-4">
                  <Award className="text-white" size={28} />
                </div>
                <h3 className="text-xl font-bold text-[#fff] mb-3 font-poppins">
                  Benefits
                </h3>
                <p className="text-[#cbd5e1]">
                  Enjoy member discounts on events, resources, and exclusive
                  opportunities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-[#d69e2e] to-[#b8832a] py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0f172a] mb-6 font-poppins">
              Ready to Join?
            </h2>
            <p className="text-lg text-[#1e293b] mb-8">
              Register today and become part of a thriving community of HR
              professionals.
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-4 bg-black text-white font-bold rounded-lg hover:bg-[#1e293b] transition text-lg"
            >
              Register Now
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}