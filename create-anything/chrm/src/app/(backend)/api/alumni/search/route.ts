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

    const search = (respectOptOut: boolean) => {
      let q = supabaseAdmin()
        .from("profiles")
        .select("id, full_name, graduation_year, course, country, bio, linkedin_url")
        .eq("status", "active")
        .eq("is_active", true)
        .order("full_name", { ascending: true });
      // Members who chose "Hide me from the directory" are never returned.
      if (respectOptOut) q = q.eq("show_in_directory", true);
      if (query) q = q.ilike("full_name", `%${query}%`);
      if (year) q = q.eq("graduation_year", year);
      return q.limit(50);
    };

    let { data: alumni, error } = await search(true);
    // Before migration 002 adds show_in_directory nobody can have opted out yet.
    if (error?.code === "42703") ({ data: alumni, error } = await search(false));
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
