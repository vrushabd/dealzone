"use client";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

export function Providers({ children, forcedDefaultTheme = "dark" }: { children: React.ReactNode, forcedDefaultTheme?: string }) {
    return (
        <ThemeProvider attribute="class" defaultTheme={forcedDefaultTheme} enableSystem={false}>
            <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
    );
}
