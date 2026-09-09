// app/api/orders/create/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/(backend)/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, items, total, customer_name, customer_phone, customer_email, shipping_address, status } = body;

    // Start a transaction
    const { data: order, error: orderError } = await supabaseAdmin()
      .from("orders")
      .insert({
        user_id,
        items,
        total,
        customer_name,
        customer_phone,
        customer_email,
        shipping_address,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // Deduct inventory for each item
    for (const item of items) {
      // Get current variant
      const { data: variant, error: variantError } = await supabaseAdmin()
        .from("product_variants")
        .select("stock_quantity")
        .eq("id", item.variant_id)
        .single();

      if (variantError) {
        console.error("Variant fetch error:", variantError);
        continue;
      }

      const newStock = Math.max(0, variant.stock_quantity - item.quantity);

      // Update stock
      const { error: updateError } = await supabaseAdmin()
        .from("product_variants")
        .update({ stock_quantity: newStock })
        .eq("id", item.variant_id);

      if (updateError) {
        console.error("Stock update error:", updateError);
      }

      // If stock reaches 0, mark product as out of stock
      if (newStock === 0) {
        await supabaseAdmin()
          .from("products")
          .update({ is_out_of_stock: true })
          .eq("id", item.product_id);
      }
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}