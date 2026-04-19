"use client";
import { useState } from "react";
import { X, Loader2, Zap, Download, CheckCircle } from "lucide-react";
import { inferCategoryIdFromText } from "@/lib/features/products/category";
import { useRouter } from "next/navigation";

interface Category { id: string; name: string; slug: string; }
interface Product {
    id: string; title: string; slug: string; image?: string | null; images: string[]; description?: string | null;
    price?: number | null; originalPrice?: number | null; discount?: number | null;
    amazonLink?: string | null; flipkartLink?: string | null;
    cashbackAmazon?: number | null; cashbackFlipkart?: number | null;
    seller?: string | null; rating?: number | null; availability?: string | null;
    featured: boolean; categoryId?: string | null; category?: { name: string } | null;
}

function dedupeStrings(values: Array<string | null | undefined>) {
    return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean))) as string[];
}

export default function ProductForm({
    initial, categories
}: {
    initial?: Product | null; categories: Category[];
}) {
    const router = useRouter();
    const [urlInput, setUrlInput] = useState("");
    const [scraping, setScraping] = useState(false);
    const [scrapeError, setScrapeError] = useState("");
    const [scraped, setScraped] = useState(false);

    const [form, setForm] = useState<{
        title: string; image: string; images: string[]; price: string; originalPrice: string;
        discount: string; amazonLink: string; flipkartLink: string;
        featured: boolean; categoryId: string; description: string;
        cashbackAmazon: string; cashbackFlipkart: string;
        seller: string; rating: string; availability: string;
    }>({
        title: initial?.title || "",
        image: initial?.image || "",
        images: initial?.images || [],
        price: initial?.price?.toString() || "",
        originalPrice: initial?.originalPrice?.toString() || "",
        discount: initial?.discount?.toString() || "",
        amazonLink: initial?.amazonLink || "",
        flipkartLink: initial?.flipkartLink || "",
        featured: initial?.featured || false,
        categoryId: initial?.categoryId || "",
        description: initial?.description || "",
        cashbackAmazon: initial?.cashbackAmazon?.toString() || "",
        cashbackFlipkart: initial?.cashbackFlipkart?.toString() || "",
        seller: initial?.seller || "",
        rating: initial?.rating?.toString() || "",
        availability: initial?.availability || "in_stock",
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
            
            let matchedCategoryId = form.categoryId;
            matchedCategoryId = inferCategoryIdFromText(categories, {
                scrapedCategory: data.category,
                title: data.title,
                description: data.description,
            }) || matchedCategoryId;

            setForm((f) => ({
                ...f,
                title: data.title || f.title,
                description: data.description || f.description,
                image: data.image || f.image,
                images: dedupeStrings([...(data.images || []), f.image, data.image]),
                price: data.price > 0 ? data.price.toString() : f.price,
                originalPrice: data.originalPrice ? data.originalPrice.toString() : f.originalPrice,
                discount: data.discount ? data.discount.toString() : f.discount,
                amazonLink: data.platform === "amazon" ? urlInput.trim() : f.amazonLink,
                flipkartLink: data.platform === "flipkart" ? urlInput.trim() : f.flipkartLink,
                seller: data.seller || f.seller,
                rating: typeof data.rating === "number" && data.rating > 0 ? data.rating.toString() : f.rating,
                categoryId: matchedCategoryId,
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
            router.push("/admin/products");
            router.refresh();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Error saving product");
        } finally { setLoading(false); }
    };

    const onClose = () => router.push("/admin/products");

    const fields = [
        { key: "title", label: "Product Title *", placeholder: "e.g. Samsung 4K TV", type: "text" },
        { key: "image", label: "Image URL", placeholder: "https://...", type: "url" },
        { key: "price", label: "Price (₹)", placeholder: "e.g. 29999", type: "number" },
        { key: "originalPrice", label: "Original Price (₹)", placeholder: "e.g. 49999", type: "number" },
        { key: "discount", label: "Discount %", placeholder: "e.g. 40", type: "number" },
        { key: "amazonLink", label: "Amazon Link", placeholder: "https://amzn.to/...", type: "url" },
        { key: "flipkartLink", label: "Flipkart Link", placeholder: "https://fkrt.it/...", type: "url" },
        { key: "cashbackAmazon", label: "Amazon Cashback (₹)", placeholder: "0", type: "number" },
        { key: "cashbackFlipkart", label: "Flipkart Cashback (₹)", placeholder: "0", type: "number" },
        { key: "seller", label: "Seller Name", placeholder: "Appario Retail", type: "text" },
        { key: "rating", label: "Rating (out of 5)", placeholder: "4.5", type: "number" },
    ];

    return (
        <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border)] sm:rounded-xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up">
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

                <div className="bg-[var(--bg-elevated)]/30 border border-[var(--border)] rounded-md p-4">
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4">Product Gallery</label>
                    
                    <div className="grid grid-cols-4 xs:grid-cols-6 gap-3 mb-4">
                        {form.images.map((img, idx) => (
                            <div key={idx} className="relative aspect-square border border-[var(--border)] rounded-md overflow-hidden bg-white group/img">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={img}
                                    alt=""
                                    className="w-full h-full object-contain p-1 mix-blend-multiply"
                                    onError={() => setForm((current) => {
                                        const nextImages = current.images.filter((_, imageIndex) => imageIndex !== idx);
                                        const nextPrimary = current.image === img ? nextImages[0] || "" : current.image;
                                        return { ...current, images: nextImages, image: nextPrimary };
                                    })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity shadow-lg"
                                >
                                    <X size={10} />
                                </button>
                                {img === form.image && (
                                    <div className="absolute bottom-0 inset-x-0 bg-blue-500/80 text-[8px] text-white font-bold py-0.5 text-center">PRIMARY</div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => set("image", img)}
                                    className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-[10px] font-bold"
                                >
                                    SET MAIN
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <input 
                            value={form.image} 
                            onChange={(e) => set("image", e.target.value)} 
                            placeholder="Current primary image URL..." 
                            className="input-base text-xs flex-1"
                        />
                        <button 
                            type="button" 
                            onClick={() => { if(form.image) setForm(f => ({ ...f, images: dedupeStrings([...f.images, f.image]) })) }}
                            className="text-[var(--brand)] text-[10px] font-bold px-2 hover:underline"
                        >
                            ADD TO GALLERY
                        </button>
                    </div>
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

                <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Stock Status</label>
                    <select
                        value={form.availability}
                        onChange={(e) => set("availability", e.target.value)}
                        className="input-base"
                    >
                        <option value="in_stock">In Stock</option>
                        <option value="out_of_stock">Out of Stock</option>
                    </select>
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
