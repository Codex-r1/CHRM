import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase/admin';
import { sendEmail } from '@/app/lib/email/service';

export async function POST(req: NextRequest) {
  console.log('  M-PESA CALLBACK RECEIVED AT:', new Date().toISOString());
  
  try {
    const body = await req.json();
    
    console.log(' RAW CALLBACK BODY:');
    console.log(JSON.stringify(body, null, 2));
    
    // Log callback for debugging
    await supabaseAdmin
      .from('callback_logs')
      .insert({
        raw_data: body,
        received_at: new Date().toISOString()
      });
    
    // Parse the callback
    const { Body } = body;
    const stkCallback = Body?.stkCallback;
    
    if (!stkCallback) {
      console.error('  No stkCallback found');
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
    console.log('- CheckoutRequestID:', CheckoutRequestID);
    console.log('- ResultCode:', ResultCode);
    console.log('- ResultDesc:', ResultDesc);
    
    // Find the payment
    console.log(' Searching for payment...');
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('checkout_request_id', CheckoutRequestID)
      .single();
    
    if (error || !payment) {
      console.error('  Payment not found:', error);
      console.error('CheckoutRequestID:', CheckoutRequestID);
      
      // Try alternative search
      const { data: allPayments } = await supabaseAdmin
        .from('payments')
        .select('checkout_request_id, status')
        .order('created_at', { ascending: false })
        .limit(5);
      
      console.log('Recent payments:', allPayments);
      
      return NextResponse.json({ 
        ResultCode: 1,
        ResultDesc: 'Payment not found',
        searched_id: CheckoutRequestID
      });
    }
    
    console.log('  Payment found:', {
      id: payment.id,
      current_status: payment.status,
      checkout_id: payment.checkout_request_id,
      payment_type: payment.payment_type,
      has_user_id: !!payment.user_id
    });
    
    // Check if payment already confirmed
    if (payment.status === 'confirmed') {
      console.log('Payment already confirmed');
      return NextResponse.json({ 
        ResultCode: 0,
        ResultDesc: 'Already processed' 
      });
    }
    
    // Process based on ResultCode
    if (Number(ResultCode) === 0) {
      console.log(' Payment successful! Updating to confirmed...');
      
      // Extract M-PESA receipt number
      let mpesaReceiptNumber = null;
      if (CallbackMetadata?.Item) {
        const receiptItem = CallbackMetadata.Item.find((item: any) => 
          item.Name === 'MpesaReceiptNumber'
        );
        mpesaReceiptNumber = receiptItem?.Value;
        console.log(' M-PESA Receipt:', mpesaReceiptNumber);
      }
      
      // Update payment
      const updateData = {
        status: 'confirmed',
        mpesa_receipt_number: mpesaReceiptNumber,
        paid_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        callback_data: body
      };
      
      console.log(' Updating payment with:', updateData);
      
      const { data: updatedPayment, error: updateError } = await supabaseAdmin
        .from('payments')
        .update(updateData)
        .eq('id', payment.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('  Update failed:', updateError);
        return NextResponse.json({ 
          ResultCode: 1,
          ResultDesc: 'Database update failed' 
        });
      }
      
      console.log('  Payment updated successfully!');
      console.log('New status:', updatedPayment?.status);
      
      // Handle different payment types
      try {
        switch (payment.payment_type) {
          case 'registration':
            if (!payment.user_id) {
              console.log('👤 Handling registration payment...');
              await handleRegistrationPayment(payment);
            }
            break;
            
          case 'renewal':
            console.log(' Handling renewal payment...');
            await handleRenewalPayment(payment);
            break;
            
          case 'event':
            console.log(' Handling event payment...');
            await handleEventPayment(payment);
            break;
            
          case 'merchandise':
            console.log(' Handling merchandise payment...');
            await handleMerchandisePayment(payment);
            break;
            
          default:
            console.log('  Unknown payment type:', payment.payment_type);
        }
      } catch (handlerError) {
        console.error('  Payment type handler failed:', handlerError);
        
        // Send admin alert
        try {
          const adminEmail = process.env.ADMIN_EMAIL || 'admin@chrmaa.com';
          await sendEmail({
            to: adminEmail,
            type: 'payment_confirmation',
            data: {
              name: 'Admin',
              amount: payment.amount,
              reference: CheckoutRequestID,
              receipt: mpesaReceiptNumber || 'N/A',
              type: payment.payment_type,
              alert_note: `Payment confirmed but handler failed: ${handlerError instanceof Error ? handlerError.message : 'Unknown error'}`
            }
          });
        } catch (emailError) {
          console.error('Failed to send admin alert:', emailError);
        }
      }
      
      // Send payment confirmation email to customer
      try {
        const userEmail = payment.metadata?.registration_data?.email || 
                         payment.metadata?.userEmail;
        const userName = payment.metadata?.registration_data?.full_name || 
                        payment.metadata?.userName || 'Customer';
        
        if (userEmail) {
          await sendEmail({
            to: userEmail,
            type: 'payment_confirmation', 
            data: {
              name: userName,
              amount: payment.amount,
              reference: CheckoutRequestID,
              receipt: mpesaReceiptNumber || 'N/A',
              type: payment.payment_type,
            }
          });
          console.log('  Payment confirmation email sent to:', userEmail);
        }
      } catch (emailError) {
        console.error('  Email send failed:', emailError);
      }
      
      return NextResponse.json({ 
        ResultCode: 0,
        ResultDesc: 'Success' 
      });
      
    } else {
      console.log('  Payment failed with ResultCode:', ResultCode);
      
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
          callback_data: body
        })
        .eq('id', payment.id);
        
      return NextResponse.json({ 
        ResultCode: 0,
        ResultDesc: 'Failed payment recorded' 
      });
    }
    
  } catch (error) {
    console.error(' CALLBACK ERROR:', error);
    return NextResponse.json({ 
      ResultCode: 1,
      ResultDesc: 'Internal server error' 
    }, { status: 500 });
  }
}

async function handleRegistrationPayment(payment: any) {
  try {
    console.log('🎓 Processing registration payment:', payment.id);

    const registrationData = payment.metadata?.registration_data;
    
    if (!registrationData) {
      throw new Error('No registration data found in payment metadata');
    }

    console.log(' Registration data found for:', registrationData.email);
    
    // Check if user already exists
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingAuthUser.users.find(u => u.email === registrationData.email);
    
    let authUserId;
    
    if (userExists) {
      console.log(' Auth user already exists:', userExists.id);
      authUserId = userExists.id;
    } else {
      console.log(' Creating new user account...');
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: registrationData.email,
        password: registrationData.password || 'DefaultPassword123',
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

      if (authError) {
        throw new Error('Failed to create user: ' + authError.message);
      }
        
      authUserId = authData.user!.id;
      console.log('  Auth user created:', authUserId);
    }

    // Check if profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, membership_number, status')
      .eq('id', authUserId)
      .maybeSingle();

    let membershipNumber = '';
    
    if (existingProfile) {
      console.log(' Profile exists, updating...');
      membershipNumber = existingProfile.membership_number;
      
      await supabaseAdmin
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', authUserId);
      
    } else {
      // Generate membership number
      console.log(' Generating membership number...');
      const { data: maxMembershipData } = await supabaseAdmin
        .from('profiles')
        .select('membership_number')
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

      console.log(' Generated:', membershipNumber);

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authUserId,
          email: registrationData.email,
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
        throw new Error('Profile creation failed: ' + profileError.message);
      }

      console.log('  Profile created');
    }

    // Link payment to user
    await supabaseAdmin
      .from('payments')
      .update({ user_id: authUserId })
      .eq('id', payment.id);

    // Create membership
    const { data: existingMembership } = await supabaseAdmin
      .from('memberships')
      .select('id')
      .eq('user_id', authUserId)
      .maybeSingle();
    
    if (!existingMembership) {
      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      
      await supabaseAdmin
        .from('memberships')
        .insert({
          user_id: authUserId,
          start_date: startDate.toISOString().split('T')[0],
          expiry_date: expiryDate.toISOString().split('T')[0],
          is_active: true,
          payment_id: payment.id
        });
      
      console.log('  Membership created');
    }

    // Send welcome email
    if (registrationData.email) {
      try {
        await sendEmail({
          to: registrationData.email,
          type: 'welcome',
          data: {
            name: registrationData.full_name || 'Member',
            membership_number: membershipNumber
          }
        });
        console.log('  Welcome email sent');
      } catch (emailError) {
        console.error('  Email failed:', emailError);
      }
    }

    console.log(`  Registration completed for ${registrationData.email}`);
    return { success: true, userId: authUserId, membershipNumber };

  } catch (error) {
    console.error('  Registration handler error:', error);
    throw error;
  }
}

async function handleRenewalPayment(payment: any) {
  try {
    console.log(' Processing renewal payment:', payment.id);
    
    if (!payment.user_id) {
      console.log('  No user_id for renewal payment');
      return;
    }
    
    // Update membership
    const { data: membership } = await supabaseAdmin
      .from('memberships')
      .select('*')
      .eq('user_id', payment.user_id)
      .maybeSingle();
    
    if (membership) {
      const currentExpiry = new Date(membership.expiry_date);
      const now = new Date();
      const newExpiry = currentExpiry > now ? currentExpiry : now;
      newExpiry.setFullYear(newExpiry.getFullYear() + 1);
      
      await supabaseAdmin
        .from('memberships')
        .update({
          expiry_date: newExpiry.toISOString().split('T')[0],
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', payment.user_id);
      
      console.log(`  Membership renewed for user ${payment.user_id}`);
    } else {
      // Create new membership if doesn't exist
      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      
      await supabaseAdmin
        .from('memberships')
        .insert({
          user_id: payment.user_id,
          start_date: startDate.toISOString().split('T')[0],
          expiry_date: expiryDate.toISOString().split('T')[0],
          is_active: true,
          payment_id: payment.id
        });
      
      console.log(`  New membership created for user ${payment.user_id}`);
    }
    
  } catch (error) {
    console.error('  Renewal handler error:', error);
    throw error;
  }
}

async function handleEventPayment(payment: any) {
  try {
    console.log('Processing event payment:', payment.id);
    
    const metadata = payment.metadata || {};
    const eventId = metadata.event_id;
    
    if (!eventId) {
      console.error('  No event_id in metadata');
      return;
    }

    // Get event details
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      console.error('  Event not found:', eventError);
      return;
    }

    // Check if already registered
    const { data: existingReg } = await supabaseAdmin
      .from('event_registrations')
      .select('id')
      .eq('payment_id', payment.id)
      .maybeSingle();

    if (existingReg) {
      console.log('Registration already exists');
      return;
    }

    // Extract attendee info
    const attendeeName = payment.metadata?.userName || metadata.attendee_name;
    const attendeeEmail = payment.metadata?.userEmail || metadata.attendee_email;
    const attendeePhone = payment.phone_number || metadata.attendee_phone;
    const membershipNumber = metadata.membership_number;
    const isMember = metadata.is_alumni_member === 'yes' || metadata.is_member === true;

    // Create registration
    const { data: registration, error: regError } = await supabaseAdmin
      .from('event_registrations')
      .insert({
        user_id: payment.user_id || null,
        event_id: eventId,
        payment_id: payment.id,
        attendee_name: attendeeName,
        attendee_email: attendeeEmail,
        attendee_phone: attendeePhone,
        membership_number: membershipNumber || null,
        is_member: isMember
      })
      .select()
      .single();

    if (regError) {
      throw new Error('Registration creation failed: ' + regError.message);
    }

    // Increment attendees count
    await supabaseAdmin
      .from('events')
      .update({ 
        current_attendees: event.current_attendees + 1 
      })
      .eq('id', eventId);

    console.log('  Event registration created:', registration.id);

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
        console.log(`  Event email sent to ${attendeeEmail}`);
      } catch (emailError) {
        console.error('  Event email failed:', emailError);
      }
    }
    
  } catch (error) {
    console.error('  Event handler error:', error);
    throw error;
  }
}

async function handleMerchandisePayment(payment: any) {
  try {
    console.log(' Processing merchandise payment:', payment.id);
    
    const metadata = payment.metadata || {};
    const orderId = metadata.order_id;
    
    if (!orderId) {
      console.log('  No order_id in metadata');
      return;
    }
    
    // Update order status
    const { data: order } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'processing',
        payment_id: payment.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (!order) {
      console.log('  Order not found:', orderId);
      return;
    }

    console.log('  Order updated to processing');

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
            total_amount: order.total,
            shipping_address: order.shipping_address || 'N/A',
          }
        });
        console.log(`  Order email sent to ${customerEmail}`);
      } catch (emailError) {
        console.error('  Order email failed:', emailError);
      }
    }
    
  } catch (error) {
    console.error('  Merchandise handler error:', error);
    throw error;
  }
}