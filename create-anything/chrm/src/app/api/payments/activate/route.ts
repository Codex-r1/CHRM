import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

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

    const formattedPhone = phone.startsWith('0') ? `254${phone.slice(1)}` : phone;

    if (paymentType === 'registration') {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (existingProfile) {
        // User exists in profiles - update their membership status
        console.log('Updating existing profile:', existingProfile.id);
        
        // Update profile status to active
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
          .single();

        const startDate = new Date();
        const expiryDate = new Date();
        expiryDate.setFullYear(startDate.getFullYear() + 1);

        if (existingMembership) {
          // Update existing active membership
          await supabase
            .from('memberships')
            .update({
              expiry_date: expiryDate.toISOString().split('T')[0],
              payment_id: payment.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingMembership.id);
        } else {
          // Create new membership
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
        console.log('Creating new user for email:', email);
        
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(email);
        
        let userId: string;

        if (authError || !authUser?.user) {
          // Create new auth user
          const { data: newAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
            email,
            password: password || Math.random().toString(36).slice(-8), // Generate random password if not provided
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

          userId = newAuthUser.user.id;
        } else {
          userId = authUser.user.id;
        }

        // 5. CREATE PROFILE FOR THE USER
        // Generate membership number using the trigger (will auto-generate)
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
            registration_source: 'online'
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

        // 6. CREATE MEMBERSHIP
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
          // Continue anyway, as we can fix this later
        }

        // 7. UPDATE PAYMENT WITH USER_ID
        await supabase
          .from('payments')
          .update({
            user_id: userId,
            status: 'confirmed',
            confirmed_at: new Date().toISOString()
          })
          .eq('id', payment.id);

        // Get the profile again to get the auto-generated membership number
        const { data: finalProfile } = await supabase
          .from('profiles')
          .select('membership_number')
          .eq('id', userId)
          .single();

        return NextResponse.json({
          success: true,
          message: 'Registration completed successfully',
          membership_number: finalProfile?.membership_number,
          user_id: userId,
          action: 'new_user_created'
        });
      }

    } else if (paymentType === 'renewal') {
      // 8. RENEW EXISTING MEMBERSHIP
      console.log('Processing renewal for:', email);
      
      // Find user by email or phone
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

      // Update profile status to active
      await supabase
        .from('profiles')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id);

      // Update or create membership
      const { data: existingMembership } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('is_active', true)
        .single();

      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setFullYear(startDate.getFullYear() + 1);

      if (existingMembership) {
        // Update existing membership
        await supabase
          .from('memberships')
          .update({
            expiry_date: expiryDate.toISOString().split('T')[0],
            payment_id: payment.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMembership.id);
      } else {
        // Create new membership
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

      // Update payment
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