// app/api/admin/users/[id]/route.ts
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

export async function GET(
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

    const { data: user, error: fetchError } = await supabase
      .from('profiles')
      .select(`
        *,
        memberships (
          start_date,
          expiry_date,
          is_active
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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

    // IMPORTANT: Only allow status updates, NOT role changes
    if (!status || !['pending', 'active', 'expired', 'inactive'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: pending, active, expired, or inactive' },
        { status: 400 }
      );
    }

    // Get the current user
    const { data: currentUser, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent modifying admin accounts
    if (currentUser.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot modify admin accounts' },
        { status: 403 }
      );
    }

    // Update user status ONLY (no role changes allowed)
    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('User update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user status' },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_id: admin.id,
      action: 'update_user_status',
      details: {
        user_id: id,
        user_email: currentUser.email,
        old_status: currentUser.status,
        new_status: status
      }
    });

    return NextResponse.json({
      success: true,
      message: `User status updated to ${status}`,
      user: updatedUser
    });

  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Get the current user
    const { data: currentUser, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deleting admin accounts
    if (currentUser.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot delete admin accounts' },
        { status: 403 }
      );
    }

    // Soft delete - just deactivate the user
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('User deactivate error:', updateError);
      return NextResponse.json(
        { error: 'Failed to deactivate user' },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_id: admin.id,
      action: 'deactivate_user',
      details: {
        user_id: id,
        user_email: currentUser.email,
        user_name: currentUser.full_name
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}