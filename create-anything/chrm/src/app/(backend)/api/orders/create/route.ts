// app/api/orders/create/route.ts
// Creates a pending shop order for the signed-in member. Prices, the order total and the
// customer's identity all come from the server: the browser only says what it wants.
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/(backend)/lib/supabase/admin";
import { getSessionUser } from "@/app/(backend)/lib/auth/session";
import {
  MAX_ITEM_QUANTITY,
  MAX_ORDER_LINES,
  SHIPPING_PRICES_KES,
  type ShippingMethodId,
} from "@/app/(backend)/lib/shop/pricing";

const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export async function POST(request: Request) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Please log in to place an order." }, { status: 401 });
    }
    if (session.user.role === "admin") {
      return NextResponse.json({ error: "Admin accounts can't place shop orders. Please use a member account." }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const rawItems: unknown = body?.items;
    if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > MAX_ORDER_LINES) {
      return NextResponse.json({ error: "Your basket is empty or too large." }, { status: 400 });
    }

    const shippingMethod = String(body?.shipping_method || "") as ShippingMethodId;
    if (!(shippingMethod in SHIPPING_PRICES_KES)) {
      return NextResponse.json({ error: "Please choose a delivery option." }, { status: 400 });
    }

    // Merge duplicate lines and validate quantities.
    const wanted = new Map<string, number>();
    for (const raw of rawItems as Array<Record<string, unknown>>) {
      const variantId = String(raw?.variant_id || "");
      const qty = Number(raw?.quantity);
      if (!variantId || !Number.isInteger(qty) || qty < 1 || qty > MAX_ITEM_QUANTITY) {
        return NextResponse.json({ error: "One of the basket items is invalid." }, { status: 400 });
      }
      wanted.set(variantId, (wanted.get(variantId) || 0) + qty);
    }

    const admin = supabaseAdmin();
    const { data: variants, error: variantError } = await admin
      .from("product_variants")
      .select("id, product_id, color_name, size, stock_quantity, is_available, products ( id, name, base_price, is_active, is_out_of_stock )")
      .in("id", Array.from(wanted.keys()));

    if (variantError) {
      console.error("Order variant lookup failed:", variantError);
      return NextResponse.json({ error: "We couldn't check your basket. Please try again." }, { status: 500 });
    }

    const items: Array<Record<string, unknown>> = [];
    let subtotal = 0;
    for (const [variantId, quantity] of wanted) {
      const variant: any = variants?.find((v) => v.id === variantId);
      const product = Array.isArray(variant?.products) ? variant.products[0] : variant?.products;
      if (!variant || !product || product.is_active === false || product.is_out_of_stock || variant.is_available === false) {
        return NextResponse.json({ error: "An item in your basket is no longer available. Please review your basket." }, { status: 409 });
      }
      if (Number(variant.stock_quantity) < quantity) {
        return NextResponse.json({ error: `Only ${variant.stock_quantity} left of ${product.name} (${variant.size}). Please update your basket.` }, { status: 409 });
      }
      const price = Number(product.base_price);
      subtotal += price * quantity;
      items.push({
        variant_id: variant.id,
        product_id: product.id,
        name: product.name,
        color_name: variant.color_name,
        size: variant.size,
        price,
        quantity,
      });
    }

    const shippingCost = SHIPPING_PRICES_KES[shippingMethod];
    const total = subtotal + shippingCost;

    const customerName = text(body?.customer_name, 120) || session.user.full_name || "";
    const customerPhone = text(body?.customer_phone, 20);
    const customerEmail = session.user.email;
    const shippingAddress = shippingMethod === "pickup" ? "Pickup from School" : text(body?.shipping_address, 300);
    if (!customerName || !customerPhone || !shippingAddress) {
      return NextResponse.json({ error: "Please complete your contact and delivery details." }, { status: 400 });
    }

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        user_id: session.user.id,
        items,
        total,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        shipping_address: shippingAddress,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select("id, total, status")
      .single();

    if (orderError || !order) {
      console.error("Order insert failed:", orderError);
      return NextResponse.json({ error: "We couldn't create your order. Please try again." }, { status: 500 });
    }

    // Reserve stock for the order.
    for (const item of items) {
      const variant: any = variants!.find((v) => v.id === item.variant_id);
      const newStock = Math.max(0, Number(variant.stock_quantity) - Number(item.quantity));
      const { error: updateError } = await admin.from("product_variants").update({ stock_quantity: newStock }).eq("id", variant.id);
      if (updateError) console.error("Stock update error:", updateError);
    }

    return NextResponse.json({ success: true, order: { id: order.id, total: order.total, status: order.status } });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
