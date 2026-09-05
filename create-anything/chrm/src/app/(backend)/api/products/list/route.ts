// app/api/products/list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    // Add cache-busting headers
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    };

    // Fetch all products - ONLY columns that exist in your table
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        base_price,
        category,
        is_out_of_stock
      `)
      .order('name', { ascending: true }); // Using name instead of sort_order

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500, headers }
      );
    }

    // Fetch variants for all products - ONLY columns that exist
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
        image_url
      `)
      .order('color_name', { ascending: true });

    if (variantsError) {
      console.error('Error fetching variants:', variantsError);
      return NextResponse.json(
        { error: 'Failed to fetch product variants' },
        { status: 500, headers }
      );
    }

    // Transform data to match frontend expectations
    const productsWithVariants = products.map(product => {
      const productVariants = variants?.filter(v => v.product_id === product.id) || [];
      
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        base_price: product.base_price,
        category: product.category,
        is_out_of_stock: product.is_out_of_stock || false,
        variants: productVariants.map((variant: any) => ({
          id: variant.id,
          color_name: variant.color_name,
          color_value: variant.color_value,
          color_hex: variant.color_hex,
          size: variant.size,
          stock_quantity: variant.stock_quantity || 0,
          is_available: variant.is_available !== false,
          image_url: variant.image_url,
        })),
      };
    });

    console.log(`✅ Found ${productsWithVariants.length} products with variants`);

    return NextResponse.json({
      success: true,
      products: productsWithVariants,
      count: productsWithVariants.length
    }, { headers });

  } catch (error) {
    console.error('Error in products list API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}