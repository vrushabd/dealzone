"use client";
import { useEffect, useState } from "react";
import {
    Brain, TrendingDown, TrendingUp, Minus,
    ShoppingCart, Clock, Zap, Loader2, AlertCircle,
} from "lucide-react";

interface Prediction {
    trend: "down" | "up" | "stable";
    predictedPrice: number;
    confidence: number;
    reason: string;
    daysUntilNextDrop?: number;
}

interface Props {
    productId: string;
    currentPrice?: number | null;
}

export default function BuyAdvice({ productId, currentPrice }: Props) {
    const [prediction, setPrediction] = useState<Prediction | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch(`/api/predict?productId=${productId}`)
            .then((r) => r.json())
            .then((d) => {
                if (d.error) setError(true);
                else setPrediction(d);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [productId]);

    if (loading) {
        return (
            <div className="glass rounded-2xl p-5 flex items-center gap-3">
                <Loader2 size={18} className="animate-spin text-orange-400 flex-shrink-0" />
                <span className="text-sm text-[var(--text-muted)]">Analysing price history with AI...</span>
            </div>
        );
    }

    if (error || !prediction) {
        return (
            <div className="glass rounded-2xl p-5 flex items-center gap-3 text-[var(--text-muted)]">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span className="text-sm">Could not generate AI insights for this product.</span>
            </div>
        );
    }

    const isDown   = prediction.trend === "down";
    const isUp     = prediction.trend === "up";
    const isStable = prediction.trend === "stable";

    // "Should I buy now?" verdict
    const verdict = isDown
        ? { label: "Wait a Few Days", sub: "Price likely dropping soon", bg: "bg-[hsl(45_95%_53%/0.08)]", border: "border-[hsl(45_95%_53%/0.25)]", text: "text-[hsl(45_95%_53%)]", icon: <Clock size={20} />, dot: "bg-[hsl(45_95%_53%)]" }
        : isUp
        ? { label: "Buy Now!", sub: "Price trending upward", bg: "bg-[hsl(0_84%_60%/0.08)]", border: "border-[hsl(0_84%_60%/0.25)]", text: "text-[hsl(0_84%_65%)]", icon: <ShoppingCart size={20} />, dot: "bg-[hsl(0_84%_60%)]" }
        : { label: "Good Time to Buy", sub: "Price is stable — no rush", bg: "bg-[hsl(142_72%_50%/0.08)]", border: "border-[hsl(142_72%_50%/0.25)]", text: "text-[hsl(142_72%_55%)]", icon: <Zap size={20} />, dot: "bg-[hsl(142_72%_50%)]" };

    const TrendIcon = isDown ? TrendingDown : isUp ? TrendingUp : Minus;
    const trendColor = isDown ? "text-[hsl(45_95%_53%)]" : isUp ? "text-[hsl(0_84%_60%)]" : "text-[hsl(142_72%_50%)]";

    const priceDiff = currentPrice && prediction.predictedPrice
        ? prediction.predictedPrice - currentPrice
        : null;

    return (
        <div className="glass rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border)]">
                <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0">
                    <Brain size={15} className="text-purple-400" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">AI Buy Advisor</h3>
                    <p className="text-[10px] text-[var(--text-muted)]">
                        Based on {prediction.confidence}% confidence · 30-day analysis
                    </p>
                </div>
                {/* Confidence pill */}
                <div className="ml-auto flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-purple-400">{prediction.confidence}% confidence</span>
                </div>
            </div>

            <div className="p-5 space-y-4">
                {/* Verdict card */}
                <div className={`flex items-center gap-4 rounded-xl border p-4 ${verdict.bg} ${verdict.border}`}>
                    <div className={`w-10 h-10 rounded-xl ${verdict.bg} border ${verdict.border} flex items-center justify-center ${verdict.text} flex-shrink-0`}>
                        {verdict.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className={`font-extrabold text-base ${verdict.text}`}>{verdict.label}</div>
                        <div className="text-[hsl(215_12%_45%)] text-xs mt-0.5">{verdict.sub}</div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${verdict.dot} flex-shrink-0`} />
                </div>

                {/* AI Reason */}
                <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-4">
                    <div className="flex items-start gap-2.5">
                        <Brain size={13} className="text-purple-400 flex-shrink-0 mt-0.5" />
                        <p className="text-[var(--text-secondary)] text-xs leading-relaxed">{prediction.reason}</p>
                    </div>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-3 gap-2.5">
                    {/* Trend */}
                    <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-3 text-center">
                        <TrendIcon size={16} className={`${trendColor} mx-auto mb-1`} />
                        <div className={`text-xs font-bold ${trendColor} capitalize`}>{prediction.trend}</div>
                        <div className="text-[9px] text-[var(--text-muted)] mt-0.5">Trend</div>
                    </div>

                    {/* Predicted price */}
                    {prediction.predictedPrice > 0 && (
                        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-3 text-center">
                            <div className="text-xs font-extrabold text-[var(--text-primary)]">
                                ₹{prediction.predictedPrice.toLocaleString("en-IN")}
                            </div>
                            <div className="text-[9px] text-[var(--text-muted)] mt-0.5">Predicted</div>
                            {priceDiff !== null && (
                                <div className={`text-[9px] font-bold mt-0.5 ${priceDiff < 0 ? "text-[hsl(142_72%_50%)]" : "text-[hsl(0_84%_60%)]"}`}>
                                    {priceDiff < 0 ? "↓" : "↑"} ₹{Math.abs(priceDiff).toLocaleString("en-IN")}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Days until drop */}
                    <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-3 text-center">
                        {prediction.daysUntilNextDrop ? (
                            <>
                                <div className="text-xs font-extrabold text-[hsl(45_95%_53%)]">
                                    ~{prediction.daysUntilNextDrop}d
                                </div>
                                <div className="text-[9px] text-[var(--text-muted)] mt-0.5">Until drop</div>
                            </>
                        ) : (
                            <>
                                <div className="text-xs font-extrabold text-[var(--text-muted)]">—</div>
                                <div className="text-[9px] text-[var(--text-muted)] mt-0.5">No drop expected</div>
                            </>
                        )}
                    </div>
                </div>

                <p className="text-[var(--text-muted)] text-[10px] text-center leading-relaxed">
                    AI predictions are based on historical trends and are not financial advice.
                </p>
            </div>
        </div>
    );
}
