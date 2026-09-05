"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ChevronRight,
  Image as ImageIcon,
  Search,
  X,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Heart,
  Target,
  Users as UsersIcon,
  Leaf,
  Award,
  Ticket,
  Sparkles,
  Globe,
  GraduationCap,
  Linkedin,
  Star,
  BadgeCheck,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "../../(backend)/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────
type EventType = {
  id: string;
  name: string;
  description: string;
  event_date: string;
  location: string;
  price: number;
  member_discount: number;
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

// ─── Animation Variants ──────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const getEventTypeIcon = (type: string) => {
  const icons: Record<string, JSX.Element> = {
    tree_planting: <Leaf className="text-[#C9A84C]" size={14} />,
    community_service: <Heart className="text-[#C9A84C]" size={14} />,
    charity_drive: <Award className="text-[#C9A84C]" size={14} />,
    educational: <GraduationCap className="text-[#C9A84C]" size={14} />,
    health_campaign: <Target className="text-[#C9A84C]" size={14} />,
  };
  return icons[type] ?? <Heart className="text-[#C9A84C]" size={14} />;
};

const getEventTypeLabel = (type: string) =>
  ({
    tree_planting: "Tree Planting",
    community_service: "Community Service",
    charity_drive: "Charity Drive",
    educational: "Educational",
    health_campaign: "Health Campaign",
  }[type] ?? "CSR Event");

const getEventTypeBadgeClass = (type: string) =>
  ({
    tree_planting: "bg-[#C9A84C]/10 text-[#1B3A6B] border border-[#C9A84C]/30",
    community_service: "bg-[#C9A84C]/10 text-[#1B3A6B] border border-[#C9A84C]/30",
    charity_drive: "bg-[#C9A84C]/10 text-[#1B3A6B] border border-[#C9A84C]/30",
    educational: "bg-[#C9A84C]/10 text-[#1B3A6B] border border-[#C9A84C]/30",
    health_campaign: "bg-[#C9A84C]/10 text-[#1B3A6B] border border-[#C9A84C]/30",
  }[type] ?? "bg-[#1B3A6B]/5 text-[#1B3A6B] border border-[#1B3A6B]/10");

// ─── Skeleton loader ──────────────────────────────────────────────────────────
const CardSkeleton = () => (
  <div className="bg-white rounded-lg border border-[#1B3A6B]/10 overflow-hidden animate-pulse">
    <div className="h-48 bg-[#1B3A6B]/5" />
    <div className="p-5 space-y-3">
      <div className="h-4 bg-[#1B3A6B]/10 rounded w-3/4" />
      <div className="h-3 bg-[#1B3A6B]/10 rounded w-1/2" />
      <div className="h-3 bg-[#1B3A6B]/10 rounded w-full" />
      <div className="h-3 bg-[#1B3A6B]/10 rounded w-5/6" />
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "csr">("upcoming");
  const [searchTerm, setSearchTerm] = useState("");

  const [events, setEvents] = useState<EventType[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [csrEvents, setCsrEvents] = useState<CSRType[]>([]);
  const [csrLoading, setCsrLoading] = useState(true);
  const [csrError, setCsrError] = useState<string | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [selectedCSR, setSelectedCSR] = useState<CSRType | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

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

  useEffect(() => {
    if (selectedEvent || selectedCSR) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedEvent, selectedCSR]);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

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

  const allPhotos = (csr: CSRType): CSRPhoto[] => {
    const photos = csr.photos || [];
    if (photos.length === 0 && csr.main_image_url) {
      return [
        {
          id: "main",
          image_url: csr.main_image_url,
          caption: csr.title,
          display_order: 0,
        },
      ];
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

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-[#1B3A6B] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-4"
          >
            Alumni <span className="text-[#C9A84C]">Events</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed"
          >
            Professional networking, workshops, and community initiatives for the Turi alumni community
          </motion.p>
        </div>
      </section>

      {/* Tabs */}
      <div className="border-b border-[#1B3A6B]/10 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-0 -mb-px">
            <button
              onClick={() => {
                setActiveTab("upcoming");
                setSearchTerm("");
              }}
              className={`px-6 py-4 font-serif font-medium text-sm transition-all border-b-2 ${
                activeTab === "upcoming"
                  ? "border-[#C9A84C] text-[#1B3A6B]"
                  : "border-transparent text-[#1B3A6B]/50 hover:text-[#1B3A6B]/70"
              }`}
            >
              Upcoming Events
              <span className="ml-2 text-xs bg-[#1B3A6B]/5 px-2 py-0.5 rounded-full">
                {eventsLoading ? "…" : upcomingEvents.length}
              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab("csr");
                setSearchTerm("");
              }}
              className={`px-6 py-4 font-serif font-medium text-sm transition-all border-b-2 ${
                activeTab === "csr"
                  ? "border-[#C9A84C] text-[#1B3A6B]"
                  : "border-transparent text-[#1B3A6B]/50 hover:text-[#1B3A6B]/70"
              }`}
            >
              CSR Gallery
              <span className="ml-2 text-xs bg-[#1B3A6B]/5 px-2 py-0.5 rounded-full">
                {csrLoading ? "…" : csrEvents.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B3A6B]/30" size={18} />
            <input
              type="text"
              placeholder={activeTab === "csr" ? "Search CSR activities…" : "Search events…"}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[#1B3A6B]/10 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition placeholder:text-[#1B3A6B]/30"
            />
          </div>
        </div>

        {/* Upcoming Events */}
        {activeTab === "upcoming" && (
          <div>
            {eventsLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            )}

            {!eventsLoading && eventsError && (
              <div className="text-center py-16">
                <p className="text-[#1B3A6B] mb-4">{eventsError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2.5 bg-[#1B3A6B] text-white font-medium rounded-lg hover:bg-[#152e55] transition"
                >
                  Retry
                </button>
              </div>
            )}

            {!eventsLoading && !eventsError && upcomingEvents.length === 0 && (
              <div className="text-center py-16">
                <Calendar className="mx-auto mb-4 text-[#1B3A6B]/20" size={56} />
                <p className="text-[#1B3A6B] text-lg font-serif font-bold mb-2">No upcoming events</p>
                <p className="text-[#1B3A6B]/50 text-sm">Check back later for new events.</p>
              </div>
            )}

            {!eventsLoading && !eventsError && upcomingEvents.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.07 }}
                    className="bg-white border border-[#1B3A6B]/10 rounded-lg overflow-hidden hover:shadow-md transition-all hover:-translate-y-1 group"
                  >
                    <div className="relative h-48 bg-[#1B3A6B]/5">
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon className="text-[#1B3A6B]/20" size={48} />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 bg-[#1B3A6B] text-white text-xs font-medium rounded-sm">
                          {event.status === "upcoming" ? "Upcoming" : event.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-lg font-serif font-bold text-[#1B3A6B] mb-2 line-clamp-1">
                        {event.name}
                      </h3>

                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center gap-2 text-sm text-[#1B3A6B]/60">
                          <Calendar size={14} className="shrink-0 text-[#C9A84C]" />
                          {formatDate(event.event_date)}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-[#1B3A6B]/60">
                            <MapPin size={14} className="shrink-0 text-[#C9A84C]" />
                            {event.location}
                          </div>
                        )}
                        {event.max_attendees && (
                          <div className="flex items-center gap-2 text-sm text-[#1B3A6B]/60">
                            <Users size={14} className="shrink-0 text-[#C9A84C]" />
                            {event.current_attendees} / {event.max_attendees} registered
                          </div>
                        )}
                      </div>

                      <p className="text-[#1B3A6B]/60 text-sm mb-4 line-clamp-2">
                        {event.description}
                      </p>

                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-xl font-serif font-bold text-[#1B3A6B]">
                            KES {event.price.toLocaleString()}
                          </span>
                          {event.member_discount > 0 && (
                            <span className="ml-2 text-xs text-[#C9A84C] font-medium">
                              Members: KES {(event.price - event.member_discount).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={`/events/register/${event.id}`}
                          className="flex-1 px-4 py-2 bg-[#1B3A6B] text-white font-medium rounded-lg hover:bg-[#152e55] transition text-sm text-center"
                        >
                          Register
                        </Link>
                        <button
                          onClick={() => setSelectedEvent(event)}
                          className="px-4 py-2 border border-[#1B3A6B]/10 text-[#1B3A6B] font-medium rounded-lg hover:border-[#C9A84C] hover:text-[#1B3A6B] transition text-sm"
                        >
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

        {/* CSR Gallery */}
        {activeTab === "csr" && (
          <div>
            {csrLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            )}

            {!csrLoading && csrError && (
              <div className="text-center py-16">
                <p className="text-[#1B3A6B] mb-4">{csrError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2.5 bg-[#1B3A6B] text-white font-medium rounded-lg hover:bg-[#152e55] transition"
                >
                  Retry
                </button>
              </div>
            )}

            {!csrLoading && !csrError && filteredCSR.length === 0 && (
              <div className="text-center py-16">
                <Heart className="mx-auto mb-4 text-[#1B3A6B]/20" size={56} />
                <p className="text-[#1B3A6B] text-lg font-serif font-bold mb-2">No photos yet</p>
                <p className="text-[#1B3A6B]/50 text-sm">Our community impact stories will be shared here.</p>
              </div>
            )}

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
                      className="bg-white border border-[#1B3A6B]/10 rounded-lg overflow-hidden hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer group"
                      onClick={() => openCSR(csr)}
                    >
                      <div className="relative h-48 bg-[#1B3A6B]/5 overflow-hidden">
                        {coverImage ? (
                          <img
                            src={coverImage}
                            alt={csr.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ImageIcon className="text-[#1B3A6B]/20" size={48} />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-medium ${getEventTypeBadgeClass(
                              csr.event_type
                            )}`}
                          >
                            {getEventTypeIcon(csr.event_type)}
                            {getEventTypeLabel(csr.event_type)}
                          </span>
                        </div>
                        {photos.length > 0 && (
                          <div className="absolute top-3 right-3 bg-[#1B3A6B]/80 text-white text-xs px-2 py-1 rounded-sm flex items-center gap-1">
                            <ImageIcon size={10} />
                            {photos.length}
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="text-lg font-serif font-bold text-[#1B3A6B] mb-2 line-clamp-1">
                          {csr.title}
                        </h3>

                        <div className="space-y-1.5 mb-3">
                          <div className="flex items-center gap-2 text-sm text-[#1B3A6B]/60">
                            <Calendar size={14} className="shrink-0 text-[#C9A84C]" />
                            {formatDate(csr.event_date)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[#1B3A6B]/60">
                            <MapPin size={14} className="shrink-0 text-[#C9A84C]" />
                            {csr.location}
                          </div>
                        </div>

                        <p className="text-[#1B3A6B]/60 text-sm mb-4 line-clamp-2">
                          {csr.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#1B3A6B]/40">
                            {photos.length} photo{photos.length !== 1 ? "s" : ""}
                          </span>
                          <span className="text-[#1B3A6B] text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
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

      {/* Event Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            key="event-modal-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1B3A6B]/50 backdrop-blur-sm"
            onClick={closeAll}
          >
            <motion.div
              key="event-modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="relative bg-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              <div className="sticky top-0 bg-white border-b border-[#1B3A6B]/10 p-5 z-10">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-xl font-serif font-bold text-[#1B3A6B]">
                    {selectedEvent.name}
                  </h3>
                  <button
                    onClick={closeAll}
                    className="p-1.5 hover:bg-[#1B3A6B]/5 rounded-lg shrink-0 transition"
                  >
                    <X size={20} className="text-[#1B3A6B]/50" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {selectedEvent.image_url && (
                  <div className="h-48 rounded-lg overflow-hidden">
                    <img
                      src={selectedEvent.image_url}
                      alt={selectedEvent.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="text-[#C9A84C] mt-0.5 shrink-0" size={18} />
                    <div>
                      <p className="font-medium text-[#1B3A6B]">Date</p>
                      <p className="text-[#1B3A6B]/60">{formatDate(selectedEvent.event_date)}</p>
                    </div>
                  </div>
                  {selectedEvent.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="text-[#C9A84C] mt-0.5 shrink-0" size={18} />
                      <div>
                        <p className="font-medium text-[#1B3A6B]">Location</p>
                        <p className="text-[#1B3A6B]/60">{selectedEvent.location}</p>
                      </div>
                    </div>
                  )}
                  {selectedEvent.max_attendees && (
                    <div className="flex items-start gap-3">
                      <Users className="text-[#C9A84C] mt-0.5 shrink-0" size={18} />
                      <div>
                        <p className="font-medium text-[#1B3A6B]">Attendance</p>
                        <p className="text-[#1B3A6B]/60">
                          {selectedEvent.current_attendees} / {selectedEvent.max_attendees} registered
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-serif font-semibold text-[#1B3A6B] mb-2">Description</h4>
                  <p className="text-[#1B3A6B]/60 leading-relaxed">{selectedEvent.description}</p>
                </div>

                <div className="bg-[#1B3A6B]/5 p-5 rounded-lg border border-[#1B3A6B]/10">
                  <h4 className="font-serif font-semibold text-[#1B3A6B] mb-3 flex items-center gap-2">
                    <Ticket size={16} className="text-[#C9A84C]" /> Pricing
                  </h4>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-[#1B3A6B]/60">General</span>
                      <span className="font-serif font-bold text-[#1B3A6B]">
                        KES {selectedEvent.price.toLocaleString()}
                      </span>
                    </div>
                    {selectedEvent.member_discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[#1B3A6B]/60">Alumni Members</span>
                        <span className="font-serif font-bold text-[#C9A84C]">
                          KES {(selectedEvent.price - selectedEvent.member_discount).toLocaleString()}
                          <span className="ml-1 text-xs font-normal text-[#1B3A6B]/40">
                            (save KES {selectedEvent.member_discount.toLocaleString()})
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/events/register/${selectedEvent.id}`}
                    className="block w-full px-4 py-3 bg-[#1B3A6B] text-white font-medium rounded-lg hover:bg-[#152e55] transition text-center"
                  >
                    Register Now
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSR Modal */}
      <AnimatePresence>
        {selectedCSR &&
          (() => {
            const photos = allPhotos(selectedCSR);
            return (
              <motion.div
                key="csr-modal-bg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1B3A6B]/80 backdrop-blur-sm"
                onClick={closeAll}
              >
                <motion.div
                  key="csr-modal"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={e => e.stopPropagation()}
                  className="relative bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                >
                  <div className="sticky top-0 bg-white border-b border-[#1B3A6B]/10 p-5 z-10">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-serif font-bold text-[#1B3A6B] mb-1">
                          {selectedCSR.title}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-[#1B3A6B]/60">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-[#C9A84C]" />
                            {formatDate(selectedCSR.event_date)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-[#C9A84C]" />
                            {selectedCSR.location}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={closeAll}
                        className="p-1.5 hover:bg-[#1B3A6B]/5 rounded-lg shrink-0 transition"
                      >
                        <X size={22} className="text-[#1B3A6B]/50" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                        {photos.length > 0 ? (
                          <>
                            <div className="relative h-80 md:h-[420px] bg-[#1B3A6B]/5 rounded-lg overflow-hidden mb-3">
                              <AnimatePresence mode="wait">
                                <motion.img
                                  key={currentSlide}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.25 }}
                                  src={photos[currentSlide].image_url}
                                  alt={photos[currentSlide].caption || `Photo ${currentSlide + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </AnimatePresence>

                              {photos.length > 1 && (
                                <>
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      setCurrentSlide(p => (p === 0 ? photos.length - 1 : p - 1));
                                    }}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#1B3A6B]/60 hover:bg-[#1B3A6B]/80 text-white rounded-full flex items-center justify-center transition"
                                  >
                                    <ChevronLeft size={20} />
                                  </button>
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      setCurrentSlide(p => (p === photos.length - 1 ? 0 : p + 1));
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#1B3A6B]/60 hover:bg-[#1B3A6B]/80 text-white rounded-full flex items-center justify-center transition"
                                  >
                                    <ChevronRightIcon size={20} />
                                  </button>
                                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                    {photos.map((_, i) => (
                                      <button
                                        key={i}
                                        onClick={e => {
                                          e.stopPropagation();
                                          setCurrentSlide(i);
                                        }}
                                        className={`h-2 rounded-full transition-all ${
                                          i === currentSlide
                                            ? "w-5 bg-[#C9A84C]"
                                            : "w-2 bg-white/50 hover:bg-white/75"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </>
                              )}

                              <div className="absolute top-3 right-3 bg-[#1B3A6B]/80 text-white text-xs px-2 py-1 rounded-sm">
                                {currentSlide + 1} / {photos.length}
                              </div>
                            </div>

                            {photos[currentSlide].caption && (
                              <p className="text-center text-sm text-[#1B3A6B]/60 mb-3">
                                {photos[currentSlide].caption}
                              </p>
                            )}

                            {photos.length > 1 && (
                              <div className="grid grid-cols-5 md:grid-cols-7 gap-1.5">
                                {photos.map((photo, i) => (
                                  <button
                                    key={photo.id}
                                    onClick={() => setCurrentSlide(i)}
                                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                      i === currentSlide
                                        ? "border-[#C9A84C] ring-1 ring-[#C9A84C]"
                                        : "border-transparent hover:border-[#1B3A6B]/20"
                                    }`}
                                  >
                                    <img
                                      src={photo.image_url}
                                      alt={`Thumb ${i + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-64 bg-[#1B3A6B]/5 rounded-lg">
                            <div className="text-center">
                              <ImageIcon className="mx-auto mb-2 text-[#1B3A6B]/20" size={48} />
                              <p className="text-[#1B3A6B]/40 text-sm">No photos available</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="lg:col-span-1 space-y-4">
                        <div className="bg-[#1B3A6B]/5 rounded-lg p-5 border border-[#1B3A6B]/10">
                          <div className="flex items-center gap-2 mb-4">
                            {getEventTypeIcon(selectedCSR.event_type)}
                            <span className="font-serif font-semibold text-[#1B3A6B]">
                              {getEventTypeLabel(selectedCSR.event_type)}
                            </span>
                          </div>
                          <div className="space-y-3 text-sm">
                            <div>
                              <p className="text-[#1B3A6B]/40 mb-0.5">Date</p>
                              <p className="font-medium text-[#1B3A6B]">
                                {formatDate(selectedCSR.event_date)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[#1B3A6B]/40 mb-0.5">Location</p>
                              <p className="font-medium text-[#1B3A6B]">{selectedCSR.location}</p>
                            </div>
                            <div>
                              <p className="text-[#1B3A6B]/40 mb-0.5">Photos</p>
                              <p className="font-medium text-[#1B3A6B]">
                                {photos.length} captured moments
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-[#1B3A6B]/5 rounded-lg p-5 border border-[#1B3A6B]/10">
                          <h4 className="font-serif font-semibold text-[#1B3A6B] mb-2">About this event</h4>
                          <p className="text-[#1B3A6B]/60 text-sm leading-relaxed">
                            {selectedCSR.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
      </AnimatePresence>

      <Footer />
    </div>
  );
}