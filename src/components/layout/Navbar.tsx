"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Menu, X, Zap } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Logo from "@/components/ui/Logo";

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
        { href: "/contact", label: "Contact" },
    ];

    return (
        <header
            className={`sticky top-0 z-50 transition-all duration-300 ${
                scrolled
                    ? "bg-[var(--bg-base)] shadow-[var(--shadow-card)] border-b border-[var(--border)]"
                    : "bg-[var(--bg-base)] border-b border-[var(--border)]"
            }`}
        >
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? "h-14" : "h-16"}`}>

                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <Logo />
                        {/* Live badge */}
                        <div className="hidden sm:flex items-center gap-1 bg-[hsl(214_89%_52%/0.10)] border border-[hsl(214_89%_52%/0.25)] rounded-full px-2 py-0.5 text-[10px] font-bold text-[hsl(214_89%_55%)] uppercase tracking-wider mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(214_89%_55%)] animate-[pulseDot_1.5s_ease-in-out_infinite]" />
                            Live
                        </div>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`relative text-sm font-medium px-3 py-1.5 rounded-md transition-all duration-200 ${
                                        isActive
                                            ? "text-[hsl(214_89%_55%)] bg-[hsl(214_89%_52%/0.08)]"
                                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                                    }`}
                                >
                                    {link.label}
                                    {isActive && (
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[hsl(214_89%_52%)] rounded-full" />
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
                                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md pl-4 pr-10 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[hsl(214_89%_52%)] focus:shadow-[0_0_0_3px_hsl(214_89%_52%/0.12)] w-44 transition-all duration-300 focus:w-56"
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[hsl(214_89%_52%)] transition-colors"
                                aria-label="Search"
                            >
                                <Search size={14} />
                            </button>
                        </div>
                    </form>

                    {/* Mobile menu button and Theme toggle group */}
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-md transition-all"
                            aria-label="Toggle menu"
                        >
                            {menuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {menuOpen && (
                    <div className="md:hidden pb-4 border-t border-[var(--border)] mt-2 pt-4 space-y-1 animate-slide-down">
                        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                            <div className="relative flex-1">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    placeholder="Search deals..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-md pl-8 pr-4 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] focus:outline-none focus:border-[hsl(214_89%_52%)]"
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-[hsl(214_89%_52%)] hover:bg-[hsl(214_89%_45%)] text-white px-4 py-2 rounded-md text-sm font-bold transition-all"
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
                                    className={`flex items-center py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
                                        isActive
                                            ? "bg-[hsl(214_89%_52%/0.08)] text-[hsl(214_89%_55%)]"
                                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
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
