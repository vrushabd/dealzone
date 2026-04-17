"use client";

import { useState } from "react";
import { Trash2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function PurgeSeedButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handlePurge = async () => {
    if (!confirm("Delete seeded (dummy) products/posts/coupons? This cannot be undone.")) return;

    setStatus("loading");
    setMessage("Deleting seeded data...");
    try {
      const res = await fetch("/api/admin/purge-seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete seeded data");

      setStatus("success");
      setMessage(
        `Deleted ${data?.deleted?.products ?? 0} products, ${data?.deleted?.posts ?? 0} posts, ${data?.deleted?.coupons ?? 0} coupons.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete seeded data";
      setStatus("error");
      setMessage(msg);
    } finally {
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 7000);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handlePurge}
        disabled={status === "loading"}
        className={`flex items-center gap-3 w-full p-5 rounded-md border transition-all duration-200 group ${
          status === "loading"
            ? "bg-[var(--bg-elevated)] border-[var(--border)] opacity-60"
            : status === "success"
            ? "bg-green-500/10 border-green-500/30 text-green-500"
            : status === "error"
            ? "bg-red-500/10 border-red-500/30 text-red-500"
            : "bg-[var(--bg-card)] border-[var(--border)] hover:border-red-500/30 hover:bg-[var(--bg-card-hover)]"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
            status === "success"
              ? "bg-green-500/20"
              : status === "error"
              ? "bg-red-500/20"
              : "bg-red-500/10 group-hover:bg-red-500/15"
          }`}
        >
          {status === "loading" ? (
            <Loader2 size={18} className="animate-spin text-red-500" />
          ) : status === "success" ? (
            <CheckCircle size={18} />
          ) : status === "error" ? (
            <AlertCircle size={18} />
          ) : (
            <Trash2 size={18} className="text-red-500" />
          )}
        </div>

        <div className="flex-1 text-left">
          <div className="font-semibold text-[var(--text-primary)] text-sm">Delete Seeded Data</div>
          <div className="text-xs text-[var(--text-secondary)]">Remove demo products/posts/coupons from DB</div>
        </div>
      </button>

      {message && (
        <div
          className={`text-[10px] px-2 py-1 rounded border animate-fade-in ${
            status === "success"
              ? "bg-green-500/5 border-green-500/10 text-green-500"
              : status === "error"
              ? "bg-red-500/5 border-red-500/10 text-red-500"
              : "bg-blue-500/5 border-blue-500/10 text-blue-500"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}

