// app/api/auth/register/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    console.log('Registration attempt for:', email);

    // Validate input
    if (!email || !full_name || !phone || !password || !graduation_year || !country) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id, email, status, is_active')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingUser) {
      // If user exists but isn't active, they might have a pending payment
      if (!existingUser.is_active) {
        const { data: pendingPayment } = await supabase
          .from('payments')
          .select('id, status, checkout_request_id')
          .eq('user_id', existingUser.id)
          .maybeSingle();

        if (pendingPayment) {
          return NextResponse.json({
            error: 'Registration already started but not complete. Please complete your payment.',
            code: 'PENDING_PAYMENT',
            payment_id: pendingPayment.id,
          }, { status: 400 });
        }

        // Reactivate the user if they have an inactive profile
        await supabase
          .from('profiles')
          .update({ status: 'pending', updated_at: new Date().toISOString() })
          .eq('id', existingUser.id);
      }

      return NextResponse.json({
        error: 'User already exists. Please login instead.',
        code: 'USER_EXISTS',
      }, { status: 400 });
    }

    // Create a TEMPORARY payment record WITHOUT a user
    // Store all registration data in metadata
    const registrationData = {
      email: email.toLowerCase(),
      full_name: full_name,
      phone: phone,
      graduation_year: parseInt(graduation_year),
      course: course || '',
      country: country || 'Kenya',
      password: password,
    };

    console.log(' Creating temporary payment record...');

    // Create payment with NO user_id - we'll link it after payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: null, // ← No user yet!
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
          is_temp: true, // Flag to identify temporary payments
          created_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (paymentError) {
      console.error(' Payment creation error:', paymentError);
      return NextResponse.json(
        { error: `Failed to create payment record: ${paymentError.message}` },
        { status: 500 }
      );
    }

    console.log(' Temporary payment record created with ID:', payment.id);

    // Return payment ID for STK push
    return NextResponse.json({
      success: true,
      payment_id: payment.id,
      message: 'Payment record created. Complete payment to activate account.',
    });

  } catch (error) {
    console.error(' Registration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}