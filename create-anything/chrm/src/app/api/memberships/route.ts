import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, payment_id, renewal_year } = body

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, status')
      .eq('id', user_id)
      .single()

    if (userError) {
      throw new Error('User not found')
    }

    // Get current membership or create new one
    const { data: existingMembership, error: membershipError } = await supabaseAdmin
      .from('memberships')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .maybeSingle()

    let membershipData
    const now = new Date()
    const expiryDate = new Date()
    expiryDate.setFullYear(expiryDate.getFullYear() + 1) // 1 year from now

    if (existingMembership) {
      // Update existing membership
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('memberships')
        .update({
          expiry_date: expiryDate.toISOString().split('T')[0],
          is_active: true,
          payment_id: payment_id,
          updated_at: now.toISOString()
        })
        .eq('id', existingMembership.id)
        .select()
        .single()

      if (updateError) throw updateError
      membershipData = updated
    } else {
      // Create new membership
      const { data: created, error: createError } = await supabaseAdmin
        .from('memberships')
        .insert({
          user_id: user_id,
          start_date: now.toISOString().split('T')[0],
          expiry_date: expiryDate.toISOString().split('T')[0],
          is_active: true,
          payment_id: payment_id
        })
        .select()
        .single()

      if (createError) throw createError
      membershipData = created
    }

    // Update user status to active
    await supabaseAdmin
      .from('profiles')
      .update({ 
        status: 'active',
        updated_at: now.toISOString()
      })
      .eq('id', user_id)

    return NextResponse.json({
      success: true,
      message: 'Membership renewed successfully',
      membership: membershipData
    })

  } catch (error: any) {
    console.error('Membership renewal error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to renew membership'
      },
      { status: 500 }
    )
  }
}