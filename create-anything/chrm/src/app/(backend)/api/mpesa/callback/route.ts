// app/api/mpesa/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/(backend)/lib/supabase/admin';
import { sendEmail } from '@/app/(backend)/lib/email/service';
import {
  calculateMembershipDates,
  completeRegistration,
  formatDate,
} from '@/app/(backend)/lib/registration/service';
import { stripRegistrationSecrets } from '@/app/(backend)/lib/registration/password';
import { escapeHtml } from '@/app/(backend)/lib/security/html';
import { mpesaService } from '@/app/(backend)/lib/mpesa/service';
import { timingSafeEqual } from 'crypto';

/**
 * The callback URL carries a shared secret (?token=MPESA_CALLBACK_SECRET, added by the STK push).
 * Without it anyone who knows a CheckoutRequestID could post a fake "paid" callback.
 */
function hasValidCallbackToken(req: NextRequest): boolean {
  const secret = process.env.MPESA_CALLBACK_SECRET;
  if (!secret) return false;
  const given = req.nextUrl.searchParams.get('token') || '';
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

function callbackAmount(CallbackMetadata: any): number | null {
  const item = CallbackMetadata?.Item?.find((i: any) => i?.Name === 'Amount');
  const n = Number(item?.Value);
  return Number.isFinite(n) ? n : null;
}

function calculateRenewalDates(currentExpiryDate: string | Date) {
  const expiryDate = new Date(currentExpiryDate);
  const nextYear = expiryDate.getFullYear() + 1;
  
  const startDate = new Date(nextYear, 0, 1);
  const newExpiryDate = new Date(nextYear, 11, 31);
  
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

// ─── EMAIL HELPERS ──────────────────────────────────────────────────────────
function getEventRegistrationEmail(name: string, eventName: string, eventDate: string, eventLocation: string, email: string) {
  return {
    to: email,
    subject: `Event Registration Confirmed: ${eventName} 🎫`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Georgia', serif; color: #1B3A6B; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px; }
          .header { border-bottom: 4px solid #C9A84C; padding-bottom: 20px; }
          .content { padding: 30px 0; }
          .event-details { background: #1B3A6B/5; padding: 20px; border-radius: 8px; margin: 20px 0; }
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
            <h1 style="font-family: 'Georgia', serif; color: #1B3A6B;">Event Registration Confirmed</h1>
          </div>
          <div class="content">
            <h2>Dear ${escapeHtml(name)},</h2>
            <p>Your registration for the following event has been confirmed:</p>
            
            <div class="event-details">
              <h3 style="margin-top: 0;">${escapeHtml(eventName)}</h3>
              <p><strong>Date:</strong> ${escapeHtml(eventDate)}</p>
              <p><strong>Location:</strong> ${escapeHtml(eventLocation)}</p>
            </div>
            
            <p>We look forward to seeing you there!</p>
            
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/events" class="button">
                View All Events
              </a>
            </p>
            
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

function getMerchandiseOrderEmail(name: string, totalAmount: string, shippingAddress: string, email: string) {
  return {
    to: email,
    subject: 'Your Merchandise Order Confirmation 🛍️',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Georgia', serif; color: #1B3A6B; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px; }
          .header { border-bottom: 4px solid #C9A84C; padding-bottom: 20px; }
          .content { padding: 30px 0; }
          .order-details { background: #1B3A6B/5; padding: 20px; border-radius: 8px; margin: 20px 0; }
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
            <h1 style="font-family: 'Georgia', serif; color: #1B3A6B;">Order Confirmation</h1>
          </div>
          <div class="content">
            <h2>Dear ${escapeHtml(name)},</h2>
            <p>Thank you for your merchandise order! Your order has been confirmed and is being processed.</p>
            
            <div class="order-details">
              <p><strong>Total Amount:</strong> KES ${escapeHtml(totalAmount)}</p>
              <p><strong>Shipping Address:</strong> ${escapeHtml(shippingAddress)}</p>
            </div>
            
            <p>You will receive a shipping confirmation with tracking details once your order ships.</p>
            
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/member/dashboard" class="button">
                View Order Status
              </a>
            </p>
            
            <p>Thank you for supporting the Old Turians Society!</p>
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

// ─── MAIN CALLBACK HANDLER ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  console.log('========================================');
  console.log(' M-PESA CALLBACK RECEIVED AT:', new Date().toISOString());
  console.log('========================================');
  
  // When a secret is configured, callbacks without it are rejected outright.
  // When it isn't, every "paid" callback is double-checked with Safaricom below.
  const tokenConfigured = !!process.env.MPESA_CALLBACK_SECRET;
  const tokenValid = hasValidCallbackToken(req);
  if (tokenConfigured && !tokenValid) {
    console.warn('M-PESA callback rejected: missing or wrong token');
    return NextResponse.json({ ResultCode: 1, ResultDesc: 'Rejected' }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    const { Body } = body;
    const stkCallback = Body?.stkCallback;
    
    if (!stkCallback) {
      console.error('❌ No stkCallback found in body');
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
    
    console.log('📋 Parsed Callback Data:');
    console.log('  - CheckoutRequestID:', CheckoutRequestID);
    console.log('  - ResultCode:', ResultCode);
    console.log('  - ResultDesc:', ResultDesc);
    
    // Find the payment
    console.log('🔍 Searching for payment...');
    const { data: payment, error } = await supabaseAdmin()
      .from('payments')
      .select('*')
      .eq('checkout_request_id', CheckoutRequestID)
      .single();
    
    if (error || !payment) {
      console.error('❌ Payment not found:', error);
      console.error('  CheckoutRequestID:', CheckoutRequestID);
      
      return NextResponse.json({ 
        ResultCode: 1,
        ResultDesc: 'Payment not found'
      });
    }
    
    console.log('✅ Payment found:', {
      id: payment.id,
      current_status: payment.status,
      payment_type: payment.payment_type,
      has_user_id: !!payment.user_id,
      is_temp: payment.metadata?.is_temp
    });
    
    // Check if payment already confirmed
    if (payment.status === 'confirmed') {
      console.log('⚠️ Payment already confirmed, skipping...');
      return NextResponse.json({ 
        ResultCode: 0,
        ResultDesc: 'Already processed' 
      });
    }
    
    // Process based on ResultCode
    if (Number(ResultCode) === 0) {
      // Paid amount must match what we asked for.
      const paidAmount = callbackAmount(CallbackMetadata);
      if (paidAmount === null || Math.round(paidAmount) !== Math.round(Number(payment.amount))) {
        console.error('M-PESA amount mismatch', { expected: payment.amount, paid: paidAmount, payment: payment.id });
        await supabaseAdmin()
          .from('payments')
          .update({ status: 'failed', error_message: 'Amount mismatch on callback', callback_data: body, updated_at: new Date().toISOString() })
          .eq('id', payment.id);
        return NextResponse.json({ ResultCode: 0, ResultDesc: 'Amount mismatch recorded' });
      }
      if (payment.merchant_request_id && MerchantRequestID && payment.merchant_request_id !== MerchantRequestID) {
        console.error('M-PESA MerchantRequestID mismatch for payment', payment.id);
        return NextResponse.json({ ResultCode: 1, ResultDesc: 'Rejected' }, { status: 400 });
      }
      // No shared secret configured: confirm the payment with Safaricom before trusting it.
      if (!tokenValid) {
        try {
          const query = await mpesaService.checkTransactionStatus(CheckoutRequestID);
          if (String(query?.ResultCode) !== '0') {
            console.error('M-PESA status query did not confirm payment', payment.id, query?.ResultCode);
            return NextResponse.json({ ResultCode: 1, ResultDesc: 'Not confirmed' }, { status: 400 });
          }
        } catch (queryError: any) {
          console.error('M-PESA status query failed; payment left pending', payment.id, queryError?.message);
          return NextResponse.json({ ResultCode: 1, ResultDesc: 'Verification unavailable' }, { status: 503 });
        }
      }

      console.log('✅ PAYMENT SUCCESSFUL - PROCESSING...');
      console.log('========================================');
      
      // Extract M-PESA receipt number
      let receiptNumber = null;
      if (CallbackMetadata?.Item) {
        const receiptItem = CallbackMetadata.Item.find((item: any) => 
          item.Name === 'MpesaReceiptNumber'
        );
        receiptNumber = receiptItem?.Value;
        console.log('  📄 M-PESA Receipt:', receiptNumber);
      }
      
      // Process based on payment type
      let userId = payment.user_id;
      
      try {
        console.log(' Processing payment type:', payment.payment_type);
        
        switch (payment.payment_type) {
          case 'registration': {
            console.log(' Starting registration handler...');
            const result = await completeRegistration(payment);
            
            if (result?.userId) {
              userId = result.userId;
              console.log('User created/activated successfully with ID:', userId);
              console.log(' Membership number:', result.membershipNumber);
            } else {
              throw new Error('Registration handler did not return userId');
            }
            break;
          }
          
          case 'renewal': {
            console.log('🔄 Starting renewal handler...');
            await handleRenewalPayment(payment);
            userId = payment.user_id;
            break;
          }
          
          case 'event': {
            console.log('🎪 Starting event handler...');
            await handleEventPayment(payment);
            userId = payment.user_id;
            break;
          }
          
          case 'merchandise': {
            console.log('🛍️ Starting merchandise handler...');
            await handleMerchandisePayment(payment);
            userId = payment.user_id;
            break;
          }
          
          default: {
            console.log('❓ Unknown payment type:', payment.payment_type);
            throw new Error(`Unknown payment type: ${payment.payment_type}`);
          }
        }
      } catch (handlerError: any) {
        console.error('❌ Handler error:', handlerError);
        
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
      
      // Update payment to confirmed
const updateData: any = {
  status: 'confirmed',
  receipt_number: receiptNumber,
  paid_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
  callback_data: body,
  updated_at: new Date().toISOString()
};

// The account now exists: drop password material from the stored registration data.
if (payment.metadata?.registration_data) {
  updateData.metadata = stripRegistrationSecrets(payment.metadata);
}

if (userId) {
  updateData.user_id = userId;
  console.log(' Linking payment to user:', userId);
}

const { error: updateError } = await supabaseAdmin()
  .from('payments')
  .update(updateData)
  .eq('id', payment.id);  

if (updateError) {
  console.error(' Payment update failed:', updateError);
  return NextResponse.json({ 
    ResultCode: 1, 
    ResultDesc: 'Database update failed: ' + updateError.message 
  });
}
      
      console.log(' Payment confirmed successfully!');
      
      return NextResponse.json({ 
        ResultCode: 0,
        ResultDesc: 'Success' 
      });
      
    } else {
      console.log(' Payment failed with ResultCode:', ResultCode);
      console.log('  ResultDesc:', ResultDesc);
      
      await supabaseAdmin()
        .from('payments')
        .update({
          status: 'failed',
          error_message: ResultDesc,
          // A retry starts a new STK push with a new row, so this one no longer needs the password hash.
          metadata: stripRegistrationSecrets(payment.metadata),
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
      ResultDesc: 'Internal server error'
    }, { status: 500 });
  }
}

// ─── RENEWAL HANDLER ──────────────────────────────────────────────────────
async function handleRenewalPayment(payment: any) {
  try {
    console.log('🔄 Processing renewal payment:', payment.id);
    
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
      
      console.log('  📅 Renewal dates:', {
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
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.user_id);
      
      console.log('✅ Membership renewed');
      
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
      
      console.log('✅ New membership created');
    }
    
  } catch (error: any) {
    console.error('❌ Renewal handler error:', error);
    throw error;
  }
}

// ─── EVENT HANDLER ──────────────────────────────────────────────────────
async function handleEventPayment(payment: any) {
  try {
    console.log(' Processing event payment:', payment.id);
    
    const metadata = payment.metadata || {};
    const eventId = metadata.event_id || metadata.eventId;
    
    if (!eventId) {
      throw new Error('No event_id found in payment metadata');
    }

    // 1. Fetch event details
    const { data: event, error: eventError } = await supabaseAdmin()
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new Error('Event not found: ' + (eventError?.message || 'Invalid ID'));
    }

    // 2. Prevent duplicate registrations for the same payment
    const { data: existingReg } = await supabaseAdmin()
      .from('event_registrations')
      .select('id')
      .eq('payment_id', payment.id)
      .maybeSingle();

    if (existingReg) {
      console.log('Registration already exists for this payment');
      return;
    }

    // 3. Extract attendee details with safe fallbacks
    const attendeeName = metadata.attendee_name || metadata.userName || 'Valued Member';
    const attendeeEmail = metadata.attendee_email || metadata.userEmail || '';
    const attendeePhone = metadata.attendee_phone || payment.phone || '';

    // 4. Build registration payload satisfying NOT NULL constraints
    const registrationPayload: any = {
      event_id: eventId,
      payment_id: payment.id,
      attendee_name: attendeeName,
      attendee_email: attendeeEmail,
      attendee_phone: attendeePhone,
    };

    if (payment.user_id) {
      registrationPayload.user_id = payment.user_id;
    }

    const { error: regError } = await supabaseAdmin()
      .from('event_registrations')
      .insert(registrationPayload);

    if (regError) {
      throw new Error('Registration creation failed: ' + regError.message);
    }

    // 5. Safely increment attendees count (handling null values)
    const currentAttendees = typeof event.current_attendees === 'number' ? event.current_attendees : 0;

    await supabaseAdmin()
      .from('events')
      .update({ 
        current_attendees: currentAttendees + 1 
      })
      .eq('id', eventId);

    console.log(' Event registration recorded cleanly');

    // 6. Send confirmation email via Resend
    if (attendeeEmail) {
      try {
        const emailData = getEventRegistrationEmail(
          attendeeName,
          metadata.event_name || event.name,
          new Date(event.event_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          event.location || 'TBA',
          attendeeEmail
        );
        await sendEmail(emailData);
        console.log('Event email sent');
      } catch (emailError: any) {
        console.error(' Event email failed (non-critical):', emailError.message);
      }
    }
    
  } catch (error: any) {
    console.error(' Event handler error:', error.message);
    throw error;
  }
}

// ─── MERCHANDISE HANDLER ──────────────────────────────────────────────────────
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
    const customerEmail = order.customer_email || metadata.customer_email;
    const customerName = order.customer_name || metadata.customer_name;
    
    if (customerEmail) {
      try {
        const emailData = getMerchandiseOrderEmail(
          customerName || 'Customer',
          order.total.toLocaleString(),
          order.shipping_address || 'N/A',
          customerEmail
        );
        await sendEmail(emailData);
        console.log('Order confirmation email sent');
      } catch (emailError: any) {
        console.error(' Order email failed:', emailError.message);
      }
    }
    
  } catch (error: any) {
    console.error('Merchandise handler error:', error);
    throw error;
  }
}