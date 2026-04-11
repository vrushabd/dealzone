'use client';

import React, { useEffect, useState } from 'react';
import {
    Link2, Copy, Check, ExternalLink, Package, Loader2,
    Sparkles, BarChart3, MousePointer2, Zap, AlertCircle
} from 'lucide-react';

// ── Inline Link Generator ─────────────────────────────────────────────────────
function LinkGenerator() {
    const [url, setUrl] = useState('');
    const [result, setResult] = useState<{ affiliateUrl: string; platform: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const generate = async () => {
        if (!url.trim()) return;
        setLoading(true); setError(''); setResult(null);
        try {
            // Build affiliate URL client-side using the same logic as the server
            const u = url.trim();
            let affiliateUrl = '';
            let platform = '';

            if (u.includes('amazon.in') || u.includes('amzn.to') || u.includes('amazon.com')) {
                // Extract ASIN
                const asinMatch = u.match(/\/dp\/([A-Z0-9]{10})/) || u.match(/\/gp\/product\/([A-Z0-9]{10})/) || u.match(/\/([A-Z0-9]{10})(?:[/?]|$)/);
                const asin = asinMatch?.[1];
                if (!asin) throw new Error('Could not extract ASIN from this Amazon URL. Make sure it is a product page (e.g. amazon.in/dp/XXXXXXXXXX).');
                affiliateUrl = `https://www.amazon.in/dp/${asin}?tag=dealzone-21`;
                platform = 'amazon';
            } else if (u.includes('flipkart.com')) {
                const separator = u.includes('?') ? '&' : '?';
                affiliateUrl = `${u}${separator}affid=dealzoneaff`;
                platform = 'flipkart';
            } else {
                throw new Error('Only Amazon India and Flipkart URLs are supported.');
            }
            setResult({ affiliateUrl, platform });
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const copy = async () => {
        if (!result) return;
        await navigator.clipboard.writeText(result.affiliateUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="glass rounded-md p-6 mb-10 border border-[hsl(224_20%_16%)]">
            <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-md bg-[hsl(214_89%_52%/0.12)] flex items-center justify-center">
                    <Zap size={16} className="text-[hsl(214_89%_55%)]" fill="currentColor" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-white">Affiliate Link Generator</h2>
                    <p className="text-xs text-[hsl(215_12%_42%)]">Paste any Amazon or Flipkart product URL to get your affiliate link instantly</p>
                </div>
            </div>

            {/* Input row */}
            <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                    <Link2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(215_12%_40%)]" />
                    <input
                        type="url"
                        value={url}
                        onChange={e => { setUrl(e.target.value); setResult(null); setError(''); }}
                        onKeyDown={e => e.key === 'Enter' && generate()}
                        placeholder="https://www.amazon.in/dp/B0BVXZ5Q2M  or  https://www.flipkart.com/..."
                        className="input-base pl-10 text-sm"
                    />
                </div>
                <button
                    onClick={generate}
                    disabled={loading || !url.trim()}
                    className="btn-primary shine-on-hover px-5 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
                >
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <Zap size={14} fill="currentColor" />}
                    Generate
                </button>
            </div>

            {/* Platform badges */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] text-[hsl(215_10%_35%)]">Supports:</span>
                <span className="text-[10px] font-semibold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">amazon.in</span>
                <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">flipkart.com</span>
                <span className="text-[10px] text-[hsl(215_10%_35%)] ml-2">Tag: <code className="text-[hsl(214_89%_55%)]">dealzone-21</code></span>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-start gap-2 bg-red-500/8 border border-red-500/20 rounded-md px-4 py-3 text-sm text-red-400">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    {error}
                </div>
            )}

            {/* Result */}
            {result && (
                <div className="bg-[hsl(142_72%_50%/0.06)] border border-[hsl(142_72%_50%/0.2)] rounded-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Check size={13} className="text-[hsl(142_72%_50%)]" />
                        <span className="text-xs font-semibold text-[hsl(142_72%_55%)]">
                            {result.platform === 'amazon' ? '🛒 Amazon' : '🛍️ Flipkart'} affiliate link generated
                        </span>
                    </div>
                    <div className="flex items-center gap-2 bg-[hsl(224_28%_9%)] border border-[hsl(224_20%_14%)] rounded-lg px-3 py-2.5">
                        <span className="text-xs font-mono text-[hsl(214_89%_55%)] flex-1 truncate">{result.affiliateUrl}</span>
                        <button onClick={copy} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[hsl(224_25%_14%)] text-[hsl(215_12%_42%)] hover:text-white transition-colors" title="Copy">
                            {copied ? <Check size={13} className="text-[hsl(142_72%_50%)]" /> : <Copy size={13} />}
                        </button>
                        <a href={result.affiliateUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[hsl(224_25%_14%)] text-[hsl(215_12%_42%)] hover:text-white transition-colors" title="Open link">
                            <ExternalLink size={13} />
                        </a>
                    </div>
                    <p className="text-[10px] text-[hsl(215_10%_35%)] mt-2">
                        Update <code className="text-[hsl(214_89%_55%)]">AMAZON_AFFILIATE_TAG</code> in <code className="text-[hsl(214_89%_55%)]">.env</code> with your real Associates tag to start earning commissions.
                    </p>
                </div>
            )}
        </div>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function AffiliateDashboard() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/products')
            .then(res => res.json())
            .then(data => { setProducts(data); setLoading(false); })
            .catch(err => { console.error(err); setLoading(false); });
    }, []);

    const totalClicks = products.reduce((sum, p) => sum + (p.clickCount || 0), 0);
    const withLinks = products.filter(p => p.amazonLink || p.flipkartLink || p.affiliateUrl).length;

    return (
        <div className="animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2 text-[hsl(214_89%_52%)] font-bold text-xs uppercase tracking-widest mb-1">
                        <Sparkles size={13} />
                        Admin Panel
                    </div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">
                        Affiliate <span className="gradient-text">Analytics</span>
                    </h1>
                    <p className="text-[hsl(215_15%_45%)] text-sm mt-1">Monitor performance and generate affiliate links.</p>
                </div>

                {/* Stats */}
                <div className="flex gap-3">
                    <div className="glass px-5 py-3 rounded-md flex items-center gap-3">
                        <MousePointer2 size={18} className="text-[hsl(214_89%_55%)]" />
                        <div>
                            <div className="text-[10px] text-[hsl(215_10%_40%)] uppercase font-bold">Total Clicks</div>
                            <div className="text-xl font-extrabold text-white">{totalClicks.toLocaleString()}</div>
                        </div>
                    </div>
                    <div className="glass px-5 py-3 rounded-md flex items-center gap-3">
                        <Package size={18} className="text-green-400" />
                        <div>
                            <div className="text-[10px] text-[hsl(215_10%_40%)] uppercase font-bold">Products w/ Links</div>
                            <div className="text-xl font-extrabold text-white">{withLinks}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Link Generator */}
            <LinkGenerator />

            {/* Products Table */}
            {loading ? (
                <div className="glass rounded-md p-12 flex items-center justify-center gap-3">
                    <Loader2 className="animate-spin text-[hsl(214_89%_52%)]" size={24} />
                    <span className="text-[hsl(215_15%_45%)] text-sm">Loading products...</span>
                </div>
            ) : (
                <div className="glass rounded-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-[hsl(224_20%_13%)] flex items-center gap-2">
                        <BarChart3 size={15} className="text-[hsl(214_89%_55%)]" />
                        <h3 className="text-sm font-bold text-white">Products with Affiliate Links</h3>
                        <span className="ml-auto text-[10px] text-[hsl(215_10%_38%)]">{products.length} total</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-[hsl(224_20%_11%)] bg-[hsl(224_28%_7%)]">
                                    <th className="px-6 py-3 text-[10px] font-bold text-[hsl(215_10%_40%)] uppercase tracking-widest">Product</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-[hsl(215_10%_40%)] uppercase tracking-widest text-center">Clicks</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-[hsl(215_10%_40%)] uppercase tracking-widest">Platform</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-[hsl(215_10%_40%)] uppercase tracking-widest text-right">Link</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[hsl(224_20%_11%)]">
                                {products.map((product) => (
                                    <tr key={product.id} className="hover:bg-[hsl(224_25%_8%)] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-md bg-[hsl(224_25%_11%)] overflow-hidden flex-shrink-0 border border-[hsl(224_20%_14%)]">
                                                    {product.image && <img src={product.image} className="w-full h-full object-contain p-1" alt="" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-[hsl(210_30%_88%)] group-hover:text-[hsl(214_89%_55%)] transition-colors truncate max-w-xs text-xs">
                                                        {product.title}
                                                    </div>
                                                    <div className="text-[10px] text-[hsl(215_10%_38%)] mt-0.5">
                                                        {product.price ? `₹${product.price.toLocaleString('en-IN')}` : '—'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[hsl(214_89%_55%)] font-bold text-sm">{product.clickCount || 0}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                                product.amazonLink
                                                    ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                                    : product.flipkartLink
                                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                    : 'bg-[hsl(224_20%_11%)] text-[hsl(215_12%_42%)] border border-[hsl(224_20%_15%)]'
                                            }`}>
                                                {product.amazonLink ? 'Amazon' : product.flipkartLink ? 'Flipkart' : 'No link'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {(product.amazonLink || product.flipkartLink || product.affiliateUrl) ? (
                                                <a
                                                    href={product.affiliateUrl || product.amazonLink || product.flipkartLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[hsl(224_25%_11%)] hover:bg-[hsl(224_22%_14%)] text-[10px] font-bold rounded-lg border border-[hsl(224_20%_16%)] transition-all text-[hsl(215_15%_52%)] hover:text-white"
                                                >
                                                    Open <ExternalLink size={10} />
                                                </a>
                                            ) : (
                                                <span className="text-[10px] text-[hsl(215_10%_32%)]">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {products.length === 0 && (
                            <div className="py-16 text-center text-[hsl(215_12%_40%)] text-sm">
                                No products yet. Add some via{' '}
                                <a href="/admin/add-product" className="text-[hsl(214_89%_55%)] hover:underline">Add via URL</a>.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
