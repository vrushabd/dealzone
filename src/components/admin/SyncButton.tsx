"use client";
import { useState } from "react";
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function SyncButton() {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSync = async () => {
        setStatus("loading");
        setMessage("Starting background sync...");
        try {
            const res = await fetch("/api/admin/sync", { method: "POST" });
            const data = await res.json();
            
            if (res.ok) {
                setStatus("success");
                setMessage(data.message || "Sync completed successfully!");
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
    };

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={handleSync}
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
                    status === "success" ? "bg-green-500/20" : 
                    status === "error" ? "bg-red-500/20" : 
                    "bg-[var(--brand-glow)] group-hover:bg-[var(--brand)]/20"
                }`}>
                    {status === "loading" ? <Loader2 size={18} className="animate-spin text-[var(--brand)]" /> : 
                     status === "success" ? <CheckCircle size={18} /> : 
                     status === "error" ? <AlertCircle size={18} /> : 
                     <RefreshCw size={18} className="text-[var(--brand)]" />}
                </div>
                <div className="flex-1 text-left">
                    <div className="font-semibold text-[var(--text-primary)] text-sm">Force Price Sync</div>
                    <div className="text-xs text-[var(--text-secondary)]">Refresh all 100% real-time prices now</div>
                </div>
            </button>
            
            {message && (
                <div className={`text-[10px] px-2 py-1 rounded border animate-fade-in ${
                    status === "success" ? "bg-green-500/5 border-green-500/10 text-green-500" :
                    status === "error" ? "bg-red-500/5 border-red-500/10 text-red-500" :
                    "bg-blue-500/5 border-blue-500/10 text-blue-500"
                }`}>
                    {message}
                </div>
            )}
        </div>
    );
}
