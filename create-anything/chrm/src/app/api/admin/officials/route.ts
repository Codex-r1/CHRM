import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    let query = supabaseAdmin()
      .from('officials')
      .select('*')
      .order('display_order', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: officials, error } = await query;

    if (error) throw error;

    return NextResponse.json({ officials });
  } catch (error) {
    console.error('Error fetching officials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch officials' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, position, image_url, display_order, is_active } = body;

    if (!name || !position || !image_url) {
      return NextResponse.json(
        { error: 'Name, position, and image_url are required' },
        { status: 400 }
      );
    }

    const { data: official, error } = await supabaseAdmin()
      .from('officials')
      .insert({
        name,
        position,
        image_url,
        display_order: display_order || 0,
        is_active: is_active !== undefined ? is_active : true
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ official }, { status: 201 });
  } catch (error) {
    console.error('Error creating official:', error);
    return NextResponse.json(
      { error: 'Failed to create official' },
      { status: 500 }
    );
  }
}