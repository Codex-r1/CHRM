import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';

// Helper to verify admin
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

// PATCH update CSR event
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { event_type, title, description, event_date, location, main_image_url, is_published } = body;

    const { data: event, error } = await supabaseAdmin()
      .from('csr_events')
      .update({
        event_type,
        title,
        description,
        event_date,
        location,
        main_image_url: main_image_url || null,
        is_published: is_published ?? true,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ event });
  } catch (error: any) {
    console.error('Error updating CSR event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update CSR event' },
      { status: 500 }
    );
  }
}

// DELETE CSR event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First delete all associated photos
    const { error: photosError } = await supabaseAdmin()
      .from('csr_event_photos')
      .delete()
      .eq('csr_event_id', params.id);

    if (photosError) {
      console.error('Error deleting photos:', photosError);
      // Continue even if photos deletion fails
    }

    // Then delete the event
    const { error } = await supabaseAdmin()
      .from('csr_events')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'CSR event deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting CSR event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete CSR event' },
      { status: 500 }
    );
  }
}