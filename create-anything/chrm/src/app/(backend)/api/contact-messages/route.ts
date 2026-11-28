import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { createClient } from "@supabase/supabase-js";

function getSupabaseForToken(token?: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    token
      ? {
          global: {
            headers: { Authorization: `Bearer ${token}` },
          },
        }
      : undefined
  );
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7)
      : undefined;

    const supabase = getSupabaseForToken(token);

    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const phone = String(body?.phone ?? "").trim();
    const subject = String(body?.subject ?? "").trim();
    const message = String(body?.message ?? "").trim();

    if (name.length > 120 || email.length > 254 || phone.length > 30 || subject.length > 200 || message.length > 5000) {
      return NextResponse.json({ error: "Your message is too long." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    // Honeypot: the form has a hidden "website" field that people never fill in.
    if (String(body?.website ?? "").trim()) {
      return NextResponse.json({ success: true });
    }

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, subject, message" },
        { status: 400 }
      );
    }

    // If user is logged in, attach user_id
    let user_id: string | null = null;
    if (token) {
      const { data: userRes } = await supabase.auth.getUser();
      user_id = userRes?.user?.id ?? null;
    }

    const { data, error } = await supabase
      .from("contact_messages")
      .insert([
        {
          name,
          email,
          phone: phone || null,
          subject,
          message,
          user_id,
          // status defaults to 'unread' in DB
        },
      ])
      .select("id")
      .single();

        if (error) {
      console.error('contact_messages insert error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return NextResponse.json(
        { error: "We couldn't send your message. Please try again." },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, id: data?.id }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
