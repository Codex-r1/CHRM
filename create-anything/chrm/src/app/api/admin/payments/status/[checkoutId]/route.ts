import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/admin';
import { mpesaService } from '../../../../../lib/mpesa/service';

export async function GET(
  request: NextRequest,
  { params }: { params: { checkoutId: string } }
) {
  try {
    const { checkoutId } = params;

    if (!checkoutId) {
      return NextResponse.json(
        { error: 'Checkout ID is required' },
        { status: 400 }
      );
    }

    // First, check database
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('checkout_request_id', checkoutId)
      .single();

    if (error) {
      console.error('Payment not found:', error);
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // If already confirmed, return immediately
    if (payment.status === 'confirmed') {
      return NextResponse.json({
        status: 'confirmed',
        payment,
        message: 'Payment already confirmed'
      });
    }

    // If pending, check with M-Pesa API
    if (payment.status === 'pending') {
      try {
        const mpesaResponse = await mpesaService.checkTransactionStatus(checkoutId);
        
        if (mpesaResponse.ResultCode === '0') {
          // Payment successful
          const updateData = {
            status: 'confirmed' as const,
            mpesa_receipt_number: mpesaResponse.MpesaReceiptNumber,
            confirmed_at: new Date().toISOString(),
            paid_at: new Date().toISOString(),
            callback_data: mpesaResponse
          };

          // Update payment in database
          await supabaseAdmin
            .from('payments')
            .update(updateData)
            .eq('checkout_request_id', checkoutId);

          // Refetch updated payment
          const { data: updatedPayment } = await supabaseAdmin
            .from('payments')
            .select('*')
            .eq('checkout_request_id', checkoutId)
            .single();

          return NextResponse.json({
            status: 'confirmed',
            payment: updatedPayment,
            message: 'Payment confirmed successfully'
          });
        } else {
          // Payment failed
          const updateData = {
            status: 'failed' as const,
            error_message: mpesaResponse.ResultDesc,
            callback_data: mpesaResponse
          };

          await supabaseAdmin
            .from('payments')
            .update(updateData)
            .eq('checkout_request_id', checkoutId);

          return NextResponse.json({
            status: 'failed',
            payment: { ...payment, ...updateData },
            message: mpesaResponse.ResultDesc || 'Payment failed'
          });
        }
      } catch (mpesaError) {
        console.error('M-PESA API error:', mpesaError);
        // Return current status if M-PESA check fails
        return NextResponse.json({
          status: payment.status,
          payment,
          message: 'Unable to verify payment status'
        });
      }
    }

    // Return current status
    return NextResponse.json({
      status: payment.status,
      payment,
      message: `Payment is ${payment.status}`
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}