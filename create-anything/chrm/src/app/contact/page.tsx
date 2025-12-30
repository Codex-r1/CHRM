import Header from "../components/Header";
import Footer from "../components/Footer";
import { Mail, Phone, MapPin, Clock, User } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 py-16 px-4">
        <div className="max-w-7xl mx-auto space-y-20">

          {/* HERO */}
          <section className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Contact Us
            </h1>
            <p className="text-lg text-slate-600">
              Get in touch with the CHRM Alumni Association
            </p>
          </section>

          {/* CONTACT METHODS */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Email */}
            <div className="border rounded-xl p-6 text-center">
              <Mail className="mx-auto text-amber-500 mb-4" size={32} />
              <h3 className="text-xl font-semibold mb-2">Email</h3>
              <p className="text-slate-600 mb-4">
                We respond within 24 hours
              </p>
              <div className="space-y-1">
                <a className="block text-amber-600" href="mailto:alumni@chrm.or.ke">
                  alumni@chrm.or.ke
                </a>
                <a className="block text-amber-600" href="mailto:chrmalumniassociation@gmail.com">
                  chrmalumniassociation@gmail.com
                </a>
              </div>
            </div>

            {/* Phone */}
            <div className="border rounded-xl p-6 text-center">
              <Phone className="mx-auto text-blue-600 mb-4" size={32} />
              <h3 className="text-xl font-semibold mb-2">Phone</h3>
              <p className="text-slate-600 mb-4">
                Speak with our administrator
              </p>
              <div className="space-y-1">
                <a className="block text-blue-600" href="tel:+254700773322">
                  0700 773 322
                </a>
                <a className="block text-blue-600" href="tel:+254733883322">
                  0733 883 322
                </a>
              </div>
            </div>

            {/* Location */}
            <div className="border rounded-xl p-6 text-center">
              <MapPin className="mx-auto text-amber-500 mb-4" size={32} />
              <h3 className="text-xl font-semibold mb-2">Location</h3>
              <p className="text-slate-600">
                Hazina Trade Centre, 13th Floor  
                <br />
                CHRM Campus, Nairobi
              </p>
            </div>
          </section>

          {/* PAYMENT INFO */}
          <section className="bg-slate-50 rounded-xl p-8 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Payment Information
            </h2>
            <p className="text-lg text-slate-700">
              <strong className="text-amber-600">M-PESA Paybill:</strong> 263532
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Use the correct account number depending on the service.
            </p>
          </section>

          {/* OFFICE HOURS & ADMIN */}
          <section className="grid md:grid-cols-2 gap-8">
            {/* Office Hours */}
            <div className="border rounded-xl p-8">
              <div className="flex items-center mb-6">
                <Clock className="text-amber-500 mr-3" />
                <h3 className="text-xl font-semibold">Office Hours</h3>
              </div>
              <div className="space-y-3 text-slate-700">
                <div className="flex justify-between">
                  <span>Monday – Friday</span>
                  <span>8:00 AM – 5:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span>9:00 AM – 2:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>

            {/* Administrator */}
            <div className="border rounded-xl p-8">
              <div className="flex items-center mb-6">
                <User className="text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold">Administrator</h3>
              </div>
              <p className="font-bold text-slate-900">Ms Mercy Wambui</p>
              <p className="text-slate-600 mb-4">CHRMAA Administrator</p>
              <div className="space-y-2">
                <a className="block text-blue-600" href="mailto:alumni@chrm.or.ke">
                  alumni@chrm.or.ke
                </a>
                <a className="block text-blue-600" href="tel:+254700773322">
                  0700 773 322
                </a>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className=" rounded-xl p-10 text-center bg-[#fff]">
            <h2 className="text-2xl text-[#000] font-bold mb-6">Need Something Else?</h2>
            <div className="flex flex-col md:flex-row justify-center gap-6">
              <a
                href="/register"
                className="bg-amber-500 hover:bg-amber-600 px-6 py-3 rounded-lg font-bold text-slate-900"
              >
                Register Now
              </a>
              <a
                href="/about"
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold"
              >
                About Us
              </a>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
