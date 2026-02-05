import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase/client"; // Update path as needed

// Define User type (update based on your profiles table)
type User = {
  id: string; // Changed from number to string (UUID)
  email: string;
  role: string;
  full_name: string;
  phone_number: string | null; // Changed from 'phone'
  membership_number: string;
  graduation_year: number | null; // Changed from string
  status: string; // Added from profiles
  county?: string;
  course?: string;
  created_at: string;
};

/* =========================
   GET SINGLE USER
========================= */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { data: user, error } = await supabase
      .from('profiles') // Changed from 'users' to 'profiles'
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user as User);
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

/* =========================
   UPDATE USER
========================= */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const updates = await request.json();

    const allowedFields = [
      "full_name",
      "phone_number", // Changed from 'phone'
      "graduation_year",
      "course",
      "county",
      "status"
    ];

    // Filter updates to only allowed fields
    const filteredUpdates: any = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = value;
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Add updated_at timestamp
    filteredUpdates.updated_at = new Date().toISOString();

    const { data: updatedUser, error } = await supabase
      .from('profiles') // Changed from 'users' to 'profiles'
      .update(filteredUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error || !updatedUser) {
      console.error("Update error:", error);
      return NextResponse.json(
        { error: error?.message || "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedUser as User);
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}