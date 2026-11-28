// app/api/auth/session/route.ts
// Who is signed in, verified from the httpOnly Supabase token cookies (renewed if expired).
import { NextResponse } from "next/server";
import { getSessionUser } from "@/app/(backend)/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) return NextResponse.json({ user: null }, { status: 401, headers: { "Cache-Control": "no-store" } });
    const { user } = session;
    return NextResponse.json(
      {
        user: { id: user.id, email: user.email, full_name: user.full_name, membership_number: user.membership_number, role: user.role },
        access_token: session.accessToken,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("Session check failed:", err);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
