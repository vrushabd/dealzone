import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import { ArrowLeft } from "lucide-react";

interface Params {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { slug } = await params;
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) return { title: "Category Not Found" };
    return {
        title: `${category.name} Deals – GenzLoots`,
        description: `Browse all ${category.name} deals from Amazon and Flipkart at GenzLoots.`,
    };
}

export const revalidate = 60;

export default async function CategoryPage({ params }: Params) {
    const { slug } = await params;
    const category = await prisma.category.findUnique({
        where: { slug },
        include: { 
            products: { 
                where: { isPublic: true },
                include: { category: true }, 
                orderBy: { createdAt: "desc" } 
            } 
        },
    });

    if (!category) notFound();

    return (
        <>
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <Link href="/categories" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[hsl(214_89%_55%)] text-sm mb-6 transition-colors">
                    <ArrowLeft size={16} /> All Categories
                </Link>

                <div className="flex items-center gap-4 mb-8">
                    <div className="text-4xl">{category.icon || "📦"}</div>
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-primary)]">{category.name}</h1>
                        <p className="text-[var(--text-secondary)] text-sm">{category.products.length} deals</p>
                    </div>
                </div>

                {category.products.length === 0 ? (
                    <div className="text-center py-24 text-[var(--text-muted)]">
                        <p>No deals in this category yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {category.products.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </>
    );
}
