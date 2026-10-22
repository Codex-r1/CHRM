"use client";
import Header from "./(frontend)/components/Header";
import Footer from "./(frontend)/components/Footer";
import Link from "next/link";
import { ArrowRight, Globe, Shield, Calendar, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

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
        "Connecting Old Turians across East Africa, the UK, North America and worldwide through dedicated regional chapters.",
      icon: Globe,
      link: "/member/dashboard/profile/edit",
      linkText: "Explore Directory",
    },
    {
      title: "Enduring Heritage",
      description:
        "Preserving ninety-five years of tradition, excellence and the foundational values of St Andrew's School, Turi.",
      icon: Shield,
      link: "/about",
      linkText: "Our History",
    },
    {
      title: "Global Events & Reunions",
      description:
        "Annual gatherings, regional dinners and milestone reunions.",
      icon: Calendar,
      link: "/events",
      linkText: "Upcoming Events",
    },
    {
      title: "Official Memorabilia",
      description:
        "Tailored blazers, crest ties and archival publications dispatchable worldwide via DHL international shipping.",
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
        <section className="relative h-[60vh] min-h-[420px] md:h-[75vh] md:min-h-[540px] w-full overflow-hidden bg-[#1B3A6B]">
          <div className="absolute inset-0">
            <Image
              src="/turi1.jpg"
              alt="St Andrew's Turi campus at golden hour"
              fill
              priority
              quality={90}
              sizes="100vw"
              className="object-cover object-center"
            />
            {/* Lighter overlays — no reason to darken as much with a cleaner source */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/15 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>

          <div className="absolute bottom-0 left-0 w-full max-w-2xl p-6 md:p-12 lg:ml-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="border-l-4 bg-[#1B3A6B]/85 backdrop-blur-md p-8 md:p-10 shadow-2xl"
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

        {/* QUICK STATS BAR */}
        <section className="border-y border-[#1B3A6B]/10 bg-[#1B3A6B] text-white border-b-4 border-b-[#C9A84C]">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="grid grid-cols-1 divide-y divide-white/10 md:grid-cols-3 md:divide-x md:divide-y-0">
              {stats.map((stat, idx) => (
                <div key={idx} className="p-8 text-center">
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
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

        {/* INSTITUTIONAL PILLARS GRID */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-12 text-center"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-[#C9A84C]">
                Portal Services
              </span>
              <h2 className="mt-2 font-serif text-3xl font-bold text-[#1B3A6B] md:text-4xl">
                Society Pillars
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {Pillars.map((pillar, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className="flex flex-col justify-between border border-[#1B3A6B]/15 bg-[#F7F6F2] p-8 transition-all hover:border-[#C9A84C] hover:shadow-lg"
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
        <section className="border-t-4 border-[#C9A84C] bg-[#800020] py-16 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-4xl px-6"
          >
            <h2 className="font-serif text-3xl font-bold text-white md:text-4xl">
              Are you an Old Turian?
            </h2>
            <p className="mt-4 text-sm text-white/80 md:text-base">
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