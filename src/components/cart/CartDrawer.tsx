"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight, ShoppingCart } from "lucide-react";
import { useCart } from "./CartContext";

export default function CartDrawer() {
    const { items, cartCount, cartTotal, drawerOpen, setDrawerOpen, updateQuantity, removeFromCart } = useCart();
    const backdropRef = useRef<HTMLDivElement>(null);

    // Close on Escape
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerOpen(false); };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [setDrawerOpen]);

    // Prevent body scroll when open
    useEffect(() => {
        if (drawerOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [drawerOpen]);

    if (!drawerOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                ref={backdropRef}
                onClick={() => setDrawerOpen(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] animate-fade-in"
            />

            {/* Drawer */}
            <div className="fixed top-0 right-0 h-full w-full max-w-[420px] bg-[var(--bg-surface)] border-l border-[var(--border)] z-[100] flex flex-col shadow-2xl"
                style={{ animation: "slideInRight 0.3s ease forwards" }}>

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                        <ShoppingBag size={20} className="text-[var(--brand)]" />
                        <h2 className="font-bold text-[var(--text-primary)] text-lg">
                            Your Cart
                        </h2>
                        {cartCount > 0 && (
                            <span className="bg-[var(--brand)] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {cartCount}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => setDrawerOpen(false)}
                        className="p-2 rounded-md hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 py-16 text-center">
                            <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
                                <ShoppingCart size={28} className="text-[var(--text-muted)]" />
                            </div>
                            <p className="text-[var(--text-secondary)] font-medium">Your cart is empty</p>
                            <button
                                onClick={() => setDrawerOpen(false)}
                                className="btn-primary text-sm"
                            >
                                Start Shopping
                            </button>
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={item.productId}
                                className="flex gap-3 p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg hover:border-[var(--border-brand)] transition-all">
                                {/* Image */}
                                <Link href={`/products/${item.product.slug}`} onClick={() => setDrawerOpen(false)}>
                                    <div className="w-16 h-16 rounded-md overflow-hidden bg-[var(--bg-elevated)] flex-shrink-0">
                                        {item.product.image ? (
                                            <Image
                                                src={item.product.image}
                                                alt={item.product.title}
                                                width={64}
                                                height={64}
                                                className="object-contain w-full h-full p-1"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ShoppingCart size={18} className="text-[var(--text-muted)]" />
                                            </div>
                                        )}
                                    </div>
                                </Link>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <Link href={`/products/${item.product.slug}`} onClick={() => setDrawerOpen(false)}>
                                        <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-2 hover:text-[var(--brand)] transition-colors">
                                            {item.product.title}
                                        </p>
                                    </Link>
                                    <p className="text-[var(--brand)] font-bold text-sm mt-1">
                                        ₹{((item.product.price || 0) * item.quantity).toLocaleString("en-IN")}
                                    </p>

                                    {/* Qty controls */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <button
                                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                            className="w-6 h-6 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all"
                                        >
                                            <Minus size={11} />
                                        </button>
                                        <span className="text-sm font-bold text-[var(--text-primary)] w-5 text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                            className="w-6 h-6 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all"
                                        >
                                            <Plus size={11} />
                                        </button>
                                        <button
                                            onClick={() => removeFromCart(item.productId)}
                                            className="ml-auto w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer — summary + checkout */}
                {items.length > 0 && (
                    <div className="p-4 border-t border-[var(--border)] space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--text-secondary)]">Subtotal ({cartCount} items)</span>
                            <span className="font-bold text-[var(--text-primary)] text-base">₹{cartTotal.toLocaleString("en-IN")}</span>
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)]">Shipping & COD charges calculated at checkout</p>

                        <Link
                            href="/checkout"
                            onClick={() => setDrawerOpen(false)}
                            className="flex items-center justify-center gap-2 w-full btn-primary shine-on-hover py-3 text-sm font-bold"
                        >
                            Proceed to Checkout
                            <ArrowRight size={16} />
                        </Link>

                        <Link
                            href="/cart"
                            onClick={() => setDrawerOpen(false)}
                            className="flex items-center justify-center gap-2 w-full py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded-md hover:bg-[var(--bg-elevated)] transition-all"
                        >
                            View Full Cart
                        </Link>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to   { transform: translateX(0); }
                }
            `}</style>
        </>
    );
}
