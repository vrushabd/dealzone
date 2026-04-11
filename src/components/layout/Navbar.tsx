"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, Search, Menu, X, Zap, Flame } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [scrolled, setScrolled] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 12);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery("");
            setMenuOpen(false);
        }
    };

    const navLinks = [
        { href: "/products", label: "All Deals" },
        { href: "/categories", label: "Categories" },
        { href: "/price-tracker", label: "Price Tracker" },
        { href: "/coupons", label: "Coupons" },
        { href: "/blog", label: "Blog" },
    ];

    return (
        <header
            className={`sticky top-0 z-50 transition-all duration-300 ${
                scrolled
                    ? "bg-[hsl(224_44%_4%/0.97)] shadow-[0_2px_32px_hsl(224_44%_0%/0.6)] border-b border-[hsl(224_20%_13%/0.8)]"
                    : "bg-[hsl(224_44%_4%/0.90)] border-b border-[hsl(224_20%_13%/0.5)]"
            } backdrop-blur-xl`}
        >
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? "h-14" : "h-16"}`}>

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
                        <div className="relative w-8 h-8 flex-shrink-0">
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-[0_0_16px_hsl(24_95%_53%/0.4)] group-hover:shadow-[0_0_24px_hsl(24_95%_53%/0.6)] transition-shadow duration-300">
                                <Zap size={17} className="text-white" fill="currentColor" />
                            </div>
                        </div>
                        <span className="text-xl font-extrabold gradient-text tracking-tight">DealZone</span>

                        {/* Hot deals live badge */}
                        <div className="hidden sm:flex items-center gap-1 bg-orange-500/10 border border-orange-500/25 rounded-full px-2 py-0.5 text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-[pulseDot_1.5s_ease-in-out_infinite]" />
                            Live
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`relative text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 ${
                                        isActive
                                            ? "text-orange-400 bg-orange-500/10"
                                            : "text-[hsl(215_18%_65%)] hover:text-white hover:bg-[hsl(224_25%_12%)]"
                                    }`}
                                >
                                    {link.label}
                                    {isActive && (
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-0.5 bg-orange-500 rounded-full" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Search */}
                    <form onSubmit={handleSearch} className="hidden md:flex items-center">
                        <div className="relative group flex items-center">
                            <input
                                type="text"
                                placeholder="Search deals..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-[hsl(224_28%_9%)] border border-[hsl(224_20%_15%)] rounded-xl pl-4 pr-10 py-2 text-sm text-[hsl(210_30%_96%)] placeholder-[hsl(215_10%_35%)] focus:outline-none focus:border-orange-500 focus:shadow-[0_0_0_3px_hsl(24_95%_53%/0.15)] w-44 transition-all duration-300 focus:w-56"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[hsl(215_12%_42%)] hover:text-orange-400 transition-colors"
                                aria-label="Search"
                            >
                                <Search size={14} />
                            </button>
                        </div>
                    </form>

                    {/* Theme toggle */}
                    <ThemeToggle />

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden p-2 text-[hsl(215_18%_65%)] hover:text-white hover:bg-[hsl(224_25%_12%)] rounded-lg transition-all"
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {menuOpen && (
                    <div className="md:hidden pb-4 border-t border-[hsl(224_20%_13%)] mt-2 pt-4 space-y-1 animate-slide-down">
                        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                            <div className="relative flex-1">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(215_12%_42%)]" />
                                <input
                                    type="text"
                                    placeholder="Search deals..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[hsl(224_28%_9%)] border border-[hsl(224_20%_15%)] rounded-xl pl-8 pr-4 py-2 text-sm text-[hsl(210_30%_96%)] placeholder-[hsl(215_10%_35%)] focus:outline-none focus:border-orange-500"
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all hover:shadow-[0_4px_16px_hsl(24_95%_53%/0.35)]"
                            >
                                Go
                            </button>
                        </form>
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMenuOpen(false)}
                                    className={`flex items-center py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                                        isActive
                                            ? "bg-orange-500/10 text-orange-400"
                                            : "text-[hsl(215_18%_65%)] hover:text-white hover:bg-[hsl(224_25%_12%)]"
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </nav>
        </header>
    );
}
