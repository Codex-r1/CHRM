// app/api/alumni/search/route.ts
// Member directory search. Signed-in, active members (and admins) only.
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/(backend)/lib/supabase/admin";
import { getSessionUser, isActiveMember } from "@/app/(backend)/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) return NextResponse.json({ error: "Please log in to use the directory." }, { status: 401 });
    if (!isActiveMember(session.user)) return NextResponse.json({ error: "The directory is for active members." }, { status: 403 });

    const { searchParams } = new URL(request.url);
    // Escape LIKE wildcards so a search for "%" can't match everyone.
    const query = (searchParams.get("query") || "").trim().slice(0, 60).replace(/[\\%_]/g, (c) => `\\${c}`);
    const yearParam = searchParams.get("year");
    const year = yearParam && /^\d{4}$/.test(yearParam) ? Number(yearParam) : null;

    let dbQuery = supabaseAdmin()
      .from("profiles")
      .select("id, full_name, graduation_year, course, country, bio, linkedin_url")
      .eq("status", "active")
      .eq("is_active", true)
      .order("full_name", { ascending: true });

    if (query) dbQuery = dbQuery.ilike("full_name", `%${query}%`);
    if (year) dbQuery = dbQuery.eq("graduation_year", year);

    const { data: alumni, error } = await dbQuery.limit(50);
    if (error) {
      console.error("Directory search failed:", error);
      return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, alumni }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("Directory search failed:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
