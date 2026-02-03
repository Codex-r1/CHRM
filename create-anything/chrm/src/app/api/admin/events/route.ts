// app/api/admin/events/route.ts
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

// Verify admin authentication
async function verifyAdminAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'Missing or invalid authorization header', admin: null };
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return { error: 'Invalid or expired token', admin: null };
    }

    // Check if user is admin
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

// POST - Create a new event
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const { error: authError, admin } = await verifyAdminAuth(request);
    if (authError || !admin) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    const {
      name,
      description,
      price,
      event_date,
      location,
      member_discount,
      max_attendees,
      image_url,
      is_active,
      status
    } = body;

    if (!name || !description || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, and price are required' },
        { status: 400 }
      );
    }

    // Validate price
    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      );
    }

    // Prepare event data
    const eventData = {
      name,
      description,
      event_date: event_date || null,
      location: location || null,
      price: parseFloat(price.toFixed(2)),
      member_discount: member_discount ? parseInt(member_discount) : 5,
      max_attendees: max_attendees ? parseInt(max_attendees) : null,
      current_attendees: 0,
      image_url: image_url || null,
      is_active: is_active !== undefined ? is_active : true,
      status: status || 'upcoming',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert event into database
    const { data: event, error: insertError } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();

    if (insertError) {
      console.error('Event creation error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create event', details: insertError.message },
        { status: 500 }
      );
    }

    // Log admin action
    await supabase.from('admin_logs').insert({
      admin_id: admin.id,
      action: 'create_event',
      resource_type: 'event',
      resource_id: event.id,
      details: { event_name: name },
      created_at: new Date().toISOString()
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Event created successfully',
        event
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET - Fetch all events (admin view with filters)
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const { error: authError, admin } = await verifyAdminAuth(request);
    if (authError || !admin) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const isActive = searchParams.get('is_active');

    // Build query
    let query = supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: events, error: fetchError } = await query;

    if (fetchError) {
      console.error('Fetch events error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      events: events || [],
      count: events?.length || 0
    });

  } catch (error: any) {
    console.error('Get events error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}