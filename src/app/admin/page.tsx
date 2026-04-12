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
        orange: "from-[var(--brand-glow)] to-[var(--bg-base)] border-[var(--brand-glow-strong)] text-[var(--brand)]",
        blue: "from-blue-500/10 to-[var(--bg-base)] border-blue-500/20 text-blue-600 dark:text-blue-400",
        purple: "from-purple-500/10 to-[var(--bg-base)] border-purple-500/20 text-purple-600 dark:text-purple-400",
        yellow: "from-[var(--warning)]/10 to-[var(--bg-base)] border-[var(--warning)]/20 text-[var(--warning)]",
    };

    return (
        <div className="animate-fade-in-up">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                    Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"} 👋
                </h1>
                <p className="text-[var(--text-secondary)] mt-1">Here's what's happening with your store.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
                {stats.map(({ label, value, icon: Icon, href, color }) => (
                    <Link
                        key={label}
                        href={href}
                        className={`bg-gradient-to-br ${colorMap[color]} border rounded-md p-5 hover:scale-[1.02] transition-all duration-200 animate-fade-in-up`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <Icon size={20} className="opacity-80" />
                            <TrendingUp size={14} className="opacity-40" />
                        </div>
                        <div className="text-3xl font-extrabold text-[var(--text-primary)]">{value}</div>
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
                        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md p-5 flex items-center gap-4 hover:border-[hsl(214_89%_52%/0.30)] transition-all duration-200 hover:bg-[var(--bg-card-hover)] group"
                    >
                        <div className="w-10 h-10 bg-[var(--brand-glow)] rounded-md flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--brand)]/20 transition-colors">
                            <Plus size={18} className="text-[var(--brand)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[var(--text-primary)] text-sm group-hover:text-[hsl(214_89%_55%)] transition-colors">{label}</div>
                            <div className="text-xs text-[var(--text-secondary)]">{desc}</div>
                        </div>
                        <ArrowRight size={16} className="text-[var(--text-muted)] group-hover:text-[hsl(214_89%_55%)] transition-colors flex-shrink-0" />
                    </Link>
                ))}
            </div>

            {/* Recent Products */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                    <h2 className="font-semibold text-[var(--text-primary)]">Recent Products</h2>
                    <Link href="/admin/products" className="text-xs text-[hsl(214_89%_55%)] hover:text-[hsl(214_89%_62%)] flex items-center gap-1 transition-colors">
                        View all <ArrowRight size={12} />
                    </Link>
                </div>

                {recentProducts.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 text-sm">
                        No products yet. <Link href="/admin/products" className="text-[hsl(214_89%_55%)] hover:underline">Add your first deal →</Link>
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--border)]">
                        {recentProducts.map((p) => (
                            <div key={p.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--bg-base)]/50 transition-colors">
                                <div className="w-10 h-10 bg-[var(--bg-base)] rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {p.image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={p.image} alt={p.title} className="w-full h-full object-contain p-1" />
                                    ) : (
                                        <ShoppingBag size={16} className="text-gray-600" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-[var(--text-primary)] text-sm line-clamp-1">{p.title}</div>
                                    <div className="text-xs text-[var(--text-secondary)]">{p.category?.name || "Uncategorised"}</div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    {p.price && (
                                        <div className="text-[hsl(214_89%_55%)] text-sm font-semibold">₹{p.price.toLocaleString("en-IN")}</div>
                                    )}
                                    <div className="flex gap-1 mt-1 justify-end">
                                        {p.amazonLink && <span className="text-[10px] bg-[var(--warning)]/15 text-[var(--warning)] px-1.5 py-0.5 rounded-full font-bold">AMZ</span>}
                                        {p.flipkartLink && <span className="text-[10px] bg-[var(--brand)]/15 text-[var(--brand)] px-1.5 py-0.5 rounded-full font-bold">FK</span>}
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
