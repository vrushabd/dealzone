import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CategoryIcon from "@/components/ui/CategoryIcon";
import { buildMetadata, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";
import { Tag } from "lucide-react";

export const metadata: Metadata = buildMetadata({
    title: "Shopping Deal Categories",
    description: "Browse online deals by category including electronics, fashion, home and kitchen, beauty, gaming, books, smartphones, and more.",
    path: "/categories",
});

export const revalidate = 60;

export default async function CategoriesPage() {
    const categories = await prisma.category.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { name: "asc" },
    });

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={jsonLdScript(breadcrumbJsonLd([
                    { name: "Home", path: "/" },
                    { name: "Categories", path: "/categories" },
                ]))}
            />
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-[hsl(214_89%_52%)] font-bold text-xs uppercase tracking-widest mb-2">
                        <Tag size={13} />
                        Browse
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">All Categories</h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">Find deals across every category</p>
                </div>

                {categories.length === 0 ? (
                    <div className="text-center py-24 text-[var(--text-muted)]">No categories yet.</div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {categories.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/categories/${cat.slug}`}
                                className="group glass border border-[var(--border)] hover:border-[hsl(214_89%_52%/0.30)] rounded-md p-5 text-center transition-all duration-200 card-glow flex flex-col items-center"
                            >
                                <CategoryIcon slug={cat.slug} variant="page" />
                                <h2 className="font-bold text-[var(--text-primary)] group-hover:text-[hsl(214_89%_55%)] transition-colors mt-3 text-sm">
                                    {cat.name}
                                </h2>
                                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                                    {cat._count.products} deals
                                </p>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </>
    );
}
