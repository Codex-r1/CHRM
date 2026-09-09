import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/(backend)/lib/supabase/admin";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Authenticate with Supabase
    const { data: authData, error: authError } = await supabaseAdmin().auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (authError || !authData.user) {
      if (authError?.message?.includes("Email not confirmed")) {
        return NextResponse.json(
          { error: "Your email address has not been confirmed yet. Please check your inbox for the confirmation link." },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: authError?.message || "Invalid email or password." },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    // 2. Verify Email Confirmation Status
    if (!authData.user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Please confirm your email address before logging in." },
        { status: 403 }
      );
    }

    // 3. Query Profile
    const { data: profile, error: profileError } = await supabaseAdmin()
      .from("profiles")
      .select("role, full_name, status, is_active, membership_number")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Your profile record was not found. Please contact support." },
        { status: 404 }
      );
    }

    // 4. Ensure Registration Payment is Completed
    if (profile.status === "pending_payment" || !profile.is_active) {
      return NextResponse.json(
        { error: "Your registration payment is pending. Please complete payment to activate your profile." },
        { status: 402 }
      );
    }

    // 5. Set session cookie
    const cookieStore = cookies();
    cookieStore.set("session_user_id", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    // 6. Return success with user data
    const userData = {
      id: userId,
      email: cleanEmail,
      full_name: profile.full_name,
      membership_number: profile.membership_number,
      role: profile.role || "member",
    };

    // Create response with proper headers
    const response = NextResponse.json({
      success: true,
      role: profile.role || "member",
      user: userData,
    });

    // Add additional headers to prevent caching issues
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    response.headers.set('Pragma', 'no-cache');

    return response;
  } catch (err: any) {
    console.error("Login route error:", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}