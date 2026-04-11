'use client';

import React from 'react';
import { ShoppingCart, TrendingUp, Sparkles, ShieldAlert, Cpu, History } from 'lucide-react';
import { ScrapedProduct } from '@/lib/features/scraper/scraper';

interface ComparisonTableProps {
    products: (ScrapedProduct & { dbId: string })[];
    onOpenDetails: (dbId: string) => void;
}

export default function ComparisonTable({ products, onOpenDetails }: ComparisonTableProps) {
    if (products.length === 0) return null;

    const lowestPrice = Math.min(...products.map((p) => p.price).filter(p => p > 0));

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-children pt-8">
            {products.map((product, index) => {
                const isBestDeal = product.price > 0 && product.price === lowestPrice;
                const hasNoPrice = product.price <= 0;
                const isBlocked = product.title.toLowerCase().includes('are you a human') || product.title.toLowerCase().includes('captcha');

                return (
                    <div
                        key={index}
                        className={`flex flex-col glass rounded-lg border overflow-hidden transition-all duration-500 card-glow animate-fade-in-up ${isBestDeal ? 'border-[hsl(214_89%_52%/0.5)] ring-1 ring-[hsl(214_89%_52%/0.2)] shadow-[0_0_50px_hsl(214_89%_52%/0.12)] scale-[1.02]' : 'border-white/5'
                            }`}
                    >
                        {/* Image Section */}
                        <div className="relative h-72 p-10 bg-gradient-to-b from-white/[0.03] to-transparent flex items-center justify-center group overflow-hidden">
                            {isBlocked ? (
                                <div className="flex flex-col items-center justify-center text-[hsl(214_89%_52%)]/40 gap-4">
                                    <ShieldAlert size={64} className="animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Shield Active</span>
                                </div>
                            ) : (
                                <img
                                    src={product.image || '/placeholder-product.png'}
                                    alt={product.title}
                                    className="h-full w-auto object-contain transition-transform duration-700 group-hover:scale-110 drop-shadow-2xl"
                                />
                            )}

                            {isBestDeal && !isBlocked && (
                                <div className="absolute top-6 right-6 bg-[hsl(214_89%_52%)] text-white px-5 py-2 rounded-md text-[10px] font-black tracking-[0.2em] shadow-xl animate-bounce flex items-center gap-2">
                                    <Sparkles size={14} className="fill-current" />
                                    ALPHA DEAL
                                </div>
                            )}

                            <div className="absolute top-6 left-6">
                                <span className="px-4 py-1.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-md text-[10px] font-black uppercase tracking-[0.2em] text-[hsl(214_89%_52%)] flex items-center gap-2 shadow-lg">
                                    <Cpu size={12} />
                                    {product.platform}
                                </span>
                            </div>

                            {isBlocked && (
                                <div className="absolute inset-0 bg-red-500/10 backdrop-blur-[2px] flex items-center justify-center p-8 text-center">
                                    <div className="bg-red-500 text-white px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest shadow-2xl">
                                        Access Denied by Vendor
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Content Section */}
                        <div className="p-10 flex-1 flex flex-col">
                            <h3 className="text-2xl font-black text-white mb-6 line-clamp-2 leading-[1.2] tracking-tight min-h-[4rem] group-hover:text-[hsl(214_89%_55%)] transition-colors">
                                {isBlocked ? (
                                    <span className="text-red-400">Security Check Intercepted</span>
                                ) : (
                                    product.title
                                )}
                            </h3>

                            <div className="flex items-end justify-between mb-10">
                                <div>
                                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3">
                                        Market Logic
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-5xl font-black text-white leading-none tracking-tighter">
                                            {hasNoPrice ? (
                                                <span className="text-3xl text-gray-600">NA</span>
                                            ) : (
                                                `₹${product.price.toLocaleString()}`
                                            )}
                                        </span>
                                        {product.originalPrice && !hasNoPrice && (
                                            <span className="text-base text-gray-500 line-through font-bold opacity-50">
                                                ₹{product.originalPrice.toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {product.discount && !hasNoPrice && (
                                    <div className="bg-green-500/10 text-green-400 px-4 py-1.5 rounded-md text-xs font-black ring-1 ring-green-500/30">
                                        -{product.discount}%
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 mb-10 bg-white/[0.02] p-6 rounded-[2rem] border border-white/5 shadow-inner">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Merchant</span>
                                    <span className="text-gray-200 font-black tracking-tight">{product.seller || 'Authorized'}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Supply Vector</span>
                                    <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${product.availability?.toLowerCase().includes('out') || isBlocked ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                                        }`}>
                                        {isBlocked ? 'Inaccessible' : product.availability ?? 'Unknown'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-auto grid grid-cols-2 gap-4">
                                <a
                                    href={isBlocked ? product.url : `/api/redirect/${product.dbId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center justify-center gap-3 px-8 py-5 rounded-[1.5rem] font-black transition-all active:scale-[0.96] btn-glow shadow-xl ${hasNoPrice || isBlocked
                                            ? 'bg-white text-black hover:bg-gray-100'
                                            : 'bg-[hsl(214_89%_52%)] text-white hover:bg-[hsl(214_89%_45%)] shadow-[hsl(214_89%_52%/0.25)]'
                                        }`}
                                >
                                    {isBlocked ? 'Unlock Store' : hasNoPrice ? 'Check Live' : 'Acquire Now'}
                                    <ShoppingCart size={20} />
                                </a>
                                <button
                                    type="button"
                                    onClick={() => onOpenDetails(product.dbId)}
                                    className="flex items-center justify-center gap-3 px-8 py-5 bg-white/5 hover:bg-white/10 text-gray-300 font-black rounded-[1.5rem] border border-white/5 hover:border-white/10 transition-all active:scale-[0.96] group"
                                >
                                    History
                                    <History size={20} className="group-hover:rotate-12 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
