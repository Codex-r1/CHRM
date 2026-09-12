// app/api/auth/session/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/(backend)/lib/supabase/admin";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get("session_user_id")?.value;
    const accessToken = cookieStore.get("sb-access-token")?.value;

    if (!userId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin()
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: userId,
        email: profile.email,
        full_name: profile.full_name,
        membership_number: profile.membership_number,
        role: profile.role,
      },
      // ← ADD: return the token so the dashboard can pick it up
      access_token: accessToken || null,
    });
  } catch (err) {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}