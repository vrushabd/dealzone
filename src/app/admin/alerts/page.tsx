"use client";
import { useState, useEffect, useCallback } from "react";
import { Bell, Trash2, CheckCircle, Clock, Mail, RefreshCw, XCircle } from "lucide-react";

interface AlertItem {
    id: string;
    email: string | null;
    targetPrice: number;
    isActive: boolean;
    emailSentAt: string | null;
    createdAt: string;
    product: {
        id: string;
        title: string;
        slug: string;
        price: number | null;
        image: string | null;
    };
}

type FilterStatus = "all" | "pending" | "sent";

export default function AdminAlertsPage() {
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterStatus>("all");
    const [deleting, setDeleting] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/alerts?status=${filter}`);
            const data = await res.json();
            setAlerts(data.alerts || []);
        } catch {
            setAlerts([]);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (id: string) => {
        if (!confirm("Remove this alert?")) return;
        setDeleting(id);
        try {
            await fetch("/api/admin/alerts", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            setAlerts((prev) => prev.filter((a) => a.id !== id));
        } finally {
            setDeleting(null);
        }
    };

    const pending = alerts.filter((a) => a.isActive).length;
    const sent = alerts.filter((a) => !a.isActive && a.emailSentAt).length;

    return (
        <div className="animate-fade-in-up">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <Bell size={22} className="text-[var(--brand)]" />
                        Price Alerts
                    </h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">
                        Manage all price drop alert subscriptions
                    </p>
                </div>
                <button
                    onClick={load}
                    className="flex items-center gap-2 px-4 py-2 rounded-md border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md p-4 text-center">
                    <div className="text-2xl font-extrabold text-[var(--text-primary)]">{alerts.length}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">Total Alerts</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/25 rounded-md p-4 text-center">
                    <div className="text-2xl font-extrabold text-amber-500">{pending}</div>
                    <div className="text-xs text-amber-500/80 mt-0.5">Pending</div>
                </div>
                <div className="bg-green-500/10 border border-green-500/25 rounded-md p-4 text-center">
                    <div className="text-2xl font-extrabold text-green-500">{sent}</div>
                    <div className="text-xs text-green-500/80 mt-0.5">Emails Sent</div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 mb-6 bg-[var(--bg-elevated)] p-1 rounded-md w-fit">
                {(["all", "pending", "sent"] as FilterStatus[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-4 py-1.5 rounded text-sm font-medium capitalize transition-all ${
                            filter === tab
                                ? "bg-[var(--brand)] text-white shadow-sm"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md overflow-hidden">
                {loading ? (
                    <div className="py-12 text-center text-[var(--text-muted)]">
                        <RefreshCw size={20} className="mx-auto mb-2 animate-spin" />
                        Loading alerts...
                    </div>
                ) : alerts.length === 0 ? (
                    <div className="py-16 text-center text-[var(--text-muted)]">
                        <Bell size={32} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No alerts found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Product</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">User Email</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Current Price</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Target Price</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Created</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Email Sent</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {alerts.map((alert) => {
                                    const isBelowTarget = alert.product.price !== null && alert.product.price <= alert.targetPrice;
                                    return (
                                        <tr key={alert.id} className="hover:bg-[var(--bg-base)]/50 transition-colors">
                                            {/* Product */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {alert.product.image ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={alert.product.image} alt="" className="w-9 h-9 rounded object-contain bg-[var(--bg-elevated)] border border-[var(--border)] p-0.5 flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                                                            <Bell size={14} className="text-[var(--text-muted)]" />
                                                        </div>
                                                    )}
                                                    <span className="font-medium text-[var(--text-primary)] line-clamp-1 max-w-[180px]">
                                                        {alert.product.title}
                                                    </span>
                                                </div>
                                            </td>
                                            {/* Email */}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                                                    <Mail size={13} className="text-[var(--text-muted)] flex-shrink-0" />
                                                    <span className="font-mono text-xs">{alert.email || "—"}</span>
                                                </div>
                                            </td>
                                            {/* Current price */}
                                            <td className="px-4 py-3 text-right">
                                                <span className={`font-semibold ${isBelowTarget ? "text-green-500" : "text-[var(--text-primary)]"}`}>
                                                    {alert.product.price !== null ? `₹${alert.product.price.toLocaleString("en-IN")}` : "—"}
                                                </span>
                                            </td>
                                            {/* Target price */}
                                            <td className="px-4 py-3 text-right">
                                                <span className="font-bold text-[var(--brand)]">
                                                    ₹{alert.targetPrice.toLocaleString("en-IN")}
                                                </span>
                                            </td>
                                            {/* Status */}
                                            <td className="px-4 py-3 text-center">
                                                {alert.emailSentAt ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-500/15 text-green-500 border border-green-500/25">
                                                        <CheckCircle size={11} /> Sent
                                                    </span>
                                                ) : alert.isActive ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/25">
                                                        <Clock size={11} /> Pending
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/25">
                                                        <XCircle size={11} /> Failed
                                                    </span>
                                                )}
                                            </td>
                                            {/* Created */}
                                            <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                                                {new Date(alert.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                            </td>
                                            {/* Email Sent */}
                                            <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                                                {alert.emailSentAt
                                                    ? new Date(alert.emailSentAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                                                    : "—"}
                                            </td>
                                            {/* Delete */}
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleDelete(alert.id)}
                                                    disabled={deleting === alert.id}
                                                    className="p-1.5 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                                                    title="Remove alert"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Email config warning */}
            <div className="mt-4 text-xs text-[var(--text-muted)] bg-amber-500/8 border border-amber-500/20 rounded-md px-4 py-3 flex items-start gap-2">
                <Bell size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <span>
                    Emails are sent via <strong className="text-amber-500">Resend</strong>. Make sure your{" "}
                    <strong>RESEND_API_KEY</strong> is set in Settings. Alerts fire automatically when you update a
                    product price (admin edit) or run Force Price Sync.
                </span>
            </div>
        </div>
    );
}
