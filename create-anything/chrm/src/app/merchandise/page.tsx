"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { 
  ShoppingCart, Minus, Plus, CheckCircle, 
  Package, Tag, Truck, Shield, 
  ArrowLeft, AlertCircle, Copy,
  LogIn,
  User
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

// Define types
type UserType = {
   id: string;
  email: string;
  name: string;
  role: "admin" | "member";
};

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
      staggerChildren: 0.5,
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
        image: "/whitetee.jpeg",
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
        image: "/graytee.jpeg",
      },
      {
        color:"lightblue",
        sizes: ["S", "M", "L", "XL"],
        image: "/bluetee.jpeg",
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
        image: "/chrmred polo.jpeg",
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
        image: "/blackhood.jpeg",
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
        sizes: ["Standard"],
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
    title: "Affordable prices",
    description: "Exclusive prices for CHRMAA members"
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Free delivery within CBD"
  },
  {
    icon: Shield,
    title: "Secure Payment",
    description: "Safe and encrypted payment process"
  }
];

// CustomerInfoForm Component
interface CustomerInfoFormProps {
  customerInfo: CustomerInfo;
  errors: Record<string, string>;
  onChange: (info: CustomerInfo) => void;
}

function CustomerInfoForm({ customerInfo, errors, onChange }: CustomerInfoFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2">
          Full Name
        </label>
        <input
          type="text"
          required
          value={customerInfo.full_name}
          onChange={(e) => onChange({ ...customerInfo, full_name: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
          placeholder="John Doe"
        />
        {errors.fullName && (
          <p className="mt-1 text-red-500 text-sm">{errors.fullName}</p>
        )}
      </div>

      <div>
        <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          required
          value={customerInfo.phone}
          onChange={(e) => onChange({ ...customerInfo, phone: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
          placeholder="0712345678"
        />
        {errors.phone && (
          <p className="mt-1 text-red-500 text-sm">{errors.phone}</p>
        )}
      </div>

      <div>
        <label className="block font-poppins font-semibold text-sm text-gray-700 mb-2">
          Email Address
        </label>
        <input
          type="email"
          required
          value={customerInfo.email}
          onChange={(e) => onChange({ ...customerInfo, email: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
          placeholder="john.doe@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-red-500 text-sm">{errors.email}</p>
        )}
      </div>
    </div>
  );
}

// PaymentSummary Component
interface PaymentSummaryProps {
  cart: CartItem[];
  customerInfo: CustomerInfo;
  total: number;
}

function PaymentSummary({ cart, customerInfo, total }: PaymentSummaryProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const accountNumber = `MERCH-${customerInfo.full_name.toUpperCase().replace(/\s+/g, '')}`;

  const getColorName = (colorValue: string) => {
    const color = COLORS.find((c) => c.value === colorValue);
    return color ? color.name : colorValue;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="font-poppins font-bold text-lg text-gray-900 mb-4 flex items-center">
        <ShoppingCart size={20} className="mr-2 text-blue-600" />
        Order Summary
      </h3>

      {/* Cart Items */}
      <div className="space-y-3 mb-6">
        {cart.map((item, index) => (
          <div
            key={index}
            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex-1">
              <p className="font-poppins font-semibold text-sm text-gray-900">
                {item.name}
              </p>
              <p className="text-xs text-gray-600">
                {getColorName(item.color)} • {item.size} • Qty: {item.quantity}
              </p>
            </div>
            <div className="text-right">
              <p className="font-poppins font-bold text-sm text-amber-600">
                KSH {(item.price * item.quantity).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="font-poppins font-semibold text-gray-700">
            Total Amount
          </span>
          <span className="font-poppins font-bold text-xl text-blue-700">
            KSH {total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* MPESA Payment Details */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-poppins font-semibold text-sm text-gray-900 mb-3">
          MPESA Payment Instructions
        </h4>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              Paybill Number:
            </span>
            <div className="flex items-center">
              <span className="font-mono font-bold text-gray-900 mr-2">
                263532
              </span>
              <button
                onClick={() => copyToClipboard("263532")}
                className="p-1 hover:bg-blue-50 rounded transition-colors"
              >
                <Copy size={16} className="text-blue-600" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              Account Number:
            </span>
            <div className="flex items-center">
              <span className="font-mono font-bold text-gray-900 mr-2">
                {accountNumber}
              </span>
              <button
                onClick={() => copyToClipboard(accountNumber)}
                className="p-1 hover:bg-blue-50 rounded transition-colors"
              >
                <Copy size={16} className="text-blue-600" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              Amount:
            </span>
            <div className="flex items-center">
              <span className="font-mono font-bold text-gray-900 mr-2">
                KSH {total.toLocaleString()}
              </span>
              <button
                onClick={() => copyToClipboard(total.toString())}
                className="p-1 hover:bg-blue-50 rounded transition-colors"
              >
                <Copy size={16} className="text-blue-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-amber-50 rounded-lg">
          <p className="text-xs text-amber-700">
            <AlertCircle size={14} className="inline mr-1" />
            Use account number format: <strong>{accountNumber}</strong>
          </p>
        </div>
      </div>

      {/* Delivery Information */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h5 className="font-poppins font-semibold text-sm text-blue-700 mb-2">
          Delivery & Pickup
        </h5>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Free delivery within Nairobi CBD</li>
          <li>• Pickup: Hazina Trade Centre, 13th Floor</li>
          <li>• Delivery across Kenya at extra cost</li>
        </ul>
      </div>
    </div>
  );
}

// CheckoutSection Component
interface CheckoutSectionProps {
  cart: CartItem[];
  customerInfo: CustomerInfo;
  errors: Record<string, string>;
  isSubmitting: boolean;
  totalAmount: number;
  onCustomerInfoChange: (info: CustomerInfo) => void;
  onBackToProducts: () => void;
  onCompleteOrder: () => void;
}

function CheckoutSection({
  cart,
  customerInfo,
  errors,
  isSubmitting,
  totalAmount,
  onCustomerInfoChange,
  onBackToProducts,
  onCompleteOrder,
}: CheckoutSectionProps) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-6">
        <button
          onClick={onBackToProducts}
          className="flex items-center text-blue-700 hover:text-blue-900 font-poppins font-medium text-sm transition-colors duration-200"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Products
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Customer Information Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h3 className="font-poppins font-bold text-xl text-gray-900 mb-6">
            Customer Information
          </h3>

          <CustomerInfoForm
            customerInfo={customerInfo}
            errors={errors}
            onChange={onCustomerInfoChange}
          />

          <div className="mt-8 flex gap-4">
            <button
              onClick={onBackToProducts}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-poppins font-medium transition-colors duration-200"
            >
              Back to Products
            </button>

            <button
              onClick={onCompleteOrder}
              disabled={isSubmitting || cart.length === 0}
              className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:bg-gray-300 disabled:text-gray-500 text-white font-poppins font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50"
            >
              {isSubmitting ? "Processing..." : "Complete Order"}
            </button>
          </div>

          {errors.submit && (
            <div className="mt-4 flex items-center text-red-600 text-sm">
              <AlertCircle size={14} className="mr-1" />
              {errors.submit}
            </div>
          )}
        </div>

        {/* Payment Summary */}
        {cart.length > 0 && customerInfo.full_name && (
          <PaymentSummary
            cart={cart}
            customerInfo={customerInfo}
            total={totalAmount}
          />
        )}
      </div>
    </div>
  );
}
const validatePhoneNumber = (phone: string): boolean => {
  // Kenyan formats: 07XXXXXXXX, 01XXXXXXXX, 2547XXXXXXXX, 2541XXXXXXXX
  const cleaned = phone.replace(/\s+/g, "");

  const regex = /^(07|01)\d{8}$|^254(7|1)\d{8}$/;
  return regex.test(cleaned);
};

export default function MerchandisePage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const userData = localStorage.getItem("user");
        if (userData) {
          const parsedUser: UserType = JSON.parse(userData);
          setUser(parsedUser);
          
          // Pre-fill customer info with user data if available
          setCustomerInfo(prev => ({
            ...prev,
            full_name: parsedUser.name || "",
            email: parsedUser.email || ""
          }));
        } else {
          // User not logged in, don't redirect immediately - let them browse
          // They'll be redirected when trying to checkout
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // Redirect to login if trying to checkout without being logged in
  useEffect(() => {
    if ((step === 2 || step === 3) && !user) {
      router.push("/login?redirect=/merchandise&checkout=true");
    }
  }, [step, user, router]);

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
    
    // Check if user is logged in
    if (!user) {
      router.push("/login?redirect=/merchandise&checkout=true");
      return;
    }
    
    setStep(2);
  };

  const validateCustomerInfo = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customerInfo.full_name.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!customerInfo.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(customerInfo.phone)) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    if (!customerInfo.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(customerInfo.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirmOrder = (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateCustomerInfo()) {
      return;
    }

    setIsSubmitting(true);
    // Simulate processing
    setTimeout(() => {
      setIsSubmitting(false);
      setStep(3);
    }, 1500);
  };

  const handleCompleteOrder = async () => {
  if (!user) {
    router.push("/login?redirect=/merchandise&checkout=true");
    return;
  }

  setIsSubmitting(true);
  setErrors({});
  
  try {
    // 1. Validate phone number
    if (!validatePhoneNumber(customerInfo.phone)) {
      setErrors({ submit: "Please enter a valid Kenyan phone number (e.g., 0712345678)" });
      setIsSubmitting(false);
      return;
    }

    // 2. Get user ID directly from auth user (no need for API call)
    const userId = user.id; // From your useAuth hook
    if (!userId) {
      throw new Error("User ID not found. Please login again.");
    }

    const total = calculateTotal();
    
    // 3. Create order first (before payment)
    const orderResponse = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        items: cart,
        total: total,
        customer_name: customerInfo.full_name,
        customer_phone: customerInfo.phone,
        customer_email: customerInfo.email,
        shipping_address: "To be provided after payment",
        status: 'pending'
      })
    });

    const orderData = await orderResponse.json();
    
    if (!orderResponse.ok) {
      throw new Error(orderData.error || 'Failed to create order');
    }

    // 4. Initiate STK Push for merchandise
    const paymentResponse = await fetch('/api/payments/stk-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: customerInfo.phone,
        amount: total,
        paymentType: 'merchandise',
        userId: userId,
        userEmail: customerInfo.email,
        userName: customerInfo.full_name,
        description: `Merchandise Order - ${cart.length} items`,
        metadata: {
          order_id: orderData.order?.id,
          items: cart,
          total: total,
          customer_name: customerInfo.full_name,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone
        }
      })
    });

    const paymentData = await paymentResponse.json();
    
    if (!paymentResponse.ok) {
      throw new Error(paymentData.error || 'Payment initiation failed');
    }
    
  } catch (error) {
    console.error("Error creating order:", error);
    setErrors({ submit: error instanceof Error ? error.message : "Failed to create order. Please try again." });
    setIsSubmitting(false);
  }
};

  const resetCart = () => {
    setCart([]);
    setSelectedProducts({});
    setStep(1);
    setCustomerInfo({ full_name: "", phone: "", email: "" });
    setErrors({});
  };

  const getColorName = (colorValue: string) => {
    const color = COLORS.find((c) => c.value === colorValue);
    return color ? color.name : colorValue;
  };

  const getColorHex = (colorValue: string) => {
    const color = COLORS.find((c) => c.value === colorValue);
    return color ? color.hex : "#cccccc";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-gray-900 text-xl">Loading...</div>
      </div>
    );
  }

  // Show login prompt only when trying to checkout
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
                  You can view your orders in your member dashboard.
                </motion.p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/member/dashboard?tab=orders"
                    className="group inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300"
                  >
                    <User size={20} />
                    View Orders
                  </Link>
                  <Link
                    href="/merchandise"
                    onClick={resetCart}
                    className="group inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-xl hover:shadow-xl transition-all duration-300"
                  >
                    <ShoppingCart size={20} />
                    Continue Shopping
                  </Link>
                </div>
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col">
        <Header />
        <CheckoutSection
          cart={cart}
          customerInfo={customerInfo}
          errors={errors}
          isSubmitting={isSubmitting}
          totalAmount={total}
          onCustomerInfoChange={setCustomerInfo}
          onBackToProducts={() => setStep(1)}
          onCompleteOrder={handleCompleteOrder}
        />
        <Footer />
      </div>
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

                {/* User Info Banner */}
                {user && (
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl mb-6 border border-blue-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                        <User className="text-white" size={20} />
                      </div>
                      <div>
                        <p className="text-gray-900 font-semibold">{user.name}</p>
                        <p className="text-gray-600 text-sm">{user.email}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

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
          {/* User Info Bar */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl mb-8 shadow-lg"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between">
                <div className="flex items-center gap-3 mb-4 sm:mb-0">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-lg">Welcome back, {user.name}!</p>
                    <p className="text-blue-100 text-sm">Ready to shop CHRMAA merchandise</p>
                  </div>
                </div>
                <Link
                  href="/member/dashboard?tab=orders"
                  className="px-6 py-2 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all duration-200"
                >
                  View My Orders
                </Link>
              </div>
            </motion.div>
          )}

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
                <div className="flex gap-4">
                  {!user && (
                    <Link
                      href="/login?redirect=/merchandise&checkout=true"
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-200"
                    >
                      Login to Checkout
                    </Link>
                  )}
                  <button
                    onClick={handleCheckout}
                    disabled={!user}
                    className={`px-8 py-3 font-bold rounded-xl transition-all duration-200 ${
                      !user
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:shadow-xl"
                    }`}
                  >
                    {!user ? "Login Required" : "Proceed to Checkout"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </motion.div>
  );
}