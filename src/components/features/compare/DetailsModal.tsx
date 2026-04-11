'use client';

import React, { useEffect, useState } from 'react';
import { X, Loader2, BarChart2, Sparkles, TrendingUp, Package, History, ShieldAlert } from 'lucide-react';
import PriceChart from './PriceChart';
import PredictionCard from './PredictionCard';

interface DetailsModalProps {
    productId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function DetailsModal({ productId, isOpen, onClose }: DetailsModalProps) {
    const [history, setHistory] = useState<any[]>([]);
    const [prediction, setPrediction] = useState<any>(null);
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && productId) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const [histRes, predRes, prodRes] = await Promise.all([
                        fetch(`/api/history?productId=${productId}`),
                        fetch(`/api/predict?productId=${productId}`),
                        fetch(`/api/products/${productId}`)
                    ]);
                    const histData = await histRes.json();
                    const predData = await predRes.json();
                    const prodData = await prodRes.json();

                    setHistory(histData);
                    setPrediction(predData);
                    setProduct(prodData);
                } catch (error) {
                    console.error('Error fetching details:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [isOpen, productId]);

    if (!isOpen) return null;

    const isBlocked = product?.title?.toLowerCase().includes('are you a human');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="glass w-full max-w-5xl max-h-[90vh] rounded-[3rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-500">
                {/* Header */}
                <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-[hsl(214_89%_52%/0.08)] flex items-center justify-center text-[hsl(214_89%_52%)] border border-[hsl(214_89%_52%/0.20)] shadow-inner">
                            <History size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase">Price <span className="gradient-text">History</span></h2>
                                {product?.platform && (
                                    <span className="px-2 py-0.5 bg-white/5 rounded-lg text-[8px] font-black uppercase tracking-widest text-gray-500 border border-white/5">
                                        {product.platform}
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-400 font-bold text-sm truncate max-w-md">
                                {product?.title || 'Retrieving historical records...'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-400 hover:text-white transition-all active:scale-95 group"
                    >
                        <X size={24} className="group-hover:rotate-90 transition-transform" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-10 space-y-12">
                    {loading ? (
                        <div className="h-96 flex flex-col items-center justify-center gap-6">
                            <div className="relative">
                                <Loader2 className="animate-spin text-[hsl(214_89%_52%)]" size={48} />
                                <div className="absolute inset-0 blur-xl bg-[hsl(214_89%_52%)]/20 animate-pulse" />
                            </div>
                            <p className="text-gray-400 font-bold tracking-wide">Querying history logs...</p>
                        </div>
                    ) : isBlocked ? (
                        <div className="h-96 flex flex-col items-center justify-center text-center gap-6 bg-red-500/5 rounded-[2.5rem] border border-red-500/10 p-12">
                            <ShieldAlert size={64} className="text-red-500 opacity-40 animate-pulse" />
                            <div>
                                <h3 className="text-2xl font-black text-white mb-3">Data Stream Blocked</h3>
                                <p className="text-gray-400 font-medium max-w-md mx-auto">
                                    The vendor has temporarily restricted automated data harvesting (Security Check).
                                    No historical logs could be retrieved for this session.
                                </p>
                            </div>
                            <a
                                href={product.originalUrl}
                                target="_blank"
                                className="px-8 py-3 bg-white text-black font-black rounded-md hover:bg-gray-100 transition-all"
                            >
                                PASS SECURITY CHECK
                            </a>
                        </div>
                    ) : (
                        <>
                            <section className="animate-fade-in-up">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <BarChart2 size={18} className="text-[hsl(214_89%_52%)]" />
                                        <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Price Momentum (30D)</h3>
                                    </div>
                                </div>
                                <div className="bg-white/[0.02] p-8 rounded-[2rem] border border-white/5 card-glow">
                                    {history.length > 0 ? (
                                        <PriceChart productId={productId} data={history} />
                                    ) : (
                                        <div className="h-64 flex flex-col items-center justify-center text-gray-500 gap-3">
                                            <Sparkles size={32} className="opacity-20" />
                                            <p className="font-bold">Tracking started. Harvesting price signals...</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                                <div className="flex items-center gap-2 mb-6">
                                    <Sparkles size={18} className="text-green-400" />
                                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Antigravity Forecast</h3>
                                </div>
                                {prediction && !prediction.error && prediction.predictedPrice > 0 ? (
                                    <PredictionCard prediction={prediction} />
                                ) : (
                                    <div className="p-8 bg-[hsl(214_89%_52%)]/5 border border-[hsl(214_89%_52%/0.20)] rounded-[2rem] text-[hsl(214_89%_55%)] font-bold flex items-center gap-4">
                                        <div className="bg-[hsl(214_89%_52%/0.08)] p-3 rounded-md uppercase text-[10px] tracking-widest">Awaiting Logs</div>
                                        Predictive engine requires at least 3 historical snapshots to triangulate a forecast.
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-white/5 bg-white/[0.02] flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-10 py-4 bg-white text-black font-black rounded-md hover:bg-gray-200 transition-all active:scale-95 shadow-xl"
                    >
                        DISMISS
                    </button>
                </div>
            </div>
        </div>
    );
}
