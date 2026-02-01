import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const membershipNumber = searchParams.get('membership_number')
    const email = searchParams.get('email')

    if (!membershipNumber && !email) {
      return NextResponse.json(
        { error: 'Either membership_number or email is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('profiles')
      .select('*')

    if (membershipNumber) {
      query = query.eq('membership_number', membershipNumber)
    } else if (email) {
      query = query.eq('email', email)
    }

    const { data: users, error } = await query

    if (error) {
      throw error
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return user without sensitive info
    const user = users[0]
    const safeUser = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone_number: user.phone_number,
      membership_number: user.membership_number,
      role: user.role,
      status: user.status,
      graduation_year: user.graduation_year,
      course: user.course,
      county: user.county,
      avatar_url: user.avatar_url,
      created_at: user.created_at
    }

    return NextResponse.json({ user: safeUser })

  } catch (error: any) {
    console.error('User lookup error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to lookup user' },
      { status: 500 }
    )
  }
}