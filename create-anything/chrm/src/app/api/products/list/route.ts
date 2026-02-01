import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    // Fetch all active products with their variants
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        base_price,
        category,
        is_active,
        is_out_of_stock,
        featured_image_url,
        sort_order
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    // Fetch variants for all products
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select(`
        id,
        product_id,
        color_name,
        color_value,
        color_hex,
        size,
        stock_quantity,
        is_available,
        image_url,
        sku,
        price_adjustment
      `)
      .order('color_name', { ascending: true });

    if (variantsError) {
      console.error('Error fetching variants:', variantsError);
      return NextResponse.json(
        { error: 'Failed to fetch product variants' },
        { status: 500 }
      );
    }

    // Combine products with their variants
    const productsWithVariants = products.map(product => ({
      ...product,
      variants: variants?.filter(v => v.product_id === product.id) || []
    }));

    return NextResponse.json({
      success: true,
      products: productsWithVariants,
      count: productsWithVariants.length
    });

  } catch (error) {
    console.error('Error in products list API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}