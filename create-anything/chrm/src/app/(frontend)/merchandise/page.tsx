"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../(backend)/context/auth";
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
  User,
  X,
  Smartphone,
  Loader2,
  Info,
  Sparkles,
  Award,
  BadgeCheck,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";

// Animation Variants
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
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
}

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

type AlertModalType = {
  show: boolean;
  type: 'info' | 'success' | 'error';
  title: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void;
};

const benefits = [
  {
    icon: Package,
    title: "Premium Quality",
    description: "High-quality materials and durable construction"
  },
  {
    icon: Tag,
    title: "Affordable Prices",
    description: "Exclusive prices for alumni members"
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Free delivery within Kenya"
  },
  {
    icon: Shield,
    title: "Secure Payment",
    description: "Safe and encrypted payment process"
  }
];

export default function MerchandisePage() {
  const { user, loading } = useAuth();
  
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
  const [stkStatus, setStkStatus] = useState<'idle' | 'requesting' | 'waiting' | 'success' | 'failed'>('idle');
  const [checkoutRequestId, setCheckoutRequestId] = useState<string>('');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [paymentError, setPaymentError] = useState<string>('');
  const [alertModal, setAlertModal] = useState<AlertModalType>({
    show: false,
    type: 'info',
    title: '',
    message: '',
  });

  const router = useRouter();

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\s+/g, "");
    const regex = /^(07|01)\d{8}$|^254(7|1)\d{8}$/;
    return regex.test(cleaned);
  };

  const showAlert = (type: 'info' | 'success' | 'error', title: string, message: string, options?: { confirmText?: string; onConfirm?: () => void }) => {
    setAlertModal({
      show: true,
      type,
      title,
      message,
      confirmText: options?.confirmText || 'OK',
      onConfirm: options?.onConfirm,
    });
  };

  const hideAlert = () => {
    setAlertModal(prev => ({ ...prev, show: false }));
  };

  useEffect(() => {
    if (user) {
      setCustomerInfo(prev => ({
        ...prev,
        full_name: (user as any).name || (user as any).user_metadata?.name || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/products/list?t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        
        setProducts(data.products || []);
        setErrors({});
      } catch (error) {
        console.error('Error fetching products:', error);
        setErrors({ fetch: 'Failed to load products. Please refresh the page.' });
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

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
      showAlert('info', 'Select Options', 'Please select both color and size before adding to cart.');
      return;
    }

    const variant = product.variants.find(v => v.id === selection.variant_id);
    if (!variant) return;

    if (variant.stock_quantity <= 0) {
      showAlert('error', 'Out of Stock', 'This item is out of stock.');
      return;
    }

    const existingItem = cart.find(
      (item) => item.variant_id === selection.variant_id
    );

    if (existingItem) {
      if (existingItem.quantity >= variant.stock_quantity) {
        showAlert('info', 'Stock Limit', `Only ${variant.stock_quantity} items available in stock.`);
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
            
            if (newQuantity > item.stock_available) {
              showAlert('info', 'Stock Limit', `Only ${item.stock_available} items available in stock.`);
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
      showAlert('info', 'Empty Cart', 'Your cart is empty. Please add items before checkout.');
      return;
    }
    
    if (!user) {
      sessionStorage.setItem('pendingCart', JSON.stringify(cart));
      sessionStorage.setItem('checkoutIntent', 'true');
      router.push("/login?redirect=/merchandise");
      return;
    }
    
    setStep(2);
  };

  const handlePayment = async () => {
    if (!customerInfo.phone || !customerInfo.full_name || !customerInfo.email) {
      setErrors({
        submit: 'Please fill in all customer information fields'
      });
      showAlert('error', 'Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (!validatePhoneNumber(customerInfo.phone)) {
      setErrors({
        submit: 'Please enter a valid Kenyan phone number (e.g., 0712345678)'
      });
      showAlert('error', 'Invalid Phone', 'Please enter a valid Kenyan phone number.');
      return;
    }

    if (!user) {
      sessionStorage.setItem('pendingCart', JSON.stringify(cart));
      sessionStorage.setItem('checkoutIntent', 'true');
      router.push('/login?redirect=/merchandise');
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setStkStatus('requesting');

    try {
      const total = calculateTotal();

      const orderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
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

      const paymentResponse = await fetch('/api/payments/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: customerInfo.phone,
          amount: total,
          paymentType: 'merchandise',
          userId: user.id,
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

      if (paymentData.checkoutRequestId) {
        setCheckoutRequestId(paymentData.checkoutRequestId);
        setStkStatus('waiting');
        
        showAlert('info', 'Check Your Phone', 
          'Enter your M-PESA PIN to complete the payment.',
          { confirmText: 'OK' }
        );
        
        startPolling(paymentData.checkoutRequestId, orderData.order?.id);
      } else {
        throw new Error('No checkout request ID received');
      }

    } catch (error) {
      console.error('Payment error:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to process payment'
      });
      setStkStatus('failed');
      showAlert('error', 'Payment Failed', error instanceof Error ? error.message : 'Failed to process payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startPolling = (checkoutId: string, orderId: string) => {
    let pollCount = 0;
    const maxPolls = 40;

    const interval = setInterval(async () => {
      pollCount++;

      try {
        const response = await fetch(`/api/payments/${checkoutId}`);
        const data = await response.json();

        if (data.status === 'confirmed') {
          clearInterval(interval);
          setPollingInterval(null);
          setStkStatus('success');
          
          showAlert('success', 'Payment Successful!', 
            'Your merchandise order has been confirmed.',
            { confirmText: 'View Orders' }
          );
          
          setTimeout(() => {
            setStep(4);
          }, 2000);
          return;
        }

        if (data.status === 'failed' || data.status === 'cancelled') {
          clearInterval(interval);
          setPollingInterval(null);
          setStkStatus('failed');
          setPaymentError('Payment failed. Please try again.');
          showAlert('error', 'Payment Failed', 'Payment was not completed. Please try again.');
          return;
        }

        if (pollCount >= maxPolls) {
          clearInterval(interval);
          setPollingInterval(null);
          setStkStatus('failed');
          setPaymentError('Payment verification timed out. Please check your M-PESA messages.');
          showAlert('error', 'Payment Timeout', 'Payment verification timed out. Please check your M-PESA messages.');
        }

      } catch (error) {
        console.error('Polling error:', error);
        if (pollCount >= maxPolls) {
          clearInterval(interval);
          setPollingInterval(null);
          setStkStatus('failed');
          setPaymentError('Failed to verify payment status.');
        }
      }
    }, 3000);

    setPollingInterval(interval);
  };

  const resetCart = () => {
    setCart([]);
    setSelectedProducts({});
    setStep(1);
    setCustomerInfo({ 
      full_name: (user as any)?.name || "",
      phone: "", 
      email: user?.email || "" 
    });
    setErrors({});
    setStkStatus('idle');
    setPaymentError('');
  };

  const AlertModalComponent = () => {
    if (!alertModal.show) return null;

    const styles = {
      info: {
        bg: 'bg-white',
        border: 'border-[#1B3A6B]',
        iconBg: 'bg-[#1B3A6B]/10',
        icon: <Info className="text-[#1B3A6B]" size={24} />,
        btnBg: 'bg-[#1B3A6B] hover:bg-[#152e55]',
        titleColor: 'text-[#1B3A6B]',
      },
      success: {
        bg: 'bg-white',
        border: 'border-[#C9A84C]',
        iconBg: 'bg-[#C9A84C]/10',
        icon: <CheckCircle className="text-[#C9A84C]" size={24} />,
        btnBg: 'bg-[#C9A84C] hover:bg-[#b8973a]',
        titleColor: 'text-[#C9A84C]',
      },
      error: {
        bg: 'bg-white',
        border: 'border-[#1B3A6B]',
        iconBg: 'bg-[#1B3A6B]/10',
        icon: <AlertCircle className="text-[#1B3A6B]" size={24} />,
        btnBg: 'bg-[#1B3A6B] hover:bg-[#152e55]',
        titleColor: 'text-[#1B3A6B]',
      },
    };

    const style = styles[alertModal.type] || styles.info;

    return (
      <AnimatePresence>
        {alertModal.show && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={hideAlert}
              className="fixed inset-0 bg-[#1B3A6B]/20 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 16 }}
                className={`${style.bg} border-2 ${style.border} rounded-lg shadow-2xl max-w-md w-full overflow-hidden`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-5">
                    <div className={`${style.iconBg} p-2.5 rounded-full flex-shrink-0`}>
                      {style.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-serif font-bold mb-1 ${style.titleColor}`}>
                        {alertModal.title}
                      </h3>
                      <p className="text-[#1B3A6B]/70 text-sm leading-relaxed">
                        {alertModal.message}
                      </p>
                    </div>
                    <button
                      onClick={hideAlert}
                      className="text-[#1B3A6B]/30 hover:text-[#1B3A6B]/60 transition-colors flex-shrink-0"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      alertModal.onConfirm?.();
                      hideAlert();
                    }}
                    className={`w-full px-4 py-2.5 ${style.btnBg} text-white font-medium rounded-lg transition text-sm`}
                  >
                    {alertModal.confirmText || 'OK'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B3A6B] mx-auto"></div>
          <p className="mt-4 text-[#1B3A6B]/60">Loading...</p>
        </div>
      </div>
    );
  }

  // ─── CHECKOUT STEPS ─────────────────────────────────────────────────────────

  if (step === 2) {
    const total = calculateTotal();
    return (
      <div className="min-h-screen bg-white">
        <AlertModalComponent />
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-b border-[#1B3A6B]/10 pb-6 mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-serif font-bold text-[#1B3A6B]">Checkout</h1>
                <p className="text-[#1B3A6B]/60 text-sm mt-1">Complete your order details</p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-4 py-2 border border-[#1B3A6B]/10 text-[#1B3A6B] font-medium rounded-lg hover:bg-[#1B3A6B]/5 transition"
              >
                <ArrowLeft size={16} />
                Back to Shop
              </button>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              className="border border-[#1B3A6B]/10 rounded-lg p-6"
            >
              <h2 className="text-xl font-serif font-bold text-[#1B3A6B] mb-6">Order Summary</h2>
              {cart.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-3 border-b border-[#1B3A6B]/10 last:border-0"
                >
                  <div>
                    <p className="font-serif font-semibold text-[#1B3A6B]">{item.name}</p>
                    <p className="text-sm text-[#1B3A6B]/60">
                      {item.color_name}, Size: {item.size} | Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-serif font-bold text-[#1B3A6B]">
                    KES {(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4 text-lg font-serif font-bold">
                <span className="text-[#1B3A6B]">Total</span>
                <span className="text-[#1B3A6B]">KES {total.toLocaleString()}</span>
              </div>
            </motion.div>

            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
              className="border border-[#1B3A6B]/10 rounded-lg p-6"
            >
              <h2 className="text-xl font-serif font-bold text-[#1B3A6B] mb-6">Customer Information</h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                    Full Name <span className="text-[#C9A84C]">*</span>
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
                    className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                    Phone Number <span className="text-[#C9A84C]">*</span>
                  </label>
                  <p className="text-xs text-[#1B3A6B]/50 mb-1.5">You'll receive an M-PESA prompt on this number</p>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition"
                    placeholder="0712345678"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                    Email Address <span className="text-[#C9A84C]">*</span>
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
                    className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition"
                    placeholder="john.doe@example.com"
                    required
                  />
                </div>
                {errors.submit && (
                  <div className="p-3 bg-[#1B3A6B]/5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] text-sm">
                    {errors.submit}
                  </div>
                )}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 px-4 py-3 border border-[#1B3A6B]/20 text-[#1B3A6B] font-medium rounded-lg hover:bg-[#1B3A6B]/5 transition"
                  >
                    Back to Shop
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 px-4 py-3 bg-[#1B3A6B] text-white font-medium rounded-lg hover:bg-[#152e55] transition"
                  >
                    Continue to Payment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (step === 3) {
    const total = calculateTotal();
    return (
      <div className="min-h-screen bg-white">
        <AlertModalComponent />
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-b border-[#1B3A6B]/10 pb-6 mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-serif font-bold text-[#1B3A6B]">Payment</h1>
                <p className="text-[#1B3A6B]/60 text-sm mt-1">Complete your purchase</p>
              </div>
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-4 py-2 border border-[#1B3A6B]/10 text-[#1B3A6B] font-medium rounded-lg hover:bg-[#1B3A6B]/5 transition"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              className="border border-[#1B3A6B]/10 rounded-lg p-6"
            >
              <h2 className="text-xl font-serif font-bold text-[#1B3A6B] mb-6">M-PESA Payment</h2>
              
              <div className="bg-[#1B3A6B]/5 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#1B3A6B]/60">Amount to Pay</span>
                  <span className="text-2xl font-serif font-bold text-[#1B3A6B]">KES {total.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#1B3A6B]/60">Phone Number</span>
                  <span className="font-medium text-[#1B3A6B]">{customerInfo.phone}</span>
                </div>
              </div>

              {errors.submit && (
                <div className="mb-4 p-3 bg-[#1B3A6B]/5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] text-sm">
                  {errors.submit}
                </div>
              )}

              <div className="space-y-4">
                <button
                  onClick={handlePayment}
                  disabled={isSubmitting}
                  className="w-full px-6 py-4 bg-[#1B3A6B] text-white font-serif font-bold rounded-lg hover:bg-[#152e55] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Smartphone size={20} />
                      Pay with M-PESA
                    </>
                  )}
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="w-full px-6 py-4 border border-[#1B3A6B]/20 text-[#1B3A6B] font-medium rounded-lg hover:bg-[#1B3A6B]/5 transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>

            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
              className="border border-[#1B3A6B]/10 rounded-lg p-6"
            >
              <h2 className="text-xl font-serif font-bold text-[#1B3A6B] mb-6">Order Summary</h2>
              {cart.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-3 border-b border-[#1B3A6B]/10 last:border-0"
                >
                  <div>
                    <p className="font-serif font-semibold text-[#1B3A6B]">{item.name}</p>
                    <p className="text-sm text-[#1B3A6B]/60">
                      {item.color_name}, Size: {item.size} | Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-serif font-bold text-[#1B3A6B]">
                    KES {(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4 text-lg font-serif font-bold">
                <span className="text-[#1B3A6B]">Total</span>
                <span className="text-[#1B3A6B]">KES {total.toLocaleString()}</span>
              </div>
            </motion.div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="min-h-screen bg-white">
        <AlertModalComponent />
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-16">
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="border border-[#1B3A6B]/10 rounded-lg shadow-sm p-8 text-center"
          >
            <div className="w-16 h-16 bg-[#C9A84C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-[#C9A84C]" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-[#1B3A6B] mb-4">
              Order Placed!
            </h1>
            <p className="text-[#1B3A6B]/60 mb-8">
              Your merchandise order has been received and payment confirmed.
              You'll receive updates via email.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/member/dashboard">
                <button className="px-6 py-3 bg-[#1B3A6B] text-white font-medium rounded-lg hover:bg-[#152e55] transition">
                  View Orders
                </button>
              </Link>
              <button
                onClick={resetCart}
                className="px-6 py-3 border border-[#1B3A6B]/20 text-[#1B3A6B] font-medium rounded-lg hover:bg-[#1B3A6B]/5 transition"
              >
                Continue Shopping
              </button>
            </div>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  // ─── PRODUCTS VIEW ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white">
      <AlertModalComponent />
      <Header />

      {/* Hero Section */}
      <section className="bg-[#1B3A6B] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-4"
          >
            Alumni <span className="text-[#C9A84C]">Merchandise</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed"
          >
            Show your Turi pride with official alumni-branded merchandise
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Welcome Banner */}
        {user && !loading && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="bg-[#1B3A6B]/5 border border-[#1B3A6B]/10 rounded-lg p-6 mb-8 flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#1B3A6B] p-3 rounded-lg">
                <BadgeCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold text-[#1B3A6B]">Welcome back, {(user as any).name || user.email}</h2>
                <p className="text-[#1B3A6B]/60 text-sm">Ready to shop official alumni merchandise</p>
              </div>
            </div>
            <Link href="/member/dashboard">
              <button className="px-6 py-2.5 bg-[#1B3A6B] text-white font-medium rounded-lg hover:bg-[#152e55] transition">
                View Orders
              </button>
            </Link>
          </motion.div>
        )}

        {/* Benefits */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-4 gap-6 mb-12"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              variants={scaleIn}
              className="border border-[#1B3A6B]/10 rounded-lg p-6 text-center hover:shadow-sm transition"
            >
              <div className="bg-[#1B3A6B]/5 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <benefit.icon className="w-6 h-6 text-[#1B3A6B]" />
              </div>
              <h3 className="font-serif font-bold text-[#1B3A6B] mb-2">{benefit.title}</h3>
              <p className="text-sm text-[#1B3A6B]/60">{benefit.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {errors.fetch && (
          <div className="bg-[#1B3A6B]/5 border border-[#1B3A6B]/20 rounded-lg p-4 mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#1B3A6B]" />
            <p className="text-[#1B3A6B]">{errors.fetch}</p>
          </div>
        )}

        {/* Products Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
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
              <motion.div
                key={product.id}
                variants={scaleIn}
                whileHover={{ y: -4 }}
                className="border border-[#1B3A6B]/10 rounded-lg overflow-hidden hover:shadow-md transition-all"
              >
                <div className="relative h-56 bg-[#1B3A6B]/5">
                  {selection.color && getProductImage(product, selection.color) ? (
                    <Image
                      src={getProductImage(product, selection.color)}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="text-[#1B3A6B]/30" size={32} />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-lg border border-[#1B3A6B]/10">
                    <p className="text-sm font-serif font-bold text-[#1B3A6B]">
                      KES {product.base_price.toLocaleString()}
                    </p>
                  </div>
                  {product.is_out_of_stock && (
                    <div className="absolute top-3 left-3 bg-[#1B3A6B] text-white px-3 py-1 rounded-lg text-xs font-medium">
                      Out of Stock
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-serif font-bold text-[#1B3A6B] mb-1">
                    {product.name}
                  </h3>
                  <p className="text-[#1B3A6B]/60 text-sm mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="mb-4">
                    <p className="text-xs uppercase tracking-wider text-[#1B3A6B]/50 font-medium mb-2">
                      Color
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {availableColors.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => handleColorSelect(product.id, color.value)}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${
                            selection.color === color.value
                              ? "border-[#C9A84C] scale-110"
                              : "border-[#1B3A6B]/20 hover:border-[#1B3A6B]/50"
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  {selection.color && (
                    <div className="mb-4">
                      <p className="text-xs uppercase tracking-wider text-[#1B3A6B]/50 font-medium mb-2">
                        Size
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {availableSizes.map((sizeInfo) => (
                          <button
                            key={sizeInfo.size}
                            onClick={() => handleSizeSelect(product.id, sizeInfo.size, sizeInfo.variant_id)}
                            disabled={!sizeInfo.available}
                            className={`px-3 py-1 text-sm rounded-lg border transition ${
                              selection.size === sizeInfo.size
                                ? "bg-[#1B3A6B] text-white border-[#1B3A6B]"
                                : sizeInfo.available
                                ? "border-[#1B3A6B]/20 text-[#1B3A6B] hover:border-[#1B3A6B]/50"
                                : "border-[#1B3A6B]/10 text-[#1B3A6B]/30 cursor-not-allowed"
                            }`}
                          >
                            {sizeInfo.size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => addToCart(product)}
                    disabled={!selection.color || !selection.size || product.is_out_of_stock}
                    className={`w-full px-4 py-2.5 font-medium rounded-lg flex items-center justify-center gap-2 transition ${
                      !selection.color || !selection.size || product.is_out_of_stock
                        ? "bg-[#1B3A6B]/5 text-[#1B3A6B]/40 cursor-not-allowed"
                        : "bg-[#1B3A6B] text-white hover:bg-[#152e55]"
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {product.is_out_of_stock ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="border border-[#1B3A6B]/10 rounded-lg p-6 mb-8"
          >
            <h2 className="text-2xl font-serif font-bold text-[#1B3A6B] mb-6">
              Your Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)
            </h2>
            <div className="space-y-4">
              {cart.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-center justify-between p-4 bg-[#1B3A6B]/5 rounded-lg border border-[#1B3A6B]/10 gap-4"
                >
                  <div className="flex-1 min-w-[200px]">
                    <h3 className="font-serif font-bold text-[#1B3A6B]">{item.name}</h3>
                    <p className="text-sm text-[#1B3A6B]/60">
                      {item.color_name} | Size: {item.size} | KES {item.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(index, -1)}
                        className="border border-[#1B3A6B]/20 p-2 rounded-lg hover:bg-[#1B3A6B]/5 transition"
                      >
                        <Minus className="w-4 h-4 text-[#1B3A6B]" />
                      </button>
                      <span className="w-8 text-center font-serif font-bold text-[#1B3A6B]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(index, 1)}
                        className="border border-[#1B3A6B]/20 p-2 rounded-lg hover:bg-[#1B3A6B]/5 transition"
                      >
                        <Plus className="w-4 h-4 text-[#1B3A6B]" />
                      </button>
                    </div>
                    <p className="font-serif font-bold w-24 text-right text-[#1B3A6B]">
                      KES {(item.price * item.quantity).toLocaleString()}
                    </p>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="px-3 py-1 text-[#1B3A6B]/60 hover:text-[#1B3A6B] text-sm font-medium bg-[#1B3A6B]/10 hover:bg-[#1B3A6B]/20 rounded-lg transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between mt-6 pt-6 border-t-2 border-[#1B3A6B]/10 gap-4">
              <p className="text-2xl font-serif font-bold text-[#1B3A6B]">
                Total: <span className="text-[#1B3A6B]">KES {calculateTotal().toLocaleString()}</span>
              </p>
              <button
                onClick={handleCheckout}
                className="px-8 py-3 bg-[#1B3A6B] text-white font-medium rounded-lg hover:bg-[#152e55] transition flex items-center gap-2"
              >
                {!user && <LogIn className="w-4 h-4" />}
                {!user ? "Login to Checkout" : "Proceed to Checkout"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
}