import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/admin';

// GET single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        product_variants(*),
        product_images(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      name,
      description,
      base_price,
      category,
      is_active,
      is_out_of_stock,
      featured_image_url,
      variants,
      images
    } = body;

    // Update product
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (base_price !== undefined) updateData.base_price = parseFloat(base_price);
    if (category !== undefined) updateData.category = category;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_out_of_stock !== undefined) updateData.is_out_of_stock = is_out_of_stock;
    if (featured_image_url !== undefined) updateData.featured_image_url = featured_image_url;

    // Generate new slug if name changed
    if (name) {
      updateData.slug = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating product:', updateError);
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }

    // Update variants if provided
    if (variants && Array.isArray(variants)) {
      // First, delete existing variants
      await supabaseAdmin
        .from('product_variants')
        .delete()
        .eq('product_id', id);

      // Insert new variants
      if (variants.length > 0) {
        const variantsWithProductId = variants.map((variant: any) => ({
          ...variant,
          product_id: id
        }));

        const { error: variantsError } = await supabaseAdmin
          .from('product_variants')
          .insert(variantsWithProductId);

        if (variantsError) {
          console.error('Error updating variants:', variantsError);
        }
      }
    }

    // Update images if provided
    if (images && Array.isArray(images)) {
      // Delete existing images
      await supabaseAdmin
        .from('product_images')
        .delete()
        .eq('product_id', id);

      // Insert new images
      if (images.length > 0) {
        const imagesWithProductId = images.map((image: any, index: number) => ({
          ...image,
          product_id: id,
          sort_order: image.sort_order || index
        }));

        const { error: imagesError } = await supabaseAdmin
          .from('product_images')
          .insert(imagesWithProductId);

        if (imagesError) {
          console.error('Error updating images:', imagesError);
        }
      }
    }

    // Fetch updated product
    const { data: product, error: fetchError } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        product_variants(*),
        product_images(*)
      `)
      .eq('id', id)
      .single();

    return NextResponse.json({
      product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Soft delete by setting is_active to false
    const { error } = await supabaseAdmin
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Product deactivated successfully'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}