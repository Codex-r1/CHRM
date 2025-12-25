import { NextRequest, NextResponse } from 'next/server';
import  sql  from '../utils/sql'

// Define Payment type
type Payment = {
  id: number;
  user_id: number;
  amount: number;
  payment_type: string;
  reference_code: string | null;
  status: "pending" | "confirmed" | "rejected";
  details: any;
  created_at: string;
  full_name?: string;
  email?: string;
  membership_number?: string;
};

// Create Payment Request type
type CreatePaymentRequest = {
  user_id: number;
  amount: number;
  payment_type: string;
  reference_code?: string;
  details?: any;
};

export async function GET(request: NextRequest) {
  try {
    const payments = await sql`
      SELECT p.*, u.full_name, u.email, u.membership_number
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    ` as Payment[];

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Get payments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 },
    );
  }
}

// Create payment record
export async function POST(request: NextRequest) {
  try {
    const { user_id, amount, payment_type, reference_code, details }: CreatePaymentRequest = await request.json();

    if (!user_id || !amount || !payment_type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const newPayments = await sql`
      INSERT INTO payments (user_id, amount, payment_type, reference_code, status, details)
      VALUES (${user_id}, ${amount}, ${payment_type}, ${reference_code || null}, 'pending', ${JSON.stringify(details || {})})
      RETURNING *
    ` as Payment[];

    if (!Array.isArray(newPayments) || newPayments.length === 0) {
      throw new Error("Failed to create payment");
    }

    return NextResponse.json(newPayments[0]);
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 },
    );
  }
}