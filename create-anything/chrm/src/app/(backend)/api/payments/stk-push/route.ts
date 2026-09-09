import { NextRequest, NextResponse } from 'next/server';
import { mpesaService } from '../../../lib/mpesa/service';
import { supabaseAdmin } from '../../../lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      phoneNumber,
      amount,
      paymentType,
      userId,
      userEmail,
      userName,
      metadata = {},
      payment_id,
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

    // 2. Format phone number to standard 254XXXXXXXXX format
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
        description = `Membership Renewal - ${
          metadata.renewal_year || new Date().getFullYear()
        }`;
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

    // 4. Resolve or create database payment record
    if (paymentType === 'registration' && payment_id) {
      const { data: existingPayment, error: fetchError } = await supabaseAdmin()
        .from('payments')
        .select('*')
        .eq('id', payment_id)
        .single();

      if (fetchError || !existingPayment) {
        return NextResponse.json(
          {
            success: false,
            error: 'Payment record not found',
            message: 'Invalid payment ID provided.',
          },
          { status: 404 }
        );
      }

      // Update phone and description on existing registration payment row
      const updatedMetadata = {
        ...(existingPayment.metadata || {}),
        ...metadata,
        userEmail,
        userName,
        paymentType,
      };

      const { data: updatedPayment, error: updateError } = await supabaseAdmin()
        .from('payments')
        .update({
          phone: formattedPhone,
          account_reference: accountReference,
          description: description,
          metadata: updatedMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment_id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating registration payment record:', updateError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to update payment record',
            message: updateError.message,
          },
          { status: 500 }
        );
      }

      paymentRecord = updatedPayment;
    } else {
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
          metadata: {
            ...metadata,
            userEmail,
            userName,
            paymentType,
          },
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
    }

    // 5. Trigger Safaricom Daraja STK Push Request
    const stkResponse = await mpesaService.initiateSTKPush({
      phoneNumber: formattedPhone,
      amount: Math.round(parseFloat(amount)),
      accountReference,
      transactionDesc: description,
    });

    if (!stkResponse || !stkResponse.CheckoutRequestID) {
      throw new Error('M-PESA API failed to return a valid CheckoutRequestID');
    }

    // 6. Update Payment Record with Checkout and Merchant Request IDs
    const { error: checkoutUpdateError } = await supabaseAdmin()
      .from('payments')
      .update({
        checkout_request_id: stkResponse.CheckoutRequestID,
        merchant_request_id: stkResponse.MerchantRequestID,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentRecord.id);

    if (checkoutUpdateError) {
      console.error('Failed to save CheckoutRequestID to payment:', checkoutUpdateError);
    }

return NextResponse.json(
  {
    success: true,
    message: 'STK Push initiated successfully',
    CheckoutRequestID: stkResponse.CheckoutRequestID,
    checkoutRequestID: stkResponse.CheckoutRequestID,
    MerchantRequestID: stkResponse.MerchantRequestID,
    merchantRequestID: stkResponse.MerchantRequestID,
    CustomerMessage: stkResponse.CustomerMessage,
    customerMessage: stkResponse.CustomerMessage,
    paymentId: paymentRecord.id,
    data: {
      CheckoutRequestID: stkResponse.CheckoutRequestID,
      checkoutRequestID: stkResponse.CheckoutRequestID,
      MerchantRequestID: stkResponse.MerchantRequestID,
      merchantRequestID: stkResponse.MerchantRequestID,
      paymentId: paymentRecord.id,
    },
  },
  { status: 200 }
);
  } catch (error: any) {
    console.error('STK Push API Error:', error);

    let errorMessage = 'Failed to initiate payment';
    let customerMessage = 'Please try again later';

    if (error.response?.data) {
      errorMessage =
        error.response.data.errorMessage ||
        error.response.data.ResponseDescription ||
        errorMessage;
      customerMessage = error.response.data.CustomerMessage || customerMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: customerMessage,
      },
      { status: 500 }
    );
  }
}