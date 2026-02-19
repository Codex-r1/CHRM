import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase/admin';

export async function GET() {
  try {
    const { data: officials, error } = await supabaseAdmin()
      .from('officials')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

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