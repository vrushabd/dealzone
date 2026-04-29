"use client";

import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/admin/login";
    const isFullScreenEditor = pathname?.startsWith("/admin/posts/") && pathname !== "/admin/posts";

    const content = isLoginPage ? (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
            {children}
        </div>
    ) : (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] md:flex">
            <AdminSidebar />
            <main className="flex-1 min-h-screen overflow-y-auto">
                <div className={isFullScreenEditor ? "pt-16 md:pt-0" : "p-4 pt-20 sm:p-6 md:p-8 md:pt-8"}>
                    {children}
                </div>
            </main>
        </div>
    );

    return (
        <SessionProvider basePath="/api/auth">
            {content}
        </SessionProvider>
    );
}
