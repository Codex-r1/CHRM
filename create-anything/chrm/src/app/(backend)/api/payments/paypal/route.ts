// app/api/payments/paypal/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/(backend)/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { amount, paymentType, userId, metadata, returnUrl } = await request.json();
    
    // In production, use PayPal API
    // For now, simulate payment creation
    
    // Create PayPal order
    const paypalOrder = await createPayPalOrder({
      amount,
      description: paymentType === 'registration' ? 'Membership Registration' : 'Event Registration',
      returnUrl: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancelled`
    });
    
    if (!paypalOrder.success) {
      return NextResponse.json(
        { error: paypalOrder.message || "Failed to create PayPal order" },
        { status: 400 }
      );
    }
    
    // Save pending payment
    const { data: payment, error } = await supabaseAdmin()
      .from("payments")
      .insert({
        user_id: userId,
        amount: amount,
        payment_type: paymentType,
        status: 'pending',
        description: `PayPal payment - ${paymentType}`,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
      
    if (error) {
      console.error("Error saving payment:", error);
    }
    
    return NextResponse.json({
      success: true,
      redirect_url: paypalOrder.approval_url,
      payment_id: payment?.id,
      order_id: paypalOrder.id
    });
    
  } catch (error: any) {
    console.error("PayPal payment error:", error);
    return NextResponse.json(
      { error: error.message || "PayPal payment failed" },
      { status: 500 }
    );
  }
}

// Simulated PayPal order creation
async function createPayPalOrder(details: any) {
  // In production, integrate with PayPal API:
  // https://developer.paypal.com/docs/api/orders/v2/
  
  // Simulate order creation
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    id: `PAYPAL-${Date.now()}`,
    approval_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/paypal-approve?order_id=${Date.now()}`,
    message: "PayPal order created"
  };
}