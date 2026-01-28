import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    // Check admin auth
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get all payments with user info
    const { data: payments, error } = await supabaseAdmin
      .from('payments')
      .select(`
        *,
        profiles (
          full_name,
          email,
          membership_number
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(payments || [])

  } catch (error: any) {
    console.error('Admin payments fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}