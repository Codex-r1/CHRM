// app/api/mpesa/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase/admin'
import { sendEmail } from '../../../lib/email/service' 

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const stkCallback = payload?.Body?.stkCallback

    if (!stkCallback) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    const {
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata
    } = stkCallback

    const ack = NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })

    // Get payment with user info
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select(`
        *,
        profiles (
          email,
          full_name,
          membership_number
        )
      `)
      .eq('checkout_request_id', CheckoutRequestID)
      .single()

    if (!payment) {
      console.error('Payment not found for checkout:', CheckoutRequestID)
      return ack
    }

    // If already confirmed, just acknowledge
    if (payment.status === 'confirmed') {
      return ack
    }

    // Handle failure
    if (Number(ResultCode) !== 0) {
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'failed',
          error_message: ResultDesc,
          callback_data: payload
        })
        .eq('id', payment.id)
      
      // Send failure email - FIXED CALL
      if (payment.profiles?.email) {
        await sendEmail({
          to: payment.profiles.email,
          type: 'payment_confirmation',
          data: {
            name: payment.profiles.full_name,
            reference: payment.account_reference,
            amount: payment.amount,
            receipt: null,
            type: `${payment.payment_type} - Failed`,
            reason: ResultDesc
          }
        })
      }
      
      return ack
    }

    // Handle success
    const metadata = CallbackMetadata?.Item || []
    const mpesaReceipt = metadata.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value
    
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'confirmed',
        mpesa_receipt_number: mpesaReceipt,
        paid_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        callback_data: payload
      })
      .eq('id', payment.id)

    // Send success email - FIXED CALL
    if (payment.profiles?.email) {
      await sendEmail({
        to: payment.profiles.email,
        type: 'payment_confirmation',
        data: {
          name: payment.profiles.full_name,
          reference: payment.account_reference,
          amount: payment.amount,
          receipt: mpesaReceipt,
          type: payment.payment_type
        }
      })
    }

    // Also send welcome email if it's registration
    if (payment.payment_type === 'registration' && payment.profiles?.email) {
      await sendEmail({
        to: payment.profiles.email,
        type: 'welcome',
        data: {
          name: payment.profiles.full_name
        }
      })
    }

    return ack
  } catch (err) {
    console.error('MPesa Callback Error:', err)
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  }
}