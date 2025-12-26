import sql from '@/app/api/utils/sql';
import { NextRequest, NextResponse } from 'next/server';

// GET all orders
export async function GET(request: NextRequest) {
  try {
    const orders = await sql`
      SELECT o.*, u.full_name, u.email, u.membership_number
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `;

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" }, 
      { status: 500 }
    );
  }
}

// POST create order
export async function POST(request: NextRequest) {
  try {
    const { user_id, items, total } = await request.json();

    if (!items || items.length === 0 || !total) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const itemsJson = JSON.stringify(items);
    
    const newOrders = await sql`
      INSERT INTO orders (user_id, items, total, status)
      VALUES (${user_id || null}, ${itemsJson}, ${total}, 'pending')
      RETURNING *
    `;

    return NextResponse.json(newOrders[0], { status: 201 });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Failed to create order" }, 
      { status: 500 }
    );
  }
}