import Header from "../components/Header";
import Footer from "../components/Footer";
import { Mail, Phone, MapPin, Clock, User, MessageCircle, Send } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col font-inter">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-[#f8fafc] mb-4 font-poppins">
              Contact Us
            </h1>
            <p className="text-xl text-[#cbd5e1]">
              Get in touch with the CHRM Alumni Association
            </p>
          </div>

          {/* Contact Information Grid - UPDATED with 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Email - UPDATED with both emails */}
            <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155] text-center">
              <div className="bg-[#d69e2e] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-[#0f172a]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#f8fafc] mb-2 font-poppins">
                Email
              </h3>
              <p className="text-[#cbd5e1] mb-2">
                Send us an email and we'll respond within 24 hours
              </p>
              <div className="space-y-1">
                <a href="mailto:alumni@chrm.or.ke" className="text-[#d69e2e] hover:text-[#f59e0b] block">
                  alumni@chrm.or.ke
                </a>
                <a href="mailto:chrmalumniassociation@gmail.com" className="text-[#d69e2e] hover:text-[#f59e0b] block">
                  chrmalumniassociation@gmail.com
                </a>
              </div>
            </div>

            {/* Phone - UPDATED with both phone numbers */}
            <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155] text-center">
              <div className="bg-[#2563eb] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="text-white" size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#f8fafc] mb-2 font-poppins">
                Phone
              </h3>
              <p className="text-[#cbd5e1] mb-2">
                Speak directly with our administrator
              </p>
              <div className="space-y-1">
                <a href="tel:+254700773322" className="text-[#d69e2e] hover:text-[#f59e0b] block">
                  0700773322
                </a>
                <a href="tel:+254733883322" className="text-[#d69e2e] hover:text-[#f59e0b] block">
                  0733883322
                </a>
              </div>
            </div>

            {/* Location - UPDATED with full address */}
            <div className="bg-[#1e293b] p-6 rounded-lg border border-[#334155] text-center">
              <div className="bg-[#d69e2e] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="text-[#0f172a]" size={28} />
              </div>
              <h3 className="text-xl font-bold text-[#f8fafc] mb-2 font-poppins">
                Location
              </h3>
              <p className="text-[#cbd5e1] mb-2">
                Come see us at the CHRM campus
              </p>
              <div className="text-sm text-[#d69e2e] font-medium">
                HAZINA TRADE CENTRE 13TH FLOOR
                <br />
                CHRM Campus
                <br />
                Nairobi, Kenya
              </div>
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

          {/* NEW: Two Column Layout for Additional Information */}
          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* center: Office Hours & Administrator */}
            <div className="space-y-20 items-center">
              {/* Office Hours */}
              <div className="bg-[#1e293b] p-8 rounded-lg border border-[#334155]">
                <div className="flex items-center mb-6">
                  <Clock className="text-[#d69e2e] mr-3" size={24} />
                  <h3 className="text-xl font-bold text-[#f8fafc] font-poppins">
                    Office Hours
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[#f8fafc] font-medium">Monday - Friday</span>
                    <span className="text-[#cbd5e1]">8:00 AM - 5:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#f8fafc] font-medium">Saturday</span>
                    <span className="text-[#cbd5e1]">9:00 AM - 2:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#f8fafc] font-medium">Sunday</span>
                    <span className="text-[#cbd5e1]">Closed</span>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-[#1e40af]/10 rounded-lg">
                  <p className="text-sm text-[#93c5fd]">
                    📞 For urgent matters outside office hours, you can reach our
                    administrator at the phone numbers provided above.
                  </p>
                </div>
              </div>

              {/* Administrator Contact */}
              <div className="bg-gradient-to-r from-[#1e40af] to-[#d69e2e] p-8 rounded-lg">
                <div className="flex items-center mb-6">
                  <User className="text-white mr-3" size={24} />
                  <h3 className="text-xl font-bold text-white font-poppins">
                    Administrator
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-bold text-white">MS Mercy Wambui</h4>
                    <p className="text-[#fbbf24]">CHRMAA Administrator</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Mail size={18} className="text-white mr-3" />
                      <a href="mailto:alumni@chrm.or.ke" className="text-white hover:text-[#fbbf24]">
                        alumni@chrm.or.ke
                      </a>
                    </div>
                    <div className="flex items-center">
                      <Phone size={18} className="text-white mr-3" />
                      <div className="flex gap-4">
                        <a href="tel:+254700773322" className="text-white hover:text-[#fbbf24]">
                          0700773322
                        </a>
                        <a href="tel:+254733883322" className="text-white hover:text-[#fbbf24]">
                          0733883322
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
 </div>
          {/* Quick Links CTA */}
          <div className="bg-gradient-to-r from-[#1e40af] to-[#1e293b] p-8 rounded-lg border border-[#334155] text-center">
            <h2 className="text-2xl font-bold text-white mb-6 font-poppins">
              Need Something Else?
            </h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <h4 className="text-lg font-bold text-white mb-3">New Member?</h4>
                <p className="text-[#cbd5e1] mb-4">Start your journey with us</p>
                <a
                  href="/register"
                  className="inline-block bg-[#d69e2e] hover:bg-[#b8832a] text-[#0f172a] font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  Register Now
                </a>
              </div>
              <div className="text-center">
                <h4 className="text-lg font-bold text-white mb-3">Learn About Us?</h4>
                <p className="text-[#cbd5e1] mb-4">Discover our mission and team</p>
                <a
                  href="/about"
                  className="inline-block bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  About Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}