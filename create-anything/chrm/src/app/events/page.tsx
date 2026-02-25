"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  Calendar, MapPin, Users, Clock, ChevronRight, Image as ImageIcon,
  Search, X, ChevronLeft, ChevronRight as ChevronRightIcon,
  Heart, Target, Users as UsersIcon, Leaf, Award, Ticket,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "../lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────
type EventType = {
  id: string;
  name: string;
  description: string;
  event_date: string;
  location: string;
  price: number;
  member_discount: number; // flat Ksh amount, not %
  max_attendees: number;
  current_attendees: number;
  status: string;
  is_active: boolean;
  image_url?: string;
  created_at?: string;
};

type CSRPhoto = {
  id: string;
  image_url: string;
  caption: string;
  display_order: number;
};

type CSRType = {
  id: string;
  event_type: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  main_image_url?: string;
  is_published: boolean;
  photos: CSRPhoto[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

const getEventTypeIcon = (type: string) => {
  const icons: Record<string, JSX.Element> = {
    tree_planting:      <Leaf   className="text-[#2B4C73]" size={14} />,
    community_service:  <Heart  className="text-[#FF7A00]" size={14} />,
    charity_drive:      <Award  className="text-[#E53E3E]" size={14} />,
    educational:        <UsersIcon className="text-[#2B4C73]" size={14} />,
    health_campaign:    <Target className="text-[#FF7A00]" size={14} />,
  };
  return icons[type] ?? <Heart className="text-[#E53E3E]" size={14} />;
};

const getEventTypeLabel = (type: string) => ({
  tree_planting:     "Tree Planting",
  community_service: "Community Service",
  charity_drive:     "Charity Drive",
  educational:       "Educational",
  health_campaign:   "Health Campaign",
}[type] ?? "CSR Event");

const getEventTypeBadgeClass = (type: string) => ({
  tree_planting:     "bg-[#E8F4FD] text-[#2B4C73]",
  community_service: "bg-[#FFF4E6] text-[#FF7A00]",
  charity_drive:     "bg-[#FFF0F0] text-[#E53E3E]",
  educational:       "bg-[#E8F4FD] text-[#2B4C73]",
  health_campaign:   "bg-[#FFF4E6] text-[#FF7A00]",
}[type] ?? "bg-[#F7F9FC] text-[#6D7A8B]");

// ─── Skeleton loader ──────────────────────────────────────────────────────────
const CardSkeleton = () => (
  <div className="bg-white rounded-lg border border-[#E7ECF3] overflow-hidden animate-pulse">
    <div className="h-48 bg-[#E7ECF3]" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-[#E7ECF3] rounded w-3/4" />
      <div className="h-3 bg-[#E7ECF3] rounded w-1/2" />
      <div className="h-3 bg-[#E7ECF3] rounded w-full" />
      <div className="h-3 bg-[#E7ECF3] rounded w-5/6" />
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "csr">("upcoming");
  const [searchTerm, setSearchTerm] = useState("");

  // Regular events
  const [events, setEvents] = useState<EventType[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // CSR events
  const [csrEvents, setCsrEvents] = useState<CSRType[]>([]);
  const [csrLoading, setCsrLoading] = useState(true);
  const [csrError, setCsrError] = useState<string | null>(null);

  // Modal state
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [selectedCSR, setSelectedCSR] = useState<CSRType | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // ── Fetch events independently ──────────────────────────────────────────────
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setEventsLoading(true);
        setEventsError(null);
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .eq("is_active", true)
          .order("event_date", { ascending: true });

        if (error) throw error;
        setEvents((data || []).map(e => ({ ...e, id: String(e.id) })));
      } catch (err: any) {
        setEventsError(err.message || "Failed to load events.");
      } finally {
        setEventsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    const fetchCSR = async () => {
      try {
        setCsrLoading(true);
        setCsrError(null);

        const { data, error } = await supabase
          .from("csr_events")
          .select(`*, photos:csr_event_photos(*)`)
          .eq("is_published", true)
          .order("event_date", { ascending: false });

        if (error) throw error;

        const formatted = (data || []).map(ev => ({
          ...ev,
          id: String(ev.id),
          photos: (ev.photos || []).sort(
            (a: CSRPhoto, b: CSRPhoto) => a.display_order - b.display_order
          ),
        }));

        setCsrEvents(formatted);
      } catch (err: any) {
        setCsrError(err.message || "Failed to load CSR events.");
      } finally {
        setCsrLoading(false);
      }
    };
    fetchCSR();
  }, []);

  // Prevent body scroll when modal open
  useEffect(() => {
    if (selectedEvent || selectedCSR) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selectedEvent, selectedCSR]);

  // ── Filtered lists ──────────────────────────────────────────────────────────
  const now = new Date(); now.setHours(0, 0, 0, 0);

  const upcomingEvents = events.filter(e => {
    const isUpcoming = new Date(e.event_date) >= now;
    const matchSearch =
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase());
    return isUpcoming && matchSearch;
  });

  const filteredCSR = csrEvents.filter(e =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.event_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Slide helpers ───────────────────────────────────────────────────────────
  const allPhotos = (csr: CSRType): CSRPhoto[] => {
    const photos = csr.photos || [];
    if (photos.length === 0 && csr.main_image_url) {
      return [{ id: "main", image_url: csr.main_image_url, caption: csr.title, display_order: 0 }];
    }
    return photos;
  };

  const openCSR = (csr: CSRType) => {
    setSelectedCSR(csr);
    setCurrentSlide(0);
  };

  const closeAll = () => {
    setSelectedEvent(null);
    setSelectedCSR(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white font-poppins">
      <Header />

      {/* Hero */}
      <section className="relative py-12 md:py-16 bg-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-[#2B4C73]/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#FF7A00]/10 rounded-full blur-3xl opacity-30" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold text-[#0B0F1A] mb-4"
          >
            CHRMAA{" "}
            <span className="bg-[black] bg-clip-text text-transparent">
              Events
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-[#6D7A8B] max-w-3xl mx-auto mb-8"
          >
            Professional networking, workshops, and CSR activities for CHRM alumni
          </motion.p>

          {/* Tab buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <button
              onClick={() => { setActiveTab("upcoming"); setSearchTerm(""); }}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                activeTab === "upcoming"
                  ? "bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white shadow-md"
                  : "bg-white border border-[#E7ECF3] text-[#6D7A8B] hover:border-[#2B4C73]"
              }`}
            >
              Upcoming Events ({eventsLoading ? "…" : upcomingEvents.length})
            </button>
            <button
              onClick={() => { setActiveTab("csr"); setSearchTerm(""); }}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                activeTab === "csr"
                  ? "bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white shadow-md"
                  : "bg-white border border-[#E7ECF3] text-[#6D7A8B] hover:border-[#2B4C73]"
              }`}
            >
               Gallery ({csrLoading ? "…" : csrEvents.length})
            </button>
          </motion.div>
        </div>
      </section>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">

        {/* Search bar */}
        <div className="mb-8 bg-white rounded-xl p-4 border border-[#E7ECF3] shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6D7A8B]" size={20} />
            <input
              type="text"
              placeholder={activeTab === "csr" ? "Search CSR activities…" : "Search events…"}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F7F9FC] border border-[#E7ECF3] rounded-lg focus:outline-none focus:border-[#2B4C73]"
            />
          </div>
        </div>

        {/* ── UPCOMING EVENTS TAB ── */}
        {activeTab === "upcoming" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#0B0F1A]">Upcoming Events</h2>
              <span className="text-sm text-[#6D7A8B]">
                {eventsLoading ? "Loading…" : `${upcomingEvents.length} event${upcomingEvents.length !== 1 ? "s" : ""}`}
              </span>
            </div>

            {/* Loading skeletons */}
            {eventsLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
              </div>
            )}

            {/* Error */}
            {!eventsLoading && eventsError && (
              <div className="text-center py-12">
                <p className="text-[#E53E3E] mb-4">{eventsError}</p>
                <button onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-[#2B4C73] text-white rounded-lg hover:opacity-90">Retry</button>
              </div>
            )}

            {/* Empty */}
            {!eventsLoading && !eventsError && upcomingEvents.length === 0 && (
              <div className="text-center py-16">
                <Calendar className="mx-auto mb-4 text-[#E7ECF3]" size={56} />
                <p className="text-[#6D7A8B] text-lg font-medium mb-2">No upcoming events</p>
                <p className="text-[#6D7A8B] text-sm">Check later for new events.</p>
              </div>
            )}

            {/* Events grid */}
            {!eventsLoading && !eventsError && upcomingEvents.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.07 }}
                    className="bg-white rounded-xl border border-[#E7ECF3] overflow-hidden hover:shadow-md transition-all hover:-translate-y-1"
                  >
                    {/* Image */}
                    <div className="relative h-44 bg-gradient-to-br from-[#E8F4FD] to-[#d4e9fa]">
                      {event.image_url ? (
                        <img src={event.image_url} alt={event.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon className="text-[#2B4C73]/30" size={48} />
                        </div>
                      )}
                      {/* Status badge */}
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 bg-[#2B4C73] text-white text-xs font-medium rounded-full">
                          {event.status === "upcoming" ? "Upcoming" : event.status}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-[#0B0F1A] mb-2 line-clamp-1">{event.name}</h3>
                      <div className="space-y-1 mb-3">
                        <div className="flex items-center gap-2 text-sm text-[#6D7A8B]">
                          <Calendar size={13} className="shrink-0" />
                          {formatDate(event.event_date)}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-[#6D7A8B]">
                            <MapPin size={13} className="shrink-0" />
                            {event.location}
                          </div>
                        )}
                        {event.max_attendees && (
                          <div className="flex items-center gap-2 text-sm text-[#6D7A8B]">
                            <Users size={13} className="shrink-0" />
                            {event.current_attendees} / {event.max_attendees} registered
                          </div>
                        )}
                      </div>
                      <p className="text-[#6D7A8B] text-sm mb-4 line-clamp-2">{event.description}</p>

                      {/* Price */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-lg font-bold text-[#0B0F1A]">Ksh {event.price.toLocaleString()}</span>
                          {event.member_discount > 0 && (
                            <span className="ml-2 text-xs text-[#FF7A00] font-medium">
                              Members: Ksh {(event.price - event.member_discount).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/events/register/${event.id}`}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white font-medium rounded-lg hover:opacity-90 text-sm text-center">
                          Register
                        </Link>
                        <button onClick={() => setSelectedEvent(event)}
                          className="px-4 py-2 border border-[#E7ECF3] text-[#6D7A8B] font-medium rounded-lg hover:border-[#2B4C73] hover:text-[#2B4C73] text-sm">
                          Details
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CSR GALLERY TAB ── */}
        {activeTab === "csr" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#0B0F1A]"> Gallery</h2>
              <span className="text-sm text-[#6D7A8B]">
                {csrLoading ? "Loading…" : `${filteredCSR.length} activit${filteredCSR.length !== 1 ? "ies" : "y"}`}
              </span>
            </div>

            {/* Loading skeletons */}
            {csrLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
              </div>
            )}

            {/* Error */}
            {!csrLoading && csrError && (
              <div className="text-center py-12">
                <p className="text-[#E53E3E] mb-4">{csrError}</p>
                <button onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-[#2B4C73] text-white rounded-lg hover:opacity-90">Retry</button>
              </div>
            )}

            {/* Empty */}
            {!csrLoading && !csrError && filteredCSR.length === 0 && (
              <div className="text-center py-16">
                <Heart className="mx-auto mb-4 text-[#E7ECF3]" size={56} />
                <p className="text-[#6D7A8B] text-lg font-medium mb-2">No photos yet</p>
                <p className="text-[#6D7A8B] text-sm">Our community impact stories will be shared here.</p>
              </div>
            )}

            {/* CSR grid */}
            {!csrLoading && !csrError && filteredCSR.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCSR.map((csr, i) => {
                  const photos = allPhotos(csr);
                  const coverImage = csr.main_image_url || photos[0]?.image_url;

                  return (
                    <motion.div
                      key={csr.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.07 }}
                      className="bg-white rounded-xl border border-[#E7ECF3] overflow-hidden hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer group"
                      onClick={() => openCSR(csr)}
                    >
                      {/* Image */}
                      <div className="relative h-48 bg-gradient-to-br from-[#E8F4FD] to-[#d4e9fa] overflow-hidden">
                        {coverImage ? (
                          <img src={coverImage} alt={csr.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ImageIcon className="text-[#2B4C73]/30" size={48} />
                          </div>
                        )}
                        {/* Type badge */}
                        <div className="absolute top-3 left-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getEventTypeBadgeClass(csr.event_type)}`}>
                            {getEventTypeIcon(csr.event_type)}
                            {getEventTypeLabel(csr.event_type)}
                          </span>
                        </div>
                        {/* Photo count */}
                        {photos.length > 0 && (
                          <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <ImageIcon size={10} />
                            {photos.length}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="text-lg font-semibold text-[#0B0F1A] mb-2 line-clamp-1">{csr.title}</h3>
                        <div className="space-y-1 mb-3">
                          <div className="flex items-center gap-2 text-sm text-[#6D7A8B]">
                            <Calendar size={13} className="shrink-0" />
                            {formatDate(csr.event_date)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[#6D7A8B]">
                            <MapPin size={13} className="shrink-0" />
                            {csr.location}
                          </div>
                        </div>
                        <p className="text-[#6D7A8B] text-sm mb-4 line-clamp-2">{csr.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#6D7A8B]">{photos.length} photo{photos.length !== 1 ? "s" : ""}</span>
                          <span className="text-[#2B4C73] text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                            View Gallery <ChevronRight size={14} />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ════════════════════════════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════════════════════════════ */}

      {/* ── Regular Event Modal ── */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            key="event-modal-bg"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={closeAll}
          >
            <motion.div
              key="event-modal"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="relative bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-[#E7ECF3] p-5 z-10">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-xl font-bold text-[#0B0F1A]">{selectedEvent.name}</h3>
                  <button onClick={closeAll} className="p-1 hover:bg-[#F7F9FC] rounded shrink-0">
                    <X size={20} className="text-[#6D7A8B]" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {selectedEvent.image_url && (
                  <div className="h-48 rounded-xl overflow-hidden">
                    <img src={selectedEvent.image_url} alt={selectedEvent.name} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="text-[#2B4C73] mt-0.5 shrink-0" size={18} />
                    <div>
                      <p className="font-medium text-[#0B0F1A]">Date</p>
                      <p className="text-[#6D7A8B]">{formatDate(selectedEvent.event_date)}</p>
                    </div>
                  </div>
                  {selectedEvent.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="text-[#2B4C73] mt-0.5 shrink-0" size={18} />
                      <div>
                        <p className="font-medium text-[#0B0F1A]">Location</p>
                        <p className="text-[#6D7A8B]">{selectedEvent.location}</p>
                      </div>
                    </div>
                  )}
                  {selectedEvent.max_attendees && (
                    <div className="flex items-start gap-3">
                      <Users className="text-[#2B4C73] mt-0.5 shrink-0" size={18} />
                      <div>
                        <p className="font-medium text-[#0B0F1A]">Attendance</p>
                        <p className="text-[#6D7A8B]">{selectedEvent.current_attendees} / {selectedEvent.max_attendees} registered</p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-[#0B0F1A] mb-2">Description</h4>
                  <p className="text-[#6D7A8B] leading-relaxed">{selectedEvent.description}</p>
                </div>

                {/* Pricing box */}
                <div className="bg-[#E8F4FD] p-4 rounded-xl border border-[#2B4C73]/20">
                  <h4 className="font-semibold text-[#0B0F1A] mb-3 flex items-center gap-2">
                    <Ticket size={16} className="text-[#2B4C73]" /> Pricing
                  </h4>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-[#6D7A8B]">General</span>
                      <span className="font-bold text-[#0B0F1A]">Ksh {selectedEvent.price.toLocaleString()}</span>
                    </div>
                    {selectedEvent.member_discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[#6D7A8B]">CHRMAA Members</span>
                        <span className="font-bold text-[#FF7A00]">
                          Ksh {(selectedEvent.price - selectedEvent.member_discount).toLocaleString()}
                          <span className="ml-1 text-xs font-normal">(save Ksh {selectedEvent.member_discount.toLocaleString()})</span>
                        </span>
                      </div>
                    )}
                  </div>
                  <Link href={`/events/register/${selectedEvent.id}`}
                    className="block w-full px-4 py-3 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white font-medium rounded-lg hover:opacity-90 text-center">
                    Register Now
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CSR Gallery Modal ── */}
      <AnimatePresence>
        {selectedCSR && (() => {
          const photos = allPhotos(selectedCSR);
          return (
            <motion.div
              key="csr-modal-bg"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={closeAll}
            >
              <motion.div
                key="csr-modal"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                onClick={e => e.stopPropagation()}
                className="relative bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-[#E7ECF3] p-5 z-10">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#0B0F1A] mb-1">{selectedCSR.title}</h3>
                      <div className="flex flex-wrap gap-3 text-sm text-[#6D7A8B]">
                        <span className="flex items-center gap-1"><Calendar size={13} />{formatDate(selectedCSR.event_date)}</span>
                        <span className="flex items-center gap-1"><MapPin size={13} />{selectedCSR.location}</span>
                      </div>
                    </div>
                    <button onClick={closeAll} className="p-1.5 hover:bg-[#F7F9FC] rounded-lg shrink-0">
                      <X size={22} className="text-[#6D7A8B]" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  <div className="grid lg:grid-cols-3 gap-6">

                    {/* Gallery */}
                    <div className="lg:col-span-2">
                      {photos.length > 0 ? (
                        <>
                          {/* Main image */}
                          <div className="relative h-80 md:h-[420px] bg-[#F7F9FC] rounded-xl overflow-hidden mb-3">
                            <AnimatePresence mode="wait">
                              <motion.img
                                key={currentSlide}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                src={photos[currentSlide].image_url}
                                alt={photos[currentSlide].caption || `Photo ${currentSlide + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </AnimatePresence>

                            {/* Prev / Next */}
                            {photos.length > 1 && (
                              <>
                                <button
                                  onClick={e => { e.stopPropagation(); setCurrentSlide(p => p === 0 ? photos.length - 1 : p - 1); }}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition">
                                  <ChevronLeft size={20} />
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); setCurrentSlide(p => p === photos.length - 1 ? 0 : p + 1); }}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition">
                                  <ChevronRightIcon size={20} />
                                </button>
                                {/* Dots */}
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                  {photos.map((_, i) => (
                                    <button key={i} onClick={e => { e.stopPropagation(); setCurrentSlide(i); }}
                                      className={`h-2 rounded-full transition-all ${i === currentSlide ? "w-5 bg-white" : "w-2 bg-white/50 hover:bg-white/75"}`} />
                                  ))}
                                </div>
                              </>
                            )}

                            {/* Counter */}
                            <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                              {currentSlide + 1} / {photos.length}
                            </div>
                          </div>

                          {/* Caption */}
                          {photos[currentSlide].caption && (
                            <p className="text-center text-sm text-[#6D7A8B] mb-3">
                              {photos[currentSlide].caption}
                            </p>
                          )}

                          {/* Thumbnails */}
                          {photos.length > 1 && (
                            <div className="grid grid-cols-5 md:grid-cols-7 gap-1.5">
                              {photos.map((photo, i) => (
                                <button key={photo.id} onClick={() => setCurrentSlide(i)}
                                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                    i === currentSlide ? "border-[#2B4C73] ring-1 ring-[#2B4C73]" : "border-transparent hover:border-[#6D7A8B]"}`}>
                                  <img src={photo.image_url} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-64 bg-[#F7F9FC] rounded-xl">
                          <div className="text-center">
                            <ImageIcon className="mx-auto mb-2 text-[#E7ECF3]" size={48} />
                            <p className="text-[#6D7A8B] text-sm">No photos available</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                      <div className="bg-[#F7F9FC] rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          {getEventTypeIcon(selectedCSR.event_type)}
                          <span className="font-semibold text-[#0B0F1A]">{getEventTypeLabel(selectedCSR.event_type)}</span>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="text-[#6D7A8B] mb-0.5">Date</p>
                            <p className="font-medium text-[#0B0F1A]">{formatDate(selectedCSR.event_date)}</p>
                          </div>
                          <div>
                            <p className="text-[#6D7A8B] mb-0.5">Location</p>
                            <p className="font-medium text-[#0B0F1A]">{selectedCSR.location}</p>
                          </div>
                          <div>
                            <p className="text-[#6D7A8B] mb-0.5">Photos</p>
                            <p className="font-medium text-[#0B0F1A]">{photos.length} captured moments</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#E8F4FD] rounded-xl p-5 border border-[#2B4C73]/20">
                        <h4 className="font-semibold text-[#2B4C73] mb-2">About this event</h4>
                        <p className="text-[#6D7A8B] text-sm leading-relaxed">{selectedCSR.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        .font-poppins { font-family: 'Poppins', sans-serif; }
        .line-clamp-1 { display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden; }
        .line-clamp-2 { display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden; }
      `}</style>

      <Footer />
    </div>
  );
}