"use client";
import { useState } from "react";
import { Star, Send, Loader2, CheckCircle2, AlertCircle, User } from "lucide-react";

interface Review {
    id: string;
    author: string | null;
    rating: number;
    title: string | null;
    comment: string;
    createdAt: string;
}

interface Props {
    productSlug: string;
    initialReviews: Review[];
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
                <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => onChange(n)}
                    className="transition-transform hover:scale-110"
                >
                    <Star
                        size={24}
                        className={`transition-colors ${n <= (hovered || value) ? "fill-amber-400 text-amber-400" : "text-[var(--border)] fill-transparent"}`}
                    />
                </button>
            ))}
        </div>
    );
}

export default function ProductReviewSection({ productSlug, initialReviews }: Props) {
    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    const [form, setForm] = useState({ author: "", rating: 0, title: "", comment: "" });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (form.rating === 0) { setError("Please select a star rating"); return; }
        if (!form.comment.trim()) { setError("Please write a comment"); return; }

        setLoading(true);
        try {
            const res = await fetch(`/api/products/${productSlug}/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Failed to submit"); return; }
            setReviews(prev => [{ ...data.review, createdAt: new Date().toISOString() }, ...prev]);
            setForm({ author: "", rating: 0, title: "", comment: "" });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 4000);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="mt-12">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
                Customer Reviews
                {reviews.length > 0 && (
                    <span className="ml-2 text-base font-normal text-[var(--text-muted)]">({reviews.length})</span>
                )}
            </h2>

            {/* Submit Form */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 mb-8">
                <h3 className="font-semibold text-[var(--text-primary)] mb-4">Write a Review</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                            Your Name <span className="text-[var(--text-muted)] font-normal">(optional)</span>
                        </label>
                        <div className="relative">
                            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                            <input
                                type="text"
                                value={form.author}
                                onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                                placeholder="Anonymous"
                                className="input-base pl-9 w-full"
                            />
                        </div>
                    </div>

                    {/* Rating */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                            Rating <span className="text-red-400">*</span>
                        </label>
                        <StarPicker value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                            Review Title <span className="text-[var(--text-muted)] font-normal">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="Summarise your experience"
                            className="input-base w-full"
                        />
                    </div>

                    {/* Comment */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                            Comment <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            value={form.comment}
                            onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                            placeholder="Share your experience with this product..."
                            rows={4}
                            className="input-base w-full resize-none"
                        />
                    </div>

                    {error && (
                        <p className="flex items-center gap-1.5 text-sm text-red-400">
                            <AlertCircle size={14} /> {error}
                        </p>
                    )}

                    <div className="flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 btn-primary px-5 py-2.5 text-sm font-bold disabled:opacity-60"
                        >
                            {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                            Submit Review
                        </button>
                        {success && (
                            <span className="flex items-center gap-1.5 text-sm text-green-500 font-semibold">
                                <CheckCircle2 size={15} /> Review posted!
                            </span>
                        )}
                    </div>
                </form>
            </div>

            {/* Reviews List */}
            {reviews.length === 0 ? (
                <div className="text-center py-12 text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
                    <Star size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No reviews yet — be the first!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reviews.map(review => (
                        <div key={review.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} size={14} className={`${i < Math.floor(review.rating) ? "fill-amber-400 text-amber-400" : "text-[var(--border)] fill-transparent"}`} />
                                    ))}
                                </div>
                                <span className="text-xs text-[var(--text-muted)]">
                                    {new Date(review.createdAt).toLocaleDateString("en-IN")}
                                </span>
                            </div>
                            {review.title && (
                                <h4 className="font-bold text-sm text-[var(--text-primary)] mb-1">{review.title}</h4>
                            )}
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-1 mb-4 italic">
                                &quot;{review.comment}&quot;
                            </p>
                            <div className="flex items-center gap-2 pt-3 border-t border-[var(--border)] mt-auto">
                                <div className="w-6 h-6 rounded-full bg-[var(--brand)] flex items-center justify-center text-white text-[10px] font-bold">
                                    {(review.author || "A")[0].toUpperCase()}
                                </div>
                                <span className="text-xs text-[var(--text-muted)] font-medium">
                                    {review.author || "Anonymous"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
