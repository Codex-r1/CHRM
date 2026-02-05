// app/api/admin/payments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function verifyAdminAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'Missing or invalid authorization header', admin: null };
    }

    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return { error: 'Invalid or expired token', admin: null };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return { error: 'Unauthorized: Admin access required', admin: null };
    }

    return { error: null, admin: user };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { error: 'Authentication failed', admin: null };
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error: authError, admin } = await verifyAdminAuth(request);
    if (authError || !admin) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['pending', 'processing', 'confirmed', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: pending, processing, confirmed, or failed' },
        { status: 400 }
      );
    }

    // Get the current payment
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !payment) {
      console.error('Payment fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status,
    };
    if (status === 'confirmed' && payment.status !== 'confirmed') {
      updateData.confirmed_at = new Date().toISOString();
      updateData.paid_at = updateData.paid_at || new Date().toISOString();
    }

    console.log('Updating payment with data:', updateData);

    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Payment update error:', updateError);
      return NextResponse.json(
        { error: `Failed to update payment status: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_id: admin.id,
      action: 'update_payment_status',
      details: {
        payment_id: id,
        old_status: payment.status,
        new_status: status,
        payment_type: payment.payment_type,
        amount: payment.amount
      }
    });

    return NextResponse.json({
      success: true,
      message: `Payment ${status} successfully`,
      payment: updatedPayment
    });

  } catch (error: any) {
    console.error('Update payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}