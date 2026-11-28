// app/api/auth/refresh/route.ts
// Renews the session from the httpOnly refresh-token cookie and returns a fresh access token.
import { GET as getSession } from "../session/route";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return getSession(request);
}
