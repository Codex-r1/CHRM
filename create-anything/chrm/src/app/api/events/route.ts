import sql from "@/app/api/utils/sql";
import { NextRequest } from 'next/server';

// Type definition for Event (adjust based on your database schema)
export interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string; // or Date if you want to parse it
  location: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

// Get all events
export async function GET(request: NextRequest) {
  try {
    // Type the result as Event[]
    const events: Event[] = await sql`
      SELECT * FROM events
      ORDER BY event_date ASC
    `;

    return Response.json(events);
  } catch (error) {
    console.error("Get events error:", error);
    return Response.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

// Optional: POST method for creating events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { title, description, event_date, location } = body;
    
    if (!title || !description || !event_date || !location) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert the new event
    const newEvents = await sql`
      INSERT INTO events (title, description, event_date, location, image_url)
      VALUES (${title}, ${description}, ${event_date}, ${location}, ${body.image_url || null})
      RETURNING *
    `;

    return Response.json(newEvents[0], { status: 201 });
  } catch (error) {
    console.error("Create event error:", error);
    return Response.json({ error: "Failed to create event" }, { status: 500 });
  }
}