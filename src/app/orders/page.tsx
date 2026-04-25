"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Package, ChevronRight, Clock, CheckCircle2, Truck, XCircle, Loader2, ShoppingBag } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface OrderItem {
    id: string;
    productTitle: string;
    productImage?: string;
    quantity: number;
    price: number;
}

interface Order {
    id: string;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    total: number;
    createdAt: string;
    items: OrderItem[];
    shippingName: string;
    shippingCity: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    pending:   { label: "Order Placed",  color: "text-amber-500 bg-amber-500/10 border-amber-500/20",   icon: Clock },
    confirmed: { label: "Confirmed",     color: "text-blue-500 bg-blue-500/10 border-blue-500/20",       icon: CheckCircle2 },
    ordered:   { label: "Ordered",       color: "text-purple-500 bg-purple-500/10 border-purple-500/20", icon: Package },
    shipped:   { label: "Shipped",       color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",       icon: Truck },
    delivered: { label: "Delivered",     color: "text-green-500 bg-green-500/10 border-green-500/20",    icon: CheckCircle2 },
    cancelled: { label: "Cancelled",     color: "text-red-500 bg-red-500/10 border-red-500/20",          icon: XCircle },
};

export default function OrdersPage() {
    const { status } = useSession();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login?callbackUrl=/orders");
        if (status === "authenticated") {
            fetch("/api/orders")
                .then(r => r.json())
                .then(d => setOrders(d.orders || []))
                .finally(() => setLoading(false));
        }
    }, [status, router]);

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-[var(--bg-base)] py-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
                        <Link href="/" className="hover:text-[var(--brand)] transition-colors">Home</Link>
                        <ChevronRight size={14} />
                        <span className="text-[var(--text-secondary)]">My Orders</span>
                    </nav>

                    <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-8 flex items-center gap-3">
                        <Package size={24} className="text-[var(--brand)]" />
                        My Orders
                    </h1>

                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 size={28} className="animate-spin text-[var(--brand)]" />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-5">
                                <ShoppingBag size={32} className="text-[var(--text-muted)]" />
                            </div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">No orders yet</h2>
                            <p className="text-[var(--text-secondary)] mb-6">Start shopping to see your orders here</p>
                            <Link href="/products" className="btn-primary px-6 py-2.5 text-sm font-bold shine-on-hover">
                                Browse Deals
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map(order => {
                                const cfg = statusConfig[order.status] || statusConfig.pending;
                                const StatusIcon = cfg.icon;
                                return (
                                    <Link key={order.id} href={`/orders/${order.id}`}
                                        className="block bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 hover:border-[var(--border-brand)] hover:shadow-[var(--shadow-elevated)] transition-all group">

                                        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                                            <div>
                                                <p className="text-xs text-[var(--text-muted)] font-mono">Order #{order.id.slice(-8).toUpperCase()}</p>
                                                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                                    {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                </p>
                                            </div>
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                                                <StatusIcon size={12} />
                                                {cfg.label}
                                            </span>
                                        </div>

                                        {/* Product images row */}
                                        <div className="flex items-center gap-2 mb-4">
                                            {order.items.slice(0, 4).map((item, i) => (
                                                <div key={item.id} className="w-12 h-12 bg-[var(--bg-elevated)] rounded-md overflow-hidden border border-[var(--border)] flex-shrink-0">
                                                    {item.productImage ? (
                                                        <Image src={item.productImage} alt={item.productTitle} width={48} height={48} className="object-contain w-full h-full p-1" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                                                            <Package size={16} />
                                                        </div>
                                                    )}
                                                    {i === 3 && order.items.length > 4 && (
                                                        <div className="absolute inset-0 bg-[var(--bg-base)]/70 flex items-center justify-center text-xs font-bold text-[var(--text-primary)]">
                                                            +{order.items.length - 4}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            <div className="ml-2">
                                                <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-1">
                                                    {order.items[0].productTitle}
                                                    {order.items.length > 1 && ` + ${order.items.length - 1} more`}
                                                </p>
                                                <p className="text-xs text-[var(--text-muted)]">{order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
                                            <div>
                                                <p className="text-xs text-[var(--text-muted)]">Order Total</p>
                                                <p className="text-base font-bold text-[var(--brand)]">₹{order.total.toLocaleString("en-IN")}</p>
                                            </div>
                                            <span className="text-sm text-[var(--brand)] font-semibold group-hover:underline flex items-center gap-1">
                                                View Details <ChevronRight size={14} />
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
