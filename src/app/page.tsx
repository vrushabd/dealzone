import { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import {
    ArrowRight, Zap, TrendingUp, Star, Tag,
    ShoppingBag, Sparkles, Clock
} from "lucide-react";
import CategoryIcon from "@/components/ui/CategoryIcon";

export const metadata: Metadata = {
    title: "DealZone – Best Amazon & Flipkart Deals",
    description: "Discover the best deals and discounts from Amazon & Flipkart. Handpicked deals updated daily.",
};

export const revalidate = 60;

export default async function HomePage() {
    const [featuredProducts, categories, recentPosts] = await Promise.all([
        prisma.product.findMany({
            where: { featured: true },
            include: { category: true },
            orderBy: { createdAt: "desc" },
            take: 8,
        }),
        prisma.category.findMany({
            include: { _count: { select: { products: true } } },
            take: 6,
        }),
        prisma.post.findMany({
            where: { published: true },
            orderBy: { createdAt: "desc" },
            take: 3,
        }),
    ]).catch((err) => {
        console.error("❌ Prisma fetch error on homepage:", err.message);
        return [[], [], []];
    });

    const latestProducts = await prisma.product.findMany({
        where: { featured: false },
        include: { category: true },
        orderBy: { createdAt: "desc" },
        take: 8,
    }).catch(() => []);

    return (
        <>
            <Navbar />
            <main className="bg-[hsl(224_44%_4%)] pb-20">

                {/* ── Page Header ─────────────────────────────── */}
                <section className="border-b border-[hsl(224_20%_11%)] bg-[hsl(224_32%_7%)]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg font-bold text-white flex items-center gap-2">
                                <Zap size={18} className="text-orange-500" fill="currentColor" />
                                Today&apos;s Top Deals
                            </h1>
                            <div className="inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full px-2.5 py-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-[pulseDot_1.5s_ease-in-out_infinite]" />
                                <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">Updated Daily</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                href="/products"
                                className="btn-primary shine-on-hover px-4 py-2 text-xs"
                            >
                                <ShoppingBag size={13} />
                                All Deals
                            </Link>
                            <Link
                                href="/coupons"
                                className="inline-flex items-center gap-1.5 bg-[hsl(224_25%_12%)] hover:bg-[hsl(224_22%_15%)] border border-[hsl(224_20%_18%)] text-[hsl(210_30%_88%)] text-xs font-semibold px-4 py-2 rounded-xl transition-all duration-200"
                            >
                                <Tag size={12} className="text-orange-400" />
                                Coupons
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── Category Bar ────────────────────────────── */}
                <section className="bg-[hsl(224_44%_4%/0.97)] border-b border-[hsl(224_20%_11%)] sticky top-14 z-40 backdrop-blur-xl">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 overflow-x-auto no-scrollbar">
                        <span className="text-[10px] font-semibold text-[hsl(215_12%_38%)] uppercase tracking-widest whitespace-nowrap flex-shrink-0">
                            Browse:
                        </span>
                        {(categories as any[]).map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/categories/${cat.slug}`}
                                className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-[hsl(215_15%_52%)] hover:text-white transition-all duration-200 py-1.5 px-3 rounded-full hover:bg-[hsl(24_95%_53%/0.1)] border border-transparent hover:border-[hsl(24_75%_53%/0.25)] flex-shrink-0"
                            >
                                <CategoryIcon slug={cat.slug} variant="bar" />
                                <span>{cat.name}</span>
                                {cat._count?.products > 0 && (
                                    <span className="text-[9px] text-[hsl(215_10%_35%)]">
                                        ({cat._count.products})
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                </section>

                {/* ── Main Content ─────────────────────────────── */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">

                        {/* Main Feed — full width on mobile, 3 cols on desktop */}
                        <div className="lg:col-span-3 space-y-10 order-1 lg:order-1">

                            {/* Featured */}
                            {(featuredProducts as any[]).length > 0 && (
                                <section>
                                    <div className="flex items-center justify-between mb-5">
                                        <h2 className="section-title">
                                            <Star size={16} className="text-yellow-400 ml-2" fill="currentColor" />
                                            Featured Highlights
                                        </h2>
                                        <Link
                                            href="/products?featured=true"
                                            className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors"
                                        >
                                            See all <ArrowRight size={12} />
                                        </Link>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger-children">
                                        {(featuredProducts as any[]).map((product) => (
                                            <div key={product.id} className="animate-fade-in-up">
                                                <ProductCard product={product} />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Just Added */}
                            <section>
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="section-title">
                                        <TrendingUp size={16} className="text-orange-500 ml-2" />
                                        Just Added
                                    </h2>
                                    <Link
                                        href="/products"
                                        className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors"
                                    >
                                        All deals <ArrowRight size={12} />
                                    </Link>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger-children">
                                    {(latestProducts as any[]).map((product) => (
                                        <div key={product.id} className="animate-fade-in-up">
                                            <ProductCard product={product} />
                                        </div>
                                    ))}
                                    {latestProducts.length === 0 && featuredProducts.length === 0 && (
                                        <div className="col-span-full py-24 text-center border-2 border-dashed border-[hsl(224_20%_13%)] rounded-3xl">
                                            <div className="w-16 h-16 bg-[hsl(224_25%_12%)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <Zap size={32} className="text-[hsl(224_20%_22%)]" />
                                            </div>
                                            <h3 className="text-[hsl(215_15%_45%)] font-semibold text-sm">
                                                New deals incoming...
                                            </h3>
                                            <p className="text-[hsl(215_12%_35%)] text-xs mt-1">
                                                Run <code className="bg-[hsl(224_25%_12%)] px-1 rounded text-orange-400">npm run seed</code> to populate
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Sidebar — below feed on mobile, right on desktop */}
                        <aside className="space-y-4 order-2 lg:order-2">

                            {/* Blog / Shopping Tips */}
                            <div className="glass rounded-2xl p-5 shadow-[0_4px_24px_hsl(224_44%_0%/0.4)]">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-white mb-4">
                                    <Sparkles size={14} className="text-orange-400" />
                                    Shopping Tips
                                </h3>
                                <div className="space-y-4">
                                    {(recentPosts as any[]).map((post) => (
                                        <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                                            <h4 className="text-xs font-medium text-[hsl(215_15%_65%)] group-hover:text-orange-400 line-clamp-2 transition-colors leading-snug">
                                                {post.title}
                                            </h4>
                                            <div className="flex items-center gap-1 text-[9px] text-[hsl(215_10%_38%)] mt-1.5">
                                                <Clock size={8} />
                                                {new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                            </div>
                                        </Link>
                                    ))}
                                    {recentPosts.length === 0 && (
                                        <p className="text-xs text-[hsl(215_10%_38%)]">No posts yet.</p>
                                    )}
                                </div>
                                <Link
                                    href="/blog"
                                    className="flex items-center justify-center gap-1 text-xs text-orange-500 font-bold mt-5 hover:text-orange-400 transition-colors"
                                >
                                    Visit Blog <ArrowRight size={11} />
                                </Link>
                            </div>

                            {/* Top Categories */}
                            <div className="glass rounded-2xl p-5 shadow-[0_4px_24px_hsl(224_44%_0%/0.4)]">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-white mb-4">
                                    <Tag size={14} className="text-orange-400" />
                                    Top Categories
                                </h3>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {(categories as any[]).map((cat) => (
                                        <Link
                                            key={cat.id}
                                            href={`/categories/${cat.slug}`}
                                            className="group bg-[hsl(224_28%_11%)] hover:bg-[hsl(24_95%_53%/0.08)] border border-[hsl(224_20%_14%)] hover:border-[hsl(24_75%_53%/0.3)] rounded-xl p-3 text-center transition-all duration-200"
                                        >
                                            <CategoryIcon slug={cat.slug} variant="card" />
                                            <div className="text-[10px] font-bold text-[hsl(215_15%_45%)] group-hover:text-white uppercase tracking-tight transition-colors">
                                                {cat.name}
                                            </div>
                                            {cat._count?.products > 0 && (
                                                <div className="text-[9px] text-[hsl(215_10%_32%)] mt-0.5">
                                                    {cat._count.products} deals
                                                </div>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* CTA Banner */}
                            <div className="glass-brand rounded-2xl p-5 text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
                                <div className="relative">
                                    <div className="w-10 h-10 bg-orange-500/15 rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <Zap size={20} className="text-orange-400" fill="currentColor" />
                                    </div>
                                    <h4 className="text-white font-bold text-sm mb-1">Never Miss a Deal</h4>
                                    <p className="text-[hsl(215_12%_48%)] text-xs leading-relaxed mb-4">
                                        Set price alerts on any product and we&apos;ll notify you when it drops.
                                    </p>
                                    <Link
                                        href="/products"
                                        className="btn-primary shine-on-hover w-full py-2.5 text-xs"
                                    >
                                        Set Alert
                                    </Link>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
