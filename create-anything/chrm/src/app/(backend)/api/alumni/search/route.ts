import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/(backend)/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const year = searchParams.get("year");

    let dbQuery = supabaseAdmin()
      .from("profiles")
      .select("id, full_name, graduation_year, course, country, bio, linkedin_url")
      .eq("status", "active")
      .eq("is_active", true);

    if (query) {
      dbQuery = dbQuery.ilike("full_name", `%${query}%`);
    }

    if (year) {
      dbQuery = dbQuery.eq("graduation_year", parseInt(year));
    }

    const { data: alumni, error } = await dbQuery.limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, alumni });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}