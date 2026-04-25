"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
    Zap, LayoutDashboard, ShoppingBag, BookOpen, Tag,
    LogOut, ExternalLink, Menu, X, ChevronRight, Settings, TrendingUp, Bell, RefreshCw, Package
} from "lucide-react";

import { GlobalThemeToggle } from "@/components/admin/GlobalThemeToggle";
import Logo from "@/components/ui/Logo";

const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/admin/products", label: "Products", icon: ShoppingBag },
    { href: "/admin/orders", label: "Orders", icon: Package },
    { href: "/admin/posts", label: "Blog Posts", icon: BookOpen },
    { href: "/admin/categories", label: "Categories", icon: Tag },
    { href: "/admin/tracked-products", label: "Price Tracked", icon: TrendingUp },
    { href: "/admin/alerts", label: "Alerts", icon: Bell },
    { href: "/admin/sync", label: "Price Sync", icon: RefreshCw },
    { href: "/admin/settings", label: "Settings", icon: Settings },
];

function isActivePath(pathname: string, href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
}

function SidebarContent({
    pathname,
    collapsed,
    onNavigate,
    onSignOut,
}: {
    pathname: string;
    collapsed: boolean;
    onNavigate: () => void;
    onSignOut: () => void;
}) {
    return (
        <div className="flex flex-col h-full">
            <div className={`flex items-center gap-2.5 px-4 py-5 border-b border-[var(--border)] ${collapsed ? "justify-center" : ""}`}>
                {collapsed ? (
                    <div className="w-8 h-8 bg-gradient-to-br from-[hsl(214_89%_52%)] to-[hsl(214_89%_45%)] rounded-lg flex items-center justify-center flex-shrink-0 shadow shadow-[hsl(214_89%_52%/0.25)]">
                        <Zap size={16} className="text-white" />
                    </div>
                ) : (
                    <Logo className="scale-90 origin-left" />
                )}
            </div>

            <nav className="flex-1 p-3 space-y-1">
                {navItems.map(({ href, label, icon: Icon, exact }) => {
                    const active = isActivePath(pathname, href, exact);
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={onNavigate}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group relative
                ${active
                                    ? "bg-[hsl(214_89%_52%/0.12)] text-[hsl(214_89%_55%)] shadow-sm"
                                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                                }`}
                        >
                            {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[hsl(214_89%_52%)] rounded-r-full" />}
                            <Icon size={17} className={`flex-shrink-0 ${active ? "text-[hsl(214_89%_55%)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"}`} />
                            {!collapsed && <span>{label}</span>}
                            {!collapsed && active && <ChevronRight size={14} className="ml-auto text-[hsl(214_89%_55%)]/60" />}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-3 border-t border-[var(--border)] space-y-1">
                <a
                    href="/"
                    target="_blank"
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-all"
                >
                    <ExternalLink size={17} className="text-[var(--text-muted)] flex-shrink-0" />
                    {!collapsed && <span>View Site</span>}
                </a>

                <div className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-all">
                    <GlobalThemeToggle />
                    {!collapsed && <span>Global Default Theme</span>}
                </div>

                <button
                    onClick={onSignOut}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                    <LogOut size={17} className="text-[var(--text-muted)] flex-shrink-0" />
                    {!collapsed && <span>Sign Out</span>}
                </button>
            </div>
        </div>
    );
}

export default function AdminSidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const safePathname = pathname || "";

    return (
        <>
            {/* Desktop sidebar */}
            <aside
                className={`hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0 bg-[var(--bg-surface)] border-r border-[var(--border)] transition-all duration-300 ${collapsed ? "w-16" : "w-56"}`}
            >
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-6 w-6 h-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] z-10 transition-colors"
                >
                    {collapsed ? <ChevronRight size={12} /> : <X size={12} />}
                </button>
                <SidebarContent
                    pathname={safePathname}
                    collapsed={collapsed}
                    onNavigate={() => setMobileOpen(false)}
                    onSignOut={() => signOut({ callbackUrl: "/admin/login" })}
                />
            </aside>

            {/* Mobile top bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[var(--bg-surface)] border-b border-[var(--border)] flex items-center gap-3 px-3 py-2">
                <button
                    onClick={() => setMobileOpen(true)}
                    className="flex items-center justify-center w-10 h-10 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[hsl(214_89%_52%/0.10)] hover:border-[hsl(214_89%_52%/0.30)] hover:text-[hsl(214_89%_55%)] transition-all duration-200 flex-shrink-0"
                    aria-label="Open navigation menu"
                >
                    <Menu size={20} />
                </button>
                <span className="font-bold text-[var(--text-primary)] flex-1">GenzLoots Admin</span>
            </div>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <aside className="relative w-64 bg-[var(--bg-surface)] h-full">
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="absolute top-4 right-4 flex items-center justify-center w-9 h-9 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all duration-200"
                            aria-label="Close navigation menu"
                        >
                            <X size={18} />
                        </button>
                        <SidebarContent
                            pathname={safePathname}
                            collapsed={false}
                            onNavigate={() => setMobileOpen(false)}
                            onSignOut={() => signOut({ callbackUrl: "/admin/login" })}
                        />
                    </aside>
                </div>
            )}
        </>
    );
}
