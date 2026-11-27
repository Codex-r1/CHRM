// lib/auth/requireAdmin.ts
// Shared guard for /api/admin/* routes: the request must carry a valid
// Supabase access token (Authorization: Bearer …) for a profile with role "admin".
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/(backend)/lib/supabase/admin";

/** Returns an error response to send back, or null when the caller is an admin. */
export async function requireAdmin(request: Request): Promise<NextResponse | null> {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const admin = supabaseAdmin();
    const { data: { user }, error } = await admin.auth.getUser(token);
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    return null;
  } catch (err) {
    console.error("requireAdmin failed:", err);
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }
}
