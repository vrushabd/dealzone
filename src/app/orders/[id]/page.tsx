"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Package, ChevronRight, MapPin, Phone, CreditCard, Loader2, CheckCircle2, Truck, Clock, XCircle } from "lucide-react";
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
    const { status } = useSession();
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
        if (status === "authenticated" && id) {
            fetch(`/api/orders/${id}`)
                .then(r => r.json())
                .then(d => setOrder(d.order || null))
                .finally(() => setLoading(false));
        }
    }, [status, id, router]);

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
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-[var(--text-secondary)]">{order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}</span>
                                <span className={`font-semibold ${order.paymentStatus === "paid" ? "text-green-500" : "text-amber-500"}`}>
                                    {order.paymentStatus === "paid" ? "Paid" : order.paymentMethod === "COD" ? "Pay on delivery" : "Pending"}
                                </span>
                            </div>
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
