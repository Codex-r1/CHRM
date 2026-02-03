import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    console.log('API: Fetching event with ID:', id);

    // Use the database function to bypass RLS
    const { data, error } = await supabaseAdmin
      .rpc('get_event_by_id', { p_event_id: id });

    if (error) {
      console.error('Database function error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch event', details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Event not found or inactive' },
        { status: 404 }
      );
    }

    const event = data[0];
    console.log('Event found:', event.name);
    
    return NextResponse.json(event);
    
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}