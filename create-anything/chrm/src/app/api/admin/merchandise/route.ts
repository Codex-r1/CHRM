import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/admin';

// GET all products (admin)
export async function GET(request: NextRequest) {
  try {
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        product_variants(*),
        product_images(*)
      `)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      base_price,
      category,
      featured_image_url,
      variants,
      images
    } = body;

    // Validate required fields
    if (!name || !base_price || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Create product
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .insert({
        name,
        slug,
        description,
        base_price: parseFloat(base_price),
        category,
        featured_image_url,
        is_active: true
      })
      .select()
      .single();

    if (productError) {
      console.error('Error creating product:', productError);
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    // Create variants if provided
    if (variants && Array.isArray(variants) && variants.length > 0) {
      const variantsWithProductId = variants.map((variant: any) => ({
        ...variant,
        product_id: product.id,
        price_adjustment: variant.price_adjustment || 0,
        stock_quantity: variant.stock_quantity || 0,
        is_available: variant.is_available !== undefined ? variant.is_available : true
      }));

      const { error: variantsError } = await supabaseAdmin
        .from('product_variants')
        .insert(variantsWithProductId);

      if (variantsError) {
        console.error('Error creating variants:', variantsError);
        // Continue anyway, product was created
      }
    }

    // Create images if provided
    if (images && Array.isArray(images) && images.length > 0) {
      const imagesWithProductId = images.map((image: any, index: number) => ({
        ...image,
        product_id: product.id,
        sort_order: image.sort_order || index,
        is_primary: image.is_primary || false
      }));

      const { error: imagesError } = await supabaseAdmin
        .from('product_images')
        .insert(imagesWithProductId);

      if (imagesError) {
        console.error('Error creating images:', imagesError);
      }
    }

    // Fetch complete product with relationships
    const { data: completeProduct, error: fetchError } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        product_variants(*),
        product_images(*)
      `)
      .eq('id', product.id)
      .single();

    return NextResponse.json(
      { product: completeProduct, message: 'Product created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}