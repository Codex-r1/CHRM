"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ShoppingCart, Minus, Plus, CheckCircle, Package, Tag, Truck, Shield } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

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

// Animation Variants
const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
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
    description: "Premium cotton CHRMAA t-shirt with embroidered logo",
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
        color: "red",
        sizes: ["S", "M", "L", "XL"],
        image: "/T-SHIRT-red.jpeg",
      },
      {
        color:"gray",
        sizes: ["S", "M", "L", "XL"],
        image: "/T-SHIRT-gray.jpeg",
      }
    ],
  },
  {
    id: 2,
    name: "Polo Shirt",
    basePrice: 1500,
    description: "Professional CHRMAA polo shirt with embroidered logo",
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
        color:"red",
        sizes: ["S", "M", "L", "XL"],
        image: "/POLO-red.jpeg",
      },
      {
        color:"gray",
        sizes: ["S", "M", "L", "XL"],
        image: "/POLO-gray.jpeg",
      }
    ],
  },
  {
    id: 3,
    name: "Hoodie",
    basePrice: 1800,
    description: "Comfortable CHRMAA hoodie with embroidered logo",
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
        color: "lightblue",
        sizes: ["S", "M", "L", "XL"],
        image: "/Hoodie-blue.jpeg",
      },
      {
        color:"maroon",
        sizes: ["S", "M", "L", "XL"],
        image: "/Hoodie-maroon.jpeg",
      }
    ],
  },
  {
    id: 4,
    name: "Lapel Pin",
    basePrice: 1000,
    description: "Elegant CHRMAA lapel pin for formal occasions",
    variants: [
      {
        color: "gold",
        sizes: [],
        image: "/Lapel Pin.jpeg",
      },
    ],
  },
];

const benefits = [
  {
    icon: Package,
    title: "Premium Quality",
    description: "High-quality materials and durable construction"
  },
  {
    icon: Tag,
    title: "Member Discounts",
    description: "Exclusive prices for CHRMAA members"
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Free delivery within major cities"
  },
  {
    icon: Shield,
    title: "Secure Payment",
    description: "Safe and encrypted payment process"
  }
];

export default function MerchandisePage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState(1);
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
        size: "",
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

  const paymentSteps = [
    "Go to M-PESA on your phone",
    "Select Lipa na M-PESA",
    "Select Pay Bill",
    `Enter Business Number: 263532`,
    `Enter Account Number: MERCH-${customerInfo.full_name.toUpperCase()}`,
    `Enter Amount: Ksh ${calculateTotal()}`,
    "Enter your M-PESA PIN and confirm"
  ];

  if (step === 4) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col"
      >
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="w-full max-w-md text-center"
          >
            <div className="relative bg-white rounded-2xl p-8 shadow-2xl border border-gray-100 overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-50 rounded-full -translate-x-16 -translate-y-16" />
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-100 to-indigo-50 rounded-full translate-x-20 translate-y-20" />
              
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg"
                >
                  <CheckCircle className="text-white" size={48} />
                </motion.div>
                
                <motion.h1
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="text-3xl font-bold text-gray-900 mb-4 font-poppins"
                >
                  Order Placed!
                </motion.h1>
                
                <motion.p
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: 0.1 }}
                  className="text-gray-600 mb-8 leading-relaxed"
                >
                  Your merchandise order has been received. We'll process it once
                  your payment is confirmed. You'll receive updates via email.
                </motion.p>
                
                <Link
                  href="/merchandise"
                  onClick={resetCart}
                  className="group inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </motion.div>
        </main>
        <Footer />
      </motion.div>
    );
  }

  if (step === 3) {
    const total = calculateTotal();
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col"
      >
        <Header />
        <main className="flex-1 py-12 px-4">
          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative bg-white rounded-2xl p-8 shadow-2xl border border-gray-100 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-full translate-x-20 -translate-y-20" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full -translate-x-16 translate-y-16" />
              
              <div className="relative z-10">
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="flex items-center justify-center gap-3 mb-6"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-full flex items-center justify-center">
                    <ShoppingCart className="text-white" size={24} />
                  </div>
                  <h1 className="text-3xl font-bold font-poppins text-gray-900">
                    Complete Your Payment
                  </h1>
                </motion.div>

                <motion.div
                  variants={scaleIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-2xl mb-8 border border-amber-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold font-poppins text-amber-900">
                      Total Amount
                    </h2>
                    <div className="px-4 py-2 bg-amber-600 text-white rounded-full font-bold text-lg">
                      Ksh {total.toLocaleString()}
                    </div>
                  </div>
                  
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Tag className="text-amber-600" size={20} />
                      </div>
                      <div>
                        <div className="text-sm text-amber-800 font-medium">Paybill Number</div>
                        <div className="text-xl font-bold text-gray-900">263532</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Package className="text-amber-600" size={20} />
                      </div>
                      <div>
                        <div className="text-sm text-amber-800 font-medium">Account Number</div>
                        <div className="text-xl font-bold text-gray-900 font-mono">MERCH-{customerInfo.full_name.toUpperCase()}</div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>

                <motion.div
                  variants={scaleIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl mb-8 border border-blue-100"
                >
                  <h3 className="text-xl font-bold font-poppins text-gray-900 mb-4">
                    📱 Payment Instructions
                  </h3>
                  
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="space-y-3"
                  >
                    {paymentSteps.map((stepText, index) => (
                      <motion.div
                        key={index}
                        variants={fadeUp}
                        className="flex items-start gap-3"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-700 font-bold text-sm">{index + 1}</span>
                        </div>
                        <p className="text-gray-700 flex-1">
                          {stepText.includes("263532") || stepText.includes("MERCH-") || stepText.includes("Ksh") ? (
                            <>
                              {stepText.split(/(263532|Ksh \d+|MERCH-\w+)/).map((part, i) => 
                                /(263532|Ksh \d+|MERCH-\w+)/.test(part) ? (
                                  <span key={i} className="font-bold text-blue-700">{part}</span>
                                ) : (
                                  part
                                )
                              )}
                            </>
                          ) : (
                            stepText
                          )}
                        </p>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>

                <button
                  onClick={handleConfirmPayment}
                  className="w-full px-4 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Shield size={20} />
                  I Have Completed Payment
                </button>
              </div>
            </div>
          </motion.div>
        </main>
        <Footer />
      </motion.div>
    );
  }

  if (step === 2) {
    const total = calculateTotal();
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col"
      >
        <Header />
        <main className="flex-1 py-12 px-4">
          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative bg-white rounded-2xl p-8 shadow-2xl border border-gray-100 overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full -translate-x-16 -translate-y-16" />
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-full translate-x-20 translate-y-20" />
              
              <div className="relative z-10">
                <motion.h1
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  className="text-3xl font-bold text-gray-900 mb-6 text-center font-poppins"
                >
                  Checkout
                </motion.h1>

                <motion.div
                  variants={scaleIn}
                  initial="hidden"
                  whileInView="visible"
                  className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl mb-8 border border-gray-200"
                >
                  <h3 className="text-xl font-bold font-poppins text-gray-900 mb-4">
                    Order Summary
                  </h3>
                  {cart.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-3 border-b border-gray-200 last:border-0"
                    >
                      <div>
                        <p className="text-gray-900 font-semibold">
                          {item.name}
                        </p>
                        <p className="text-gray-600 text-sm">
                          {getColorName(item.color)}, Size: {item.size} | Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="text-amber-600 font-bold">
                        Ksh {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-4 text-xl font-bold border-t border-gray-200 mt-4">
                    <span className="text-gray-900">Total</span>
                    <span className="text-amber-600">
                      Ksh {total.toLocaleString()}
                    </span>
                  </div>
                </motion.div>

                <motion.form
                  onSubmit={handleConfirmOrder}
                  className="space-y-6"
                >
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    className="space-y-4"
                  >
                    <div>
                      <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2">
                        Full Name
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
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2">
                        Phone Number
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
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                        placeholder="0712345678"
                      />
                    </div>

                    <div>
                      <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2">
                        Email Address
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
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                        placeholder="john.doe@example.com"
                      />
                    </div>
                  </motion.div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200"
                    >
                      Back to Shop
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-200"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </motion.form>
              </div>
            </div>
          </motion.div>
        </main>
        <Footer />
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col"
    >
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-poppins">
              CHRMAA Merchandise
            </h1>
            <p className="text-xl text-gray-600">
              Show your alumni pride with official CHRMAA branded items
            </p>
          </motion.div>

          {/* Benefits Section */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                custom={index}
                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <benefit.icon className="text-blue-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Products Grid */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"
          >
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
                <motion.div
                  key={product.id}
                  variants={scaleIn}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  {/* Product Image */}
                  <div className="relative w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200">
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
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      Ksh {product.basePrice.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 font-poppins">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 mb-4 text-sm">{product.description}</p>

                    {/* Color Selection */}
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-semibold mb-2">
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
                              className={`w-8 h-8 rounded-full border-2 transition-all ${
                                selection.color === color
                                  ? "border-amber-500 scale-110"
                                  : "border-gray-300 hover:border-gray-400"
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
                        <p className="text-gray-600 text-sm mt-1">
                          {getColorName(selection.color)}
                        </p>
                      )}
                    </div>

                    {/* Size Selection */}
                    {selection.color && (
                      <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                          Size
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {availableSizes.map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => handleSizeSelect(product.id, size)}
                              className={`px-3 py-1 text-sm rounded-xl border transition-all ${
                                selection.size === size
                                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-500"
                                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => addToCart(product.id)}
                      disabled={!selection.color || !selection.size}
                      className={`w-full px-4 py-3 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ${
                        !selection.color || !selection.size
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:scale-[1.02]"
                      }`}
                    >
                      <ShoppingCart size={18} />
                      Add to Cart
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Cart */}
          {cart.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-2xl border border-gray-200 shadow-xl"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6 font-poppins flex items-center gap-2">
                <ShoppingCart size={24} />
                Your Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)
              </h2>

              <div className="space-y-4 mb-6">
                {cart.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover rounded-lg"
                          sizes="64px"
                        />
                      </div>
                      <div>
                        <h4 className="text-gray-900 font-semibold">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
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
                          className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Minus size={16} className="text-gray-700" />
                        </button>
                        <span className="text-gray-900 font-bold w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(index, 1)}
                          className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Plus size={16} className="text-gray-700" />
                        </button>
                      </div>
                      <span className="text-amber-600 font-bold w-24 text-right">
                        Ksh {(item.price * item.quantity).toLocaleString()}
                      </span>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="px-3 py-1 text-red-600 hover:text-red-700 text-sm font-bold bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <div className="text-2xl font-bold text-gray-900">
                  Total:{" "}
                  <span className="text-amber-600">
                    Ksh {calculateTotal().toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="px-8 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-200"
                >
                  Proceed to Checkout
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </motion.div>
  );
}