import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
    ShoppingBag, BookOpen, Tag, TrendingUp,
    Plus, ArrowRight, Star,
} from "lucide-react";

export default async function AdminDashboard() {
    const session = await getServerSession(authOptions);
    const [productCount, postCount, categoryCount, recentProducts, featuredCount] = await Promise.all([
        prisma.product.count(),
        prisma.post.count(),
        prisma.category.count(),
        prisma.product.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: { category: true },
        }),
        prisma.product.count({ where: { featured: true } }),
    ]);

    const stats = [
        { label: "Total Products", value: productCount, icon: ShoppingBag, href: "/admin/products", color: "orange" },
        { label: "Blog Posts", value: postCount, icon: BookOpen, href: "/admin/posts", color: "blue" },
        { label: "Categories", value: categoryCount, icon: Tag, href: "/admin/categories", color: "purple" },
        { label: "Featured", value: featuredCount, icon: Star, href: "/admin/products", color: "yellow" },
    ];

    const colorMap: Record<string, string> = {
        orange: "from-orange-500/20 to-orange-600/5 border-orange-500/20 text-orange-400",
        blue: "from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400",
        purple: "from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400",
        yellow: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/20 text-yellow-400",
    };

    return (
        <div className="animate-fade-in-up lg:pt-0 pt-16">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">
                    Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"} 👋
                </h1>
                <p className="text-gray-400 mt-1">Here's what's happening with your store.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
                {stats.map(({ label, value, icon: Icon, href, color }) => (
                    <Link
                        key={label}
                        href={href}
                        className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-5 hover:scale-[1.02] transition-all duration-200 animate-fade-in-up`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <Icon size={20} className="opacity-80" />
                            <TrendingUp size={14} className="opacity-40" />
                        </div>
                        <div className="text-3xl font-extrabold text-white">{value}</div>
                        <div className="text-sm opacity-70 mt-1">{label}</div>
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                    { href: "/admin/products", label: "Add Product", icon: ShoppingBag, desc: "Upload new affiliate deal" },
                    { href: "/admin/posts", label: "New Post", icon: BookOpen, desc: "Write a blog post" },
                    { href: "/admin/categories", label: "Add Category", icon: Tag, desc: "Organise your products" },
                ].map(({ href, label, icon: Icon, desc }) => (
                    <Link
                        key={href}
                        href={href}
                        className="glass rounded-2xl p-5 flex items-center gap-4 hover:border-orange-500/30 transition-all duration-200 hover:bg-gray-800/60 group"
                    >
                        <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500/20 transition-colors">
                            <Plus size={18} className="text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-200 text-sm group-hover:text-orange-400 transition-colors">{label}</div>
                            <div className="text-xs text-gray-500">{desc}</div>
                        </div>
                        <ArrowRight size={16} className="text-gray-600 group-hover:text-orange-400 transition-colors flex-shrink-0" />
                    </Link>
                ))}
            </div>

            {/* Recent Products */}
            <div className="glass rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                    <h2 className="font-semibold text-gray-200">Recent Products</h2>
                    <Link href="/admin/products" className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors">
                        View all <ArrowRight size={12} />
                    </Link>
                </div>

                {recentProducts.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 text-sm">
                        No products yet. <Link href="/admin/products" className="text-orange-400 hover:underline">Add your first deal →</Link>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-800">
                        {recentProducts.map((p) => (
                            <div key={p.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-800/30 transition-colors">
                                <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {p.image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={p.image} alt={p.title} className="w-full h-full object-contain p-1" />
                                    ) : (
                                        <ShoppingBag size={16} className="text-gray-600" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-200 text-sm line-clamp-1">{p.title}</div>
                                    <div className="text-xs text-gray-500">{p.category?.name || "Uncategorised"}</div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    {p.price && (
                                        <div className="text-orange-400 text-sm font-semibold">₹{p.price.toLocaleString("en-IN")}</div>
                                    )}
                                    <div className="flex gap-1 mt-1 justify-end">
                                        {p.amazonLink && <span className="text-xs bg-yellow-500/15 text-yellow-400 px-1.5 py-0.5 rounded-full">AMZ</span>}
                                        {p.flipkartLink && <span className="text-xs bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded-full">FK</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
