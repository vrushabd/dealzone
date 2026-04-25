"use client";

import { useState, useEffect, useCallback } from "react";
import {
    CheckCircle, AlertCircle, Loader2,
    Bot, User2, XCircle, Activity, RotateCcw, Info,
} from "lucide-react";

type SyncLog = {
    id: string;
    triggeredBy: string;
    status: string;
    total: number;
    updated: number;
    failed: number;
    alertsSent: number;
    durationMs: number | null;
    errorMessage: string | null;
    createdAt: string;
};

type FilterType = "all" | "success" | "error" | "manual";

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
        "  ·  " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatDuration(ms: number | null): string {
    if (!ms) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

export default function AdminSyncPage() {
    const [logs, setLogs] = useState<SyncLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>("all");

    // ── fetch history ──────────────────────────────────────────────
    const fetchLogs = useCallback(async () => {
        setLogsLoading(true);
        try {
            const res = await fetch("/api/admin/sync-logs");
            const data = await res.json();
            if (res.ok) setLogs(data.logs ?? []);
        } catch { /* silent */ } finally {
            setLogsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // ── derived ───────────────────────────────────────────────────
    const successCount = logs.filter(l => l.status === "success").length;
    const failedCount  = logs.filter(l => l.status === "error").length;
    const manualCount  = logs.filter(l => l.triggeredBy === "manual").length;

    const filtered = logs.filter(log => {
        if (filter === "success") return log.status === "success";
        if (filter === "error")   return log.status === "error";
        if (filter === "manual")  return log.triggeredBy === "manual";
        return true;
    });

    const FILTERS: { key: FilterType; label: string; count: number }[] = [
        { key: "all",     label: "All",     count: logs.length },
        { key: "success", label: "Success", count: successCount },
        { key: "error",   label: "Failed",  count: failedCount },
        { key: "manual",  label: "Manual",  count: manualCount },
    ];

    return (
        <div className="animate-fade-in-up max-w-4xl space-y-6">

            {/* ── Page Header ───────────────────────────────────────── */}
            <div className="mb-2">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Sync History</h1>
                <p className="text-[var(--text-secondary)] text-sm mt-1">
                    Review past product sync runs. Automatic 6-hour syncing and admin force sync are disabled.
                </p>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
                <Info size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                    Automatic GitHub cron sync has been turned off, and the admin force-sync controls have been removed.
                    Existing sync logs remain available below for reference.
                </div>
            </div>

            {/* ── Summary stats ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Total Syncs",  value: logs.length, color: "text-[var(--brand)]",    bg: "bg-[var(--brand-glow)]" },
                    { label: "Successful",   value: successCount, color: "text-green-500",          bg: "bg-green-500/10" },
                    { label: "Failed",       value: failedCount,  color: "text-red-500",            bg: "bg-red-500/10" },
                    { label: "Manual Runs",  value: manualCount,  color: "text-blue-500",           bg: "bg-blue-500/10" },
                ].map(({ label, value, color, bg }) => (
                    <div key={label} className={`${bg} border border-[var(--border)] rounded-xl p-4 flex flex-col gap-1`}>
                        <div className={`text-2xl font-black ${color}`}>{value}</div>
                        <div className="text-xs text-[var(--text-muted)] font-medium">{label}</div>
                    </div>
                ))}
            </div>

            {/* ── Sync History Card ─────────────────────────────────── */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-[var(--border)] border-l-4 border-l-purple-500">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Activity size={18} className="text-purple-500" />
                                <h2 className="text-lg font-bold text-[var(--text-primary)]">Sync History</h2>
                            </div>
                            <p className="text-sm text-[var(--text-secondary)]">
                                Complete log of recent sync events. Last 20 entries shown.
                            </p>
                        </div>
                        <button
                            onClick={fetchLogs}
                            disabled={logsLoading}
                            className="flex items-center gap-1.5 text-xs text-[var(--brand)] hover:underline disabled:opacity-40 flex-shrink-0"
                        >
                            <RotateCcw size={12} className={logsLoading ? "animate-spin" : ""} />
                            Refresh
                        </button>
                    </div>

                    {/* Filter tabs */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-4">
                        {FILTERS.map(({ key, label, count }) => (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-150 ${
                                    filter === key
                                        ? key === "error"
                                            ? "bg-red-500/15 border-red-500/40 text-red-500"
                                            : key === "success"
                                            ? "bg-green-500/15 border-green-500/40 text-green-500"
                                            : "bg-[var(--brand-glow)] border-[var(--brand-glow-strong)] text-[var(--brand)]"
                                        : "bg-transparent border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                                }`}
                            >
                                {label}
                                <span className="bg-[var(--bg-elevated)] text-[var(--text-muted)] px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                                    {count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Log table */}
                {logsLoading ? (
                    <div className="flex items-center justify-center py-16 gap-2 text-[var(--text-muted)]">
                        <Loader2 size={18} className="animate-spin" />
                        <span className="text-sm">Loading sync history…</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-[var(--text-muted)] text-sm italic">
                        {logs.length === 0
                            ? "No syncs have run yet."
                            : "No records match the selected filter."}
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--border)]">
                        {/* Table header */}
                        <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-2.5 bg-[var(--bg-elevated)] text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                            <span>Status</span>
                            <span>Triggered</span>
                            <span className="text-right">Products</span>
                            <span className="text-right">Updated</span>
                            <span className="text-right">Failed</span>
                            <span className="text-right">Duration</span>
                        </div>

                        {filtered.map((log) => {
                            const isSuccess = log.status === "success";
                            const isCron    = log.triggeredBy === "cron";

                            return (
                                <div
                                    key={log.id}
                                    className={`flex flex-col sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 sm:gap-4 items-start sm:items-center px-5 py-4 transition-colors ${
                                        !isSuccess ? "bg-red-500/[0.03] hover:bg-red-500/[0.06]" : "hover:bg-[var(--bg-elevated)]/60"
                                    }`}
                                >
                                    {/* Status icon */}
                                    <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                                        isSuccess ? "bg-green-500/15" : "bg-red-500/15"
                                    }`}>
                                        {isSuccess
                                            ? <CheckCircle size={14} className="text-green-500" />
                                            : <XCircle    size={14} className="text-red-500" />}
                                    </div>

                                    {/* Trigger + date */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {/* Source badge */}
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                                                isCron
                                                    ? "bg-purple-500/15 text-purple-500"
                                                    : "bg-blue-500/15 text-blue-500"
                                            }`}>
                                                {isCron ? <Bot size={9} /> : <User2 size={9} />}
                                                {isCron ? "Cron" : "Manual"}
                                            </span>
                                            {/* Status badge */}
                                            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                                                isSuccess ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                            }`}>
                                                {isSuccess ? "Success" : "Failed"}
                                            </span>
                                            {/* Alert count */}
                                            {log.alertsSent > 0 && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                                                    {log.alertsSent} alerts
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-[var(--text-muted)] mt-1">{formatDate(log.createdAt)}</div>
                                        {/* Error message if failed */}
                                        {log.errorMessage && (
                                            <div className="flex items-start gap-1 mt-1.5 bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
                                                <AlertCircle size={10} className="text-red-400 mt-0.5 flex-shrink-0" />
                                                <span className="text-[10px] text-red-400 break-all">{log.errorMessage}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Total */}
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-[var(--text-primary)]">{log.total}</div>
                                        <div className="text-[10px] text-[var(--text-muted)]">total</div>
                                    </div>

                                    {/* Updated */}
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-green-500">{log.updated}</div>
                                        <div className="text-[10px] text-[var(--text-muted)]">updated</div>
                                    </div>

                                    {/* Failed */}
                                    <div className="text-right">
                                        <div className={`text-sm font-bold ${log.failed > 0 ? "text-red-500" : "text-[var(--text-muted)]"}`}>
                                            {log.failed}
                                        </div>
                                        <div className="text-[10px] text-[var(--text-muted)]">failed</div>
                                    </div>

                                    {/* Duration */}
                                    <div className="text-right">
                                        <div className="text-sm font-mono text-[var(--text-secondary)]">{formatDuration(log.durationMs)}</div>
                                        <div className="text-[10px] text-[var(--text-muted)]">time</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {logs.length > 0 && (
                    <div className="bg-[var(--bg-elevated)] border-t border-[var(--border)] px-5 py-3 text-[11px] text-[var(--text-muted)]">
                        Showing last {filtered.length} of {logs.length} total sync events.
                    </div>
                )}
            </div>
        </div>
    );
}
