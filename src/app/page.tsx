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
            where: { featured: true, isPublic: true },
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
        where: { featured: false, isPublic: true },
        include: { category: true },
        orderBy: { createdAt: "desc" },
        take: 8,
    }).catch(() => []);

    return (
        <>
            <Navbar />
            <main className="bg-[var(--bg-base)] pb-20">

                {/* ── Page Header ─────────────────────────────── */}
                <section className="border-b border-[var(--border)] bg-[var(--bg-surface)]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <Zap size={18} className="text-[hsl(214_89%_52%)]" fill="currentColor" />
                                Today&apos;s Top Deals
                            </h1>
                            <div className="inline-flex items-center gap-1.5 bg-[hsl(214_89%_52%/0.08)] border border-[hsl(214_89%_52%/0.20)] rounded-full px-2.5 py-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(214_89%_52%)] animate-[pulseDot_1.5s_ease-in-out_infinite]" />
                                <span className="text-[10px] font-semibold text-[hsl(214_89%_55%)] uppercase tracking-wider">Updated Daily</span>
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
                                className="inline-flex items-center gap-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-semibold px-4 py-2 rounded-md transition-all duration-200"
                            >
                                <Tag size={12} className="text-[hsl(214_89%_55%)]" />
                                Coupons
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ── Category Bar ────────────────────────────── */}
                <section className="bg-[var(--bg-base)]/95 border-b border-[var(--border)] sticky top-14 z-40 backdrop-blur-xl">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 overflow-x-auto no-scrollbar">
                        <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest whitespace-nowrap flex-shrink-0">
                            Browse:
                        </span>
                        {(categories as any[]).map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/categories/${cat.slug}`}
                                className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all duration-200 py-1.5 px-3 rounded-full hover:bg-[hsl(24_95%_53%/0.1)] border border-transparent hover:border-[hsl(214_89%_52%/0.20)] flex-shrink-0"
                            >
                                <CategoryIcon slug={cat.slug} variant="bar" />
                                <span>{cat.name}</span>
                                {cat._count?.products > 0 && (
                                    <span className="text-[9px] text-[var(--text-muted)]">
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
                                            className="flex items-center gap-1 text-xs text-[hsl(214_89%_55%)] hover:text-[hsl(214_89%_60%)] font-medium transition-colors"
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
                                        <TrendingUp size={16} className="text-[hsl(214_89%_52%)] ml-2" />
                                        Just Added
                                    </h2>
                                    <Link
                                        href="/products"
                                        className="flex items-center gap-1 text-xs text-[hsl(214_89%_55%)] hover:text-[hsl(214_89%_60%)] font-medium transition-colors"
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
                                        <div className="col-span-full py-24 text-center border-2 border-dashed border-[var(--border)] rounded-lg">
                                            <div className="w-16 h-16 bg-[var(--bg-elevated)] rounded-md flex items-center justify-center mx-auto mb-4">
                                                <Zap size={32} className="text-[hsl(224_20%_22%)]" />
                                            </div>
                                            <h3 className="text-[var(--text-muted)] font-semibold text-sm">
                                                New deals incoming...
                                            </h3>
                                            <p className="text-[var(--text-muted)] text-xs mt-1">
                                                Run <code className="bg-[var(--bg-elevated)] px-1 rounded text-[hsl(214_89%_55%)]">npm run seed</code> to populate
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Sidebar — below feed on mobile, right on desktop */}
                        <aside className="space-y-4 order-2 lg:order-2">

                            {/* Blog / Shopping Tips */}
                            <div className="glass rounded-md p-5 shadow-[0_4px_24px_hsl(224_44%_0%/0.4)]">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] mb-4">
                                    <Sparkles size={14} className="text-[hsl(214_89%_55%)]" />
                                    Shopping Tips
                                </h3>
                                <div className="space-y-4">
                                    {(recentPosts as any[]).map((post) => (
                                        <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                                            <h4 className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[hsl(214_89%_55%)] line-clamp-2 transition-colors leading-snug">
                                                {post.title}
                                            </h4>
                                            <div className="flex items-center gap-1 text-[9px] text-[var(--text-muted)] mt-1.5">
                                                <Clock size={8} />
                                                {new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                            </div>
                                        </Link>
                                    ))}
                                    {recentPosts.length === 0 && (
                                        <p className="text-xs text-[var(--text-muted)]">No posts yet.</p>
                                    )}
                                </div>
                                <Link
                                    href="/blog"
                                    className="flex items-center justify-center gap-1 text-xs text-[hsl(214_89%_52%)] font-bold mt-5 hover:text-[hsl(214_89%_55%)] transition-colors"
                                >
                                    Visit Blog <ArrowRight size={11} />
                                </Link>
                            </div>

                            {/* Top Categories */}
                            <div className="glass rounded-md p-5 shadow-[0_4px_24px_hsl(224_44%_0%/0.4)]">
                                <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] mb-4">
                                    <Tag size={14} className="text-[hsl(214_89%_55%)]" />
                                    Top Categories
                                </h3>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {(categories as any[]).map((cat) => (
                                        <Link
                                            key={cat.id}
                                            href={`/categories/${cat.slug}`}
                                            className="group bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] hover:border-[hsl(214_89%_52%/0.30)] rounded-md p-3 text-center transition-all duration-200"
                                        >
                                            <CategoryIcon slug={cat.slug} variant="card" />
                                            <div className="text-[10px] font-bold text-[var(--text-muted)] group-hover:text-[var(--text-primary)] uppercase tracking-tight transition-colors">
                                                {cat.name}
                                            </div>
                                            {cat._count?.products > 0 && (
                                                <div className="text-[9px] text-[var(--text-muted)] mt-0.5">
                                                    {cat._count.products} deals
                                                </div>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* CTA Banner */}
                            <div className="glass-brand rounded-md p-5 text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(214_89%_52%)]/5 to-transparent pointer-events-none" />
                                <div className="relative">
                                    <div className="w-10 h-10 bg-[hsl(214_89%_52%)]/15 rounded-md flex items-center justify-center mx-auto mb-3">
                                        <Zap size={20} className="text-[hsl(214_89%_55%)]" fill="currentColor" />
                                    </div>
                                    <h4 className="text-[var(--text-primary)] font-bold text-sm mb-1">Never Miss a Deal</h4>
                                    <p className="text-[var(--text-muted)] text-xs leading-relaxed mb-4">
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
