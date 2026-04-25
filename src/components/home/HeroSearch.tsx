"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function HeroSearch() {
    const [query, setQuery] = useState("");
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) return;
        router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    };

    return (
        <form
            id="hero-search-form"
            onSubmit={handleSubmit}
            className="w-full max-w-2xl mx-auto flex rounded-full overflow-hidden shadow-[0_6px_40px_rgba(0,0,0,0.35)] border border-white/10"
        >
            <div className="relative flex-1 min-w-0">
                <Search
                    size={15}
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
                />
                <input
                    id="hero-search-input"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search products, categories..."
                    className="w-full pl-12 pr-4 py-4 bg-white text-gray-800 text-sm outline-none border-0 placeholder:text-gray-400"
                    autoComplete="off"
                    spellCheck={false}
                />
            </div>
            <button
                id="hero-search-button"
                type="submit"
                className="flex-shrink-0 px-7 py-4 bg-[hsl(214_89%_52%)] hover:bg-[hsl(214_89%_45%)] text-white font-bold text-sm transition-colors duration-200 whitespace-nowrap"
            >
                Search
            </button>
        </form>
    );
}
