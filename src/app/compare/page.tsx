'use client';

import React, { useState } from 'react';
import ProductInput from '@/components/features/compare/ProductInput';
import ComparisonTable from '@/components/features/compare/ComparisonTable';
import { ComparisonSkeleton } from '@/components/features/compare/Skeleton';
import DetailsModal from '@/components/features/compare/DetailsModal';
import { ArrowLeftRight, TrendingDown, ShieldCheck, Sparkles, Zap } from 'lucide-react';

export default function ComparePage() {
    const [comparisonData, setComparisonData] = useState<any[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

    const handleCompare = async (urls: string[]) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ urls }),
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            setComparisonData(data);
        } catch (err: any) {
            setError(err.message || 'Failed to compare products');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] pb-20 pt-24">
            <div className="max-w-7xl mx-auto px-6">
                {/* Hero Section */}
                <div className="text-center mb-16 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[hsl(214_89%_52%/0.08)] text-[hsl(214_89%_52%)] rounded-full text-xs font-black uppercase tracking-[0.3em] mb-6 border border-[hsl(214_89%_52%/0.20)]">
                        <Sparkles size={14} className="fill-current" />
                        Next-Gen Price Engine
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[1.1]">
                        Compare <span className="gradient-text">Instantly.</span><br />
                        Buy <span className="text-[var(--text-muted)]">Smarter.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-[var(--text-secondary)] font-medium max-w-2xl mx-auto mb-12">
                        Deconstruct prices across Amazon, Flipkart, and Myntra.
                        Get real-time insights and AI-powered forecasting.
                    </p>

                    <div className="max-w-3xl mx-auto glass p-8 rounded-[3rem] border border-[var(--border)] shadow-2xl">
                        <ProductInput onCompare={handleCompare} loading={isLoading} />
                    </div>
                </div>

                {/* Results Section */}
                <div className="mt-20">
                    {error && (
                        <div className="mb-12 p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-red-400 font-bold text-center animate-shake">
                            {error}
                        </div>
                    )}

                    {isLoading ? (
                        <ComparisonSkeleton />
                    ) : comparisonData ? (
                        <div className="animate-fade-in-up">
                            <div className="flex items-center gap-3 mb-8">
                                < Zap size={18} className="text-[hsl(214_89%_52%)] fill-current" />
                                <h2 className="text-xl font-black uppercase tracking-widest">Live Comparison</h2>
                            </div>
                            <ComparisonTable
                                products={comparisonData as any}
                                onOpenDetails={(id) => setSelectedProductId(id)}
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 stagger-children">
                            {[
                                { icon: <ArrowLeftRight className="text-[hsl(214_89%_52%)]" />, title: "Precision Compare", desc: "Deep-dive analysis across multi-vendor inventories." },
                                { icon: <TrendingDown className="text-green-400" />, title: "Price Vectoring", desc: "Track historical volatility and wait for the optimal buy signal." },
                                { icon: <ShieldCheck className="text-purple-400" />, title: "Verified Sourcing", desc: "Only authorized sellers and stock status are extracted." }
                            ].map((feature, i) => (
                                <div key={i} className="p-10 glass rounded-[2.5rem] border border-[var(--border)] card-glow h-full flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-[var(--bg-elevated)] rounded-md flex items-center justify-center mb-6 border border-[var(--border)]">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-2xl font-black text-[var(--text-primary)] mb-4 tracking-tight">{feature.title}</h3>
                                    <p className="text-[var(--text-secondary)] font-medium leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Price Details Modal */}
            <DetailsModal
                productId={selectedProductId || ''}
                isOpen={!!selectedProductId}
                onClose={() => setSelectedProductId(null)}
            />
        </div>
    );
}
