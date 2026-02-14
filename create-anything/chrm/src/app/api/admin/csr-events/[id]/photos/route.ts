// app/api/admin/csr-events/[id]/photos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/app/lib/supabase/admin';

export const runtime = 'nodejs'; 

type RouteContext = {
  params: { id: string };
};

function getAdminAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL');
  if (!serviceRoleKey) throw new Error('Missing env: SUPABASE_SERVICE_ROLE_KEY');

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;

  const authClient = getAdminAuthClient();

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(token);

  if (error || !user) return null;

  const { data: profile, error: profileError } = await supabaseAdmin()
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) return null;
  if (profile?.role !== 'admin') return null;

  return user;
}

// POST add photos to CSR event
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = context.params.id;

    const body = await request.json();
    const { photos } = body as {
      photos: Array<{ image_url: string; caption?: string; display_order?: number }>;
    };

    if (!photos || !Array.isArray(photos)) {
      return NextResponse.json({ error: 'Photos array is required' }, { status: 400 });
    }

    const photosToInsert = photos.map((photo) => ({
      csr_event_id: eventId,
      image_url: photo.image_url,
      caption: photo.caption ?? null,
      display_order: photo.display_order ?? 0,
      uploaded_by: user.id,
    }));

    const { data, error } = await supabaseAdmin()
      .from('csr_event_photos')
      .insert(photosToInsert)
      .select();

    if (error) throw error;

    return NextResponse.json({ photos: data }, { status: 201 });
  } catch (err: any) {
    console.error('Error adding photos:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to add photos' },
      { status: 500 }
    );
  }
}

// DELETE photo
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // event id exists but not needed for delete by photoId
    void context.params.id;

    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('photoId');

    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin()
      .from('csr_event_photos')
      .delete()
      .eq('id', photoId);

    if (error) throw error;

    return NextResponse.json({ message: 'Photo deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting photo:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to delete photo' },
      { status: 500 }
    );
  }
}
