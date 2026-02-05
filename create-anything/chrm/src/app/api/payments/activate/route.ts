import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase/admin';

// Use the admin client that has proper permissions
const supabase = supabaseAdmin;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      checkoutRequestID,
      paymentType,
      phone,
      email,
      full_name,
      graduation_year,
      course,
      county,
      password
    } = body;

    console.log('Activation request:', { checkoutRequestID, paymentType, email });

    // 1. Find the payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('checkout_request_id', checkoutRequestID)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found:', paymentError);
      return NextResponse.json(
        { error: 'Payment not found', details: paymentError?.message },
        { status: 404 }
      );
    }

    // 2. Verify payment is confirmed
    if (payment.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Payment not yet confirmed', currentStatus: payment.status },
        { status: 400 }
      );
    }

    const formattedPhone = phone?.startsWith('0') ? `254${phone.slice(1)}` : phone;

    if (paymentType === 'registration') {
      // Check if user already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (existingProfile) {
        // User exists - update their membership status
        console.log('Updating existing profile:', existingProfile.id);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProfile.id);

        if (updateError) {
          console.error('Profile update error:', updateError);
          return NextResponse.json(
            { error: 'Failed to update profile', details: updateError.message },
            { status: 500 }
          );
        }

        // Create or update membership
        const { data: existingMembership } = await supabase
          .from('memberships')
          .select('*')
          .eq('user_id', existingProfile.id)
          .eq('is_active', true)
          .maybeSingle();

        const startDate = new Date();
        const expiryDate = new Date();
        expiryDate.setFullYear(startDate.getFullYear() + 1);

        if (existingMembership) {
          await supabase
            .from('memberships')
            .update({
              expiry_date: expiryDate.toISOString().split('T')[0],
              payment_id: payment.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingMembership.id);
        } else {
          await supabase
            .from('memberships')
            .insert({
              user_id: existingProfile.id,
              start_date: startDate.toISOString().split('T')[0],
              expiry_date: expiryDate.toISOString().split('T')[0],
              is_active: true,
              payment_id: payment.id
            });
        }

        // Update payment with user_id
        await supabase
          .from('payments')
          .update({
            user_id: existingProfile.id,
            status: 'confirmed',
            confirmed_at: new Date().toISOString()
          })
          .eq('id', payment.id);

        return NextResponse.json({
          success: true,
          message: 'Registration completed successfully',
          membership_number: existingProfile.membership_number,
          user_id: existingProfile.id,
          action: 'existing_profile_updated'
        });

      } else {
        // CREATE NEW USER
        console.log('Creating new user for email:', email);
        
        // Create new auth user directly (don't check if exists first)
        const { data: newAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
          email,
          password: password || Math.random().toString(36).slice(-8),
          email_confirm: true,
          user_metadata: {
            full_name,
            phone: formattedPhone
          }
        });

        if (createAuthError || !newAuthUser?.user) {
          console.error('Auth user creation error:', createAuthError);
          return NextResponse.json(
            { error: 'Failed to create user account', details: createAuthError?.message },
            { status: 500 }
          );
        }

        const userId = newAuthUser.user.id;
        console.log('Auth user created:', userId);

        // Generate membership number
        const { data: maxMembershipData } = await supabase
          .from('profiles')
          .select('membership_number')
          .order('membership_number', { ascending: false })
          .limit(1)
          .maybeSingle();

        let membershipNumber = '100196';
        if (maxMembershipData?.membership_number) {
          const lastNumber = parseInt(maxMembershipData.membership_number);
          if (!isNaN(lastNumber)) {
            membershipNumber = (lastNumber + 1).toString();
          }
        }

        // CREATE PROFILE
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email,
            full_name,
            phone_number: formattedPhone,
            graduation_year: graduation_year ? parseInt(graduation_year) : null,
            course: course || null,
            county: county || null,
            status: 'active',
            role: 'member',
            registration_source: 'online',
            membership_number: membershipNumber
          })
          .select()
          .single();

        if (profileError) {
          console.error('Profile creation error:', profileError);
          return NextResponse.json(
            { error: 'Failed to create profile', details: profileError.message },
            { status: 500 }
          );
        }

        // CREATE MEMBERSHIP
        const startDate = new Date();
        const expiryDate = new Date();
        expiryDate.setFullYear(startDate.getFullYear() + 1);

        const { error: membershipError } = await supabase
          .from('memberships')
          .insert({
            user_id: userId,
            start_date: startDate.toISOString().split('T')[0],
            expiry_date: expiryDate.toISOString().split('T')[0],
            is_active: true,
            payment_id: payment.id
          });

        if (membershipError) {
          console.error('Membership creation error:', membershipError);
        }

        // UPDATE PAYMENT WITH USER_ID
        await supabase
          .from('payments')
          .update({
            user_id: userId,
            status: 'confirmed',
            confirmed_at: new Date().toISOString()
          })
          .eq('id', payment.id);

        return NextResponse.json({
          success: true,
          message: 'Registration completed successfully',
          membership_number: membershipNumber,
          user_id: userId,
          action: 'new_user_created'
        });
      }

    } else if (paymentType === 'renewal') {
      // RENEW EXISTING MEMBERSHIP
      console.log('Processing renewal for:', email);
      
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .or(`email.eq.${email},phone_number.eq.${formattedPhone}`)
        .single();

      if (userError || !userProfile) {
        console.error('User not found for renewal:', userError);
        return NextResponse.json(
          { error: 'User not found for renewal', details: userError?.message },
          { status: 404 }
        );
      }

      await supabase
        .from('profiles')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id);

      const { data: existingMembership } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('is_active', true)
        .maybeSingle();

      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setFullYear(startDate.getFullYear() + 1);

      if (existingMembership) {
        await supabase
          .from('memberships')
          .update({
            expiry_date: expiryDate.toISOString().split('T')[0],
            payment_id: payment.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMembership.id);
      } else {
        await supabase
          .from('memberships')
          .insert({
            user_id: userProfile.id,
            start_date: startDate.toISOString().split('T')[0],
            expiry_date: expiryDate.toISOString().split('T')[0],
            is_active: true,
            payment_id: payment.id
          });
      }

      await supabase
        .from('payments')
        .update({
          user_id: userProfile.id,
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      return NextResponse.json({
        success: true,
        message: 'Membership renewed successfully',
        membership_number: userProfile.membership_number,
        user_id: userProfile.id,
        action: 'membership_renewed'
      });
    }

    return NextResponse.json(
      { error: 'Invalid payment type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Activation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}