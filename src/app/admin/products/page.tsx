"use client";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ShoppingBag, Search, Loader2, Star, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Product {
    id: string; title: string; slug: string; image?: string | null; images: string[]; description?: string | null;
    price?: number | null; originalPrice?: number | null; discount?: number | null;
    amazonLink?: string | null; flipkartLink?: string | null; meeshoLink?: string | null;
    cashbackAmazon?: number | null; cashbackFlipkart?: number | null;
    seller?: string | null; rating?: number | null;
    availability?: string | null;
    featured: boolean; categoryId?: string | null; category?: { name: string } | null;
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [search, setSearch] = useState("");
    const [deleting, setDeleting] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        setLoadError("");
        try {
            const productsRes = await fetch("/api/products?publicOnly=true");
            const productsData = await productsRes.json();

            if (!productsRes.ok) {
                throw new Error(productsData?.error || "Failed to load products");
            }

            setProducts(Array.isArray(productsData) ? productsData : []);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Failed to load admin data";
            setLoadError(message);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this product?")) return;
        setDeleting(id);
        await fetch(`/api/products/${id}`, { method: "DELETE" });
        setDeleting(null);
        load();
    };

    const filtered = products.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Products</h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">{products.length} total products</p>
                </div>
                <Link href="/admin/products/new"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[hsl(214_89%_52%)] to-[hsl(214_89%_45%)] hover:from-[hsl(214_89%_55%)] hover:to-[hsl(214_89%_52%)] text-white font-semibold px-5 py-2.5 rounded-md transition-all btn-glow text-sm">
                    <Plus size={16} /> Add Product
                </Link>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..."
                    className="input-base pl-10 max-w-sm" />
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-md" />)}
                </div>
            ) : loadError ? (
                <div className="text-center py-16 text-[var(--text-muted)]">
                    <p className="mb-3">{loadError}</p>
                    <button
                        onClick={load}
                        className="text-[var(--brand)] hover:underline"
                    >
                        Retry loading data
                    </button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-[var(--text-muted)]">
                    <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No products found. <Link href="/admin/products/new" className="text-[var(--brand)] hover:underline">Add your first product →</Link></p>
                </div>
            ) : (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md overflow-hidden">
                    <div className="divide-y divide-[var(--border)]">
                        {filtered.map((p) => (
                            <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 hover:bg-[var(--bg-card-hover)] transition-colors group relative">
                                <div className="w-12 h-12 bg-white border border-[var(--border)] rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden group/img">
                                    {p.image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={p.image} alt={p.title} className="w-full h-full object-contain p-1 mix-blend-multiply group-hover/img:scale-110 transition-transform" />
                                    ) : (
                                        <ShoppingBag size={18} className="text-gray-600" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-[var(--text-primary)] text-sm line-clamp-1">{p.title}</span>
                                        {p.featured && <Star size={12} className="text-yellow-400 flex-shrink-0" />}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        {p.category && <span className="text-xs text-[var(--text-muted)]">{p.category.name}</span>}
                                        {p.amazonLink && <span className="text-xs bg-yellow-500/15 text-yellow-600 px-1.5 py-0.5 rounded-full">Amazon</span>}
                                        {p.flipkartLink && <span className="text-xs bg-blue-500/15 text-blue-600 px-1.5 py-0.5 rounded-full">Flipkart</span>}
                                        {p.meeshoLink && <span className="text-xs bg-pink-500/15 text-pink-600 px-1.5 py-0.5 rounded-full">Meesho</span>}
                                        {(p.availability || "in_stock") === "out_of_stock" && (
                                            <span className="text-xs bg-red-500/15 text-red-500 px-1.5 py-0.5 rounded-full">Out of Stock</span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-left sm:text-right flex-shrink-0 mt-2 sm:mt-0">
                                    {p.price && <div className="text-[var(--brand)] text-sm font-semibold">₹{p.price.toLocaleString("en-IN")}</div>}
                                    {p.originalPrice && <div className="text-[var(--text-muted)] text-xs line-through">₹{p.originalPrice.toLocaleString("en-IN")}</div>}
                                </div>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity absolute right-4 top-4 sm:relative sm:right-auto sm:top-auto">
                                    <a href={`/products/${p.slug}`} target="_blank" className="p-1.5 text-[var(--text-muted)] hover:text-[var(--brand)] hover:bg-[var(--brand-glow)] rounded-lg transition-all">
                                        <ExternalLink size={15} />
                                    </a>
                                    <Link href={`/admin/products/${p.id}`} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--brand)] hover:bg-[var(--brand-glow)] rounded-lg transition-all">
                                        <Pencil size={15} />
                                    </Link>
                                    <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                                        className="p-1.5 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                                        {deleting === p.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
