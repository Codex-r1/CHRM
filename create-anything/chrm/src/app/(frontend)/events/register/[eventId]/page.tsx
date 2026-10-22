"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { Calendar, MapPin, Users, CheckCircle, AlertCircle, ArrowLeft, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "../../../../(backend)/context/auth";
import PaymentMethodSelector, { PaymentMethod, CardDetails } from "../../../components/PaymentMethodSelector";

export default function EventRegistrationPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.eventId as string;
  const { user } = useAuth();

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1 = Form, 2 = Success
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [cardDetails, setCardDetails] = useState<CardDetails>({ cardNumber: '', expiryDate: '', cvv: '', cardholderName: '' });

  useEffect(() => {
    if (user) setForm(prev => ({ ...prev, name: user.user_metadata?.full_name || "", email: user.email || "" }));
  }, [user]);

  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then(res => res.json())
      .then(data => { setEvent(data); setLoading(false); })
      .catch(() => { setError("Event not found"); setLoading(false); });
  }, [eventId]);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (paymentMethod === 'mpesa') {
        const res = await fetch('/api/payments/stk-push', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: form.phone, amount: event.price, paymentType: 'event', userId: user?.id || null, metadata: { event_id: event.id, attendee_name: form.name, attendee_email: form.email } })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        // Handle polling logic here
        setStep(2);
      } else {
        // Handle Stripe Card Intent here
        setStep(2);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center">Event not found</div>;

  if (step === 2) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="max-w-md">
            <CheckCircle className="mx-auto text-[#C9A84C] mb-6" size={48} />
            <h1 className="font-serif text-3xl text-[#1B3A6B] mb-4">Registration Confirmed</h1>
            <p className="text-[#1B3A6B]/60 mb-8">You are successfully registered for {event.name}. A confirmation email has been sent.</p>
            <Link href="/events" className="bg-[#1B3A6B] text-white px-8 py-3 rounded-sm text-sm font-semibold uppercase tracking-wider">Back to Events</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <Link href="/events" className="inline-flex items-center text-sm text-[#1B3A6B]/60 hover:text-[#1B3A6B] mb-8">
          <ArrowLeft size={16} className="mr-2" /> Back to Events
        </Link>

        <div className="grid md:grid-cols-2 gap-16">
          {/* Event Info */}
          <div>
            <h1 className="font-serif text-4xl text-[#1B3A6B] mb-4">{event.name}</h1>
            <div className="space-y-4 text-sm text-[#1B3A6B]/70 mb-8">
              <p className="flex items-center gap-3"><Calendar size={16} className="text-[#C9A84C]" /> {new Date(event.event_date).toLocaleDateString()}</p>
              <p className="flex items-center gap-3"><MapPin size={16} className="text-[#C9A84C]" /> {event.location}</p>
              <p className="flex items-center gap-3"><Users size={16} className="text-[#C9A84C]" /> {event.current_attendees} / {event.max_attendees} Registered</p>
            </div>
            <div className="border-t border-[#1B3A6B]/10 pt-6">
              <p className="text-sm leading-relaxed text-[#1B3A6B]/70">{event.description}</p>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="bg-[#F9F9F8] p-8 border border-[#1B3A6B]/10">
            <h2 className="font-serif text-2xl text-[#1B3A6B] mb-6">Register</h2>
            {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

            <div className="space-y-4 mb-8">
              <input required type="text" placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border-b border-[#1B3A6B]/30 bg-transparent py-2 text-sm focus:border-[#1B3A6B] outline-none" />
              <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border-b border-[#1B3A6B]/30 bg-transparent py-2 text-sm focus:border-[#1B3A6B] outline-none" />
              <input required type="tel" placeholder="Phone (M-PESA)" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border-b border-[#1B3A6B]/30 bg-transparent py-2 text-sm focus:border-[#1B3A6B] outline-none" />
            </div>

            <div className="mb-8">
              <h3 className="font-serif text-lg text-[#1B3A6B] mb-3">Payment Method</h3>
              <PaymentMethodSelector paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} cardDetails={cardDetails} setCardDetails={setCardDetails} currentFee={event.price} isProcessing={submitting} />
            </div>

            <div className="flex justify-between items-center border-t border-[#1B3A6B]/10 pt-4 mb-6">
              <span className="text-sm font-semibold uppercase text-[#1B3A6B]">Total Due</span>
              <span className="font-serif text-2xl text-[#1B3A6B]">KES {event.price.toLocaleString()}</span>
            </div>

            <button type="submit" disabled={submitting} className="w-full bg-[#1B3A6B] text-white py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-[#152e55] transition flex justify-center items-center gap-2">
              {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Complete Registration'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}