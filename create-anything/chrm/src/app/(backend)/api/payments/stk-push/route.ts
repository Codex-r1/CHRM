// app/api/payments/stk-push/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { mpesaService } from '../../../lib/mpesa/service';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { hashRegistrationPassword } from '../../../lib/registration/password';
import { randomBytes } from 'crypto';
import { REGISTRATION_FEE_KES } from '../../../lib/registration/fees';
import { getSessionUser } from '../../../lib/auth/session';

/**
 * Works out what to charge from the database, never from the request body.
 * Returns the amount in KES plus the user the payment belongs to, or an error message.
 */
async function resolveCharge(
  paymentType: string,
  metadata: Record<string, any>,
  request: NextRequest
): Promise<{ amount: number; userId: string | null } | { error: string; status: number }> {
  const admin = supabaseAdmin();
  switch (paymentType) {
    case 'registration':
      return { amount: REGISTRATION_FEE_KES, userId: null };
    case 'event': {
      const eventId = metadata.event_id || metadata.eventId;
      if (!eventId) return { error: 'Missing event.', status: 400 };
      const { data: event } = await admin
        .from('events')
        .select('id, price, is_active, max_attendees, current_attendees')
        .eq('id', eventId)
        .maybeSingle();
      if (!event || event.is_active === false) return { error: 'This event is not open for registration.', status: 404 };
      if (!(Number(event.price) > 0)) return { error: 'This event is free; no payment is needed.', status: 400 };
      if (event.max_attendees && event.current_attendees >= event.max_attendees) return { error: 'This event is fully booked.', status: 409 };
      const session = await getSessionUser(request);
      return { amount: Number(event.price), userId: session?.user.id ?? null };
    }
    case 'merchandise': {
      if (!metadata.order_id) return { error: 'Missing order.', status: 400 };
      const { data: order } = await admin
        .from('orders')
        .select('id, total, status, user_id')
        .eq('id', metadata.order_id)
        .maybeSingle();
      if (!order) return { error: 'Order not found.', status: 404 };
      if (order.status !== 'pending') return { error: 'This order has already been paid or closed.', status: 409 };
      return { amount: Number(order.total), userId: order.user_id ?? null };
    }
    default:
      return { error: 'This payment type is not supported.', status: 400 };
  }
}

const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid misreading

/** 12-character M-PESA account reference, unique per payment: e.g. "REG-7K2M9QXA". */
function uniqueAccountReference(prefix: string): string {
  const bytes = randomBytes(8);
  let suffix = '';
  for (const b of bytes) suffix += REFERENCE_ALPHABET[b % REFERENCE_ALPHABET.length];
  return `${prefix.slice(0, 3)}-${suffix}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Never log the raw body: registration requests contain the member's password.
    console.log('STK Push request:', { paymentType: body?.paymentType });
    
    const {
      phoneNumber,
      paymentType,
      userEmail,
      userName,
      metadata = {},
      payment_id,
      registrationData, 
    } = body;

    // 1. Validate required input parameters
    if (!phoneNumber || !paymentType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'Phone number and payment type are required.',
        },
        { status: 400 }
      );
    }

    // For registration, we MUST have registrationData
    if (paymentType === 'registration' && !registrationData) {
      console.error(' Registration payment requires registrationData');
      return NextResponse.json(
        {
          success: false,
          error: 'Missing registration data',
          message: 'Registration data is required for registration payments.',
        },
        { status: 400 }
      );
    }

    if (paymentType === 'registration') {
      const email = String(registrationData?.email || '').toLowerCase().trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || String(registrationData?.password || '').length < 8) {
        return NextResponse.json(
          { success: false, error: 'Invalid registration details', message: 'Please check your email address and use a password of at least 8 characters.' },
          { status: 400 }
        );
      }
      const { data: existing } = await supabaseAdmin().from('profiles').select('id').eq('email', email).maybeSingle();
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'account_exists', message: 'This email is already registered. Please log in instead.' },
          { status: 409 }
        );
      }
    }

    // The amount and owner come from the database; the request's `amount`/`userId` are ignored.
    const charge = await resolveCharge(String(paymentType), metadata || {}, request);
    if ('error' in charge) {
      return NextResponse.json({ success: false, error: charge.error, message: charge.error }, { status: charge.status });
    }
    const chargeAmount = Math.round(charge.amount);
    if (!(chargeAmount > 0)) {
      return NextResponse.json({ success: false, error: 'Invalid amount', message: 'Invalid amount.' }, { status: 400 });
    }

    // 2. Format phone number
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    const formattedPhone: string = cleanPhone.startsWith('0')
      ? `254${cleanPhone.substring(1)}`
      : cleanPhone.startsWith('7') || cleanPhone.startsWith('1')
      ? `254${cleanPhone}`
      : cleanPhone.startsWith('+254')
      ? cleanPhone.substring(1)
      : cleanPhone;

    if (!/^254\d{9}$/.test(formattedPhone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number', message: 'Enter a Safaricom number such as 0712 345 678.' },
        { status: 400 }
      );
    }

    // 3. Generate a unique account reference and transaction description.
    // `payments.account_reference` is UNIQUE in the database, and M-PESA allows at
    // most 12 characters, so each payment gets "<PFX>-<8 random chars>"
    // (e.g. REG-7K2M9QXA). This is also the reference the member sees on their phone.
    let referencePrefix = 'PAY';
    let description = 'Payment';

    switch (paymentType) {
      case 'registration':
        referencePrefix = 'REG';
        description = 'Member Reg';
        break;
      case 'renewal':
        referencePrefix = 'REN';
        description = 'Mem Renewal';
        break;
      case 'event':
        referencePrefix = 'EVT';
        // Handle both snake_case and camelCase event IDs, standardised for the callback
        metadata.event_id = metadata.event_id || metadata.eventId || 'REG';
        description = 'Event Reg';
        break;
      case 'merchandise':
        referencePrefix = 'MER';
        description = 'Merch Order';
        break;
    }
    let accountReference = uniqueAccountReference(referencePrefix);

    let paymentRecord: any = null;

    // 4. Create payment record with registration data in metadata
    const metadataWithRegistration = {
      ...metadata,
      userEmail,
      userName,
      paymentType,
    };

    // If registration, store the registration data
    if (paymentType === 'registration' && registrationData) {
      metadataWithRegistration.registration_data = {
        email: registrationData.email?.toLowerCase().trim(),
        full_name: registrationData.full_name,
        phone: registrationData.phone,
        password_hash: registrationData.password ? await hashRegistrationPassword(registrationData.password) : undefined,
        graduation_year: registrationData.graduation_year,
        course: registrationData.course,
        country: registrationData.country,
      };
      console.log('Stored registration data in metadata:', {
        email: registrationData.email,
        full_name: registrationData.full_name,
      });
    }

    // Create payment record (retry once with a fresh reference on the unlikely collision)
    const insertPayment = () =>
      supabaseAdmin()
        .from('payments')
        .insert({
          user_id: charge.userId,
          amount: chargeAmount,
          payment_type: paymentType,
          phone: formattedPhone,
          account_reference: accountReference,
          description: description,
          status: 'pending',
          metadata: metadataWithRegistration,
        })
        .select()
        .single();

    let { data: newPayment, error: paymentError } = await insertPayment();
    if (paymentError?.code === '23505') {
      accountReference = uniqueAccountReference(referencePrefix);
      ({ data: newPayment, error: paymentError } = await insertPayment());
    }

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create payment record',
          // Shown to the member; database details stay in the server log above.
          message: 'We could not start the payment. Please try again in a moment.',
        },
        { status: 500 }
      );
    }

    paymentRecord = newPayment;
    console.log('Payment record created:', paymentRecord.id);

    // 5. Trigger STK Push
    const stkResponse = await mpesaService.initiateSTKPush({
      phoneNumber: formattedPhone,
      amount: chargeAmount,
      accountReference,
      transactionDesc: description,
    });

    if (!stkResponse || !stkResponse.CheckoutRequestID) {
      throw new Error('M-PESA API failed to return a valid CheckoutRequestID');
    }

    // 6. Update payment with checkout request ID
    const { error: checkoutUpdateError } = await supabaseAdmin()
      .from('payments')
      .update({
        checkout_request_id: stkResponse.CheckoutRequestID,
        merchant_request_id: stkResponse.MerchantRequestID,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentRecord.id);

    if (checkoutUpdateError) {
      console.error('Failed to save CheckoutRequestID:', checkoutUpdateError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'STK Push initiated successfully',
        checkoutRequestID: stkResponse.CheckoutRequestID,
        MerchantRequestID: stkResponse.MerchantRequestID,
        paymentId: paymentRecord.id,
        data: {
          CheckoutRequestID: stkResponse.CheckoutRequestID,
          checkoutRequestID: stkResponse.CheckoutRequestID,
          MerchantRequestID: stkResponse.MerchantRequestID,
          paymentId: paymentRecord.id,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('STK Push Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initiate payment',
        message: 'Please try again later',
      },
      { status: 500 }
    );
  }
}