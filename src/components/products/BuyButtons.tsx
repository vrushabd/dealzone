"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Zap, Loader2, CheckCircle2 } from "lucide-react";

interface BuyButtonsProps {
    productId: string;
    productSlug: string;
    outOfStock?: boolean;
}

export default function BuyButtons({ productId, productSlug, outOfStock }: BuyButtonsProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [cartLoading, setCartLoading] = useState(false);
    const [cartAdded, setCartAdded] = useState(false);
    const [buyLoading, setBuyLoading] = useState(false);

    if (outOfStock) {
        return (
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <span className="flex-1 flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-500 font-bold py-4 px-6 rounded-xl text-base cursor-not-allowed">
                    Out of Stock
                </span>
            </div>
        );
    }

    const requireLogin = (next: () => void) => {
        if (status === "loading") return;
        if (!session) {
            router.push(`/login?callbackUrl=${encodeURIComponent(`/products/${productSlug}`)}`);
            return;
        }
        next();
    };

    const handleAddToCart = () => {
        requireLogin(async () => {
            setCartLoading(true);
            try {
                const res = await fetch("/api/cart", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productId, quantity: 1, mode: "increment" }),
                });
                if (res.ok) {
                    setCartAdded(true);
                    // Refresh navbar cart count
                    window.dispatchEvent(new CustomEvent("cart-updated"));
                    setTimeout(() => setCartAdded(false), 3000);
                }
            } finally {
                setCartLoading(false);
            }
        });
    };

    const handleBuyNow = () => {
        requireLogin(async () => {
            setBuyLoading(true);
            try {
                // Add to cart first, then go to checkout
                await fetch("/api/cart", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productId, quantity: 1, mode: "increment" }),
                });
                window.dispatchEvent(new CustomEvent("cart-updated"));
                router.push("/checkout");
            } finally {
                setBuyLoading(false);
            }
        });
    };

    return (
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
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
    );
}
