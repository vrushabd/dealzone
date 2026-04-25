"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, Tag, ChevronRight, Loader2 } from "lucide-react";
import { useCart } from "@/components/cart/CartContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function CartPage() {
    const { status } = useSession();
    const router = useRouter();
    const { items, cartCount, cartTotal, loading, updateQuantity, removeFromCart } = useCart();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login?callbackUrl=/cart");
        }
    }, [status, router]);

    const shippingFee = 0; // calculated at checkout

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
                <Loader2 size={28} className="animate-spin text-[var(--brand)]" />
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-[var(--bg-base)] py-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
                        <Link href="/" className="hover:text-[var(--brand)] transition-colors">Home</Link>
                        <ChevronRight size={14} />
                        <span className="text-[var(--text-secondary)]">My Cart</span>
                    </nav>

                    <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-8 flex items-center gap-3">
                        <ShoppingCart size={24} className="text-[var(--brand)]" />
                        My Cart
                        {cartCount > 0 && (
                            <span className="bg-[var(--brand)] text-white text-sm font-bold px-2.5 py-0.5 rounded-full">{cartCount}</span>
                        )}
                    </h1>

                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-5">
                                <ShoppingCart size={32} className="text-[var(--text-muted)]" />
                            </div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Your cart is empty</h2>
                            <p className="text-[var(--text-secondary)] mb-6">Browse products and add your favorites here</p>
                            <Link href="/products" className="btn-primary px-6 py-2.5 text-sm font-bold shine-on-hover">
                                Start Shopping
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
                            {/* Items */}
                            <div className="space-y-3">
                                {items.map(item => {
                                    const discountPct = item.product.originalPrice && item.product.price
                                        ? Math.round(((item.product.originalPrice - item.product.price) / item.product.originalPrice) * 100)
                                        : null;

                                    return (
                                        <div key={item.productId}
                                            className="flex gap-4 p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl hover:border-[var(--border-brand)] transition-all">
                                            {/* Image */}
                                            <Link href={`/products/${item.product.slug}`} className="flex-shrink-0">
                                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[var(--bg-elevated)] rounded-lg overflow-hidden">
                                                    {item.product.image ? (
                                                        <Image src={item.product.image} alt={item.product.title}
                                                            width={96} height={96} className="object-contain w-full h-full p-2" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ShoppingCart size={24} className="text-[var(--text-muted)]" />
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <Link href={`/products/${item.product.slug}`}>
                                                    <h3 className="font-semibold text-[var(--text-primary)] line-clamp-2 hover:text-[var(--brand)] transition-colors text-sm sm:text-base">
                                                        {item.product.title}
                                                    </h3>
                                                </Link>

                                                <div className="flex items-baseline gap-2 mt-1.5">
                                                    <span className="text-lg font-bold text-[var(--brand)]">
                                                        ₹{(item.product.price || 0).toLocaleString("en-IN")}
                                                    </span>
                                                    {item.product.originalPrice && item.product.originalPrice !== item.product.price && (
                                                        <span className="text-sm text-[var(--text-muted)] line-through">
                                                            ₹{item.product.originalPrice.toLocaleString("en-IN")}
                                                        </span>
                                                    )}
                                                    {discountPct && discountPct > 0 && (
                                                        <span className="text-xs font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                                            <Tag size={9} /> -{discountPct}%
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Qty + remove */}
                                                <div className="flex items-center gap-3 mt-3">
                                                    <div className="flex items-center gap-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg overflow-hidden">
                                                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                            disabled={item.quantity <= 1}
                                                            className="w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--brand)] hover:bg-[hsl(214_89%_52%/0.08)] transition-all disabled:opacity-30">
                                                            <Minus size={13} />
                                                        </button>
                                                        <span className="w-8 text-center text-sm font-bold text-[var(--text-primary)]">{item.quantity}</span>
                                                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                            className="w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--brand)] hover:bg-[hsl(214_89%_52%/0.08)] transition-all">
                                                            <Plus size={13} />
                                                        </button>
                                                    </div>

                                                    <button onClick={() => removeFromCart(item.productId)}
                                                        className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 px-2.5 py-1.5 rounded-md transition-all">
                                                        <Trash2 size={12} />
                                                        Remove
                                                    </button>

                                                    <div className="ml-auto text-sm font-bold text-[var(--text-primary)]">
                                                        ₹{((item.product.price || 0) * item.quantity).toLocaleString("en-IN")}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Summary */}
                            <div className="lg:sticky lg:top-24">
                                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
                                    <h2 className="font-bold text-[var(--text-primary)] text-base mb-4">Price Details</h2>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between text-[var(--text-secondary)]">
                                            <span>Price ({cartCount} items)</span>
                                            <span>₹{cartTotal.toLocaleString("en-IN")}</span>
                                        </div>
                                        <div className="flex justify-between text-[var(--text-secondary)]">
                                            <span>Shipping</span>
                                            <span className="text-green-500 font-semibold">Calculated at checkout</span>
                                        </div>
                                        <div className="border-t border-[var(--border)] pt-3 flex justify-between font-bold text-[var(--text-primary)] text-base">
                                            <span>Total Amount</span>
                                            <span className="text-[var(--brand)]">₹{(cartTotal + shippingFee).toLocaleString("en-IN")}</span>
                                        </div>
                                    </div>

                                    <Link href="/checkout"
                                        className="flex items-center justify-center gap-2 w-full mt-5 btn-primary py-3.5 text-sm font-bold shine-on-hover btn-glow">
                                        Checkout Securely
                                        <ArrowRight size={16} />
                                    </Link>

                                    <Link href="/products"
                                        className="flex items-center justify-center gap-1 w-full mt-3 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                                        ← Continue Shopping
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
