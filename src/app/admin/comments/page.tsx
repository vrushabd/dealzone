"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageSquare, Star, Trash2, Search, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

interface Review {
    id: string;
    rating: number;
    title?: string | null;
    comment: string;
    author?: string | null;
    createdAt: string;
    product: {
        id: string;
        title: string;
        slug: string;
        image?: string | null;
    };
}

export default function AdminCommentsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [filtered, setFiltered] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [ratingFilter, setRatingFilter] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/comments");
            const data = await res.json();
            setReviews(data.reviews || []);
        } catch {
            setReviews([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    useEffect(() => {
        let result = reviews;
        if (ratingFilter !== null) {
            result = result.filter(r => r.rating === ratingFilter);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(r =>
                r.comment.toLowerCase().includes(q) ||
                r.author?.toLowerCase().includes(q) ||
                r.product.title.toLowerCase().includes(q)
            );
        }
        setFiltered(result);
    }, [reviews, search, ratingFilter]);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this comment?")) return;
        setDeletingId(id);
        try {
            await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });
            setReviews(prev => prev.filter(r => r.id !== id));
        } finally {
            setDeletingId(null);
        }
    };

    const starColor = (r: number) =>
        r >= 4 ? "text-yellow-400" : r === 3 ? "text-orange-400" : "text-red-400";

    const ratingCounts = [5, 4, 3, 2, 1].map(n => ({
        n,
        count: reviews.filter(r => r.rating === n).length,
    }));

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                        <MessageSquare size={22} className="text-[hsl(214_89%_52%)]" />
                        Product Comments
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        {reviews.length} total review{reviews.length !== 1 ? "s" : ""} across all products
                    </p>
                </div>
                <button
                    onClick={fetchReviews}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by product, author, or comment..."
                        className="input-base !pl-9 w-full text-sm"
                    />
                </div>
                <div className="flex gap-1.5">
                    <button
                        onClick={() => setRatingFilter(null)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${ratingFilter === null ? "bg-[hsl(214_89%_52%)] text-white border-transparent" : "bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                    >
                        All
                    </button>
                    {ratingCounts.map(({ n, count }) => (
                        <button
                            key={n}
                            onClick={() => setRatingFilter(ratingFilter === n ? null : n)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${ratingFilter === n ? "bg-[hsl(214_89%_52%)] text-white border-transparent" : "bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                        >
                            <Star size={10} fill="currentColor" />
                            {n} <span className="opacity-70">({count})</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Reviews list */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <RefreshCw size={24} className="animate-spin text-[var(--text-muted)]" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-[var(--border)] rounded-xl">
                    <MessageSquare size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
                    <p className="text-[var(--text-muted)] text-sm font-medium">No comments found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(review => {
                        const expanded = expandedId === review.id;
                        return (
                            <div
                                key={review.id}
                                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 transition-all hover:shadow-[var(--shadow-elevated)]"
                            >
                                {/* Product info row */}
                                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[var(--border-subtle)]">
                                    {review.product.image && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={review.product.image}
                                            alt={review.product.title}
                                            className="w-10 h-10 rounded-lg object-contain bg-[var(--bg-surface)] border border-[var(--border)] flex-shrink-0"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <a
                                            href={`/products/${review.product.slug}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm font-semibold text-[hsl(214_89%_55%)] hover:underline truncate block"
                                        >
                                            {review.product.title}
                                        </a>
                                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                            {new Date(review.createdAt).toLocaleDateString("en-IN", {
                                                day: "numeric", month: "short", year: "numeric"
                                            })}
                                        </p>
                                    </div>
                                    {/* Rating */}
                                    <div className={`flex items-center gap-1 font-bold text-sm ${starColor(review.rating)}`}>
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={13}
                                                fill={i < review.rating ? "currentColor" : "none"}
                                                strokeWidth={i < review.rating ? 0 : 1.5}
                                            />
                                        ))}
                                        <span className="ml-1">{review.rating}/5</span>
                                    </div>
                                    {/* Delete */}
                                    <button
                                        onClick={() => handleDelete(review.id)}
                                        disabled={deletingId === review.id}
                                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                                    >
                                        {deletingId === review.id
                                            ? <RefreshCw size={14} className="animate-spin" />
                                            : <Trash2 size={14} />}
                                    </button>
                                </div>

                                {/* Author + comment */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                                            {review.author || "Anonymous"}
                                        </span>
                                        {review.title && (
                                            <span className="text-xs italic text-[var(--text-muted)]">"{review.title}"</span>
                                        )}
                                    </div>
                                    <p className={`text-sm text-[var(--text-secondary)] leading-relaxed ${!expanded && review.comment.length > 180 ? "line-clamp-2" : ""}`}>
                                        {review.comment}
                                    </p>
                                    {review.comment.length > 180 && (
                                        <button
                                            onClick={() => setExpandedId(expanded ? null : review.id)}
                                            className="flex items-center gap-1 text-xs text-[hsl(214_89%_55%)] mt-1.5 hover:underline"
                                        >
                                            {expanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Read more</>}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
