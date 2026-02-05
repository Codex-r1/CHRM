"use client"
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Mail, Phone, MapPin, Clock, User, MessageSquare, ArrowRight, CreditCard, Target, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

// Animation Variants
const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const fadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
    },
  },
};

const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function ContactPage() {
  const contactMethods = [
    {
      icon: Mail,
      title: "Email",
      description: "We respond within 24 hours",
      color: "blue",
      gradient: "from-[#2B4C73]/20 to-transparent",
      iconBg: "bg-gradient-to-br from-[#2B4C73] to-[#1A3557]",
      textColor: "text-[#2B4C73]",
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
      gradient: "from-[#FF7A00]/20 to-transparent",
      iconBg: "bg-gradient-to-br from-[#FF7A00] to-[#E56B00]",
      textColor: "text-[#FF7A00]",
      items: [
        { text: "0700 773 322", href: "tel:+254700773322" },
        { text: "0733 883 322", href: "tel:+254733883322" }
      ]
    },
    {
      icon: MapPin,
      title: "Location",
      description: "Visit our office",
      color: "red",
      gradient: "from-[#E53E3E]/20 to-transparent",
      iconBg: "bg-gradient-to-br from-[#E53E3E] to-[#CC3636]",
      textColor: "text-[#E53E3E]",
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
      icon: User,
      gradient: "from-[#FF7A00] to-[#E56B00]"
    },
    {
      text: "About Us",
      href: "/about",
      color: "blue",
      icon: MessageSquare,
      gradient: "from-[#2B4C73] to-[#1A3557]"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F9FC] to-white flex flex-col">
      <Header />

      <main className="flex-1 py-16 px-4">
        <div className="max-w-7xl mx-auto space-y-16">

          {/* HERO */}
          <motion.section 
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-center"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-64 h-64 bg-gradient-to-r from-[#2B4C73]/10 to-[#FF7A00]/10 rounded-full blur-3xl"
                />
              </div>
              <div className="relative z-10">
                <motion.div
                  variants={fadeUp}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2B4C73]/10 to-[#FF7A00]/10 px-6 py-3 rounded-full mb-6"
                >
                  <div className="w-3 h-3 bg-[#2B4C73] rounded-full animate-pulse" />
                  <span className="text-[#2B4C73] font-semibold">Contact CHRMAA</span>
                </motion.div>
                
                <motion.h1
                  variants={fadeUp}
                  transition={{ delay: 0.1 }}
                  className="text-4xl md:text-5xl font-bold text-[#0B0F1A] mb-6 font-poppins"
                >
                  Get in <span className="bg-gradient-to-r from-[#2B4C73] via-[#FF7A00] to-[#E53E3E] bg-clip-text text-transparent">Touch</span>
                </motion.h1>
                <motion.p
                  variants={fadeUp}
                  transition={{ delay: 0.2 }}
                  className="text-lg text-[#6D7A8B] max-w-2xl mx-auto"
                >
                  Connect with the CHRM Alumni Association - We're here to help you with all your alumni needs
                </motion.p>
              </div>
            </div>
          </motion.section>

          {/* CONTACT METHODS */}
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {contactMethods.map((method, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                custom={index}
                whileHover={{ scale: 1.05, y: -8 }}
                className="group relative bg-white rounded-2xl p-8 border-2 border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 ${method.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className={`w-16 h-16 ${method.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}
                  >
                    <method.icon className="text-white" size={28} />
                  </motion.div>
                  
                  <motion.h3
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className={`text-xl font-semibold mb-2 text-center ${method.textColor}`}
                  >
                    {method.title}
                  </motion.h3>
                  <motion.p
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-[#6D7A8B] mb-6 text-center"
                  >
                    {method.description}
                  </motion.p>
                  
                  <div className="space-y-3">
                    {method.items.map((item, i) => (
                      <motion.div
                        key={i}
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                      >
                        {item.href !== '#' ? (
                          <a
                            href={item.href}
                            className={`block text-center ${method.textColor} hover:opacity-80 font-medium hover:underline transition-all duration-200`}
                          >
                            {item.text}
                          </a>
                        ) : (
                          <p className="text-center text-[#6D7A8B]">
                            {item.text}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* PAYMENT INFO */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
            className="relative bg-gradient-to-r from-[#2B4C73] fto-[#E53E3E] rounded-2xl p-8 text-center overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4zIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')]"></div>
            </div>
            
            <div className="relative z-10">
              <motion.div
                variants={fadeUp}
                className="flex items-center justify-center gap-3 mb-4"
              >
                <CreditCard className="text-white" size={28} />
                <h2 className="text-3xl font-bold text-white font-poppins">
                  Payment Information
                </h2>
              </motion.div>
              
              <motion.div
                variants={scaleIn}
                className="inline-block bg-white/20 backdrop-blur-sm px-8 py-3 rounded-2xl mb-4 border border-white/30"
              >
                <p className="text-lg text-white font-bold">
                  M-PESA Paybill: <span className="text-2xl font-mono">263532</span>
                </p>
              </motion.div>
              
              <motion.p
                variants={fadeUp}
                transition={{ delay: 0.1 }}
                className="text-white/90 text-sm mt-2"
              >
                Use the correct account number depending on the service
              </motion.p>
            </div>
          </motion.section>

          {/* OFFICE HOURS & ADMIN */}
          <motion.section
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8"
          >
            {/* Office Hours */}
            <motion.div
              variants={scaleIn}
              custom={0}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white rounded-2xl p-8 border-2 border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-[#E8F4FD] to-[#FFF4E6] rounded-xl flex items-center justify-center mr-4">
                  <Clock className="text-[#FF7A00]" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-[#0B0F1A]">Office Hours</h3>
              </div>
              
              <div className="space-y-4">
                {officeHours.map((hour, index) => (
                  <motion.div
                    key={index}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="flex justify-between items-center p-4 bg-[#F7F9FC] rounded-xl hover:bg-[#E8F4FD] transition-colors duration-200 border border-gray-100"
                  >
                    <span className="font-medium text-[#0B0F1A]">{hour.day}</span>
                    <span className={`font-bold ${hour.day === 'Sunday' ? 'text-[#6D7A8B]' : 'text-[#FF7A00]'}`}>
                      {hour.time}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Administrator */}
            <motion.div
              variants={scaleIn}
              custom={1}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white rounded-2xl p-8 border-2 border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-[#E8F4FD] to-[#FFF4E6] rounded-xl flex items-center justify-center mr-4">
                  <User className="text-[#2B4C73]" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-[#0B0F1A]">Administrator</h3>
              </div>
              
              <motion.div
                variants={scaleIn}
                className="mb-6 p-4 bg-gradient-to-r from-[#E8F4FD] to-[#FFF4E6] rounded-xl border border-[#2B4C73]/20"
              >
                <p className="font-bold text-lg text-[#0B0F1A]">Ms Mercy Wambui</p>
                <p className="text-[#2B4C73] font-medium">CHRMAA Administrator</p>
              </motion.div>
              
              <div className="space-y-3">
                <motion.a
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  href="mailto:alumni@chrm.or.ke"
                  className="flex items-center gap-3 text-[#2B4C73] hover:text-[#1A3557] font-medium hover:underline transition-colors duration-200"
                >
                  <Mail size={18} />
                  alumni@chrm.or.ke
                </motion.a>
                <motion.a
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  href="tel:+254700773322"
                  className="flex items-center gap-3 text-[#2B4C73] hover:text-[#1A3557] font-medium hover:underline transition-colors duration-200"
                >
                  <Phone size={18} />
                  0700 773 322
                </motion.a>
                <motion.a
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  href="tel:+254733883322"
                  className="flex items-center gap-3 text-[#2B4C73] hover:text-[#1A3557] font-medium hover:underline transition-colors duration-200"
                >
                  <Phone size={18} />
                  0733 883 322
                </motion.a>
              </div>
            </motion.div>
          </motion.section>

          {/* CTA */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
            className="bg-[#2B4C73] rounded-2xl p-10 text-center overflow-hidden"
          >
            {/* Background Elements */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#2B4C73]/20  rounded-full -translate-x-16 -translate-y-16"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-[#FF7A00]/20 to-transparent rounded-full translate-x-20 translate-y-20"
            />
            
            <div className="relative z-10">
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full mb-6"
              >
                <Sparkles className="w-5 h-5 text-white" />
                <span className="text-white font-semibold">Take Action</span>
              </motion.div>
              
              <motion.h2
                variants={fadeUp}
                transition={{ delay: 0.1 }}
                className="text-2xl md:text-3xl text-white font-bold mb-8 font-poppins"
              >
                Ready to Engage with CHRMAA?
              </motion.h2>
              
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex flex-col md:flex-row justify-center gap-4 md:gap-6"
              >
                {ctaButtons.map((button, index) => (
                  <motion.div
                    key={index}
                    variants={scaleIn}
                    custom={index}
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <Link
                      href={button.href}
                      className={`group inline-flex items-center gap-2 px-6 py-3 ${button.gradient} text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300`}
                    >
                      <button.icon size={20} />
                      {button.text}
                      <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
              
              <motion.p
                variants={fadeUp}
                transition={{ delay: 0.3 }}
                className="text-gray-300 mt-8 text-sm"
              >
                Connect with thousands of HR professionals in our network
              </motion.p>
            </div>
          </motion.section>

        </div>
      </main>

      <Footer />
    </div>
  );
}