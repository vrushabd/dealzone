"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Tag, ShoppingCart, Zap, Bell, X, Check, TrendingDown, ChevronDown } from "lucide-react";

interface Product {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    image?: string | null;
    price?: number | null;
    originalPrice?: number | null;
    discount?: number | null;
    amazonLink?: string | null;
    flipkartLink?: string | null;
    cashbackAmazon?: number | null;
    cashbackFlipkart?: number | null;
    cashbackPaytm?: number | null;
    cashbackPhonePe?: number | null;
    category?: { name: string; slug: string } | null;
}

export default function ProductCard({ product }: { product: Product }) {
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [isBuyOpen, setIsBuyOpen] = useState(false);
    const [alertEmail, setAlertEmail] = useState("");
    const [targetPrice, setTargetPrice] = useState(product.price ? Math.floor(product.price * 0.9) : 0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const hasBuyLinks = !!(product.amazonLink || product.flipkartLink);
    const platformCount = [product.amazonLink, product.flipkartLink].filter(Boolean).length;

    const discountPct =
        product.discount ||
        (product.originalPrice && product.price
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : null);

    const savings = product.originalPrice && product.price
        ? product.originalPrice - product.price
        : null;

    const cashbacks = [
        { name: "Amazon",   value: product.cashbackAmazon },
        { name: "Flipkart", value: product.cashbackFlipkart },
        { name: "Paytm",    value: product.cashbackPaytm },
        { name: "PhonePe",  value: product.cashbackPhonePe },
    ].filter((c) => c.value && c.value > 0);

    const highestCashback = cashbacks.length > 0
        ? cashbacks.reduce((prev, cur) => (cur.value! > prev.value! ? cur : prev))
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
        <article className="group/card relative flex flex-col bg-[hsl(224_28%_9%)] border border-[hsl(224_20%_14%)] rounded-2xl overflow-hidden transition-all duration-350 hover:-translate-y-1.5 hover:border-[hsl(24_75%_53%/0.3)] hover:shadow-[0_0_0_1px_hsl(24_75%_53%/0.15),0_12px_48px_hsl(224_44%_0%/0.55),0_0_32px_hsl(24_95%_53%/0.08)]">

            {/* Image */}
            <div className="relative aspect-square bg-[hsl(224_25%_11%)] overflow-hidden">
                <Link href={`/products/${product.slug}`} className="block w-full h-full">
                    {product.image ? (
                        <Image
                            src={product.image}
                            alt={product.title}
                            fill
                            className="object-contain p-1 sm:p-2 group-hover/card:scale-[1.06] transition-transform duration-400 ease-out"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <ShoppingCart size={44} className="text-[hsl(224_20%_20%)]" />
                        </div>
                    )}
                    {/* Bottom gradient on image */}
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[hsl(224_28%_9%/0.6)] to-transparent pointer-events-none" />
                </Link>

                {/* Discount badge */}
                {discountPct && discountPct > 0 && (
                    <div className="absolute top-3 left-3 badge-discount shadow-[0_2px_12px_hsl(24_95%_53%/0.35)]">
                        -{discountPct}%
                    </div>
                )}

                {/* Bell */}
                <button
                    onClick={() => setIsAlertOpen(true)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[hsl(224_28%_9%/0.9)] backdrop-blur border border-[hsl(224_20%_20%)] text-[hsl(215_18%_65%)] hover:text-orange-400 hover:border-orange-500/40 hover:bg-orange-500/10 flex items-center justify-center transition-all duration-200 shadow-lg opacity-0 group-hover/card:opacity-100"
                    title="Set Price Alert"
                >
                    <Bell size={13} />
                </button>

                {/* Category chip */}
                {product.category && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-[hsl(224_28%_9%/0.85)] backdrop-blur text-[hsl(215_15%_55%)] text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[hsl(224_20%_18%)] pointer-events-none">
                        <Tag size={7} />
                        {product.category.name}
                    </div>
                )}

                {/* Price Alert Overlay */}
                {isAlertOpen && (
                    <div className="absolute inset-0 glass-strong z-20 p-4 flex flex-col justify-center animate-scale-in rounded-none">
                        <button
                            onClick={() => setIsAlertOpen(false)}
                            className="absolute top-3 right-3 text-[hsl(215_12%_42%)] hover:text-white transition-colors"
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
                                    <div className="w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <TrendingDown size={16} className="text-orange-400" />
                                    </div>
                                    <h4 className="text-white font-bold text-sm">Price Drop Alert</h4>
                                    <p className="text-[hsl(215_12%_42%)] text-[10px] mt-0.5">Notify me when price falls to:</p>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(215_12%_42%)] text-xs font-bold">₹</span>
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
                                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-xs transition-all shine-on-hover"
                                >
                                    {isSubmitting ? "Setting..." : "Notify Me"}
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-3 sm:p-4 flex flex-col flex-1">
                <Link href={`/products/${product.slug}`}>
                    {/* Fixed 2-line height — keeps all cards uniform */}
                    <h2 className="font-semibold text-[hsl(210_30%_92%)] line-clamp-2 hover:text-orange-400 transition-colors text-xs sm:text-sm leading-snug mb-3 h-[2.6em] overflow-hidden">
                        {product.title}
                    </h2>
                </Link>

                {/* Pricing — fixed min-height so rows align */}
                <div className="flex flex-col gap-1 mb-3 min-h-[3.5rem]">
                    <div className="flex items-baseline gap-2">
                        {product.price && (
                            <span className="text-xl font-extrabold text-orange-400 leading-none">
                                ₹{product.price.toLocaleString("en-IN")}
                            </span>
                        )}
                        {product.originalPrice && product.originalPrice !== product.price && (
                            <span className="text-xs text-[hsl(215_12%_42%)] line-through">
                                ₹{product.originalPrice.toLocaleString("en-IN")}
                            </span>
                        )}
                    </div>

                    {savings && savings > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-[hsl(142_72%_50%)] bg-[hsl(142_72%_50%/0.1)] border border-[hsl(142_72%_50%/0.2)] px-1.5 py-0.5 rounded-md">
                                Save ₹{savings.toLocaleString("en-IN")}
                            </span>
                        </div>
                    )}

                    {highestCashback && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[hsl(142_72%_50%)] uppercase tracking-tight bg-[hsl(142_72%_50%/0.08)] w-fit px-2 py-0.5 rounded-md border border-[hsl(142_72%_50%/0.18)]">
                            <Zap size={9} fill="currentColor" />
                            +₹{highestCashback.value} cashback via {highestCashback.name}
                        </div>
                    )}
                </div>

                {/* CTA — Buy Now expands to platform options */}
                <div className="mt-auto">
                    {hasBuyLinks ? (
                        <div className="flex flex-col gap-2">
                            {/* Buy Now trigger */}
                            <button
                                onClick={() => setIsBuyOpen(!isBuyOpen)}
                                className="flex items-center justify-center gap-1.5 w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white text-xs font-bold py-1.5 px-3 rounded-xl transition-all duration-200 shine-on-hover shadow-[0_3px_12px_hsl(24_95%_53%/0.2)]"
                            >
                                <ShoppingCart size={12} />
                                Buy Now
                                <ChevronDown size={12} className={`ml-auto transition-transform duration-200 ${isBuyOpen ? "rotate-180" : ""}`} />
                            </button>

                            {/* Platform options — slide down */}
                            {isBuyOpen && (
                                <div className="flex flex-col gap-1.5 animate-scale-in">
                                    {product.amazonLink && (
                                        <a
                                            href={product.amazonLink}
                                            target="_blank"
                                            rel="noopener noreferrer sponsored"
                                            className="flex items-center justify-center gap-2 bg-[hsl(43_95%_53%)] hover:bg-[hsl(43_95%_60%)] text-gray-950 text-xs font-bold py-2 px-4 rounded-xl transition-all shine-on-hover"
                                        >
                                            <ExternalLink size={11} />
                                            Amazon
                                        </a>
                                    )}
                                    {product.flipkartLink && (
                                        <a
                                            href={product.flipkartLink}
                                            target="_blank"
                                            rel="noopener noreferrer sponsored"
                                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all shine-on-hover"
                                        >
                                            <ExternalLink size={11} />
                                            Flipkart
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            href={`/products/${product.slug}`}
                            className="flex items-center justify-center gap-2 w-full bg-[hsl(224_25%_14%)] hover:bg-[hsl(224_25%_18%)] border border-[hsl(224_20%_20%)] text-[hsl(210_30%_92%)] text-sm font-semibold py-2.5 px-4 rounded-xl transition-all duration-200"
                        >
                            View Details
                        </Link>
                    )}
                </div>
            </div>
        </article>
    );
}
