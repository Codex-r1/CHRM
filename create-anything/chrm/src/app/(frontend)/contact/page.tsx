"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  User, 
  MessageSquare, 
  ArrowRight, 
  CreditCard, 
  Target, 
  Sparkles,
  Send,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Globe,
  Calendar,
  Building2,
  Shield,
  Award,
  Users,
  Linkedin,
  Twitter,
  Instagram,
  Youtube
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useState } from "react";

// Animation Variants
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.6, 
      ease: [0.16, 1, 0.3, 1] 
    } 
  },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { duration: 0.5 } 
  },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { 
      duration: 0.5, 
      ease: [0.16, 1, 0.3, 1] 
    } 
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const onChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [k]: e.target.value }));
  };

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      setFeedback({ type: "error", text: "Please fill in Name, Email, Subject, and Message." });
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/contact-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to send message");

      setFeedback({ type: "success", text: "Message sent! Our team will respond within 24 hours." });
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Something went wrong. Please try again." });
    } finally {
      setSending(false);
    }
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email",
      description: "We respond within 24 hours",
      items: [
        { text: "alumni@turi.ac.ke", href: "mailto:alumni@turi.ac.ke" },
        { text: "oldturians@turi.ac.ke", href: "mailto:oldturians@turi.ac.ke" }
      ]
    },
    {
      icon: Phone,
      title: "Phone",
      description: "Speak with our alumni office",
      items: [
        { text: "+254 700 773 322", href: "tel:+254700773322" },
        { text: "+254 733 883 322", href: "tel:+254733883322" }
      ]
    },
    {
      icon: MapPin,
      title: "Location",
      description: "Visit our alumni centre",
      items: [
        { text: "St Andrews Turi, Kenya", href: "#" },
        { text: "Nairobi Liaison Office", href: "#" }
      ]
    }
  ];

  const officeHours = [
    { day: "Monday – Friday", time: "8:00 AM – 5:00 PM" },
    { day: "Saturday", time: "9:00 AM – 2:00 PM" },
    { day: "Sunday & Public Holidays", time: "Closed" }
  ];

  const socialLinks = [
    { icon: Linkedin, label: "LinkedIn", href: "#" },
    { icon: Twitter, label: "Twitter", href: "#" },
    { icon: Instagram, label: "Instagram", href: "#" },
    { icon: Youtube, label: "YouTube", href: "#" },
  ];

  const quickLinks = [
    { text: "Membership", href: "/payments" },
    { text: "Events", href: "/events" },
    { text: "Gallery", href: "/gallery" },
    { text: "About Us", href: "/about" },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <motion.section 
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="bg-[#1B3A6B] py-20 px-4"
        >
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              variants={fadeUp}
              transition={{ delay: 0.1 }}
              className="inline-block px-4 py-1.5 border border-[#C9A84C] text-[#C9A84C] text-xs uppercase tracking-wider font-medium rounded-sm mb-6"
            >
              Get in Touch
            </motion.div>
            
            <motion.h1
              variants={fadeUp}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-4"
            >
              Connect with the <span className="text-[#C9A84C]">Old Turians</span>
            </motion.h1>
            
            <motion.p
              variants={fadeUp}
              transition={{ delay: 0.3 }}
              className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed"
            >
              Whether you have questions about membership, events, or simply want to reconnect 
              with the Turi community — we're here to help.
            </motion.p>
          </div>
        </motion.section>

        <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">

          {/* Contact Methods */}
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {contactMethods.map((method, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover={{ y: -4 }}
                className="bg-white border border-[#1B3A6B]/10 rounded-lg p-8 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="w-14 h-14 bg-[#1B3A6B]/5 rounded-lg flex items-center justify-center mb-5">
                  <method.icon className="text-[#1B3A6B]" size={24} />
                </div>
                
                <h3 className="text-xl font-serif font-bold text-[#1B3A6B] mb-1">
                  {method.title}
                </h3>
                <p className="text-sm text-[#1B3A6B]/50 mb-4">
                  {method.description}
                </p>
                
                <div className="space-y-2">
                  {method.items.map((item, i) => (
                    item.href !== '#' ? (
                      <a
                        key={i}
                        href={item.href}
                        className="block text-[#1B3A6B] hover:text-[#C9A84C] font-medium transition-colors duration-200 text-sm"
                      >
                        {item.text}
                      </a>
                    ) : (
                      <p key={i} className="text-[#1B3A6B]/70 text-sm">
                        {item.text}
                      </p>
                    )
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Two Column Layout: Contact Form + Office Hours */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form - Takes 2/3 of space */}
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
              className="lg:col-span-2 bg-white border border-[#1B3A6B]/10 rounded-lg p-8 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#C9A84C]/10 rounded-lg flex items-center justify-center">
                  <MessageSquare className="text-[#C9A84C]" size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-[#1B3A6B]">Send a Message</h2>
                  <p className="text-sm text-[#1B3A6B]/60">
                    Reach out to the alumni office directly
                  </p>
                </div>
              </div>

              {feedback && (
                <div
                  className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
                    feedback.type === "success"
                      ? "bg-[#C9A84C]/5 border-[#C9A84C]/30"
                      : "bg-[#1B3A6B]/5 border-[#1B3A6B]/20"
                  }`}
                >
                  {feedback.type === "success" ? (
                    <CheckCircle className="text-[#C9A84C] mt-0.5 flex-shrink-0" size={18} />
                  ) : (
                    <AlertTriangle className="text-[#1B3A6B] mt-0.5 flex-shrink-0" size={18} />
                  )}
                  <p className={`text-sm ${feedback.type === "success" ? "text-[#1B3A6B]" : "text-[#1B3A6B]"}`}>
                    {feedback.text}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmitMessage} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                      Full Name <span className="text-[#C9A84C]">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={onChange("name")}
                      className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition placeholder:text-[#1B3A6B]/30"
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                      Email Address <span className="text-[#C9A84C]">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={onChange("email")}
                      className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition placeholder:text-[#1B3A6B]/30"
                      placeholder="you@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                      Phone Number <span className="text-[#1B3A6B]/50">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={onChange("phone")}
                      className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition placeholder:text-[#1B3A6B]/30"
                      placeholder="+254 700 000 000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                      Subject <span className="text-[#C9A84C]">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={onChange("subject")}
                      className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition placeholder:text-[#1B3A6B]/30"
                      placeholder="Membership enquiry"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                    Message <span className="text-[#C9A84C]">*</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={onChange("message")}
                    rows={5}
                    className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition placeholder:text-[#1B3A6B]/30 resize-none"
                    placeholder="How can we help you?"
                    required
                  />
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-6 py-3 bg-[#1B3A6B] text-white font-medium rounded-lg hover:bg-[#152e55] transition flex items-center gap-2 disabled:opacity-50 shadow-sm"
                  >
                    {sending ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Send size={18} />
                    )}
                    {sending ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </form>
            </motion.section>

            {/* Office Hours - Takes 1/3 of space */}
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
              className="bg-white border border-[#1B3A6B]/10 rounded-lg p-8 shadow-sm h-fit"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#1B3A6B]/5 rounded-lg flex items-center justify-center">
                  <Clock className="text-[#1B3A6B]" size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#1B3A6B]">Office Hours</h3>
                  <p className="text-sm text-[#1B3A6B]/60">When to reach us</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {officeHours.map((hour, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 border-b border-[#1B3A6B]/5 last:border-0"
                  >
                    <span className="text-sm font-medium text-[#1B3A6B]">{hour.day}</span>
                    <span className={`text-sm font-serif ${
                      hour.day.includes('Sunday') ? 'text-[#1B3A6B]/40' : 'text-[#1B3A6B]'
                    }`}>
                      {hour.time}
                    </span>
                  </div>
                ))}
              </div>
            </motion.section>
          </div>

          {/* Quick Links & Social */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Quick Links */}
            <div className="bg-[#1B3A6B] rounded-lg p-8">
              <h3 className="text-xl font-serif font-bold text-white mb-4">Quick Links</h3>
              <div className="grid grid-cols-2 gap-2">
                {quickLinks.map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    className="text-white/70 hover:text-white font-medium text-sm transition-colors duration-200 hover:underline"
                  >
                    {link.text}
                  </Link>
                ))}
              </div>
            </div>

            {/* Social & Payment Info */}
            <div className="bg-white border border-[#1B3A6B]/10 rounded-lg p-8">
              <h3 className="text-xl font-serif font-bold text-[#1B3A6B] mb-4">Connect With Us</h3>
              <div className="flex gap-3 mb-6">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    aria-label={social.label}
                    className="w-10 h-10 bg-[#1B3A6B]/5 rounded-lg flex items-center justify-center text-[#1B3A6B] hover:bg-[#1B3A6B] hover:text-white transition-colors duration-200"
                  >
                    <social.icon size={18} />
                  </a>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Location Map Placeholder */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
            className="bg-white border border-[#1B3A6B]/10 rounded-lg overflow-hidden shadow-sm"
          >
            <div className="bg-[#1B3A6B]/5 p-6 border-b border-[#1B3A6B]/10">
              <div className="flex items-center gap-3">
                <MapPin className="text-[#C9A84C]" size={20} />
                <h3 className="text-lg font-serif font-bold text-[#1B3A6B]">Find Us</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="aspect-[16/6] bg-[#1B3A6B]/5 rounded-lg flex items-center justify-center border border-[#1B3A6B]/10">
                <div className="text-center">
                  <MapPin className="text-[#1B3A6B]/30 mx-auto mb-2" size={32} />
                  <p className="text-sm text-[#1B3A6B]/50">
                    St Andrews Turi, Kenya
                  </p>
                  <p className="text-xs text-[#1B3A6B]/30 mt-1">
                    Interactive map coming soon
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* CTA Section */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
            className="bg-[#1B3A6B] rounded-lg p-10 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4zIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')]"></div>
            </div>
            
            <div className="relative z-10">
              <motion.h2
                variants={fadeUp}
                className="text-2xl md:text-3xl font-serif font-bold text-white mb-3"
              >
                Ready to Reconnect with Turi?
              </motion.h2>
              
              <motion.p
                variants={fadeUp}
                transition={{ delay: 0.1 }}
                className="text-white/70 max-w-xl mx-auto mb-6 text-sm"
              >
                Join thousands of Old Turians who stay connected through our alumni network
              </motion.p>
              
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex flex-col sm:flex-row justify-center gap-4"
              >
                <motion.div variants={scaleIn}>
                  <Link
                    href="/payments"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#C9A84C] text-[#1B3A6B] font-serif font-bold rounded-lg hover:bg-[#b8973a] transition shadow-sm"
                  >
                    <Users size={18} />
                    Join Now
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={16} />
                  </Link>
                </motion.div>
                
                <motion.div variants={scaleIn}>
                  <Link
                    href="/about"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition border border-white/20"
                  >
                    <Award size={18} />
                    Learn More
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </motion.section>

        </div>
      </main>

      <Footer />
    </div>
  );
}