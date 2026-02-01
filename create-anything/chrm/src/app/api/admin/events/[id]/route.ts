// app/api/admin/events/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
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

// GET - Fetch a single event by ID
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

    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select(`
        *,
        event_registrations (
          id,
          user_id,
          registration_date,
          payment_status,
          profiles (
            full_name,
            email,
            phone_number
          )
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      event
    });

  } catch (error: any) {
    console.error('Get event error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update an event
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

    // Validate that event exists
    const { data: existingEvent, error: checkError } = await supabase
      .from('events')
      .select('id, name')
      .eq('id', id)
      .single();

    if (checkError || !existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Prepare update data (only include fields that are provided)
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Optional fields
    if (body.name !== undefined) {
      updateData.name = body.name;
      // Update slug if name changes
      updateData.slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    if (body.description !== undefined) updateData.description = body.description;
    if (body.event_date !== undefined) updateData.event_date = body.event_date;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.member_discount !== undefined) updateData.member_discount = parseInt(body.member_discount);
    if (body.max_attendees !== undefined) updateData.max_attendees = body.max_attendees ? parseInt(body.max_attendees) : null;
    if (body.image_url !== undefined) updateData.image_url = body.image_url;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.status !== undefined) updateData.status = body.status;

    // Update event
    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Event update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update event', details: updateError.message },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_id: admin.id,
      action: 'update_event',
      resource_type: 'event',
      resource_id: id,
      details: { 
        event_name: existingEvent.name,
        updated_fields: Object.keys(updateData)
      },
      created_at: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Event updated successfully',
      event: updatedEvent
    });

  } catch (error: any) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete (deactivate) an event
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

    // Check if event exists
    const { data: existingEvent, error: checkError } = await supabase
      .from('events')
      .select('id, name, current_attendees')
      .eq('id', id)
      .single();

    if (checkError || !existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if event has registrations
    if (existingEvent.current_attendees > 0) {
      // Soft delete - just deactivate
      const { error: deactivateError } = await supabase
        .from('events')
        .update({ 
          is_active: false,
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (deactivateError) {
        return NextResponse.json(
          { error: 'Failed to deactivate event' },
          { status: 500 }
        );
      }

      // Log admin action
      await supabase.from('admin_logs').insert({
        admin_id: admin.id,
        action: 'cancel_event',
        resource_type: 'event',
        resource_id: id,
        details: { 
          event_name: existingEvent.name,
          reason: 'Event cancelled by admin'
        },
        created_at: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        message: 'Event cancelled successfully (has active registrations)'
      });
    } else {
      // No registrations - can do hard delete or soft delete based on preference
      // For safety, we'll still do soft delete
      const { error: deleteError } = await supabase
        .from('events')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (deleteError) {
        return NextResponse.json(
          { error: 'Failed to delete event' },
          { status: 500 }
        );
      }

      // Log admin action
      await supabase.from('admin_logs').insert({
        admin_id: admin.id,
        action: 'delete_event',
        resource_type: 'event',
        resource_id: id,
        details: { event_name: existingEvent.name },
        created_at: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        message: 'Event deleted successfully'
      });
    }

  } catch (error: any) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}