import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
    title: "Categories – DealZone",
    description: "Browse deals by category. Find electronics, fashion, home, beauty and more.",
};

export const revalidate = 60;

export default async function CategoriesPage() {
    const categories = await prisma.category.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { name: "asc" },
    });

    return (
        <>
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <h1 className="text-3xl font-bold text-white mb-2">All Categories</h1>
                <p className="text-gray-400 mb-8">Browse deals by category</p>

                {categories.length === 0 ? (
                    <div className="text-center py-24 text-gray-500">No categories yet.</div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                        {categories.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/categories/${cat.slug}`}
                                className="bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-orange-500/30 rounded-2xl p-6 text-center transition-all group card-glow"
                            >
                                <div className="text-5xl mb-4">{cat.icon || "📦"}</div>
                                <h2 className="font-semibold text-gray-200 group-hover:text-orange-400 transition-colors mb-1">{cat.name}</h2>
                                <p className="text-xs text-gray-500">{cat._count.products} deals</p>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </>
    );
}
