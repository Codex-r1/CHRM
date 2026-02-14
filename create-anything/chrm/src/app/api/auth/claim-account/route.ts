import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { sendEmail } from '../../../lib/email/service';

// Inline membership calculation function
function calculateMembershipDates(registrationDate: string | Date) {
  const regDate = new Date(registrationDate);
  const regMonth = regDate.getMonth(); // 0-11
  const regYear = regDate.getFullYear();
  
  const startDate = new Date(regDate);
  startDate.setHours(0, 0, 0, 0);
  const hasWaiver = regMonth >= 9; 
  
  let expiryDate: Date;
  if (hasWaiver) {
    // October-December: Expires December 31st of NEXT year
    expiryDate = new Date(regYear + 1, 11, 31);
  } else {
    // January-September: Expires December 31st of SAME year
    expiryDate = new Date(regYear, 11, 31);
  }
  
  expiryDate.setHours(23, 59, 59, 999);
  
  const today = new Date();
  const isActive = expiryDate >= today;
  
  return {
    start_date: formatDate(startDate),
    expiry_date: formatDate(expiryDate),
    is_active: isActive,
    has_waiver: hasWaiver
  };
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
      county,
      registration_date 
    } = body;

    // Validate required fields
    if (!membership_number || !email || !full_name || !phone || !password || !registration_date) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    console.log('Claim account request:', { membership_number, email, registration_date });

    // Step 1: Check if membership number already has an auth account
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

    // Step 2: If profile exists with this membership number
    if (existingProfile) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(existingProfile.id);
      
      if (authUser && authUser.user) {
        return NextResponse.json(
          { error: 'This membership number is already claimed. Please use the login page.' },
          { status: 400 }
        );
      }

      console.log('Found profile without auth user - will link to new auth user');
    }

    // Step 3: Calculate membership dates FIRST
    const membershipDates = calculateMembershipDates(registration_date);
    
    console.log('Membership dates calculated:', {
      registration_date,
      start_date: membershipDates.start_date,
      expiry_date: membershipDates.expiry_date,
      has_waiver: membershipDates.has_waiver,
      is_active: membershipDates.is_active
    });

    // Step 4: Create the auth user with the provided password
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
    console.log('Auth user created:', userId);

    // Step 5: Determine account status based on membership expiry
    const accountStatus: 'active' | 'expired' | 'inactive' | 'pending' = 
      membershipDates.is_active ? 'active' : 'expired';

    // Step 6: Create or update the profile with the EXISTING membership number
    const profileData = {
      id: userId,
      email: email.toLowerCase().trim(),
      full_name: full_name,
      phone_number: phone,
      graduation_year: graduation_year ? parseInt(graduation_year) : null,
      course: course || null,
      county: county || null,
      membership_number: membership_number.toUpperCase().trim(), // ← EXISTING number
      role: 'member' as 'member' | 'admin',
      status: accountStatus,
      registration_source: 'manual' as 'online' | 'manual',
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

    // Step 7: Create membership with December 31st expiry
    const { error: membershipError } = await supabaseAdmin
      .from('memberships')
      .insert({
        user_id: userId,
        start_date: membershipDates.start_date,
        expiry_date: membershipDates.expiry_date,
        is_active: membershipDates.is_active,
        payment_id: null // No payment record since they paid manually
      });

    if (membershipError) {
      console.error(' Membership creation failed:', membershipError);
      // Don't fail the request - membership can be added manually later
    } else {
      console.log('Membership created:', {
        start_date: membershipDates.start_date,
        expiry_date: membershipDates.expiry_date,
        is_active: membershipDates.is_active,
        has_waiver: membershipDates.has_waiver ? 'YES (Oct-Dec registration)' : 'NO'
      });
    }

    // Step 8: Send welcome email
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
      console.log(' Welcome email sent');
    } catch (emailError) {
      console.error(' Email sending failed:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user_id: userId,
      membership_number: membership_number.toUpperCase().trim(),
      membership: {
        start_date: membershipDates.start_date,
        expiry_date: membershipDates.expiry_date,
        is_active: membershipDates.is_active,
        has_waiver: membershipDates.has_waiver,
        expires_on: 'December 31st' // Always December 31st
      }
    });

  } catch (error: any) {
    console.error(' Claim account error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to create account'
      },
      { status: 500 }
    );
  }
}