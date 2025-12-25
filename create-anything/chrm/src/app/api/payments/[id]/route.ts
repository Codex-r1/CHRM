import { NextRequest, NextResponse } from 'next/server';
import sql from "../../utils/sql";

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
};

// Define route parameters
type RouteParams = {
  params: {
    id: string;
  };
};

// Update payment request type
type UpdatePaymentRequest = {
  status: "pending" | "confirmed" | "rejected";
};

// Update payment status
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const { status }: UpdatePaymentRequest = await request.json();

    // Validate status
    const validStatuses = ["pending", "confirmed", "rejected"] as const;
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" }, 
        { status: 400 }
      );
    }

    // Update payment status
    const updatedPayments = await sql`
      UPDATE payments
      SET status = ${status}
      WHERE id = ${id}
      RETURNING *
    ` as Payment[];

    if (!Array.isArray(updatedPayments) || updatedPayments.length === 0) {
      return NextResponse.json(
        { error: "Payment not found" }, 
        { status: 404 }
      );
    }

    const payment = updatedPayments[0];

    // If payment confirmed and it's a registration or renewal, update user membership
    if (status === "confirmed") {
      if (payment.payment_type === "registration" || payment.payment_type === "renewal") {
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        const expiryDateString = expiryDate.toISOString().split("T")[0];

        await sql`
          UPDATE users
          SET membership_paid = true, membership_expiry = ${expiryDateString}
          WHERE id = ${payment.user_id}
        `;
      }
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Update payment error:", error);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 },
    );
  }
}