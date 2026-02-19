import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getBearerToken(req: Request) {
  const h = req.headers.get("authorization") || "";
  return h.toLowerCase().startsWith("bearer ") ? h.slice(7) : null;
}

function supabaseForToken(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );
}

export async function GET(req: Request) {
  const token = getBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });
  }

  const supabase = supabaseForToken(token);

  // Optional: explicit role check (your RLS will also enforce)
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes?.user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const role = (userRes.user.app_metadata as any)?.role ?? (userRes.user.user_metadata as any)?.role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status"); // optional filter
  const q = url.searchParams.get("q"); // optional search

  let query = supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  if (q && q.trim()) {
    const s = q.trim();
    // OR search across fields
    query = query.or(
      `name.ilike.%${s}%,email.ilike.%${s}%,subject.ilike.%${s}%,message.ilike.%${s}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    // Most likely RLS denial if role claim not present in JWT
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json({ messages: data || [] });
}
