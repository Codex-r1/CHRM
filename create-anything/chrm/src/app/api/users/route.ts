import { NextRequest, NextResponse } from 'next/server';
import sql from "../utils/sql";


// Define User type
type User = {
  id: number;
  email: string;
  role: string;
  full_name: string;
  phone: string | null;
  membership_number: string;
  graduation_year: string;
  registration_fee: number;
  membership_paid: boolean;
  membership_expiry: string | null;
  created_at: string;
};

export async function GET(request: NextRequest) {
  try {
    // Get all users (admin only)
    const users = await sql`
      SELECT id, email, role, full_name, phone, membership_number, graduation_year, 
             registration_fee, membership_paid, membership_expiry, created_at
      FROM users
      ORDER BY created_at DESC
    ` as User[];

    return NextResponse.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" }, 
      { status: 500 }
    );
  }
}