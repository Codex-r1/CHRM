// lib/registration/service.ts
// Creates the member account after a registration payment is confirmed.
// Shared by the M-PESA callback and the Stripe webhook. Moved verbatim from
// api/mpesa/callback/route.ts (behaviour unchanged).
import { escapeHtml } from '@/app/(backend)/lib/security/html';
import { supabaseAdmin } from '@/app/(backend)/lib/supabase/admin';
import { sendEmail } from '@/app/(backend)/lib/email/service';

// Inline membership calculation function
export function calculateMembershipDates(registrationDate: string | Date) {
  const regDate = new Date(registrationDate);
  const regMonth = regDate.getMonth();
  const regYear = regDate.getFullYear();
  
  const startDate = new Date(regDate);
  startDate.setHours(0, 0, 0, 0);
  
  const hasWaiver = regMonth >= 9;
  
  let expiryDate: Date;
  if (hasWaiver) {
    expiryDate = new Date(regYear + 1, 11, 31);
  } else {
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

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


export function getWelcomeEmail(name: string, membershipNumber: string, email: string) {
  return {
    to: email,
    subject: 'Welcome to the Old Turians Society! 🎓',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Georgia', serif; color: #1B3A6B; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px; }
          .header { border-bottom: 4px solid #C9A84C; padding-bottom: 20px; }
          .content { padding: 30px 0; }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background: #1B3A6B; 
            color: white !important; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: bold;
          }
          .footer { border-top: 2px solid #1B3A6B/10; padding-top: 20px; font-size: 12px; color: #1B3A6B/60; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="font-family: 'Georgia', serif; color: #1B3A6B;">Welcome to the Old Turians Society</h1>
          </div>
          <div class="content">
            <h2>Dear ${escapeHtml(name)},</h2>
            <p>Welcome to the Old Turians Society! Your membership has been successfully activated.</p>
            <p><strong>Membership Number:</strong> ${escapeHtml(membershipNumber)}</p>
            <p>You can now log in to your account and access all member benefits.</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" class="button">
                Login to Your Account
              </a>
            </p>
            <p>If you have any questions, please contact us at alumni@turi.ac.ke</p>
            <p>Warm regards,<br><strong>The Old Turians Society</strong></p>
          </div>
          <div class="footer">
            <p>St Andrew's Turi · Est. 1931 · Seeking the Highest</p>
            <p>© ${new Date().getFullYear()} Old Turians Society. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
}

// ─── REGISTRATION HANDLER ────────────────────────────────────────────────────
export async function completeRegistration(payment: any) {
  try {
    console.log('========================================');
    console.log('🎓 PROCESSING REGISTRATION PAYMENT');
    console.log('========================================');
    console.log('Payment ID:', payment.id);

    // Get registration data from metadata
    const registrationData = payment.metadata?.registration_data;
    
    if (!registrationData) {
      console.error('❌ No registration data found in metadata');
      console.log('Available metadata keys:', Object.keys(payment.metadata || {}));
      throw new Error('No registration data found in payment metadata');
    }

    console.log('📧 Email:', registrationData.email);
    console.log('👤 Name:', registrationData.full_name);
    console.log('📱 Phone:', registrationData.phone);
    console.log('🎓 Graduation Year:', registrationData.graduation_year);
    console.log('📚 Course:', registrationData.course);
    console.log('🌍 Country:', registrationData.country);
    
    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin()
      .from('profiles')
      .select('id, membership_number, status, is_active')
      .eq('email', registrationData.email.toLowerCase())
      .maybeSingle();

    let userId;
    let membershipNumber = '';

    if (existingProfile) {
      console.log('👤 Profile already exists:', existingProfile.id);
      userId = existingProfile.id;
      membershipNumber = existingProfile.membership_number || '';
      
      // Activate the profile
      await supabaseAdmin()
        .from('profiles')
        .update({ 
          status: 'active', 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      console.log('✅ Profile activated');
      
    } else {
      console.log('🆕 Creating new user account after payment confirmation...');
      
      // Create auth user. Prefer the bcrypt hash captured at sign-up; fall back to a
      // legacy plaintext password only for rows created before hashing was added.
      // With neither, the account is created without a password (member uses reset).
      const credentials = registrationData.password_hash
        ? { password_hash: registrationData.password_hash as string }
        : registrationData.password
          ? { password: registrationData.password as string }
          : {};
      const { data: authData, error: authError } = await supabaseAdmin().auth.admin.createUser({
        email: registrationData.email.toLowerCase(),
        ...credentials,
        email_confirm: true,
        user_metadata: {
          full_name: registrationData.full_name,
          phone: registrationData.phone,
          graduation_year: registrationData.graduation_year,
          course: registrationData.course,
          country: registrationData.country,
        }
      });

      if (authError || !authData?.user) {
        console.error('❌ Auth user creation failed:', authError);
        throw new Error('Failed to create auth user: ' + (authError?.message || 'Unknown error'));
      }
        
      userId = authData.user.id;
      console.log('✅ Auth user created:', userId);

      // Generate membership number
      console.log('🔢 Generating membership number...');
      const { data: maxMembershipData } = await supabaseAdmin()
        .from('profiles')
        .select('membership_number')
        .not('membership_number', 'is', null)
        .order('membership_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (maxMembershipData?.membership_number) {
        const lastNumber = parseInt(maxMembershipData.membership_number);
        if (!isNaN(lastNumber)) {
          membershipNumber = (lastNumber + 1).toString();
        }
      } else {
        membershipNumber = '100001';
      }

      console.log(' Membership number:', membershipNumber);

      // Create profile
      console.log(' Creating profile...');
      const { error: profileError } = await supabaseAdmin()
        .from('profiles')
        .insert({
          id: userId,
          email: registrationData.email.toLowerCase(),
          full_name: registrationData.full_name,
          phone: registrationData.phone,
          graduation_year: registrationData.graduation_year ? parseInt(registrationData.graduation_year) : null,
          course: registrationData.course || null,
          country: registrationData.country || null,
          role: 'member',
          status: 'active',
          is_active: true,
          membership_number: membershipNumber
        });

      if (profileError) {
        console.error(' Profile creation failed:', profileError);
        throw new Error('Profile creation failed: ' + profileError.message);
      }

      console.log(' Profile created');
    }

    // Create membership
    console.log(' Creating membership...');
    const { data: existingMembership } = await supabaseAdmin()
      .from('memberships')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();
    
    if (!existingMembership) {
      const membershipDates = calculateMembershipDates(new Date());
      
      console.log('  📅 Start:', membershipDates.start_date);
      console.log('  📅 Expiry:', membershipDates.expiry_date);
      console.log('  🎯 Waiver:', membershipDates.has_waiver);
      
      const { error: membershipError } = await supabaseAdmin()
        .from('memberships')
        .insert({
          user_id: userId,
          start_date: membershipDates.start_date,
          expiry_date: membershipDates.expiry_date,
          is_active: true,
          payment_id: payment.id
        });
      
      if (membershipError) {
        console.error('❌ Membership creation failed:', membershipError);
        throw new Error('Membership creation failed: ' + membershipError.message);
      }
      
      console.log('✅ Membership created');
    } else {
      console.log('ℹ️ Membership already exists');
    }

    // Send welcome email
    console.log('📧 Sending welcome email...');
    if (registrationData.email) {
      try {
        const emailData = getWelcomeEmail(
          registrationData.full_name || 'Member',
          membershipNumber,
          registrationData.email.toLowerCase()
        );
        await sendEmail(emailData);
        console.log('✅ Welcome email sent');
      } catch (emailError: any) {
        console.error('⚠️ Email send failed (non-critical):', emailError.message);
      }
    }

    console.log('========================================');
    console.log('✅ REGISTRATION COMPLETED SUCCESSFULLY');
    console.log('========================================');
    
    return { 
      success: true, 
      userId: userId, 
      membershipNumber 
    };

  } catch (error: any) {
    console.error('========================================');
    console.error('❌ REGISTRATION HANDLER ERROR');
    console.error('========================================');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
}

