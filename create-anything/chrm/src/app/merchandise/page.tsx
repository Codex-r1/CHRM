"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ShoppingCart, Minus, Plus, CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Define types
type ProductVariant = {
  color: string;
  sizes: string[];
  image: string;
};

type Product = {
  id: number;
  name: string;
  basePrice: number;
  variants: ProductVariant[];
  description: string;
};

type CartItem = {
  id: number;
  name: string;
  price: number;
  color: string;
  size: string;
  image: string;
  quantity: number;
};

type CustomerInfo = {
  full_name: string;
  phone: string;
  email: string;
};

// Color options with their display names and hex codes
const COLORS = [
  { name: "Navy Blue", value: "navy", hex: "#1e3a5f" },
  { name: "White", value: "white", hex: "#ffffff" },
  { name: "Black", value: "black", hex: "#000000" },
  { name: "Red", value: "red", hex: "#dc2626" },
  { name: "Gray", value: "gray", hex: "#6b7280" },
  { name: "Green", value: "green", hex: "#16a34a" },
  { name: "Pink", value: "pink", hex: "#ec4899" },
  { name: "Gold", value: "gold", hex: "#d4af37" },
  { name: "Light Blue", value: "lightblue", hex: "#3b82f6" },
  { name: "Maroon", value: "maroon", hex: "#800000" },
];

// Size options
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "T-Shirt",
    basePrice: 1000,
    description: "Premium cotton CHRMAA t-shirt",
    variants: [
      {
        color: "black",
        sizes: ["S", "M", "L", "XL"],
        image: "/T-SHIRT.jpeg",
      },
      {
        color: "white",
        sizes: ["S", "M", "L", "XL"],
        image: "/T-SHIRT-white.jpeg",
      },
      {
        color: "green",
        sizes: ["S", "M", "L", "XL"],
        image: "/T-SHIRT-black.jpeg",
      },
       {
        color: "blue",
        sizes: ["S", "M", "L", "XL"],
        image: "/T-SHIRT-black.jpeg",
      },
       {
        color: "red",
        sizes: ["S", "M", "L", "XL"],
        image: "/T-SHIRT-black.jpeg",
      },
    ],
  },
  {
    id: 2,
    name: "Polo Shirt",
    basePrice: 1500,
    description: "Professional CHRMAA polo shirt",
    variants: [
      {
        color: "green",
        sizes: ["S", "M", "L", "XL"],
        image: "/POLO.jpeg",
      },
      {
        color: "white",
        sizes: ["S", "M", "L", "XL"],
        image: "/T-SHIRT-white.jpeg",
      },
      {
        color: "black",
        sizes: ["S", "M", "L", "XL"],
        image: "/xx.jpeg",
      },
       {
        color: "blue",
        sizes: ["S", "M", "L", "XL"],
        image: "/T-SHIRT-black.jpeg",
      },
       {
        color: "red",
        sizes: ["S", "M", "L", "XL"],
        image: "/T-SHIRT-black.jpeg",
      },
    ],
  },
  {
    id: 3,
    name: "Hoodie",
    basePrice: 1800,
    description: "Comfortable CHRMAA hoodie",
    variants: [
      {
        color: "pink",
        sizes: ["S", "M", "L", "XL"],
        image: "/Hoodie.jpeg",
      },
      {
        color: "black",
        sizes: ["S", "M", "L", "XL"],
        image: "/Hoodie-black.jpeg",
      },
      {
        color: "gray",
        sizes: ["M", "L", "XL"],
        image: "/Hoodie-gray.jpeg",
      },
       {
        color: "white",
        sizes: ["M", "L", "XL"],
        image: "/Hoodie-gray.jpeg",
      },
      {
        color: "lightblue",
        sizes: ["M", "L", "XL"],
        image: "/Hoodie-gray.jpeg",
      },
      {
        color: "maroon",
        sizes: ["M", "L", "XL"],
        image: "/Hoodie-gray.jpeg",
      },
    ],
  },
  {
    id: 4,
    name: "Lapel Pin",
    basePrice: 1000,
    description: "Elegant CHRMAA lapel pin",
    variants: [
      {
        color: "gold",
        sizes: ["One Size"],
        image: "/Lapel Pin.jpeg",
      },
    ],
  },
];

export default function MerchandisePage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState(1); // 1: shopping, 2: checkout, 3: payment instructions, 4: success
  const [selectedProducts, setSelectedProducts] = useState<
    Record<number, { color: string; size: string }>
  >({});
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    full_name: "",
    phone: "",
    email: "",
  });
  const router = useRouter();

  const getAvailableColors = (productId: number) => {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return [];
    return product.variants.map((v) => v.color);
  };

  const getAvailableSizes = (productId: number, color: string) => {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return [];
    const variant = product.variants.find((v) => v.color === color);
    return variant ? variant.sizes : [];
  };

  const getProductImage = (productId: number, color: string) => {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return "";
    const variant = product.variants.find((v) => v.color === color);
    return variant ? variant.image : product.variants[0].image;
  };

  const getProductPrice = (productId: number) => {
    const product = PRODUCTS.find((p) => p.id === productId);
    return product ? product.basePrice : 0;
  };

  const handleColorSelect = (productId: number, color: string) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        color,
        size: "", // Reset size when color changes
      },
    }));
  };

  const handleSizeSelect = (productId: number, size: string) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        size,
      },
    }));
  };

  const addToCart = (productId: number) => {
    const selection = selectedProducts[productId];
    if (!selection || !selection.color || !selection.size) {
      alert("Please select both color and size before adding to cart!");
      return;
    }

    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(
      (item) =>
        item.id === productId &&
        item.color === selection.color &&
        item.size === selection.size,
    );

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === productId &&
          item.color === selection.color &&
          item.size === selection.size
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      const newItem: CartItem = {
        id: productId,
        name: product.name,
        price: product.basePrice,
        color: selection.color,
        size: selection.size,
        image: getProductImage(productId, selection.color),
        quantity: 1,
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (itemIndex: number, delta: number) => {
    setCart(
      cart
        .map((item, index) => {
          if (index === itemIndex) {
            const newQuantity = item.quantity + delta;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null),
    );
  };

  const removeFromCart = (itemIndex: number) => {
    setCart(cart.filter((_, index) => index !== itemIndex));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    setStep(2);
  };

  const handleConfirmOrder = (e: FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleConfirmPayment = () => {
    setStep(4);
  };

  const resetCart = () => {
    setCart([]);
    setSelectedProducts({});
    setStep(1);
    setCustomerInfo({ full_name: "", phone: "", email: "" });
  };

  const getColorName = (colorValue: string) => {
    const color = COLORS.find((c) => c.value === colorValue);
    return color ? color.name : colorValue;
  };

  const getColorHex = (colorValue: string) => {
    const color = COLORS.find((c) => c.value === colorValue);
    return color ? color.hex : "#cccccc";
  };

  if (step === 4) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col font-inter">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md text-center">
            <div className="bg-[#1e293b] p-8 rounded-lg border border-[#334155]">
              <div className="bg-green-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="text-green-500" size={48} />
              </div>
              <h1 className="text-3xl font-bold text-[#f8fafc] mb-4 font-poppins">
                Order Placed!
              </h1>
              <p className="text-[#cbd5e1] mb-6">
                Your merchandise order has been received. We'll process it once
                your payment is confirmed.
              </p>
              <Link
                href="/merchandise"
                onClick={resetCart}
                className="inline-block px-8 py-3 bg-[#2563eb] text-white font-bold rounded hover:bg-[#1d4ed8] transition"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (step === 3) {
    const total = calculateTotal();
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col font-inter">
        <Header />
        <main className="flex-1 py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#1e293b] p-8 rounded-lg border border-[#334155]">
              <h1 className="text-3xl font-bold text-[#f8fafc] mb-6 text-center font-poppins">
                Complete Your Payment
              </h1>

              <div className="bg-[#d69e2e] p-6 rounded-lg mb-6">
                <h2 className="text-2xl font-bold text-[#0f172a] mb-4 font-poppins">
                  Total Amount: Ksh {total.toLocaleString()}
                </h2>
                <div className="space-y-3 text-[#1e293b]">
                  <p className="text-lg">
                    <strong>Paybill Number:</strong> 263532
                  </p>
                  <p className="text-lg">
                    <strong>Account Number:</strong> MERCH-
                    {customerInfo.full_name}
                  </p>
                  <p className="text-lg">
                    <strong>Amount:</strong> Ksh {total}
                  </p>
                </div>
              </div>

              <div className="bg-[#0f172a] p-6 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-[#f8fafc] mb-3 font-poppins">
                  Order Summary:
                </h3>
                <div className="space-y-2 text-[#cbd5e1]">
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span>
                        {item.name} ({getColorName(item.color)}, {item.size}) x{" "}
                        {item.quantity}
                      </span>
                      <span>
                        Ksh {(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-[#334155] pt-2 mt-2 flex justify-between font-bold text-[#d69e2e]">
                    <span>Total</span>
                    <span>Ksh {total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0f172a] p-6 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-[#f8fafc] mb-3 font-poppins">
                  Payment Instructions:
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-[#cbd5e1]">
                  <li>Go to M-PESA on your phone</li>
                  <li>Select Lipa na M-PESA</li>
                  <li>Select Pay Bill</li>
                  <li>
                    Enter Business Number:{" "}
                    <strong className="text-[#d69e2e]">263532</strong>
                  </li>
                  <li>
                    Enter Account Number:{" "}
                    <strong className="text-[#d69e2e]">
                      MERCH-{customerInfo.full_name}
                    </strong>
                  </li>
                  <li>
                    Enter Amount:{" "}
                    <strong className="text-[#d69e2e]">Ksh {total}</strong>
                  </li>
                  <li>Enter your M-PESA PIN and confirm</li>
                </ol>
              </div>

              <button
                onClick={handleConfirmPayment}
                className="w-full px-4 py-3 bg-[#2563eb] text-white font-bold rounded hover:bg-[#1d4ed8] transition"
              >
                I Have Completed Payment
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (step === 2) {
    const total = calculateTotal();
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col font-inter">
        <Header />
        <main className="flex-1 py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-[#1e293b] p-8 rounded-lg border border-[#334155]">
              <h1 className="text-3xl font-bold text-[#f8fafc] mb-6 text-center font-poppins">
                Checkout
              </h1>

              <div className="bg-[#0f172a] p-6 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-[#f8fafc] mb-4 font-poppins">
                  Order Summary
                </h3>
                {cart.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 border-b border-[#334155]"
                  >
                    <div>
                      <p className="text-[#f8fafc] font-semibold">
                        {item.name}
                      </p>
                      <p className="text-[#94a3b8] text-sm">
                        {getColorName(item.color)}, Size: {item.size} | Qty:{" "}
                        {item.quantity}
                      </p>
                    </div>
                    <p className="text-[#d69e2e] font-bold">
                      Ksh {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 text-xl font-bold">
                  <span className="text-[#f8fafc]">Total</span>
                  <span className="text-[#d69e2e]">
                    Ksh {total.toLocaleString()}
                  </span>
                </div>
              </div>

              <form onSubmit={handleConfirmOrder} className="space-y-4">
                <div>
                  <label className="block text-[#f8fafc] mb-2 font-semibold">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerInfo.full_name}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        full_name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded text-[#f8fafc] focus:outline-none focus:border-[#d69e2e]"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-[#f8fafc] mb-2 font-semibold">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerInfo.phone}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded text-[#f8fafc] focus:outline-none focus:border-[#d69e2e]"
                    placeholder="0712345678"
                  />
                </div>

                <div>
                  <label className="block text-[#f8fafc] mb-2 font-semibold">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={customerInfo.email}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded text-[#f8fafc] focus:outline-none focus:border-[#d69e2e]"
                    placeholder="john.doe@example.com"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 px-4 py-3 bg-[#0f172a] border border-[#334155] text-white font-bold rounded hover:bg-[#1e293b] transition"
                  >
                    Back to Shop
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-[#d69e2e] text-[#0f172a] font-bold rounded hover:bg-[#b8832a] transition"
                  >
                    Continue to Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col font-inter">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-[#f8fafc] mb-4 font-poppins">
              CHRMAA Merchandise
            </h1>
            <p className="text-xl text-[#cbd5e1]">
              Show your alumni pride with official CHRMAA branded items
            </p>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {PRODUCTS.map((product) => {
              const selection = selectedProducts[product.id] || {
                color: "",
                size: "",
              };
              const availableColors = getAvailableColors(product.id);
              const availableSizes = selection.color
                ? getAvailableSizes(product.id, selection.color)
                : [];

              return (
                <div
                  key={product.id}
                  className="bg-[#1e293b] rounded-lg border border-[#334155] overflow-hidden hover:border-[#d69e2e] transition"
                >
                  {/* Product Image */}
                  <div className="relative w-full h-64">
                    <Image
                      src={
                        selection.color
                          ? getProductImage(product.id, selection.color)
                          : product.variants[0].image
                      }
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[#f8fafc] mb-2 font-poppins">
                      {product.name}
                    </h3>
                    <p className="text-[#cbd5e1] mb-4">{product.description}</p>

                    {/* Color Selection */}
                    <div className="mb-4">
                      <label className="block text-[#f8fafc] text-sm font-semibold mb-2">
                        Color
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {availableColors.map((color) => {
                          const colorObj = COLORS.find((c) => c.value === color);
                          return (
                            <button
                              key={color}
                              type="button"
                              onClick={() => handleColorSelect(product.id, color)}
                              className={`w-8 h-8 rounded-full border-2 ${
                                selection.color === color
                                  ? "border-[#d69e2e]"
                                  : "border-[#334155]"
                              }`}
                              style={{
                                backgroundColor: colorObj?.hex || "#cccccc",
                              }}
                              title={colorObj?.name || color}
                            />
                          );
                        })}
                      </div>
                      {selection.color && (
                        <p className="text-[#cbd5e1] text-sm mt-1">
                          {getColorName(selection.color)}
                        </p>
                      )}
                    </div>

                    {/* Size Selection */}
                    {selection.color && (
                      <div className="mb-4">
                        <label className="block text-[#f8fafc] text-sm font-semibold mb-2">
                          Size
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {availableSizes.map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => handleSizeSelect(product.id, size)}
                              className={`px-3 py-1 text-sm rounded border ${
                                selection.size === size
                                  ? "bg-[#d69e2e] text-[#0f172a] border-[#d69e2e]"
                                  : "bg-[#0f172a] text-[#f8fafc] border-[#334155] hover:border-[#64748b]"
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Price and Add to Cart */}
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-[#d69e2e]">
                        Ksh {product.basePrice.toLocaleString()}
                      </span>
                      <button
                        onClick={() => addToCart(product.id)}
                        disabled={!selection.color || !selection.size}
                        className={`px-4 py-2 font-semibold rounded flex items-center gap-2 transition ${
                          !selection.color || !selection.size
                            ? "bg-[#334155] text-[#94a3b8] cursor-not-allowed"
                            : "bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                        }`}
                      >
                        <ShoppingCart size={18} />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <div className="bg-[#1e293b] p-8 rounded-lg border border-[#334155]">
              <h2 className="text-2xl font-bold text-[#f8fafc] mb-6 font-poppins flex items-center gap-2">
                <ShoppingCart size={24} />
                Your Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                items)
              </h2>

              <div className="space-y-4 mb-6">
                {cart.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-[#0f172a] p-4 rounded border border-[#334155]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover rounded"
                          sizes="64px"
                        />
                      </div>
                      <div>
                        <h4 className="text-[#f8fafc] font-semibold">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-[#94a3b8]">
                          <div className="flex items-center gap-1">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getColorHex(item.color) }}
                            />
                            <span>{getColorName(item.color)}</span>
                          </div>
                          <span>|</span>
                          <span>Size: {item.size}</span>
                          <span>|</span>
                          <span>Ksh {item.price.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(index, -1)}
                          className="bg-[#1e293b] p-2 rounded hover:bg-[#334155] transition"
                        >
                          <Minus size={16} className="text-[#f8fafc]" />
                        </button>
                        <span className="text-[#f8fafc] font-bold w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(index, 1)}
                          className="bg-[#1e293b] p-2 rounded hover:bg-[#334155] transition"
                        >
                          <Plus size={16} className="text-[#f8fafc]" />
                        </button>
                      </div>
                      <span className="text-[#d69e2e] font-bold w-24 text-right">
                        Ksh {(item.price * item.quantity).toLocaleString()}
                      </span>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="px-3 py-1 text-red-500 hover:text-red-400 text-sm font-bold bg-red-500/10 hover:bg-red-500/20 rounded transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-[#334155]">
                <div className="text-2xl font-bold text-[#f8fafc]">
                  Total:{" "}
                  <span className="text-[#d69e2e]">
                    Ksh {calculateTotal().toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="px-8 py-3 bg-[#d69e2e] text-[#0f172a] font-bold rounded hover:bg-[#b8832a] transition"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}