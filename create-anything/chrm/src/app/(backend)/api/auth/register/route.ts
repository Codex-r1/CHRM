import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/(backend)/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const registrationData = await request.json();
    const { email, password, full_name, phone, graduation_year, course, country, registration_fee } = registrationData;

    if (!email || !password || !full_name || !phone) {
      return NextResponse.json(
        { error: "Email, password, full name, and phone number are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Check if user already exists
    const { data: existingUser } = await supabaseAdmin()
      .from("profiles")
      .select("id, status")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { code: "USER_EXISTS", error: "An account with this email already exists." },
        { status: 400 }
      );
    }

    // 2. Create Auth User (Require Email Confirmation)
    const { data: authData, error: authError } = await supabaseAdmin().auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: false, // Ensures confirmation email is sent by Supabase
      user_metadata: {
        full_name,
        phone,
        graduation_year,
        course,
        country,
      },
    });

    if (authError || !authData?.user) {
      return NextResponse.json(
        { error: authError?.message || "Failed to create user record." },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // 3. Create Pending Profile Record
    const { error: profileError } = await supabaseAdmin()
      .from("profiles")
      .insert({
        id: userId,
        email: cleanEmail,
        full_name,
        phone,
        role: "member",
        status: "pending_payment",
        is_active: false,
        graduation_year: graduation_year ? parseInt(graduation_year) : null,
        course: course || null,
        country: country || null,
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      return NextResponse.json(
        { error: "Failed to initialize profile: " + profileError.message },
        { status: 500 }
      );
    }

    // 4. Create Initial Pending Payment Record mapped to User ID
    const { data: payment, error: paymentError } = await supabaseAdmin()
      .from("payments")
      .insert({
        user_id: userId,
        payment_type: "registration",
        amount: registration_fee || 1500,
        status: "pending",
        metadata: {
          registration_data: {
            ...registrationData,
            user_id: userId,
          },
        },
      })
      .select("id")
      .single();

    if (paymentError) {
      console.error("Payment initialization error:", paymentError);
      return NextResponse.json(
        { error: "Failed to initialize payment record: " + paymentError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      userId,
      payment_id: payment.id,
      message: "Registration initiated. Please complete payment.",
    });
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}