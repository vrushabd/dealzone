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
        <div className="bg-[var(--bg-card)] rounded-md p-6 mb-10 border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-md bg-[var(--brand-glow)] flex items-center justify-center">
                    <Zap size={16} className="text-[var(--brand)]" fill="currentColor" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-[var(--text-primary)]">Affiliate Link Generator</h2>
                    <p className="text-xs text-[var(--text-muted)]">Paste any Amazon or Flipkart product URL to get your affiliate link instantly</p>
                </div>
            </div>

            {/* Input row */}
            <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                    <Link2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
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
                <span className="text-[10px] text-[var(--text-muted)]">Supports:</span>
                <span className="text-[10px] font-semibold text-[var(--warning)] bg-[var(--warning)]/10 border border-[var(--warning)]/20 px-2 py-0.5 rounded-full">amazon.in</span>
                <span className="text-[10px] font-semibold text-[var(--brand)] bg-[var(--brand)]/10 border border-[var(--brand)]/20 px-2 py-0.5 rounded-full">flipkart.com</span>
                <span className="text-[10px] text-[var(--text-muted)] ml-2">Tag: <code className="text-[var(--brand)] font-bold">dealzone-21</code></span>
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
                    <div className="flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5">
                        <span className="text-xs font-mono text-[hsl(214_89%_55%)] flex-1 truncate">{result.affiliateUrl}</span>
                        <button onClick={copy} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" title="Copy">
                            {copied ? <Check size={13} className="text-[hsl(142_72%_50%)]" /> : <Copy size={13} />}
                        </button>
                        <a href={result.affiliateUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" title="Open link">
                            <ExternalLink size={13} />
                        </a>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] mt-2">
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
                    <div className="flex items-center gap-2 text-[var(--brand)] font-bold text-xs uppercase tracking-widest mb-1">
                        <Sparkles size={13} />
                        Admin Panel
                    </div>
                    <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                        Affiliate <span className="gradient-text">Analytics</span>
                    </h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">Monitor performance and generate affiliate links.</p>
                </div>

                {/* Stats */}
                <div className="flex flex-col xs:flex-row gap-3">
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] px-5 py-3 rounded-md flex items-center gap-3">
                        <MousePointer2 size={18} className="text-[var(--brand)]" />
                        <div>
                            <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Total Clicks</div>
                            <div className="text-xl font-extrabold text-[var(--text-primary)]">{totalClicks.toLocaleString()}</div>
                        </div>
                    </div>
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] px-5 py-3 rounded-md flex items-center gap-3">
                        <Package size={18} className="text-[var(--success)]" />
                        <div>
                            <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Products w/ Links</div>
                            <div className="text-xl font-extrabold text-[var(--text-primary)]">{withLinks}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Link Generator */}
            <LinkGenerator />

            {/* Products Table */}
            {loading ? (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md p-12 flex items-center justify-center gap-3">
                    <Loader2 className="animate-spin text-[var(--brand)]" size={24} />
                    <span className="text-[var(--text-secondary)] text-sm">Loading products...</span>
                </div>
            ) : (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md overflow-hidden">
                    <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-2">
                        <BarChart3 size={15} className="text-[var(--brand)]" />
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">Products with Affiliate Links</h3>
                        <span className="ml-auto text-[10px] text-[var(--text-muted)]">{products.length} total</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                                    <th className="px-6 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Product</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-center">Clicks</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Platform</th>
                                    <th className="px-6 py-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-right">Link</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {products.map((product) => (
                                    <tr key={product.id} className="hover:bg-[var(--bg-card-hover)] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-md bg-[var(--bg-elevated)] overflow-hidden flex-shrink-0 border border-[var(--border)]">
                                                    {product.image && <img src={product.image} className="w-full h-full object-contain p-1" alt="" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand)] transition-colors truncate max-w-xs text-xs">
                                                        {product.title}
                                                    </div>
                                                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                                                        {product.price ? `₹${product.price.toLocaleString('en-IN')}` : '—'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[var(--brand)] font-bold text-sm">{product.clickCount || 0}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                                product.amazonLink
                                                    ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                                    : product.flipkartLink
                                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                    : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)]'
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
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-card-hover)] text-[10px] font-bold rounded-lg border border-[var(--border)] transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                                >
                                                    Open <ExternalLink size={10} />
                                                </a>
                                            ) : (
                                                <span className="text-[10px] text-[var(--text-muted)] opacity-50">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {products.length === 0 && (
                            <div className="py-16 text-center text-[var(--text-muted)] text-sm">
                                No products yet. Add some via{' '}
                                <a href="/admin/add-product" className="text-[var(--brand)] hover:underline">Add via URL</a>.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
