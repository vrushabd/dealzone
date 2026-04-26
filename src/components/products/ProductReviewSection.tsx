"use client";
import { useState, useEffect } from "react";
import { Star, Send, Loader2, CheckCircle2, AlertCircle, User, Lock } from "lucide-react";
import { useSession } from "next-auth/react";

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
                        size={22}
                        className={`transition-colors ${n <= (hovered || value) ? "fill-amber-400 text-amber-400" : "text-[var(--border)] fill-transparent"}`}
                    />
                </button>
            ))}
        </div>
    );
}

export default function ProductReviewSection({ productSlug, initialReviews }: Props) {
    const { data: session, status } = useSession();
    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");
    const [canReview, setCanReview] = useState<boolean | null>(null);

    // Check if this logged-in user has a delivered order for this product
    useEffect(() => {
        if (status !== "authenticated") { setCanReview(false); return; }
        fetch(`/api/products/${productSlug}/can-review`)
            .then(r => r.json())
            .then(d => setCanReview(Boolean(d.canReview)))
            .catch(() => setCanReview(false));
    }, [productSlug, status]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (rating === 0) { setError("Please select a star rating"); return; }
        if (!comment.trim()) { setError("Please write a comment"); return; }

        setLoading(true);
        try {
            const res = await fetch(`/api/products/${productSlug}/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rating, comment }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Failed to submit"); return; }
            setReviews(prev => [{
                ...data.review,
                author: session?.user?.name || "Verified Buyer",
                createdAt: new Date().toISOString()
            }, ...prev]);
            setRating(0);
            setComment("");
            setSuccess(true);
            setCanReview(false);
            setTimeout(() => setSuccess(false), 4000);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
        : 0;

    return (
        <section className="mt-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Customer Reviews</h2>
                {reviews.length > 0 && (
                    <span className="flex items-center gap-1 text-amber-500 text-sm font-semibold">
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        {avgRating.toFixed(1)}
                        <span className="text-[var(--text-muted)] font-normal">({reviews.length})</span>
                    </span>
                )}
            </div>

            {/* Write Review Panel */}
            <div className="max-w-2xl mb-5">
                {/* Not logged in */}
                {status === "unauthenticated" && (
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-4 py-3">
                        <Lock size={14} />
                        <span>Log in to write a review (only verified buyers can review)</span>
                    </div>
                )}

                {/* Logged in but can't review */}
                {status === "authenticated" && canReview === false && !success && (
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-4 py-3">
                        <Lock size={14} />
                        <span>You can write a review once your order is delivered.</span>
                    </div>
                )}

                {/* Success */}
                {success && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
                        <CheckCircle2 size={15} />
                        <span className="font-semibold">Review posted! Thank you.</span>
                    </div>
                )}

                {/* Review form — only for eligible buyers */}
                {status === "authenticated" && canReview === true && (
                    <div className="bg-[var(--bg-card)] border border-[var(--brand)]/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-full bg-[var(--brand-glow)] border border-[var(--border)] flex items-center justify-center text-[var(--brand)]">
                                <User size={13} />
                            </div>
                            <span className="text-sm font-semibold text-[var(--text-primary)]">
                                {session?.user?.name || "Verified Buyer"}
                            </span>
                            <span className="text-[10px] bg-green-500/10 text-green-600 border border-green-500/20 rounded-full px-2 py-0.5 font-semibold">
                                ✓ Verified Purchase
                            </span>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            {/* Stars */}
                            <div className="flex items-center gap-3">
                                <StarPicker value={rating} onChange={setRating} />
                                {rating > 0 && (
                                    <span className="text-xs text-[var(--text-muted)]">
                                        {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
                                    </span>
                                )}
                            </div>

                            {/* Comment */}
                            <textarea
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                placeholder="Share your experience with this product..."
                                rows={2}
                                className="input-base w-full resize-none text-sm"
                            />

                            {error && (
                                <p className="flex items-center gap-1.5 text-xs text-red-400">
                                    <AlertCircle size={13} /> {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 btn-primary px-4 py-2 text-sm font-bold disabled:opacity-60"
                            >
                                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                Post Review
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Reviews List */}
            {reviews.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border)] rounded-xl max-w-2xl">
                    <Star size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No reviews yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-4xl">
                    {reviews.map(review => (
                        <div key={review.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3.5">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} size={12} className={i < Math.floor(review.rating) ? "fill-amber-400 text-amber-400" : "text-[var(--border)] fill-transparent"} />
                                    ))}
                                </div>
                                <span className="text-[11px] text-[var(--text-muted)]">
                                    {new Date(review.createdAt).toLocaleDateString("en-IN")}
                                </span>
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-2 italic">
                                &quot;{review.comment}&quot;
                            </p>
                            <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-[var(--brand-glow)] border border-[var(--border)] flex items-center justify-center text-[var(--brand)]">
                                    <User size={10} />
                                </div>
                                <span className="text-[11px] text-[var(--text-muted)] font-medium">{review.author || "Verified Buyer"}</span>
                                <span className="text-[9px] bg-green-500/10 text-green-600 rounded-full px-1.5 py-0.5 font-semibold">✓ Verified</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
