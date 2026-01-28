import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase/admin'
import { mpesaService } from '../../../lib/mpesa/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      phoneNumber,
      amount,
      paymentType,
      userId,
      description,
      metadata = {}
    } = body

    if (!phoneNumber || !amount || !paymentType) {
      return NextResponse.json(
        { error: 'Phone number, amount, and payment type are required' },
        { status: 400 }
      )
    }

    // Format phone number
    const formattedPhone = phoneNumber.startsWith('0')
      ? `254${phoneNumber.slice(1)}`
      : phoneNumber

    const accountReference = `CHRMAA-${paymentType.toUpperCase()}-${Date.now()}`

    // 1️⃣ Initiate STK Push (FAST)
    const stkResponse = await mpesaService.initiateSTKPush({
      phoneNumber: formattedPhone,
      amount: Number(amount),
      accountReference,
      transactionDesc: description || `CHRMAA ${paymentType} Payment`
    })

    if (stkResponse.ResponseCode !== '0') {
      return NextResponse.json(
        { error: stkResponse.ResponseDescription || 'STK Push failed' },
        { status: 400 }
      )
    }

    // 2️⃣ Create PENDING payment record ONLY
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: userId || null,
        amount: Number(amount),
        method: 'mpesa_stk',
        payment_type: paymentType,
        phone_number: formattedPhone,
        checkout_request_id: stkResponse.CheckoutRequestID,
        merchant_request_id: stkResponse.MerchantRequestID,
        account_reference: accountReference,
        status: 'pending',
        description,
        metadata
      })
      .select()
      .single()

    if (error) throw error
return NextResponse.json({
  success: true,
  message: stkResponse.CustomerMessage,
  checkoutRequestID: stkResponse.CheckoutRequestID, 
  merchantRequestID: stkResponse.MerchantRequestID, 
  paymentId: payment.id
})

  } catch (error: any) {
    console.error('STK Push error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initiate payment' },
      { status: 500 }
    )
  }
}
