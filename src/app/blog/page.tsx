import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { buildMetadata, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";
import { BookOpen, Calendar } from "lucide-react";

export const metadata: Metadata = buildMetadata({
    title: "Shopping Tips, Deal Guides & Product Reviews",
    description: "Read GenzLoots shopping tips, deal guides, product reviews, and price tracking advice for Amazon, Flipkart, and Myntra shoppers.",
    path: "/blog",
});

export const revalidate = 60;

export default async function BlogPage() {
    const posts = await prisma.post.findMany({
        where: { published: true },
        orderBy: { createdAt: "desc" },
    });

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={jsonLdScript(breadcrumbJsonLd([
                    { name: "Home", path: "/" },
                    { name: "Blog", path: "/blog" },
                ]))}
            />
            <Navbar />
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-[hsl(214_89%_52%)] font-bold text-xs uppercase tracking-widest mb-2">
                        <BookOpen size={13} />
                        GenzLoots Blog
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">Shopping Tips &amp; Guides</h1>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">Expert deal guides and product reviews — updated regularly.</p>
                </div>

                {posts.length === 0 ? (
                    <div className="text-center py-24 text-[var(--text-muted)]">
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
                                className="group glass border border-[var(--border)] hover:border-[hsl(214_89%_52%/0.30)] rounded-md overflow-hidden transition-all card-glow flex flex-col"
                            >
                                {/* Image or placeholder */}
                                <div className="relative aspect-video bg-[var(--bg-elevated)] flex-shrink-0">
                                    {post.image ? (
                                        <Image src={post.image} alt={post.title} fill className="object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <BookOpen size={28} className="text-[var(--text-muted)]" />
                                        </div>
                                    )}
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] to-transparent opacity-60" />
                                </div>

                                {/* Content */}
                                <div className="p-3 sm:p-5 flex flex-col flex-1">
                                    <h2 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] group-hover:text-[hsl(214_89%_55%)] transition-colors line-clamp-2 leading-snug mb-2">
                                        {post.title}
                                    </h2>
                                    {post.excerpt && (
                                        <p className="hidden sm:block text-[var(--text-secondary)] text-xs leading-relaxed line-clamp-2 mb-3 flex-1">
                                            {post.excerpt}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-[var(--text-muted)] mt-auto">
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
