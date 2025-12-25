import { NextRequest, NextResponse } from 'next/server';
import sql from "../../utils/sql";
import bcrypt from "bcryptjs";

// Define types
type RegisterRequest = {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  graduation_year: string;
};

type RegisterResponse = {
  user: {
    id: number;
    email: string;
    role: string;
    full_name: string;
    membership_number: string;
  };
  registration_fee: number;
  paybill_number: string;
  account_number: string;
};

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, phone, graduation_year }: RegisterRequest = await request.json();

    // Validate required fields
    if (!email || !password || !full_name || !graduation_year) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 },
      );
    }

    // Calculate registration fee
    const registration_fee = parseInt(graduation_year) >= 2025 ? 1000 : 1500;

    // Hash password with bcrypt
    const password_hash = await bcrypt.hash(password, 10);

    // Generate membership number
    const membershipNumber = `M-${Date.now()}`;

    // Create user
    const newUsers = await sql<{id: number, email: string, role: string, full_name: string, membership_number: string, registration_fee: number}[]>`
      INSERT INTO users (email, password_hash, full_name, phone, graduation_year, registration_fee, membership_number, role)
      VALUES (${email}, ${password_hash}, ${full_name}, ${phone || null}, ${graduation_year}, ${registration_fee}, ${membershipNumber}, 'member')
      RETURNING id, email, role, full_name, membership_number, registration_fee
    `;

    const user = newUsers[0];

    // Create pending payment record
    await sql`
      INSERT INTO payments (user_id, amount, payment_type, reference_code, status, details)
      VALUES (${user.id}, ${registration_fee}, 'registration', ${"R-" + full_name}, 'pending', ${JSON.stringify({ graduation_year })})
    `;

    const response: RegisterResponse = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        membership_number: user.membership_number,
      },
      registration_fee,
      paybill_number: "263532",
      account_number: `R-${full_name}`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" }, 
      { status: 500 }
    );
  }
}