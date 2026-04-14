'use client';

import React, { useEffect, useState } from 'react';
import { Bell, ArrowDown, ExternalLink, Trash2, Loader2, Tag } from 'lucide-react';

export default function TrackedPage() {
    const [tracked, setTracked] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, this would fetch based on session/email
        // For now, let's fetch all active tracks (mocking user context)
        const fetchTracked = async () => {
            try {
                const res = await fetch('/api/track/list'); // I'll need to create this simple list API
                const data = await res.json();
                setTracked(data);
            } catch (error) {
                console.error('Error fetching tracked products:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTracked();
    }, []);

    return (
        <div className="min-h-screen bg-[var(--bg-base)] pb-20 pt-16">
            <div className="max-w-5xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Tracked Products</h1>
                        <p className="text-[var(--text-secondary)]">Manage your price drop alerts and get the best deals.</p>
                    </div>
                    <div className="p-3 bg-[hsl(214_89%_52%/0.1)] text-[hsl(214_89%_52%)] rounded-2xl">
                        <Bell size={24} />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                        <p className="text-gray-500">Retrieving your deals...</p>
                    </div>
                ) : tracked.length === 0 ? (
                    <div className="bg-[var(--bg-card)] p-12 rounded-3xl text-center border-2 border-dashed border-[var(--border)]">
                        <Tag className="mx-auto text-[var(--text-placeholder)] mb-4" size={48} />
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No products tracked yet</h3>
                        <p className="text-[var(--text-secondary)] mb-6">Start by comparing products and clicking the "Track Price" button.</p>
                        <a href="/compare" className="px-6 py-3 bg-[hsl(214_89%_52%)] text-white font-bold rounded-xl hover:bg-[hsl(214_89%_45%)] transition-colors">
                            Go to Comparison
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {tracked.map((item, index) => (
                            <div key={index} className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border)] flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
                                <img src={item.product.image} className="w-20 h-20 object-contain" alt="" />
                                <div className="flex-1">
                                    <h3 className="font-bold text-[var(--text-primary)] line-clamp-1">{item.product.title}</h3>
                                    <div className="flex items-center gap-4 mt-1">
                                        <span className="text-2xl font-black text-[var(--text-primary)]">₹{item.product.price.toLocaleString()}</span>
                                        {item.targetPrice && (
                                            <div className="flex items-center gap-1 text-sm text-green-600 bg-green-500/10 px-2 py-0.5 rounded-md font-bold">
                                                <ArrowDown size={14} />
                                                Target: ₹{item.targetPrice.toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={item.product.amazonLink || item.product.flipkartLink}
                                        target="_blank"
                                        className="p-3 bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[hsl(214_89%_55%)] rounded-xl transition-colors"
                                    >
                                        <ExternalLink size={20} />
                                    </a>
                                    <button className="p-3 bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[hsl(0_84%_60%)] rounded-xl transition-colors">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
