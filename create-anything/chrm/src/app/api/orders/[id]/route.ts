import sql from '@/app/api/utils/sql';
import { NextRequest } from 'next/server';

type RouteParams = {
  params: {
    id: string;
  };
};

// Update order status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { status } = await request.json();

    if (
      !status ||
      !["pending", "processing", "shipped", "delivered", "cancelled"].includes(
        status,
      )
    ) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedOrders = await sql`
      UPDATE orders
      SET status = ${status}
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updatedOrders || updatedOrders.length === 0) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    return Response.json(updatedOrders[0]);
  } catch (error) {
    console.error("Update order error:", error);
    return Response.json({ error: "Failed to update order" }, { status: 500 });
  }
}

// Add GET single order if needed
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const order = await sql`
      SELECT o.*, u.full_name, u.email, u.membership_number
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ${id}
    `;

    if (!order || order.length === 0) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    return Response.json(order[0]);
  } catch (error) {
    console.error("Get order error:", error);
    return Response.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

// Optional: Add DELETE route
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const deletedOrders = await sql`
      DELETE FROM orders
      WHERE id = ${id}
      RETURNING *
    `;

    if (!deletedOrders || deletedOrders.length === 0) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    return Response.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Delete order error:", error);
    return Response.json({ error: "Failed to delete order" }, { status: 500 });
  }
}