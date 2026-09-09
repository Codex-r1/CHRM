// app/api/auth/session/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/app/(backend)/lib/supabase/admin";

export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionUserId = cookieStore.get("session_user_id");

    if (!sessionUserId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error } = await supabaseAdmin()
      .from("profiles")
      .select("id, full_name, email, role, membership_number")
      .eq("id", sessionUserId.value)
      .maybeSingle();

    if (error || !profile) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        membership_number: profile.membership_number,
      }
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}