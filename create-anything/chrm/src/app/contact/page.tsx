"use client"
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Mail, Phone, MapPin, Clock, User, MessageSquare, ArrowRight, CreditCard } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  const contactMethods = [
    {
      icon: Mail,
      title: "Email",
      description: "We respond within 24 hours",
      color: "amber",
      items: [
        { text: "alumni@chrm.or.ke", href: "mailto:alumni@chrm.or.ke" },
        { text: "chrmalumniassociation@gmail.com", href: "mailto:chrmalumniassociation@gmail.com" }
      ]
    },
    {
      icon: Phone,
      title: "Phone",
      description: "Speak with our administrator",
      color: "amber",
      items: [
        { text: "0700 773 322", href: "tel:+254700773322" },
        { text: "0733 883 322", href: "tel:+254733883322" }
      ]
    },
    {
      icon: MapPin,
      title: "Location",
      description: "Visit our office",
      color: "amber",
      items: [
        { text: "Hazina Trade Centre, 13th Floor", href: "#" },
        { text: "CHRM Campus, Nairobi", href: "#" }
      ]
    }
  ];

  const officeHours = [
    { day: "Monday – Friday", time: "8:00 AM – 5:00 PM" },
    { day: "Saturday", time: "9:00 AM – 2:00 PM" },
    { day: "Sunday", time: "Closed" }
  ];

  const ctaButtons = [
    {
      text: "Register Now",
      href: "/payments",
      color: "amber",
      icon: User
    },
    {
      text: "About Us",
      href: "/about",
      color: "blue",
      icon: MessageSquare
    },
    {
      text: "Payments",
      href: "/payments",
      color: "green",
      icon: CreditCard
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col">
      <Header />

      <main className="flex-1 py-16 px-4">
        <div className="max-w-7xl mx-auto space-y-20">

          {/* HERO */}
          <section className="text-center animate-fade-in">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 bg-gradient-to-r from-amber-500/10 to-blue-500/10 rounded-full blur-3xl" />
              </div>
              <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-poppins">
                  Get in Touch
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Connect with the CHRM Alumni Association - We're here to help you with all your alumni needs
                </p>
              </div>
            </div>
          </section>

          {/* CONTACT METHODS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {contactMethods.map((method, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-8 border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden animate-fade-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br from-${method.color}-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  <div className={`w-16 h-16 bg-gradient-to-br from-${method.color}-500 to-${method.color === 'amber' ? 'yellow' : method.color}-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <method.icon className="text-white" size={28} />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                    {method.title}
                  </h3>
                  <p className="text-gray-600 mb-6 text-center">
                    {method.description}
                  </p>
                  
                  <div className="space-y-3">
                    {method.items.map((item, i) => (
                      <div
                        key={i}
                        className="animate-fade-in"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        {item.href !== '#' ? (
                          <a
                            href={item.href}
                            className={`block text-center text-${method.color}-600 hover:text-${method.color}-700 font-medium hover:underline transition-colors duration-200`}
                          >
                            {item.text}
                          </a>
                        ) : (
                          <p className="text-center text-gray-700">
                            {item.text}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* PAYMENT INFO */}
          <section className="relative bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl p-8 text-center overflow-hidden animate-scale-in">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4zIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')]"></div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-4 font-poppins">
                Payment Information
              </h2>
              <div className="inline-block bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full mb-2 animate-pulse">
                <p className="text-lg text-white font-bold">
                  M-PESA Paybill: <span className="text-2xl">263532</span>
                </p>
              </div>
              <p className="text-white/90 text-sm mt-2">
                Use the correct account number depending on the service
              </p>
            </div>
          </section>

          {/* OFFICE HOURS & ADMIN */}
          <section className="grid md:grid-cols-2 gap-8">
            {/* Office Hours */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-up">
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-xl flex items-center justify-center mr-4">
                  <Clock className="text-amber-600" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Office Hours</h3>
              </div>
              
              <div className="space-y-4">
                {officeHours.map((hour, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200 animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <span className="font-medium text-gray-700">{hour.day}</span>
                    <span className={`font-bold ${hour.day === 'Sunday' ? 'text-gray-400' : 'text-amber-600'}`}>
                      {hour.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Administrator */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mr-4">
                  <User className="text-blue-600" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Administrator</h3>
              </div>
              
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl animate-scale-in">
                <p className="font-bold text-lg text-gray-900">Ms Mercy Wambui</p>
                <p className="text-blue-600 font-medium">CHRMAA Administrator</p>
              </div>
              
              <div className="space-y-3">
                <a
                  href="mailto:alumni@chrm.or.ke"
                  className="flex items-center gap-3 text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors duration-200 animate-fade-in"
                  style={{ animationDelay: '100ms' }}
                >
                  <Mail size={18} />
                  alumni@chrm.or.ke
                </a>
                <a
                  href="tel:+254700773322"
                  className="flex items-center gap-3 text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors duration-200 animate-fade-in"
                  style={{ animationDelay: '200ms' }}
                >
                  <Phone size={18} />
                  0700 773 322
                </a>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-gradient-to-br from-gray-900 to-slate-800 rounded-2xl p-10 text-center overflow-hidden animate-scale-in">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full -translate-x-16 -translate-y-16" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full translate-x-20 translate-y-20" />
            
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl text-white font-bold mb-8 font-poppins animate-fade-in">
                Ready to Engage with CHRMAA?
              </h2>
              
              <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-6">
                {ctaButtons.map((button, index) => (
                  <div
                    key={index}
                    className="relative animate-fade-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Link
                      href={button.href}
                      className={`group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-${button.color}-500 to-${button.color === 'amber' ? 'yellow' : button.color}-600 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300`}
                    >
                      <button.icon size={20} />
                      {button.text}
                      <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                    </Link>
                  </div>
                ))}
              </div>
              
              <p className="text-gray-300 mt-8 text-sm animate-fade-in" style={{ animationDelay: '300ms' }}>
                Connect with thousands of HR professionals in our network
              </p>
            </div>
          </section>

        </div>
      </main>

      <Footer />

      {/* Add custom CSS animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-fade-up {
          animation: fade-up 0.6s ease-out forwards;
        }

        .animate-scale-in {
          animation: scale-in 0.6s ease-out forwards;
        }

        .animate-pulse {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}