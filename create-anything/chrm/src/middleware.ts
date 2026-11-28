import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * First line of defence for the private pages: no session cookie, no page.
 * The real checks happen in the API routes, which verify the Supabase token and role
 * on every request, so a forged cookie still gets no data.
 */
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has("sb-access-token") || request.cookies.has("sb-refresh-token");
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/member/:path*"],
};
