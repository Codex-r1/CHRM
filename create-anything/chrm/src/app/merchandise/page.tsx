"use client";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  ShoppingCart,
  Minus,
  Plus,
  CheckCircle,
  Package,
  Tag,
  Truck,
  Shield,
  ArrowLeft,
  AlertCircle,
  Copy,
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
  id: string;
  color_name: string;
  color_value: string;
  color_hex: string;
  size: string;
  stock_quantity: number;
  is_available: boolean;
  image_url: string;
  sku: string;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  description: string;
  category: string;
  is_out_of_stock: boolean;
  variants: ProductVariant[];
};

type CartItem = {
  variant_id: string;
  product_id: string;
  name: string;
  price: number;
  color: string;
  color_name: string;
  size: string;
  image: string;
  quantity: number;
  stock_available: number;
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
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Full Name
        </label>
        <input
          type="text"
          value={customerInfo.full_name}
          onChange={(e) => onChange({ ...customerInfo, full_name: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
          placeholder="John Doe"
        />
        {errors.fullName && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.fullName}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          value={customerInfo.phone}
          onChange={(e) => onChange({ ...customerInfo, phone: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
          placeholder="0712345678"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.phone}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Email Address
        </label>
        <input
          type="email"
          value={customerInfo.email}
          onChange={(e) => onChange({ ...customerInfo, email: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
          placeholder="john.doe@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.email}
          </p>
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

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>

      {/* Cart Items */}
      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {cart.map((item, index) => (
          <div key={index} className="flex justify-between items-start text-sm">
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{item.name}</p>
              <p className="text-gray-600 text-xs">
                {item.color_name} • {item.size} • Qty: {item.quantity}
              </p>
            </div>
            <p className="font-bold text-gray-900">
              KSH {(item.price * item.quantity).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="border-t-2 border-gray-200 pt-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-gray-900">Total Amount</span>
          <span className="text-2xl font-bold text-blue-600">
            KSH {total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* MPESA Payment Details */}
      <div className="bg-blue-50 rounded-xl p-4 mb-4">
        <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
          <Copy className="w-4 h-4" />
          MPESA Payment Instructions
        </h4>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-blue-700 font-semibold">Paybill Number:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-blue-900">263532</span>
              <button
                onClick={() => copyToClipboard("263532")}
                className="p-1 hover:bg-blue-50 rounded transition-colors"
              >
                <Copy className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-blue-700 font-semibold">Account Number:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-blue-900 text-xs">{accountNumber}</span>
              <button
                onClick={() => copyToClipboard(accountNumber)}
                className="p-1 hover:bg-blue-50 rounded transition-colors"
              >
                <Copy className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-blue-700 font-semibold">Amount:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-blue-900">KSH {total.toLocaleString()}</span>
              <button
                onClick={() => copyToClipboard(total.toString())}
                className="p-1 hover:bg-blue-50 rounded transition-colors"
              >
                <Copy className="w-4 h-4 text-blue-600" />
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-blue-600 mt-3 bg-white rounded p-2">
          Use account number format: {accountNumber}
        </p>
      </div>

      {/* Delivery Information */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Truck className="w-4 h-4" />
          Delivery & Pickup
        </h4>
        <ul className="text-xs text-gray-700 space-y-1">
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={onBackToProducts}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Products
        </button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Customer Information Form */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Customer Information
            </h2>
            <CustomerInfoForm
              customerInfo={customerInfo}
              errors={errors}
              onChange={onCustomerInfoChange}
            />

            <div className="flex gap-4 mt-6">
              <button
                onClick={onBackToProducts}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
              >
                Back to Products
              </button>
              <button
                onClick={onCompleteOrder}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Processing..." : "Complete Order"}
              </button>
            </div>

            {errors.submit && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{errors.submit}</p>
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
      <Footer />
    </div>
  );
}

const validatePhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\s+/g, "");
  const regex = /^(07|01)\d{8}$|^254(7|1)\d{8}$/;
  return regex.test(cleaned);
};

export default function MerchandisePage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<
    Record<string, { color: string; size: string; variant_id: string }>
  >({});
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    full_name: "",
    phone: "",
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products/list');
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        setErrors({ fetch: 'Failed to load products. Please refresh the page.' });
      }
    };

    fetchProducts();
  }, []);

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const userData = localStorage.getItem("user");
        if (userData) {
          const parsedUser: UserType = JSON.parse(userData);
          setUser(parsedUser);
          setCustomerInfo(prev => ({
            ...prev,
            full_name: parsedUser.name || "",
            email: parsedUser.email || ""
          }));
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

  const getAvailableColors = (product: Product) => {
    const uniqueColors = new Map<string, { name: string; hex: string; value: string }>();
    product.variants.forEach(variant => {
      if (!uniqueColors.has(variant.color_value)) {
        uniqueColors.set(variant.color_value, {
          name: variant.color_name,
          hex: variant.color_hex,
          value: variant.color_value
        });
      }
    });
    return Array.from(uniqueColors.values());
  };

  const getAvailableSizes = (product: Product, colorValue: string) => {
    return product.variants
      .filter(v => v.color_value === colorValue)
      .map(v => ({
        size: v.size,
        stock: v.stock_quantity,
        available: v.is_available && v.stock_quantity > 0,
        variant_id: v.id
      }));
  };

  const getProductImage = (product: Product, colorValue: string) => {
    const variant = product.variants.find(v => v.color_value === colorValue);
    return variant ? variant.image_url : product.variants[0]?.image_url || '';
  };

  const handleColorSelect = (productId: string, colorValue: string) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        color: colorValue,
        size: "",
        variant_id: ""
      },
    }));
  };

  const handleSizeSelect = (productId: string, size: string, variantId: string) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        size,
        variant_id: variantId
      },
    }));
  };

  const addToCart = (product: Product) => {
    const selection = selectedProducts[product.id];
    if (!selection || !selection.color || !selection.size || !selection.variant_id) {
      alert("Please select both color and size before adding to cart!");
      return;
    }

    const variant = product.variants.find(v => v.id === selection.variant_id);
    if (!variant) return;

    // Check stock availability
    if (variant.stock_quantity <= 0) {
      alert("This item is out of stock!");
      return;
    }

    const existingItem = cart.find(
      (item) => item.variant_id === selection.variant_id
    );

    if (existingItem) {
      // Check if adding one more would exceed stock
      if (existingItem.quantity >= variant.stock_quantity) {
        alert(`Only ${variant.stock_quantity} items available in stock!`);
        return;
      }
      
      setCart(
        cart.map((item) =>
          item.variant_id === selection.variant_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const newItem: CartItem = {
        variant_id: variant.id,
        product_id: product.id,
        name: product.name,
        price: product.base_price,
        color: variant.color_value,
        color_name: variant.color_name,
        size: variant.size,
        image: variant.image_url,
        quantity: 1,
        stock_available: variant.stock_quantity
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
            
            // Check stock limit
            if (newQuantity > item.stock_available) {
              alert(`Only ${item.stock_available} items available in stock!`);
              return item;
            }
            
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
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

  const handleCompleteOrder = async () => {
    if (!user) {
      router.push("/login?redirect=/merchandise&checkout=true");
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      if (!validatePhoneNumber(customerInfo.phone)) {
        setErrors({ submit: "Please enter a valid Kenyan phone number (e.g., 0712345678)" });
        setIsSubmitting(false);
        return;
      }

      const userId = user.id;
      if (!userId) {
        throw new Error("User ID not found. Please login again.");
      }

      const total = calculateTotal();

      // Create order first
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

      // Initiate STK Push
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

      setStep(4);
    } catch (error) {
      console.error("Error creating order:", error);
      setErrors({
        submit: error instanceof Error ? error.message : "Failed to create order. Please try again."
      });
    } finally {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Order Placed!
            </h1>
            <p className="text-gray-600 mb-8">
              Your merchandise order has been received. We'll process it once
              your payment is confirmed. You'll receive updates via email.
              You can view your orders in your dashboard.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/member-dashboard">
                <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all">
                  View Orders
                </button>
              </Link>
              <button
                onClick={resetCart}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (step === 3) {
    const total = calculateTotal();
    return (
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
    );
  }

  if (step === 2) {
    const total = calculateTotal();
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

          {user && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-blue-900 font-semibold">{user.name}</p>
              <p className="text-blue-700 text-sm">{user.email}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Order Summary
              </h2>
              {cart.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-3 border-b"
                >
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.color_name}, Size: {item.size} | Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold">
                    Ksh {(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4 text-lg font-bold">
                <span>Total</span>
                <span>Ksh {total.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Customer Information
              </h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
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
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200"
                  >
                    Back to Shop
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                  >
                    Continue to Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {user && !loading && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-6 mb-8 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-full">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Welcome back, {user.name}!</h2>
                <p className="text-blue-100">Ready to shop CHRMAA merchandise</p>
              </div>
            </div>
            <Link href="/member-dashboard">
              <button className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:shadow-lg transition-all duration-200">
                View My Orders
              </button>
            </Link>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            CHRMAA Merchandise
          </h1>
          <p className="text-xl text-gray-600">
            Show your alumni pride with official CHRMAA branded items
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-lg text-center hover:shadow-xl transition-shadow"
            >
              <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <benefit.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-sm text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>

        {errors.fetch && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-600">{errors.fetch}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {products.map((product) => {
            const selection = selectedProducts[product.id] || {
              color: "",
              size: "",
              variant_id: ""
            };
            const availableColors = getAvailableColors(product);
            const availableSizes = selection.color
              ? getAvailableSizes(product, selection.color)
              : [];

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-64 bg-gray-100">
                  {selection.color && (
                    <Image
                      src={getProductImage(product, selection.color)}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  )}
                  <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-md">
                    <p className="text-sm font-bold text-gray-900">
                      Ksh {product.base_price.toLocaleString()}
                    </p>
                  </div>
                  {product.is_out_of_stock && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full shadow-md">
                      <p className="text-sm font-bold">Out of Stock</p>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {product.description}
                  </p>

                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Color
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {availableColors.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => handleColorSelect(product.id, color.value)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            selection.color === color.value
                              ? "border-amber-500 scale-110"
                              : "border-gray-300 hover:border-gray-400"
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>
                    {selection.color && (
                      <p className="text-xs text-gray-600 mt-2">
                        {availableColors.find(c => c.value === selection.color)?.name}
                      </p>
                    )}
                  </div>

                  {selection.color && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Size
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {availableSizes.map((sizeInfo) => (
                          <button
                            key={sizeInfo.size}
                            onClick={() => handleSizeSelect(product.id, sizeInfo.size, sizeInfo.variant_id)}
                            disabled={!sizeInfo.available}
                            className={`px-3 py-1 text-sm rounded-xl border transition-all relative ${
                              selection.size === sizeInfo.size
                                ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-500"
                                : sizeInfo.available
                                ? "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                                : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            }`}
                            title={sizeInfo.available ? `${sizeInfo.stock} left` : 'Out of stock'}
                          >
                            {sizeInfo.size}
                            {sizeInfo.available && (
                              <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {sizeInfo.stock}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                      {selection.size && (
                        <p className="text-xs text-gray-600 mt-2">
                          {availableSizes.find(s => s.size === selection.size)?.stock} items left
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => addToCart(product)}
                    disabled={!selection.color || !selection.size || product.is_out_of_stock}
                    className={`w-full px-4 py-3 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 ${
                      !selection.color || !selection.size || product.is_out_of_stock
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:scale-[1.02]"
                    }`}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {product.is_out_of_stock ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {cart.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Your Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)}{" "}
              items)
            </h2>
            <div className="space-y-4">
              {cart.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-600">
                      {item.color_name} | Size: {item.size} | Ksh{" "}
                      {item.price.toLocaleString()} | {item.stock_available} available
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(index, -1)}
                        className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(index, 1)}
                        className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="font-bold w-24 text-right">
                      Ksh {(item.price * item.quantity).toLocaleString()}
                    </p>
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
            <div className="flex items-center justify-between mt-6 pt-6 border-t-2">
              <p className="text-2xl font-bold text-gray-900">
                Total:{" "}
                <span className="text-blue-600">
                  Ksh {calculateTotal().toLocaleString()}
                </span>
              </p>
              <button
                onClick={handleCheckout}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                {!user && <LogIn className="w-5 h-5" />}
                {!user ? "Login to Checkout" : "Proceed to Checkout"}
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}