import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
    ShoppingBag, BookOpen, Tag, TrendingUp,
    Plus, ArrowRight, Star, Users, Monitor, BarChart3, Activity
} from "lucide-react";

import SyncButton from "@/components/admin/SyncButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const productListSelect = {
    id: true,
    title: true,
    slug: true,
    image: true,
    price: true,
    featured: true,
    category: {
        select: { name: true },
    },
};

export default async function AdminDashboard() {
    const session = await getServerSession(authOptions);
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    const startOfWeek = new Date(new Date().setDate(new Date().getDate() - 7));
    const startOfMonth = new Date(new Date().setMonth(new Date().getMonth() - 1));

    // Split queries to avoid hitting EMAXCONNSESSION (15 limit) and add error handling
    let productCount = 0, postCount = 0, categoryCount = 0, featuredCount = 0, totalClicks = 0;
    try {
        const stats_counts = await Promise.all([
            prisma.product.count(),
            prisma.post.count(),
            prisma.category.count(),
            prisma.product.count({ where: { featured: true } }),
            prisma.affiliateClick.count(),
        ]);
        [productCount, postCount, categoryCount, featuredCount, totalClicks] = stats_counts;
    } catch (e) {
        console.error("Dashboard stats error:", e);
    }

    let dailyViews = 0, weeklyViews = 0, monthlyViews = 0, onlineUsers = 0;
    try {
        const views_counts = await Promise.all([
            prisma.pageView.count({ where: { timestamp: { gte: startOfToday } } }),
            prisma.pageView.count({ where: { timestamp: { gte: startOfWeek } } }),
            prisma.pageView.count({ where: { timestamp: { gte: startOfMonth } } }),
            prisma.pageView.groupBy({
                by: ['sessionId'],
                where: { timestamp: { gte: fifteenMinutesAgo } },
            }).then(res => res.length),
        ]);
        [dailyViews, weeklyViews, monthlyViews, onlineUsers] = views_counts;
    } catch (e) {
        console.error("Dashboard views error:", e);
    }

    let recentProducts: any[] = [], trendingProducts: any[] = [];
    try {
        const products_data = await Promise.all([
            prisma.product.findMany({
                take: 5,
                orderBy: { createdAt: "desc" },
                select: productListSelect,
            }),
            prisma.product.findMany({
                where: { affiliateClicks: { some: {} } },
                take: 5,
                orderBy: { affiliateClicks: { _count: 'desc' } },
                include: { 
                    _count: { select: { affiliateClicks: true } },
                    category: { select: { name: true } },
                }
            })
        ]);
        [recentProducts, trendingProducts] = products_data;
    } catch (e) {
        console.error("Dashboard products error:", e);
    }

    const stats = [
        { label: "Total Products", value: productCount, icon: ShoppingBag, href: "/admin/products", color: "orange" },
        { label: "Affiliate Clicks", value: totalClicks, icon: TrendingUp, href: "#", color: "blue" },
        { label: "Featured Deals", value: featuredCount, icon: Star, href: "/admin/products", color: "yellow" },
        { label: "Online Now", value: onlineUsers, icon: Activity, href: "#", color: "green" },
    ];

    const colorMap: Record<string, string> = {
        orange: "from-[var(--brand-glow)] to-[var(--bg-base)] border-[var(--brand-glow-strong)] text-[var(--brand)]",
        blue: "from-blue-500/10 to-[var(--bg-base)] border-blue-500/20 text-blue-600 dark:text-blue-400",
        yellow: "from-[var(--warning)]/10 to-[var(--bg-base)] border-[var(--warning)]/20 text-[var(--warning)]",
        green: "from-green-500/10 to-[var(--bg-base)] border-green-500/20 text-green-600 dark:text-green-400",
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

            {/* Traffic Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                    { label: "Daily Views", value: dailyViews, icon: Monitor, trend: "Visitors today" },
                    { label: "Weekly Views", value: weeklyViews, icon: BarChart3, trend: "Last 7 days" },
                    { label: "Monthly Views", value: monthlyViews, icon: Users, trend: "Last 30 days" },
                ].map(({ label, value, icon: Icon, trend }) => (
                    <div key={label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md p-5 flex items-center justify-between">
                        <div>
                            <div className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider mb-1">{label}</div>
                            <div className="text-2xl font-black text-[var(--text-primary)]">{value.toLocaleString()}</div>
                            <div className="text-[10px] text-[var(--text-muted)] mt-1 flex items-center gap-1">
                                <TrendingUp size={10} className="text-green-500" /> {trend}
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-[var(--bg-elevated)] rounded-full flex items-center justify-center text-[var(--text-muted)]">
                            <Icon size={20} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
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
                <SyncButton />
            </div>


            {/* Recent & Trending Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Trending Leaderboard */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--brand-glow)]/5">
                        <div className="flex items-center gap-2">
                             <TrendingUp size={16} className="text-[var(--brand)]" />
                             <h2 className="font-bold text-[var(--text-primary)]">Trending Now</h2>
                        </div>
                        <span className="text-[10px] font-bold text-[var(--brand)] uppercase tracking-widest">Most Clicked</span>
                    </div>

                    {trendingProducts.length === 0 ? (
                        <div className="py-12 text-center text-[var(--text-muted)] text-sm italic">
                            No affiliate clicks recorded yet correctly.
                        </div>
                    ) : (
                        <div className="divide-y divide-[var(--border)]">
                            {trendingProducts.map((p, idx) => (
                                <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--bg-base)]/50 transition-colors relative group">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--brand)] scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                                    <div className="w-6 text-sm font-black text-[var(--text-muted)] italic">#{idx + 1}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-[var(--text-primary)] text-sm line-clamp-1">{p.title}</div>
                                        <div className="text-[10px] text-[var(--text-muted)] mt-1 flex items-center gap-2">
                                            {p.category?.name} • 
                                            <span className="inline-flex items-center gap-1 text-[var(--brand)] font-bold">
                                                 <Activity size={10} /> {(p as any)._count.affiliateClicks} CLICKS
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-16 h-1 w-16 bg-[var(--bg-elevated)] rounded-full overflow-hidden relative">
                                        <div 
                                            className="absolute inset-y-0 left-0 bg-[var(--brand)] rounded-full" 
                                            style={{ width: `${Math.min(100, ((p as any)._count.affiliateClicks / Math.max(1, totalClicks)) * 400)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
