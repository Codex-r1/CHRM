"use client";

import { useState, useEffect, useRef } from "react";
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
  Filter,
  Search,
  Ticket,
  X,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Heart,
  Target,
  Users as UsersIcon,
  Leaf,
  Award,
} from "lucide-react";
import Link from "next/link";
import { supabase } from '../lib/supabase/client'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.6,
      ease: "easeOut" as const 
    } 
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { 
      duration: 0.6, 
      ease: "easeOut" as const 
    },
  },
};

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

type CSRType = {
  id: string;
  event_type: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  organizer: string;
  participants_count: number;
  impact_description: string;
  main_image_url: string;
  is_published: boolean;
  photos: CSRPhoto[];
};

type CSRPhoto = {
  id: string;
  image_url: string;
  caption: string;
  display_order: number;
};

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "csr">("upcoming");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [selectedCSREvent, setSelectedCSREvent] = useState<CSRType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCSRModalOpen, setIsCSRModalOpen] = useState(false);
  const [events, setEvents] = useState<EventType[]>([]);
  const [csrEvents, setCsrEvents] = useState<CSRType[]>([]);
  const [loading, setLoading] = useState(true);
  const [csrLoading, setCsrLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetchEvents();
    fetchCSREvents();

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching events from Supabase...");
      
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('event_date', { ascending: true });

      if (fetchError) {
        console.error("Supabase fetch error:", fetchError);
        throw new Error(fetchError.message);
      }

      console.log("Fetched events:", data);
      
      const formattedEvents = (data || []).map(event => ({
        ...event,
        id: String(event.id),
      }));
      
      setEvents(formattedEvents);
      
    } catch (err: any) {
      console.error("Unexpected error:", err);
      setError(err.message || "Failed to load events. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCSREvents = async () => {
    try {
      setCsrLoading(true);
      
      // Fetch CSR events
      const { data: csrData, error: csrError } = await supabase
        .from('csr_events')
        .select('*')
        .eq('is_published', true)
        .order('event_date', { ascending: false });

      if (csrError) {
        console.error("CSR events fetch error:", csrError);
        throw new Error(csrError.message);
      }

      // For each CSR event, fetch its photos
      const csrEventsWithPhotos = await Promise.all(
        (csrData || []).map(async (csrEvent) => {
          const { data: photos, error: photosError } = await supabase
            .from('csr_event_photos')
            .select('*')
            .eq('csr_event_id', csrEvent.id)
            .order('display_order', { ascending: true });

          if (photosError) {
            console.error("Photos fetch error:", photosError);
          }

          return {
            ...csrEvent,
            id: String(csrEvent.id),
            photos: photos || []
          };
        })
      );

      setCsrEvents(csrEventsWithPhotos);
      
    } catch (err: any) {
      console.error("CSR events error:", err);
    } finally {
      setCsrLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const eventDate = new Date(event.event_date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const isUpcoming = eventDate >= now;
    
    if (activeTab === "upcoming" && !isUpcoming) return false;
    if (activeTab === "past" && isUpcoming) return false;
    if (activeTab === "csr") return false; // CSR events handled separately
    
    const matchesSearch =
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const filteredCSREvents = csrEvents.filter((csrEvent) => {
    const matchesSearch =
      csrEvent.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      csrEvent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      csrEvent.event_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const openEventModal = (event: EventType) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const openCSREventModal = (csrEvent: CSRType) => {
    setSelectedCSREvent(csrEvent);
    setCurrentSlide(0);
    setIsCSRModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeEventModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setIsCSRModalOpen(false);
    setSelectedCSREvent(null);
    document.body.style.overflow = "auto";
  };

  const nextSlide = () => {
    if (selectedCSREvent?.photos) {
      setCurrentSlide((prev) => 
        prev === selectedCSREvent.photos.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevSlide = () => {
    if (selectedCSREvent?.photos) {
      setCurrentSlide((prev) => 
        prev === 0 ? selectedCSREvent.photos.length - 1 : prev - 1
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'tree_planting':
        return <Leaf className="text-[#2B4C73]" size={20} />;
      case 'community_service':
        return <Heart className="text-[#FF7A00]" size={20} />;
      case 'charity_drive':
        return <Award className="text-[#E53E3E]" size={20} />;
      case 'educational':
        return <UsersIcon className="text-[#2B4C73]" size={20} />;
      case 'health_campaign':
        return <Target className="text-[#FF7A00]" size={20} />;
      default:
        return <Heart className="text-[#E53E3E]" size={20} />;
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'tree_planting':
        return 'Tree Planting';
      case 'community_service':
        return 'Community Service';
      case 'charity_drive':
        return 'Charity Drive';
      case 'educational':
        return 'Educational Program';
      case 'health_campaign':
        return 'Health Campaign';
      default:
        return 'CSR Event';
    }
  };

  if (loading || csrLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2B4C73] mb-4"></div>
            <p className="text-[#6D7A8B]">Loading events...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#E53E3E] mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#2B4C73] text-white rounded-lg hover:opacity-90 transition"
            >
              Retry
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-white"
    >
      <Header />

      {/* Hero Section */}
      <section className="relative py-12 md:py-16 overflow-hidden bg-gradient-to-b from-[#E8F4FD] to-white">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-64 h-64 bg-[#2B4C73]/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#FF7A00]/10 rounded-full blur-3xl opacity-30" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-4xl font-bold font-poppins text-[#0B0F1A] mb-4">
              CHRMAA <span className="bg-gradient-to-r from-[#2B4C73] via-[#FF7A00] to-[#E53E3E] bg-clip-text text-transparent">Events</span>
            </h1>
            
            <p className="text-lg text-[#6D7A8B] max-w-3xl mx-auto mb-8">
              Professional networking, workshops, and CSR activities for CHRM alumni
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  activeTab === "upcoming"
                    ? "bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white shadow-md"
                    : "bg-white border border-[#E7ECF3] text-[#6D7A8B] hover:border-[#2B4C73]"
                }`}
              >
                Upcoming Events ({events.filter(e => new Date(e.event_date) >= new Date()).length})
              </button>
              <button
                onClick={() => setActiveTab("csr")}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  activeTab === "csr"
                    ? "bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white shadow-md"
                    : "bg-white border border-[#E7ECF3] text-[#6D7A8B] hover:border-[#2B4C73]"
                }`}
              >
                Gallery ({csrEvents.length})
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter and Search Bar */}
        <motion.div
          variants={scaleIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-8"
        >
          <div className="bg-white rounded-xl p-4 border border-[#E7ECF3] shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6D7A8B]" size={20} />
                  <input
                    type="text"
                    placeholder={
                      activeTab === "csr" 
                        ? "Search CSR activities..." 
                        : "Search events..."
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#F7F9FC] border border-[#E7ECF3] rounded-lg focus:outline-none focus:border-[#2B4C73] focus:ring-1 focus:ring-[#E8F4FD]"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Events Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-12"
        >
          {activeTab === "csr" ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-poppins text-[#0B0F1A]">
                  Past CSR Activities 
                </h2>
                <div className="text-sm text-[#6D7A8B]">
                  Showing {filteredCSREvents.length}
                </div>
              </div>

              {filteredCSREvents.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="mx-auto mb-4 text-[#E7ECF3]" size={48} />
                  <p className="text-[#6D7A8B]">No CSR activities found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCSREvents.map((csrEvent) => (
                    <motion.div
                      key={csrEvent.id}
                      variants={fadeUp}
                      className="bg-white rounded-lg border border-[#E7ECF3] overflow-hidden hover:shadow-md transition-shadow hover:-translate-y-1 cursor-pointer"
                      onClick={() => openCSREventModal(csrEvent)}
                    >
                      {/* CSR Event Image */}
                      <div className="relative h-48 bg-gradient-to-br from-[#E8F4FD] to-[#d4e9fa] overflow-hidden">
                        {csrEvent.main_image_url ? (
                          <img
                            src={csrEvent.main_image_url}
                            alt={csrEvent.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        ) : csrEvent.photos && csrEvent.photos.length > 0 ? (
                          <img
                            src={csrEvent.photos[0].image_url}
                            alt={csrEvent.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ImageIcon className="text-[#2B4C73]/30" size={48} />
                          </div>
                        )}
                        <div className="absolute top-4 left-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            csrEvent.event_type === 'tree_planting' ? "bg-[#E8F4FD] text-[#2B4C73]" :
                            csrEvent.event_type === 'community_service' ? "bg-[#FFF4E6] text-[#FF7A00]" :
                            csrEvent.event_type === 'charity_drive' ? "bg-[#FFF0F0] text-[#E53E3E]" :
                            "bg-[#F7F9FC] text-[#6D7A8B]"
                          }`}>
                            {getEventTypeIcon(csrEvent.event_type)}
                            {getEventTypeLabel(csrEvent.event_type)}
                          </span>
                        </div>
                        {csrEvent.photos && csrEvent.photos.length > 0 && (
                          <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                            {csrEvent.photos.length} photos
                          </div>
                        )}
                      </div>

                      {/* CSR Event Content */}
                      <div className="p-5">
                        <div className="mb-3">
                          <h3 className="text-lg font-semibold text-[#0B0F1A] mb-2">
                            {csrEvent.title}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-[#6D7A8B] mb-2">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {formatDate(csrEvent.event_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-[#6D7A8B] mb-3">
                            <MapPin size={12} />
                            {csrEvent.location}
                          </div>
                        </div>

                        <p className="text-[#6D7A8B] text-sm mb-4 line-clamp-2">
                          {csrEvent.description}
                        </p>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-1 text-sm text-[#6D7A8B]">
                            <Users size={14} />
                            {csrEvent.participants_count} participants
                          </div>
                          <button className="text-[#2B4C73] hover:text-[#1E3A5F] text-sm font-medium flex items-center gap-1">
                            View Gallery <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === "upcoming" ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-poppins text-[#0B0F1A]">
                  Upcoming Events
                </h2>
                <div className="text-sm text-[#6D7A8B]">
                  Showing {filteredEvents.length} events
                </div>
              </div>

              {filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="mx-auto mb-4 text-[#E7ECF3]" size={48} />
                  <p className="text-[#6D7A8B]">No upcoming events found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      variants={fadeUp}
                      className="bg-white rounded-lg border border-[#E7ECF3] overflow-hidden hover:shadow-md transition-shadow hover:-translate-y-1"
                    >
                      {/* Event Image */}
                      <div className="relative h-40 bg-gradient-to-br from-[#E8F4FD] to-[#d4e9fa]">
                        {event.image_url && event.image_url !== "/events/placeholder.jpg" ? (
                          <img
                            src={event.image_url}
                            alt={event.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ImageIcon className="text-[#2B4C73]/30" size={48} />
                          </div>
                        )}
                      </div>

                      {/* Event Content */}
                      <div className="p-5">
                        <div className="mb-3">
                          <h3 className="text-lg font-semibold text-[#0B0F1A] mb-2">
                            {event.name}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-[#6D7A8B] mb-2">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {formatDate(event.event_date)}
                            </span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1 text-sm text-[#6D7A8B] mb-3">
                              <MapPin size={12} />
                              {event.location}
                            </div>
                          )}
                        </div>

                        <p className="text-[#6D7A8B] text-sm mb-4 line-clamp-2">
                          {event.description}
                        </p>

                        {/* Action Buttons */}
                        <div className="mt-4 flex gap-2">
                          <Link
                            href={`/events/register/${event.id}`}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white font-medium rounded-lg hover:opacity-90 transition-colors text-sm text-center"
                          >
                            Register
                          </Link>
                          <button
                            onClick={() => openEventModal(event)}
                            className="px-4 py-2 border border-[#E7ECF3] text-[#6D7A8B] font-medium rounded-lg hover:border-[#2B4C73] hover:text-[#2B4C73] transition-colors text-sm"
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
          ) : (
            <div>
              <h2 className="text-2xl font-bold font-poppins text-[#0B0F1A] mb-6">
                Past Events
              </h2>
              
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="mx-auto mb-4 text-[#E7ECF3]" size={48} />
                  <p className="text-[#6D7A8B]">No past events found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      className="bg-white rounded-lg border border-[#E7ECF3] overflow-hidden hover:shadow-sm transition"
                    >
                      <div className="p-5">
                        <div className="mb-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-[#0B0F1A]">
                              {event.name}
                            </h3>
                            <span className="px-2 py-1 bg-[#F7F9FC] text-[#6D7A8B] text-xs rounded">
                              PAST EVENT
                            </span>
                          </div>
                          <div className="text-sm text-[#6D7A8B] mb-2">
                            <Calendar size={12} className="inline mr-1" />
                            {formatDate(event.event_date)}
                          </div>
                        </div>
                        
                        <p className="text-[#6D7A8B] text-sm mb-4">
                          {event.description}
                        </p>
                        
                        <button
                          onClick={() => openEventModal(event)}
                          className="text-[#2B4C73] hover:text-[#1E3A5F] text-sm font-medium"
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>

      {/* Regular Event Details Modal */}
      {isModalOpen && selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={closeEventModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-[#E7ECF3] p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#0B0F1A] font-poppins">
                  {selectedEvent.name}
                </h3>
                <button
                  onClick={closeEventModal}
                  className="p-1 hover:bg-[#F7F9FC] rounded transition-colors"
                >
                  <X size={20} className="text-[#6D7A8B]" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-6">
                {/* Event Details */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="text-[#2B4C73] mt-1" size={18} />
                    <div>
                      <p className="font-medium text-[#0B0F1A]">Date & Time</p>
                      <p className="text-[#6D7A8B]">{formatDate(selectedEvent.event_date)}</p>
                    </div>
                  </div>

                  {selectedEvent.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="text-[#2B4C73] mt-1" size={18} />
                      <div>
                        <p className="font-medium text-[#0B0F1A]">Location</p>
                        <p className="text-[#6D7A8B]">{selectedEvent.location}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-semibold text-[#0B0F1A] mb-2">Event Description</h4>
                  <p className="text-[#6D7A8B]">{selectedEvent.description}</p>
                </div>

                {/* Pricing */}
                {selectedEvent.price && (
                  <div className="bg-[#E8F4FD] p-4 rounded-lg border border-[#2B4C73]/20">
                    <h4 className="font-semibold text-[#0B0F1A] mb-3">Pricing</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[#6D7A8B]">Regular Price</span>
                        <span className="font-bold text-[#0B0F1A]">
                          Ksh {selectedEvent.price.toLocaleString()}
                        </span>
                      </div>
                      
                      {selectedEvent.member_discount && (
                        <div className="flex justify-between">
                          <div>
                            <span className="text-[#6D7A8B]">Member Price</span>
                            <p className="text-sm text-[#FF7A00]">({selectedEvent.member_discount}% off)</p>
                          </div>
                          <span className="font-bold text-[#FF7A00]">
                            Ksh {(selectedEvent.price - (selectedEvent.price * selectedEvent.member_discount / 100)).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/events/register/${selectedEvent.id}`}
                      className="block w-full mt-4 px-4 py-3 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white font-medium rounded-lg hover:opacity-90 transition-colors text-center"
                    >
                      Register Now
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* CSR Event Gallery Modal */}
      {isCSRModalOpen && selectedCSREvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={closeEventModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-[#E7ECF3] p-6 z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-[#0B0F1A] font-poppins mb-2">
                    {selectedCSREvent.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-[#6D7A8B]">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      {formatDate(selectedCSREvent.event_date)}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={16} />
                      {selectedCSREvent.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={16} />
                      {selectedCSREvent.participants_count} participants
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeEventModal}
                  className="p-2 hover:bg-[#F7F9FC] rounded-lg transition-colors"
                >
                  <X size={24} className="text-[#6D7A8B]" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Gallery Section */}
                <div className="lg:col-span-2">
                  <div className="relative mb-4">
                    {/* Main Image */}
                    <div className="relative h-[400px] md:h-[500px] bg-[#F7F9FC] rounded-xl overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={currentSlide}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          src={
                            selectedCSREvent.photos && selectedCSREvent.photos.length > 0
                              ? selectedCSREvent.photos[currentSlide].image_url
                              : selectedCSREvent.main_image_url
                          }
                          alt={`Slide ${currentSlide + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </AnimatePresence>
                      
                      {/* Navigation Arrows */}
                      {selectedCSREvent.photos && selectedCSREvent.photos.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              prevSlide();
                            }}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition"
                          >
                            <ChevronLeft size={24} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              nextSlide();
                            }}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition"
                          >
                            <ChevronRightIcon size={24} />
                          </button>
                        </>
                      )}
                      
                      {/* Slide Indicator */}
                      {selectedCSREvent.photos && selectedCSREvent.photos.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                          {selectedCSREvent.photos.map((_, index) => (
                            <button
                              key={index}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentSlide(index);
                              }}
                              className={`w-3 h-3 rounded-full transition-all ${
                                index === currentSlide
                                  ? 'bg-white w-6'
                                  : 'bg-white/50 hover:bg-white/70'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Image Caption */}
                    {selectedCSREvent.photos && selectedCSREvent.photos.length > 0 && (
                      <p className="text-center text-[#6D7A8B] mt-4">
                        {selectedCSREvent.photos[currentSlide].caption || 
                         `Photo ${currentSlide + 1} of ${selectedCSREvent.photos.length}`}
                      </p>
                    )}
                  </div>

                  {/* Thumbnail Grid */}
                  {selectedCSREvent.photos && selectedCSREvent.photos.length > 1 && (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {selectedCSREvent.photos.map((photo, index) => (
                        <button
                          key={photo.id}
                          onClick={() => setCurrentSlide(index)}
                          className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                            index === currentSlide
                              ? 'border-[#2B4C73] scale-105'
                              : 'border-transparent hover:border-[#6D7A8B]'
                          }`}
                        >
                          <img
                            src={photo.image_url}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Event Details Sidebar */}
                <div className="lg:col-span-1">
                  <div className="sticky top-6">
                    <div className="bg-[#F7F9FC] rounded-xl p-6 mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        {getEventTypeIcon(selectedCSREvent.event_type)}
                        <span className="font-semibold text-[#0B0F1A]">
                          {getEventTypeLabel(selectedCSREvent.event_type)}
                        </span>
                      </div>
                      
                      <h4 className="font-semibold text-[#0B0F1A] mb-3">Event Details</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-[#6D7A8B] mb-1">Organized by</p>
                          <p className="font-medium text-[#0B0F1A]">{selectedCSREvent.organizer}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-[#6D7A8B] mb-1">Date</p>
                          <p className="font-medium text-[#0B0F1A]">{formatDate(selectedCSREvent.event_date)}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-[#6D7A8B] mb-1">Location</p>
                          <p className="font-medium text-[#0B0F1A]">{selectedCSREvent.location}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-[#6D7A8B] mb-1">Participants</p>
                          <p className="font-medium text-[#0B0F1A]">{selectedCSREvent.participants_count} CHRMAA members</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-[#E8F4FD] rounded-xl p-6 border border-[#2B4C73]/20">
                      <h4 className="font-semibold text-[#2B4C73] mb-3">Impact Summary</h4>
                      <p className="text-[#6D7A8B]">
                        {selectedCSREvent.impact_description || selectedCSREvent.description}
                      </p>
                    </div>
                    
                    {selectedCSREvent.photos && selectedCSREvent.photos.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold text-[#0B0F1A] mb-3">Gallery</h4>
                        <p className="text-[#6D7A8B] text-sm">
                          {selectedCSREvent.photos.length} photos documenting our CSR initiative
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        
        .font-poppins {
          font-family: 'Poppins', sans-serif;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      
      <Footer />
    </motion.div>
  );
}