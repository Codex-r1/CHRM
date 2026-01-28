"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch events from Supabase
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Fetching events from Supabase...");
        
        // Use Supabase client directly
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

    fetchEvents();

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Filter events based on active tab, filter, and search - FIXED VERSION
  const filteredEvents = events.filter((event) => {
    // Filter by active tab (upcoming/past)
    const eventDate = new Date(event.event_date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const isUpcoming = eventDate >= now;
    
    if (activeTab === "upcoming" && !isUpcoming) return false;
    if (activeTab === "past" && isUpcoming) return false;
    
    // Filter by search term
    const matchesSearch =
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Return the result
    return matchesSearch;
  });

  const openEventModal = (event: EventType) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeEventModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    document.body.style.overflow = "auto";
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading events...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
      <section className="relative py-12 md:py-16 overflow-hidden bg-gradient-to-b from-blue-50 to-white">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-100 rounded-full blur-3xl opacity-30" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-4xl font-bold font-poppins text-gray-900 mb-4">
              CHRMAA <span className="text-black-600">Events</span>
            </h1>
            
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
              Professional networking, workshops, and conferences for CHRM alumni
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  activeTab === "upcoming"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-300 text-gray-700 hover:border-blue-500"
                }`}
              >
                Upcoming Events ({events.filter(e => new Date(e.event_date) >= new Date()).length})
              </button>
              <button
                onClick={() => setActiveTab("past")}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  activeTab === "past"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-300 text-gray-700 hover:border-blue-500"
                }`}
              >
                Past Events ({events.filter(e => new Date(e.event_date) < new Date()).length})
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
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
          {activeTab === "upcoming" ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-poppins text-gray-900">
                  Upcoming Events
                </h2>
                <div className="text-sm text-gray-600">
                  Showing {filteredEvents.length} events
                </div>
              </div>

              {filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-gray-500">No upcoming events found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      variants={fadeUp}
                      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {/* Event Image */}
                      <div className="relative h-40 bg-gradient-to-br from-blue-100 to-blue-50">
                        {event.image_url && event.image_url !== "/events/placeholder.jpg" ? (
                          <img
                            src={event.image_url}
                            alt={event.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ImageIcon className="text-blue-300" size={48} />
                          </div>
                        )}
                      </div>

                      {/* Event Content */}
                      <div className="p-5">
                        <div className="mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {event.name}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {formatDate(event.event_date)}
                            </span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                              <MapPin size={12} />
                              {event.location}
                            </div>
                          )}
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {event.description}
                        </p>

                        {/* Action Buttons */}
                        <div className="mt-4 flex gap-2">
                          <Link
                            href={`/events/register/${event.id}`}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm text-center"
                          >
                            Register
                          </Link>
                          <button
                            onClick={() => openEventModal(event)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors text-sm"
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
              <h2 className="text-2xl font-bold font-poppins text-gray-900 mb-6">
                Past Events
              </h2>
              
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-gray-500">No past events found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                    >
                      <div className="p-5">
                        <div className="mb-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {event.name}
                            </h3>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              PAST EVENT
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            <Calendar size={12} className="inline mr-1" />
                            {formatDate(event.event_date)}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-4">
                          {event.description}
                        </p>
                        
                        <button
                          onClick={() => openEventModal(event)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
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

      {/* Event Details Modal */}
      {isModalOpen && selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={closeEventModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedEvent.name}
                </h3>
                <button
                  onClick={closeEventModal}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronRight size={20} className="rotate-45" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-6">
                {/* Event Details */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="text-blue-600 mt-1" size={18} />
                    <div>
                      <p className="font-medium text-gray-900">Date & Time</p>
                      <p className="text-gray-700">{formatDate(selectedEvent.event_date)}</p>
                    </div>
                  </div>

                  {selectedEvent.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="text-blue-600 mt-1" size={18} />
                      <div>
                        <p className="font-medium text-gray-900">Location</p>
                        <p className="text-gray-700">{selectedEvent.location}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Event Description</h4>
                  <p className="text-gray-700">{selectedEvent.description}</p>
                </div>

                {/* Pricing */}
                {selectedEvent.price && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Pricing</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Regular Price</span>
                        <span className="font-bold text-gray-900">
                          Ksh {selectedEvent.price.toLocaleString()}
                        </span>
                      </div>
                      
                      {selectedEvent.member_discount && (
                        <div className="flex justify-between">
                          <div>
                            <span className="text-gray-700">Member Price</span>
                            <p className="text-sm text-blue-600">({selectedEvent.member_discount}% off)</p>
                          </div>
                          <span className="font-bold text-blue-600">
                            Ksh {(selectedEvent.price - (selectedEvent.price * selectedEvent.member_discount / 100)).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/events/register/${selectedEvent.id}`}
                      className="block w-full mt-4 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-center"
                    >
                      Register Now
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </motion.div>
  );
}