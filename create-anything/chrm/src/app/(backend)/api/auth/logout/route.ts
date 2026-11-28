// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { clearSessionCookies } from "@/app/(backend)/lib/auth/session";
import { supabaseAdmin } from "@/app/(backend)/lib/supabase/admin";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // Revoke the refresh token server-side too, so a copied cookie stops working.
    const token = cookies().get("sb-access-token")?.value;
    if (token) await supabaseAdmin().auth.admin.signOut(token).catch(() => undefined);
    clearSessionCookies();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    clearSessionCookies();
    return NextResponse.json({ success: true });
  }
}
