// app/api/payments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log('Checking payment status for checkout_request_id:', id);

    // Query payment by checkout_request_id
    const { data: payment, error: queryError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('checkout_request_id', id)
      .single();

    if (queryError) {
      console.error('Payment query error:', queryError);
      
      if (queryError.code === 'PGRST116') {
        return NextResponse.json(
          { 
            status: 'not_found',
            message: 'Payment not found' 
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch payment' },
        { status: 500 }
      );
    }

    console.log('Payment found:', {
      id: payment.id,
      status: payment.status,
      amount: payment.amount
    });

    return NextResponse.json({
      status: payment.status,
      payment: {
        id: payment.id,
        amount: payment.amount,
        payment_type: payment.payment_type,
        status: payment.status,
        created_at: payment.created_at,
        checkout_request_id: payment.checkout_request_id
      },
      message: payment.status === 'confirmed' 
        ? 'Payment confirmed' 
        : payment.status === 'failed'
        ? 'Payment failed'
        : 'Payment pending'
    });

  } catch (error: any) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}