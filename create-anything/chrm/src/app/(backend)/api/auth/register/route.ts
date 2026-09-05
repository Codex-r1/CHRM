// app/api/auth/register/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// app/api/auth/register/route.ts - FIXED VERSION

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      full_name,
      phone,
      password,
      graduation_year,
      course,
      country,
      registration_fee,
    } = body;

    // 1. Validate input
    if (!email || !full_name || !phone || !password || !graduation_year || !country) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 2. Check if user already exists (in profiles, not auth)
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists. Please login.' },
        { status: 400 }
      );
    }

    // 3. Check if user already exists in auth (just in case)
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const authUserExists = authUsers?.users?.some(u => u.email === email.toLowerCase());
    
    if (authUserExists) {
      return NextResponse.json(
        { error: 'Email already registered. Please login.' },
        { status: 400 }
      );
    }

    // 4. Store registration data temporarily (DO NOT CREATE USER YET!)
    const registrationData = {
      email: email.toLowerCase(),
      full_name: full_name,
      phone: phone,
      graduation_year: parseInt(graduation_year),
      course: course || '',
      country: country || 'Kenya',
      password: password,
    };

    // 5. Create a temporary payment record with registration data
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: null, // ← NO USER YET!
        payment_type: 'registration',
        amount: registration_fee || 1000,
        status: 'pending',
        metadata: {
          registration_data: registrationData,
          graduation_year: parseInt(graduation_year),
          course: course || '',
          country: country || 'Kenya',
          email: email.toLowerCase(),
          full_name: full_name,
          phone: phone,
          is_temp: true,
          created_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment creation error:', paymentError);
      return NextResponse.json(
        { error: `Failed to create payment record: ${paymentError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Temporary payment record created:', payment.id);

    // 6. Return payment ID for STK push
    return NextResponse.json({
      success: true,
      payment_id: payment.id,
      message: 'Payment record created. Complete payment to activate account.',
    });

  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}