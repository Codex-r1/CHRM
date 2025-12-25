import { NextRequest, NextResponse } from 'next/server';
import sql from "../../utils/sql";
import bcrypt from "bcryptjs";

// Define types
type User = {
  id: number;
  email: string;
  password_hash: string;
  role: string;
  full_name: string;
  membership_number: string;
  membership_paid: boolean;
  membership_expiry: string | null;
};

type LoginRequest = {
  email: string;
  password: string;
};

type LoginResponse = {
  id: number;
  email: string;
  role: string;
  full_name: string;
  membership_number: string;
  membership_paid: boolean;
  membership_expiry: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const { email, password }: LoginRequest = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Get user from database
    const users = await sql<User[]>`
      SELECT id, email, password_hash, role, full_name, membership_number, membership_paid, membership_expiry
      FROM users
      WHERE email = ${email}
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const user = users[0];

    // Verify password with bcrypt
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Return user data (password_hash excluded)
    const response: LoginResponse = {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      membership_number: user.membership_number,
      membership_paid: user.membership_paid,
      membership_expiry: user.membership_expiry,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed" }, 
      { status: 500 }
    );
  }
}