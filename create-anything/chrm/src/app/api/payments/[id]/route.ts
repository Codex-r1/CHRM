import { NextRequest, NextResponse } from "next/server";
import sql from "../../utils/sql";

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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { status } = await request.json();

    if (!["pending", "confirmed", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const updatedPayments = await sql`
      UPDATE payments
      SET status = ${status}
      WHERE id = ${id}
      RETURNING *
    ` as Payment[];

    if (!updatedPayments.length) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    const payment = updatedPayments[0];

    if (
      status === "confirmed" &&
      (payment.payment_type === "registration" ||
        payment.payment_type === "renewal")
    ) {
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      await sql`
        UPDATE users
        SET membership_paid = true,
            membership_expiry = ${expiryDate.toISOString()}
        WHERE id = ${payment.user_id}
      `;
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Update payment error:", error);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
  }
}
