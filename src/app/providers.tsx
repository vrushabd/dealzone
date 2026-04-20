"use client";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

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
            <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
    );
}
