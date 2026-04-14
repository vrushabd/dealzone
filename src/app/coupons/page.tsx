import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Tag, Copy, ExternalLink, Ticket, Search, Filter, CheckCircle, Zap } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Coupons & Promo Codes – DealZone",
    description: "Find the latest coupons, promo codes and discount deals for Amazon, Flipkart, Myntra and more.",
};

export const revalidate = 3600; // Cache for 1 hour

export default async function CouponsPage() {
    // @ts-ignore - Prisma types may be stale
    const coupons: any[] = await prisma.coupon.findMany({
        where: { isVerified: true },
        orderBy: { createdAt: "desc" },
    });

    const stores = Array.from(new Set(coupons.map((c: any) => c.store))) as string[];

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-[var(--bg-base)] pb-20">
                {/* Header */}
                <section className="bg-[var(--bg-surface)] border-b border-[var(--border)] py-12 md:py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="inline-flex items-center gap-2 bg-[hsl(214_89%_52%/0.08)] border border-[hsl(214_89%_52%/0.20)] rounded-full px-4 py-1.5 mb-6">
                            <Ticket size={16} className="text-[hsl(214_89%_55%)]" />
                            <span className="text-[hsl(214_89%_55%)] text-sm font-medium">Verified Promo Codes</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-extrabold text-[var(--text-primary)] mb-6">
                            Save More with <span className="gradient-text">Exclusive Coupons</span>
                        </h1>
                        <p className="text-[var(--text-secondary)] max-w-2xl mx-auto text-lg">
                            Hand-picked discount codes for your favorite online stores. Updated daily to ensure they work.
                        </p>
                    </div>
                </section>

                {/* Filter & Search Bar */}
                <section className="sticky top-[64px] z-40 bg-[var(--bg-base)]/80 backdrop-blur-md border-b border-[var(--border)]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar w-full md:w-auto">
                                <button className="bg-[hsl(214_89%_52%)] text-white px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap">All Stores</button>
                                {stores.map(store => (
                                    <button key={store} className="bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border border-[var(--border)]">
                                        {store}
                                    </button>
                                ))}
                            </div>
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search coupons..."
                                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-md py-2 pl-10 pr-4 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[hsl(214_89%_52%/0.3)] transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Coupons Grid */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {coupons.map((coupon) => (
                            <div key={coupon.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md overflow-hidden hover:border-[hsl(214_89%_52%/0.30)] transition-all group flex flex-col">
                                <div className="p-6 flex-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-[var(--bg-elevated)] px-3 py-1 rounded-lg text-xs font-bold text-[hsl(214_89%_55%)] uppercase tracking-wider border border-[var(--border)]">
                                                {coupon.store}
                                            </div>
                                            {coupon.isSecret && (
                                                <div className="bg-purple-500/20 px-2 py-1 rounded-lg text-[10px] font-black text-purple-400 uppercase tracking-tighter border border-purple-500/30 flex items-center gap-1 animate-pulse">
                                                    <Zap size={10} fill="currentColor" /> Secret Deal
                                                </div>
                                            )}
                                        </div>
                                        {coupon.isVerified && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase">
                                                <CheckCircle size={10} /> Verified
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 group-hover:text-[hsl(214_89%_55%)] transition-colors">
                                        {coupon.title}
                                    </h3>
                                    {coupon.description && (
                                        <p className="text-[var(--text-secondary)] text-sm line-clamp-2 mb-4">
                                            {coupon.description}
                                        </p>
                                    )}
                                    <div className="bg-[hsl(214_89%_52%)]/5 border border-dashed border-[hsl(214_89%_52%/0.30)] rounded-md p-4 mb-4 text-center">
                                        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-1">Coupon Code</div>
                                        <div className="text-2xl font-mono font-black text-[var(--text-primary)] tracking-widest">{coupon.code}</div>
                                    </div>
                                </div>
                                <div className="p-6 pt-0 mt-auto flex gap-3">
                                    <button className="flex-1 bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] font-bold py-2.5 rounded-md transition-all flex items-center justify-center gap-2 text-sm border border-[var(--border)]">
                                        <Copy size={16} /> Copy Code
                                    </button>
                                    {coupon.link && (
                                        <Link
                                            href={coupon.link}
                                            target="_blank"
                                            className="bg-[hsl(214_89%_52%)] hover:bg-[hsl(214_89%_45%)] text-white p-2.5 rounded-md transition-all flex items-center justify-center"
                                        >
                                            <ExternalLink size={18} />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {coupons.length === 0 && (
                        <div className="text-center py-20">
                            <Ticket size={48} className="text-[var(--text-placeholder)] mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-[var(--text-muted)]">No coupons found</h3>
                            <p className="text-[var(--text-secondary)] mt-2">Check back later for fresh deals!</p>
                        </div>
                    )}
                </section>
            </main>
            <Footer />
        </>
    );
}
