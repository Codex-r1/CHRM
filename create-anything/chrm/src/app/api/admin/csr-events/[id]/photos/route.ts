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

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return null;
  return user;
}

// POST add photos to CSR event
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
    const { photos } = body; // Array of { image_url, caption, display_order }
    const { id: eventId } = params;

    if (!photos || !Array.isArray(photos)) {
      return NextResponse.json(
        { error: 'Photos array is required' },
        { status: 400 }
      );
    }

    const photosToInsert = photos.map((photo: any) => ({
      csr_event_id: eventId,
      image_url: photo.image_url,
      caption: photo.caption || null,
      display_order: photo.display_order || 0,
      uploaded_by: user.id
    }));

    const { data, error } = await supabaseAdmin
      .from('csr_event_photos')
      .insert(photosToInsert)
      .select();

    if (error) throw error;

    return NextResponse.json({ photos: data }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding photos:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add photos' },
      { status: 500 }
    );
  }
}

// DELETE photo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('photoId');

    if (!photoId) {
      return NextResponse.json(
        { error: 'Photo ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('csr_event_photos')
      .delete()
      .eq('id', photoId);

    if (error) throw error;

    return NextResponse.json({ message: 'Photo deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete photo' },
      { status: 500 }
    );
  }
}