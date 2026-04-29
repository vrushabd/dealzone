"use client";
import { useEffect, useState } from "react";
import { MessageSquareWarning, Loader2, Trash2, CheckCircle, Clock, AlertCircle, RefreshCw } from "lucide-react";

interface Complaint {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: "open" | "in_review" | "resolved";
    createdAt: string;
}

const STATUS_CONFIG = {
    open: { label: "Open", color: "text-red-400 bg-red-500/10 border-red-500/20", icon: AlertCircle },
    in_review: { label: "In Review", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Clock },
    resolved: { label: "Resolved", color: "text-green-400 bg-green-500/10 border-green-500/20", icon: CheckCircle },
};

export default function AdminComplaintsPage() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "open" | "in_review" | "resolved">("all");

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/complaints");
            const data = await res.json();
            setComplaints(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchComplaints(); }, []);

    const updateStatus = async (id: string, status: string) => {
        await fetch("/api/admin/complaints", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status }),
        });
        setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: status as Complaint["status"] } : c));
    };

    const deleteComplaint = async (id: string) => {
        if (!confirm("Delete this complaint?")) return;
        await fetch("/api/admin/complaints", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        setComplaints(prev => prev.filter(c => c.id !== id));
    };

    const filtered = filter === "all" ? complaints : complaints.filter(c => c.status === filter);

    const counts = {
        all: complaints.length,
        open: complaints.filter(c => c.status === "open").length,
        in_review: complaints.filter(c => c.status === "in_review").length,
        resolved: complaints.filter(c => c.status === "resolved").length,
    };

    return (
        <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <MessageSquareWarning size={22} className="text-red-400" />
                        Complaint Zone
                    </h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">Manage user-submitted complaints</p>
                </div>
                <button
                    onClick={fetchComplaints}
                    className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-1.5 rounded-md transition-all"
                >
                    <RefreshCw size={13} />
                    Refresh
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {(["all", "open", "in_review", "resolved"] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                            filter === tab
                                ? "bg-[hsl(214_89%_52%)] border-[hsl(214_89%_52%)] text-white"
                                : "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        }`}
                    >
                        {tab === "all" ? "All" : tab === "in_review" ? "In Review" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        <span className="ml-1.5 opacity-70">{counts[tab]}</span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 text-[var(--text-muted)]">
                    <Loader2 size={22} className="animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-[var(--text-muted)]">
                    <MessageSquareWarning size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No complaints found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(c => {
                        const cfg = STATUS_CONFIG[c.status];
                        const Icon = cfg.icon;
                        return (
                            <div key={c.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 hover:border-[hsl(214_89%_52%/0.25)] transition-all">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-[var(--text-primary)] text-sm">{c.subject}</span>
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                                                <Icon size={10} />
                                                {cfg.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                            From <span className="font-medium text-[var(--text-secondary)]">{c.name}</span> &lt;{c.email}&gt; · {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => deleteComplaint(c.id)}
                                        className="text-[var(--text-muted)] hover:text-red-400 p-1.5 rounded-md hover:bg-red-500/10 transition-all flex-shrink-0"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4 bg-[var(--bg-elevated)] rounded-md px-3 py-2.5">
                                    {c.message}
                                </p>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-[var(--text-muted)] font-medium">Change status:</span>
                                    {(["open", "in_review", "resolved"] as const).map(s => (
                                        <button
                                            key={s}
                                            onClick={() => updateStatus(c.id, s)}
                                            disabled={c.status === s}
                                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all disabled:opacity-40 disabled:cursor-default ${STATUS_CONFIG[s].color}`}
                                        >
                                            {s === "in_review" ? "In Review" : s.charAt(0).toUpperCase() + s.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
