import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/app/(backend)/lib/auth/session";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(key, { apiVersion: "2026-08-26.dahlia", typescript: true });
}

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function POST(request: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY is not set for this deployment");
      return NextResponse.json({ error: "Card payments are temporarily unavailable. Please pay with M-PESA or try again later.", code: "card_unavailable" }, { status: 503 });
    }
    const body = await request.json();
    const {
      metadata = {},
      customerEmail,
    } = body;

    const admin = supabaseAdmin();
    let verifiedAmount = 0;
    // The client's amount is ignored: the charge comes from the event or order record.

    if (metadata.event_id) {
      const { data: event } = await admin
        .from("events")
        .select("price, is_active, max_attendees, current_attendees")
        .eq("id", metadata.event_id)
        .maybeSingle();

      if (!event || event.is_active === false) {
        return NextResponse.json({ error: "This event is not open for registration." }, { status: 404 });
      }
      if (event.max_attendees && event.current_attendees >= event.max_attendees) {
        return NextResponse.json({ error: "This event is fully booked." }, { status: 409 });
      }
      verifiedAmount = Math.round(Number(event.price) * 100);
    } else if (metadata.order_id) {
      // Merchandise: charge the order total stored in the database, never the client's figure.
      const { data: order, error: orderError } = await admin
        .from("orders")
        .select("total, status")
        .eq("id", metadata.order_id)
        .single();

      if (orderError || !order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      if (order.status !== "pending") {
        return NextResponse.json({ error: "This order has already been paid or closed" }, { status: 409 });
      }
      verifiedAmount = Math.round(Number(order.total) * 100);
    } else {
      // Only events and shop orders are charged here (membership uses registration-intent).
      return NextResponse.json({ error: "Nothing to charge." }, { status: 400 });
    }

    if (!verifiedAmount || verifiedAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const session = await getSessionUser(request);
    const sessionUserId = session?.user.id ?? "";
    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: verifiedAmount,
      currency: "kes",
      automatic_payment_methods: { enabled: true },
      receipt_email: customerEmail || undefined,
      metadata: {
        // Identity
        user_id: sessionUserId,
        payment_type: metadata.event_id ? "event" : "merchandise",
        // Event
        event_id: metadata.event_id || "",
        event_name: metadata.event_name || "",
        // Order (merchandise)
        order_id: metadata.order_id || "",
        // Attendee
        attendee_name: metadata.attendee_name || "",
        attendee_email: metadata.attendee_email || "",
        attendee_phone: metadata.attendee_phone || "",
        registration_type: sessionUserId ? "member" : "guest",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err: any) {
    console.error("Stripe create-intent error:", err);
    return NextResponse.json(
      { error: "We couldn't start the card payment. Please try again." },
      { status: 500 }
    );
  }
}