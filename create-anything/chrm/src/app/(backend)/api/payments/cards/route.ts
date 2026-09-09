export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency = "KES", cardDetails, customerEmail } = body;

    // Sanity check for environment variables inside handler to prevent build failures
    const apiKey = process.env.CARD_PAYMENT_API_KEY || process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Payment Gateway API keys are missing on server." },
        { status: 500 }
      );
    }

    const cleanCardNumber = cardDetails.cardNumber.replace(/\s/g, "");

    // Example payload for payment gateway integration
    const paymentPayload = {
      amount,
      currency,
      email: customerEmail,
      card: {
        number: cleanCardNumber,
        exp_month: cardDetails.expiryDate.split("/")[0],
        exp_year: `20${cardDetails.expiryDate.split("/")[1]}`,
        cvc: cardDetails.cvv,
        name: cardDetails.cardholderName,
      },
    };

    // Simulate/Call payment gateway endpoint
    // Replace this section with your actual merchant provider API call (e.g. Stripe, DPO Group, IPay, Pesapal)
    const isSuccess = cleanCardNumber.length >= 15; // Example validation check

    if (!isSuccess) {
      return NextResponse.json(
        { error: "Card transaction declined by issuing bank." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      transactionId: `TXN_CARD_${Date.now()}`,
      status: "COMPLETED",
      message: "Card payment processed successfully.",
    });
  } catch (error: any) {
    console.error("Card Payment Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process card payment." },
      { status: 500 }
    );
  }
}