"use client";
import { useState, useEffect } from "react";
import { Loader2, TrendingUp, ExternalLink, Trash2, Search, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";

interface PricePoint { price: number; timestamp: string; platform: string; }

interface TrackedProduct {
    id: string;
    title: string;
    slug: string;
    image: string | null;
    price: number | null;
    originalPrice: number | null;
    originalUrl: string | null;
    amazonLink: string | null;
    flipkartLink: string | null;
    rating: number | null;
    createdAt: string;
    category: { name: string } | null;
    priceHistory: PricePoint[];
}

export default function AdminTrackedProductsPage() {
    const [products, setProducts] = useState<TrackedProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [deleting, setDeleting] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/admin/tracked-products")
            .then(r => r.json())
            .then(data => setProducts(Array.isArray(data) ? data : []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this tracked product and its price history?")) return;
        setDeleting(id);
        try {
            await fetch(`/api/products/${id}`, { method: "DELETE" });
            setProducts(p => p.filter(x => x.id !== id));
        } finally {
            setDeleting(null); }
    };

    const handlePublish = async (id: string) => {
        if (!confirm("Publish this product to the main catalog?")) return;
        await fetch(`/api/products/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isPublic: true }),
        });
        setProducts(p => p.filter(x => x.id !== id));
    };

    const filtered = products.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.originalUrl || "").toLowerCase().includes(search.toLowerCase())
    );

    const getPlatform = (p: TrackedProduct) =>
        p.amazonLink ? "Amazon" : p.flipkartLink ? "Flipkart" : "Unknown";

    const getPriceChange = (history: PricePoint[]) => {
        if (history.length < 2) return null;
        const first = history[0].price;
        const last = history[history.length - 1].price;
        const pct = Math.round(((last - first) / first) * 100);
        return { pct, up: pct > 0 };
    };

    return (
        <div className="animate-fade-in-up">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tracked Products</h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">
                        Products searched by users via the Price Tracker. Accumulated price history is stored here.
                    </p>
                </div>
                <div className="bg-[hsl(214_89%_52%/0.08)] border border-[hsl(214_89%_52%/0.25)] text-[hsl(214_89%_55%)] text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2">
                    <Activity size={16} />
                    {products.length} tracked
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                    type="text"
                    placeholder="Search by title or URL..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="input-base pl-9 w-full max-w-sm text-sm"
                />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 text-[var(--text-muted)]">
                    <Loader2 size={24} className="animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-[var(--text-muted)]">
                    <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No tracked products yet. Users will appear here when they search via Price Tracker.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(product => {
                        const priceChange = getPriceChange(product.priceHistory);
                        const platform = getPlatform(product);
                        const isExpanded = expanded === product.id;

                        return (
                            <div key={product.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
                                {/* Main content */}
                                <div className="p-4">
                                    {/* Top row: image + title + platform badge */}
                                    <div className="flex items-start gap-3 mb-3">
                                        {product.image && (
                                            <img
                                                src={product.image} alt=""
                                                className="w-12 h-12 object-contain rounded-md bg-white p-1 flex-shrink-0 border border-[var(--border)]"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${platform === "Amazon" ? "bg-yellow-400/10 border-yellow-400/30 text-yellow-600" : "bg-blue-400/10 border-blue-400/30 text-blue-600"}`}>
                                                    {platform}
                                                </span>
                                            </div>
                                            <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug line-clamp-2">
                                                {product.title}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stats row */}
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)] mb-3">
                                        <span className="font-semibold text-[var(--text-primary)]">
                                            {product.price ? `₹${product.price.toLocaleString("en-IN")}` : "No price"}
                                        </span>
                                        <span>·</span>
                                        <span>{product.priceHistory.length} data point{product.priceHistory.length !== 1 ? "s" : ""}</span>
                                        {priceChange && (
                                            <>
                                                <span>·</span>
                                                <span className={`flex items-center gap-0.5 font-semibold ${priceChange.up ? "text-red-500" : "text-green-500"}`}>
                                                    {priceChange.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                                    {Math.abs(priceChange.pct)}% since tracking
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {/* Action buttons row — always on its own line */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <button
                                            onClick={() => setExpanded(isExpanded ? null : product.id)}
                                            className="text-xs px-3 py-1.5 border border-[var(--border)] rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all"
                                        >
                                            {isExpanded ? "Hide History" : "History"}
                                        </button>
                                        <button
                                            onClick={() => handlePublish(product.id)}
                                            className="text-xs px-3 py-1.5 bg-[hsl(214_89%_52%)] hover:bg-[hsl(214_89%_45%)] text-white font-semibold rounded-md transition-all"
                                        >
                                            Publish
                                        </button>
                                        <div className="flex items-center gap-1 ml-auto">
                                            {product.originalUrl && (
                                                <a
                                                    href={product.originalUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1.5 rounded hover:bg-[var(--bg-elevated)]"
                                                    title="Open original URL"
                                                >
                                                    <ExternalLink size={15} />
                                                </a>
                                            )}
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                disabled={deleting === product.id}
                                                className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1.5 rounded hover:bg-red-500/10 disabled:opacity-50"
                                                title="Delete"
                                            >
                                                {deleting === product.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Price History Expansion */}
                                {isExpanded && product.priceHistory.length > 0 && (
                                    <div className="border-t border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Price History</p>
                                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                            {product.priceHistory.map((h, i) => (
                                                <div key={i} className="flex items-center justify-between text-xs">
                                                    <span className="text-[var(--text-muted)]">
                                                        {new Date(h.timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                                    </span>
                                                    <span className="font-semibold text-[var(--text-primary)]">
                                                        ₹{h.price.toLocaleString("en-IN")}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
