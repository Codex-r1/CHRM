// app/api/events/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 Registration request body:', body);
    
    const {
      user_id,
      event_id,
      attendee_name,
      attendee_email,
      attendee_phone,
      membership_number,
      is_member,
      payment_id
    } = body;

    // Validate required fields
    if (!event_id) {
      console.error('❌ Missing event_id');
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    if (!attendee_name) {
      console.error('❌ Missing attendee_name');
      return NextResponse.json(
        { error: 'Attendee name is required' },
        { status: 400 }
      );
    }

    if (!attendee_email) {
      console.error('❌ Missing attendee_email');
      return NextResponse.json(
        { error: 'Attendee email is required' },
        { status: 400 }
      );
    }

    if (!attendee_phone) {
      console.error('❌ Missing attendee_phone');
      return NextResponse.json(
        { error: 'Attendee phone is required' },
        { status: 400 }
      );
    }

    console.log('✅ Validated registration data:', {
      event_id,
      attendee_name,
      attendee_email,
      attendee_phone
    });

    // Check if event exists and has capacity
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .eq('is_active', true)
      .single();

    if (eventError || !event) {
      console.error('❌ Event not found:', eventError);
      return NextResponse.json(
        { error: 'Event not found or inactive' },
        { status: 404 }
      );
    }

    console.log('✅ Event found:', event.name);

    // Check capacity
    if (event.max_attendees && event.current_attendees >= event.max_attendees) {
      return NextResponse.json(
        { error: 'Event is fully booked' },
        { status: 400 }
      );
    }

    // Check if user already registered
    if (user_id) {
      const { data: existingRegistration } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', event_id)
        .eq('user_id', user_id)
        .maybeSingle();

      if (existingRegistration) {
        return NextResponse.json(
          { error: 'You are already registered for this event' },
          { status: 400 }
        );
      }
    }

    // Create registration
    const registrationData = {
      user_id: user_id || null,
      event_id: event_id,
      payment_id: payment_id || null,
      attendee_name: attendee_name.trim(),
      attendee_email: attendee_email.trim().toLowerCase(),
      attendee_phone: attendee_phone.trim(),
      membership_number: membership_number || null,
      is_member: is_member || false,
      status: 'confirmed'
    };

    console.log('📝 Creating registration with data:', registrationData);

    const { data: registration, error: regError } = await supabase
      .from('event_registrations')
      .insert(registrationData)
      .select()
      .single();

    if (regError) {
      console.error('❌ Registration error:', regError);
      return NextResponse.json(
        { error: 'Failed to create registration: ' + regError.message },
        { status: 500 }
      );
    }

    console.log('✅ Registration created:', registration.id);

    // Increment event attendees count
    await supabase
      .from('events')
      .update({
        current_attendees: event.current_attendees + 1
      })
      .eq('id', event_id);

    return NextResponse.json({
      success: true,
      registration,
      message: 'Event registration successful'
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}