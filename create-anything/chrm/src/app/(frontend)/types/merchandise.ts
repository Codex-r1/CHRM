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

export interface Product {
  id: string;
  name: string;
  base_price: number;
  description: string;
  is_out_of_stock: boolean;
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

export type StoreCategory = "all" | "blazers" | "ties" | "publications";
