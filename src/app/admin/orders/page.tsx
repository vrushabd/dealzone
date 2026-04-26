"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Package, Search, Filter, ChevronDown, ChevronUp,
    Phone, MapPin, CreditCard, ExternalLink, Save,
    Loader2, Copy, Check, ShoppingBag, User, Mail,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface OrderItem {
    id: string;
    productTitle: string;
    productImage?: string;
    quantity: number;
    price: number;
    product?: {
        slug?: string;
        originalUrl?: string | null;
        amazonLink?: string | null;
        flipkartLink?: string | null;
        meeshoLink?: string | null;
    };
}

interface Order {
    id: string;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    total: number;
    shippingName: string;
    shippingPhone: string;
    shippingAddress: string;
    shippingCity: string;
    shippingState: string;
    shippingPincode: string;
    adminNote?: string;
    createdAt: string;
    items: OrderItem[];
    user: { name: string; email: string; phone?: string };
}

const STATUS_OPTIONS = ["pending", "confirmed", "ordered", "shipped", "delivered", "cancelled"];
const statusColors: Record<string, string> = {
    pending:   "text-amber-400 bg-amber-400/10 border-amber-400/30",
    confirmed: "text-blue-400 bg-blue-400/10 border-blue-400/30",
    ordered:   "text-purple-400 bg-purple-400/10 border-purple-400/30",
    shipped:   "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
    delivered: "text-green-400 bg-green-400/10 border-green-400/30",
    cancelled: "text-red-400 bg-red-400/10 border-red-400/30",
};

function CopyBtn({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={copy} title="Copy" className="ml-2 text-[var(--text-muted)] hover:text-green-400 transition-colors">
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
        </button>
    );
}

export default function AdminOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("all");
    const [search, setSearch] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [editNote, setEditNote] = useState<Record<string, string>>({});
    const [editStatus, setEditStatus] = useState<Record<string, string>>({});
    const [editPaymentStatus, setEditPaymentStatus] = useState<Record<string, string>>({});

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/orders?status=${filterStatus}`);
            if (res.status === 403) { router.push("/admin/login"); return; }
            const data = await res.json();
            setOrders(data.orders || []);
        } finally {
            setLoading(false);
        }
    }, [filterStatus, router]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const updateOrder = async (orderId: string) => {
        setUpdatingId(orderId);
        try {
            await fetch(`/api/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: editStatus[orderId],
                    paymentStatus: editPaymentStatus[orderId],
                    adminNote: editNote[orderId],
                }),
            });
            await fetchOrders();
            setExpandedId(null);
        } finally { setUpdatingId(null); }
    };

    const toggleExpand = (order: Order) => {
        const id = order.id;
        setExpandedId(prev => prev === id ? null : id);
        if (!editStatus[id]) setEditStatus(s => ({ ...s, [id]: order.status }));
        if (!editPaymentStatus[id]) setEditPaymentStatus(s => ({ ...s, [id]: order.paymentStatus }));
        if (!editNote[id]) setEditNote(n => ({ ...n, [id]: order.adminNote || "" }));
    };

    const filtered = orders.filter(o => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            o.id.toLowerCase().includes(q) ||
            o.shippingName.toLowerCase().includes(q) ||
            o.shippingPhone.includes(q) ||
            o.user.email.toLowerCase().includes(q)
        );
    });

    const fullAddress = (o: Order) =>
        `${o.shippingName}\n${o.shippingAddress}\n${o.shippingCity}, ${o.shippingState} - ${o.shippingPincode}\nPhone: ${o.shippingPhone}`;

    const getFulfillmentLinks = (item: OrderItem) => {
        const links = [
            { label: "Original", href: item.product?.originalUrl },
            { label: "Amazon", href: item.product?.amazonLink },
            { label: "Flipkart", href: item.product?.flipkartLink },
            { label: "Meesho", href: item.product?.meeshoLink },
        ].filter((link): link is { label: string; href: string } => Boolean(link.href));

        if (links.length > 0) return links;

        return [
            { label: "Amazon Search", href: `https://www.amazon.in/s?k=${encodeURIComponent(item.productTitle)}` },
            { label: "Flipkart Search", href: `https://www.flipkart.com/search?q=${encodeURIComponent(item.productTitle)}` },
            { label: "Meesho Search", href: `https://www.meesho.com/search?q=${encodeURIComponent(item.productTitle)}` },
        ];
    };

    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
                            <Link href="/admin" className="hover:text-[var(--text-secondary)]">Admin</Link>
                            <span>/</span><span>Orders</span>
                        </div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Package className="text-[var(--brand)]" /> Orders Management
                        </h1>
                    </div>
                    <button onClick={fetchOrders} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] px-3 py-1.5 rounded-md transition-colors">
                        ↻ Refresh
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                    {[
                        { label: "Total", count: orders.length, color: "text-[var(--text-secondary)]" },
                        { label: "Pending", count: orders.filter(o => o.status === "pending").length, color: "text-amber-400" },
                        { label: "Shipped", count: orders.filter(o => o.status === "shipped").length, color: "text-cyan-400" },
                        { label: "Delivered", count: orders.filter(o => o.status === "delivered").length, color: "text-green-400" },
                    ].map(stat => (
                        <div key={stat.label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
                            <p className="text-xs text-[var(--text-muted)] font-medium">{stat.label}</p>
                            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.count}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-5">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input type="text" placeholder="Search by name, phone, email, order ID..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-lg pl-9 pr-4 py-2.5 text-sm text-[var(--text-secondary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand)] transition-colors" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-[var(--text-muted)]" />
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--brand)] transition-colors">
                            <option value="all">All Statuses</option>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                    </div>
                </div>

                {/* Orders */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={28} className="animate-spin text-[var(--brand)]" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-[var(--text-muted)]">No orders found</div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map(order => {
                            const isExpanded = expandedId === order.id;
                            return (
                                <div key={order.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">

                                    {/* ── Always-visible card ── */}
                                    <div className="p-4 md:p-5">
                                        <div className="flex flex-wrap items-start gap-4">
                                            {/* Product image */}
                                            <div className="w-12 h-12 bg-[var(--bg-elevated)] rounded-xl overflow-hidden flex-shrink-0">
                                                {order.items[0]?.productImage
                                                    ? <Image src={order.items[0].productImage} alt="" width={48} height={48} className="object-contain w-full h-full p-1" />
                                                    : <Package size={18} className="m-auto mt-3 text-[var(--text-muted)]" />}
                                            </div>

                                            {/* Order meta */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusColors[order.status] || statusColors.pending}`}>
                                                        {order.status.toUpperCase()}
                                                    </span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${order.paymentMethod === "COD" ? "text-amber-400 border-amber-400/20 bg-amber-400/10" : "text-green-400 border-green-400/20 bg-green-400/10"}`}>
                                                        {order.paymentMethod === "COD" ? "💵 COD" : "✅ Paid Online"}
                                                    </span>
                                                    <span className="text-xs text-[var(--text-muted)] font-mono">
                                                        #{order.id.slice(-10).toUpperCase()} · {new Date(order.createdAt).toLocaleDateString("en-IN")}
                                                    </span>
                                                </div>

                                                {/* Products list */}
                                                <div className="space-y-0.5 mb-3">
                                                    {order.items.map(item => (
                                                        <p key={item.id} className="text-sm text-[var(--text-secondary)] truncate">
                                                            <span className="text-[var(--text-muted)] mr-1">×{item.quantity}</span>
                                                            {item.productTitle}
                                                        </p>
                                                    ))}
                                                </div>

                                                {/* ── Customer info — always visible ── */}
                                                <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {/* Left: identity */}
                                                    <div className="space-y-1.5">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-1">
                                                            <User size={10} /> Customer
                                                        </p>
                                                        <div className="flex items-center text-sm font-semibold text-[var(--text-primary)]">
                                                            {order.shippingName}
                                                            <CopyBtn text={order.shippingName} />
                                                        </div>
                                                        <div className="flex items-center text-sm text-green-400 font-mono">
                                                            <Phone size={12} className="mr-1.5 shrink-0" />
                                                            {order.shippingPhone}
                                                            <CopyBtn text={order.shippingPhone} />
                                                        </div>
                                                        <div className="flex items-center text-xs text-[var(--text-muted)]">
                                                            <Mail size={11} className="mr-1.5 shrink-0" />
                                                            {order.user.email}
                                                            <CopyBtn text={order.user.email} />
                                                        </div>
                                                    </div>

                                                    {/* Right: delivery address */}
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1">
                                                                <MapPin size={10} /> Delivery Address
                                                            </p>
                                                            <CopyBtn text={fullAddress(order)} />
                                                        </div>
                                                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                                            {order.shippingAddress}
                                                        </p>
                                                        <p className="text-sm text-[var(--text-muted)]">
                                                            {order.shippingCity}, {order.shippingState}
                                                        </p>
                                                        <p className="text-sm font-mono font-bold text-[var(--brand)]">
                                                            PIN: {order.shippingPincode}
                                                            <CopyBtn text={order.shippingPincode} />
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right side: total + expand */}
                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                <p className="text-xl font-bold text-[var(--brand)]">₹{order.total.toLocaleString("en-IN")}</p>
                                                <button
                                                    onClick={() => toggleExpand(order)}
                                                    className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] px-2.5 py-1.5 rounded-lg transition-colors"
                                                >
                                                    {isExpanded ? <><ChevronUp size={13} /> Hide</> : <><ChevronDown size={13} /> Manage</>}
                                                </button>
                                            </div>
                                        </div>

                                        {/* ── Manual Fulfillment Quick Links — always visible ── */}
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <p className="w-full text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1">
                                                    <ShoppingBag size={10} /> Place Order On
                                                </p>
                                                {order.items.map(item => (
                                                    <div key={item.id} className="flex flex-wrap gap-2">
                                                        {getFulfillmentLinks(item).map((link) => (
                                                            <a
                                                                key={`${item.id}-${link.label}`}
                                                                href={link.href}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-400/10 hover:bg-blue-400/20 border border-blue-400/20 px-3 py-1.5 rounded-lg transition-all font-medium"
                                                            >
                                                                <ExternalLink size={11} /> {link.label}
                                                            </a>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                    </div>

                                    {/* ── Expandable: status update + note ── */}
                                    {isExpanded && (
                                        <div className="border-t border-[var(--border)] bg-[var(--bg-surface)] p-4 md:p-5">
                                            {/* Payment info */}
                                            <div className="flex items-center gap-3 mb-4 p-3 bg-[var(--bg-elevated)] rounded-xl">
                                                <CreditCard size={14} className="text-[var(--text-muted)]" />
                                                <span className="text-sm text-[var(--text-secondary)]">
                                                    {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}
                                                </span>
                                                <span className={`ml-auto text-sm font-bold ${order.paymentStatus === "paid" ? "text-green-400" : "text-amber-400"}`}>
                                                    {order.paymentStatus === "paid" ? "✓ Paid" : "⏳ Pending"}
                                                </span>
                                            </div>

                                            {/* Items detail */}
                                            <div className="space-y-2 mb-4">
                                                {order.items.map(item => (
                                                    <div key={item.id} className="flex gap-3 p-3 bg-[var(--bg-elevated)] rounded-lg">
                                                        <div className="w-10 h-10 bg-[var(--bg-card)] rounded-md overflow-hidden flex-shrink-0">
                                                            {item.productImage && <Image src={item.productImage} alt="" width={40} height={40} className="object-contain w-full h-full p-1" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{item.productTitle}</p>
                                                            <p className="text-xs text-[var(--text-muted)] mt-0.5">Qty: {item.quantity} × ₹{item.price.toLocaleString("en-IN")}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Update controls */}
                                            <div className="flex flex-wrap gap-3 items-end">
                                                <div>
                                                    <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">Update Status</label>
                                                    <select
                                                        value={editStatus[order.id] || order.status}
                                                        onChange={e => setEditStatus(s => ({ ...s, [order.id]: e.target.value }))}
                                                        className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--brand)] transition-colors"
                                                    >
                                                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">Payment Status</label>
                                                    <select
                                                        value={editPaymentStatus[order.id] || order.paymentStatus}
                                                        onChange={e => setEditPaymentStatus(s => ({ ...s, [order.id]: e.target.value }))}
                                                        className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--brand)] transition-colors"
                                                    >
                                                        {["pending", "paid", "failed"].map((value) => (
                                                            <option key={value} value={value}>
                                                                {value.charAt(0).toUpperCase() + value.slice(1)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="flex-1 min-w-[200px]">
                                                    <label className="block text-xs text-[var(--text-muted)] mb-1.5 font-medium">Admin Note (visible to customer)</label>
                                                    <input
                                                        type="text"
                                                        value={editNote[order.id] || ""}
                                                        onChange={e => setEditNote(n => ({ ...n, [order.id]: e.target.value }))}
                                                        placeholder="e.g. Ordered from Flipkart, tracking: FKXXXX"
                                                        className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand)] transition-colors"
                                                    />
                                                </div>

                                                <button
                                                    onClick={() => updateOrder(order.id)}
                                                    disabled={updatingId === order.id}
                                                    className="flex items-center gap-2 bg-[var(--brand)] hover:opacity-90 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                                                >
                                                    {updatingId === order.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
