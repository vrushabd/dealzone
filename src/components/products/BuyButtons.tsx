"use client";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Zap, Loader2, CheckCircle2 } from "lucide-react";

interface BuyButtonsProps {
    productId: string;
    productSlug: string;
    outOfStock?: boolean;
}

const BUY_NOW_STORAGE_KEY = "genzloots_pending_buy_now_product";
const ADD_TO_CART_STORAGE_KEY = "genzloots_pending_add_to_cart_product";

export default function BuyButtons({ productId, productSlug, outOfStock }: BuyButtonsProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [cartLoading, setCartLoading] = useState(false);
    const [cartAdded, setCartAdded] = useState(false);
    const [buyLoading, setBuyLoading] = useState(false);
    const [buyError, setBuyError] = useState("");

    const executeBuyNow = useCallback(async () => {
        setBuyLoading(true);
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

            window.dispatchEvent(new CustomEvent("cart-updated"));
            router.push("/checkout");
        } catch (error: unknown) {
            setBuyError(error instanceof Error ? error.message : "Buy now failed");
        } finally {
            setBuyLoading(false);
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

    const handleBuyNow = () => {
        if (status === "loading") return;
        if (!session) {
            window.sessionStorage.setItem(BUY_NOW_STORAGE_KEY, productId);
            router.push(`/login?callbackUrl=${encodeURIComponent(`/products/${productSlug}`)}`);
            return;
        }

        void executeBuyNow();
    };

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
                className="flex-1 flex items-center justify-center gap-2 border-2 border-[var(--brand)] text-[var(--brand)] hover:bg-[hsl(214_89%_52%/0.08)] font-bold py-4 px-6 rounded-xl transition-all text-base disabled:opacity-70"
            >
                {cartLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : cartAdded ? (
                    <CheckCircle2 size={18} className="text-green-500" />
                ) : (
                    <ShoppingCart size={18} />
                )}
                {cartAdded ? "Added to Cart!" : "Add to Cart"}
            </button>

            {/* Buy Now */}
            <button
                onClick={handleBuyNow}
                disabled={buyLoading}
                className="flex-1 flex items-center justify-center gap-2 bg-[var(--brand)] hover:bg-[hsl(214_89%_45%)] text-white font-bold py-4 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-[hsl(214_89%_52%/0.3)] text-base disabled:opacity-70"
            >
                {buyLoading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                Buy Now
            </button>
            </div>

            {buyError && (
                <p className="mt-2 text-sm text-red-500">{buyError}</p>
            )}
        </div>
    );
}
