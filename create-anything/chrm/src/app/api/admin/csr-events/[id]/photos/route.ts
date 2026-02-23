//admin/api/admin/csr-events/[id]/photos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await supabaseAdmin()
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return null;
  return user;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { photos } = body;

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return NextResponse.json(
        { error: 'Photos array is required' },
        { status: 400 }
      );
    }

    // Add csr_event_id to each photo
    const photosToInsert = photos.map(photo => ({
      csr_event_id: params.id,
      image_url: photo.image_url,
      caption: photo.caption || null,
      display_order: photo.display_order || 0
    }));

    const { data: insertedPhotos, error } = await supabaseAdmin()
      .from('csr_event_photos')
      .insert(photosToInsert)
      .select();

    if (error) throw error;

    return NextResponse.json({ photos: insertedPhotos }, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading photos:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload photos' },
      { status: 500 }
    );
  }
}