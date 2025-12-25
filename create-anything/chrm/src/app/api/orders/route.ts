import sql from '@/app/api/utils/sql';
import { NextRequest } from 'next/server';

// Get all orders
export async function GET(request: NextRequest) {
  try {
    // With Neon, queries are async
    const orders = await sql`
      SELECT o.*, u.full_name, u.email, u.membership_number
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `;

    return Response.json(orders);
  } catch (error) {
    console.error("Get orders error:", error);
    return Response.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

// Create order
export async function POST(request: NextRequest) {
  try {
    const { user_id, items, total } = await request.json();

    if (!items || items.length === 0 || !total) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Convert items to JSON string for PostgreSQL
    const itemsJson = JSON.stringify(items);
    
    // With Neon, execute the query
    const newOrders = await sql`
      INSERT INTO orders (user_id, items, total, status)
      VALUES (${user_id || null}, ${itemsJson}, ${total}, 'pending')
      RETURNING *
    `;

    return Response.json(newOrders[0]);
  } catch (error) {
    console.error("Create order error:", error);
    return Response.json({ error: "Failed to create order" }, { status: 500 });
  }
}