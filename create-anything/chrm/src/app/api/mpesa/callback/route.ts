// app/api/mpesa/callback/route.ts - DEBUG VERSION
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase/admin';

export async function POST(req: NextRequest) {
  console.log('🎯 M-PESA CALLBACK RECEIVED AT:', new Date().toISOString());
  
  try {
    const body = await req.json();
    
    console.log('📦 RAW CALLBACK BODY:');
    console.log(JSON.stringify(body, null, 2));
    
    // Save the raw callback for debugging
    await supabaseAdmin
      .from('callback_logs')
      .insert({
        raw_data: body,
        received_at: new Date().toISOString()
      });
    
    // Parse the callback
    const { Body } = body;
    const stkCallback = Body?.stkCallback;
    
    if (!stkCallback) {
      console.error('❌ No stkCallback found');
      return NextResponse.json({ 
        ResultCode: 1,
        ResultDesc: 'Invalid callback data' 
      });
    }
    
    const { 
      MerchantRequestID, 
      CheckoutRequestID, 
      ResultCode, 
      ResultDesc, 
      CallbackMetadata 
    } = stkCallback;
    
    console.log('🔍 Parsed Callback Data:');
    console.log('- CheckoutRequestID:', CheckoutRequestID);
    console.log('- ResultCode:', ResultCode);
    console.log('- ResultDesc:', ResultDesc);
    
    // Find the payment
    console.log('🔎 Searching for payment...');
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('checkout_request_id', CheckoutRequestID)
      .single();
    
    if (error || !payment) {
      console.error('❌ Payment not found:', error);
      console.error('CheckoutRequestID:', CheckoutRequestID);
      
      // Try alternative search
      const { data: allPayments } = await supabaseAdmin
        .from('payments')
        .select('checkout_request_id, status')
        .order('created_at', { ascending: false })
        .limit(5);
      
      console.log('Recent payments:', allPayments);
      
      return NextResponse.json({ 
        ResultCode: 1,
        ResultDesc: 'Payment not found',
        searched_id: CheckoutRequestID
      });
    }
    
    console.log('✅ Payment found:', {
      id: payment.id,
      current_status: payment.status,
      checkout_id: payment.checkout_request_id
    });
    
    // Check if payment already confirmed
    if (payment.status === 'confirmed') {
      console.log('ℹ️ Payment already confirmed');
      return NextResponse.json({ 
        ResultCode: 0,
        ResultDesc: 'Already processed' 
      });
    }
    
    // Process based on ResultCode
    if (Number(ResultCode) === 0) {
      console.log('💰 Payment successful! Updating to confirmed...');
      
      // Extract M-PESA receipt number
      let mpesaReceiptNumber = null;
      if (CallbackMetadata?.Item) {
        const receiptItem = CallbackMetadata.Item.find((item: any) => 
          item.Name === 'MpesaReceiptNumber' || item.Name === 'MpesaReceiptNumber'
        );
        mpesaReceiptNumber = receiptItem?.Value;
        console.log('📝 M-PESA Receipt:', mpesaReceiptNumber);
      }
      
      // Update payment
      const updateData = {
        status: 'confirmed',
        mpesa_receipt_number: mpesaReceiptNumber,
        paid_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        callback_data: body
      };
      
      console.log('🔄 Updating payment with:', updateData);
      
      const { data: updatedPayment, error: updateError } = await supabaseAdmin
        .from('payments')
        .update(updateData)
        .eq('id', payment.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Update failed:', updateError);
        return NextResponse.json({ 
          ResultCode: 1,
          ResultDesc: 'Database update failed' 
        });
      }
      
      console.log('✅ Payment updated successfully!');
      console.log('New status:', updatedPayment?.status);
      
      // Now trigger user creation for registration payments
      if (payment.payment_type === 'registration' && !payment.user_id) {
        console.log('👤 Triggering user creation for registration...');
        try {
          const activationResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/activate`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                checkoutRequestID: CheckoutRequestID,
                paymentType: 'registration'
              })
            }
          );
          
          const activationResult = await activationResponse.json();
          console.log('User creation result:', activationResult);
        } catch (activationError) {
          console.error('User creation failed:', activationError);
        }
      }
      
    } else {
      console.log('❌ Payment failed with ResultCode:', ResultCode);
      
      await supabaseAdmin
        .from('payments')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
          callback_data: body
        })
        .eq('id', payment.id);
    }
    
    console.log('✅ Callback processing complete');
    return NextResponse.json({ 
      ResultCode: 0,
      ResultDesc: 'Accepted' 
    });
    
  } catch (error) {
    console.error('💥 CALLBACK ERROR:', error);
    return NextResponse.json({ 
      ResultCode: 1,
      ResultDesc: 'Internal server error' 
    }, { status: 500 });
  }
}