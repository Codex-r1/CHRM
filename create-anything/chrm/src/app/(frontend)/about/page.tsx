"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Users, Award, Target, Globe, Shield, BookOpen, Compass, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

type Official = {
  id: string;
  name: string;
  position: string;
  image_url: string;
  display_order: number;
};

export default function AboutPage() {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOfficials = async () => {
      try {
        const res = await fetch("/api/public/officials");
        const data = await res.json();
        setOfficials(data.officials || []);
      } catch (error) {
        console.error("Failed to fetch officials:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOfficials();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#1B3A6B]">
      <Header />

      <main className="flex-1">
        {/* ─── 1. FULL-BLEED HERO (EMULATING SCREENSHOT) ─── */}
        <section className="relative h-[60vh] min-h-[500px] w-full overflow-hidden">
          <img
            src="/turi1.jpg"
            alt="Aerial view of St Andrew's Turi campus"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Subtle dark overlay for text legibility */}
          <div className="absolute inset-0 bg-black/30" />
          
          <div className="absolute bottom-12 left-0 w-full px-6 md:px-12">
            <div className="mx-auto max-w-7xl">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="font-serif text-5xl font-bold text-white md:text-7xl"
              >
                About Turi
              </motion.h1>
            </div>
          </div>
        </section>

        {/* ─── 2. EDITORIAL SPLIT SECTION ─── */}
        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
            
            {/* Left: Main Narrative (7 cols) */}
            <div className="lg:col-span-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <h2 className="font-serif text-3xl font-bold text-[#1B3A6B]">
                  The Old Turians Society
                </h2>
                <div className="mt-6 space-y-6 text-lg leading-relaxed text-[#1B3A6B]/80">
                  <p>
                    Founded in 1931, St Andrew's School, Turi has shaped generations of leaders across East Africa and beyond. The Old Turians Society serves as a lifelong anchor for alumni—fostering global professional networks, preserving school traditions, and supporting current students.
                  </p>
                  <p>
                    Whether you attended the Prep School or Senior School, the society exists to keep you connected to the friends, mentors, and formative experiences that defined your time in Molo. 
                  </p>
                </div>
                
                <div className="mt-10 border-t border-[#1B3A6B]/10 pt-8">
                  <h3 className="font-serif text-xl font-bold text-[#1B3A6B] mb-4">How it Works</h3>
                  <p className="text-base text-[#1B3A6B]/70">
                    All Old Turian students become members of the association the minute they depart for pastures new. This means you are always welcome back at Turi, at Old Turian events, and can receive regular timely updates on what's going on at the School. 
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Right: Sidebar Links (4 cols) */}
            <div className="lg:col-span-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-[#1B3A6B]/5 border-l-4 border-[#C9A84C] p-8"
              >
                <h3 className="font-serif text-2xl font-bold text-[#1B3A6B] mb-6">
                  Quick Links
                </h3>
                <ul className="space-y-4">
                  {[
                    { label: "Our Purpose", href: "#purpose" },
                    { label: "Vision, Mission & Values", href: "#vision" },
                    { label: "Our History", href: "#history" },
                    { label: "Executive Committee", href: "#leadership" },
                  ].map((link, idx) => (
                    <li key={idx}>
                      <Link 
                        href={link.href}
                        className="group flex items-center justify-between text-base font-medium text-[#1B3A6B] hover:text-[#C9A84C] transition-colors"
                      >
                        {link.label}
                        <ArrowRight size={16} className="text-[#C9A84C] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

          </div>
        </section>

        {/* ─── 3. MISSION & VISION CARDS (ANIMATED) ─── */}
        <section id="vision" className="border-y border-[#1B3A6B]/10 bg-[#F7F6F2] py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-12 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-[#C9A84C]">
                Guiding Principles
              </span>
              <h2 className="mt-2 font-serif text-3xl font-bold text-[#1B3A6B] md:text-4xl">
                Vision, Mission & Objectives
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  title: "Our Mission",
                  icon: Target,
                  text: "To establish and enhance mutually beneficial and enduring relationships between the alumni, students, and school fraternity."
                },
                {
                  title: "Our Vision",
                  icon: Award,
                  text: "To stand as the premier alumni network in Sub-Saharan Africa, recognized for global leadership and community impact."
                },
                {
                  title: "Key Objectives",
                  icon: Compass,
                  text: "Advising school management, facilitating student mentorship, connecting alumni professionally, and funding bursaries."
                }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                  className="group relative bg-white p-8 shadow-sm border border-[#1B3A6B]/10 hover:border-[#C9A84C] transition-colors duration-300"
                >
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center bg-[#800020] text-[#C9A84C]">
                    <item.icon size={26} />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-[#1B3A6B]">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-[#1B3A6B]/70">
                    {item.text}
                  </p>
                  <div className="absolute top-0 left-0 w-full h-1 bg-[#C9A84C] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 4. EXECUTIVE COMMITTEE (ANIMATED) ─── */}
        <section id="leadership" className="mx-auto max-w-7xl px-6 py-20 lg:px-12">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-3xl font-bold text-[#1B3A6B] md:text-4xl">
              Executive Committee
            </h2>
            <p className="mt-4 text-base text-[#1B3A6B]/60">
              Meet the dedicated Old Turians who lead society operations globally
            </p>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1B3A6B] border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {officials.map((official, idx) => (
                <motion.div
                  key={official.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="group bg-white border border-[#1B3A6B]/10 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative h-80 w-full overflow-hidden bg-[#1B3A6B]/5">
                    <img
                      src={official.image_url}
                      alt={official.name}
                      className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x500?text=Photo+Not+Found";
                      }}
                    />
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="font-serif text-xl font-bold text-[#1B3A6B]">
                      {official.name}
                    </h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#C9A84C]">
                      {official.position}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

      </main>

      <Footer />
    </div>
  );
}