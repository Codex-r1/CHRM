// app/api/members/me/route.ts
// The signed-in member's own profile. Reads and writes go through the server so the
// browser never writes to the profiles table directly, and only these fields can change.
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/(backend)/lib/supabase/admin";
import { getSessionUser } from "@/app/(backend)/lib/auth/session";

export const dynamic = "force-dynamic";

const PROFILE_FIELDS =
  "id, email, full_name, phone_number, graduation_year, course, country, county, avatar_url, membership_number, status, show_in_directory";

const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export async function GET(request: Request) {
  const session = await getSessionUser(request);
  if (!session) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const admin = supabaseAdmin();
  let { data, error } = await admin.from("profiles").select(PROFILE_FIELDS).eq("id", session.user.id).maybeSingle();
  // Before migration 002 runs, show_in_directory doesn't exist yet: fall back and treat everyone as listed.
  if (error?.code === "42703") {
    ({ data, error } = await admin.from("profiles").select(PROFILE_FIELDS.replace(", show_in_directory", "")).eq("id", session.user.id).maybeSingle() as any);
    if (data) (data as any).show_in_directory = true;
  }
  if (error || !data) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  return NextResponse.json({ profile: data });
}

export async function PATCH(request: Request) {
  const session = await getSessionUser(request);
  if (!session) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const updates: Record<string, unknown> = {};

  if ("full_name" in body) {
    const name = text(body.full_name, 120);
    if (!name) return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    updates.full_name = name;
  }
  if ("phone_number" in body) {
    const phone = text(body.phone_number, 20).replace(/[\s()-]/g, "");
    if (!/^(\+?\d{9,15}|0\d{9})$/.test(phone)) return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
    updates.phone_number = phone;
  }
  if ("graduation_year" in body) {
    const year = Number(body.graduation_year);
    if (!Number.isInteger(year) || year < 1931 || year > new Date().getFullYear() + 1) {
      return NextResponse.json({ error: "Please choose a valid graduation year." }, { status: 400 });
    }
    updates.graduation_year = year;
  }
  if ("course" in body) updates.course = text(body.course, 120) || null;
  if ("country" in body) {
    const country = text(body.country, 80);
    if (!country) return NextResponse.json({ error: "Please choose your country of residence." }, { status: 400 });
    updates.country = country;
    updates.county = country === "Kenya" ? text(body.county, 60) || null : null;
  }
  if ("show_in_directory" in body) {
    if (typeof body.show_in_directory !== "boolean") return NextResponse.json({ error: "Invalid directory setting." }, { status: 400 });
    updates.show_in_directory = body.show_in_directory;
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  updates.updated_at = new Date().toISOString();

  const { error } = await supabaseAdmin().from("profiles").update(updates).eq("id", session.user.id);
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "This phone number is already registered to another member." }, { status: 409 });
    if (error.code === "42703") return NextResponse.json({ error: "The directory setting isn't available yet. Please try again later." }, { status: 503 });
    console.error("Profile update failed:", error);
    return NextResponse.json({ error: "Your profile couldn't be saved. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
