"use client";
import { useState } from "react";
import {
    Link2, Loader2, Check, Copy, ExternalLink, Zap,
    ShoppingBag, Package, AlertCircle, ChevronRight, RefreshCw
} from "lucide-react";

interface ScrapedResult {
    title: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    image: string;
    platform: string;
    affiliateUrl?: string;
    slug?: string;
}

export default function AddViaUrlPage() {
    const [amazonUrl, setAmazonUrl] = useState("");
    const [flipkartUrl, setFlipkartUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ScrapedResult | null>(null);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState(false);
    const [copying, setCopying] = useState(false);

    const handleFetch = async () => {
        if (!amazonUrl.trim() && !flipkartUrl.trim()) return;
        setLoading(true);
        setError("");
        setResult(null);
        setSaved(false);

        try {
            const res = await fetch("/api/product/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amazonUrl: amazonUrl.trim(),
                    flipkartUrl: flipkartUrl.trim()
                }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to fetch product");

            setResult({
                title: data.product.title,
                price: data.product.price,
                originalPrice: data.product.originalPrice,
                discount: data.product.discount,
                image: data.product.image,
                platform: data.product.amazonLink ? "amazon" : data.product.flipkartLink ? "flipkart" : "unknown",
                affiliateUrl: data.product.affiliateUrl,
                slug: data.product.slug,
            });
            setSaved(true);
        } catch (e: any) {
            setError(e.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const copy = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopying(true);
        setTimeout(() => setCopying(false), 1500);
    };

    const platformLabel = result?.platform === "amazon" ? "Amazon" : result?.platform === "flipkart" ? "Flipkart" : "Unknown";
    const platformColor = result?.platform === "amazon"
        ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/25"
        : "text-blue-400 bg-blue-500/10 border-blue-500/25";

    return (
        <div className="animate-fade-in-up max-w-2xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Zap size={22} className="text-[hsl(214_89%_52%)]" fill="currentColor" />
                    Add Product via URL
                </h1>
                <p className="text-[var(--text-secondary)] text-sm mt-1">
                    Paste any Amazon or Flipkart product URL — we&apos;ll auto-fetch the details and generate your affiliate link.
                </p>
            </div>

            {/* URL Input Card */}
            <div className="glass rounded-md p-6 mb-6 flex flex-col gap-4">
                <div>
                    <label className="block text-xs font-semibold text-[hsl(215_15%_55%)] uppercase tracking-wider mb-3">
                        Amazon URL (Optional)
                    </label>
                    <div className="relative">
                        <Link2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(215_12%_40%)]" />
                        <input
                            type="url"
                            value={amazonUrl}
                            onChange={(e) => { setAmazonUrl(e.target.value); setResult(null); setError(""); }}
                            onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                            placeholder="https://www.amazon.in/dp/..."
                            className="input-base pl-10"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-[hsl(215_15%_55%)] uppercase tracking-wider mb-3">
                        Flipkart URL (Optional)
                    </label>
                    <div className="relative">
                        <Link2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(215_12%_40%)]" />
                        <input
                            type="url"
                            value={flipkartUrl}
                            onChange={(e) => { setFlipkartUrl(e.target.value); setResult(null); setError(""); }}
                            onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                            placeholder="https://www.flipkart.com/..."
                            className="input-base pl-10"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-2">
                    <button
                        onClick={handleFetch}
                        disabled={loading || (!amazonUrl.trim() && !flipkartUrl.trim())}
                        className="btn-primary shine-on-hover px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm w-full"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin mr-2 inline" /> : <Zap size={15} fill="currentColor" className="mr-2 inline" />}
                        {loading ? "Fetching & Tracking Both..." : "Fetch & Track Product"}
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-start gap-3 bg-[hsl(0_84%_60%/0.08)] border border-[hsl(0_84%_60%/0.25)] rounded-md px-4 py-3 mb-6 animate-scale-in">
                    <AlertCircle size={16} className="text-[hsl(0_84%_60%)] flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[hsl(0_84%_70%)] text-sm font-medium">{error}</p>
                        <p className="text-[hsl(0_84%_50%/0.7)] text-xs mt-0.5">Make sure the URL is a valid product page from Amazon India or Flipkart.</p>
                    </div>
                </div>
            )}

            {/* Loading skeleton */}
            {loading && (
                <div className="glass rounded-md p-6 space-y-4">
                    <div className="flex gap-4">
                        <div className="skeleton w-24 h-24 rounded-md flex-shrink-0" />
                        <div className="flex-1 space-y-2.5">
                            <div className="skeleton h-4 rounded-lg w-3/4" />
                            <div className="skeleton h-4 rounded-lg w-1/2" />
                            <div className="skeleton h-6 rounded-lg w-1/3" />
                        </div>
                    </div>
                    <div className="skeleton h-10 rounded-md" />
                </div>
            )}

            {/* Result Card */}
            {result && !loading && (
                <div className="glass-brand rounded-md overflow-hidden animate-scale-in">
                    {/* Success banner */}
                    <div className="flex items-center gap-2 px-5 py-3 bg-[hsl(142_72%_50%/0.08)] border-b border-[var(--border)]">
                        <div className="w-5 h-5 rounded-full bg-[hsl(142_72%_50%/0.2)] flex items-center justify-center">
                            <Check size={11} className="text-[hsl(142_72%_50%)]" />
                        </div>
                        <span className="text-xs font-semibold text-[hsl(142_72%_60%)]">
                            Product fetched & saved to database
                        </span>
                        <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border ${platformColor}`}>
                            {platformLabel}
                        </span>
                    </div>

                    <div className="p-6">
                        {/* Product preview */}
                        <div className="flex gap-4 mb-6">
                            {result.image && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={result.image}
                                    alt={result.title}
                                    className="w-20 h-20 object-contain bg-[var(--bg-elevated)] rounded-md p-2 flex-shrink-0 border border-[var(--border)]"
                                />
                            )}
                            <div className="min-w-0">
                                <h3 className="text-[var(--text-primary)] font-semibold text-sm leading-snug line-clamp-2 mb-2">{result.title}</h3>
                                <div className="flex items-baseline gap-2">
                                    {result.price > 0 && (
                                        <span className="text-lg font-extrabold text-[hsl(214_89%_55%)]">
                                            ₹{result.price.toLocaleString("en-IN")}
                                        </span>
                                    )}
                                    {result.originalPrice && result.originalPrice > result.price && (
                                        <span className="text-xs text-[var(--text-muted)] line-through">
                                            ₹{result.originalPrice.toLocaleString("en-IN")}
                                        </span>
                                    )}
                                    {result.discount && result.discount > 0 && (
                                        <span className="badge-discount">-{result.discount}%</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Affiliate URL */}
                        <div className="mb-4">
                            <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                Generated Affiliate Link
                            </div>
                            {result.affiliateUrl ? (
                                <div className="flex items-center gap-2 bg-[var(--bg-base)] border border-[var(--border)] rounded-md px-3 py-2.5">
                                    <span className="text-xs text-[hsl(214_89%_55%)] font-mono flex-1 truncate">{result.affiliateUrl}</span>
                                    <button
                                        onClick={() => copy(result.affiliateUrl!)}
                                        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                        title="Copy link"
                                    >
                                        {copying ? <Check size={13} className="text-[hsl(142_72%_50%)]" /> : <Copy size={13} />}
                                    </button>
                                    <a
                                        href={result.affiliateUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                    >
                                        <ExternalLink size={13} />
                                    </a>
                                </div>
                            ) : (
                                <div className="text-xs text-[var(--text-muted)] italic px-3 py-2.5 border border-dashed border-[var(--border)] rounded-md">
                                    No affiliate link generated — check your AMAZON_AFFILIATE_TAG / FLIPKART_AFFILIATE_ID in .env
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-3 border-t border-[var(--border)]">
                            <a
                                href={result.slug ? `/products/${result.slug}` : "/products"}
                                target="_blank"
                                className="flex-1 flex items-center justify-center gap-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-semibold py-2.5 rounded-md transition-all"
                            >
                                <Package size={13} />
                                View Product
                            </a>
                            <button
                                onClick={() => { setAmazonUrl(""); setFlipkartUrl(""); setResult(null); setSaved(false); }}
                                className="flex-1 flex items-center justify-center gap-1.5 btn-primary shine-on-hover text-xs py-2.5"
                            >
                                <RefreshCw size={13} />
                                Add Another
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* How it works */}
            {!result && !loading && !error && (
                <div className="glass rounded-md p-5">
                    <h3 className="text-xs font-semibold text-[hsl(215_15%_55%)] uppercase tracking-wider mb-4">How it works</h3>
                    <div className="space-y-3">
                        {[
                            { step: "1", text: "Paste any Amazon India or Flipkart product URL above" },
                            { step: "2", text: "We scrape the title, price, discount, and product image" },
                            { step: "3", text: "Your affiliate tag is automatically appended to the URL" },
                            { step: "4", text: "Product is saved to your database and goes live instantly" },
                        ].map((item) => (
                            <div key={item.step} className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-[hsl(214_89%_52%/0.12)] border border-[hsl(214_89%_52%/0.25)] flex items-center justify-center text-[10px] font-bold text-[hsl(214_89%_55%)] flex-shrink-0 mt-0.5">
                                    {item.step}
                                </div>
                                <p className="text-[hsl(215_15%_55%)] text-xs leading-relaxed">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
