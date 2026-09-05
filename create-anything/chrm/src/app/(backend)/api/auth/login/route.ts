import { NextResponse } from "next/server";
import { supabase } from "./app/lib/supabase/client";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // 1. Authenticate credentials via Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return NextResponse.json(
        { error: error?.message || "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = data.user;

    // 2. Lookup role from profiles database table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Your account is not fully set up. Please contact support." },
        { status: 403 }
      );
    }

    // 3. Return session role for routing
    return NextResponse.json({
      success: true,
      role: profile.role,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "An unexpected internal error occurred." },
      { status: 500 }
    );
  }
}