//app/api/events/upcoming/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase/admin'

export async function GET() {
  try {
    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('is_active', true)
      .in('status', ['upcoming', 'ongoing'])
      .order('event_date', { ascending: true })

    if (error) {
      console.error('Events error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(events || [])
  } catch (error) {
    console.error('Events API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}