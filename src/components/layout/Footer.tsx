"use client";
import Link from "next/link";
import { ExternalLink, ShieldCheck, TrendingUp, Tag } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { useEffect, useState } from "react";

export default function Footer() {
    const [siteName, setSiteName] = useState("GenzLoots");

    useEffect(() => {
        fetch("/api/settings/public")
            .then(r => r.json())
            .then(d => { if (d.siteName) setSiteName(d.siteName); })
            .catch(() => {});
    }, []);

    const stats = [
        { icon: <TrendingUp size={14} />, label: "Products Curated", value: "Daily" },
        { icon: <Tag size={14} />,        label: "Checkout Options", value: "COD + Online" },
        { icon: <ShieldCheck size={14} />, label: "Support", value: "Order Updates" },
    ];

    return (
        <footer className="relative mt-20 overflow-hidden">
            {/* Gradient top border */}
            <div className="h-px bg-gradient-to-r from-transparent via-[hsl(214_89%_52%/0.4)] to-transparent" />

            {/* Background */}
            <div className="relative bg-[var(--bg-surface)] mesh-bg">
                {/* Ambient glow orbs */}
                <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-[hsl(214_89%_52%)]/4 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-0 right-1/4 w-48 h-48 bg-indigo-500/4 rounded-full blur-3xl pointer-events-none" />

                {/* Stats Strip */}
                <div className="border-b border-[var(--border-subtle)]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
                            {stats.map((s) => (
                                <div key={s.label} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[hsl(214_89%_52%/0.08)] border border-[hsl(214_89%_52%/0.20)] flex items-center justify-center text-[hsl(214_89%_55%)] flex-shrink-0">
                                        {s.icon}
                                    </div>
                                    <div>
                                        <div className="text-base font-bold text-[var(--text-primary)] leading-none">{s.value}</div>
                                        <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{s.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main footer content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                        {/* Brand */}
                        <div className="md:col-span-2">
                            <div className="mb-4">
                                <Logo />
                            </div>
                            <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-xs">
                                Shop curated products on {siteName} with secure checkout, order tracking, and direct customer support from one place.
                            </p>
                        </div>

                        {/* Links */}
                        <div>
                            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-4">Browse</h3>
                            <ul className="space-y-2.5">
                                {[
                                    { href: "/products",   label: "All Products" },
                                    { href: "/categories", label: "Categories" },
                                    { href: "/coupons",    label: "Coupons" },
                                    { href: "/blog",       label: "Blog" },
                                    { href: "/contact",    label: "Contact Us" },
                                    { href: "/disclaimer", label: "Disclaimer" },
                                ].map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-[var(--text-muted)] hover:text-[hsl(214_89%_55%)] text-sm transition-colors duration-200 hover:translate-x-0.5 inline-block"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="mt-10 rounded-md border border-[var(--border)] bg-[var(--bg-card)]/70 px-4 py-4 text-sm leading-6 text-[var(--text-secondary)]">
                        <span className="font-semibold text-[var(--text-primary)]">Disclaimer:</span>{" "}
                        Some catalog details may originate from marketplace listings and can change without notice. Final availability and fulfillment timing are confirmed after your order is reviewed.
                    </div>

                    {/* Bottom bar */}
                    <div className="border-t border-[var(--border-subtle)] mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-[var(--text-muted)] text-xs">
                            © {new Date().getFullYear()} {siteName}. All rights reserved.
                        </p>
                        <div className="flex items-center gap-4">
                            <Link href="/privacy" className="text-[var(--text-muted)] hover:text-[hsl(214_89%_55%)] text-xs transition-colors">
                                Privacy Policy
                            </Link>
                            <span className="text-[var(--border)]">·</span>
                            <Link href="/terms" className="text-[var(--text-muted)] hover:text-[hsl(214_89%_55%)] text-xs transition-colors">
                                Terms
                            </Link>
                            <span className="text-[var(--border)]">·</span>
                            <Link href="/disclaimer" className="text-[var(--text-muted)] hover:text-[hsl(214_89%_55%)] text-xs transition-colors">
                                Disclaimer
                            </Link>
                            <span className="text-[var(--border)]">·</span>
                            <Link href="/contact" className="text-[var(--text-muted)] hover:text-[hsl(214_89%_55%)] text-xs transition-colors">
                                Contact
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
