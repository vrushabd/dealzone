"use client";
import { useState } from "react";
import { MessageSquareWarning, X, Send, Loader2, CheckCircle } from "lucide-react";

export default function ComplaintButton() {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/complaints", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to submit");
            setSuccess(true);
            setTimeout(() => {
                setOpen(false);
                setSuccess(false);
                setForm({ name: "", email: "", subject: "", message: "" });
            }, 2500);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                title="Report a complaint"
            >
                <MessageSquareWarning size={15} />
                <span>Complaint</span>
            </button>

            {/* Modal */}
            {open && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />

                    {/* Panel */}
                    <div className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-red-500/5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-red-500/10 rounded-md flex items-center justify-center">
                                    <MessageSquareWarning size={16} className="text-red-400" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-[var(--text-primary)]">Complaint Zone</h2>
                                    <p className="text-[11px] text-[var(--text-muted)]">We take every complaint seriously</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-md hover:bg-[var(--bg-elevated)] transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-6">
                            {success ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                                    <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                        <CheckCircle size={28} className="text-green-500" />
                                    </div>
                                    <p className="font-bold text-[var(--text-primary)]">Complaint Submitted!</p>
                                    <p className="text-sm text-[var(--text-muted)]">Our team will review and get back to you.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {error && (
                                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-md">
                                            {error}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Name *</label>
                                            <input
                                                type="text"
                                                value={form.name}
                                                onChange={e => set("name", e.target.value)}
                                                placeholder="Your name"
                                                required
                                                className="input-base w-full text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Email *</label>
                                            <input
                                                type="email"
                                                value={form.email}
                                                onChange={e => set("email", e.target.value)}
                                                placeholder="you@email.com"
                                                required
                                                className="input-base w-full text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Subject *</label>
                                        <input
                                            type="text"
                                            value={form.subject}
                                            onChange={e => set("subject", e.target.value)}
                                            placeholder="e.g. Wrong product delivered"
                                            required
                                            className="input-base w-full text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Message *</label>
                                        <textarea
                                            value={form.message}
                                            onChange={e => set("message", e.target.value)}
                                            placeholder="Describe your complaint in detail..."
                                            required
                                            rows={4}
                                            className="input-base w-full text-sm resize-none"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-md text-sm transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? <><Loader2 size={15} className="animate-spin" />Submitting...</> : <><Send size={15} />Submit Complaint</>}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
