import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import Link from "next/link";
import { Filter } from "lucide-react";

export const metadata: Metadata = {
    title: "All Deals – Amazon & Flipkart Offers",
    description: "Browse all handpicked deals from Amazon and Flipkart with maximum discounts. Updated daily.",
};

export const revalidate = 60;

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ category?: string; featured?: string; sort?: string }>;
}) {
    const sp = await searchParams;
    const { category, featured, sort } = sp;

    const [products, categories] = await Promise.all([
        prisma.product.findMany({
            where: {
                isPublic: true,
                ...(category && { category: { slug: category } }),
                ...(featured === "true" && { featured: true }),
            },
            include: { category: true },
            orderBy: sort === "price_asc" ? { price: "asc" } : sort === "price_desc" ? { price: "desc" } : { createdAt: "desc" },
        }),
        prisma.category.findMany({ orderBy: { name: "asc" } }),
    ]);

    return (
        <>
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">All Deals</h1>
                    <p className="text-[var(--text-secondary)]">{products.length} deals found</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <aside className="lg:w-56 flex-shrink-0">
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md p-5 sticky top-24">
                            <div className="flex items-center gap-2 mb-4">
                                <Filter size={16} className="text-[hsl(214_89%_55%)]" />
                                <h2 className="font-semibold text-[var(--text-primary)]">Filters</h2>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">Category</h3>
                                <div className="space-y-1">
                                    <Link href="/products" className={`block px-3 py-1.5 rounded-lg text-sm transition-colors ${!category ? "bg-[hsl(214_89%_52%)] text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"}`}>
                                        All
                                    </Link>
                                    {categories.map((cat) => (
                                        <Link
                                            key={cat.id}
                                            href={`/products?category=${cat.slug}`}
                                            className={`block px-3 py-1.5 rounded-lg text-sm transition-colors ${category === cat.slug ? "bg-[hsl(214_89%_52%)] text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"}`}
                                        >
                                            {cat.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">Sort by</h3>
                                <div className="space-y-1">
                                    {[
                                        { label: "Newest", value: "" },
                                        { label: "Price: Low to High", value: "price_asc" },
                                        { label: "Price: High to Low", value: "price_desc" },
                                    ].map((s) => (
                                        <Link
                                            key={s.value}
                                            href={`/products?${category ? `category=${category}&` : ""}sort=${s.value}`}
                                            className={`block px-3 py-1.5 rounded-lg text-sm transition-colors ${(sort || "") === s.value ? "bg-[hsl(214_89%_52%)] text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"}`}
                                        >
                                            {s.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Products Grid */}
                    <div className="flex-1">
                        {products.length === 0 ? (
                            <div className="text-center py-24 text-gray-500">
                                <p className="text-lg">No deals found in this category.</p>
                                <Link href="/products" className="text-[hsl(214_89%_55%)] hover:text-[hsl(214_89%_60%)] mt-4 inline-block">
                                    Browse all deals →
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {products.map((p) => (
                                    <ProductCard key={p.id} product={p} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
