"use client";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { CartProvider } from "@/components/cart/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";

export function Providers({ children, forcedDefaultTheme = "dark" }: { children: React.ReactNode, forcedDefaultTheme?: string }) {
    return (
        // defaultTheme applies ONLY when localStorage has no saved value (first-time visitors).
        // Returning visitors who have toggled their preference keep it via localStorage.
        <ThemeProvider
            attribute="class"
            defaultTheme={forcedDefaultTheme}
            enableSystem={false}
            storageKey="dealzone-theme"
        >
            {/* User session provider — points to /api/auth/user */}
            <SessionProvider basePath="/api/auth/user">
                <CartProvider>
                    {children}
                    <CartDrawer />
                </CartProvider>
            </SessionProvider>
        </ThemeProvider>
    );
}
