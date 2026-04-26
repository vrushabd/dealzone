"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Tag, ShoppingCart, Bell, X, Check, TrendingDown, ArrowRight, Star } from "lucide-react";
import { useCart, CartProduct } from "@/components/cart/CartContext";


interface Product {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    image?: string | null;
    images?: string[] | null;
    price?: number | null;
    originalPrice?: number | null;
    discount?: number | null;
    amazonLink?: string | null;
    flipkartLink?: string | null;
    cashbackAmazon?: number | null;
    cashbackFlipkart?: number | null;
    cashbackPaytm?: number | null;
    cashbackPhonePe?: number | null;
    rating?: number | null;
    category?: { name: string; slug: string } | null;
    _count?: { orderItems: number } | null;
}

export default function ProductCard({ product }: { product: Product }) {
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertEmail, setAlertEmail] = useState("");
    const [targetPrice, setTargetPrice] = useState(product.price ? Math.floor(product.price * 0.9) : 0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);
    const { addToCart } = useCart();
    const { data: session } = useSession();
    const router = useRouter();

    const getBaseCount = (id: string) => {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        return (Math.abs(hash) % 401) + 100;
    };
    const totalBought = getBaseCount(product.id) + (product._count?.orderItems || 0);

    const canSetAlert = Boolean(product.price && product.price > 1);

    const handleAddToCart = async () => {
        if (!session) {
            router.push(`/login?callbackUrl=${encodeURIComponent(`/products/${product.slug}`)}`);
            return;
        }
        const cartProduct: CartProduct = {
            id: product.id,
            title: product.title,
            slug: product.slug,
            image: product.image,
            price: product.price,
            originalPrice: product.originalPrice,
        };
        await addToCart(cartProduct, 1);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const discountPct =
        product.discount ||
        (product.originalPrice && product.price
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : null);

    const savings = product.originalPrice && product.price
        ? product.originalPrice - product.price
        : null;

    const handleAlertSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/alerts/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: alertEmail, targetPrice, productId: product.id }),
            });
            if (res.ok) {
                setIsSuccess(true);
                setTimeout(() => { setIsAlertOpen(false); setIsSuccess(false); setAlertEmail(""); }, 2000);
            }
        } catch (err) {
            console.error("Failed to subscribe:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <article className="group/card relative flex flex-col h-full bg-[var(--bg-card)] border border-[var(--border)] rounded-md overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[hsl(214_89%_52%/0.30)] hover:shadow-[var(--shadow-elevated)]">

            {/* Image — portrait on mobile, landscape on desktop */}
            <div className="relative aspect-[4/5] sm:aspect-[5/4] bg-[var(--bg-card-hover)] overflow-hidden">
                <Link href={`/products/${product.slug}`} className="relative block w-full h-full">
                    {product.image ? (
                        <Image
                            src={product.image}
                            alt={product.title}
                            fill
                            className="object-contain p-2 group-hover/card:scale-[1.05] transition-transform duration-500 ease-out"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <ShoppingCart size={44} className="text-[var(--text-muted)]" />
                        </div>
                    )}
                    {/* Bottom gradient on image */}
                    <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[var(--bg-card)]/60 to-transparent pointer-events-none" />
                </Link>

                {/* Discount badge */}
                {discountPct && discountPct > 0 && (
                    <div className="absolute top-3 left-3 badge-discount shadow-[0_2px_12px_hsl(24_95%_53%/0.35)]">
                        -{discountPct}%
                    </div>
                )}

                {/* Bell */}
                {canSetAlert && (
                    <button
                        onClick={() => setIsAlertOpen(true)}
                        className="absolute top-3 right-3 inline-flex h-8 items-center justify-center gap-1 rounded-md bg-[var(--bg-base)]/92 px-2.5 border border-[var(--border)] text-[var(--text-secondary)] hover:text-[hsl(214_89%_52%)] hover:border-[hsl(214_89%_52%/0.40)] hover:bg-[hsl(214_89%_52%/0.08)] transition-all duration-200 shadow-[var(--shadow-card)] z-20"
                        title="Set Price Alert"
                    >
                        <Bell size={13} />
                        <span className="text-[10px] font-semibold">Notify</span>
                    </button>
                )}

                {/* Category chip */}
                {product.category && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-[var(--bg-base)]/85 backdrop-blur text-[var(--text-secondary)] text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[var(--border)] pointer-events-none z-20">
                        <Tag size={7} />
                        {product.category.name}
                    </div>
                )}

                {/* Multi-image indicator badge */}
                {product.images && product.images.length > 1 && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-[var(--brand)] text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-lg pointer-events-none z-20">
                        HD Gallery
                    </div>
                )}

                {/* Price Alert Overlay */}
                {isAlertOpen && (
                    <div className="absolute inset-0 glass-strong z-20 p-4 flex flex-col justify-center animate-scale-in rounded-none">
                        <button
                            onClick={() => setIsAlertOpen(false)}
                            className="absolute top-3 right-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            <X size={18} />
                        </button>

                        {isSuccess ? (
                            <div className="text-center">
                                <div className="w-12 h-12 bg-[hsl(142_72%_50%/0.15)] border border-[hsl(142_72%_50%/0.3)] rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Check className="text-[hsl(142_72%_50%)]" size={22} />
                                </div>
                                <h4 className="text-white font-bold mb-1">Alert Set!</h4>
                                <p className="text-[hsl(215_12%_42%)] text-xs">We&apos;ll notify you when it drops.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleAlertSubmit} className="space-y-2.5">
                                <div className="text-center mb-1">
                                    <div className="w-8 h-8 bg-[hsl(214_89%_52%/0.08)] rounded-md flex items-center justify-center mx-auto mb-2">
                                        <TrendingDown size={16} className="text-[hsl(214_89%_52%)]" />
                                    </div>
                                    <h4 className="text-[var(--text-primary)] font-bold text-sm">Price Drop Alert</h4>
                                    <p className="text-[var(--text-muted)] text-[10px] mt-0.5">Notify me when price falls to:</p>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs font-bold">₹</span>
                                    <input
                                        type="number"
                                        value={targetPrice}
                                        onChange={(e) => setTargetPrice(Number(e.target.value))}
                                        className="input-base pl-7 text-sm"
                                        required
                                    />
                                </div>
                                <input
                                    type="email"
                                    placeholder="Your email address"
                                    value={alertEmail}
                                    onChange={(e) => setAlertEmail(e.target.value)}
                                    className="input-base text-sm"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-gradient-to-r from-[hsl(214_89%_52%)] to-[hsl(214_89%_45%)] hover:from-[hsl(214_89%_55%)] hover:to-[hsl(214_89%_52%)] disabled:opacity-50 text-white font-bold py-2 rounded-md text-xs transition-all shine-on-hover"
                                >
                                    {isSubmitting ? "Setting..." : "Notify Me"}
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-2 sm:p-3 flex flex-col flex-1">
                <Link href={`/products/${product.slug}`}>
                    {/* Fixed 2-line height — keeps all cards uniform */}
                    <h2 className="font-semibold text-[var(--text-primary)] line-clamp-2 hover:text-[hsl(214_89%_52%)] transition-colors text-xs sm:text-sm leading-snug mb-3 h-[2.6em] overflow-hidden">
                        {product.title}
                    </h2>
                </Link>

                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] min-h-[20px]">
                    {typeof product.rating === "number" && product.rating > 1.5 ? (
                        <>
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-600">
                                <Star size={11} className="fill-current" />
                                {product.rating.toFixed(1)}
                            </span>
                            <span className="text-[var(--text-muted)]">/ 5 rating</span>
                        </>
                    ) : null}
                </div>
                <div className="mb-2">
                    <span className="inline-flex items-center gap-1 text-[11px] text-[hsl(24_95%_53%)] bg-[hsl(24_95%_53%/0.1)] px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        🔥 {totalBought}+ bought
                    </span>
                </div>

                {/* Pricing — fixed min-height so rows align */}
                <div className="flex flex-col gap-1 mb-3 min-h-[3.5rem]">
                    <div className="flex items-baseline gap-2">
                        {product.price && (
                            <span className="text-xl font-extrabold text-[hsl(214_89%_52%)] leading-none">
                                ₹{product.price.toLocaleString("en-IN")}
                            </span>
                        )}
                        {product.originalPrice && product.originalPrice !== product.price && (
                            <span className="text-xs text-[var(--text-muted)] line-through">
                                ₹{product.originalPrice.toLocaleString("en-IN")}
                            </span>
                        )}
                    </div>

                    {savings && savings > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-green-500 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-md">
                                Save ₹{savings.toLocaleString("en-IN")}
                            </span>
                        </div>
                    )}
                </div>

                {/* CTA — Add to Cart */}
                <div className="mt-auto">
                    {product.price && product.price > 0 ? (
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleAddToCart}
                                className={`flex items-center justify-center gap-2 w-full text-sm font-bold py-2 px-4 rounded-md transition-all duration-200 shine-on-hover ${
                                    addedToCart
                                        ? "bg-green-500 hover:bg-green-500 text-white"
                                        : "bg-[hsl(214_89%_52%)] hover:bg-[hsl(214_89%_45%)] text-white"
                                }`}
                            >
                                {addedToCart ? (
                                    <><Check size={13} /> Added!</>
                                ) : (
                                    <><ShoppingCart size={13} /> Add to Cart<ArrowRight size={13} className="ml-auto" /></>
                                )}
                            </button>

                            {canSetAlert && (
                                <button
                                    type="button"
                                    onClick={() => setIsAlertOpen(true)}
                                    className="flex items-center justify-center gap-2 w-full border border-[hsl(214_89%_52%/0.24)] bg-[hsl(214_89%_52%/0.06)] hover:bg-[hsl(214_89%_52%/0.12)] text-[hsl(214_89%_45%)] text-sm font-semibold py-2 px-4 rounded-md transition-all duration-200"
                                >
                                    <Bell size={13} />
                                    Notify Me
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <Link
                                href={`/products/${product.slug}`}
                                className="flex items-center justify-center gap-2 w-full bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-semibold py-2.5 px-4 rounded-md transition-all duration-200"
                            >
                                View Details
                            </Link>

                            {canSetAlert && (
                                <button
                                    type="button"
                                    onClick={() => setIsAlertOpen(true)}
                                    className="flex items-center justify-center gap-2 w-full border border-[hsl(214_89%_52%/0.24)] bg-[hsl(214_89%_52%/0.06)] hover:bg-[hsl(214_89%_52%/0.12)] text-[hsl(214_89%_45%)] text-sm font-semibold py-2.5 px-4 rounded-md transition-all duration-200"
                                >
                                    <Bell size={13} />
                                    Notify Me
                                </button>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </article>
    );
}
