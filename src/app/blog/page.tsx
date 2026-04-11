import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { BookOpen, Calendar, Clock } from "lucide-react";

const BASE = process.env.NEXTAUTH_URL || "https://dealzone.onrender.com";

export const metadata: Metadata = {
    title: "Blog – Shopping Tips, Deal Guides & Reviews | DealZone",
    description: "Read DealZone's expert shopping tips, deal guides, and product reviews to get the best prices on Amazon and Flipkart.",
    alternates: { canonical: `${BASE}/blog` },
    openGraph: {
        title: "DealZone Blog – Shopping Tips & Deal Guides",
        description: "Expert shopping tips, deal guides, and product reviews to save more money on Amazon & Flipkart.",
        url: `${BASE}/blog`,
        type: "website",
    },
};

export const revalidate = 60;

export default async function BlogPage() {
    const posts = await prisma.post.findMany({
        where: { published: true },
        orderBy: { createdAt: "desc" },
    });

    return (
        <>
            <Navbar />
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-16">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-orange-500 font-bold text-xs uppercase tracking-widest mb-2">
                        <BookOpen size={13} />
                        DealZone Blog
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Shopping Tips &amp; Guides</h1>
                    <p className="text-[hsl(215_12%_45%)] text-sm mt-1">Expert deal guides and product reviews — updated regularly.</p>
                </div>

                {posts.length === 0 ? (
                    <div className="text-center py-24 text-[hsl(215_12%_40%)]">
                        <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No blog posts yet. Check back soon!</p>
                    </div>
                ) : (
                    /* 2-per-row on mobile, 3 on desktop */
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {posts.map((post) => (
                            <Link
                                key={post.id}
                                href={`/blog/${post.slug}`}
                                className="group glass border border-[hsl(224_20%_14%)] hover:border-orange-500/30 rounded-2xl overflow-hidden transition-all card-glow flex flex-col"
                            >
                                {/* Image or placeholder */}
                                <div className="relative aspect-video bg-[hsl(224_28%_11%)] flex-shrink-0">
                                    {post.image ? (
                                        <Image src={post.image} alt={post.title} fill className="object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <BookOpen size={28} className="text-[hsl(224_20%_22%)]" />
                                        </div>
                                    )}
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(224_44%_4%/0.6)] to-transparent" />
                                </div>

                                {/* Content */}
                                <div className="p-3 sm:p-5 flex flex-col flex-1">
                                    <h2 className="text-xs sm:text-sm font-bold text-[hsl(210_30%_88%)] group-hover:text-orange-400 transition-colors line-clamp-2 leading-snug mb-2">
                                        {post.title}
                                    </h2>
                                    {post.excerpt && (
                                        <p className="hidden sm:block text-[hsl(215_12%_45%)] text-xs leading-relaxed line-clamp-2 mb-3 flex-1">
                                            {post.excerpt}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-[hsl(215_10%_38%)] mt-auto">
                                        <Calendar size={9} />
                                        {new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </>
    );
}
