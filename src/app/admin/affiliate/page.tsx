'use client';

import React, { useEffect, useState } from 'react';
import { MousePointer2, ExternalLink, Package, Loader2, TrendingUp, Filter, Sparkles, BarChart3 } from 'lucide-react';

export default function AffiliateDashboard() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/products')
            .then(res => res.json())
            .then(data => {
                setProducts(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const totalClicks = products.reduce((sum, p) => sum + (p.clickCount || 0), 0);
    const activeLinks = products.filter(p => p.affiliateUrl).length;

    return (
        <div className="min-h-screen bg-[#020617] text-white pb-20 pt-24">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8 animate-fade-in-up">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-orange-500 font-black text-xs uppercase tracking-[0.3em]">
                            <Sparkles size={14} />
                            Admin Panel
                        </div>
                        <h1 className="text-5xl font-black tracking-tight">
                            Affiliate <span className="gradient-text">Analytics</span>
                        </h1>
                        <p className="text-gray-500 font-medium text-lg">
                            Monitor performance and conversion across all platforms.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="glass p-6 rounded-[2rem] border border-white/5 flex items-center gap-4 min-w-[200px]">
                            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                <MousePointer2 size={24} />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Clicks</div>
                                <div className="text-2xl font-black">{totalClicks.toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="glass p-6 rounded-[2rem] border border-white/5 flex items-center gap-4 min-w-[200px]">
                            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
                                <Package size={24} />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Links</div>
                                <div className="text-2xl font-black">{activeLinks}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-96 gap-6 glass rounded-[3rem] border border-white/5">
                        <div className="relative">
                            <Loader2 className="animate-spin text-orange-500" size={48} />
                            <div className="absolute inset-0 blur-xl bg-orange-500/20 animate-pulse" />
                        </div>
                        <p className="text-gray-400 font-bold tracking-wide">Syncing data from edge...</p>
                    </div>
                ) : (
                    <div className="glass rounded-[3rem] border border-white/5 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Product Details</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-center">Clicks</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Platform</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-right">Preview</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {products.map((product, idx) => (
                                        <tr key={product.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-5">
                                                    <div className="relative w-14 h-14 rounded-2xl bg-white p-2 overflow-hidden ring-1 ring-white/10 group-hover:ring-orange-500/30 transition-all">
                                                        <img src={product.image} className="w-full h-full object-contain" alt="" />
                                                    </div>
                                                    <div className="max-w-md">
                                                        <div className="font-bold text-white group-hover:text-orange-400 transition-colors truncate text-lg">
                                                            {product.title}
                                                        </div>
                                                        <div className="text-xs text-gray-500 font-bold mt-1 line-clamp-1">{product.slug}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="inline-flex items-center gap-2 bg-orange-500/5 px-4 py-2 rounded-xl text-orange-500 font-black text-xl">
                                                    <BarChart3 size={18} />
                                                    {product.clickCount || 0}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${product.amazonLink ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                    }`}>
                                                    {product.amazonLink ? 'Amazon' : 'Flipkart'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <a
                                                    href={product.affiliateUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-xs font-black rounded-xl border border-white/5 transition-all text-gray-300 hover:text-white"
                                                >
                                                    OPEN LINK
                                                    <ExternalLink size={14} />
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {products.length === 0 && (
                                <div className="py-20 text-center text-gray-500 font-bold">
                                    No products found. Start by comparing some links!
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
