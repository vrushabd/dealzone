"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UilShoppingCart, UilBolt, UilCheck, UilLockAlt } from "@iconscout/react-unicons";

interface BuyButtonsProps {
    productId: string;
    productSlug: string;
    outOfStock?: boolean;
}

const BUY_NOW_STORAGE_KEY = "zencult_pending_buy_now_product";
const ADD_TO_CART_STORAGE_KEY = "zencult_pending_add_to_cart_product";

type BuyStage = "idle" | "adding" | "redirecting";

export default function BuyButtons({ productId, productSlug, outOfStock }: BuyButtonsProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [cartLoading, setCartLoading] = useState(false);
    const [cartAdded, setCartAdded] = useState(false);
    const [buyStage, setBuyStage] = useState<BuyStage>("idle");
    const [buyError, setBuyError] = useState("");
    const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);
    const buyBtnRef = useRef<HTMLButtonElement>(null);

    const triggerRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() });
        setTimeout(() => setRipple(null), 700);
    };

    const executeBuyNow = useCallback(async () => {
        setBuyStage("adding");
        setBuyError("");
        try {
            const res = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId, quantity: 1, mode: "set" }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || "Could not add this item to cart");
            }

            window.dispatchEvent(new CustomEvent("cart-updated"));
            // Show "Redirecting..." stage before navigating
            setBuyStage("redirecting");
            await new Promise(r => setTimeout(r, 700));
            router.push("/checkout?buynow=1");
        } catch (error: unknown) {
            setBuyError(error instanceof Error ? error.message : "Buy now failed");
            setBuyStage("idle");
        }
    }, [productId, router]);

    const executeAddToCart = useCallback(async () => {
        setCartLoading(true);
        setBuyError("");
        try {
            const res = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId, quantity: 1, mode: "increment" }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || "Could not add this item to cart");
            }

            setCartAdded(true);
            window.dispatchEvent(new CustomEvent("cart-updated"));
            setTimeout(() => setCartAdded(false), 3000);
        } catch (error: unknown) {
            setBuyError(error instanceof Error ? error.message : "Add to cart failed");
        } finally {
            setCartLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        if (status !== "authenticated") return;

        const pendingProductId = window.sessionStorage.getItem(BUY_NOW_STORAGE_KEY);
        if (pendingProductId === productId) {
            window.sessionStorage.removeItem(BUY_NOW_STORAGE_KEY);
            void executeBuyNow();
            return;
        }

        const pendingAddToCartProductId = window.sessionStorage.getItem(ADD_TO_CART_STORAGE_KEY);
        if (pendingAddToCartProductId === productId) {
            window.sessionStorage.removeItem(ADD_TO_CART_STORAGE_KEY);
            void executeAddToCart();
        }
    }, [executeAddToCart, executeBuyNow, productId, status]);

    const handleAddToCart = () => {
        if (status === "loading") return;
        if (!session) {
            window.sessionStorage.setItem(ADD_TO_CART_STORAGE_KEY, productId);
            router.push(`/login?callbackUrl=${encodeURIComponent(`/products/${productSlug}`)}`);
            return;
        }
        void executeAddToCart();
    };

    const handleBuyNow = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (status === "loading" || buyStage !== "idle") return;
        triggerRipple(e);
        if (!session) {
            window.sessionStorage.setItem(BUY_NOW_STORAGE_KEY, productId);
            router.push(`/login?callbackUrl=${encodeURIComponent(`/products/${productSlug}`)}`);
            return;
        }
        void executeBuyNow();
    };

    const buyLabel =
        buyStage === "adding" ? "Adding to cart..." :
        buyStage === "redirecting" ? "Going to Payment..." :
        "Buy Now";

    const buyIcon =
        buyStage === "adding" ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : buyStage === "redirecting" ? (
            <UilLockAlt size={18} className="animate-pulse" />
        ) : (
            <UilBolt size={18} />
        );

    if (outOfStock) {
        return (
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <span className="flex-1 flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-500 font-bold py-4 px-6 rounded-xl text-base cursor-not-allowed">
                    Out of Stock
                </span>
            </div>
        );
    }

    return (
        <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-3">

                {/* Add to Cart */}
                <button
                    onClick={handleAddToCart}
                    disabled={cartLoading || cartAdded}
                    className="flex-1 flex items-center justify-center gap-2 border-2 border-[var(--brand)] text-[var(--brand)] hover:bg-[hsl(214_89%_52%/0.08)] font-bold py-4 px-6 rounded-xl transition-all text-base disabled:opacity-70 active:scale-[0.97]"
                >
                    {cartLoading ? (
                        <span className="w-4 h-4 border-2 border-[var(--brand)]/40 border-t-[var(--brand)] rounded-full animate-spin" />
                    ) : cartAdded ? (
                        <UilCheck size={18} className="text-green-500" />
                    ) : (
                        <UilShoppingCart size={18} />
                    )}
                    {cartAdded ? "Added to Cart!" : "Add to Cart"}
                </button>

                {/* Buy Now with animated stages */}
                <button
                    ref={buyBtnRef}
                    onClick={handleBuyNow}
                    disabled={buyStage !== "idle"}
                    className={`relative flex-1 flex items-center justify-center gap-2 font-bold py-4 px-6 rounded-xl transition-all text-base overflow-hidden
                        ${buyStage === "redirecting"
                            ? "bg-green-500 hover:bg-green-500 text-white shadow-lg shadow-green-500/30"
                            : "bg-[var(--brand)] hover:bg-[hsl(214_89%_45%)] text-white hover:shadow-lg hover:shadow-[hsl(214_89%_52%/0.3)]"
                        }
                        ${buyStage !== "idle" ? "opacity-90 cursor-wait scale-[0.99]" : "active:scale-[0.97]"}
                    `}
                    style={{ transition: "background 0.4s, box-shadow 0.3s, transform 0.15s" }}
                >
                    {/* Ripple effect */}
                    {ripple && (
                        <span
                            key={ripple.id}
                            className="absolute rounded-full bg-white/30 animate-ping"
                            style={{
                                left: ripple.x - 40,
                                top: ripple.y - 40,
                                width: 80,
                                height: 80,
                                animationDuration: "0.6s",
                                animationIterationCount: 1,
                            }}
                        />
                    )}

                    {/* Progress bar for adding stage */}
                    {buyStage === "adding" && (
                        <span
                            className="absolute inset-x-0 bottom-0 h-1 bg-white/40 rounded-full"
                            style={{
                                animation: "progress-fill 1.2s ease-in-out forwards",
                            }}
                        />
                    )}

                    {/* Shimmer for redirecting stage */}
                    {buyStage === "redirecting" && (
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-[shimmer_1s_ease-in-out_infinite]" />
                    )}

                    {buyIcon}
                    <span className="relative z-10 transition-all duration-200">{buyLabel}</span>
                </button>
            </div>

            {buyError && (
                <p className="mt-2 text-sm text-red-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                    {buyError}
                </p>
            )}

            <style>{`
                @keyframes progress-fill {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}
