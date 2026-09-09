"use client";
import Header from "./(frontend)/components/Header";
import Footer from "./(frontend)/components/Footer";
import Link from "next/link";
import { ArrowRight, BookOpen, Globe, Shield, Calendar, ShoppingBag, Users, Award, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  const stats = [
    { value: "4,500+", label: "Global Old Turians" },
    { value: "38", label: "Countries Represented" },
    { value: "1931", label: "Year Established" },
  ];

  const Pillars = [
    {
      title: "Global Network",
      description:
        "Connecting Old Turians across East Africa, the UK, North America, and worldwide through dedicated regional chapters.",
      icon: Globe,
      link: "/member/dashboard/profile/edit",
      linkText: "Explore Directory",
    },
    {
      title: "Enduring Heritage",
      description:
        "Preserving ninety-five years of tradition, excellence, and the foundational values of St Andrew's School, Turi.",
      icon: Shield,
      link: "/about",
      linkText: "Our History",
    },
    {
      title: "Global Events & Reunions",
      description:
        "Annual gatherings, regional dinners, and milestone reunions hosted in Nairobi, London, and on the Turi campus.",
      icon: Calendar,
      link: "/events",
      linkText: "Upcoming Events",
    },
    {
      title: "Official Memorabilia",
      description:
        "Tailored blazers, crest ties, and archival publications dispatchable worldwide via DHL international shipping.",
      icon: ShoppingBag,
      link: "/merchandise",
      linkText: "Visit Store",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#1B3A6B]">
      <Header />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative h-[75vh] min-h-[540px] w-full overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img 
              src="/turi-2.jpg" 
              alt="St Andrew's Turi - School Grounds" 
              className="h-full w-full object-cover"
            />
            {/* Dark overlay for better text contrast */}
            <div className="absolute inset-0 bg-black/30" />
          </div>
          
          {/* Anchored Crimson/Maroon Block with Gold Accent Bar */}
          <div className="absolute bottom-0 left-0 w-full max-w-2xl border-t-4 border-[#C9A84C] bg-[#800020] p-8 md:p-12 lg:ml-12 shadow-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="font-serif text-3xl font-bold leading-tight text-white md:text-5xl">
                Welcome Home, <br />
                Old Turian
              </h1>
              <p className="mt-3 text-base font-semibold tracking-wide text-[#C9A84C] md:text-lg">
                Connecting the Turi community across the world
              </p>
            </motion.div>
          </div>
        </section>

        {/* QUICK STATS BAR: Solid Navy Grid with Gold Dividers */}
        <section className="border-y border-[#1B3A6B]/10 bg-[#1B3A6B] text-white">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="grid grid-cols-1 divide-y divide-white/10 md:grid-cols-3 md:divide-x md:divide-y-0">
              {stats.map((stat, idx) => (
                <div key={idx} className="p-8 text-center">
                  <motion.span 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    className="block font-serif text-4xl font-bold text-[#C9A84C]"
                  >
                    {stat.value}
                  </motion.span>
                  <span className="mt-1 block text-xs font-semibold uppercase tracking-widest text-white/80">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* EDITORIAL STORY & HERITAGE SECTION */}
        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 border-b border-[#1B3A6B]/15 pb-4"
          >
            <span className="text-xs font-bold uppercase tracking-widest text-[#C9A84C]">
              Heritage & Community
            </span>
            <h2 className="mt-1 font-serif text-3xl font-bold text-[#1B3A6B] md:text-4xl">
              Seeking the Highest in All Endeavours
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            {/* Lead Narrative Column */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-6 lg:col-span-2"
            >
              <p className="font-serif text-xl leading-relaxed text-[#1B3A6B]">
                Founded in 1931, St Andrew's School, Turi has shaped generations of leaders across East Africa and beyond. The Old Turians Society serves as a lifelong anchor for alumni—fostering global professional networks, preserving school traditions, and supporting current students.
              </p>
              <p className="text-base leading-relaxed text-[#1B3A6B]/80">
                Whether you attended the Prep School or Senior School, the portal offers direct access to the global alumni directory, official event registration, membership dues, and commemorative memorabilia.
              </p>

              <div className="pt-4 flex flex-wrap gap-4">
                <Link
                  href="/payments"
                  className="border-2 border-[#1B3A6B] bg-[#1B3A6B] px-8 py-3.5 text-xs font-semibold uppercase tracking-widest text-white transition-all hover:bg-white hover:text-[#1B3A6B]"
                >
                  Register Profile
                </Link>
                <Link
                  href="/about"
                  className="border-2 border-[#1B3A6B] bg-transparent px-8 py-3.5 text-xs font-semibold uppercase tracking-widest text-[#1B3A6B] transition-all hover:bg-[#1B3A6B] hover:text-white"
                >
                  About The Society
                </Link>
              </div>
            </motion.div>

            {/* Sidebar Notice Block */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="border-l-2 border-[#C9A84C] pl-8 space-y-8"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A84C]">
                  Noticeboard
                </span>
                <h3 className="font-serif text-lg font-bold text-[#1B3A6B] mt-1">
                  Annual General Meeting 2026
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#1B3A6B]/80">
                  The upcoming Old Turian Society AGM will be held in Nairobi with hybrid virtual access for international members in London and abroad.
                </p>
                <Link
                  href="/events"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#C9A84C] hover:underline"
                >
                  View Agenda <ArrowRight size={14} />
                </Link>
              </div>

              <div className="border-t border-[#1B3A6B]/10 pt-6">
                <h3 className="font-serif text-lg font-bold text-[#1B3A6B]">
                  Life Membership Tiers
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#1B3A6B]/80">
                  Support the alumni trust fund and unlock lifelong directory access via M-PESA or global credit card payments.
                </p>
                <Link
                  href="/payments"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#C9A84C] hover:underline"
                >
                  Membership Options <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* INSTITUTIONAL PILLARS GRID */}
        <section className="border-t border-[#1B3A6B]/10 bg-[#1B3A6B]/5 py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-12 text-center"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-[#C9A84C]">
                Portal Services
              </span>
              <h2 className="mt-1 font-serif text-3xl font-bold text-[#1B3A6B]">
                Society Pillars
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {Pillars.map((pillar, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className="flex flex-col justify-between border border-[#1B3A6B]/15 bg-white p-8 transition-all hover:border-[#C9A84C] hover:shadow-lg"
                >
                  <div>
                    <div className="mb-6 inline-flex h-12 w-12 items-center justify-center border border-[#1B3A6B] bg-[#1B3A6B] text-[#C9A84C]">
                      <pillar.icon size={22} />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-[#1B3A6B]">
                      {pillar.title}
                    </h3>
                    <p className="mt-3 text-xs leading-relaxed text-[#1B3A6B]/80">
                      {pillar.description}
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-[#1B3A6B]/10">
                    <Link
                      href={pillar.link}
                      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1B3A6B] hover:text-[#C9A84C] transition-colors"
                    >
                      {pillar.linkText} <ArrowRight size={14} />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CALL TO ACTION BANNER */}
        <section className="border-t-4 border-[#C9A84C] bg-[#1B3A6B] py-16 text-center text-white">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-4xl px-6"
          >
            <h2 className="font-serif text-3xl font-bold text-white md:text-4xl">
              Are you an Old Turian?
            </h2>
            <p className="mt-4 text-sm text-[#C9A84C] md:text-base">
              Join thousands of alumni across the globe. Keep your contact details updated to receive society updates, reunion invites, and regional event access.
            </p>
            <div className="mt-8">
              <Link
                href="/payments"
                className="inline-block border-2 border-[#C9A84C] bg-[#C9A84C] px-10 py-4 text-xs font-semibold uppercase tracking-widest text-[#1B3A6B] transition-all hover:bg-white hover:border-white"
              >
                Join The Society Today
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}