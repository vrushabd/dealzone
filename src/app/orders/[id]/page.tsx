"use client";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Package, ChevronRight, MapPin, Phone, CreditCard, Loader2, CheckCircle2, Truck, Clock, XCircle, AlertCircle, Lock } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Order {
    id: string;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    subtotal: number;
    shippingFee: number;
    total: number;
    shippingName: string;
    shippingPhone: string;
    shippingAddress: string;
    shippingCity: string;
    shippingState: string;
    shippingPincode: string;
    adminNote?: string;
    createdAt: string;
    items: Array<{ id: string; productTitle: string; productImage?: string; quantity: number; price: number }>;
}

const statusSteps = ["pending", "confirmed", "ordered", "shipped", "delivered"];
const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    pending:   { label: "Order Placed",  icon: Clock,         color: "text-amber-500" },
    confirmed: { label: "Confirmed",     icon: CheckCircle2,  color: "text-blue-500" },
    ordered:   { label: "Ordered",       icon: Package,       color: "text-purple-500" },
    shipped:   { label: "Shipped",       icon: Truck,         color: "text-cyan-500" },
    delivered: { label: "Delivered",     icon: CheckCircle2,  color: "text-green-500" },
    cancelled: { label: "Cancelled",     icon: XCircle,       color: "text-red-500" },
};

export default function OrderDetailPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentError, setPaymentError] = useState("");

    const loadOrder = useCallback(async () => {
        if (!id) return;
        const res = await fetch(`/api/orders/${id}`);
        const data = await res.json();
        setOrder(data.order || null);
    }, [id]);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
        if (status === "authenticated" && id) {
            loadOrder()
                .finally(() => setLoading(false));
        }
    }, [status, id, router, loadOrder]);

    const retryOnlinePayment = async () => {
        if (!order) return;

        setPaymentLoading(true);
        setPaymentError("");

        try {
            const payRes = await fetch("/api/payment/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: order.id }),
            });
            const payData = await payRes.json();
            if (!payRes.ok) throw new Error(payData.error || "Unable to start payment");

            if (!window.Razorpay) {
                await new Promise<void>((resolve, reject) => {
                    const script = document.createElement("script");
                    script.src = "https://checkout.razorpay.com/v1/checkout.js";
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error("Failed to load Razorpay"));
                    document.body.appendChild(script);
                });
            }

            const RazorpayConstructor = window.Razorpay as new (options: {
                key: string;
                amount: number;
                currency: string;
                name: string;
                description: string;
                order_id: string;
                prefill: {
                    name: string;
                    contact: string;
                    email: string;
                };
                theme: { color: string };
                handler: (response: {
                    razorpay_order_id: string;
                    razorpay_payment_id: string;
                    razorpay_signature: string;
                }) => Promise<void>;
                modal?: {
                    ondismiss?: () => void;
                };
            }) => { open: () => void };

            const rzp = new RazorpayConstructor({
                key: payData.keyId,
                amount: payData.amount,
                currency: payData.currency,
                name: "GenzLoots",
                description: `Order ${order.id}`,
                order_id: payData.razorpayOrderId,
                prefill: {
                    name: order.shippingName,
                    contact: order.shippingPhone,
                    email: session?.user?.email || "",
                },
                theme: { color: "#1a6fe8" },
                handler: async (response: {
                    razorpay_order_id: string;
                    razorpay_payment_id: string;
                    razorpay_signature: string;
                }) => {
                    const verifyRes = await fetch("/api/payment/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            orderId: order.id,
                        }),
                    });

                    const verifyData = await verifyRes.json().catch(() => ({}));
                    if (!verifyRes.ok) {
                        throw new Error(verifyData.error || "Payment verification failed");
                    }

                    await loadOrder();
                    setPaymentError("");
                },
                modal: {
                    ondismiss: () => {
                        setPaymentError("Payment was cancelled. Your order is still saved and waiting for payment.");
                    },
                },
            });

            rzp.open();
        } catch (error) {
            setPaymentError(error instanceof Error ? error.message : "Unable to complete payment right now");
        } finally {
            setPaymentLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
            <Loader2 size={28} className="animate-spin text-[var(--brand)]" />
        </div>
    );

    if (!order) return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
            <p className="text-[var(--text-secondary)]">Order not found.</p>
        </div>
    );

    const currentStep = statusSteps.indexOf(order.status);
    const cfg = statusConfig[order.status] || statusConfig.pending;

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-[var(--bg-base)] py-10">
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
                        <Link href="/" className="hover:text-[var(--brand)] transition-colors">Home</Link>
                        <ChevronRight size={14} />
                        <Link href="/orders" className="hover:text-[var(--brand)] transition-colors">My Orders</Link>
                        <ChevronRight size={14} />
                        <span className="text-[var(--text-secondary)]">#{order.id.slice(-8).toUpperCase()}</span>
                    </nav>

                    <div className="flex items-start justify-between mb-6 gap-4">
                        <div>
                            <h1 className="text-xl font-bold text-[var(--text-primary)]">Order Details</h1>
                            <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">{order.id}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] ${cfg.color}`}>
                            <cfg.icon size={14} /> {cfg.label}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    {order.status !== "cancelled" && (
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 mb-6">
                            <div className="flex items-center justify-between relative">
                                <div className="absolute top-4 left-0 right-0 h-0.5 bg-[var(--border)]" />
                                <div className="absolute top-4 left-0 h-0.5 bg-[var(--brand)] transition-all duration-700"
                                    style={{ width: `${Math.min(100, (currentStep / (statusSteps.length - 1)) * 100)}%` }} />
                                {statusSteps.map((s, i) => {
                                    const StepIcon = statusConfig[s].icon;
                                    const done = i <= currentStep;
                                    return (
                                        <div key={s} className="flex flex-col items-center gap-1.5 relative z-10">
                                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                                done ? "bg-[var(--brand)] border-[var(--brand)] text-white" : "bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-muted)]"
                                            }`}>
                                                <StepIcon size={14} />
                                            </div>
                                            <span className={`text-[9px] font-semibold uppercase tracking-wide ${done ? "text-[var(--brand)]" : "text-[var(--text-muted)]"}`}>
                                                {statusConfig[s].label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Items */}
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
                            <h2 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                <Package size={16} className="text-[var(--brand)]" /> Items Ordered
                            </h2>
                            <div className="space-y-3">
                                {order.items.map(item => (
                                    <div key={item.id} className="flex gap-3 pb-3 border-b border-[var(--border)] last:border-0 last:pb-0">
                                        <div className="w-14 h-14 bg-[var(--bg-elevated)] rounded-md overflow-hidden flex-shrink-0">
                                            {item.productImage ? (
                                                <Image src={item.productImage} alt={item.productTitle} width={56} height={56} className="object-contain w-full h-full p-1" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package size={18} className="text-[var(--text-muted)]" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-2">{item.productTitle}</p>
                                            <p className="text-xs text-[var(--text-muted)] mt-0.5">Qty: {item.quantity} × ₹{item.price.toLocaleString("en-IN")}</p>
                                        </div>
                                        <p className="text-sm font-bold text-[var(--brand)] flex-shrink-0">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-[var(--border)] mt-4 pt-4 space-y-2 text-sm">
                                <div className="flex justify-between text-[var(--text-secondary)]">
                                    <span>Subtotal</span><span>₹{order.subtotal.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="flex justify-between text-[var(--text-secondary)]">
                                    <span>Shipping{order.paymentMethod === "COD" ? " (COD)" : ""}</span>
                                    <span>{order.shippingFee > 0 ? `₹${order.shippingFee}` : "FREE"}</span>
                                </div>
                                <div className="flex justify-between font-bold text-[var(--text-primary)] text-base pt-1 border-t border-[var(--border)]">
                                    <span>Total Paid</span>
                                    <span className="text-[var(--brand)]">₹{order.total.toLocaleString("en-IN")}</span>
                                </div>
                            </div>
                        </div>

                        {/* Shipping address */}
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
                            <h2 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                                <MapPin size={16} className="text-[var(--brand)]" /> Delivery Address
                            </h2>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">{order.shippingName}</p>
                            <p className="text-sm text-[var(--text-secondary)]">{order.shippingAddress}</p>
                            <p className="text-sm text-[var(--text-secondary)]">{order.shippingCity}, {order.shippingState} — {order.shippingPincode}</p>
                            <p className="text-sm text-[var(--text-muted)] flex items-center gap-1 mt-1"><Phone size={12} />{order.shippingPhone}</p>
                        </div>

                        {/* Payment */}
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
                            <h2 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                                <CreditCard size={16} className="text-[var(--brand)]" /> Payment
                            </h2>
                            <div className="flex items-center justify-between text-sm mb-3">
                                <span className="text-[var(--text-secondary)]">{order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}</span>
                                <span className={`font-semibold ${order.paymentStatus === "paid" ? "text-green-500" : "text-amber-500"}`}>
                                    {order.paymentStatus === "paid" ? "Paid" : order.paymentMethod === "COD" ? "Pay on delivery" : "Pending"}
                                </span>
                            </div>
                            {order.paymentMethod === "online" && order.paymentStatus !== "paid" && (
                                <div className="space-y-3">
                                    <p className="text-xs text-[var(--text-muted)]">
                                        Your order is saved. Complete the payment to confirm it for processing.
                                    </p>
                                    <button
                                        onClick={retryOnlinePayment}
                                        disabled={paymentLoading}
                                        className="inline-flex items-center gap-2 bg-[var(--brand)] hover:opacity-90 text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-all disabled:opacity-60"
                                    >
                                        {paymentLoading ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                                        Complete Payment
                                    </button>
                                    {paymentError && (
                                        <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5">
                                            <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                                            {paymentError}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Admin note */}
                        {order.adminNote && (
                            <div className="bg-[hsl(214_89%_52%/0.06)] border border-[hsl(214_89%_52%/0.2)] rounded-xl p-4">
                                <p className="text-xs font-semibold text-[var(--brand)] mb-1">Note from team</p>
                                <p className="text-sm text-[var(--text-secondary)]">{order.adminNote}</p>
                            </div>
                        )}

                        <Link href="/orders" className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                            ← Back to All Orders
                        </Link>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
