import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { absoluteUrl, breadcrumbJsonLd, buildMetadata, jsonLdScript, truncateDescription } from "@/lib/seo";
import { ArrowLeft, Calendar } from "lucide-react";

interface Params {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { slug } = await params;
    const post = await prisma.post.findUnique({ where: { slug, published: true } });
    if (!post) return { title: "Post Not Found" };
    return buildMetadata({
        title: post.title,
        description: truncateDescription(post.excerpt || post.content),
        path: `/blog/${post.slug}`,
        image: post.image,
        type: "article",
    });
}

export const revalidate = 60;

export default async function BlogPostPage({ params }: Params) {
    const { slug } = await params;
    const post = await prisma.post.findUnique({ where: { slug, published: true } });
    if (!post) notFound();

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": absoluteUrl(`/blog/${post.slug}`),
        },
        headline: post.title,
        description: truncateDescription(post.excerpt || post.content),
        image: post.image ? [absoluteUrl(post.image)] : undefined,
        datePublished: post.createdAt.toISOString(),
        dateModified: post.updatedAt.toISOString(),
        author: {
            "@type": "Organization",
            name: "GenzLoots",
        },
        publisher: {
            "@type": "Organization",
            name: "GenzLoots",
            logo: {
                "@type": "ImageObject",
                url: absoluteUrl("/favicon.svg"),
            },
        },
    };

    const breadcrumbJson = breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
        { name: post.title, path: `/blog/${post.slug}` },
    ]);

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript([jsonLd, breadcrumbJson])} />
            <Navbar />
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <Link href="/blog" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[hsl(214_89%_55%)] text-sm mb-8 transition-colors">
                    <ArrowLeft size={16} /> All Posts
                </Link>

                {post.image && (
                    <div className="relative aspect-video rounded-md overflow-hidden mb-8 bg-[var(--bg-elevated)]">
                        <Image src={post.image} alt={post.title} fill className="object-cover" priority />
                    </div>
                )}

                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-4">
                    <Calendar size={12} />
                    {new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] leading-tight mb-6">{post.title}</h1>

                {post.excerpt && (
                    <p className="text-[var(--text-secondary)] text-lg leading-relaxed border-l-4 border-[hsl(214_89%_52%)] pl-4 mb-8">{post.excerpt}</p>
                )}

                <div className="prose prose-orange max-w-none text-[var(--text-primary)] leading-relaxed">
                    {post.content.split("\n").map((para, i) =>
                        para.trim() ? <p key={i} className="mb-4">{para}</p> : <br key={i} />
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
