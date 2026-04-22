"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, CheckCircle, AlertCircle, Loader2, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;
const STORAGE_KEY = "dealzone_last_sync_time";

function formatCountdown(ms: number): string {
    if (ms <= 0) return "syncing…";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

export default function SyncButton() {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [nextSyncIn, setNextSyncIn] = useState(0);

    const autoSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownRef  = useRef<ReturnType<typeof setInterval> | null>(null);

    const handleSync = useCallback(async (isAuto = false) => {
        setStatus("loading");
        setMessage(isAuto ? "Auto-syncing…" : "Starting sync…");
        try {
            const res  = await fetch("/api/admin/sync", { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                setStatus("success");
                setMessage(data.message || "Sync completed!");
                const now = new Date();
                setLastSync(now);
                localStorage.setItem(STORAGE_KEY, now.toISOString());
            } else {
                throw new Error(data.error || "Sync failed");
            }
        } catch (err: unknown) {
            setStatus("error");
            setMessage(err instanceof Error ? err.message : "Sync failed");
        } finally {
            setTimeout(() => { setStatus("idle"); setMessage(""); }, 5000);
        }
    }, []);

    const schedule = useCallback((from: Date) => {
        if (autoSyncTimer.current) clearTimeout(autoSyncTimer.current);
        if (countdownRef.current)  clearInterval(countdownRef.current);
        const tick = () => setNextSyncIn(Math.max(0, SYNC_INTERVAL_MS - (Date.now() - from.getTime())));
        tick();
        countdownRef.current  = setInterval(tick, 1000);
        const delay = Math.max(0, SYNC_INTERVAL_MS - (Date.now() - from.getTime()));
        autoSyncTimer.current = setTimeout(() => handleSync(true), delay);
    }, [handleSync]);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        const from   = stored ? new Date(stored) : new Date();
        if (!stored) localStorage.setItem(STORAGE_KEY, from.toISOString());
        setLastSync(from);
        schedule(from);
        return () => {
            if (autoSyncTimer.current) clearTimeout(autoSyncTimer.current);
            if (countdownRef.current)  clearInterval(countdownRef.current);
        };
    }, [schedule]);

    useEffect(() => { if (lastSync) schedule(lastSync); }, [lastSync, schedule]);

    const progress = lastSync
        ? Math.min(100, ((Date.now() - lastSync.getTime()) / SYNC_INTERVAL_MS) * 100)
        : 0;

    return (
        <div className="flex flex-col gap-2">
            {/* Force sync button */}
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
                     : status === "error"   ? <AlertCircle size={18} />
                     : <RefreshCw size={18} className="text-[var(--brand)]" />}
                </div>
                <div className="flex-1 text-left">
                    <div className="font-semibold text-[var(--text-primary)] text-sm">Force Price Sync</div>
                    <div className="text-xs text-[var(--text-secondary)]">Refresh all 100% real-time prices now</div>
                </div>
            </button>

            {/* Auto-sync timer */}
            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-md px-3 py-2 flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                        <Clock size={12} className="text-[var(--brand)]" />
                        Auto-sync every 6 hours
                    </span>
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
                    <div className="text-[10px] text-[var(--text-muted)]">
                        Last synced: {lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })},{" "}
                        {lastSync.toLocaleDateString()}
                    </div>
                )}
            </div>

            {/* Flash message */}
            {message && (
                <div className={`text-[10px] px-2 py-1 rounded border ${
                    status === "success" ? "bg-green-500/5 border-green-500/10 text-green-500"
                    : status === "error"  ? "bg-red-500/5  border-red-500/10  text-red-500"
                    : "bg-blue-500/5 border-blue-500/10 text-blue-500"
                }`}>
                    {message}
                </div>
            )}

            {/* Link to full sync page */}
            <Link
                href="/admin/sync"
                className="flex items-center justify-between gap-2 w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
                <span>View full sync history &amp; logs</span>
                <ArrowRight size={12} />
            </Link>
        </div>
    );
}
