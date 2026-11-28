// lib/auth/requireAdmin.ts
// Shared guard for /api/admin/* routes: the caller must be signed in (Bearer token or the
// httpOnly session cookies) with a profile whose role is "admin".
import { NextResponse } from "next/server";
import { getSessionUser } from "@/app/(backend)/lib/auth/session";

/** Returns an error response to send back, or null when the caller is an admin. */
export async function requireAdmin(request: Request): Promise<NextResponse | null> {
  try {
    const session = await getSessionUser(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    return null;
  } catch (err) {
    console.error("requireAdmin failed:", err);
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }
}
