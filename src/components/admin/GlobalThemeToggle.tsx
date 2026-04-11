"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function GlobalThemeToggle() {
    const [theme, setTheme] = useState<"light" | "dark">("dark");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/settings")
            .then(res => res.json())
            .then(data => {
                if (data.defaultTheme) setTheme(data.defaultTheme);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    const toggleTheme = async () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme); // Optimistic UI
        try {
            await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ defaultTheme: newTheme })
            });
        } catch (e) {
            console.error("Failed to save theme");
        }
    };

    if (isLoading) return <div className="w-9 h-9" />; // Placeholder

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--bg-card-hover)] hover:bg-[var(--brand-glow)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white transition-all duration-300"
            title={`Global Default Theme is ${theme}. Click to change.`}
        >
            {theme === "light" ? (
                <Sun size={17} className="text-orange-400" />
            ) : (
                <Moon size={17} className="text-gray-400" />
            )}
        </button>
    );
}
