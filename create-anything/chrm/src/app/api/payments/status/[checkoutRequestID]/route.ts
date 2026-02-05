import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { checkoutRequestID: string } }
) {
  try {
    const { checkoutRequestID } = params;
    
    console.log('Checking payment status for:', checkoutRequestID);
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('checkout_request_id', checkoutRequestID)
      .single();

    if (error || !payment) {
      console.log(' Payment not found:', checkoutRequestID);
      return NextResponse.json(
        { 
          error: 'Payment not found',
          status: 'not_found' 
        },
        { status: 404 }
      );
    }

    console.log(' Payment status:', {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      type: payment.payment_type
    });
    return NextResponse.json({
      status: payment.status,
      payment: {
        id: payment.id,
        amount: payment.amount,
        payment_type: payment.payment_type,
        checkout_request_id: payment.checkout_request_id,
        mpesa_receipt_number: payment.mpesa_receipt_number,
        phone_number: payment.phone_number,
        created_at: payment.created_at,
        confirmed_at: payment.confirmed_at,
        paid_at: payment.paid_at
      }
    });

  } catch (error: any) {
    console.error(' Status check error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        status: 'error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}