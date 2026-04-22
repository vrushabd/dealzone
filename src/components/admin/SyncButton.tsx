"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
    RefreshCw, CheckCircle, AlertCircle, Loader2,
    Clock, History, ChevronDown, ChevronUp, Bot, User2, XCircle,
} from "lucide-react";

const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const STORAGE_KEY = "dealzone_last_sync_time";

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

function formatCountdown(ms: number): string {
    if (ms <= 0) return "syncing…";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
        ", " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(ms: number | null): string {
    if (!ms) return "";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

export default function SyncButton() {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [nextSyncIn, setNextSyncIn] = useState<number>(0);
    const [showHistory, setShowHistory] = useState(false);
    const [logs, setLogs] = useState<SyncLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);

    const autoSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchLogs = useCallback(async () => {
        setLogsLoading(true);
        try {
            const res = await fetch("/api/admin/sync-logs");
            const data = await res.json();
            if (res.ok) setLogs(data.logs ?? []);
        } catch {
            // silently fail
        } finally {
            setLogsLoading(false);
        }
    }, []);

    const handleSync = useCallback(async (isAuto = false) => {
        setStatus("loading");
        setMessage(isAuto ? "Auto-syncing prices…" : "Starting background sync…");
        try {
            const res = await fetch("/api/admin/sync", { method: "POST" });
            const data = await res.json();

            if (res.ok) {
                setStatus("success");
                setMessage(data.message || `Sync completed${isAuto ? " (auto)" : ""}!`);
                const now = new Date();
                setLastSync(now);
                localStorage.setItem(STORAGE_KEY, now.toISOString());
                // Refresh history panel if open
                if (showHistory) fetchLogs();
            } else {
                throw new Error(data.error || "Sync failed");
            }
        } catch (error: unknown) {
            setStatus("error");
            setMessage(error instanceof Error ? error.message : "Sync failed");
        } finally {
            setTimeout(() => {
                setStatus("idle");
                setMessage("");
            }, 5000);
        }
    }, [showHistory, fetchLogs]);

    const scheduleAutoSync = useCallback((from: Date) => {
        if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current);
        const elapsed = Date.now() - from.getTime();
        const delay = Math.max(0, SYNC_INTERVAL_MS - elapsed);
        autoSyncTimerRef.current = setTimeout(() => handleSync(true), delay);
    }, [handleSync]);

    const startCountdown = useCallback((from: Date) => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        const tick = () => {
            const remaining = Math.max(0, SYNC_INTERVAL_MS - (Date.now() - from.getTime()));
            setNextSyncIn(remaining);
        };
        tick();
        countdownRef.current = setInterval(tick, 1000);
    }, []);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        const from = stored ? new Date(stored) : new Date();
        if (!stored) localStorage.setItem(STORAGE_KEY, from.toISOString());
        setLastSync(from);
        scheduleAutoSync(from);
        startCountdown(from);
        return () => {
            if (autoSyncTimerRef.current) clearTimeout(autoSyncTimerRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [scheduleAutoSync, startCountdown]);

    useEffect(() => {
        if (lastSync) {
            scheduleAutoSync(lastSync);
            startCountdown(lastSync);
        }
    }, [lastSync, scheduleAutoSync, startCountdown]);

    const progress = lastSync
        ? Math.min(100, ((Date.now() - lastSync.getTime()) / SYNC_INTERVAL_MS) * 100)
        : 0;

    const toggleHistory = () => {
        const next = !showHistory;
        setShowHistory(next);
        if (next && logs.length === 0) fetchLogs();
    };

    return (
        <div className="flex flex-col gap-2">
            {/* ── Sync button ── */}
            <button
                onClick={() => handleSync(false)}
                disabled={status === "loading"}
                className={`flex items-center gap-3 w-full p-5 rounded-md border transition-all duration-200 group ${
                    status === "loading"
                        ? "bg-[var(--bg-elevated)] border-[var(--border)] opacity-60"
                        : status === "success"
                        ? "bg-green-500/10 border-green-500/30 text-green-500"
                        : status === "error"
                        ? "bg-red-500/10 border-red-500/30 text-red-500"
                        : "bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--brand-glow-strong)] hover:bg-[var(--bg-card-hover)]"
                }`}
            >
                <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                    status === "success" ? "bg-green-500/20"
                    : status === "error" ? "bg-red-500/20"
                    : "bg-[var(--brand-glow)] group-hover:bg-[var(--brand)]/20"
                }`}>
                    {status === "loading" ? <Loader2 size={18} className="animate-spin text-[var(--brand)]" />
                     : status === "success" ? <CheckCircle size={18} />
                     : status === "error" ? <AlertCircle size={18} />
                     : <RefreshCw size={18} className="text-[var(--brand)]" />}
                </div>
                <div className="flex-1 text-left">
                    <div className="font-semibold text-[var(--text-primary)] text-sm">Force Price Sync</div>
                    <div className="text-xs text-[var(--text-secondary)]">Refresh all 100% real-time prices now</div>
                </div>
            </button>

            {/* ── Auto-sync timer strip ── */}
            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-md px-3 py-2 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                        <Clock size={12} className="text-[var(--brand)]" />
                        <span>Auto-sync every 6 hours</span>
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-[var(--brand)]">
                        Next in {formatCountdown(nextSyncIn)}
                    </span>
                </div>
                <div className="h-1 w-full bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[var(--brand)] rounded-full transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                {lastSync && (
                    <div className="text-[10px] text-[var(--text-secondary)]">
                        Last synced: {lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })},{" "}
                        {lastSync.toLocaleDateString()}
                    </div>
                )}
            </div>

            {/* ── Flash message ── */}
            {message && (
                <div className={`text-[10px] px-2 py-1 rounded border animate-fade-in ${
                    status === "success" ? "bg-green-500/5 border-green-500/10 text-green-500"
                    : status === "error" ? "bg-red-500/5 border-red-500/10 text-red-500"
                    : "bg-blue-500/5 border-blue-500/10 text-blue-500"
                }`}>
                    {message}
                </div>
            )}

            {/* ── History toggle button ── */}
            <button
                onClick={toggleHistory}
                className="flex items-center justify-between gap-2 w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
                <div className="flex items-center gap-1.5 text-xs font-medium">
                    <History size={13} />
                    Sync History
                </div>
                {showHistory ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {/* ── History panel ── */}
            {showHistory && (
                <div className="border border-[var(--border)] rounded-md overflow-hidden bg-[var(--bg-card)]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Recent Syncs</span>
                        <button
                            onClick={fetchLogs}
                            disabled={logsLoading}
                            className="text-[10px] text-[var(--brand)] hover:underline disabled:opacity-40"
                        >
                            {logsLoading ? "Loading…" : "Refresh"}
                        </button>
                    </div>

                    {logsLoading && logs.length === 0 ? (
                        <div className="flex items-center justify-center py-6 gap-2 text-[var(--text-muted)] text-xs">
                            <Loader2 size={14} className="animate-spin" />
                            Loading history…
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="py-6 text-center text-[var(--text-muted)] text-xs italic">
                            No sync history yet. Run a sync to start tracking.
                        </div>
                    ) : (
                        <div className="divide-y divide-[var(--border)] max-h-72 overflow-y-auto">
                            {logs.map((log) => {
                                const isSuccess = log.status === "success";
                                const isCron = log.triggeredBy === "cron";
                                return (
                                    <div key={log.id} className="flex items-start gap-3 px-3 py-2.5 hover:bg-[var(--bg-elevated)]/60 transition-colors">
                                        {/* Status icon */}
                                        <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                            isSuccess ? "bg-green-500/15" : "bg-red-500/15"
                                        }`}>
                                            {isSuccess
                                                ? <CheckCircle size={12} className="text-green-500" />
                                                : <XCircle size={12} className="text-red-500" />
                                            }
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {/* Trigger badge */}
                                                <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                                                    isCron
                                                        ? "bg-purple-500/10 text-purple-500"
                                                        : "bg-blue-500/10 text-blue-500"
                                                }`}>
                                                    {isCron ? <Bot size={9} /> : <User2 size={9} />}
                                                    {isCron ? "Cron" : "Manual"}
                                                </span>
                                                {/* Status badge */}
                                                <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                                                    isSuccess
                                                        ? "bg-green-500/10 text-green-500"
                                                        : "bg-red-500/10 text-red-500"
                                                }`}>
                                                    {isSuccess ? "Success" : "Failed"}
                                                </span>
                                                {/* Duration */}
                                                {log.durationMs && (
                                                    <span className="text-[9px] text-[var(--text-muted)]">
                                                        {formatDuration(log.durationMs)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Counts */}
                                            <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                                                {log.total} products &bull; {" "}
                                                <span className="text-green-500 font-medium">{log.updated} updated</span>
                                                {log.failed > 0 && (
                                                    <> &bull; <span className="text-red-500 font-medium">{log.failed} failed</span></>
                                                )}
                                                {log.alertsSent > 0 && (
                                                    <> &bull; <span className="text-[var(--brand)] font-medium">{log.alertsSent} alerts</span></>
                                                )}
                                            </div>

                                            {/* Error message */}
                                            {log.errorMessage && (
                                                <div className="text-[9px] text-red-400 mt-0.5 truncate">
                                                    {log.errorMessage}
                                                </div>
                                            )}

                                            {/* Date */}
                                            <div className="text-[9px] text-[var(--text-muted)] mt-0.5">
                                                {formatDate(log.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
