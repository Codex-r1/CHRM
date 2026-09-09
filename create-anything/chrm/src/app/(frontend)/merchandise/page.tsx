"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../(backend)/context/auth";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  ShoppingCart,
  Minus,
  CreditCard,
  Lock,
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
  X,
  Smartphone,
  Loader2,
  Info,
  TrashIcon,
  BadgeCheck,
  ChevronRight,
  Globe,
  Building2,
  Wallet,
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

type ShippingAddress = {
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
};

type ShippingMethod = 'dhl_express' | 'dhl_economy' | 'standard' | 'pickup';

type PaymentMethod = 'mpesa' | 'visa' | 'paypal';

type CustomerInfo = {
  full_name: string;
  phone: string;
  email: string;
  shipping: ShippingAddress;
  shippingMethod: ShippingMethod;
};

type AlertModalType = {
  show: boolean;
  type: 'info' | 'success' | 'error';
  title: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void;
};

// ─── Payment Method Types ──────────────────────────────────────────────────
interface CardDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

// ─── Helper Functions ──────────────────────────────────────────────────────
const detectCardType = (
  number: string
): "visa" | "mastercard" | "amex" | "discover" | "unknown" => {
  const clean = number.replace(/\D/g, "");
  if (/^4/.test(clean)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(clean)) return "mastercard";
  if (/^3[47]/.test(clean)) return "amex";
  if (/^(6011|65|64[4-9])/.test(clean)) return "discover";
  return "unknown";
};

const formatCardNumber = (value: string): string => {
  const clean = value.replace(/\D/g, "");
  const type = detectCardType(clean);

  if (type === "amex") {
    return clean
      .slice(0, 15)
      .replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_, p1, p2, p3) =>
        [p1, p2, p3].filter(Boolean).join(" ")
      );
  }
  return clean
    .slice(0, 16)
    .replace(/(\d{4})/g, "$1 ")
    .trim();
};

const formatExpiry = (value: string): string => {
  const clean = value.replace(/\D/g, "").slice(0, 4);
  if (clean.length >= 3) {
    return `${clean.slice(0, 2)}/${clean.slice(2)}`;
  }
  return clean;
};

const shippingMethods: { id: ShippingMethod; label: string; price: number; time: string; description: string }[] = [
  {
    id: 'dhl_express',
    label: 'DHL Express',
    price: 45,
    time: '2-4 business days',
    description: 'Fastest delivery with tracking and signature'
  },
  {
    id: 'dhl_economy',
    label: 'DHL Economy',
    price: 25,
    time: '5-8 business days',
    description: 'Affordable international shipping with tracking'
  },
  {
    id: 'standard',
    label: 'Standard Shipping',
    price: 10,
    time: '3-7 business days',
    description: 'For deliveries within Kenya'
  },
  {
    id: 'pickup',
    label: 'Pickup from Office',
    price: 0,
    time: 'Ready in 2-3 business days',
    description: 'Collect from our Nairobi office'
  },
];

const countries = [
  "Kenya", "United States", "United Kingdom", "Canada", "Australia", 
  "Germany", "France", "Italy", "Spain", "Netherlands", "Sweden", 
  "Norway", "Denmark", "Finland", "Belgium", "Switzerland", "Austria",
  "South Africa", "Nigeria", "Uganda", "Tanzania", "Rwanda", 
  "Ethiopia", "Egypt", "UAE", "Saudi Arabia", "Singapore", 
  "Malaysia", "India", "China", "Japan", "South Korea", "Brazil"
];

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
    icon: Globe,
    title: "Worldwide Shipping",
    description: "Delivered globally"
  },
  {
    icon: Shield,
    title: "Secure Payment",
    description: "Safe and encrypted payment process"
  }
];

// ─── PaymentMethodSelector Component ──────────────────────────────────────
const PaymentMethodSelector = ({
  paymentMethod,
  setPaymentMethod,
  cardDetails,
  setCardDetails,
  currentFee,
  isProcessing,
}: {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  cardDetails: CardDetails;
  setCardDetails: React.Dispatch<React.SetStateAction<CardDetails>>;
  currentFee: number;
  isProcessing: boolean;
}) => {
  const [hoveredMethod, setHoveredMethod] = useState<PaymentMethod | null>(null);
  const cardType = detectCardType(cardDetails.cardNumber);

  const paymentMethods = [
    {
      id: "mpesa" as PaymentMethod,
      label: "M-PESA",
      icon: "/m-pesa-logo_1.png",
      isImage: true,
      description: "Kenya",
    },
    {
      id: "visa" as PaymentMethod,
      label: "Visa / Mastercard",
      icon: "/mastercard.png",
      isImage: true,
      description: "Global",
    },
    {
      id: "paypal" as PaymentMethod,
      label: "PayPal",
      icon: "/paypal-3384015_1280.png",
      isImage: true,
      description: "Global",
    },
  ];

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardDetails((prev) => ({ ...prev, cardNumber: formatted }));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    setCardDetails((prev) => ({ ...prev, expiryDate: formatted }));
  };

  const getCardLogo = () => {
    switch (cardType) {
      case "visa":
        return (
          <span className="text-xs font-bold text-[#1B3A6B] bg-[#1B3A6B]/10 px-2.5 py-1 rounded border border-[#1B3A6B]/20">
            VISA
          </span>
        );
      case "mastercard":
        return (
          <div className="flex items-center gap-1.5 bg-[#1B3A6B]/10 px-2.5 py-1 rounded border border-[#1B3A6B]/20">
            <span className="text-xs font-bold text-[#1B3A6B]">Mastercard</span>
            <div className="flex">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-90 -mr-1" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 opacity-90" />
            </div>
          </div>
        );
      case "amex":
        return (
          <span className="text-xs font-bold text-white bg-[#0075C2] px-2.5 py-1 rounded">
            American Express
          </span>
        );
      case "discover":
        return (
          <span className="text-xs font-bold text-white bg-[#FF6600] px-2.5 py-1 rounded">
            Discover
          </span>
        );
      default:
        return (
          <img
            src="/mastercard.png"
            alt="Card"
            className="w-8 h-6 object-contain opacity-40"
          />
        );
    }
  };

  // ─── Validate Card Details ──────────────────────────────────────────────
  const validateCardDetails = () => {
    if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length < 15) {
      alert('Please enter a valid card number');
      return false;
    }
    if (!cardDetails.expiryDate || cardDetails.expiryDate.length < 5) {
      alert('Please enter a valid expiry date (MM/YY)');
      return false;
    }
    if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
      alert('Please enter a valid CVV');
      return false;
    }
    if (!cardDetails.cardholderName) {
      alert('Please enter the cardholder name');
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {paymentMethods.map((method) => {
          const isSelected = paymentMethod === method.id;
          const isHovered = hoveredMethod === method.id;
          return (
            <motion.button
              key={method.id}
              type="button"
              onClick={() => setPaymentMethod(method.id)}
              onMouseEnter={() => setHoveredMethod(method.id)}
              onMouseLeave={() => setHoveredMethod(null)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className={`relative p-4 border-2 rounded-lg transition-all duration-300 text-center group cursor-pointer ${
                isSelected
                  ? "border-[#C9A84C] bg-[#C9A84C]/5 shadow-sm"
                  : "border-[#1B3A6B]/10 hover:border-[#1B3A6B]/20 hover:bg-[#1B3A6B]/5"
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="payment-selection"
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#C9A84C] rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <CheckCircle className="w-3 h-3 text-white" />
                </motion.div>
              )}

            
                 
            
            

              <p className={`text-sm font-medium transition-colors duration-300 ${
                isSelected ? "text-[#1B3A6B]" : "text-[#1B3A6B]/70 group-hover:text-[#1B3A6B]"
              }`}>
                {method.label}
              </p>

              {isSelected && (
                <motion.div
                  layoutId="payment-underline"
                  className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#C9A84C] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: 32 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Payment Method Forms */}
      <AnimatePresence mode="wait">
        {paymentMethod === "mpesa" && (
          <motion.div
            key="mpesa"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="p-5 bg-[#1B3A6B]/5 rounded-lg border border-[#1B3A6B]/10"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-[#1B3A6B]/10 rounded-lg mt-0.5">
                <img src="/m-pesa-logo_1.png" alt="M-PESA" className="w-10 h-8 object-contain" />
              </div>
              <div>
                <p className="text-sm text-[#1B3A6B]">
                  <span className="font-semibold">M-PESA Express:</span> You'll receive an automated prompt on your phone to complete payment.
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <span className="flex items-center gap-2 text-xs text-[#1B3A6B]/50">
                    <CheckCircle size={12} /> No account needed
                  </span>
                  <span className="flex items-center gap-2 text-xs text-[#1B3A6B]/50">
                    <Smartphone size={12} /> STK Push
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {paymentMethod === "visa" && (
          <motion.div
            key="visa"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="p-5 bg-[#1B3A6B]/5 rounded-lg border border-[#1B3A6B]/10 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-serif font-bold text-[#1B3A6B] uppercase tracking-wider flex items-center gap-2">
                <CreditCard size={18} className="text-[#C9A84C]" />
                Card Details
              </h4>
              <div className="flex items-center gap-2">{getCardLogo()}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                Card Number <span className="text-[#C9A84C]">*</span>
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B3A6B]/30" size={16} />
                <input
                  type="text"
                  required={paymentMethod === "visa"}
                  maxLength={19}
                  value={cardDetails.cardNumber}
                  onChange={handleCardNumberChange}
                  className="w-full pl-10 pr-20 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition font-mono bg-white"
                  placeholder={cardType === "amex" ? "3782 822463 10005" : "4532 0123 4567 8910"}
                  autoComplete="cc-number"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {cardType !== "unknown" && (
                    <span className="text-[10px] font-bold text-[#1B3A6B] bg-[#1B3A6B]/10 px-1.5 py-0.5 rounded uppercase">
                      {cardType}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                  Expiry Date <span className="text-[#C9A84C]">*</span>
                </label>
                <input
                  type="text"
                  required={paymentMethod === "visa"}
                  maxLength={5}
                  value={cardDetails.expiryDate}
                  onChange={handleExpiryChange}
                  className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition bg-white"
                  placeholder="MM/YY"
                  autoComplete="cc-exp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                  CVV <span className="text-[#C9A84C]">*</span>
                </label>
                <input
                  type="password"
                  required={paymentMethod === "visa"}
                  maxLength={cardType === "amex" ? 4 : 3}
                  value={cardDetails.cvv}
                  onChange={(e) =>
                    setCardDetails((prev) => ({
                      ...prev,
                      cvv: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition font-mono bg-white"
                  placeholder={cardType === "amex" ? "1234" : "123"}
                  autoComplete="cc-csc"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                Cardholder Name <span className="text-[#C9A84C]">*</span>
              </label>
              <input
                type="text"
                required={paymentMethod === "visa"}
                value={cardDetails.cardholderName}
                onChange={(e) =>
                  setCardDetails((prev) => ({
                    ...prev,
                    cardholderName: e.target.value,
                  }))
                }
                className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition bg-white"
                placeholder="Name on card"
                autoComplete="cc-name"
              />
            </div>

            <div className="flex items-center gap-4 pt-2 text-xs text-[#1B3A6B]/40 border-t border-[#1B3A6B]/10">
              <span className="flex items-center gap-1"><Lock size={12} /> 256-bit SSL encryption</span>
              <span className="flex items-center gap-1"><Shield size={12} /> PCI compliant</span>
              {cardType !== "unknown" && cardDetails.cardNumber.length > 2 && (
                <span className="flex items-center gap-1 text-[#C9A84C]">
                  <CheckCircle size={12} /> {cardType} detected
                </span>
              )}
            </div>
          </motion.div>
        )}

        {paymentMethod === "paypal" && (
          <motion.div
            key="paypal"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="p-5 bg-[#1B3A6B]/5 rounded-lg border border-[#1B3A6B]/10"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-[#1B3A6B]/10 rounded-lg">
                <img src="/paypal-3384015_1280.png" alt="PayPal" className="w-12 h-10 object-contain" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-[#1B3A6B]">
                  <span className="font-semibold">PayPal Express:</span> You will be redirected to PayPal to complete your payment securely.
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <span className="flex items-center gap-2 text-xs text-[#1B3A6B]/50">
                    <CheckCircle size={12} /> No PayPal account needed
                  </span>
                  <span className="flex items-center gap-2 text-xs text-[#1B3A6B]/50">
                    <Lock size={12} /> Secure checkout
                  </span>
                  <span className="flex items-center gap-2 text-xs text-[#1B3A6B]/50">
                    <Globe size={12} /> Available in 200+ countries
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────
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
    shipping: {
      full_name: "",
      email: "",
      phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      country: "Kenya",
      postal_code: "",
    },
    shippingMethod: 'standard',
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

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
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
        shipping: {
          ...prev.shipping,
          full_name: (user as any).name || (user as any).user_metadata?.name || "",
          email: user.email || "",
        }
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

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getShippingCost = () => {
    const method = shippingMethods.find(m => m.id === customerInfo.shippingMethod);
    return method ? method.price : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + getShippingCost();
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

  // ─── Handle Payment with Multiple Methods ──────────────────────────────
  const handlePayment = async () => {
    // Validate customer info
    if (!customerInfo.full_name || !customerInfo.phone || !customerInfo.email) {
      setErrors({ submit: 'Please fill in all required fields' });
      showAlert('error', 'Missing Information', 'Please fill in all required fields.');
      return;
    }

    // Validate shipping address
    const shipping = customerInfo.shipping;
    if (customerInfo.shippingMethod !== 'pickup') {
      if (!shipping.address_line1 || !shipping.city || !shipping.country || !shipping.postal_code) {
        setErrors({ submit: 'Please fill in your complete shipping address' });
        showAlert('error', 'Missing Shipping Address', 'Please fill in your complete shipping address.');
        return;
      }
    }

    // Validate phone for M-PESA
    if (paymentMethod === 'mpesa' && !validatePhoneNumber(customerInfo.phone)) {
      setErrors({ submit: 'Please enter a valid Kenyan phone number (e.g., 0712345678)' });
      showAlert('error', 'Invalid Phone', 'Please enter a valid Kenyan phone number.');
      return;
    }

    // Validate card details for Visa
    if (paymentMethod === 'visa') {
      if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length < 15) {
        showAlert('error', 'Invalid Card', 'Please enter a valid card number.');
        return;
      }
      if (!cardDetails.expiryDate || cardDetails.expiryDate.length < 5) {
        showAlert('error', 'Invalid Expiry', 'Please enter a valid expiry date (MM/YY).');
        return;
      }
      if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
        showAlert('error', 'Invalid CVV', 'Please enter a valid CVV.');
        return;
      }
      if (!cardDetails.cardholderName) {
        showAlert('error', 'Missing Name', 'Please enter the cardholder name.');
        return;
      }
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
      const subtotal = calculateSubtotal();
      const shippingCost = getShippingCost();
      const total = calculateTotal();
      const shippingMethod = shippingMethods.find(m => m.id === customerInfo.shippingMethod);

      // Create order
      const orderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          items: cart,
          subtotal: subtotal,
          shipping_cost: shippingCost,
          total: total,
          customer_name: customerInfo.full_name,
          customer_phone: customerInfo.phone,
          customer_email: customerInfo.email,
          shipping_address: customerInfo.shippingMethod === 'pickup' 
            ? 'Pickup from office' 
            : `${shipping.address_line1}, ${shipping.address_line2 || ''}, ${shipping.city}, ${shipping.state || ''}, ${shipping.country}, ${shipping.postal_code}`,
          shipping_method: customerInfo.shippingMethod,
          shipping_details: {
            method: shippingMethod?.label,
            tracking_number: null,
            carrier: customerInfo.shippingMethod.startsWith('dhl') ? 'DHL' : 'Standard',
            estimated_delivery: shippingMethod?.time || '3-7 business days',
          },
          status: 'pending',
          payment_method: paymentMethod,
        })
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // ─── Route to specific payment endpoint ──────────────────────────────
      let endpoint = '';
      let payload = {};

      switch (paymentMethod) {
        case 'mpesa':
          endpoint = '/api/payments/stk-push';
          payload = {
            phoneNumber: customerInfo.phone,
            amount: total,
            paymentType: 'merchandise',
            userId: user.id,
            userEmail: customerInfo.email,
            userName: customerInfo.full_name,
            description: `Merchandise Order - ${cart.length} items (${shippingMethod?.label})`,
            metadata: {
              order_id: orderData.order?.id,
              items: cart,
              subtotal: subtotal,
              shipping_cost: shippingCost,
              total: total,
              customer_name: customerInfo.full_name,
              customer_email: customerInfo.email,
              customer_phone: customerInfo.phone,
              shipping_method: customerInfo.shippingMethod,
              shipping_address: customerInfo.shippingMethod === 'pickup' 
                ? 'Pickup from office' 
                : `${shipping.address_line1}, ${shipping.city}, ${shipping.country}`,
            }
          };
          break;

        case 'visa':
          endpoint = '/api/payments/card';
          payload = {
            amount: total,
            paymentType: 'merchandise',
            userId: user.id,
            userEmail: customerInfo.email,
            userName: customerInfo.full_name,
            cardDetails: {
              cardNumber: cardDetails.cardNumber.replace(/\s/g, ''),
              expiryDate: cardDetails.expiryDate,
              cvv: cardDetails.cvv,
              cardholderName: cardDetails.cardholderName,
            },
            metadata: {
              order_id: orderData.order?.id,
              items: cart,
              subtotal: subtotal,
              shipping_cost: shippingCost,
              total: total,
              customer_name: customerInfo.full_name,
              customer_email: customerInfo.email,
              customer_phone: customerInfo.phone,
              shipping_method: customerInfo.shippingMethod,
              shipping_address: customerInfo.shippingMethod === 'pickup' 
                ? 'Pickup from office' 
                : `${shipping.address_line1}, ${shipping.city}, ${shipping.country}`,
            }
          };
          break;

        case 'paypal':
          endpoint = '/api/payments/paypal';
          payload = {
            amount: total,
            paymentType: 'merchandise',
            userId: user.id,
            userEmail: customerInfo.email,
            userName: customerInfo.full_name,
            metadata: {
              order_id: orderData.order?.id,
              items: cart,
              subtotal: subtotal,
              shipping_cost: shippingCost,
              total: total,
              customer_name: customerInfo.full_name,
              customer_email: customerInfo.email,
              customer_phone: customerInfo.phone,
              shipping_method: customerInfo.shippingMethod,
              shipping_address: customerInfo.shippingMethod === 'pickup' 
                ? 'Pickup from office' 
                : `${shipping.address_line1}, ${shipping.city}, ${shipping.country}`,
            }
          };
          break;

        default:
          throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }

      // ─── Make the payment request ────────────────────────────────────────
      const paymentResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok) {
        throw new Error(paymentData.error || paymentData.message || 'Payment initiation failed');
      }

      // ─── Handle payment response based on method ────────────────────────
      if (paymentMethod === 'mpesa') {
        const checkoutId = paymentData.checkoutRequestID || paymentData.checkoutRequestId || paymentData.CheckoutRequestID;
        if (checkoutId) {
          setCheckoutRequestId(checkoutId);
          setStkStatus('waiting');
          showAlert('info', 'Check Your Phone', 'Enter your M-PESA PIN to complete the payment.', { confirmText: 'OK' });
          startPolling(checkoutId, orderData.order?.id);
        } else {
          throw new Error('No checkout request ID received');
        }
      } else if (paymentMethod === 'visa' || paymentMethod === 'paypal') {
        if (paymentData.redirect_url) {
          showAlert('info', 'Redirecting to Payment Gateway', 'You will be redirected to complete your payment securely.', { confirmText:'OK' });
          setTimeout(() => {
            window.location.href = paymentData.redirect_url;
          }, 2000);
        } else if (paymentData.success) {
          setStkStatus('success');
          showAlert('success', 'Payment Successful!', 'Your payment has been processed successfully.', { confirmText: 'OK' });
          setTimeout(() => {
            setStep(4);
          }, 2000);
        } else {
          throw new Error(paymentData.message || 'Payment failed');
        }
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
            'Your merchandise order has been confirmed. You will receive tracking information via email.',
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
      email: user?.email || "",
      shipping: {
        full_name: "",
        email: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        country: "Kenya",
        postal_code: "",
      },
      shippingMethod: 'standard',
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

  // ─── Shipping Method Selector ──────────────────────────────────────────
  const ShippingMethodSelector = () => (
    <div className="space-y-3">
      <h3 className="text-sm font-serif font-bold text-[#1B3A6B] uppercase tracking-wider">
        Shipping Method <span className="text-xs font-normal text-[#1B3A6B]/50 ml-2">(From Nakuru → Nairobi Hub → You)</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {shippingMethods.map((method) => {
          const isSelected = customerInfo.shippingMethod === method.id;
          const isDHL = method.id.startsWith('dhl');
          
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => setCustomerInfo(prev => ({ ...prev, shippingMethod: method.id }))}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                isSelected
                  ? 'border-[#C9A84C] bg-[#C9A84C]/5'
                  : 'border-[#1B3A6B]/10 hover:border-[#1B3A6B]/20'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {isDHL && (
                      <span className="text-xs font-bold text-[#C9A84C] bg-[#C9A84C]/10 px-2 py-0.5 rounded">
                        DHL
                      </span>
                    )}
                    <span className={`font-semibold text-sm ${isSelected ? 'text-[#1B3A6B]' : 'text-[#1B3A6B]/70'}`}>
                      {method.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#1B3A6B]/50 mt-1">{method.time}</p>
                  <p className="text-xs text-[#1B3A6B]/40 mt-0.5">{method.description}</p>
                  {isDHL && (
                    <p className="text-[10px] text-[#1B3A6B]/30 mt-1 flex items-center gap-1">
                      <Truck size={10} /> Nakuru → Nairobi Hub → Global
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className={`font-serif font-bold ${isSelected ? 'text-[#1B3A6B]' : 'text-[#1B3A6B]/50'}`}>
                    {method.price === 0 ? 'FREE' : `KES ${method.price.toLocaleString()}`}
                  </p>
                  {isSelected && (
                    <CheckCircle className="text-[#C9A84C] mt-1 ml-auto" size={14} />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ─── Shipping Address Form ──────────────────────────────────────────────
  const ShippingAddressForm = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-serif font-bold text-[#1B3A6B] uppercase tracking-wider">
        Shipping Address
      </h3>
      
      {customerInfo.shippingMethod === 'pickup' ? (
        <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-lg p-4">
          <p className="text-sm text-[#1B3A6B] flex items-center gap-2">
            <Building2 size={16} className="text-[#C9A84C]" />
            Pickup from our Nairobi office. You'll receive confirmation when your order is ready.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
              Address Line 1 <span className="text-[#C9A84C]">*</span>
            </label>
            <input
              type="text"
              value={customerInfo.shipping.address_line1}
              onChange={(e) => setCustomerInfo(prev => ({
                ...prev,
                shipping: { ...prev.shipping, address_line1: e.target.value }
              }))}
              className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition"
              placeholder="Street address, P.O. Box"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
              Address Line 2 <span className="text-[#1B3A6B]/50">(Optional)</span>
            </label>
            <input
              type="text"
              value={customerInfo.shipping.address_line2}
              onChange={(e) => setCustomerInfo(prev => ({
                ...prev,
                shipping: { ...prev.shipping, address_line2: e.target.value }
              }))}
              className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition"
              placeholder="Apartment, suite, unit, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
              City <span className="text-[#C9A84C]">*</span>
            </label>
            <input
              type="text"
              value={customerInfo.shipping.city}
              onChange={(e) => setCustomerInfo(prev => ({
                ...prev,
                shipping: { ...prev.shipping, city: e.target.value }
              }))}
              className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition"
              placeholder="City"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
              State/Province <span className="text-[#1B3A6B]/50">(Optional)</span>
            </label>
            <input
              type="text"
              value={customerInfo.shipping.state}
              onChange={(e) => setCustomerInfo(prev => ({
                ...prev,
                shipping: { ...prev.shipping, state: e.target.value }
              }))}
              className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition"
              placeholder="State/Province"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
              Country <span className="text-[#C9A84C]">*</span>
            </label>
            <select
              value={customerInfo.shipping.country}
              onChange={(e) => setCustomerInfo(prev => ({
                ...prev,
                shipping: { ...prev.shipping, country: e.target.value }
              }))}
              className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition bg-white"
            >
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
              Postal/ZIP Code <span className="text-[#C9A84C]">*</span>
            </label>
            <input
              type="text"
              value={customerInfo.shipping.postal_code}
              onChange={(e) => setCustomerInfo(prev => ({
                ...prev,
                shipping: { ...prev.shipping, postal_code: e.target.value }
              }))}
              className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition"
              placeholder="Postal/ZIP Code"
            />
          </div>
        </div>
      )}
    </div>
  );

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

  // ─── STEP 2: Checkout ────────────────────────────────────────────────────
  if (step === 2) {
    const subtotal = calculateSubtotal();
    const shippingCost = getShippingCost();
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
                <p className="text-[#1B3A6B]/60 text-sm mt-1">Complete your order and shipping details</p>
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
              className="space-y-6"
            >
              {/* Customer Info */}
              <div className="border border-[#1B3A6B]/10 rounded-lg p-6">
                <h2 className="text-xl font-serif font-bold text-[#1B3A6B] mb-6">Customer Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                      Full Name <span className="text-[#C9A84C]">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerInfo.full_name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, full_name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1B3A6B] mb-1.5">
                      Email Address <span className="text-[#C9A84C]">*</span>
                    </label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition"
                      placeholder="john@example.com"
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
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] focus:outline-none focus:border-[#C9A84C] transition"
                      placeholder="0712345678"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Method */}
              <div className="border border-[#1B3A6B]/10 rounded-lg p-6">
                <ShippingMethodSelector />
              </div>
            </motion.div>

            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              {/* Shipping Address */}
              <div className="border border-[#1B3A6B]/10 rounded-lg p-6">
                <ShippingAddressForm />
              </div>

              {/* Order Summary */}
              <div className="border border-[#1B3A6B]/10 rounded-lg p-6">
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
                <div className="space-y-2 pt-4 border-t border-[#1B3A6B]/10">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#1B3A6B]/60">Subtotal</span>
                    <span className="text-[#1B3A6B]">KES {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#1B3A6B]/60">
                      Shipping ({shippingMethods.find(m => m.id === customerInfo.shippingMethod)?.label})
                    </span>
                    <span className="text-[#1B3A6B]">
                      {shippingCost === 0 ? 'FREE' : `KES ${shippingCost.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 text-lg font-serif font-bold">
                    <span className="text-[#1B3A6B]">Total</span>
                    <span className="text-[#1B3A6B]">KES {total.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep(3)}
                  className="w-full mt-6 px-4 py-3 bg-[#1B3A6B] text-white font-medium rounded-lg hover:bg-[#152e55] transition"
                >
                  Continue to Payment
                </button>
              </div>
            </motion.div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ─── STEP 3: Payment ──────────────────────────────────────────────────────
  if (step === 3) {
    const subtotal = calculateSubtotal();
    const shippingCost = getShippingCost();
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
              <h2 className="text-xl font-serif font-bold text-[#1B3A6B] mb-6">Payment Method</h2>
              
              <PaymentMethodSelector
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                cardDetails={cardDetails}
                setCardDetails={setCardDetails}
                currentFee={total}
                isProcessing={isSubmitting || stkStatus === 'waiting'}
              />

              {errors.submit && (
                <div className="mt-4 p-3 bg-[#1B3A6B]/5 border border-[#1B3A6B]/20 rounded-lg text-[#1B3A6B] text-sm">
                  {errors.submit}
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={isSubmitting || stkStatus === 'waiting'}
                className="w-full mt-4 px-6 py-4 bg-[#1B3A6B] text-white font-serif font-bold rounded-lg hover:bg-[#152e55] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting || stkStatus === 'waiting' ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Processing...
                  </>
                ) : (
                  <>
                    {paymentMethod === 'mpesa' && <Smartphone size={20} />}
                    {paymentMethod === 'visa' && <CreditCard size={20} />}
                    {paymentMethod === 'paypal' && <Wallet size={20} />}
                    Pay KES {total.toLocaleString()} with {paymentMethod === 'mpesa' ? 'M-PESA' : paymentMethod === 'visa' ? 'Card' : 'PayPal'}
                  </>
                )}
              </button>
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
              <div className="space-y-2 pt-4 border-t border-[#1B3A6B]/10">
                <div className="flex justify-between text-sm">
                  <span className="text-[#1B3A6B]/60">Subtotal</span>
                  <span className="text-[#1B3A6B]">KES {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#1B3A6B]/60">
                    Shipping ({shippingMethods.find(m => m.id === customerInfo.shippingMethod)?.label})
                  </span>
                  <span className="text-[#1B3A6B]">
                    {shippingCost === 0 ? 'FREE' : `KES ${shippingCost.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 text-lg font-serif font-bold">
                  <span className="text-[#1B3A6B]">Total</span>
                  <span className="text-[#1B3A6B]">KES {total.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ─── STEP 4: Success ──────────────────────────────────────────────────────
  if (step === 4) {
    const shippingMethod = shippingMethods.find(m => m.id === customerInfo.shippingMethod);
    
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
              Order Confirmed! 🎉
            </h1>
            <p className="text-[#1B3A6B]/60 mb-6">
              Your merchandise order has been received and payment confirmed.
            </p>
            
            <div className="bg-[#1B3A6B]/5 rounded-lg p-4 mb-6 text-left border border-[#1B3A6B]/10">
              <h3 className="font-serif font-semibold text-[#1B3A6B] mb-3">Shipping Details</h3>
              <div className="space-y-1.5 text-sm">
                <p className="text-[#1B3A6B]/60">
                  <span className="font-medium text-[#1B3A6B]">Method:</span> {shippingMethod?.label}
                </p>
                <p className="text-[#1B3A6B]/60">
                  <span className="font-medium text-[#1B3A6B]">Estimated Delivery:</span> {shippingMethod?.time}
                </p>
                {customerInfo.shippingMethod !== 'pickup' && (
                  <>
                    <p className="text-[#1B3A6B]/60">
                      <span className="font-medium text-[#1B3A6B]">Address:</span> {customerInfo.shipping.address_line1}
                      {customerInfo.shipping.address_line2 && `, ${customerInfo.shipping.address_line2}`}
                    </p>
                    <p className="text-[#1B3A6B]/60">
                      {customerInfo.shipping.city}, {customerInfo.shipping.country} {customerInfo.shipping.postal_code}
                    </p>
                  </>
                )}
                {customerInfo.shippingMethod === 'pickup' && (
                  <p className="text-[#C9A84C] font-medium">Pickup from Nairobi office</p>
                )}
              </div>
            </div>

            <p className="text-sm text-[#1B3A6B]/50 mb-8">
              You'll receive a confirmation email with tracking information once your order ships.
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

  // ─── PRODUCTS VIEW (Step 1) ──────────────────────────────────────────────
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
            Show your Turi pride with official alumni-branded merchandise. 
            <span className="block text-sm mt-1 text-white/50">Global shipping</span>
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
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              variants={scaleIn}
              className="border border-[#1B3A6B]/10 rounded-lg p-4 md:p-6 text-center hover:shadow-sm transition"
            >
              <div className="bg-[#1B3A6B]/5 w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mx-auto mb-2 md:mb-4">
                <benefit.icon className="w-5 h-5 md:w-6 md:h-6 text-[#1B3A6B]" />
              </div>
              <h3 className="font-serif font-bold text-[#1B3A6B] text-sm md:text-base mb-1">{benefit.title}</h3>
              <p className="text-xs md:text-sm text-[#1B3A6B]/60">{benefit.description}</p>
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

                  {/* ─── LIVE INVENTORY DISPLAY ─── */}
                  {selection.color && selection.size && (() => {
                    const selectedVariant = product.variants.find(
                      v => v.id === selection.variant_id
                    );
                    if (!selectedVariant) return null;
                    
                    const stock = selectedVariant.stock_quantity;
                    const isLowStock = stock <= 5 && stock > 0;
                    const isOutOfStock = stock <= 0;
                    
                    return (
                      <div className="mb-4 pb-3 border-b border-[#1B3A6B]/10">
                        <div className="flex items-center gap-2">
                          {isOutOfStock ? (
                            <span className="text-xs font-semibold text-[#E53E3E] flex items-center gap-1.5">
                              <AlertCircle size={14} />
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="text-xs font-semibold text-[#FF7A00] flex items-center gap-1.5">
                              <AlertCircle size={14} />
                              Only {stock} left in stock - Order soon!
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-[#1B3A6B]/60 flex items-center gap-1.5">
                              <CheckCircle size={14} className="text-[#C9A84C]" />
                              {stock} in stock
                            </span>
                          )}
                          {/* Stock indicator bar */}
                          <div className="flex-1 h-1.5 bg-[#1B3A6B]/10 rounded-full overflow-hidden max-w-[80px]">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                isOutOfStock ? 'bg-[#E53E3E]' : 
                                isLowStock ? 'bg-[#FF7A00]' : 
                                'bg-[#C9A84C]'
                              }`}
                              style={{ 
                                width: isOutOfStock ? '0%' : 
                                       isLowStock ? `${(stock / 5) * 100}%` : 
                                       '100%' 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}

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
                      className="p-2 text-[#1B3A6B]/40 hover:text-[#E53E3E] hover:bg-[#E53E3E]/10 rounded-lg transition"
                      aria-label="Remove item"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between mt-6 pt-6 border-t-2 border-[#1B3A6B]/10 gap-4">
              <div>
                <p className="text-2xl font-serif font-bold text-[#1B3A6B]">
                  Total: <span className="text-[#1B3A6B]">KES {calculateTotal().toLocaleString()}</span>
                </p>
                <p className="text-xs text-[#1B3A6B]/50 mt-1">Shipping calculated at checkout</p>
              </div>
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