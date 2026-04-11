"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import Link from "next/link";
import { Search, BookOpen } from "lucide-react";

interface Product {
    id: string; title: string; slug: string; description?: string | null;
    image?: string | null; price?: number | null; originalPrice?: number | null;
    discount?: number | null; amazonLink?: string | null; flipkartLink?: string | null;
    category?: { name: string; slug: string } | null;
}
interface Post { id: string; title: string; slug: string; excerpt?: string | null; }

function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";
    const [products, setProducts] = useState<Product[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!query) return;
        setLoading(true);
        Promise.all([
            fetch(`/api/products?search=${encodeURIComponent(query)}`).then((r) => r.json()),
            fetch(`/api/posts?search=${encodeURIComponent(query)}`).then((r) => r.json()),
        ]).then(([p, b]) => { setProducts(p); setPosts(b); setLoading(false); });
    }, [query]);

    if (!query) {
        return (
            <div className="text-center py-24 text-gray-500">
                <Search size={48} className="mx-auto mb-4 opacity-30" />
                <p>Enter a search term above</p>
            </div>
        );
    }

    if (loading) return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-900 rounded-2xl aspect-square skeleton" />
            ))}
        </div>
    );

    return (
        <>
            <p className="text-gray-400 mb-8">
                Found <span className="text-white font-semibold">{products.length}</span> products and <span className="text-white font-semibold">{posts.length}</span> posts for &quot;<span className="text-orange-400">{query}</span>&quot;
            </p>

            {products.length > 0 && (
                <section className="mb-12">
                    <h2 className="text-xl font-bold text-white mb-6">Products</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.map((p) => <ProductCard key={p.id} product={p} />)}
                    </div>
                </section>
            )}

            {posts.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold text-white mb-6">Blog Posts</h2>
                    <div className="space-y-4">
                        {posts.map((post) => (
                            <Link key={post.id} href={`/blog/${post.slug}`} className="block bg-gray-900 border border-gray-800 hover:border-orange-500/30 rounded-xl p-4 transition-all">
                                <div className="flex items-start gap-3">
                                    <BookOpen size={18} className="text-orange-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-semibold text-gray-100 hover:text-orange-400 transition-colors">{post.title}</h3>
                                        {post.excerpt && <p className="text-gray-500 text-sm mt-1">{post.excerpt}</p>}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {products.length === 0 && posts.length === 0 && (
                <div className="text-center py-24 text-gray-500">
                    <p>No results found. Try a different search term.</p>
                </div>
            )}
        </>
    );
}

export default function SearchPage() {
    return (
        <>
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <h1 className="text-3xl font-bold text-white mb-8">Search Results</h1>
                <Suspense fallback={<div className="text-center py-12 text-gray-500">Searching...</div>}>
                    <SearchResults />
                </Suspense>
            </main>
            <Footer />
        </>
    );
}
