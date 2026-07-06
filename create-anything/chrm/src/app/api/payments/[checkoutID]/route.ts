// app/api/payments/[checkoutID]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { checkoutID: string } }
) {
  try {
    const checkoutID = params.checkoutID;
    const searchParams = request.nextUrl.searchParams;
    const verifyUser = searchParams.get('verify_user') === 'true';

    console.log('PAYMENT STATUS CHECK');
    console.log(' Checkout Request ID:', checkoutID);
    console.log(' Verify User:', verifyUser);

    // Find the payment by checkout_request_id
    console.log(' Looking for payment with checkout_request_id:', checkoutID);
    
    const { data: payment, error: paymentError } = await supabaseAdmin()
      .from('payments')
      .select('*')
      .eq('checkout_request_id', checkoutID)
      .maybeSingle();

    if (paymentError || !payment) {
      console.error(' Payment not found:', paymentError);
      return NextResponse.json({
        status: 'not_found',
        message: 'Payment not found',
        checkout_request_id: checkoutID
      }, { status: 404 });
    }

    console.log(' Payment found:', {
      id: payment.id,
      status: payment.status,
      user_id: payment.user_id,
      payment_type: payment.payment_type,
      receipt_number: payment.receipt_number,
      paid_at: payment.paid_at,
      is_temp: payment.metadata?.is_temp
    });

    // Build response
    const response: any = {
      status: payment.status,
      payment_id: payment.id,
      amount: payment.amount,
      payment_type: payment.payment_type,
      checkout_request_id: payment.checkout_request_id,
      receipt_number: payment.receipt_number,
      created_at: payment.created_at,
      paid_at: payment.paid_at || payment.confirmed_at,
      user_id: payment.user_id
    };

    // If payment is confirmed and we need to verify user
    if (payment.status === 'confirmed' && verifyUser) {
      console.log(' Verifying user creation...');
      
      if (payment.user_id) {
        try {
          // Check profile
          const { data: profile } = await supabaseAdmin()
            .from('profiles')
            .select('id, status, membership_number, email, is_active')
            .eq('id', payment.user_id)
            .single();

          console.log('👤 Profile check:', {
            has_profile: !!profile,
            profile_status: profile?.status,
            membership_number: profile?.membership_number,
            is_active: profile?.is_active
          });

          response.user_created = !!profile;
          response.user_id = payment.user_id;
          response.profile_status = profile?.status;
          response.membership_number = profile?.membership_number;
          response.email = profile?.email;
          response.is_active = profile?.is_active;

          // Check membership if registration
          if (payment.payment_type === 'registration' && payment.user_id) {
            const { data: membership } = await supabaseAdmin()
              .from('memberships')
              .select('id, is_active, expiry_date')
              .eq('user_id', payment.user_id)
              .maybeSingle();
            
            console.log(' Membership check:', {
              has_membership: !!membership,
              is_active: membership?.is_active
            });
            
            response.membership_created = !!membership;
            response.membership_active = membership?.is_active;
            response.membership_expiry = membership?.expiry_date;
          }
          
          console.log('Final response:', response);
          return NextResponse.json(response);
          
        } catch (verificationError) {
          console.error('User verification error:', verificationError);
          response.user_created = false;
          response.verification_error = verificationError instanceof Error ? verificationError.message : 'Unknown';
          return NextResponse.json(response);
        }
      } else {
        console.log(' No user_id associated with payment');
        response.user_created = false;
        response.reason = 'No user_id linked to payment - temporary payment record';
        return NextResponse.json(response);
      }
    }

    console.log('Final response:', response);
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in payment status check:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}