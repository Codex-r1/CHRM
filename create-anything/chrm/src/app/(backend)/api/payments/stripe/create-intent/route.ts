import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

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
    const body = await request.json();
    const {
      amount,                    // in smallest unit (cents)
      currency = "KES",          // Stripe supports KES [citation:16]
      metadata = {},
      customerEmail,
    } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Verify amount server-side for event payments
    const admin = supabaseAdmin();
    let verifiedAmount = amount;

    if (metadata.event_id) {
      const { data: event } = await admin
        .from("events")
        .select("price")
        .eq("id", metadata.event_id)
        .single();

      if (event) {
        verifiedAmount = Math.round(Number(event.price) * 100);
      }
    }

    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: verifiedAmount,
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      receipt_email: customerEmail || undefined,
      metadata: {
        event_id: metadata.event_id || "",
        event_name: metadata.event_name || "",
        user_id: metadata.user_id || "",
        attendee_name: metadata.attendee_name || "",
        attendee_email: metadata.attendee_email || "",
        attendee_phone: metadata.attendee_phone || "",
        registration_type: metadata.registration_type || "guest",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err: any) {
    console.error("Stripe create-intent error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create payment intent" },
      { status: 500 }
    );
  }
}