// app/api/payments/[checkoutID]/route.ts
// Payment status polled by the browser after an M-PESA or card payment starts.
// Anyone holding the checkout id can call this, so it returns the status only:
// no names, emails, phone numbers or account ids.
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { supabaseAdmin } from '@/app/(backend)/lib/supabase/admin';

export async function GET(_request: NextRequest, { params }: { params: { checkoutID: string } }) {
  const checkoutID = String(params.checkoutID || '');
  if (!/^[A-Za-z0-9_\-]{6,80}$/.test(checkoutID)) {
    return NextResponse.json({ status: 'not_found' }, { status: 404 });
  }

  try {
    const { data: payment } = await supabaseAdmin()
      .from('payments')
      .select('status, payment_type, receipt_number')
      .eq('checkout_request_id', checkoutID)
      .maybeSingle();

    if (!payment) return NextResponse.json({ status: 'not_found' }, { status: 404 });

    return NextResponse.json(
      {
        status: payment.status,
        payment_type: payment.payment_type,
        receipt_number: payment.status === 'confirmed' ? payment.receipt_number : null,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Payment status check failed:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
