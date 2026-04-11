"use client";
import { useState } from "react";
import { Search, History, TrendingDown, TrendingUp, AlertCircle, Loader2, ArrowRight, ExternalLink, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

export function PriceTracker() {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<any>(null);

    const handleTrack = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!url) return;

        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/price-track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Failed to track price");
            setData(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Search Box */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 sm:p-10 shadow-2xl mb-8">
                <div className="text-center mb-8">
                    <History className="w-12 h-12 text-[hsl(214_89%_52%)] mx-auto mb-4 bg-[hsl(214_89%_52%/0.08)] p-2.5 rounded-lg" />
                    <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">Price History Tracker</h2>
                    <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto">
                        Paste any Amazon or Flipkart product URL to see its historical price trends and find the absolute best time to buy.
                    </p>
                </div>

                <form onSubmit={handleTrack} className="relative group">
                    <input
                        type="url"
                        placeholder="https://www.amazon.in/dp/B08L5TNJHG"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border)] focus:border-[hsl(214_89%_52%/0.50)] rounded-md pl-12 pr-32 py-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none transition-all focus:ring-4 focus:ring-[hsl(214_89%_52%/0.10)]"
                        required
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-placeholder)] w-5 h-5 group-focus-within:text-[hsl(214_89%_52%)] transition-colors" />
                    <button
                        type="submit"
                        disabled={loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-[hsl(214_89%_52%)] hover:bg-[hsl(214_89%_45%)] text-white font-bold py-2.5 px-6 rounded-md transition-all flex items-center gap-2 disabled:opacity-50 text-sm"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyze"}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-md flex items-center gap-3 text-red-400 text-sm text-center justify-center">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}
            </div>

            {/* Results Display */}
            {data && (
                <div className="animate-fade-in space-y-6">
                    {/* Product Summary */}
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-xl">
                        <div className="bg-[var(--bg-card-hover)] w-full md:w-48 aspect-square relative flex-shrink-0 border-b md:border-b-0 md:border-r border-[var(--border)]">
                            {data.product.image ? (
                                <Image
                                    src={data.product.image}
                                    alt={data.product.title}
                                    fill
                                    className="object-contain p-4"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <ShoppingCart size={44} className="text-[var(--text-muted)]" />
                                </div>
                            )}
                            <div className="absolute top-2 left-2 bg-[var(--bg-card)] border border-[var(--border)] text-[0.65rem] font-bold px-2 py-0.5 rounded uppercase tracking-wider text-[hsl(214_89%_52%)]">
                                {data.product.platform}
                            </div>
                        </div>
                        <div className="p-6 flex flex-col flex-1 justify-center">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 line-clamp-2 leading-snug">
                                {data.product.title}
                            </h3>
                            <div className="flex items-center gap-6">
                                <div>
                                    <p className="text-[var(--text-muted)] text-[0.65rem] uppercase tracking-widest font-bold mb-1">Current Price</p>
                                    <p className="text-2xl font-black text-[hsl(214_89%_52%)]">₹{data.product.price.toLocaleString("en-IN")}</p>
                                </div>
                                {data.history.length > 0 && (
                                    <>
                                        <div>
                                            <p className="text-[var(--text-muted)] text-[0.65rem] uppercase tracking-widest font-bold mb-1">Lowest recorded</p>
                                            <p className="text-lg font-bold text-green-500">₹{data.lowestPrice.toLocaleString("en-IN")}</p>
                                        </div>
                                        <div className="hidden sm:block">
                                            <p className="text-[var(--text-muted)] text-[0.65rem] uppercase tracking-widest font-bold mb-1">Price Range</p>
                                            <p className="text-xs text-[var(--text-secondary)] font-medium">
                                                ₹{data.lowestPrice.toLocaleString("en-IN")} — ₹{data.highestPrice.toLocaleString("en-IN")}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Chart Card */}
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-xl">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[hsl(214_89%_52%/0.08)] rounded-md">
                                    <TrendingDown size={18} className="text-[hsl(214_89%_52%)]" />
                                </div>
                                <h4 className="font-bold text-[var(--text-primary)]">Price Trend Analysis</h4>
                            </div>
                            <div className="text-[0.65rem] font-bold text-[var(--text-muted)] bg-[var(--bg-surface)] px-2.5 py-1 rounded-full border border-[var(--border)]">
                                {data.history.length} data points
                            </div>
                        </div>

                        {data.history.length > 1 ? (
                            <div className="h-[300px] w-full mt-4 bg-[var(--bg-card-hover)]/30 p-2 sm:p-4 rounded-md border border-[var(--border)]/50">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.history}>
                                        <defs>
                                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(214, 89%, 52%)" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="hsl(214, 89%, 52%)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="var(--text-muted)"
                                            fontSize={10}
                                            tickFormatter={(str) => {
                                                const date = new Date(str);
                                                return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
                                            }}
                                            minTickGap={30}
                                        />
                                        <YAxis
                                            stroke="var(--text-muted)"
                                            fontSize={10}
                                            tickFormatter={(val) => `₹${val}`}
                                            domain={['auto', 'auto']}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--bg-card)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '12px',
                                                fontSize: '11px',
                                                color: 'var(--text-primary)'
                                            }}
                                            itemStyle={{ color: 'hsl(214, 89%, 52%)', fontWeight: 'bold' }}
                                            formatter={(value: any) => [`₹${(value || 0).toLocaleString('en-IN')}`, 'Price']}
                                            labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN', {
                                                weekday: 'short',
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="price"
                                            stroke="hsl(214, 89%, 52%)"
                                            strokeWidth={2.5}
                                            fillOpacity={1}
                                            fill="url(#colorPrice)"
                                            animationDuration={1500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[200px] flex flex-col items-center justify-center text-center p-10 bg-[var(--bg-card-hover)]/50 rounded-md border border-dashed border-[var(--border)]">
                                <AlertCircle size={32} className="text-[var(--text-placeholder)] mb-4" />
                                <p className="text-[var(--text-secondary)] font-medium mb-1">Tracking initialized!</p>
                                <p className="text-[var(--text-muted)] text-xs max-w-xs">
                                    We&apos;ve just started tracking this product. Historical data will appear here as the price changes over time.
                                </p>
                            </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md">
                                <div className="flex items-center gap-2 mb-1 text-[var(--text-muted)]">
                                    <TrendingDown size={14} className="text-green-500" />
                                    <span className="text-[0.65rem] font-bold uppercase tracking-wider">All-time Low</span>
                                </div>
                                <p className="text-xl font-bold text-[var(--text-primary)]">₹{data.lowestPrice.toLocaleString("en-IN")}</p>
                            </div>
                            <div className="p-4 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md">
                                <div className="flex items-center gap-2 mb-1 text-[var(--text-muted)]">
                                    <TrendingUp size={14} className="text-red-500" />
                                    <span className="text-[0.65rem] font-bold uppercase tracking-wider">All-time High</span>
                                </div>
                                <p className="text-xl font-bold text-[var(--text-primary)]">₹{data.highestPrice.toLocaleString("en-IN")}</p>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row gap-4">
                            <a 
                                href={data.product.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 bg-[var(--bg-elevated)] hover:bg-[hsl(214_89%_52%)] hover:text-white text-[var(--text-primary)] font-bold py-3 px-6 rounded-md transition-all border border-[var(--border)]"
                            >
                                <ExternalLink size={16} />
                                View on Store
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
