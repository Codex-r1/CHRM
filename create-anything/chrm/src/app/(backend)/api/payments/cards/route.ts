// app/api/payments/card/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/(backend)/lib/supabase/admin";

// For testing, we'll use a simple implementation
// In production, use Stripe, PesaPal, or Flutterwave

export async function POST(request: Request) {
  try {
    const { cardDetails, amount, paymentType, userId, metadata } = await request.json();
    
    // Validate card details (basic validation)
    const { cardNumber, expiryDate, cvv, cardholderName } = cardDetails;
    
    // Simple validation
    if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
      return NextResponse.json(
        { error: "All card details are required" },
        { status: 400 }
      );
    }
    
    // Simulate payment processing
    // In production, integrate with payment gateway
    const paymentResult = await processCardPayment({
      cardNumber,
      expiryDate,
      cvv,
      cardholderName,
      amount,
      description: paymentType === 'registration' ? 'Membership Registration' : 'Event Registration'
    });
    
    if (!paymentResult.success) {
      return NextResponse.json(
        { error: paymentResult.message || "Payment failed" },
        { status: 400 }
      );
    }
    
    // Save payment record
    const { data: payment, error } = await supabaseAdmin()
      .from("payments")
      .insert({
        user_id: userId,
        amount: amount,
        payment_type: paymentType,
        status: 'confirmed',
        description: paymentResult.description,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
      
    if (error) {
      console.error("Error saving payment:", error);
      return NextResponse.json(
        { error: "Payment failed to save" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      payment: payment,
      message: "Payment successful"
    });
    
  } catch (error: any) {
    console.error("Card payment error:", error);
    return NextResponse.json(
      { error: error.message || "Payment processing failed" },
      { status: 500 }
    );
  }
}

// Simulated card payment processor
async function processCardPayment(details: any) {
  // In production, integrate with:
  // - Stripe: https://stripe.com
  // - PesaPal: https://pesapal.com
  // - Flutterwave: https://flutterwave.com
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate successful payment
  // Random success/failure for testing
  const success = Math.random() > 0.1; // 90% success rate
  
  if (success) {
    return {
      success: true,
      message: "Payment approved",
      description: `${details.description} - Card payment`,
      transactionId: `CARD-${Date.now()}`
    };
  } else {
    return {
      success: false,
      message: "Payment declined. Please try a different card."
    };
  }
}