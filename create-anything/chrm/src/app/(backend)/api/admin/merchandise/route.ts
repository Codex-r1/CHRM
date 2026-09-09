import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/(backend)/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: userError } = await supabaseAdmin().auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: products, error } = await supabaseAdmin()
      .from("products")
      .select(`
        *,
        product_variants (*),
        product_images (*)
      `)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching products:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: userError } = await supabaseAdmin().auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Insert product
    const { data: product, error: productError } = await supabaseAdmin()
      .from("products")
      .insert({
        name: body.name,
        description: body.description,
        base_price: body.base_price,
        category: body.category,
        featured_image_url: body.featured_image_url,
        is_active: body.is_active,
        is_out_of_stock: body.is_out_of_stock,
      })
      .select()
      .single();

    if (productError) {
      console.error("Error creating product:", productError);
      return NextResponse.json(
        { error: "Failed to create product" },
        { status: 500 }
      );
    }

    // Insert variants if any
    if (body.variants && body.variants.length > 0) {
      const variants = body.variants.map((v: any) => ({
        ...v,
        product_id: product.id,
      }));

      const { error: variantError } = await supabaseAdmin()
        .from("product_variants")
        .insert(variants);

      if (variantError) {
        console.error("Error creating variants:", variantError);
        // Delete the product if variants fail
        await supabaseAdmin().from("products").delete().eq("id", product.id);
        return NextResponse.json(
          { error: "Failed to create variants" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ product });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}