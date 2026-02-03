import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

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
    } = body

    console.log('Registration attempt for:', email)

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

    // Check if email already exists in profiles table
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('email, id')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Email already registered. Please login instead.' },
        { status: 400 }
      )
    }

    // Check if phone already exists
    const { data: existingPhone } = await supabaseAdmin
      .from('profiles')
      .select('phone_number')
      .eq('phone_number', phone)
      .maybeSingle()

    if (existingPhone) {
      return NextResponse.json(
        { error: 'Phone number already registered.' },
        { status: 400 }
      )
    }
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('id, status, metadata')
      .eq('payment_type', 'registration')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingPayment?.metadata?.registration_data?.email === email.toLowerCase()) {
      // There's already a pending payment for this email
      return NextResponse.json({
        success: true,
        message: 'Registration already in progress. Please complete the payment.',
        payment_id: existingPayment.id,
        phone_number: phone,
        amount: 1
      })
    }

    console.log('Creating pending payment record with registration data...')

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        amount: 1, // Registration fee
        currency: 'KES',
        method: 'mpesa_stk',
        payment_type: 'registration',
        phone_number: phone,
        status: 'pending',
        description: `CHRMAA Registration - ${full_name}`,
        metadata: {
          // Store ALL registration data here - will be used after payment
          registration_data: {
            email: email.toLowerCase(),
            password, // Will be used to create auth user after payment
            full_name,
            phone,
            graduation_year,
            course,
            county
          }
        }
      })
      .select()
      .single()

    if (paymentError || !payment) {
      console.error('Payment record creation error:', paymentError)
      return NextResponse.json(
        { error: 'Failed to initiate registration. Please try again.' },
        { status: 500 }
      )
    }

    console.log('Payment record created successfully:', payment.id)
    return NextResponse.json({
      success: true,
      message: 'Registration initiated. Please complete payment to activate your account.',
      payment_id: payment.id,
      phone_number: phone,
      amount: 1
    })

  } catch (error: any) {
    console.error('Unexpected registration error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'An unexpected error occurred during registration',
        details: error.message
      },
      { status: 500 }
    )
  }
}