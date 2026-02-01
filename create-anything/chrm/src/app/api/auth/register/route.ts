import { NextRequest, NextResponse } from 'next/server'
import { supabase} from '../../../lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      password,
      full_name,
      phone,
      graduation_year,
      course,
      county,
      membership_number
    } = body

    // Validate required fields
    if (!email || !password || !full_name || !phone) {
      return NextResponse.json(
        { error: 'Email, password, full name, and phone are required' },
        { status: 400 }
      )
    }

    // Validate phone
    const phoneRegex = /^(07\d{8}|7\d{8}|\+2547\d{8}|2547\d{8})$/
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Please enter a valid Kenyan phone number' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (checkError) {
      console.error('Check existing user error:', checkError)
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered. Please login instead.' },
        { status: 400 }
      )
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: {
          full_name,
          phone,
          graduation_year,
          course,
          county,
          membership_number,
          role: 'member'
        }
      }
    })

    if (authError) {
      console.error('Auth signup error:', authError)
      throw new Error(authError.message || 'Registration failed')
    }

    if (!authData.user) {
      throw new Error('User creation failed')
    }

    // Create profile in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email.toLowerCase(),
        full_name,
        phone_number: phone,
        graduation_year: graduation_year ? parseInt(graduation_year) : null,
        course: course || null,
        county: county || null,
        membership_number: membership_number || null,
        role: 'member',
        status: 'pending', // Will be activated after payment
        registration_source: 'online'
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      
      // Try to delete the auth user if profile creation failed
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
      } catch (deleteError) {
        console.error('Failed to cleanup auth user:', deleteError)
      }
      
      throw new Error(profileError.message || 'Profile creation failed')
    }
    await new Promise(resolve => setTimeout(resolve, 500));

    // Fetch the updated profile to get the generated membership number
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('membership_number, status')
      .eq('id', authData.user.id)
      .single();

    if (fetchError) {
      console.warn('Failed to fetch membership number:', fetchError);
      // Don't throw - just log warning
    }
await new Promise(resolve => setTimeout(resolve, 100));

// Fetch the profile with membership number
const { data: profileWithNumber } = await supabase
  .from('profiles')
  .select('membership_number, status')
  .eq('id', authData.user.id)
  .single();

return NextResponse.json({
  success: true,
  message: 'Registration successful! Complete payment to activate your account.',
  user: {
    id: authData.user.id,
    email: authData.user.email,
    full_name,
    phone,
    status: 'pending',
    membership_number: profileWithNumber?.membership_number || null // ← CRITICAL!
  }
});

  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Registration failed'
      },
      { status: 500 }
    )
  }
}