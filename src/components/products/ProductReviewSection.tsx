"use client";
import { useState, useEffect } from "react";
import { Star, Send, Loader2, CheckCircle2, AlertCircle, User, Lock, Quote } from "lucide-react";
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
    overallRating?: number | null;
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

export default function ProductReviewSection({ productSlug, initialReviews, overallRating }: Props) {
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

    const calculatedAvg = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
        : 0;
        
    const displayRating = overallRating || calculatedAvg;

    return (
        <section className="mt-16 pt-10 border-t border-[var(--border)]">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">Customer Reviews</h2>
                    <p className="text-[var(--text-secondary)] mt-1 text-sm">Real feedback and ratings from verified buyers</p>
                </div>
                {displayRating > 0 && (
                    <div className="flex flex-col sm:items-end">
                        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 px-4 py-2 rounded-full">
                            <Star size={18} className="fill-amber-500 text-amber-500" />
                            <span className="text-amber-600 font-bold text-base">{displayRating.toFixed(1)} <span className="text-amber-600/70 font-medium text-sm">/ 5</span></span>
                        </div>
                        {overallRating ? <span className="text-xs text-[var(--text-muted)] mt-1.5 px-2">Overall Rating</span> : null}
                    </div>
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
                <div className="flex flex-col items-center justify-center py-12 px-4 text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl max-w-3xl">
                    <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-4">
                        <Star size={28} className="text-[var(--border)]" />
                    </div>
                    <p className="text-base font-semibold text-[var(--text-primary)] mb-1">No reviews yet</p>
                    <p className="text-sm">Be the first to share your experience with this product.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-full">
                    {reviews.map(review => (
                        <div key={review.id} className="relative bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 hover:shadow-lg hover:border-[var(--brand)]/30 transition-all duration-300 group flex flex-col h-full">
                            <Quote size={24} className="absolute top-4 right-4 text-[var(--border)] opacity-50 group-hover:text-[var(--brand)]/20 transition-colors" />
                            
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} size={14} className={i < Math.floor(review.rating) ? "fill-amber-400 text-amber-400" : "text-[var(--bg-elevated)] fill-transparent"} />
                                    ))}
                                </div>
                                <span className="text-xs text-[var(--text-muted)] font-medium">
                                    {new Date(review.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                                </span>
                            </div>
                            
                            {review.title && (
                                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-2 line-clamp-1">{review.title}</h4>
                            )}
                            
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6 flex-1">
                                &quot;{review.comment}&quot;
                            </p>
                            
                            <div className="flex items-center gap-2 mt-auto pt-4 border-t border-[var(--border)]/50">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--brand)] to-[hsl(214_89%_40%)] flex items-center justify-center text-white shadow-sm">
                                    <User size={12} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-[var(--text-primary)] font-semibold line-clamp-1">{review.author || "Verified Buyer"}</span>
                                    <span className="text-[10px] text-green-500 font-medium flex items-center gap-0.5">
                                        <CheckCircle2 size={10} /> Verified Purchase
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
