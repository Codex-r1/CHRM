//app/api/events/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/admin';
import { sendEmail } from '../../../lib/email/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
    if (!event_id || !attendee_name || !attendee_email || !attendee_phone || !payment_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if event exists and has capacity
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', event_id)
      .eq('is_active', true)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found or inactive' },
        { status: 404 }
      );
    }

    // Check capacity
    if (event.max_attendees && event.current_attendees >= event.max_attendees) {
      return NextResponse.json(
        { error: 'Event is fully booked' },
        { status: 400 }
      );
    }

    // Check if user already registered
    if (user_id) {
      const { data: existingRegistration } = await supabaseAdmin
        .from('event_registrations')
        .select('id')
        .eq('event_id', event_id)
        .eq('user_id', user_id)
        .single();

      if (existingRegistration) {
        return NextResponse.json(
          { error: 'You are already registered for this event' },
          { status: 400 }
        );
      }
    }

    // Create registration
    const { data: registration, error: regError } = await supabaseAdmin
      .from('event_registrations')
      .insert({
        user_id: user_id || null,
        event_id,
        payment_id,
        attendee_name,
        attendee_email,
        attendee_phone,
        membership_number: membership_number || null,
        is_member: is_member || false
      })
      .select()
      .single();

    if (regError) {
      console.error('Registration error:', regError);
      return NextResponse.json(
        { error: 'Failed to create registration' },
        { status: 500 }
      );
    }

    // Increment event attendees count
    await supabaseAdmin
      .from('events')
      .update({
        current_attendees: event.current_attendees + 1
      })
      .eq('id', event_id);

    // Send confirmation email
    try {
      await sendEmail({
        to: attendee_email,
        type: 'event_registration',
        data: {
          name: attendee_name,
          event_name: event.name,
          event_date: new Date(event.event_date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          event_location: event.location || 'TBA',
          event_time: event.event_time || 'TBA'
        }
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      registration,
      message: 'Event registration successful'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}