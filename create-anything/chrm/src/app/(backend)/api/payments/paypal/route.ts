export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

// Helper to generate a PayPal Access Token
async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing PayPal Credentials in Environment Variables");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(
    process.env.NODE_ENV === "production"
      ? "https://api-m.paypal.com/v1/oauth2/token"
      : "https://api-m.sandbox.paypal.com/v1/oauth2/token",
    {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: Request) {
  try {
    const { amount, currency = "USD", description, returnUrl, cancelUrl } =
      await request.json();

    const accessToken = await getPayPalAccessToken();

    // Create PayPal Order
    const paypalResponse = await fetch(
      process.env.NODE_ENV === "production"
        ? "https://api-m.paypal.com/v2/checkout/orders"
        : "https://api-m.sandbox.paypal.com/v2/checkout/orders",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: currency,
                value: amount.toString(),
              },
              description: description || "St Andrew's Turi Old Turians Payment",
            },
          ],
          application_context: {
            return_url: returnUrl || "https://turi-31v4xkm5s-ronah-abuchelis-projects.vercel.app/payment-success",
            cancel_url: cancelUrl || "https://turi-31v4xkm5s-ronah-abuchelis-projects.vercel.app/payment-cancel",
          },
        }),
      }
    );

    const orderData = await paypalResponse.json();

    if (!paypalResponse.ok) {
      return NextResponse.json(
        { error: orderData.message || "Failed to create PayPal order" },
        { status: paypalResponse.status }
      );
    }

    // Extract approval link
    const approveUrl = orderData.links.find(
      (link: { rel: string; href: string }) => link.rel === "approve"
    )?.href;

    return NextResponse.json({
      success: true,
      orderId: orderData.id,
      approveUrl,
    });
  } catch (error: any) {
    console.error("PayPal API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}