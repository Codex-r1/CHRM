import { NextRequest, NextResponse } from 'next/server';
import sql from "../../utils/sql";

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

// Define types for route parameters
type RouteParams = {
  params: {
    id: string;
  };
};

// Define update fields type
type UpdateFields = {
  full_name?: string;
  phone?: string;
  membership_paid?: boolean;
  membership_expiry?: string;
};

// Get single user
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    const users = await sql`
      SELECT id, email, role, full_name, phone, membership_number, graduation_year, 
             registration_fee, membership_paid, membership_expiry, created_at
      FROM users
      WHERE id = ${id}
    ` as User[];

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 }
      );
    }

    return NextResponse.json(users[0]);
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" }, 
      { status: 500 }
    );
  }
}

// Update user
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const updates: UpdateFields = await request.json();

    const allowedFields = [
      "full_name",
      "phone",
      "membership_paid",
      "membership_expiry",
    ];
    
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    values.push(id);
    const query = `
      UPDATE users 
      SET ${setClauses.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, email, role, full_name, phone, membership_number, membership_paid, membership_expiry
    `;

    // Note: You need to update your sql utility to handle parameterized queries
    // For now, let's use the simpler approach
    const updatedUsers = await sql(query, ...values) as User[];

    if (!Array.isArray(updatedUsers) || updatedUsers.length === 0) {
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 }
      );
    }

    return NextResponse.json(updatedUsers[0]);
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Failed to update user" }, 
      { status: 500 }
    );
  }
}