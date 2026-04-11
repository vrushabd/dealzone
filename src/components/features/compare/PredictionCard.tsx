'use client';

import React from 'react';
import { TrendingDown, TrendingUp, Minus, Calendar, ShoppingCart, Sparkles, Zap } from 'lucide-react';

interface PredictionCardProps {
    prediction: {
        productId: string;
        trend: 'down' | 'up' | 'stable';
        predictedPrice: number;
        confidence: number;
        reason: string;
        daysUntilNextDrop?: number;
    };
}

export default function PredictionCard({ prediction }: PredictionCardProps) {
    const getTrendIcon = () => {
        switch (prediction.trend) {
            case 'down': return <TrendingDown size={32} className="text-green-500" />;
            case 'up': return <TrendingUp size={32} className="text-red-500" />;
            default: return <Minus size={32} className="text-blue-500" />;
        }
    };

    const getTrendText = () => {
        switch (prediction.trend) {
            case 'down': return 'CRITICAL DROP';
            case 'up': return 'PRICE INFLATION';
            default: return 'STABLE VECTOR';
        }
    };

    const getTrendColorClass = () => {
        switch (prediction.trend) {
            case 'down': return 'text-green-400 bg-green-500/10 border-green-500/20';
            case 'up': return 'text-red-400 bg-red-500/10 border-red-500/20';
            default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
        }
    };

    const trendColor = getTrendColorClass();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
            {/* Primary Signal Card */}
            <div className={`p-8 rounded-[2.5rem] border flex flex-col justify-between ${trendColor} card-glow relative overflow-hidden group`}>
                <div className="absolute top-0 right-0 p-8 opacity-20 transform rotate-12 transition-transform group-hover:scale-125">
                    {getTrendIcon()}
                </div>

                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Zap size={16} fill="currentColor" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">{getTrendText()}</span>
                    </div>
                    <div className="text-5xl font-black tracking-tighter mb-2">
                        ₹{prediction.predictedPrice.toLocaleString()}
                    </div>
                    <p className="text-sm font-bold opacity-80">Predicted Target (Next 7 Days)</p>
                </div>

                <div className="mt-8 pt-8 border-t border-current/10 flex items-center gap-4">
                    <div className="flex-1">
                        <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">AI Confidence Score</div>
                        <div className="w-full h-2 bg-current/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-current transition-all duration-1000"
                                style={{ width: `${prediction.confidence}%` }}
                            />
                        </div>
                    </div>
                    <div className="text-2xl font-black">{prediction.confidence}%</div>
                </div>
            </div>

            {/* Rationale Card */}
            <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex flex-col justify-between card-glow">
                <div>
                    <div className="flex items-center gap-2 mb-6 text-gray-500">
                        <Calendar size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">AI Rationale</span>
                    </div>
                    <p className="text-lg font-bold text-gray-200 leading-relaxed italic">
                        "{prediction.reason}"
                    </p>
                </div>

                <div className="mt-8 flex gap-3">
                    <div className="flex-1 bg-white/5 p-4 rounded-md border border-white/5">
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Buy Strategy</div>
                        <div className={`text-sm font-black ${prediction.trend === 'down' ? 'text-green-400' : 'text-[hsl(214_89%_55%)]'}`}>
                            {prediction.trend === 'down' ? 'HOLD FOR DROP' : 'BUY IMMEDIATELY'}
                        </div>
                    </div>
                    {prediction.daysUntilNextDrop && (
                        <div className="flex-1 bg-white/5 p-4 rounded-md border border-white/5 text-center">
                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Eta Drop</div>
                            <div className="text-sm font-black text-white">{prediction.daysUntilNextDrop} Days</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
