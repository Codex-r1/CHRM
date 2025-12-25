import Header from "../components/Header";
import Footer from "../components/Footer";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col font-inter">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-[#f8fafc] mb-4 font-poppins">
              Contact Us
            </h1>
            <p className="text-xl text-[#cbd5e1]">
              Get in touch with the CHRM Alumni Association
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Email */}
            <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155] text-center">
              <div className="bg-[#d69e2e] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-[#0f172a]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#f8fafc] mb-2 font-poppins">
                Email
              </h3>
              <p className="text-[#cbd5e1]">chrmalumniassociation@gmail.com</p>
            </div>

            {/* Phone */}
            <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155] text-center">
              <div className="bg-[#2563eb] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="text-white" size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#f8fafc] mb-2 font-poppins">
                Phone
              </h3>
              <p className="text-[#cbd5e1]">
                Contact us via email for inquiries
              </p>
            </div>

            {/* Location */}
            <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155] text-center">
              <div className="bg-[#d69e2e] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="text-[#0f172a]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#f8fafc] mb-2 font-poppins">
                Location
              </h3>
              <p className="text-[#cbd5e1]">CHRM College Campus</p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-gradient-to-br from-[#d69e2e] to-[#b8832a] p-8 rounded-lg mb-8">
            <h2 className="text-3xl font-bold text-[#0f172a] mb-6 font-poppins text-center">
              Payment Information
            </h2>
            <div className="bg-[#0f172a] p-6 rounded-lg">
              <div className="space-y-3 text-[#cbd5e1]">
                <p className="text-xl">
                  <strong className="text-[#d69e2e]">
                    M-PESA Paybill Number:
                  </strong>{" "}
                  263532
                </p>
                <p className="text-sm text-[#94a3b8]">
                  Use appropriate account numbers as instructed during
                  registration, renewal, events, or merchandise purchase.
                </p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-[#1e293b] p-8 rounded-lg border border-[#334155]">
            <h2 className="text-2xl font-bold text-[#f8fafc] mb-4 font-poppins">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4 text-[#cbd5e1]">
              <div>
                <h3 className="font-bold text-[#d69e2e] mb-2">
                  How do I become a member?
                </h3>
                <p>
                  Visit our Registration page and complete the payment-first
                  registration process. Your membership will be activated once
                  payment is confirmed.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-[#d69e2e] mb-2">
                  How long does payment verification take?
                </h3>
                <p>
                  Our admin team verifies payments daily. You should receive
                  confirmation within 24-48 hours.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-[#d69e2e] mb-2">
                  Can I purchase merchandise without being a member?
                </h3>
                <p>
                  Yes! Our merchandise is available to everyone. However,
                  members receive special discounts on events.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-[#d69e2e] mb-2">
                  How do I renew my membership?
                </h3>
                <p>
                  Visit our Payments page and select Membership Renewal. The
                  annual renewal fee is Ksh 1,000.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
