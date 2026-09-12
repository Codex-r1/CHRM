// app/api/payments/paypal/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

const PAYPAL_API_BASE =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

// PayPal-supported currencies (full list: https://developer.paypal.com/api/rest/reference/currency-codes/)
const PAYPAL_SUPPORTED_CURRENCIES = [
  "USD", "EUR", "GBP", "AUD", "CAD", "JPY", "CNY", "CHF",
  "HKD", "SGD", "NZD", "SEK", "NOK", "DKK", "PLN", "MXN",
  "BRL", "ILS", "MYR", "PHP", "TWD", "THB", "CZK", "HUF",
  "RUB", "ZAR", "INR",
];

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing PayPal credentials");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`PayPal auth failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

export async function POST(request: Request) {
  try {
    const { amount, currency = "USD", description, returnUrl, cancelUrl } =
      await request.json();

    // ─── Validate currency ──────────────────────────────────────────────
    const currencyCode = (currency || "USD").toUpperCase();

    if (!PAYPAL_SUPPORTED_CURRENCIES.includes(currencyCode)) {
      return NextResponse.json(
        {
          error: `PayPal does not support ${currencyCode}. Please pay in USD or use M-PESA.`,
          code: "CURRENCY_NOT_SUPPORTED",
        },
        { status: 400 }
      );
    }

    // ─── Validate amount ────────────────────────────────────────────────
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    // PayPal requires a string with 2 decimals
    const formattedAmount = numericAmount.toFixed(2);

    const accessToken = await getPayPalAccessToken();

    const payload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currencyCode,
            value: formattedAmount,
          },
          description: description || "Payment",
        },
      ],
      application_context: {
        return_url: returnUrl || "https://example.com/payment-success",
        cancel_url: cancelUrl || "https://example.com/payment-cancel",
        user_action: "PAY_NOW",
        brand_name: "St Andrew's Turi Old Turians",
      },
    };

    console.log("PayPal request payload:", JSON.stringify(payload, null, 2));

    const paypalResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const orderData = await paypalResponse.json();

    if (!paypalResponse.ok) {
      console.error("PayPal API error:", JSON.stringify(orderData, null, 2));
      return NextResponse.json(
        {
          error:
            orderData?.message ||
            orderData?.details?.[0]?.issue ||
            "Failed to create PayPal order",
          details: orderData?.details || null,
        },
        { status: paypalResponse.status }
      );
    }

    const approveUrl = orderData.links?.find(
      (link: { rel: string; href: string }) => link.rel === "approve"
    )?.href;

    return NextResponse.json({
      success: true,
      orderId: orderData.id,
      approveUrl,
    });
  } catch (error: any) {
    console.error("PayPal route error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}