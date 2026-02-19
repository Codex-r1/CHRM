import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data: official, error } = await supabaseAdmin()
      .from('officials')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !official) {
      return NextResponse.json(
        { error: 'Official not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ official });
  } catch (error) {
    console.error('Error fetching official:', error);
    return NextResponse.json(
      { error: 'Failed to fetch official' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, position, image_url, display_order, is_active } = body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (position !== undefined) updates.position = position;
    if (image_url !== undefined) updates.image_url = image_url;
    if (display_order !== undefined) updates.display_order = display_order;
    if (is_active !== undefined) updates.is_active = is_active;
    updates.updated_at = new Date().toISOString();

    const { data: official, error } = await supabaseAdmin()
      .from('officials')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ official });
  } catch (error) {
    console.error('Error updating official:', error);
    return NextResponse.json(
      { error: 'Failed to update official' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { error } = await supabaseAdmin()
      .from('officials')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting official:', error);
    return NextResponse.json(
      { error: 'Failed to delete official' },
      { status: 500 }
    );
  }
}