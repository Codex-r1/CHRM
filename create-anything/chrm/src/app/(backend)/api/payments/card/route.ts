// app/api/payments/card/route.ts
export const dynamic = 'force-dynamic';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const { amount, email, name } = await request.json();
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency: 'kes',
    payment_method_types: ['card'],
    metadata: { email, name },
  });
  
  return Response.json({
    clientSecret: paymentIntent.client_secret,
    paymentId: paymentIntent.id,
  });
}