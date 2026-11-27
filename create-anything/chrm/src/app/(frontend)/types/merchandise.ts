/** Shapes returned by GET /api/products/list and used by the store + checkout. */
export interface ProductVariant {
  id: string;
  color_name: string;
  color_value: string;
  color_hex: string;
  size: string;
  stock_quantity: number;
  is_available: boolean;
  image_url: string;
}

/** Values allowed by the `products.category` CHECK constraint. */
export type ProductCategory = "tshirt" | "polo" | "hoodie" | "accessory" | "other";

export interface Product {
  id: string;
  name: string;
  base_price: number;
  description: string;
  category: ProductCategory | null;
  is_out_of_stock: boolean;
  featured_image_url: string | null;
  /** Extra gallery images from `product_images`, primary first. */
  images: string[];
  created_at?: string;
  variants: ProductVariant[];
}

export interface CartItem {
  variant_id: string;
  product_id: string;
  name: string;
  price: number;
  color_name: string;
  size: string;
  image: string;
  quantity: number;
  stock_available: number;
}

export interface VariantSelection {
  color: string;
  size: string;
  variant_id: string;
}

export type ShippingMethod = "dhl_express" | "dhl_economy" | "pickup";

export interface ShippingOption {
  id: ShippingMethod;
  label: string;
  price: number;
  time: string;
}

export type StoreCategory = "all" | ProductCategory;

export type ProductSort = "featured" | "newest" | "price-asc" | "price-desc" | "name";
