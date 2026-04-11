"use client";
import { useEffect, useState } from "react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine,
} from "recharts";
import { TrendingDown, TrendingUp, Minus, Clock } from "lucide-react";

interface PricePoint {
    id: string;
    price: number;
    timestamp: string;
    date: string;
}

interface Props {
    productId: string;
    currentPrice?: number | null;
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatPrice(p: number) {
    return "₹" + p.toLocaleString("en-IN");
}

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[hsl(224_32%_9%)] border border-[hsl(224_20%_18%)] rounded-xl px-3 py-2.5 shadow-xl">
                <p className="text-[10px] text-[hsl(215_12%_45%)] mb-1">{label}</p>
                <p className="text-orange-400 font-bold text-sm">
                    {formatPrice(payload[0].value)}
                </p>
            </div>
        );
    }
    return null;
};

export default function PriceHistoryChart({ productId, currentPrice }: Props) {
    const [history, setHistory] = useState<PricePoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch(`/api/history?productId=${productId}`)
            .then((r) => r.json())
            .then((data) => {
                if (Array.isArray(data)) setHistory(data);
                else setError(true);
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [productId]);

    if (loading) {
        return (
            <div className="glass rounded-2xl p-6">
                <div className="skeleton h-5 w-40 rounded-lg mb-6" />
                <div className="skeleton h-48 rounded-xl" />
            </div>
        );
    }

    if (error || history.length === 0) {
        return (
            <div className="glass rounded-2xl p-6 flex items-center gap-3 text-[hsl(215_12%_42%)]">
                <Clock size={18} className="flex-shrink-0" />
                <p className="text-sm">No price history recorded yet. History will appear as prices are tracked over time.</p>
            </div>
        );
    }

    const chartData = history.map((h) => ({
        date: formatDate(h.date || h.timestamp),
        price: h.price,
        raw: h,
    }));

    const prices = history.map((h) => h.price);
    const allTimeLow  = Math.min(...prices);
    const allTimeHigh = Math.max(...prices);
    const firstPrice  = prices[0];
    const lastPrice   = prices[prices.length - 1];
    const delta       = lastPrice - firstPrice;
    const deltaPct    = firstPrice > 0 ? ((delta / firstPrice) * 100).toFixed(1) : "0";
    const trending    = delta < 0 ? "down" : delta > 0 ? "up" : "flat";

    const trendColor  = trending === "down" ? "text-[hsl(142_72%_50%)]" : trending === "up" ? "text-[hsl(0_84%_60%)]" : "text-[hsl(215_15%_55%)]";
    const TrendIcon   = trending === "down" ? TrendingDown : trending === "up" ? TrendingUp : Minus;

    // Y-axis domain with padding
    const yMin = Math.floor(allTimeLow * 0.96);
    const yMax = Math.ceil(allTimeHigh * 1.04);

    return (
        <div className="glass rounded-2xl p-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-white font-bold text-base flex items-center gap-2">
                        <Clock size={16} className="text-orange-400" />
                        Price History
                    </h2>
                    <p className="text-[hsl(215_12%_40%)] text-xs mt-0.5">{history.length} data points tracked</p>
                </div>

                {/* Trend badge */}
                <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${
                    trending === "down"
                        ? "bg-[hsl(142_72%_50%/0.1)] border-[hsl(142_72%_50%/0.25)] text-[hsl(142_72%_50%)]"
                        : trending === "up"
                        ? "bg-[hsl(0_84%_60%/0.1)] border-[hsl(0_84%_60%/0.25)] text-[hsl(0_84%_60%)]"
                        : "bg-[hsl(215_12%_42%/0.1)] border-[hsl(215_12%_42%/0.25)] text-[hsl(215_15%_55%)]"
                }`}>
                    <TrendIcon size={12} />
                    {trending === "flat" ? "Stable" : `${Math.abs(Number(deltaPct))}% ${trending === "down" ? "cheaper" : "costlier"}`}
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                    { label: "All-Time Low",  value: formatPrice(allTimeLow),  color: "text-[hsl(142_72%_50%)]" },
                    { label: "Current Price", value: currentPrice ? formatPrice(currentPrice) : formatPrice(lastPrice), color: "text-orange-400" },
                    { label: "All-Time High", value: formatPrice(allTimeHigh), color: "text-[hsl(0_84%_60%)]" },
                ].map((s) => (
                    <div key={s.label} className="bg-[hsl(224_28%_9%)] border border-[hsl(224_20%_13%)] rounded-xl p-3 text-center">
                        <div className={`font-extrabold text-sm ${s.color}`}>{s.value}</div>
                        <div className="text-[hsl(215_10%_38%)] text-[10px] mt-0.5">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor="hsl(24 95% 53%)" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="hsl(24 95% 53%)" stopOpacity={0.01} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(224 20% 13%)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: "hsl(215 12% 40%)", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            domain={[yMin, yMax]}
                            tick={{ fill: "hsl(215 12% 40%)", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => "₹" + (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)}
                            width={48}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(24 95% 53% / 0.3)", strokeWidth: 1 }} />
                        {/* Reference line for all-time low */}
                        <ReferenceLine
                            y={allTimeLow}
                            stroke="hsl(142 72% 50% / 0.4)"
                            strokeDasharray="4 3"
                            label={{ value: "Low", fill: "hsl(142 72% 50%)", fontSize: 9, position: "insideTopRight" }}
                        />
                        <Area
                            type="monotone"
                            dataKey="price"
                            stroke="hsl(24 95% 53%)"
                            strokeWidth={2}
                            fill="url(#priceGradient)"
                            dot={chartData.length <= 15 ? { fill: "hsl(24 95% 53%)", r: 3, strokeWidth: 0 } : false}
                            activeDot={{ r: 5, fill: "hsl(24 95% 53%)", strokeWidth: 2, stroke: "hsl(224 28% 9%)" }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <p className="text-[hsl(215_10%_32%)] text-[10px] mt-4 text-center">
                Prices tracked automatically · Historical data may vary
            </p>
        </div>
    );
}
