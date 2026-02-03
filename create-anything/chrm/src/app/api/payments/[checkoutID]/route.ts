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

    console.log('========================================');
    console.log('PAYMENT STATUS CHECK');
    console.log('Checkout Request ID:', checkoutID);
    console.log('Verify User:', verifyUser);
    console.log('========================================');

    // First, try to find payment by checkout_request_id
    console.log('Looking for payment with checkout_request_id:', checkoutID);
    
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*, profiles:user_id(*)')
      .eq('checkout_request_id', checkoutID)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found by checkout_request_id:', paymentError);
      
      // Try alternative: search in callback_data
      const { data: paymentByCallback } = await supabaseAdmin
        .from('payments')
        .select('*, profiles:user_id(*)')
        .ilike('checkout_request_id', `%${checkoutID}%`)
        .maybeSingle();

      if (!paymentByCallback) {
        console.error('Payment not found at all');
        return NextResponse.json({
          status: 'not_found',
          message: 'Payment not found',
          checkout_request_id: checkoutID
        }, { status: 404 });
      }
      
      console.log('Found payment via callback data search');
      return handlePaymentResponse(paymentByCallback, verifyUser);
    }

    console.log('Payment found:', {
      id: payment.id,
      status: payment.status,
      user_id: payment.user_id,
      payment_type: payment.payment_type
    });

    return handlePaymentResponse(payment, verifyUser);

  } catch (error) {
    console.error('Error in payment status check:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handlePaymentResponse(payment: any, verifyUser: boolean) {
  const response: any = {
    status: payment.status || 'unknown',
    payment_id: payment.id,
    amount: payment.amount,
    payment_type: payment.payment_type,
    checkout_request_id: payment.checkout_request_id,
    mpesa_receipt_number: payment.mpesa_receipt_number,
    created_at: payment.created_at,
    paid_at: payment.paid_at,
    user_id: payment.user_id
  };

  console.log('Basic payment data:', {
    status: payment.status,
    user_id: payment.user_id,
    has_profile: !!payment.profiles
  });

  // If payment is confirmed and we need to verify user creation
  if (verifyUser && payment.status === 'confirmed') {
    console.log('Verifying user creation...');
    
    if (payment.user_id) {
      try {
        // Check if user exists in auth
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(payment.user_id);
        
        console.log('Auth user check:', {
          has_user: !!authUser,
          auth_error: authError?.message,
          user_id: payment.user_id
        });

        // Check if profile exists
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, status, membership_number, email')
          .eq('id', payment.user_id)
          .single();

        console.log('Profile check:', {
          has_profile: !!profile,
          profile_status: profile?.status,
          membership_number: profile?.membership_number
        });

        response.user_created = !!(authUser && profile);
        response.user_id = payment.user_id;
        response.profile_status = profile?.status;
        response.membership_number = profile?.membership_number;
        response.email = profile?.email;
        
        // For registration payments, check if membership exists
        if (payment.payment_type === 'registration' && payment.user_id) {
          const { data: membership } = await supabaseAdmin
            .from('memberships')
            .select('id, is_active, expiry_date')
            .eq('user_id', payment.user_id)
            .maybeSingle();
          
          console.log('Membership check:', {
            has_membership: !!membership,
            is_active: membership?.is_active
          });
          
          response.membership_created = !!membership;
          response.membership_active = membership?.is_active;
          response.membership_expiry = membership?.expiry_date;
        }
      } catch (verificationError) {
        console.error('User verification error:', verificationError);
        response.user_created = false;
        response.verification_error = verificationError instanceof Error ? verificationError.message : 'Unknown';
      }
    } else {
      console.log('No user_id associated with payment');
      response.user_created = false;
      response.reason = 'No user_id linked to payment';
    }
  }

  console.log('Final response:', response);
  return NextResponse.json(response);
}