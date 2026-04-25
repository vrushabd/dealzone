"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    MapPin, Phone, User, ChevronRight, ShoppingBag,
    CreditCard, Truck, CheckCircle2, AlertCircle, Lock, Loader2
} from "lucide-react";
import { useCart } from "@/components/cart/CartContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Razorpay: any;
    }
}

const SHIPPING_FEE_COD = 40;

export default function CheckoutPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { items, cartTotal, clearCart } = useCart();

    const [step, setStep] = useState<"address" | "payment" | "done">("address");
    const [paymentMethod, setPaymentMethod] = useState<"COD" | "online">("COD");
    const [completionState, setCompletionState] = useState<"cod" | "paid" | "pendingPayment" | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [orderId, setOrderId] = useState("");

    const [address, setAddress] = useState({
        name: session?.user?.name || "",
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
    });

    // Pre-fill name when session loads
    useEffect(() => {
        if (session?.user?.name) {
            setAddress(a => ({ ...a, name: session.user!.name! }));
        }
    }, [session]);

    // Load saved profile details to speed up checkout
    useEffect(() => {
        if (status !== "authenticated") return;

        let active = true;

        (async () => {
            try {
                const res = await fetch("/api/user/profile");
                if (!res.ok) return;
                const data = await res.json();
                if (!active || !data.user) return;

                setAddress((prev) => ({
                    name: data.user.name || prev.name,
                    phone: data.user.phone || "",
                    address: data.user.address || "",
                    city: data.user.city || "",
                    state: data.user.state || "",
                    pincode: data.user.pincode || "",
                }));
            } catch {
                // Non-blocking: checkout still works without prefill.
            }
        })();

        return () => {
            active = false;
        };
    }, [status]);

    // Redirect unauthenticated users to login
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login?callbackUrl=/checkout");
        }
    }, [status, router]);

    // Redirect empty cart
    useEffect(() => {
        if (status === "authenticated" && items.length === 0 && step !== "done") {
            router.push("/products");
        }
    }, [status, items.length, step, router]);

    const shippingFee = paymentMethod === "COD" ? SHIPPING_FEE_COD : 0;
    const total = cartTotal + shippingFee;

    const placeOrder = async () => {
        setLoading(true);
        setError("");

        try {
            // Create order in DB
            const orderRes = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    paymentMethod,
                    shippingName: address.name,
                    shippingPhone: address.phone,
                    shippingAddress: address.address,
                    shippingCity: address.city,
                    shippingState: address.state,
                    shippingPincode: address.pincode,
                }),
            });

            const orderData = await orderRes.json();
            if (!orderRes.ok) throw new Error(orderData.error || "Failed to create order");

            const newOrderId = orderData.order.id;
            setOrderId(newOrderId);
            await clearCart();

            if (paymentMethod === "COD") {
                setCompletionState("cod");
                setStep("done");
                return;
            }

            // Online payment — create Razorpay order
            const payRes = await fetch("/api/payment/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: newOrderId }),
            });
            const payData = await payRes.json();
            if (!payRes.ok) {
                setCompletionState("pendingPayment");
                setStep("done");
                throw new Error(payData.error || "Payment init failed");
            }

            // Load Razorpay script dynamically
            if (!window.Razorpay) {
                await new Promise<void>((resolve, reject) => {
                    const script = document.createElement("script");
                    script.src = "https://checkout.razorpay.com/v1/checkout.js";
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error("Failed to load Razorpay"));
                    document.body.appendChild(script);
                });
            }

            const rzp = new window.Razorpay({
                key: payData.keyId,
                amount: payData.amount,
                currency: payData.currency,
                name: "GenzLoots",
                description: `Order ${newOrderId}`,
                order_id: payData.razorpayOrderId,
                prefill: {
                    name: address.name,
                    contact: address.phone,
                    email: session?.user?.email || "",
                },
                theme: { color: "#1a6fe8" },
                handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
                    // Verify payment
                    const verRes = await fetch("/api/payment/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            orderId: newOrderId,
                        }),
                    });
                    if (verRes.ok) {
                        setCompletionState("paid");
                        setStep("done");
                    } else {
                        setError("Payment verification failed. Your order is saved and waiting for payment.");
                        setCompletionState("pendingPayment");
                        setStep("done");
                    }
                },
                modal: {
                    ondismiss: () => {
                        setError("Payment cancelled. Your order is saved and waiting for payment.");
                        setCompletionState("pendingPayment");
                        setStep("done");
                    },
                },
            });
            rzp.open();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
                <Loader2 size={28} className="animate-spin text-[var(--brand)]" />
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-[var(--bg-base)] py-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">

                    {/* Header */}
                    <div className="mb-8">
                        <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-4">
                            <Link href="/" className="hover:text-[var(--brand)] transition-colors">Home</Link>
                            <ChevronRight size={14} />
                            <Link href="/cart" className="hover:text-[var(--brand)] transition-colors">Cart</Link>
                            <ChevronRight size={14} />
                            <span className="text-[var(--text-secondary)]">Checkout</span>
                        </nav>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Checkout</h1>
                    </div>

                    {step === "done" ? (
                        /* ── SUCCESS ── */
                        <div className="max-w-md mx-auto text-center py-16">
                            <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 size={40} className="text-green-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
                                {completionState === "paid"
                                    ? "Payment Successful!"
                                    : completionState === "pendingPayment"
                                        ? "Order Saved"
                                        : "Order Placed!"}
                            </h2>
                            <p className="text-[var(--text-secondary)] mb-2">
                                {completionState === "paid"
                                    ? "Payment received! Your order is confirmed."
                                    : completionState === "pendingPayment"
                                        ? "Your order is waiting for payment. Open the order details to complete payment or track updates."
                                        : "Your COD order has been placed. We'll contact you shortly."}
                            </p>
                            {orderId && (
                                <p className="text-xs text-[var(--text-muted)] font-mono mb-8">Order ID: {orderId}</p>
                            )}
                            {error && completionState === "pendingPayment" && (
                                <div className="mb-6 flex items-start gap-2 text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5 text-left">
                                    <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                                    {error}
                                </div>
                            )}
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Link
                                    href={orderId ? `/orders/${orderId}` : "/orders"}
                                    className="btn-primary py-2.5 px-6 text-sm font-bold shine-on-hover"
                                >
                                    {completionState === "pendingPayment" ? "Open Order Details" : "Track My Orders"}
                                </Link>
                                <Link href="/products" className="py-2.5 px-6 text-sm font-semibold border border-[var(--border)] rounded-md hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-all">
                                    Continue Shopping
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
                            {/* ── LEFT PANEL ── */}
                            <div className="space-y-6">

                                {/* Address Form */}
                                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
                                    <h2 className="font-bold text-[var(--text-primary)] text-lg mb-5 flex items-center gap-2">
                                        <MapPin size={18} className="text-[var(--brand)]" />
                                        Shipping Address
                                    </h2>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Full Name *</label>
                                            <div className="relative">
                                                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                                <input type="text" value={address.name} onChange={e => setAddress(a => ({ ...a, name: e.target.value }))}
                                                    className="input-base pl-9" placeholder="Full name" required />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Phone Number *</label>
                                            <div className="relative">
                                                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                                <input type="tel" value={address.phone} onChange={e => setAddress(a => ({ ...a, phone: e.target.value }))}
                                                    className="input-base pl-9" placeholder="10-digit mobile" required />
                                            </div>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Address *</label>
                                            <input type="text" value={address.address} onChange={e => setAddress(a => ({ ...a, address: e.target.value }))}
                                                className="input-base" placeholder="Flat, House No, Building, Street" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">City *</label>
                                            <input type="text" value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))}
                                                className="input-base" placeholder="City" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">State *</label>
                                            <input type="text" value={address.state} onChange={e => setAddress(a => ({ ...a, state: e.target.value }))}
                                                className="input-base" placeholder="State" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Pincode *</label>
                                            <input type="text" value={address.pincode} onChange={e => setAddress(a => ({ ...a, pincode: e.target.value }))}
                                                className="input-base" placeholder="6-digit pincode" required maxLength={6} />
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
                                    <h2 className="font-bold text-[var(--text-primary)] text-lg mb-5 flex items-center gap-2">
                                        <CreditCard size={18} className="text-[var(--brand)]" />
                                        Payment Method
                                    </h2>

                                    <div className="space-y-3">
                                        {/* COD */}
                                        <label className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                            paymentMethod === "COD"
                                                ? "border-[var(--brand)] bg-[hsl(214_89%_52%/0.05)]"
                                                : "border-[var(--border)] hover:border-[var(--border-brand)]"
                                        }`}>
                                            <input type="radio" name="payment" value="COD"
                                                checked={paymentMethod === "COD"}
                                                onChange={() => setPaymentMethod("COD")}
                                                className="mt-1 accent-[var(--brand)]" />
                                            <div>
                                                <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                                                    <Truck size={16} className="text-[var(--brand)]" />
                                                    Cash on Delivery (COD)
                                                </div>
                                                <p className="text-xs text-[var(--text-muted)] mt-1">Pay ₹{SHIPPING_FEE_COD} extra as COD charge. Pay when your order arrives.</p>
                                            </div>
                                        </label>

                                        {/* Online */}
                                        <label className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                            paymentMethod === "online"
                                                ? "border-[var(--brand)] bg-[hsl(214_89%_52%/0.05)]"
                                                : "border-[var(--border)] hover:border-[var(--border-brand)]"
                                        }`}>
                                            <input type="radio" name="payment" value="online"
                                                checked={paymentMethod === "online"}
                                                onChange={() => setPaymentMethod("online")}
                                                className="mt-1 accent-[var(--brand)]" />
                                            <div>
                                                <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                                                    <CreditCard size={16} className="text-[var(--brand)]" />
                                                    Pay Online (UPI / Cards / Wallets)
                                                </div>
                                                <p className="text-xs text-[var(--text-muted)] mt-1">Secure payment via Razorpay. No extra charge. Fastest confirmation.</p>
                                                <div className="flex items-center gap-2 mt-2 text-[10px] text-[var(--text-muted)] font-semibold">
                                                    <Lock size={10} /> 256-bit encrypted · Powered by Razorpay
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* ── RIGHT — ORDER SUMMARY ── */}
                            <div className="lg:sticky lg:top-24">
                                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
                                    <h2 className="font-bold text-[var(--text-primary)] text-base mb-4 flex items-center gap-2">
                                        <ShoppingBag size={16} className="text-[var(--brand)]" />
                                        Order Summary ({items.length} items)
                                    </h2>

                                    {/* Items list */}
                                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1">
                                        {items.map(item => (
                                            <div key={item.productId} className="flex gap-3">
                                                <div className="w-12 h-12 bg-[var(--bg-elevated)] rounded-md overflow-hidden flex-shrink-0">
                                                    {item.product.image ? (
                                                        <Image src={item.product.image} alt={item.product.title} width={48} height={48} className="object-contain w-full h-full p-1" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ShoppingBag size={16} className="text-[var(--text-muted)]" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-2">{item.product.title}</p>
                                                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="text-sm font-bold text-[var(--brand)] flex-shrink-0">
                                                    ₹{((item.product.price || 0) * item.quantity).toLocaleString("en-IN")}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Totals */}
                                    <div className="border-t border-[var(--border)] pt-4 space-y-2">
                                        <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                                            <span>Subtotal</span>
                                            <span>₹{cartTotal.toLocaleString("en-IN")}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                                            <span>Shipping{paymentMethod === "COD" ? " (COD)" : ""}</span>
                                            <span className={paymentMethod === "online" ? "text-green-500 font-semibold" : ""}>
                                                {paymentMethod === "online" ? "FREE" : `+₹${shippingFee}`}
                                            </span>
                                        </div>
                                        <div className="flex justify-between font-bold text-[var(--text-primary)] text-base pt-2 border-t border-[var(--border)]">
                                            <span>Total</span>
                                            <span className="text-[var(--brand)]">₹{total.toLocaleString("en-IN")}</span>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="flex items-start gap-2 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mt-4">
                                            <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        id="place-order-btn"
                                        onClick={placeOrder}
                                        disabled={loading || !address.name || !address.phone || !address.address || !address.city || !address.state || !address.pincode}
                                        className="w-full mt-5 btn-primary py-3.5 text-sm font-bold shine-on-hover btn-glow disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 size={16} className="animate-spin" />
                                                Processing...
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                {paymentMethod === "COD" ? <Truck size={16} /> : <Lock size={16} />}
                                                {paymentMethod === "COD" ? "Place COD Order" : "Pay & Confirm Order"}
                                            </span>
                                        )}
                                    </button>

                                    <p className="text-center text-[10px] text-[var(--text-muted)] mt-3">
                                        By placing order you agree to our{" "}
                                        <Link href="/terms" className="hover:underline text-[var(--brand)]">Terms of Service</Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
