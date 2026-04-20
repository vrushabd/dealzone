"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function GlobalThemeToggle() {
    const { setTheme } = useTheme();
    const [dbTheme, setDbTheme] = useState<"light" | "dark">("dark");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/settings")
            .then(res => res.json())
            .then(data => {
                if (data.defaultTheme) {
                    setDbTheme(data.defaultTheme);
                }
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    const toggleTheme = async () => {
        const newTheme = dbTheme === "light" ? "dark" : "light";
        setDbTheme(newTheme);          // Update local state
        setTheme(newTheme);            // Actually apply theme to the page NOW
        try {
            await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ defaultTheme: newTheme })
            });
        } catch {
            console.error("Failed to save theme");
        }
    };

    if (isLoading) return <div className="w-9 h-9" />;

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-md bg-[var(--bg-card-hover)] hover:bg-[var(--brand-glow)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white transition-all duration-300"
            title={`Global Default Theme is ${dbTheme}. Click to change.`}
        >
            {dbTheme === "light" ? (
                <Sun size={17} className="text-[hsl(214_89%_55%)]" />
            ) : (
                <Moon size={17} className="text-gray-400" />
            )}
        </button>
    );
}
