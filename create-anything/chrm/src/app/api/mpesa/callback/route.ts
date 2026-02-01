// app/api/payments/mpesa-callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase/admin';
import { sendEmail } from '@/app/lib/email/service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('M-Pesa Callback received:', JSON.stringify(body, null, 2));

    const { Body } = body;
    const stkCallback = Body?.stkCallback;

    if (!stkCallback) {
      return NextResponse.json({ error: 'Invalid callback data' }, { status: 400 });
    }

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

    // Find the payment record
    const { data: payment, error: fetchError } = await supabaseAdmin
      .from('payments')
      .select('*, profiles:user_id(full_name, email)')
      .eq('checkout_request_id', CheckoutRequestID)
      .single();

    if (fetchError || !payment) {
      console.error('Payment not found:', fetchError);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Update payment status
    let status: 'confirmed' | 'failed' | 'cancelled' = 'failed';
    let mpesaReceiptNumber = null;

    if (ResultCode === 0) {
      // Payment successful
      status = 'confirmed';
      
      // Extract M-Pesa receipt number
      const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];
      const receiptItem = callbackMetadata.find((item: any) => item.Name === 'MpesaReceiptNumber');
      mpesaReceiptNumber = receiptItem?.Value || null;

      // Update payment record
      const { error: updateError } = await supabaseAdmin
        .from('payments')
        .update({
          status: 'confirmed',
          mpesa_receipt_number: mpesaReceiptNumber,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      if (updateError) {
        console.error('Error updating payment:', updateError);
      }

      // SEND EMAIL NOTIFICATION
      await sendPaymentConfirmationEmail(payment, mpesaReceiptNumber);

      // Handle specific payment types
      await handlePaymentTypeActions(payment);

    } else if (ResultCode === 1032) {
      // User cancelled
      status = 'cancelled';
      await supabaseAdmin
        .from('payments')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', payment.id);
    } else {
      // Payment failed
      status = 'failed';
      await supabaseAdmin
        .from('payments')
        .update({ 
          status: 'failed', 
          updated_at: new Date().toISOString(),
          metadata: { ...payment.metadata, error_message: ResultDesc }
        })
        .eq('id', payment.id);
    }

    console.log(`Payment ${payment.id} updated to ${status}`);

    return NextResponse.json({ 
      ResultCode: 0, 
      ResultDesc: 'Accepted' 
    });

  } catch (error) {
    console.error('M-Pesa callback error:', error);
    return NextResponse.json({ 
      ResultCode: 1, 
      ResultDesc: 'Internal server error' 
    }, { status: 500 });
  }
}

// Send payment confirmation email
async function sendPaymentConfirmationEmail(payment: any, receipt: string | null) {
  try {
    const userEmail = payment.profiles?.email || payment.metadata?.userEmail;
    const userName = payment.profiles?.full_name || payment.metadata?.userName || 'Member';

    if (!userEmail) {
      console.log('No email address found for payment:', payment.id);
      return;
    }

    await sendEmail({
      to: userEmail,
      type: 'payment_confirmation',
      data: {
        name: userName,
        amount: payment.amount,
        reference: payment.account_reference,
        receipt: receipt || 'N/A',
        type: payment.payment_type,
      }
    });

    console.log(`Payment confirmation email sent to ${userEmail}`);
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
  }
}

// Handle actions based on payment type
async function handlePaymentTypeActions(payment: any) {
  const metadata = payment.metadata || {};

  switch (payment.payment_type) {
    case 'registration':
      await handleRegistrationPayment(payment);
      break;
    
    case 'renewal':
      await handleRenewalPayment(payment);
      break;
    
    case 'event':
      await handleEventPayment(payment, metadata);
      break;
    
    case 'merchandise':
      await handleMerchandisePayment(payment, metadata);
      break;
  }
}

// Handle registration payment - activate membership
async function handleRegistrationPayment(payment: any) {
  try {
    if (!payment.user_id) return;

    // Update user status to active
    await supabaseAdmin
      .from('profiles')
      .update({ status: 'active' })
      .eq('id', payment.user_id);

    // Create or activate membership
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year membership

    const { error } = await supabaseAdmin
      .from('memberships')
      .upsert({
        user_id: payment.user_id,
        start_date: startDate.toISOString(),
        expiry_date: expiryDate.toISOString(),
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error creating membership:', error);
    }

    // Send welcome email
    const userEmail = payment.profiles?.email || payment.metadata?.userEmail;
    const userName = payment.profiles?.full_name || payment.metadata?.userName;

    if (userEmail) {
      await sendEmail({
        to: userEmail,
        type: 'welcome',
        data: {
          name: userName || 'Member',
        }
      });
    }

    console.log(`Membership activated for user ${payment.user_id}`);
  } catch (error) {
    console.error('Error handling registration payment:', error);
  }
}

// Handle renewal payment
async function handleRenewalPayment(payment: any) {
  try {
    if (!payment.user_id) return;

    // Extend membership by 1 year
    const { data: membership } = await supabaseAdmin
      .from('memberships')
      .select('*')
      .eq('user_id', payment.user_id)
      .single();

    if (membership) {
      const currentExpiry = new Date(membership.expiry_date);
      const now = new Date();
      const newExpiry = currentExpiry > now ? currentExpiry : now;
      newExpiry.setFullYear(newExpiry.getFullYear() + 1);

      await supabaseAdmin
        .from('memberships')
        .update({
          expiry_date: newExpiry.toISOString(),
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', payment.user_id);

      console.log(`Membership renewed for user ${payment.user_id}`);
    }
  } catch (error) {
    console.error('Error handling renewal payment:', error);
  }
}
async function handleEventPayment(payment: any, metadata: any) {
  try {
    const eventId = metadata.event_id;
    const eventName = metadata.event_name;
    const registrationData = metadata.registration_data;
    
    if (!eventId || !registrationData) return;

    // Get event details
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (!event) return;

    // Create event registration
    const { error: regError } = await supabaseAdmin
      .from('event_registrations')
      .insert({
        user_id: payment.user_id,
        event_id: eventId,
        payment_id: payment.id,
        attendee_name: registrationData.attendee_name || payment.metadata?.userName,
        attendee_email: registrationData.attendee_email || payment.metadata?.userEmail,
        attendee_phone: registrationData.attendee_phone || payment.phone_number,
        membership_number: registrationData.membership_number,
        is_member: registrationData.is_member || false
      });

    if (regError) {
      console.error('Error creating event registration:', regError);
    } else {
      // Increment attendees count
      await supabaseAdmin
        .from('events')
        .update({
          current_attendees: event.current_attendees + 1
        })
        .eq('id', eventId);
    }

    // Send event registration email
    const userEmail = registrationData.attendee_email || payment.metadata?.userEmail;
    const userName = registrationData.attendee_name || payment.metadata?.userName;

    if (userEmail) {
      await sendEmail({
        to: userEmail,
        type: 'event_registration',
        data: {
          name: userName || 'Member',
          event_name: eventName || event.name,
          event_date: new Date(event.event_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          event_location: event.location,
        }
      });
    }
  } catch (error) {
    console.error('Error handling event payment:', error);
  }
}

// Handle merchandise payment
async function handleMerchandisePayment(payment: any, metadata: any) {
  try {
    const orderId = metadata.order_id;
    
    if (!orderId) return;

    // Update order status to paid
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

    if (!order) return;

    // Send merchandise order email
    const userEmail = order.customer_email;
    const userName = order.customer_name;

    if (userEmail) {
      await sendEmail({
        to: userEmail,
        type: 'merchandise_order',
        data: {
          name: userName || 'Customer',
          total_amount: order.total,
          shipping_address: order.shipping_address || 'N/A',
        }
      });

      console.log(`Merchandise order email sent to ${userEmail}`);
    }
  } catch (error) {
    console.error('Error handling merchandise payment:', error);
  }
}