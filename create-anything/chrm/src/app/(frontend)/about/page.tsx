"use client";

import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Users, Award, Target, Globe, Shield, BookOpen, Compass } from "lucide-react";

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
        {/* EDITORIAL HERO HEADER */}
        <section className="border-b border-[#1B3A6B]/10 bg-[#1B3A6B] py-16 text-white">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#C9A84C]">
              Est. 1931 · Seeking the Highest
            </span>
            <h1 className="mt-2 font-serif text-3xl font-bold md:text-5xl">
              About The Old Turians Society
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/80 md:text-base">
              Preserving our school's rich heritage, promoting lifelong global connections, and supporting future generations of St Andrew's School, Turi.
            </p>
          </div>
        </section>

        {/* MISSION, VISION & GOALS (3-COL GRID WITH GOLD BORDERS) */}
        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Our Mission */}
            <div className="border-t-4 border-[#C9A84C] border-x border-b border-[#1B3A6B]/10 bg-white p-8">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center bg-[#1B3A6B] text-[#C9A84C]">
                <Target size={22} />
              </div>
              <h2 className="font-serif text-xl font-bold text-[#1B3A6B]">Our Mission</h2>
              <blockquote className="mt-4 border-l-2 border-[#C9A84C] pl-4 font-serif italic text-sm text-[#1B3A6B]/90">
                "To establish and enhance mutually beneficial and enduring relationships between the alumni, students, and school fraternity."
              </blockquote>
            </div>

            {/* Our Vision */}
            <div className="border-t-4 border-[#C9A84C] border-x border-b border-[#1B3A6B]/10 bg-white p-8">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center bg-[#1B3A6B] text-[#C9A84C]">
                <Award size={22} />
              </div>
              <h2 className="font-serif text-xl font-bold text-[#1B3A6B]">Our Vision</h2>
              <blockquote className="mt-4 border-l-2 border-[#C9A84C] pl-4 font-serif italic text-sm text-[#1B3A6B]/90">
                "To stand as the premier alumni network in Sub-Saharan Africa, recognized for global leadership and community impact."
              </blockquote>
            </div>

            {/* Key Functions */}
            <div className="border-t-4 border-[#C9A84C] border-x border-b border-[#1B3A6B]/10 bg-white p-8">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center bg-[#1B3A6B] text-[#C9A84C]">
                <Compass size={22} />
              </div>
              <h2 className="font-serif text-xl font-bold text-[#1B3A6B]">Key Objectives</h2>
              <p className="mt-4 text-xs leading-relaxed text-[#1B3A6B]/80">
                Advising school management, facilitating student mentorship, connecting alumni professionally across continents, and funding bursaries.
              </p>
            </div>
          </div>
        </section>

        {/* CORE VALUES SECTION */}
        <section className="border-y border-[#1B3A6B]/10 bg-[#1B3A6B]/5 py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-12 border-b border-[#1B3A6B]/15 pb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#C9A84C]">
                Guiding Principles
              </span>
              <h2 className="mt-1 font-serif text-2xl font-bold text-[#1B3A6B] md:text-3xl">
                Our Core Values
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Relational Fellowship",
                  desc: "Building enduring lifelong connections across year groups and continents.",
                  icon: Users,
                },
                {
                  title: "Empowerment",
                  desc: "Opening global career opportunities, mentorship, and business networks.",
                  icon: Globe,
                },
                {
                  title: "Unwavering Integrity",
                  desc: "Upholding Christian values, accountability, and ethical leadership in all endeavors.",
                  icon: Shield,
                },
                {
                  title: "Creating Value",
                  desc: "Investing in bursaries, school projects, and meaningful social impact initiatives.",
                  icon: BookOpen,
                },
              ].map((value, idx) => (
                <div key={idx} className="border border-[#1B3A6B]/15 bg-white p-6">
                  <value.icon className="text-[#C9A84C]" size={26} />
                  <h3 className="mt-4 font-serif text-lg font-bold text-[#1B3A6B]">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#1B3A6B]/80">
                    {value.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* OFFICIALS & EXECUTIVE BOARD SECTION */}
        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-12">
          <div className="mb-12 border-b border-[#1B3A6B]/15 pb-4 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-[#C9A84C]">
              Leadership
            </span>
            <h2 className="mt-1 font-serif text-3xl font-bold text-[#1B3A6B]">
              Executive Committee & Officials
            </h2>
            <p className="mt-2 text-xs text-[#1B3A6B]/70">
              Meet the dedicated Old Turians who lead society operations globally
            </p>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1B3A6B] border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {officials.map((official) => (
                <div
                  key={official.id}
                  className="group border border-[#1B3A6B]/15 bg-white p-4 transition-all hover:border-[#C9A84C]"
                >
                  <div className="relative h-80 w-full overflow-hidden bg-[#1B3A6B]/5">
                    <img
                      src={official.image_url}
                      alt={official.name}
                      className="h-full w-full object-cover grayscale transition-all duration-300 group-hover:grayscale-0"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://via.placeholder.com/400x500?text=Photo+Not+Found";
                      }}
                    />
                  </div>
                  <div className="mt-4 text-center">
                    <h3 className="font-serif text-lg font-bold text-[#1B3A6B]">
                      {official.name}
                    </h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#C9A84C]">
                      {official.position}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && officials.length === 0 && (
            <div className="py-12 text-center">
              <Users className="mx-auto text-[#1B3A6B]/20" size={48} />
              <p className="mt-2 text-xs text-[#1B3A6B]/70">No executive officials registered</p>
            </div>
          )}
        </section>

        {/* NINETEEN THIRTY-ONE HISTORY & STATS SECTION */}
        <section className="border-t border-[#1B3A6B]/10 bg-[#1B3A6B] py-16 text-white">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-[#C9A84C]">
              Ninety-Five Years of Heritage
            </span>
            <h2 className="mt-2 font-serif text-3xl font-bold md:text-4xl">
              The Turi Legacy
            </h2>
            <p className="mt-6 text-sm leading-relaxed text-white/80 md:text-base">
              From its beginnings on a 450-acre highland estate in Molo, Kenya, St Andrew's School, Turi has grown into an iconic institution. Old Turians now occupy prominent leadership positions across financial services, diplomacy, agriculture, technology, and arts worldwide.
            </p>

            <div className="mt-12 grid grid-cols-2 gap-6 border-t border-white/10 pt-8 md:grid-cols-4">
              <div>
                <span className="font-serif text-3xl font-bold text-[#C9A84C]">4,500+</span>
                <span className="mt-1 block text-[10px] uppercase tracking-widest text-white/70">Global Alumni</span>
              </div>
              <div>
                <span className="font-serif text-3xl font-bold text-[#C9A84C]">38</span>
                <span className="mt-1 block text-[10px] uppercase tracking-widest text-white/70">Countries</span>
              </div>
              <div>
                <span className="font-serif text-3xl font-bold text-[#C9A84C]">1931</span>
                <span className="mt-1 block text-[10px] uppercase tracking-widest text-white/70">Founding Year</span>
              </div>
              <div>
                <span className="font-serif text-3xl font-bold text-[#C9A84C]">100%</span>
                <span className="mt-1 block text-[10px] uppercase tracking-widest text-white/70">Commitment</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}