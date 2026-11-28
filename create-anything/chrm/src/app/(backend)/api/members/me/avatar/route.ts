// app/api/members/me/avatar/route.ts
// Upload (POST, multipart "file") or remove (DELETE) the signed-in member's photo.
// Files are stored under avatars/<user id>/ by the server, after type and size checks.
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/app/(backend)/lib/supabase/admin";
import { getSessionUser } from "@/app/(backend)/lib/auth/session";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp" };

/** Removes every stored photo for this member (there is only ever meant to be one). */
async function clearStoredAvatars(userId: string) {
  const storage = supabaseAdmin().storage.from("avatars");
  const { data } = await storage.list(userId);
  if (data?.length) await storage.remove(data.map((f) => `${userId}/${f.name}`));
}

export async function POST(request: Request) {
  const session = await getSessionUser(request);
  if (!session) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob)) return NextResponse.json({ error: "Please choose a photo." }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Please choose a JPG, PNG, GIF or WebP image." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Photos must be smaller than 5MB." }, { status: 400 });

  const userId = session.user.id;
  const admin = supabaseAdmin();
  await clearStoredAvatars(userId);

  const path = `${userId}/${randomUUID()}.${ext}`;
  const { error: uploadError } = await admin.storage.from("avatars").upload(path, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) {
    console.error("Avatar upload failed:", uploadError);
    return NextResponse.json({ error: "Your photo couldn't be uploaded. Please try a different image." }, { status: 500 });
  }

  const url = admin.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  await admin.from("profiles").update({ avatar_url: url, updated_at: new Date().toISOString() }).eq("id", userId);
  return NextResponse.json({ avatar_url: url });
}

export async function DELETE(request: Request) {
  const session = await getSessionUser(request);
  if (!session) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  await clearStoredAvatars(session.user.id);
  await supabaseAdmin().from("profiles").update({ avatar_url: null, updated_at: new Date().toISOString() }).eq("id", session.user.id);
  return NextResponse.json({ success: true });
}
