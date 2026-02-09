import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { sendEmail } from '../../../lib/email/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      membership_number,
      email,
      full_name,
      phone,
      password,
      graduation_year,
      course,
      county
    } = body;

    // Validate required fields
    if (!membership_number || !email || !full_name || !phone || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    console.log(' Claim account request:', { membership_number, email });
    const { data: existingProfile, error: lookupError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .eq('membership_number', membership_number.toUpperCase().trim())
      .maybeSingle();

    if (lookupError) {
      console.error('Profile lookup error:', lookupError);
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      );
    }
    if (existingProfile) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(existingProfile.id);
      
      if (authUser && authUser.user) {
        return NextResponse.json(
          { error: 'This membership number is already claimed. Please use the login page.' },
          { status: 400 }
        );
      }
      console.log(' Found profile without auth user - will link to new auth user');
    }

    // Step 3: Create the auth user with the provided password
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name,
        phone: phone,
        membership_number: membership_number.toUpperCase().trim(),
        role: 'member'
      }
    });

    if (authError) {
      console.error('Auth user creation failed:', authError);
      
      if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please use the login page.' },
          { status: 400 }
        );
      }
      
      throw authError;
    }

    const userId = authData.user.id;
    console.log(' Auth user created:', userId);
    const profileData = {
      id: userId,
      email: email.toLowerCase().trim(),
      full_name: full_name,
      phone_number: phone,
      graduation_year: graduation_year ? parseInt(graduation_year) : null,
      course: course || null,
      county: county || null,
      membership_number: membership_number.toUpperCase().trim(), // ← EXISTING number
      role: 'member' as const,
      status: 'active' as const,
      registration_source: 'manual' as const,
      needs_password_setup: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Use upsert to handle both create and update scenarios
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profileData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });

    if (profileError) {
      console.error('Profile creation failed:', profileError);
      
      // Clean up the auth user if profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(userId);
      
      throw new Error('Failed to create profile: ' + profileError.message);
    }

    console.log('Profile created with membership number:', membership_number);

    // Step 5: Create an active membership (they already paid)
    const { error: membershipError } = await supabaseAdmin
      .from('memberships')
      .insert({
        user_id: userId,
        start_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        is_active: true,
        payment_id: null // No payment record since they paid manually
      });

    if (membershipError) {
      console.error(' Membership creation failed:', membershipError);
      // Don't fail the request - membership can be added manually later
    } else {
      console.log('Membership created');
    }

    // Step 6: Send welcome email
    try {
      await sendEmail({
        to: email,
        type: 'welcome',
        data: {
          name: full_name,
          membership_number: membership_number.toUpperCase().trim(),
          email: email
        }
      });
      console.log('Welcome email sent');
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user_id: userId,
      membership_number: membership_number.toUpperCase().trim()
    });

  } catch (error: any) {
    console.error('Claim account error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to create account'
      },
      { status: 500 }
    );
  }
}