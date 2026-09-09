// app/api/payments/stk-push/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { mpesaService } from '../../../lib/mpesa/service';
import { supabaseAdmin } from '../../../lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('STK Push Request Body:', JSON.stringify(body, null, 2));
    
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

    // 3. Generate account reference and transaction description
    let accountReference = '';
    let description = '';

    switch (paymentType) {
      case 'registration':
        accountReference = 'REGISTRATION';
        description = `New Member Reg - ${userName || 'User'}`;
        break;
      case 'renewal':
        accountReference = metadata.membership_number
          ? `RENEWAL-${metadata.membership_number}`
          : 'RENEWAL';
        description = `Membership Renewal - ${metadata.renewal_year || new Date().getFullYear()}`;
        break;
      case 'event':
        accountReference = `EVENT-${metadata.event_id || 'REG'}`;
        description = `Event Reg - ${metadata.event_name || 'Event'}`;
        break;
      case 'merchandise':
        accountReference = `MERCH-${Date.now()}`;
        description = `Merchandise Purchase`;
        break;
      default:
        accountReference = `PAYMENT-${Date.now()}`;
        description = `${paymentType} payment`;
    }

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
        password: registrationData.password,
        graduation_year: registrationData.graduation_year,
        course: registrationData.course,
        country: registrationData.country,
      };
      console.log('Stored registration data in metadata:', {
        email: registrationData.email,
        full_name: registrationData.full_name,
      });
    }

    // Create payment record
    const { data: newPayment, error: paymentError } = await supabaseAdmin()
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

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create payment record',
          message: paymentError.message,
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