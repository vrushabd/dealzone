"use client";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, ShoppingBag, Search, X, Loader2, Star, ExternalLink, Zap, Download, CheckCircle } from "lucide-react";

interface Category { id: string; name: string; }
interface Product {
    id: string; title: string; slug: string; image?: string | null;
    price?: number | null; originalPrice?: number | null; discount?: number | null;
    amazonLink?: string | null; flipkartLink?: string | null;
    featured: boolean; category?: { name: string } | null;
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--bg-card)] border border-[var(--border)] rounded-md shadow-2xl animate-fade-in-up">
                {children}
            </div>
        </div>
    );
}

function ProductForm({
    initial, categories, onSave, onClose,
}: {
    initial?: Product | null; categories: Category[]; onSave: () => void; onClose: () => void;
}) {
    const [urlInput, setUrlInput] = useState("");
    const [scraping, setScraping] = useState(false);
    const [scrapeError, setScrapeError] = useState("");
    const [scraped, setScraped] = useState(false);

    const [form, setForm] = useState<{
        title: string; image: string; price: string; originalPrice: string;
        discount: string; amazonLink: string; flipkartLink: string;
        featured: boolean; categoryId: string; description: string;
    }>({
        title: initial?.title || "",
        image: initial?.image || "",
        price: initial?.price?.toString() || "",
        originalPrice: initial?.originalPrice?.toString() || "",
        discount: initial?.discount?.toString() || "",
        amazonLink: initial?.amazonLink || "",
        flipkartLink: initial?.flipkartLink || "",
        featured: initial?.featured || false,
        categoryId: "",
        description: "",
    });
    type StringFields = Omit<typeof form, 'featured'>;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

    const handleScrape = async () => {
        if (!urlInput.trim()) return;
        setScraping(true); setScrapeError(""); setScraped(false);
        try {
            const res = await fetch("/api/scrape", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: urlInput.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch");
            setForm((f) => ({
                ...f,
                title: data.title || f.title,
                image: data.image || f.image,
                price: data.price > 0 ? data.price.toString() : f.price,
                originalPrice: data.originalPrice ? data.originalPrice.toString() : f.originalPrice,
                discount: data.discount ? data.discount.toString() : f.discount,
                amazonLink: data.platform === "amazon" ? urlInput.trim() : f.amazonLink,
                flipkartLink: data.platform === "flipkart" ? urlInput.trim() : f.flipkartLink,
            }));
            setScraped(true);
        } catch (e: unknown) {
            setScrapeError(e instanceof Error ? e.message : "Could not fetch product");
        } finally { setScraping(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError("");
        try {
            const url = initial ? `/api/products/${initial.id}` : "/api/products";
            const method = initial ? "PUT" : "POST";
            const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            if (!res.ok) throw new Error((await res.json()).error);
            onSave();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Error saving product");
        } finally { setLoading(false); }
    };

    const fields = [
        { key: "title", label: "Product Title *", placeholder: "e.g. Samsung 4K TV 65 inch", type: "text" },
        { key: "image", label: "Image URL", placeholder: "https://...", type: "url" },
        { key: "price", label: "Price (₹)", placeholder: "e.g. 29999", type: "number" },
        { key: "originalPrice", label: "Original Price (₹)", placeholder: "e.g. 49999", type: "number" },
        { key: "discount", label: "Discount %", placeholder: "e.g. 40", type: "number" },
        { key: "amazonLink", label: "Amazon Affiliate Link", placeholder: "https://amzn.to/...", type: "url" },
        { key: "flipkartLink", label: "Flipkart Affiliate Link", placeholder: "https://fkrt.it/...", type: "url" },
    ];

    return (
        <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">{initial ? "Edit Product" : "Add New Product"}</h2>
                <button type="button" onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-lg p-1.5 hover:bg-[var(--bg-elevated)]">
                    <X size={18} />
                </button>
            </div>

            <div className="p-6 space-y-4">
                {/* URL Scraper — only shown for new products */}
                {!initial && (
                    <div className="bg-[hsl(214_89%_52%/0.05)] border border-[hsl(214_89%_52%/0.20)] rounded-md p-4">
                        <label className="block text-xs font-bold text-[hsl(214_89%_55%)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Zap size={11} fill="currentColor" />
                            Auto-fill from Amazon / Flipkart URL
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={urlInput}
                                onChange={(e) => { setUrlInput(e.target.value); setScraped(false); setScrapeError(""); }}
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleScrape())}
                                placeholder="Paste product URL here..."
                                className="input-base flex-1 text-sm"
                            />
                            <button
                                type="button"
                                onClick={handleScrape}
                                disabled={scraping || !urlInput.trim()}
                                className="flex-shrink-0 flex items-center gap-1.5 bg-[hsl(214_89%_52%)] hover:bg-[hsl(214_89%_55%)] disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-md transition-all"
                            >
                                {scraping ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                                {scraping ? "Fetching..." : "Fetch Details"}
                            </button>
                        </div>
                        {scrapeError && <p className="text-red-400 text-xs mt-2">{scrapeError}</p>}
                        {scraped && <p className="text-green-400 text-xs mt-2 flex items-center gap-1"><CheckCircle size={11} /> Details fetched! Review below before saving.</p>}
                    </div>
                )}

                {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-md px-4 py-3 text-sm">{error}</div>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {fields.slice(0, 1).map(({ key, label, placeholder, type }) => (
                        <div key={key} className="sm:col-span-2">
                            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">{label}</label>
                            <input type={type} value={(form as StringFields)[key as keyof StringFields]} onChange={(e) => set(key, e.target.value)}
                                placeholder={placeholder} required={key === "title"} className="input-base" />
                        </div>
                    ))}
                    {fields.slice(1).map(({ key, label, placeholder, type }) => (
                        <div key={key}>
                            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">{label}</label>
                            <input type={type} value={(form as StringFields)[key as keyof StringFields]} onChange={(e) => set(key, e.target.value)}
                                placeholder={placeholder} className="input-base" />
                        </div>
                    ))}
                </div>

                <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Category</label>
                    <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className="input-base">
                        <option value="">None</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Description</label>
                    <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                        placeholder="Product description..." rows={3} className="input-base resize-none" />
                </div>

                <label className="flex items-center gap-3 cursor-pointer group">
                    <div onClick={() => set("featured", !form.featured)}
                        className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 relative ${form.featured ? "bg-[hsl(214_89%_52%)]" : "bg-[var(--bg-elevated)]"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.featured ? "left-5" : "left-0.5"}`} />
                    </div>
                    <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Mark as Featured Deal</span>
                </label>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-[var(--border)]">
                <button type="button" onClick={onClose} className="flex-1 bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] text-[var(--text-secondary)] py-2.5 rounded-md text-sm font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={loading}
                    className="flex-1 bg-gradient-to-r from-[hsl(214_89%_52%)] to-[hsl(214_89%_45%)] hover:from-[hsl(214_89%_55%)] hover:to-[hsl(214_89%_52%)] text-white py-2.5 rounded-md text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <><Loader2 size={15} className="animate-spin" />Saving...</> : (initial ? "Save Changes" : "Add Product")}
                </button>
            </div>
        </form>
    );
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Product | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        const [p, c] = await Promise.all([fetch("/api/products").then(r => r.json()), fetch("/api/categories").then(r => r.json())]);
        setProducts(p); setCategories(c); setLoading(false);
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

    const openAdd = () => { setEditing(null); setModalOpen(true); };
    const openEdit = (p: Product) => { setEditing(p); setModalOpen(true); };

    return (
        <div className="animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Products</h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">{products.length} total deals</p>
                </div>
                <button onClick={openAdd}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[hsl(214_89%_52%)] to-[hsl(214_89%_45%)] hover:from-[hsl(214_89%_55%)] hover:to-[hsl(214_89%_52%)] text-white font-semibold px-5 py-2.5 rounded-md transition-all btn-glow text-sm">
                    <Plus size={16} /> Add Product
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..."
                    className="input-base pl-10 max-w-sm" />
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-md" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No products found. <button onClick={openAdd} className="text-[hsl(214_89%_55%)] hover:underline">Add your first deal →</button></p>
                </div>
            ) : (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md overflow-hidden">
                    <div className="divide-y divide-[var(--border)]">
                        {filtered.map((p) => (
                            <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 hover:bg-[var(--bg-card-hover)] transition-colors group relative">
                                <div className="w-12 h-12 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {p.image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={p.image} alt={p.title} className="w-full h-full object-contain p-1" />
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
                                    </div>
                                </div>
                                <div className="text-left sm:text-right flex-shrink-0 mt-2 sm:mt-0">
                                    {p.price && <div className="text-[hsl(214_89%_55%)] text-sm font-semibold">₹{p.price.toLocaleString("en-IN")}</div>}
                                    {p.originalPrice && <div className="text-[var(--text-muted)] text-xs line-through">₹{p.originalPrice.toLocaleString("en-IN")}</div>}
                                </div>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity absolute right-4 top-4 sm:relative sm:right-auto sm:top-auto">
                                    <a href={`/products/${p.slug}`} target="_blank" className="p-1.5 text-[var(--text-muted)] hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all">
                                        <ExternalLink size={15} />
                                    </a>
                                    <button onClick={() => openEdit(p)} className="p-1.5 text-[var(--text-muted)] hover:text-[hsl(214_89%_55%)] hover:bg-[hsl(214_89%_52%/0.08)] rounded-lg transition-all">
                                        <Pencil size={15} />
                                    </button>
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

            <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                <ProductForm
                    initial={editing}
                    categories={categories}
                    onSave={() => { setModalOpen(false); load(); }}
                    onClose={() => setModalOpen(false)}
                />
            </Modal>
        </div>
    );
}
