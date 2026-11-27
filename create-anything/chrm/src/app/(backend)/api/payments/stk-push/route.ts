// app/api/payments/stk-push/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { mpesaService } from '../../../lib/mpesa/service';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { hashRegistrationPassword } from '../../../lib/registration/password';
import { randomBytes } from 'crypto';

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
    console.log('STK Push request:', { paymentType: body?.paymentType, amount: body?.amount });
    
    const {
      phoneNumber,
      amount,
      paymentType,
      userId,
      userEmail,
      userName,
      metadata = {},
      payment_id,
      registrationData, 
    } = body;

    // 1. Validate required input parameters
    if (!phoneNumber || !amount || !paymentType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'Phone number, amount, and payment type are required.',
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

    // 2. Format phone number
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    const formattedPhone = cleanPhone.startsWith('0')
      ? `254${cleanPhone.substring(1)}`
      : cleanPhone.startsWith('7') || cleanPhone.startsWith('1')
      ? `254${cleanPhone}`
      : cleanPhone.startsWith('+254')
      ? cleanPhone.substring(1)
      : cleanPhone;

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
          user_id: userId || null,
          amount: parseFloat(amount),
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
      amount: Math.round(parseFloat(amount)),
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
        error: error.message || 'Failed to initiate payment',
        message: 'Please try again later',
      },
      { status: 500 }
    );
  }
}