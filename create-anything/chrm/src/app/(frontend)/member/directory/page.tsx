"use client";

import { useState, useEffect } from "react";
import Header from "@/app/(frontend)/components/Header";
import Footer from "@/app/(frontend)/components/Footer";
import { Search, GraduationCap, MapPin, Linkedin, Eye, EyeOff, Users, Loader2 } from "lucide-react";

type AlumniProfile = {
  id: string;
  full_name: string;
  graduation_year: number;
  course: string;
  country: string;
  bio?: string;
  linkedin_url?: string;
};

export default function DirectoryPage() {
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [directoryVisible, setDirectoryVisible] = useState(true);
  const [privacySaving, setPrivacySaving] = useState(false);

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/alumni/search", window.location.origin);
      if (searchQuery) url.searchParams.append("query", searchQuery);
      if (selectedYear) url.searchParams.append("year", selectedYear);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setAlumni(data.alumni || []);
      }
    } catch (err) {
      console.error("Directory search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlumni();
  }, [selectedYear]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAlumni();
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB] text-[#1B3A6B]">
      <Header />

      <main className="flex-1 py-12 px-6 lg:px-12 max-w-7xl mx-auto w-full">
        {/* HERO HEADER */}
        <div className="border-t-4 border-[#C9A84C] bg-white p-8 md:p-10 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#C9A84C]">
                Old Turians Society
              </span>
              <h1 className="mt-1 font-serif text-3xl font-bold text-[#1B3A6B]">
                Global Alumni Directory
              </h1>
              <p className="mt-2 text-sm text-[#1B3A6B]/80 max-w-2xl">
                Reconnect with classmates, expand your professional network across East Africa and worldwide, and message fellow Old Turians.
              </p>
            </div>

            {/* PRIVACY OPT-IN TOGGLE */}
            <div className="border border-[#1B3A6B]/15 bg-[#1B3A6B]/5 p-4 rounded-lg flex items-center gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-[#1B3A6B]">Visibility</p>
                <p className="text-[11px] text-[#1B3A6B]/70">
                  {directoryVisible ? "Your profile is visible to alumni" : "Your profile is hidden from search"}
                </p>
              </div>
              <button
                onClick={() => setDirectoryVisible(!directoryVisible)}
                className={`px-3 py-1.5 text-xs font-bold uppercase transition flex items-center gap-1.5 border ${
                  directoryVisible
                    ? "bg-[#1B3A6B] text-white border-[#1B3A6B]"
                    : "bg-white text-[#800020] border-[#800020]"
                }`}
              >
                {directoryVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                {directoryVisible ? "Visible" : "Hidden"}
              </button>
            </div>
          </div>
        </div>

        {/* SEARCH CONTROLS */}
        <form onSubmit={handleSearchSubmit} className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <input
              type="text"
              placeholder="Search by full name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-[#1B3A6B]/30 bg-white py-3 pl-11 pr-4 text-sm text-[#1B3A6B] focus:border-[#C9A84C] focus:outline-none"
            />
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1B3A6B]/50" />
          </div>

          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full border border-[#1B3A6B]/30 bg-white py-3 px-4 text-sm text-[#1B3A6B] focus:border-[#C9A84C] focus:outline-none appearance-none"
            >
              <option value="">All Class Years</option>
              {Array.from({ length: 45 }, (_, i) => 2026 - i).map((yr) => (
                <option key={yr} value={yr}>
                  Class of {yr}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="border-2 border-[#1B3A6B] bg-[#1B3A6B] py-3 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[#800020] hover:border-[#800020] cursor-pointer"
          >
            Filter Results
          </button>
        </form>

        {/* RESULTS GRID */}
        {loading ? (
          <div className="flex py-20 items-center justify-center">
            <Loader2 className="animate-spin text-[#1B3A6B]" size={36} />
          </div>
        ) : alumni.length === 0 ? (
          <div className="bg-white border border-[#1B3A6B]/15 p-12 text-center">
            <Users size={40} className="mx-auto text-[#1B3A6B]/40 mb-3" />
            <h3 className="font-serif text-lg font-bold">No Alumni Found</h3>
            <p className="text-xs text-[#1B3A6B]/70 mt-1">
              Try adjusting your search query or selecting a different class year.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alumni.map((person) => (
              <div
                key={person.id}
                className="border border-[#1B3A6B]/15 bg-white p-6 transition-all hover:border-[#C9A84C] hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between border-b border-[#1B3A6B]/10 pb-4 mb-4">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-[#1B3A6B]">
                        {person.full_name}
                      </h3>
                      <span className="inline-block mt-1 text-[11px] font-bold uppercase tracking-wider text-[#C9A84C]">
                        Class of {person.graduation_year || "Alumni"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-[#1B3A6B]/80 mb-6">
                    {person.course && (
                      <p className="flex items-center gap-2">
                        <GraduationCap size={14} className="text-[#1B3A6B]/50" />
                        <span>{person.course}</span>
                      </p>
                    )}
                    {person.country && (
                      <p className="flex items-center gap-2">
                        <MapPin size={14} className="text-[#1B3A6B]/50" />
                        <span>{person.country}</span>
                      </p>
                    )}
                  </div>
                </div>

                {person.linkedin_url ? (
                  <a
                    href={person.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 border border-[#1B3A6B]/20 py-2 text-xs font-bold uppercase tracking-wider text-[#1B3A6B] transition hover:border-[#C9A84C] hover:bg-[#C9A84C]/10"
                  >
                    <Linkedin size={14} /> Connect on LinkedIn
                  </a>
                ) : (
                  <button
                    disabled
                    className="w-full border border-[#1B3A6B]/10 bg-[#1B3A6B]/5 py-2 text-xs font-bold uppercase tracking-wider text-[#1B3A6B]/40 cursor-not-allowed"
                  >
                    Old Turian Member
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}