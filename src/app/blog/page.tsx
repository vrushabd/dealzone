import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { BookOpen, Calendar } from "lucide-react";

export const metadata: Metadata = {
    title: "Blog – Shopping Tips & Deals",
    description: "Read our latest shopping tips, deal guides, and product reviews to save more money.",
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
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex items-center gap-3 mb-2">
                    <BookOpen size={28} className="text-orange-400" />
                    <h1 className="text-3xl font-bold text-white">Blog</h1>
                </div>
                <p className="text-gray-400 mb-10">Shopping tips, deal guides, and product reviews</p>

                {posts.length === 0 ? (
                    <div className="text-center py-24 text-gray-500">
                        <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No blog posts yet. Check back soon!</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {posts.map((post) => (
                            <Link
                                key={post.id}
                                href={`/blog/${post.slug}`}
                                className="block group bg-gray-900 border border-gray-800 hover:border-orange-500/30 rounded-2xl overflow-hidden transition-all card-glow"
                            >
                                <div className="flex flex-col sm:flex-row">
                                    {post.image && (
                                        <div className="relative sm:w-56 aspect-video sm:aspect-auto flex-shrink-0 bg-gray-800">
                                            <Image src={post.image} alt={post.title} fill className="object-cover" />
                                        </div>
                                    )}
                                    <div className="p-6 flex flex-col justify-center">
                                        <h2 className="text-xl font-bold text-gray-100 group-hover:text-orange-400 transition-colors mb-2 line-clamp-2">
                                            {post.title}
                                        </h2>
                                        {post.excerpt && (
                                            <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
                                        )}
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <Calendar size={12} />
                                            {new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                                        </div>
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
