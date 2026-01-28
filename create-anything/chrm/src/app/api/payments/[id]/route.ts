import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from'../../../lib/supabase/client'
import { mpesaService } from '../../../lib/mpesa/service'

export async function GET(
  request: NextRequest,
  { params }: { params: { checkoutId: string } }
) {
  try {
    const { checkoutId } = params
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
      .eq('checkout_request_id', checkoutId)
      .single()

    if (!payment) {
      return NextResponse.json({
        status: 'not_found',
        message: 'Payment not found'
      })
    }

    // If payment already confirmed, return
    if (payment.status === 'confirmed') {
      return NextResponse.json({
        status: 'confirmed',
        receipt: payment.mpesa_receipt_number,
        paid_at: payment.paid_at,
        user: payment.profiles
      })
    }

    // If still pending, check with M-PESA
    if (payment.status === 'pending' || payment.status === 'processing') {
      try {
        const mpesaStatus = await mpesaService.checkTransactionStatus(checkoutId)
        
        if (mpesaStatus.ResultCode === '0') {
          // Payment successful
          await supabaseAdmin
            .from('payments')
            .update({
              status: 'confirmed',
              mpesa_receipt_number: mpesaStatus.MpesaReceiptNumber || null,
              paid_at: new Date().toISOString(),
              confirmed_at: new Date().toISOString(),
              callback_data: mpesaStatus
            })
            .eq('checkout_request_id', checkoutId)
          
          return NextResponse.json({
            status: 'confirmed',
            receipt: mpesaStatus.MpesaReceiptNumber,
            paid_at: new Date().toISOString()
          })
        } else if (mpesaStatus.ResultCode !== '1037') { // 1037 = timeout, still pending
          // Payment failed
          await supabaseAdmin
            .from('payments')
            .update({
              status: 'failed',
              error_message: mpesaStatus.ResultDesc,
              callback_data: mpesaStatus
            })
            .eq('checkout_request_id', checkoutId)
          
          return NextResponse.json({
            status: 'failed',
            message: mpesaStatus.ResultDesc
          })
        }
      } catch (mpesaError) {
        console.error('M-PESA status check error:', mpesaError)
      }
    }

    // Return current status
    return NextResponse.json({
      status: payment.status,
      message: payment.error_message || 'Payment in progress'
    })

  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check payment status'
    })
  }
}