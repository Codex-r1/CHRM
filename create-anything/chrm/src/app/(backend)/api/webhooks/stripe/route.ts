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
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });
  }

  // Stripe requires the raw body for signature verification [citation:14]
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const metadata = paymentIntent.metadata;

        console.log("Payment succeeded:", paymentIntent.id);

        // Insert payment record (ignore duplicates via account_reference)
        await admin.from("payments").upsert(
          {
            user_id: metadata.user_id || null,
            payment_type: metadata.event_id ? "event" : "merchandise",
            amount: paymentIntent.amount / 100,
            status: "confirmed",
            description: metadata.event_name
              ? `Card payment for ${metadata.event_name}`
              : "Card payment",
            account_reference: paymentIntent.id,
            checkout_request_id: paymentIntent.id,
            phone_number: metadata.attendee_phone || null,
            confirmed_at: new Date().toISOString(),
            paid_at: new Date().toISOString(),
          },
          { onConflict: "account_reference" }
        );

        // Increment event attendance if applicable
        if (metadata.event_id) {
          const { data: eventRow } = await admin
            .from("events")
            .select("current_attendees")
            .eq("id", metadata.event_id)
            .single();

          if (eventRow) {
            await admin
              .from("events")
              .update({ current_attendees: (eventRow.current_attendees || 0) + 1 })
              .eq("id", metadata.event_id);
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment failed:", paymentIntent.id);
        // Optionally record the failure in DB
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}