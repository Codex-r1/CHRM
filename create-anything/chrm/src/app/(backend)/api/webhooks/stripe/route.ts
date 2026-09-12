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
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("Missing stripe-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("Webhook received:", event.type, event.id);

  const admin = supabaseAdmin();

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const metadata = paymentIntent.metadata;

        console.log("Payment succeeded:", paymentIntent.id);
        console.log("Metadata:", JSON.stringify(metadata));

        const paymentType =
          metadata.payment_type ||
          (metadata.event_id ? "event" : "merchandise");

        // ✅ Column names now match your actual schema:
        //    phone (not phone_number)
        //    + metadata jsonb column populated
        const record = {
          user_id: metadata.user_id || null,
          payment_type: paymentType,
          amount: paymentIntent.amount / 100,
          status: "confirmed",
          description: metadata.event_name
            ? `Card payment for ${metadata.event_name}`
            : paymentType === "merchandise"
              ? "Card payment for merchandise order"
              : "Card payment",
          account_reference: paymentIntent.id,
          checkout_request_id: paymentIntent.id,
          merchant_request_id: null,
          receipt_number: paymentIntent.latest_charge as string | null,
          phone: metadata.attendee_phone || null,       // ← was phone_number
          paid_at: new Date().toISOString(),
          confirmed_at: new Date().toISOString(),
          metadata: {
            // Preserve full Stripe metadata for audit trail
            stripe_metadata: metadata,
            order_id: metadata.order_id || null,
            event_id: metadata.event_id || null,
          },
        };

        console.log("Inserting payment record:", JSON.stringify(record));

        const { data: inserted, error: insertError } = await admin
          .from("payments")
          .insert(record)
          .select()
          .single();

        if (insertError) {
          console.error("Supabase insert FAILED:", JSON.stringify(insertError));
          // Return 500 so Stripe retries and the error surfaces in the dashboard
          return NextResponse.json(
            { error: "DB insert failed", details: insertError.message, code: insertError.code },
            { status: 500 }
          );
        }

        console.log("Payment row inserted:", inserted.id);

        // Increment event attendance if applicable
        if (metadata.event_id) {
          const { data: eventRow, error: fetchErr } = await admin
            .from("events")
            .select("current_attendees")
            .eq("id", metadata.event_id)
            .single();

          if (fetchErr) {
            console.error("Failed to fetch event:", fetchErr.message);
          } else if (eventRow) {
            const { error: updateErr } = await admin
              .from("events")
              .update({ current_attendees: (eventRow.current_attendees || 0) + 1 })
              .eq("id", metadata.event_id);

            if (updateErr) {
              console.error("Failed to increment attendees:", updateErr.message);
            } else {
              console.log("Incremented attendees for event:", metadata.event_id);
            }
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment failed:", paymentIntent.id, paymentIntent.last_payment_error?.message);
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