export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// ─── Stripe Client ───────────────────────────────────────────────────────────
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY in environment variables");
  }
  return new Stripe(key, {
    typescript: true,
  });
}

// ─── Supabase Admin Client ───────────────────────────────────────────────────
function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// ─── POST /api/payments/card ─────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      amount: clientAmount,
      currency = "KES",
      customerEmail,
      cardDetails,
      metadata = {},
    } = body;

    // ─── 1. Validate input ─────────────────────────────────────────────────
    if (!cardDetails?.cardNumber || !cardDetails?.expiryDate || !cardDetails?.cvv) {
      return NextResponse.json(
        { success: false, error: "Missing required card details" },
        { status: 400 }
      );
    }

    if (!clientAmount || typeof clientAmount !== "number" || clientAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    const admin = supabaseAdmin();

    // ─── 2. Verify amount server-side (never trust client) ─────────────────
    let verifiedAmount = clientAmount;
    if (metadata.event_id) {
      const { data: event, error: eventError } = await admin
        .from("events")
        .select("price, name")
        .eq("id", metadata.event_id)
        .single();

      if (eventError || !event) {
        return NextResponse.json(
          { success: false, error: "Event not found" },
          { status: 404 }
        );
      }

      verifiedAmount = Number(event.price);
      if (verifiedAmount !== clientAmount) {
        console.warn("Amount mismatch — using DB value", {
          client: clientAmount,
          db: verifiedAmount,
        });
      }
    }

    // ─── 3. Parse card details ─────────────────────────────────────────────
    const cleanNumber = String(cardDetails.cardNumber).replace(/\s/g, "");
    const [expMonthStr, expYearStr] = String(cardDetails.expiryDate).split("/");
    const expMonth = parseInt(expMonthStr, 10);
    const expYear = 2000 + parseInt(expYearStr, 10);

    if (
      !cleanNumber ||
      !expMonth ||
      !expYear ||
      isNaN(expMonth) ||
      isNaN(expYear)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid card number or expiry" },
        { status: 400 }
      );
    }

    // ─── 4. Create Stripe Payment Method ───────────────────────────────────
    const stripe = getStripe();

    let paymentMethod: Stripe.PaymentMethod;
    try {
      paymentMethod = await stripe.paymentMethods.create({
        type: "card",
        card: {
          number: cleanNumber,
          exp_month: expMonth,
          exp_year: expYear,
          cvc: String(cardDetails.cvv),
        },
        billing_details: {
          name: cardDetails.cardholderName || undefined,
          email: customerEmail || undefined,
        },
      });
    } catch (stripeErr: any) {
      console.error("Stripe paymentMethod.create failed:", stripeErr.message);
      return NextResponse.json(
        {
          success: false,
          error:
            stripeErr?.raw?.message ||
            stripeErr?.message ||
            "Card was declined. Please check your details.",
        },
        { status: 402 }
      );
    }

    // ─── 5. Create + Confirm Payment Intent ────────────────────────────────
    // Stripe expects the smallest currency unit (cents for USD, "cents" for KES too)
    const amountInSmallestUnit = Math.round(verifiedAmount * 100);

    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountInSmallestUnit,
        currency: currency.toLowerCase(),
        payment_method: paymentMethod.id,
        confirm: true, // charge immediately
        description: metadata.event_name
          ? `Event registration: ${metadata.event_name}`
          : "Event registration",
        receipt_email: customerEmail || undefined,
        metadata: {
          event_id: metadata.event_id || "",
          event_name: metadata.event_name || "",
          attendee_name: metadata.attendee_name || "",
          attendee_email: metadata.attendee_email || "",
          attendee_phone: metadata.attendee_phone || "",
          membership_number: metadata.membership_number || "",
          is_member: String(metadata.is_member ?? false),
          registration_type: metadata.registration_type || "guest",
          payment_method: "card",
        },
        // Some regions require 3DS; if not needed for your test, this avoids redirects
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
      });
    } catch (intentErr: any) {
      console.error("Stripe paymentIntents.create failed:", intentErr.message);

      // Special case: card requires additional action (3D Secure)
      if (intentErr?.code === "authentication_required") {
        return NextResponse.json(
          {
            success: false,
            error:
              "This card requires additional authentication (3D Secure). Please try a different card.",
            code: "authentication_required",
          },
          { status: 402 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error:
            intentErr?.raw?.message ||
            intentErr?.message ||
            "Payment could not be completed.",
          code: intentErr?.code || "card_error",
        },
        { status: 402 }
      );
    }

    // ─── 6. Handle Payment Intent status ───────────────────────────────────
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        {
          success: false,
          error: `Payment status: ${paymentIntent.status}. Please try again.`,
          status: paymentIntent.status,
        },
        { status: 402 }
      );
    }

    // ─── 7. Record in Supabase payments table ──────────────────────────────
    const paymentRecord = {
      user_id: metadata.user_id || null,
      payment_type: "event",
      amount: verifiedAmount,
      status: "confirmed" as const,
      description: metadata.event_name
        ? `Card payment for ${metadata.event_name}`
        : "Card payment",
      account_reference: paymentIntent.id,
      phone_number: metadata.attendee_phone || null,
      checkout_request_id: paymentIntent.id,
      confirmed_at: new Date().toISOString(),
      paid_at: new Date().toISOString(),
    };

    const { data: insertedPayment, error: insertError } = await admin
      .from("payments")
      .insert(paymentRecord)
      .select()
      .single();

    if (insertError) {
      // Payment succeeded with Stripe but DB insert failed — log but don't fail the user
      console.error("Failed to insert payment record:", insertError);
    }

    // ─── 8. If event registration, increment attendee count ────────────────
    if (metadata.event_id) {
      try {
        // Increment current_attendees atomically
        const { data: currentEvent } = await admin
          .from("events")
          .select("current_attendees, max_attendees")
          .eq("id", metadata.event_id)
          .single();

        if (currentEvent) {
          const newCount = (currentEvent.current_attendees || 0) + 1;
          await admin
            .from("events")
            .update({ current_attendees: newCount })
            .eq("id", metadata.event_id);
        }
      } catch (countErr) {
        console.error("Failed to update attendee count:", countErr);
      }
    }

    // ─── 9. Return success ─────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      transactionId: paymentIntent.id,
      status: "COMPLETED",
      message: "Card payment processed successfully.",
      payment: insertedPayment || null,
      amount: verifiedAmount,
      currency,
    });
  } catch (error: any) {
    console.error("Card Payment Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process card payment.",
      },
      { status: 500 }
    );
  }
}