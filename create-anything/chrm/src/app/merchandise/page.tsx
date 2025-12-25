"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ShoppingCart, Minus, Plus, CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Define types
type Product = {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
  quantity?: number;
};

type CartItem = Product & {
  quantity: number;
};

type CustomerInfo = {
  full_name: string;
  phone: string;
  email: string;
};

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "T-Shirt",
    price: 1000,
    image: "/T-SHIRT.jpeg",
    description: "Premium cotton CHRMAA t-shirt",
  },
  {
    id: 2,
    name: "Polo Shirt",
    price: 1500,
    image: "/POLO.jpeg",
    description: "Professional CHRMAA polo shirt",
  },
  {
    id: 3,
    name: "Hoodie",
    price: 1800,
    image: "/Hoodie.jpeg",
    description: "Comfortable CHRMAA hoodie",
  },
  {
    id: 4,
    name: "Lapel Pin",
    price: 1000,
    image: "/lapel Pin.jpeg",
    description: "Elegant CHRMAA lapel pin",
  },
];

export default function MerchandisePage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState(1); // 1: shopping, 2: checkout, 3: payment instructions, 4: success
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    full_name: "",
    phone: "",
    email: "",
  });
  const router = useRouter();

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === productId) {
            const newQuantity = item.quantity + delta;
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null),
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.id !== productId));
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
    setStep(1);
    setCustomerInfo({ full_name: "", phone: "", email: "" });
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
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>
                        {item.name} x {item.quantity}
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
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-2 border-b border-[#334155]"
                  >
                    <div>
                      <p className="text-[#f8fafc] font-semibold">
                        {item.name}
                      </p>
                      <p className="text-[#94a3b8] text-sm">
                        Qty: {item.quantity}
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
            {PRODUCTS.map((product) => (
              <div
                key={product.id}
                className="bg-[#1e293b] rounded-lg border border-[#334155] overflow-hidden hover:border-[#d69e2e] transition"
              >
                {/* Using next/image for better optimization */}
                <div className="relative w-full h-64">
                  <Image
                    src={product.image}
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
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-[#d69e2e]">
                      Ksh {product.price.toLocaleString()}
                    </span>
                    <button
                      onClick={() => addToCart(product)}
                      className="px-4 py-2 bg-[#2563eb] text-white font-semibold rounded hover:bg-[#1d4ed8] transition flex items-center gap-2"
                    >
                      <ShoppingCart size={18} />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
                {cart.map((item) => (
                  <div
                    key={item.id}
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
                        <p className="text-[#94a3b8]">
                          Ksh {item.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="bg-[#1e293b] p-2 rounded hover:bg-[#334155] transition"
                        >
                          <Minus size={16} className="text-[#f8fafc]" />
                        </button>
                        <span className="text-[#f8fafc] font-bold w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="bg-[#1e293b] p-2 rounded hover:bg-[#334155] transition"
                        >
                          <Plus size={16} className="text-[#f8fafc]" />
                        </button>
                      </div>
                      <span className="text-[#d69e2e] font-bold w-24 text-right">
                        Ksh {(item.price * item.quantity).toLocaleString()}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-400 font-bold w-24 text-sm rounded hover:bg-[#b8832a]"
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