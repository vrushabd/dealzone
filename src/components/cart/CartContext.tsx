"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSession } from "next-auth/react";

export interface CartProduct {
    id: string;
    title: string;
    slug: string;
    image?: string | null;
    price?: number | null;
    originalPrice?: number | null;
}

export interface CartItemData {
    id: string;
    productId: string;
    quantity: number;
    product: CartProduct;
}

interface CartContextValue {
    items: CartItemData[];
    cartCount: number;
    cartTotal: number;
    loading: boolean;
    drawerOpen: boolean;
    setDrawerOpen: (open: boolean) => void;
    addToCart: (product: CartProduct, quantity?: number) => Promise<void>;
    updateQuantity: (productId: string, quantity: number) => Promise<void>;
    removeFromCart: (productId: string) => Promise<void>;
    clearCart: () => Promise<void>;
    refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
    const { status } = useSession();
    const [items, setItems] = useState<CartItemData[]>([]);
    const [loading, setLoading] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const fetchCart = useCallback(async () => {
        if (status !== "authenticated") {
            setItems([]);
            return;
        }
        try {
            setLoading(true);
            const res = await fetch("/api/cart");
            const data = await res.json();
            setItems(data.items || []);
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    }, [status]);


    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const addToCart = useCallback(async (product: CartProduct, quantity = 1) => {
        if (status !== "authenticated") {
            // redirect to login is handled by the button component
            return;
        }
        // Optimistically update
        setItems(prev => {
            const existing = prev.find(i => i.productId === product.id);
            if (existing) {
                return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i);
            }
            return [...prev, {
                id: `tmp-${product.id}`,
                productId: product.id,
                quantity,
                product,
            }];
        });

        await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: product.id, quantity, mode: "increment" }),
        });

        setDrawerOpen(true);
        fetchCart();
    }, [status, fetchCart]);

    const updateQuantity = useCallback(async (productId: string, quantity: number) => {
        if (quantity < 1) return;
        setItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity } : i));
        await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, quantity, mode: "set" }),
        });
    }, []);

    const removeFromCart = useCallback(async (productId: string) => {
        setItems(prev => prev.filter(i => i.productId !== productId));
        await fetch("/api/cart", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
        });
    }, []);

    const clearCart = useCallback(async () => {
        setItems([]);
        await fetch("/api/cart", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clear: true }),
        });
    }, []);

    const cartCount = items.reduce((s, i) => s + i.quantity, 0);
    const cartTotal = items.reduce((s, i) => s + (i.product.price || 0) * i.quantity, 0);

    return (
        <CartContext.Provider value={{
            items, cartCount, cartTotal, loading,
            drawerOpen, setDrawerOpen,
            addToCart, updateQuantity, removeFromCart, clearCart,
            refreshCart: fetchCart,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within CartProvider");
    return ctx;
}
