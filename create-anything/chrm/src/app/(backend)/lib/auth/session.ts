// lib/auth/session.ts
// Server-side identity for API routes. The caller is identified by a Supabase access
// token (Authorization: Bearer …, or the httpOnly sb-access-token cookie set at login).
// When the cookie token has expired, the httpOnly refresh-token cookie renews it.
// Never trust a user id sent in a request body: use the id returned here.
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/app/(backend)/lib/supabase/admin";

export interface SessionUser {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  membership_number: string | null;
  status: string | null;
  is_active: boolean | null;
}

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setSessionCookies(session: { access_token: string; refresh_token: string }, userId: string) {
  const store = cookies();
  store.set("sb-access-token", session.access_token, { ...COOKIE_BASE, maxAge: 60 * 60 * 24 * 7 });
  store.set("sb-refresh-token", session.refresh_token, { ...COOKIE_BASE, maxAge: 60 * 60 * 24 * 30 });
  store.set("session_user_id", userId, { ...COOKIE_BASE, maxAge: 60 * 60 * 24 * 7 });
}

export function clearSessionCookies() {
  const store = cookies();
  for (const name of ["session_user_id", "sb-access-token", "sb-refresh-token"]) store.delete(name);
}

/** Resolves the signed-in caller, or null. Also returns a renewed access token when one was issued. */
export async function getSessionUser(
  request: Request
): Promise<{ user: SessionUser; accessToken: string } | null> {
  const admin = supabaseAdmin();
  const header = request.headers.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const store = cookies();
  const cookieToken = store.get("sb-access-token")?.value || "";

  let accessToken = "";
  let authUserId = "";

  for (const candidate of [bearer, cookieToken]) {
    if (!candidate) continue;
    const { data, error } = await admin.auth.getUser(candidate);
    if (!error && data.user) {
      accessToken = candidate;
      authUserId = data.user.id;
      break;
    }
  }

  if (!authUserId) {
    const refreshToken = store.get("sb-refresh-token")?.value;
    if (!refreshToken) return null;
    const { data, error } = await admin.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session || !data.user) {
      clearSessionCookies();
      return null;
    }
    setSessionCookies(data.session, data.user.id);
    accessToken = data.session.access_token;
    authUserId = data.user.id;
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, role, full_name, membership_number, status, is_active")
    .eq("id", authUserId)
    .maybeSingle();
  if (!profile) return null;

  return {
    accessToken,
    user: {
      id: profile.id,
      email: profile.email,
      role: profile.role || "member",
      full_name: profile.full_name ?? null,
      membership_number: profile.membership_number ?? null,
      status: profile.status ?? null,
      is_active: profile.is_active ?? null,
    },
  };
}

/** True for a member whose registration is complete (or an admin). */
export function isActiveMember(user: SessionUser) {
  return user.role === "admin" || (user.is_active !== false && user.status !== "pending_payment");
}
