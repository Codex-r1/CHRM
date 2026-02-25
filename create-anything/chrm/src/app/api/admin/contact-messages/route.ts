import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create supabase client for verifying user token
function supabaseForToken(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );
}

// Create admin supabase client (bypasses RLS)
function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key bypasses RLS
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function getBearerToken(req: Request) {
  const h = req.headers.get("authorization") || "";
  return h.toLowerCase().startsWith("bearer ") ? h.slice(7) : null;
}

export async function GET(req: Request) {
  const token = getBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });
  }

  // Step 1: Verify user with anon key
  const supabase = supabaseForToken(token);
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  
  if (userErr || !userRes?.user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  // Step 2: Check if user is admin
  const adminClient = supabaseAdmin();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", userRes.user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
  }

  // Step 3: Fetch messages using admin client (bypasses RLS)
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const q = url.searchParams.get("q");

  let query = adminClient
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  if (q && q.trim()) {
    const s = q.trim();
    query = query.or(
      `name.ilike.%${s}%,email.ilike.%${s}%,subject.ilike.%${s}%,message.ilike.%${s}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching contact messages:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ messages: data || [] });
}