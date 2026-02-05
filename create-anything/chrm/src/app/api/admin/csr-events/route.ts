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

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return null;
  return user;
}

// GET all CSR events
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: events, error } = await supabaseAdmin
      .from('csr_events')
      .select(`
        *,
        photos:csr_event_photos(*)
      `)
      .order('event_date', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ events: events || [] });
  } catch (error: any) {
    console.error('Error fetching CSR events:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch CSR events' },
      { status: 500 }
    );
  }
}

// POST create new CSR event
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { event_type, title, description, event_date, location, main_image_url, is_published } = body;

    if (!event_type || !title || !description || !event_date || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: event, error } = await supabaseAdmin
      .from('csr_events')
      .insert({
        event_type,
        title,
        description,
        event_date,
        location,
        main_image_url: main_image_url || null,
        is_published: is_published ?? true
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ event }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating CSR event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create CSR event' },
      { status: 500 }
    );
  }
}