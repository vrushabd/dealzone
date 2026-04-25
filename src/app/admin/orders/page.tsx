"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Package, Search, Filter, ChevronRight, Phone, MapPin, CreditCard, CheckCircle2, Truck, Clock, XCircle, ExternalLink, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
    pending:   "text-amber-400 bg-amber-400/10 border-amber-400/20",
    confirmed: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    ordered:   "text-purple-400 bg-purple-400/10 border-purple-400/20",
    shipped:   "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
    delivered: "text-green-400 bg-green-400/10 border-green-400/20",
    cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
};

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
                    adminNote: editNote[orderId],
                }),
            });
            await fetchOrders();
            setExpandedId(null);
        } finally {
            setUpdatingId(null);
        }
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

    return (
        <div className="min-h-screen bg-[var(--admin-bg,#0f1117)] text-[var(--admin-text,#f0f0f0)] p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                            <Link href="/admin" className="hover:text-gray-300 transition-colors">Admin</Link>
                            <ChevronRight size={13} />
                            <span>Orders</span>
                        </div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Package className="text-[var(--brand)]" /> Orders Management
                        </h1>
                    </div>
                    <button onClick={fetchOrders} className="text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-md transition-colors">
                        Refresh
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input type="text" placeholder="Search by name, phone, email, order ID..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full bg-[#1a1d24] border border-gray-700/50 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[var(--brand)] transition-colors" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-gray-500" />
                        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                            className="bg-[#1a1d24] border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-[var(--brand)] transition-colors">
                            <option value="all">All Statuses</option>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                        { label: "Total", count: orders.length, color: "text-gray-300" },
                        { label: "Pending", count: orders.filter(o => o.status === "pending").length, color: "text-amber-400" },
                        { label: "Shipped", count: orders.filter(o => o.status === "shipped").length, color: "text-cyan-400" },
                        { label: "Delivered", count: orders.filter(o => o.status === "delivered").length, color: "text-green-400" },
                    ].map(stat => (
                        <div key={stat.label} className="bg-[#1a1d24] border border-gray-700/40 rounded-xl p-4">
                            <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.count}</p>
                        </div>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={28} className="animate-spin text-[var(--brand)]" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">No orders found</div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(order => {
                            const isExpanded = expandedId === order.id;
                            return (
                                <div key={order.id} className="bg-[#1a1d24] border border-gray-700/40 rounded-xl overflow-hidden">
                                    {/* Order row */}
                                    <div
                                        onClick={() => {
                                            setExpandedId(isExpanded ? null : order.id);
                                            if (!editStatus[order.id]) setEditStatus(s => ({ ...s, [order.id]: order.status }));
                                            if (!editNote[order.id]) setEditNote(n => ({ ...n, [order.id]: order.adminNote || "" }));
                                        }}
                                        className="flex flex-wrap items-center gap-4 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                                    >
                                        {/* Product thumb */}
                                        <div className="w-10 h-10 bg-gray-800 rounded-md overflow-hidden flex-shrink-0">
                                            {order.items[0]?.productImage ? (
                                                <Image src={order.items[0].productImage} alt="" width={40} height={40} className="object-contain w-full h-full p-1" />
                                            ) : <Package size={16} className="m-auto mt-2.5 text-gray-600" />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-100 truncate">
                                                {order.shippingName}
                                                <span className="text-gray-500 font-normal ml-2 text-xs">{order.user.email}</span>
                                            </p>
                                            <p className="text-xs text-gray-500 font-mono">#{order.id.slice(-10).toUpperCase()} · {new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                                        </div>

                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColors[order.status] || statusColors.pending}`}>
                                            {order.status}
                                        </span>

                                        <span className="text-sm font-bold text-[var(--brand)]">₹{order.total.toLocaleString("en-IN")}</span>

                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${order.paymentMethod === "COD" ? "text-amber-400 border-amber-400/20 bg-amber-400/10" : "text-green-400 border-green-400/20 bg-green-400/10"}`}>
                                            {order.paymentMethod === "COD" ? "COD" : "Paid Online"}
                                        </span>

                                        <ChevronRight size={16} className={`text-gray-500 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                    </div>

                                    {/* Expanded */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-700/40 p-5 space-y-5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                {/* Items */}
                                                <div>
                                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                                        <Package size={12} /> Items to Fulfill
                                                    </h3>
                                                    <div className="space-y-2">
                                                        {order.items.map(item => (
                                                            <div key={item.id} className="flex gap-3 p-3 bg-gray-800/40 rounded-lg">
                                                                <div className="w-10 h-10 bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                                                                    {item.productImage && <Image src={item.productImage} alt="" width={40} height={40} className="object-contain w-full h-full p-1" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm text-gray-200 line-clamp-2">{item.productTitle}</p>
                                                                    <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.price.toLocaleString("en-IN")}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Customer / Shipping */}
                                                <div className="space-y-4">
                                                    <div>
                                                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                                            <MapPin size={12} /> Delivery Details
                                                        </h3>
                                                        <div className="bg-gray-800/40 rounded-lg p-3 text-sm space-y-1">
                                                            <p className="font-semibold text-gray-100">{order.shippingName}</p>
                                                            <p className="text-gray-400">{order.shippingAddress}</p>
                                                            <p className="text-gray-400">{order.shippingCity}, {order.shippingState} — {order.shippingPincode}</p>
                                                            <p className="text-gray-300 flex items-center gap-1.5 mt-1"><Phone size={12} /> {order.shippingPhone}</p>
                                                            <p className="text-gray-500 text-xs">{order.user.email}</p>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                                            <CreditCard size={12} /> Payment
                                                        </h3>
                                                        <div className="bg-gray-800/40 rounded-lg p-3 text-sm flex items-center justify-between">
                                                            <span className="text-gray-300">{order.paymentMethod === "COD" ? "Cash on Delivery" : "Online"}</span>
                                                            <span className={`font-semibold ${order.paymentStatus === "paid" ? "text-green-400" : "text-amber-400"}`}>
                                                                {order.paymentStatus === "paid" ? "Paid ✓" : "Pending"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Update status + note */}
                                            <div className="border-t border-gray-700/40 pt-4 flex flex-wrap gap-3 items-end">
                                                <div>
                                                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Update Status</label>
                                                    <select
                                                        value={editStatus[order.id] || order.status}
                                                        onChange={e => setEditStatus(s => ({ ...s, [order.id]: e.target.value }))}
                                                        className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[var(--brand)] transition-colors"
                                                    >
                                                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                                    </select>
                                                </div>

                                                <div className="flex-1 min-w-[200px]">
                                                    <label className="block text-xs text-gray-400 mb-1.5 font-medium">Admin Note (visible to customer)</label>
                                                    <input
                                                        type="text"
                                                        value={editNote[order.id] || ""}
                                                        onChange={e => setEditNote(n => ({ ...n, [order.id]: e.target.value }))}
                                                        placeholder="e.g. Ordered from Flipkart, tracking ID: xxx"
                                                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[var(--brand)] transition-colors"
                                                    />
                                                </div>

                                                <button
                                                    onClick={() => updateOrder(order.id)}
                                                    disabled={updatingId === order.id}
                                                    className="flex items-center gap-2 bg-[var(--brand)] hover:bg-[hsl(214_89%_45%)] text-white text-sm font-bold px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                                                >
                                                    {updatingId === order.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                    Save
                                                </button>

                                                <a href={`https://www.flipkart.com/search?q=${encodeURIComponent(order.items[0]?.productTitle || "")}`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 border border-blue-400/20 px-3 py-2 rounded-lg transition-colors">
                                                    <ExternalLink size={12} /> Order on Flipkart
                                                </a>
                                                <a href={`https://www.myntra.com/${encodeURIComponent(order.items[0]?.productTitle || "")}`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 border border-pink-400/20 px-3 py-2 rounded-lg transition-colors">
                                                    <ExternalLink size={12} /> Order on Myntra
                                                </a>
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
