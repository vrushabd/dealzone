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
    platform?: string | null;
}

interface Props {
    productId: string;
    currentPrice?: number | null;
}

type TooltipContentProps = {
    active?: boolean;
    label?: string;
    payload?: Array<{ value?: number | string }>;
};

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatPrice(p: number) {
    return "₹" + p.toLocaleString("en-IN");
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: TooltipContentProps) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md px-3 py-2.5 shadow-xl">
                <p className="text-[10px] text-[var(--text-muted)] mb-1">{label}</p>
                <p className="text-[hsl(214_89%_55%)] font-bold text-sm">
                    {formatPrice(Number(payload[0].value || 0))}
                </p>
            </div>
        );
    }
    return null;
}

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
            <div className="glass rounded-md p-6">
                <div className="skeleton h-5 w-40 rounded-lg mb-6" />
                <div className="skeleton h-48 rounded-md" />
            </div>
        );
    }

    if (error || history.length === 0) {
        return (
            <div className="glass rounded-md p-6 flex items-center gap-3 text-[var(--text-muted)]">
                <Clock size={18} className="flex-shrink-0" />
                <p className="text-sm">No price history recorded yet. History will appear as prices are tracked over time.</p>
            </div>
        );
    }

    if (history.length === 1) {
        const firstPoint = history[0];
        const displayedPrice = currentPrice || firstPoint.price;

        return (
            <div className="glass border border-[var(--border)] rounded-md p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                        <h2 className="text-[var(--text-primary)] font-bold text-base flex items-center gap-2">
                            <Clock size={16} className="text-[hsl(214_89%_55%)]" />
                            Price History
                        </h2>
                        <p className="text-[var(--text-muted)] text-xs mt-0.5">1 data point recorded so far</p>
                    </div>
                    <div className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)]">
                        Trend unlocks after more syncs
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md p-4 text-center">
                        <div className="font-extrabold text-lg text-[hsl(214_89%_55%)]">{formatPrice(displayedPrice)}</div>
                        <div className="text-[var(--text-muted)] text-[10px] mt-1">Current Price</div>
                    </div>
                    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md p-4 text-center">
                        <div className="font-extrabold text-sm text-[var(--text-primary)]">{formatDate(firstPoint.date || firstPoint.timestamp)}</div>
                        <div className="text-[var(--text-muted)] text-[10px] mt-1">First Recorded</div>
                    </div>
                </div>

                <p className="text-[var(--text-muted)] text-sm">
                    We’ve started tracking this deal. Run more syncs or wait for additional price changes to unlock the chart trend and stronger AI advice.
                </p>
            </div>
        );
    }

    // Collapse into points grouped by date
    const chartDataMap = new Map();
    history.forEach((h) => {
        const d = formatDate(h.date || h.timestamp);
        if (!chartDataMap.has(d)) {
            chartDataMap.set(d, { date: d });
        }
        const platform = h.platform === 'amazon' ? 'amazonPrice' : h.platform === 'flipkart' ? 'flipkartPrice' : 'price';
        chartDataMap.get(d)[platform] = h.price;
    });
    const chartData = Array.from(chartDataMap.values());

    const prices = history.map((h) => h.price);
    const allTimeLow  = Math.min(...prices);
    const allTimeHigh = Math.max(...prices);
    const firstPrice  = prices[0];
    const lastPrice   = prices[prices.length - 1];
    const delta       = lastPrice - firstPrice;
    const deltaPct    = firstPrice > 0 ? ((delta / firstPrice) * 100).toFixed(1) : "0";
    const trending    = delta < 0 ? "down" : delta > 0 ? "up" : "flat";

    const TrendIcon   = trending === "down" ? TrendingDown : trending === "up" ? TrendingUp : Minus;

    // Y-axis domain with padding
    const yMin = Math.floor(allTimeLow * 0.96);
    const yMax = Math.ceil(allTimeHigh * 1.04);

    return (
        <div className="glass border border-[var(--border)] rounded-md p-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-[var(--text-primary)] font-bold text-base flex items-center gap-2">
                        <Clock size={16} className="text-[hsl(214_89%_55%)]" />
                        Price History
                    </h2>
                    <p className="text-[var(--text-muted)] text-xs mt-0.5">{history.length} data points tracked across platforms</p>
                </div>

                {/* Trend badge */}
                <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${
                    trending === "down"
                        ? "bg-green-500/10 border-green-500/25 text-green-500"
                        : trending === "up"
                        ? "bg-red-500/10 border-red-500/25 text-red-500"
                        : "bg-[var(--text-muted)]/10 border-[var(--text-muted)]/25 text-[var(--text-muted)]"
                }`}>
                    <TrendIcon size={12} />
                    {trending === "flat" ? "Stable" : `${Math.abs(Number(deltaPct))}% ${trending === "down" ? "cheaper" : "costlier"}`}
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                    { label: "All-Time Low",  value: formatPrice(allTimeLow),  color: "text-green-500" },
                    { label: "Current Price", value: currentPrice ? formatPrice(currentPrice) : formatPrice(lastPrice), color: "text-[hsl(214_89%_55%)]" },
                    { label: "All-Time High", value: formatPrice(allTimeHigh), color: "text-red-500" },
                ].map((s) => (
                    <div key={s.label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md p-3 text-center">
                        <div className={`font-extrabold text-sm ${s.color}`}>{s.value}</div>
                        <div className="text-[var(--text-muted)] text-[10px] mt-0.5">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="amazonGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor="#eab308" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#eab308" stopOpacity={0.01} />
                            </linearGradient>
                            <linearGradient id="flipkartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.01} />
                            </linearGradient>
                            <linearGradient id="generalGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor="#f97316" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0.01} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            domain={[yMin, yMax]}
                            tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => "₹" + (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v)}
                            width={48}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--bg-surface)", opacity: 0.4 }} />
                        <ReferenceLine
                            y={allTimeLow}
                            stroke="var(--text-muted)"
                            strokeDasharray="4 3"
                            label={{ value: "Low", fill: "var(--text-muted)", fontSize: 9, position: "insideBottomRight" }}
                        />
                        
                        <Area type="monotone" dataKey="amazonPrice" stroke="#eab308" strokeWidth={2} fill="url(#amazonGradient)" dot={false} activeDot={{ r: 4 }} name="Amazon" />
                        <Area type="monotone" dataKey="flipkartPrice" stroke="#2563eb" strokeWidth={2} fill="url(#flipkartGradient)" dot={false} activeDot={{ r: 4 }} name="Flipkart" />
                        <Area type="monotone" dataKey="price" stroke="#f97316" strokeWidth={2} fill="url(#generalGradient)" dot={false} activeDot={{ r: 4 }} name="Generic" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <p className="text-[var(--text-muted)] text-[10px] mt-4 text-center">
                Prices tracked automatically · Historical data may vary
            </p>
        </div>
    );
}
