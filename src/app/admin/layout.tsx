import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    // Note: Authentication is now handled by src/middleware.ts
    // This layout is shared by all /admin routes including /admin/login
    // We only show the sidebar if we are NOT on the login page
    // However, for simplicity and to avoid layout shifts, we keep it basic
    // or we can use a (protected) group. For now, let's just make it stable.

    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] md:flex">
            <AdminSidebar />
            <main className="flex-1 min-h-screen overflow-y-auto">
                <div className="p-4 sm:p-6 md:p-8 pt-20 md:pt-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
