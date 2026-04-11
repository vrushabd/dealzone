"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
    Zap, LayoutDashboard, ShoppingBag, BookOpen, Tag,
    LogOut, ExternalLink, Menu, X, ChevronRight, Link2, BarChart3,
} from "lucide-react";
import { GlobalThemeToggle } from "@/components/admin/GlobalThemeToggle";

const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/admin/products", label: "Products", icon: ShoppingBag },
    { href: "/admin/add-product", label: "Add via URL", icon: Link2 },
    { href: "/admin/posts", label: "Blog Posts", icon: BookOpen },
    { href: "/admin/categories", label: "Categories", icon: Tag },
    { href: "/admin/affiliate", label: "Affiliate Links", icon: BarChart3 },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (href: string, exact?: boolean) =>
        exact ? pathname === href : pathname.startsWith(href);

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className={`flex items-center gap-2.5 px-4 py-5 border-b border-gray-800 ${collapsed ? "justify-center" : ""}`}>
                <div className="w-8 h-8 bg-gradient-to-br from-[hsl(214_89%_52%)] to-[hsl(214_89%_45%)] rounded-lg flex items-center justify-center flex-shrink-0 shadow shadow-orange-500/25">
                    <Zap size={16} className="text-white" />
                </div>
                {!collapsed && <span className="text-base font-bold gradient-text">DealZone</span>}
            </div>

            {/* Nav items */}
            <nav className="flex-1 p-3 space-y-1">
                {navItems.map(({ href, label, icon: Icon, exact }) => {
                    const active = isActive(href, exact);
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group relative
                ${active
                                    ? "bg-[hsl(214_89%_52%/0.12)] text-[hsl(214_89%_55%)] shadow-sm"
                                    : "text-gray-400 hover:text-gray-100 hover:bg-gray-800/70"
                                }`}
                        >
                            {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[hsl(214_89%_52%)] rounded-r-full" />}
                            <Icon size={17} className={`flex-shrink-0 ${active ? "text-[hsl(214_89%_55%)]" : "text-gray-500 group-hover:text-gray-300"}`} />
                            {!collapsed && <span>{label}</span>}
                            {!collapsed && active && <ChevronRight size={14} className="ml-auto text-[hsl(214_89%_55%)]/60" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer actions */}
            <div className="p-3 border-t border-gray-800 space-y-1">
                <a
                    href="/"
                    target="_blank"
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-gray-400 hover:text-gray-100 hover:bg-gray-800/70 transition-all"
                >
                    <ExternalLink size={17} className="text-gray-500 flex-shrink-0" />
                    {!collapsed && <span>View Site</span>}
                </a>
                
                <div className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-gray-400 hover:text-gray-100 hover:bg-gray-800/70 transition-all">
                    <GlobalThemeToggle />
                    {!collapsed && <span>Global Default Theme</span>}
                </div>

                <button
                    onClick={() => signOut({ callbackUrl: "/admin/login" })}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                    <LogOut size={17} className="text-gray-500 flex-shrink-0" />
                    {!collapsed && <span>Sign Out</span>}
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop sidebar */}
            <aside
                className={`hidden lg:flex flex-col flex-shrink-0 h-screen sticky top-0 bg-gray-900 border-r border-gray-800 transition-all duration-300 ${collapsed ? "w-16" : "w-56"}`}
            >
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-6 w-6 h-6 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white z-10 transition-colors"
                >
                    {collapsed ? <ChevronRight size={12} /> : <X size={12} />}
                </button>
                <SidebarContent />
            </aside>

            {/* Mobile top bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900 border-b border-gray-800 flex items-center gap-3 px-4 py-3">
                <button onClick={() => setMobileOpen(true)} className="text-gray-400 hover:text-white transition-colors">
                    <Menu size={22} />
                </button>
                <span className="font-bold gradient-text">DealZone Admin</span>
            </div>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <aside className="relative w-64 bg-gray-900 h-full">
                        <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                            <X size={20} />
                        </button>
                        <SidebarContent />
                    </aside>
                </div>
            )}
        </>
    );
}
