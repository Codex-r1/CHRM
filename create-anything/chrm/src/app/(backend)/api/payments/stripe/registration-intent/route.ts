// app/api/payments/stripe/registration-intent/route.ts
//
// Starts a card payment for a new membership registration.
// Mirrors the M-PESA flow: the registration details are stored on a pending
// `payments` row, and the account is only created by the Stripe webhook once
// the payment succeeds (see lib/registration/service.ts).
//
// The card itself is collected client-side by Stripe's Payment Element; no card
// data reaches this server. The amount is fixed server-side.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/app/(backend)/lib/supabase/admin";
import { REGISTRATION_FEE_KES } from "@/app/(backend)/lib/registration/fees";
import { hashRegistrationPassword } from "@/app/(backend)/lib/registration/password";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(key, { apiVersion: "2026-08-26.dahlia", typescript: true });
}

interface RegistrationInput {
  full_name?: string;
  email?: string;
  phone?: string;
  password?: string;
  graduation_year?: string;
  course?: string;
  country?: string;
}

export async function POST(request: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY is not set for this deployment");
      return NextResponse.json({ error: "Card payments are temporarily unavailable. Please pay with M-PESA or try again later.", code: "card_unavailable" }, { status: 503 });
    }
    const { registrationData } = (await request.json()) as { registrationData?: RegistrationInput };
    const data = registrationData ?? {};
    const email = data.email?.toLowerCase().trim();

    // 1. Validate
    if (!data.full_name?.trim() || !email || !data.password || !data.graduation_year || !data.country) {
      return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
    }
    if (data.password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const admin = supabaseAdmin();

    // 2. Refuse if the email is already registered
    const { data: existing } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "This email is already registered.", code: "account_exists" }, { status: 409 });
    }

    // 3. Create the PaymentIntent. Metadata deliberately excludes the password.
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(REGISTRATION_FEE_KES * 100),
      currency: "kes",
      automatic_payment_methods: { enabled: true },
      receipt_email: email,
      description: "Old Turians Society membership registration",
      metadata: {
        payment_type: "registration",
        attendee_name: data.full_name,
        attendee_email: email,
        attendee_phone: data.phone || "",
      },
    });

    // 4. Pending payment row carrying the registration details (same shape as the M-PESA flow)
    const { error: insertError } = await admin.from("payments").insert({
      user_id: null,
      amount: REGISTRATION_FEE_KES,
      payment_type: "registration",
      phone: data.phone || null,
      account_reference: paymentIntent.id,
      checkout_request_id: paymentIntent.id,
      description: "Membership registration (card)",
      status: "pending",
      metadata: {
        payment_method: "card",
        userEmail: email,
        userName: data.full_name,
        paymentType: "registration",
        registration_data: {
          email,
          full_name: data.full_name,
          phone: data.phone,
          password_hash: await hashRegistrationPassword(data.password),
          graduation_year: data.graduation_year,
          course: data.course,
          country: data.country,
        },
      },
    });

    if (insertError) {
      console.error("Failed to create pending registration payment:", insertError);
      await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => undefined);
      return NextResponse.json({ error: "Could not start registration. Please try again." }, { status: 500 });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: REGISTRATION_FEE_KES,
    });
  } catch (err) {
    console.error("Stripe registration-intent error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start card payment" },
      { status: 500 },
    );
  }
}
