"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../(backend)/context/auth";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  ShoppingCart, Minus, Plus, CheckCircle, Package, AlertCircle, 
  TrashIcon, LogIn, Loader2, ArrowLeft, Globe, Truck, Shield, X, Smartphone
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import PaymentMethodSelector, { PaymentMethod, CardDetails } from "../components/PaymentMethodSelector";

type ProductVariant = { id: string; color_name: string; color_value: string; color_hex: string; size: string; stock_quantity: number; is_available: boolean; image_url: string; };
type Product = { id: string; name: string; base_price: number; description: string; is_out_of_stock: boolean; variants: ProductVariant[]; };
type CartItem = { variant_id: string; product_id: string; name: string; price: number; color_name: string; size: string; image: string; quantity: number; stock_available: number; };

type ShippingMethod = 'dhl_express' | 'dhl_economy' | 'pickup';
const SHIPPING_METHODS: { id: ShippingMethod; label: string; price: number; time: string }[] = [
  { id: 'dhl_express', label: 'DHL Express Worldwide', price: 45, time: '2-4 business days' },
  { id: 'dhl_economy', label: 'DHL Economy Select', price: 25, time: '5-8 business days' },
  { id: 'pickup', label: 'Pickup from School', price: 0, time: 'Ready in 2-3 days' },
];

const SHIPPING_COUNTRIES = ["Kenya", "United Kingdom", "United States", "Canada", "Australia", "South Africa", "Other"];

export default function MerchandisePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [step, setStep] = useState(1); // 1 = Shop, 2 = Checkout, 3 = Waiting for PIN, 4 = Success
  const [selectedProducts, setSelectedProducts] = useState<Record<string, { color: string; size: string; variant_id: string }>>({});
  
  // Checkout State
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", address: "", city: "", country: "Kenya", shippingMethod: 'dhl_express' as ShippingMethod });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [cardDetails, setCardDetails] = useState<CardDetails>({ cardNumber: '', expiryDate: '', cvv: '', cardholderName: '' });
  
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // M-PESA Polling State
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch('/api/products/list').then(res => res.json()).then(data => setProducts(data.products || []));
  }, []);

  useEffect(() => {
    if (user) setCustomer(prev => ({ ...prev, name: user.user_metadata?.full_name || "", email: user.email || "" }));
  }, [user]);

  // Cleanup polling
  useEffect(() => {
    return () => { if (pollingInterval) clearInterval(pollingInterval); };
  }, [pollingInterval]);

  // --- Product Logic (Restored) ---
  const getAvailableColors = (product: Product) => Array.from(new Map(product.variants.map(v => [v.color_value, v])).values());
  const getAvailableSizes = (product: Product, colorValue: string) => product.variants.filter(v => v.color_value === colorValue).map(v => ({ size: v.size, available: v.stock_quantity > 0, variant_id: v.id, stock: v.stock_quantity }));
  const getProductImage = (product: Product, colorValue: string) => product.variants.find(v => v.color_value === colorValue)?.image_url || product.variants[0]?.image_url;

  const handleColorSelect = (productId: string, color: string) => setSelectedProducts(prev => ({ ...prev, [productId]: { color, size: "", variant_id: "" } }));
  const handleSizeSelect = (productId: string, size: string, variantId: string) => setSelectedProducts(prev => ({ ...prev, [productId]: { ...prev[productId], size, variant_id: variantId } }));

  const addToCart = (product: Product) => {
    const sel = selectedProducts[product.id];
    if (!sel?.variant_id) return;
    const variant = product.variants.find(v => v.id === sel.variant_id);
    if (!variant) return;

    setCart(prev => {
      const existing = prev.find(item => item.variant_id === variant.id);
      if (existing) {
        if (existing.quantity >= variant.stock_quantity) return prev;
        return prev.map(item => item.variant_id === variant.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { variant_id: variant.id, product_id: product.id, name: product.name, price: product.base_price, color_name: variant.color_name, size: variant.size, image: variant.image_url, quantity: 1, stock_available: variant.stock_quantity }];
    });
  };

  const updateQty = (idx: number, delta: number) => setCart(prev => prev.map((item, i) => i === idx ? { ...item, quantity: Math.min(item.stock_available, Math.max(1, item.quantity + delta)) } : item));
  const removeItem = (idx: number) => setCart(prev => prev.filter((_, i) => i !== idx));

  const calculateSubtotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const getShippingCost = () => SHIPPING_METHODS.find(m => m.id === customer.shippingMethod)?.price || 0;
  const calculateTotal = () => calculateSubtotal() + getShippingCost();

  // --- Checkout Flow ---
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return router.push('/login?redirect=/merchandise');
    setLoadingCheckout(true);
    setErrorMsg("");

    try {
      const total = calculateTotal();
      const res = await fetch('/api/orders/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, items: cart, total, customer_name: customer.name, customer_email: customer.email, customer_phone: customer.phone, shipping_address: customer.shippingMethod === 'pickup' ? 'Pickup from School' : `${customer.address}, ${customer.city}, ${customer.country}`, shipping_method: customer.shippingMethod, payment_method: paymentMethod })
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error);

      if (paymentMethod === 'mpesa') {
        const mpesaRes = await fetch('/api/payments/stk-push', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: customer.phone, amount: total, paymentType: 'merchandise', userId: user.id, metadata: { order_id: order.order.id, items: cart } })
        });
        const mpesaData = await mpesaRes.json();
        if (!mpesaRes.ok) throw new Error(mpesaData.message);
        
        setCheckoutRequestId(mpesaData.checkoutRequestID);
        setStep(3); // Show PIN Modal
        startPolling(mpesaData.checkoutRequestID);
      } else {
        // Stripe Card Logic
        setStep(4); // Success
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoadingCheckout(false);
    }
  };

  const startPolling = (id: string) => {
    let count = 0;
    const interval = setInterval(async () => {
      count++;
      if (count > 40) { clearInterval(interval); setPollingInterval(null); setStep(2); setErrorMsg("Payment timed out."); return; }
      
      const res = await fetch(`/api/payments/${id}`);
      const data = await res.json();
      
      if (data.status === 'confirmed') {
        clearInterval(interval); setPollingInterval(null);
        setStep(4); // Success
      } else if (data.status === 'failed' || data.status === 'cancelled') {
        clearInterval(interval); setPollingInterval(null);
        setStep(2); setErrorMsg("Payment failed or was cancelled.");
      }
    }, 3000);
    setPollingInterval(interval);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  // ─── PIN MODAL (Step 3) ───
  if (step === 3) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-sm w-full bg-white border border-[#1B3A6B]/10 rounded-lg shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-[#1B3A6B]/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="text-[#1B3A6B]" size={32} />
            </div>
            <h2 className="font-serif text-2xl text-[#1B3A6B] mb-2">Enter M-PESA PIN</h2>
            <p className="text-sm text-[#1B3A6B]/60 mb-6">A prompt was sent to <strong>{customer.phone}</strong>. Please enter your PIN on your phone to authorize the payment of <strong>KES {calculateTotal().toLocaleString()}</strong>.</p>
            <div className="flex justify-center gap-2 mb-6">
              <div className="w-2 h-2 bg-[#C9A84C] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-[#C9A84C] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-[#C9A84C] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <button onClick={() => { if(pollingInterval) clearInterval(pollingInterval); setStep(2); }} className="text-sm text-[#1B3A6B]/50 hover:text-[#1B3A6B]">Cancel Payment</button>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── SUCCESS (Step 4) ───
  if (step === 4) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="max-w-md">
            <CheckCircle className="mx-auto text-[#C9A84C] mb-6" size={48} />
            <h1 className="font-serif text-3xl text-[#1B3A6B] mb-4">Order Confirmed</h1>
            <p className="text-[#1B3A6B]/60 mb-8">Thank you for your purchase. We will email you DHL tracking information shortly.</p>
            <Link href="/member/dashboard" className="bg-[#1B3A6B] text-white px-8 py-3 rounded-sm text-sm font-semibold uppercase tracking-wider">View Orders</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── CHECKOUT (Step 2) ───
  if (step === 2) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
          <div className="mb-10 flex items-center justify-between border-b border-[#1B3A6B]/10 pb-4">
            <h1 className="font-serif text-3xl text-[#1B3A6B]">Checkout</h1>
            <button onClick={() => setStep(1)} className="text-sm text-[#1B3A6B]/60 hover:text-[#1B3A6B]">Return to Shop</button>
          </div>

          <div className="grid md:grid-cols-2 gap-16">
            <form onSubmit={handleCheckout} className="space-y-8">
              {errorMsg && <div className="p-3 bg-red-50 text-red-600 text-sm border-l-2 border-red-500">{errorMsg}</div>}
              
              <div className="space-y-4">
                <h2 className="font-serif text-xl text-[#1B3A6B]">Contact</h2>
                <input required type="email" placeholder="Email" value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} className="w-full border-b border-[#1B3A6B]/30 py-2 text-sm focus:border-[#1B3A6B] outline-none" />
                <input required type="tel" placeholder="Phone (M-PESA)" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="w-full border-b border-[#1B3A6B]/30 py-2 text-sm focus:border-[#1B3A6B] outline-none" />
              </div>

              <div className="space-y-4">
                <h2 className="font-serif text-xl text-[#1B3A6B]">Shipping</h2>
                <input required type="text" placeholder="Full Name" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="w-full border-b border-[#1B3A6B]/30 py-2 text-sm focus:border-[#1B3A6B] outline-none" />
                
                {customer.shippingMethod !== 'pickup' && (
                  <>
                    <input required type="text" placeholder="Address" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="w-full border-b border-[#1B3A6B]/30 py-2 text-sm focus:border-[#1B3A6B] outline-none" />
                    <div className="grid grid-cols-2 gap-4">
                      <input required type="text" placeholder="City" value={customer.city} onChange={e => setCustomer({...customer, city: e.target.value})} className="w-full border-b border-[#1B3A6B]/30 py-2 text-sm focus:border-[#1B3A6B] outline-none" />
                      <select required value={customer.country} onChange={e => setCustomer({...customer, country: e.target.value})} className="w-full border-b border-[#1B3A6B]/30 py-2 text-sm focus:border-[#1B3A6B] outline-none bg-transparent">
                        {SHIPPING_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#1B3A6B] mb-2">Shipping Method</label>
                  <div className="space-y-2">
                    {SHIPPING_METHODS.map(m => (
                      <label key={m.id} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${customer.shippingMethod === m.id ? 'border-[#1B3A6B] bg-[#1B3A6B]/5' : 'border-[#1B3A6B]/10 hover:border-[#1B3A6B]/30'}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="shipping" checked={customer.shippingMethod === m.id} onChange={() => setCustomer({...customer, shippingMethod: m.id})} className="accent-[#1B3A6B]" />
                          <div>
                            <p className="text-sm font-medium text-[#1B3A6B]">{m.label}</p>
                            <p className="text-xs text-[#1B3A6B]/50">{m.time}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-[#1B3A6B]">{m.price === 0 ? 'FREE' : `KES ${m.price}`}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="font-serif text-xl text-[#1B3A6B]">Payment</h2>
                <PaymentMethodSelector paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} cardDetails={cardDetails} setCardDetails={setCardDetails} currentFee={calculateTotal()} isProcessing={loadingCheckout} />
              </div>

              <button type="submit" disabled={loadingCheckout} className="w-full bg-[#1B3A6B] text-white py-3.5 text-xs font-bold uppercase tracking-widest hover:bg-[#152e55] transition flex justify-center items-center gap-2">
                {loadingCheckout ? <Loader2 className="animate-spin" size={16} /> : `Pay KES ${calculateTotal().toLocaleString()}`}
              </button>
            </form>

            <div className="bg-[#F9F9F8] p-8 h-fit border border-[#1B3A6B]/10">
              <h2 className="font-serif text-xl text-[#1B3A6B] mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                {cart.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-[#1B3A6B]/70">{item.quantity}x {item.name} ({item.size})</span>
                    <span className="text-[#1B3A6B] font-medium">KES {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#1B3A6B]/10 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-[#1B3A6B]/60"><span>Subtotal</span><span>KES {calculateSubtotal().toLocaleString()}</span></div>
                <div className="flex justify-between text-[#1B3A6B]/60"><span>Shipping ({SHIPPING_METHODS.find(m => m.id === customer.shippingMethod)?.label})</span><span>KES {getShippingCost().toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-lg text-[#1B3A6B] mt-2 pt-2 border-t border-[#1B3A6B]/10"><span>Total</span><span>KES {calculateTotal().toLocaleString()}</span></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── SHOP (Step 1) ───
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <section className="bg-[#1B3A6B] py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Alumni <span className="text-[#C9A84C]">Merchandise</span></h1>
        <p className="text-lg text-white/70 max-w-2xl mx-auto">Show your Turi pride with official alumni-branded merchandise.</p>
      </section>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map(product => {
            const selection = selectedProducts[product.id] || { color: "", size: "", variant_id: "" };
            const colors = getAvailableColors(product);
            const sizes = selection.color ? getAvailableSizes(product, selection.color) : [];
            const selectedVariant = product.variants.find(v => v.id === selection.variant_id);

            return (
              <div key={product.id} className="group border border-[#1B3A6B]/10 rounded-lg overflow-hidden hover:shadow-md transition-all flex flex-col">
                <div className="relative aspect-[4/5] bg-[#F9F9F8]">
                  <Image src={getProductImage(product, selection.color) || '/placeholder.png'} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-lg border border-[#1B3A6B]/10">
                    <p className="text-sm font-serif font-bold text-[#1B3A6B]">KES {product.base_price.toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-serif text-lg font-bold text-[#1B3A6B] mb-1">{product.name}</h3>
                  <p className="text-sm text-[#1B3A6B]/60 mb-4 line-clamp-2">{product.description}</p>

                  {selectedVariant && (
                    <div className="mb-4 pb-3 border-b border-[#1B3A6B]/10">
                      {selectedVariant.stock_quantity > 5 ? (
                        <span className="text-xs font-medium text-[#1B3A6B]/60 flex items-center gap-1.5"><CheckCircle size={14} className="text-[#C9A84C]" /> {selectedVariant.stock_quantity} in stock</span>
                      ) : selectedVariant.stock_quantity > 0 ? (
                        <span className="text-xs font-semibold text-[#FF7A00] flex items-center gap-1.5"><AlertCircle size={14} /> Only {selectedVariant.stock_quantity} left</span>
                      ) : (
                        <span className="text-xs font-semibold text-[#E53E3E] flex items-center gap-1.5"><AlertCircle size={14} /> Out of stock</span>
                      )}
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="text-xs uppercase tracking-wider text-[#1B3A6B]/50 font-medium mb-2">Color</p>
                    <div className="flex gap-2 flex-wrap">
                      {colors.map(c => (
                        <button key={c.color_value} onClick={() => handleColorSelect(product.id, c.color_value)} className={`w-7 h-7 rounded-full border-2 transition-all ${selection.color === c.color_value ? "border-[#C9A84C] scale-110" : "border-[#1B3A6B]/20 hover:border-[#1B3A6B]/50"}`} style={{ backgroundColor: c.color_hex }} title={c.color_name} />
                      ))}
                    </div>
                  </div>

                  {selection.color && (
                    <div className="mb-4">
                      <p className="text-xs uppercase tracking-wider text-[#1B3A6B]/50 font-medium mb-2">Size</p>
                      <div className="flex gap-2 flex-wrap">
                        {sizes.map(s => (
                          <button key={s.size} onClick={() => handleSizeSelect(product.id, s.size, s.variant_id)} disabled={!s.available} className={`px-3 py-1 text-sm rounded-lg border transition ${selection.size === s.size ? "bg-[#1B3A6B] text-white border-[#1B3A6B]" : s.available ? "border-[#1B3A6B]/20 text-[#1B3A6B] hover:border-[#1B3A6B]/50" : "border-[#1B3A6B]/10 text-[#1B3A6B]/30 cursor-not-allowed"}`}>{s.size}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto">
                    <button onClick={() => addToCart(product)} disabled={!selection.variant_id || product.is_out_of_stock} className={`w-full px-4 py-2.5 font-medium rounded-lg flex items-center justify-center gap-2 transition ${!selection.variant_id || product.is_out_of_stock ? "bg-[#1B3A6B]/5 text-[#1B3A6B]/40 cursor-not-allowed" : "bg-[#1B3A6B] text-white hover:bg-[#152e55]"}`}>
                      <ShoppingCart className="w-4 h-4" /> Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 w-full bg-white border-t border-[#1B3A6B]/10 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
            <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#1B3A6B]/5 rounded-full flex items-center justify-center"><ShoppingCart size={18} className="text-[#1B3A6B]" /></div>
                <div>
                  <p className="font-serif text-lg text-[#1B3A6B]">{cart.reduce((sum, item) => sum + item.quantity, 0)} items</p>
                  <p className="text-sm text-[#1B3A6B]/60">KES {calculateTotal().toLocaleString()}</p>
                </div>
              </div>
              <button onClick={() => setStep(2)} className="bg-[#1B3A6B] text-white px-8 py-3 text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#152e55] transition">Proceed to Checkout</button>
            </div>
          </div>
        )}
        <div className="h-24" />
      </main>
      <Footer />
    </div>
  );
}