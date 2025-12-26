import sql from '@/app/api/utils/sql';
import { NextRequest, NextResponse } from 'next/server';

// GET single order
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    const orders = await sql`
      SELECT o.*, u.full_name, u.email, u.membership_number
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ${id}
    `;

    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { error: "Order not found" }, 
        { status: 404 }
      );
    }

    return NextResponse.json(orders[0]);
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" }, 
      { status: 500 }
    );
  }
}

// PATCH (update) order
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { status } = await request.json();

    if (
      !status ||
      !["pending", "processing", "shipped", "delivered", "cancelled"].includes(
        status,
      )
    ) {
      return NextResponse.json(
        { error: "Invalid status" }, 
        { status: 400 }
      );
    }

    const updatedOrders = await sql`
      UPDATE orders
      SET status = ${status}
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updatedOrders || updatedOrders.length === 0) {
      return NextResponse.json(
        { error: "Order not found" }, 
        { status: 404 }
      );
    }

    return NextResponse.json(updatedOrders[0]);
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json(
      { error: "Failed to update order" }, 
      { status: 500 }
    );
  }
}

// DELETE order
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const deletedOrders = await sql`
      DELETE FROM orders
      WHERE id = ${id}
      RETURNING *
    `;

    if (!deletedOrders || deletedOrders.length === 0) {
      return NextResponse.json(
        { error: "Order not found" }, 
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Order deleted successfully" }
    );
  } catch (error) {
    console.error("Delete order error:", error);
    return NextResponse.json(
      { error: "Failed to delete order" }, 
      { status: 500 }
    );
  }
}