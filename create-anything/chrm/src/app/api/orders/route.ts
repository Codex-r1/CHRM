import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      items,
      total,
      customer_name,
      customer_phone,
      customer_email,
      payment_id,
      shipping_address
    } = body

    if (!user_id || !items || !total) {
      return NextResponse.json(
        { error: 'User ID, items, and total are required' },
        { status: 400 }
      )
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id,
        items,
        total,
        status: 'pending',
        customer_name,
        customer_phone,
        customer_email,
        payment_id,
        shipping_address: shipping_address || 'To be provided'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      order,
      message: 'Order created successfully'
    })

  } catch (error: any) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to create order'
      },
      { status: 500 }
    )
  }
}