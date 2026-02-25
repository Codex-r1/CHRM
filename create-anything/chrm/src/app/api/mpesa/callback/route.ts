import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase/admin';
import { sendEmail } from '@/app/lib/email/service';

// Inline membership calculation function
function calculateMembershipDates(registrationDate: string | Date) {
  const regDate = new Date(registrationDate);
  const regMonth = regDate.getMonth(); // 0-11
  const regYear = regDate.getFullYear();
  
  const startDate = new Date(regDate);
  startDate.setHours(0, 0, 0, 0);
  
  // Check if October-December (waiver period)
  const hasWaiver = regMonth >= 9; // Months 9, 10, 11 = Oct, Nov, Dec
  
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

function calculateRenewalDates(currentExpiryDate: string | Date) {
  const expiryDate = new Date(currentExpiryDate);
  const nextYear = expiryDate.getFullYear() + 1;
  
  // Renewals always: Jan 1 - Dec 31 of next year
  const startDate = new Date(nextYear, 0, 1); // January 1st
  const newExpiryDate = new Date(nextYear, 11, 31); // December 31st
  
  startDate.setHours(0, 0, 0, 0);
  newExpiryDate.setHours(23, 59, 59, 999);
  
  const today = new Date();
  const isActive = newExpiryDate >= today;
  
  return {
    start_date: formatDate(startDate),
    expiry_date: formatDate(newExpiryDate),
    is_active: isActive
  };
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function POST(req: NextRequest) {
  console.log('M-PESA CALLBACK RECEIVED AT:', new Date().toISOString());
  console.log('========================================');
  
  try {
    const body = await req.json();
    
    console.log(' RAW CALLBACK BODY:');
    console.log(JSON.stringify(body, null, 2));
    
    // Parse the callback
    const { Body } = body;
    const stkCallback = Body?.stkCallback;
    
    if (!stkCallback) {
      console.error(' No stkCallback found in body');
      return NextResponse.json({ 
        ResultCode: 1,
        ResultDesc: 'Invalid callback data' 
      });
    }
    
    const { 
      MerchantRequestID, 
      CheckoutRequestID, 
      ResultCode, 
      ResultDesc, 
      CallbackMetadata 
    } = stkCallback;
    
    console.log(' Parsed Callback Data:');
    console.log('  - CheckoutRequestID:', CheckoutRequestID);
    console.log('  - ResultCode:', ResultCode);
    console.log('  - ResultDesc:', ResultDesc);
    
    // Find the payment
    console.log(' Searching for payment...');
    const { data: payment, error } = await supabaseAdmin()
      .from('payments')
      .select('*')
      .eq('checkout_request_id', CheckoutRequestID)
      .single();
    
    if (error || !payment) {
      console.error(' Payment not found:', error);
      console.error('   CheckoutRequestID:', CheckoutRequestID);
      
      return NextResponse.json({ 
        ResultCode: 1,
        ResultDesc: 'Payment not found',
        searched_id: CheckoutRequestID
      });
    }
    
    console.log(' Payment found:', {
      id: payment.id,
      current_status: payment.status,
      payment_type: payment.payment_type,
      has_user_id: !!payment.user_id
    });
    
    // Check if payment already confirmed
    if (payment.status === 'confirmed') {
      console.log(' Payment already confirmed, skipping...');
      return NextResponse.json({ 
        ResultCode: 0,
        ResultDesc: 'Already processed' 
      });
    }
    
    // Process based on ResultCode
    if (Number(ResultCode) === 0) {
      console.log(' PAYMENT SUCCESSFUL - PROCESSING...');
      console.log('========================================');
      
      // Extract M-PESA receipt number
      let mpesaReceiptNumber = null;
      if (CallbackMetadata?.Item) {
        const receiptItem = CallbackMetadata.Item.find((item: any) => 
          item.Name === 'MpesaReceiptNumber'
        );
        mpesaReceiptNumber = receiptItem?.Value;
        console.log(' M-PESA Receipt:', mpesaReceiptNumber);
      }
      
      // STEP 1: Process payment type handlers FIRST (creates user, profile, membership)
      let userId = payment.user_id;
      
      try {
        console.log(' Processing payment type:', payment.payment_type);
        
        switch (payment.payment_type) {
          case 'registration': {
            console.log(' Starting registration handler...');
            const result = await handleRegistrationPayment(payment);
            
            if (result?.userId) {
              userId = result.userId;
              console.log(' User created successfully with ID:', userId);
            } else {
              throw new Error('Registration handler did not return userId');
            }
            break;
          }
          
          case 'renewal':
            console.log(' Starting renewal handler...');
            await handleRenewalPayment(payment);
            userId = payment.user_id;
            break;
          
          case 'event':
            console.log(' Starting event handler...');
            await handleEventPayment(payment);
            userId = payment.user_id;
            break;
          
          case 'merchandise':
            console.log(' Starting merchandise handler...');
            await handleMerchandisePayment(payment);
            userId = payment.user_id;
            break;
          
          default:
            console.log(' Unknown payment type:', payment.payment_type);
        }
      } catch (handlerError: any) {
        
        // Mark payment as failed
        await supabaseAdmin()
          .from('payments')
          .update({
            status: 'failed',
            error_message: `Handler error: ${handlerError.message}`,
            callback_data: body,
            updated_at: new Date().toISOString()
          })
          .eq('checkout_request_id', CheckoutRequestID);
        
        return NextResponse.json({ 
          ResultCode: 1, 
          ResultDesc: 'Payment processing failed: ' + handlerError.message 
        });
      }
      
      // STEP 2: Now update payment to confirmed (with user_id)
      const updateData: any = {
        status: 'confirmed',
        mpesa_receipt_number: mpesaReceiptNumber,
        paid_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        callback_data: body,
        updated_at: new Date().toISOString()
      };
      
      if (userId) {
        updateData.user_id = userId;
        console.log(' Linking payment to user:', userId);
      }
      
      console.log(' Updating payment status to confirmed...');
      
      const { error: updateError } = await supabaseAdmin()
        .from('payments')
        .update(updateData)
        .eq('checkout_request_id', CheckoutRequestID);

      if (updateError) {
        console.error(' Payment update failed:', updateError);
        return NextResponse.json({ 
          ResultCode: 1, 
          ResultDesc: 'Database update failed: ' + updateError.message 
        });
      }
    
      
      return NextResponse.json({ 
        ResultCode: 0,
        ResultDesc: 'Success' 
      });
      
    } else {
      console.log('Payment failed with ResultCode:', ResultCode);
      console.log('   ResultDesc:', ResultDesc);
      
      await supabaseAdmin()
        .from('payments')
        .update({
          status: 'failed',
          error_message: ResultDesc,
          updated_at: new Date().toISOString(),
          callback_data: body
        })
        .eq('id', payment.id);
        
      return NextResponse.json({ 
        ResultCode: 0,
        ResultDesc: 'Failed payment recorded' 
      });
    }
    
  } catch (error: any) {
    console.error('========================================');
    console.error('❌ CALLBACK ERROR');
    console.error('========================================');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return NextResponse.json({ 
      ResultCode: 1,
      ResultDesc: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

async function handleRegistrationPayment(payment: any) {
  try {
    console.log('========================================');
    console.log('🎓 PROCESSING REGISTRATION PAYMENT');
    console.log('========================================');
    console.log('Payment ID:', payment.id);

    const registrationData = payment.metadata?.registration_data;
    
    if (!registrationData) {
      throw new Error('No registration data found in payment metadata');
    }

    console.log(' Email:', registrationData.email);
    console.log(' Phone:', registrationData.phone);
    console.log(' Name:', registrationData.full_name);
    
    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin()
      .from('profiles')
      .select('id, membership_number, status')
      .eq('email', registrationData.email.toLowerCase())
      .maybeSingle();

    let authUserId;
    let membershipNumber = '';
    
    if (existingProfile) {
      console.log('👤 Profile already exists:', existingProfile.id);
      authUserId = existingProfile.id;
      membershipNumber = existingProfile.membership_number;
      
      // Just activate the profile
      await supabaseAdmin()
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', authUserId);
      
      console.log(' Profile activated');
      
    } else {
      console.log('Creating new user account...');
      
      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin().auth.admin.createUser({
        email: registrationData.email.toLowerCase(),
        password: registrationData.password || 'TempPassword123!',
        email_confirm: true,
        user_metadata: {
          full_name: registrationData.full_name,
          phone: registrationData.phone,
          graduation_year: registrationData.graduation_year,
          course: registrationData.course,
          county: registrationData.county,
          role: 'member'
        }
      });

      if (authError || !authData?.user) {
        console.error(' Auth user creation failed:', authError);
        throw new Error('Failed to create auth user: ' + (authError?.message || 'Unknown error'));
      }
        
      authUserId = authData.user.id;
      console.log('Auth user created:', authUserId);

      // Generate membership number
      console.log(' Generating membership number...');
      const { data: maxMembershipData } = await supabaseAdmin()
        .from('profiles')
        .select('membership_number')
        .not('membership_number', 'is', null)
        .order('membership_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      membershipNumber = '100196';
      if (maxMembershipData?.membership_number) {
        const lastNumber = parseInt(maxMembershipData.membership_number);
        if (!isNaN(lastNumber)) {
          membershipNumber = (lastNumber + 1).toString();
        }
      }

      console.log('Membership number:', membershipNumber);

      // Create profile
      console.log(' Creating profile...');
      const { error: profileError } = await supabaseAdmin()
        .from('profiles')
        .insert({
          id: authUserId,
          email: registrationData.email.toLowerCase(),
          full_name: registrationData.full_name,
          phone_number: registrationData.phone,
          graduation_year: registrationData.graduation_year ? parseInt(registrationData.graduation_year) : null,
          course: registrationData.course || null,
          county: registrationData.county || null,
          role: 'member',
          status: 'active',
          registration_source: 'online',
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
      .eq('user_id', authUserId)
      .eq('is_active', true)
      .maybeSingle();
    
    if (!existingMembership) {
      const membershipDates = calculateMembershipDates(new Date());
      
      console.log('   Start:', membershipDates.start_date);
      console.log('   Expiry:', membershipDates.expiry_date);
      console.log('   Waiver:', membershipDates.has_waiver);
      
      const { error: membershipError } = await supabaseAdmin()
        .from('memberships')
        .insert({
          user_id: authUserId,
          start_date: membershipDates.start_date,
          expiry_date: membershipDates.expiry_date,
          is_active: true,
          payment_id: payment.id
        });
      
      if (membershipError) {
        console.error(' Membership creation failed:', membershipError);
        throw new Error('Membership creation failed: ' + membershipError.message);
      }
      
      console.log(' Membership created');
    } else {
      console.log('Membership already exists');
    }

    // Send welcome email
    console.log(' Sending welcome email...');
    if (registrationData.email) {
      try {
        await sendEmail({
          to: registrationData.email.toLowerCase(),
          type: 'welcome',
          data: {
            name: registrationData.full_name || 'Member',
            membership_number: membershipNumber,
            email: registrationData.email.toLowerCase()
          }
        });
        console.log(' Welcome email sent');
      } catch (emailError: any) {
        console.error(' Email send failed (non-critical):', emailError.message);
      }
    }

    console.log('========================================');
    console.log('REGISTRATION COMPLETED SUCCESSFULLY');
    console.log('========================================');
    
    return { 
      success: true, 
      userId: authUserId, 
      membershipNumber 
    };

  } catch (error: any) {
    console.error('========================================');
    console.error(' REGISTRATION HANDLER ERROR');
    console.error('========================================');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
}

async function handleRenewalPayment(payment: any) {
  try {
    console.log(' Processing renewal payment:', payment.id);
    
    if (!payment.user_id) {
      throw new Error('No user_id for renewal payment');
    }
    
    // Get current membership
    const { data: currentMembership } = await supabaseAdmin()
      .from('memberships')
      .select('*')
      .eq('user_id', payment.user_id)
      .eq('is_active', true)
      .maybeSingle();
    
    if (currentMembership) {
      // Calculate renewal dates
      const renewalDates = calculateRenewalDates(currentMembership.expiry_date);
      
      console.log(' Renewal dates:', {
        current_expiry: currentMembership.expiry_date,
        new_start: renewalDates.start_date,
        new_expiry: renewalDates.expiry_date
      });
      
      // Deactivate old membership
      await supabaseAdmin()
        .from('memberships')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentMembership.id);
      
      // Create new membership
      await supabaseAdmin()
        .from('memberships')
        .insert({
          user_id: payment.user_id,
          start_date: renewalDates.start_date,
          expiry_date: renewalDates.expiry_date,
          is_active: true,
          payment_id: payment.id
        });
      
      // Update profile status
      await supabaseAdmin()
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', payment.user_id);
      
      console.log(' Membership renewed');
      
    } else {
      // Create new membership
      const membershipDates = calculateMembershipDates(new Date());
      
      await supabaseAdmin()
        .from('memberships')
        .insert({
          user_id: payment.user_id,
          start_date: membershipDates.start_date,
          expiry_date: membershipDates.expiry_date,
          is_active: true,
          payment_id: payment.id
        });
      
      console.log(' New membership created');
    }
    
  } catch (error: any) {
    console.error(' Renewal handler error:', error);
    throw error;
  }
}

async function handleEventPayment(payment: any) {
  try {
    console.log(' Processing event payment:', payment.id);
    
    const metadata = payment.metadata || {};
    const eventId = metadata.event_id;
    
    if (!eventId) {
      throw new Error('No event_id in metadata');
    }

    // Get event details
    const { data: event, error: eventError } = await supabaseAdmin()
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new Error('Event not found: ' + eventError?.message);
    }

    // Check if already registered
    const { data: existingReg } = await supabaseAdmin()
      .from('event_registrations')
      .select('id')
      .eq('payment_id', payment.id)
      .maybeSingle();

    if (existingReg) {
      console.log(' Registration already exists');
      return;
    }

    const attendeeName = metadata.attendee_name; // Changed from userName
    const attendeeEmail = metadata.attendee_email; // Changed from userEmail
    const attendeePhone = metadata.attendee_phone;

    // Create registration
    const { error: regError } = await supabaseAdmin()
      .from('event_registrations')
      .insert({
        user_id: payment.user_id || null,
        event_id: eventId,
        payment_id: payment.id
      });

    if (regError) {
      throw new Error('Registration creation failed: ' + regError.message);
    }

    // Increment attendees count
    await supabaseAdmin()
      .from('events')
      .update({ 
        current_attendees: event.current_attendees + 1 
      })
      .eq('id', eventId);

    console.log(' Event registration created');

    // Send confirmation email
    if (attendeeEmail) {
      try {
        await sendEmail({
          to: attendeeEmail,
          type: 'event_registration',
          data: {
            name: attendeeName || 'Attendee',
            event_name: metadata.event_name || event.name,
            event_date: new Date(event.event_date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            event_location: event.location || 'TBA',
          }
        });
        console.log('✅ Event email sent');
      } catch (emailError: any) {
        console.error(' Event email failed:', emailError.message);
      }
    }
    
  } catch (error: any) {
    console.error('Event handler error:', error);
    throw error;
  }
}
async function handleMerchandisePayment(payment: any) {
  try {
    console.log(' Processing merchandise payment:', payment.id);
    
    const metadata = payment.metadata || {};
    const orderId = metadata.order_id;
    
    if (!orderId) {
      throw new Error('No order_id in metadata');
    }
    
    // Update order status
    const { data: order, error: orderError } = await supabaseAdmin()
      .from('orders')
      .update({
        status: 'processing',
        payment_id: payment.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (orderError || !order) {
      throw new Error('Order update failed: ' + orderError?.message);
    }

    console.log('Order updated to processing');

    // Send order confirmation email
    const customerEmail = order.customer_email;
    const customerName = order.customer_name;
    
    if (customerEmail) {
      try {
        await sendEmail({
          to: customerEmail,
          type: 'merchandise_order',
          data: {
            name: customerName || 'Customer',
            total_amount: order.total.toLocaleString(),
            shipping_address: order.shipping_address || 'N/A',
          }
        });
        console.log(' Order confirmation email sent');
      } catch (emailError: any) {
        console.error(' Order email failed:', emailError.message);
      }
    }
    
  } catch (error: any) {
    console.error(' Merchandise handler error:', error);
    throw error;
  }
}