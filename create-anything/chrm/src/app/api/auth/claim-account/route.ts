import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase/admin'
import { sendEmail } from '../../../lib/email/service'

export async function POST(request: NextRequest) {
  try {
    const { membership_number, email } = await request.json();

    if (!membership_number || !email) {
      return NextResponse.json(
        { error: 'Membership number and email are required' },
        { status: 400 }
      );
    }

    console.log('Claim request:', { membership_number, email });
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('membership_number', membership_number.toUpperCase().trim())
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'No account found. Please check your membership number and email, or contact admin.' },
        { status: 404 }
      );
    }

    console.log('✅ Profile found:', profile.full_name);

    // Create auth user (they don't have one yet)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: profile.email,
      email_confirm: true,
      user_metadata: {
        full_name: profile.full_name,
        phone: profile.phone_number,
        membership_number: profile.membership_number,
        role: profile.role
      }
    });

    if (authError) {
      // Check if user already exists
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Account already claimed. Please use the login page.' },
          { status: 400 }
        );
      }
      throw authError;
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Update profile with auth user ID
    await supabaseAdmin
      .from('profiles')
      .update({ 
        id: authData.user.id, // Link profile to auth user
        status: 'active',
        needs_password_setup: false
      })
      .eq('membership_number', profile.membership_number);

    // Generate password setup link
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: profile.email,
    });

    if (resetError || !resetData.properties?.action_link) {
      throw new Error('Failed to generate password setup link');
    }

    // Send email
    await sendEmail({
      to: profile.email,
      type: 'password_reset',
      data: {
        name: profile.full_name,
        reset_url: resetData.properties.action_link,
        membership_number: profile.membership_number
      }
    });

    console.log('✅ Password setup email sent');

    return NextResponse.json({
      success: true,
      message: 'Password setup link sent to your email'
    });

  } catch (error: any) {
    console.error('❌ Claim error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}