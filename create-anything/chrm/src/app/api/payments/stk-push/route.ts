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
      payment_id 
    } = body;

    // Validate required fields
    if (!phoneNumber || !amount || !paymentType) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields',
          message: 'Phone number, amount, and payment type are required'
        },
        { status: 400 }
      );
    }

    // Format phone number (ensure 254 format)
    const formattedPhone = phoneNumber.startsWith('0') 
      ? `254${phoneNumber.substring(1)}`
      : phoneNumber.startsWith('7')
      ? `254${phoneNumber}`
      : phoneNumber.startsWith('+254')
      ? phoneNumber.substring(1)
      : phoneNumber;

    // Generate account reference based on payment type
    let accountReference = '';
    let description = '';
    
    switch (paymentType) {
      case 'registration':
        accountReference = 'REGISTRATION';
        description = `New Member Registration - ${userName || 'User'}`;
        break;
      case 'renewal':
        accountReference = 'RENEWAL';
        if (metadata.membership_number) {
          accountReference = `RENEWAL-${metadata.membership_number}`;
        }
        description = `Membership Renewal - ${metadata.renewal_year || new Date().getFullYear()}`;
        break;
      case 'event':
        accountReference = `EVENT-${metadata.event_id || 'REG'}`;
        description = `Event Registration - ${metadata.event_name || 'Event'}`;
        break;
      case 'merchandise':
        accountReference = `MERCH-${Date.now()}`;
        description = `Merchandise Purchase`;
        break;
      default:
        accountReference = `PAYMENT-${Date.now()}`;
        description = `${paymentType} payment`;
    }

    let paymentRecord;

    // For registration, update existing payment record
    if (paymentType === 'registration' && payment_id) {
      // Get the existing payment record
      const { data: existingPayment, error: fetchError } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('id', payment_id)
        .single();

      if (fetchError || !existingPayment) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Payment record not found',
            message: 'Invalid payment ID'
          },
          { status: 404 }
        );
      }

      paymentRecord = existingPayment;
    } else {
      // For other payment types, create new payment record
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert({
          user_id: userId || null,
          amount: parseFloat(amount),
          payment_type: paymentType,
          phone_number: formattedPhone,
          account_reference: accountReference,
          description: description,
          status: 'pending',
          metadata: {
            ...metadata,
            userEmail,
            userName,
            paymentType
          }
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        return NextResponse.json(
          { 
            success: false,
            error: 'Failed to create payment record',
            message: paymentError.message
          },
          { status: 500 }
        );
      }

      paymentRecord = payment;
    }

    // Initiate STK Push
    const stkResponse = await mpesaService.initiateSTKPush({
      phoneNumber: formattedPhone,
      amount: parseInt(amount),
      accountReference,
      transactionDesc: description
    });

    // Update payment with M-PESA response
    await supabaseAdmin
      .from('payments')
      .update({
        checkout_request_id: stkResponse.CheckoutRequestID,
        merchant_request_id: stkResponse.MerchantRequestID,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentRecord.id);

    return NextResponse.json({
      success: true,
      message: 'STK Push initiated successfully',
      checkoutRequestID: stkResponse.CheckoutRequestID,
      merchantRequestID: stkResponse.MerchantRequestID,
      customerMessage: stkResponse.CustomerMessage,
      paymentId: paymentRecord.id,
      data: {
        checkoutRequestID: stkResponse.CheckoutRequestID,
        merchantRequestID: stkResponse.MerchantRequestID,
        customerMessage: stkResponse.CustomerMessage,
        paymentId: paymentRecord.id
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('STK Push error:', error);
    
    // Try to extract meaningful error message
    let errorMessage = 'Failed to initiate payment';
    let customerMessage = 'Please try again later';
    
    if (error.response?.data) {
      errorMessage = error.response.data.errorMessage || error.response.data.errorMessage || errorMessage;
      customerMessage = error.response.data.CustomerMessage || customerMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        message: customerMessage
      },
      { status: 500 }
    );
  }
}