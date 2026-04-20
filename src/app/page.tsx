import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import HeroSearch from "@/components/home/HeroSearch";
import CategoryIcon from "@/components/ui/CategoryIcon";
import { absoluteUrl, buildMetadata, jsonLdScript, SITE_NAME } from "@/lib/seo";
import {
    ArrowRight, Zap, TrendingUp, Tag,
    ExternalLink, ShoppingBag,
} from "lucide-react";

export const metadata: Metadata = buildMetadata({
    title: "Best Amazon, Flipkart & Myntra Deals in India",
    description: "Track real price drops, browse verified coupons, and shop smarter with GenzLoots deal alerts.",
    path: "/",
});

export const revalidate = 5;

const productCardSelect = {
    id: true, title: true, slug: true, description: true, image: true,
    price: true, originalPrice: true, discount: true,
    amazonLink: true, flipkartLink: true,
    cashbackAmazon: true, cashbackFlipkart: true,
    cashbackPaytm: true, cashbackPhonePe: true,
    rating: true,
    category: { select: { name: true, slug: true } },
};

const DEAL_TIERS = [99, 199, 299, 399, 499, 599, 799, 999];
const DISCOUNT_TIERS = [40, 50, 60, 70];

const QUICK_LINKS = [
    { href: "/price-tracker", label: "Amazon Price History Tracker" },
    { href: "/price-tracker", label: "Flipkart Price History Tracker" },
];

type HomeProduct = {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    image: string | null;
    price: number | null;
    originalPrice: number | null;
    discount: number | null;
    amazonLink: string | null;
    flipkartLink: string | null;
    cashbackAmazon: number | null;
    cashbackFlipkart: number | null;
    cashbackPaytm: number | null;
    cashbackPhonePe: number | null;
    rating: number | null;
    category: { name: string; slug: string } | null;
};

type HomeCategory = {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    _count: { products: number };
    products: Array<{ image: string | null; price: number | null }>;
};

export default async function HomePage() {
    const [latestProducts, categories]: [HomeProduct[], HomeCategory[]] = await Promise.all([
        prisma.product.findMany({
            where: { isPublic: true },
            select: productCardSelect,
            orderBy: { createdAt: "desc" },
            take: 10,
        }),
        prisma.category.findMany({
            include: {
                _count: { select: { products: { where: { isPublic: true } } } },
                products: {
                    where: { isPublic: true, image: { not: null } },
                    select: { image: true, price: true },
                    orderBy: { price: "asc" },
                    take: 1,
                },
            },
            take: 9,
        }),
    ]).catch((err) => {
        console.error("❌ Prisma fetch error on homepage:", err.message);
        return [[], []];
    });

    const websiteJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: absoluteUrl("/"),
        potentialAction: {
            "@type": "SearchAction",
            target: `${absoluteUrl("/search")}?q={search_term_string}`,
            "query-input": "required name=search_term_string",
        },
    };

    const organizationJsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_NAME,
        url: absoluteUrl("/"),
        logo: absoluteUrl("/favicon.svg"),
        sameAs: [],
    };

    const latestDealsJsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Latest online deals",
        itemListElement: latestProducts.map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: absoluteUrl(`/products/${product.slug}`),
            name: product.title,
        })),
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript([websiteJsonLd, organizationJsonLd, latestDealsJsonLd])} />
            <Navbar />
            <main className="bg-[var(--bg-base)]">

                {/* ── Hero Banner ─────────────────────────────────────── */}
                <section
                    className="relative overflow-hidden"
                    style={{
                        background:
                            "linear-gradient(135deg, hsl(214deg 89% 18%) 0%, hsl(214deg 89% 32%) 55%, hsl(214deg 89% 42%) 100%)",
                    }}
                >
                    {/* Ambient glow orbs */}
                    <div
                        className="pointer-events-none absolute -top-24 right-0 w-[28rem] h-[28rem] rounded-full opacity-[0.10]"
                        style={{ background: "radial-gradient(circle, hsl(149 100% 55%), transparent 70%)" }}
                    />
                    <div
                        className="pointer-events-none absolute bottom-0 -left-16 w-80 h-80 rounded-full opacity-[0.07]"
                        style={{ background: "radial-gradient(circle, hsl(200 100% 70%), transparent 70%)" }}
                    />

                    {/* Floating decorative icons */}
                    {[
                        { Icon: ShoppingBag, top: "top-10 left-10",  delay: "0s",   size: 52 },
                        { Icon: Zap,         top: "top-14 right-16", delay: "1.5s", size: 44 },
                        { Icon: Tag,         top: "bottom-8 right-28",delay: "2.5s",size: 38 },
                        { Icon: TrendingUp,  top: "bottom-6 left-24",delay: "0.8s", size: 38 },
                    ].map(({ Icon, top, delay, size }) => (
                        <div
                            key={delay}
                            className={`pointer-events-none absolute ${top} opacity-[0.10] text-white animate-float hidden lg:block`}
                            style={{ animationDelay: delay }}
                        >
                            <Icon size={size} />
                        </div>
                    ))}

                    {/* Hero content */}
                    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-center flex flex-col items-center justify-center">
                        <h1 className="sr-only">
                            GenzLoots - Find Real Deals and Skip the Fake Ones
                        </h1>
                        
                        {/* Search bar */}
                        <HeroSearch />
                    </div>
                </section>

                {/* ── Quick Links Bar ─────────────────────────────────── */}
                <div className="bg-[var(--bg-surface)] border-b border-[var(--border)]">
                    <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-start sm:justify-center gap-3 sm:gap-5 overflow-x-auto no-scrollbar">
                        {QUICK_LINKS.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="flex flex-shrink-0 items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[hsl(214_89%_55%)] font-semibold transition-colors duration-200 border border-[var(--border)] hover:border-[hsl(214_89%_52%/0.3)] rounded-full px-4 py-1.5 whitespace-nowrap"
                            >
                                <ExternalLink size={11} />
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ── Category Strip (sticky) ──────────────────────────── */}
                <div className="bg-[var(--bg-base)]/95 border-b border-[var(--border)] sticky top-14 z-40 backdrop-blur-xl">
                    <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
                        <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest whitespace-nowrap flex-shrink-0 pr-1">
                            Browse:
                        </span>
                        {categories.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/categories/${cat.slug}`}
                                className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all duration-200 py-1.5 px-3 rounded-full hover:bg-[hsl(214_89%_52%/0.10)] border border-transparent hover:border-[hsl(214_89%_52%/0.20)] flex-shrink-0"
                            >
                                <CategoryIcon slug={cat.slug} variant="bar" />
                                {cat.name}
                                {cat._count.products > 0 && (
                                    <span className="text-[9px] text-[var(--text-muted)]">
                                        ({cat._count.products})
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ── Main page content ───────────────────────────────── */}
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

                    {/* ── Hot Deals — Price Tier Tiles ─────────────────── */}
                    <section>
                        <div className="text-center mb-8">
                            <h2 
                                className="text-2xl sm:text-3xl font-extrabold"
                                style={{ color: "var(--text-primary)" }}
                            >
                                Hot Deals
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            {DEAL_TIERS.map((price) => (
                                <Link
                                    key={price}
                                    href={`/products?maxPrice=${price}`}
                                    className="group relative overflow-hidden rounded-xl border transition-all duration-300 p-5 sm:p-7 text-center hover:-translate-y-1 hover:shadow-[0_10px_36px_hsl(214_89%_52%/0.20)] cursor-pointer"
                                    style={{
                                        background: "var(--tile-blue-bg)",
                                        borderColor: "var(--tile-blue-border)"
                                    }}
                                >
                                    <div 
                                        className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.15em] mb-2"
                                        style={{ color: "var(--tile-blue-label)" }}
                                    >
                                        DEALS UNDER
                                    </div>
                                    <div 
                                        className="text-2xl sm:text-3xl font-extrabold leading-none"
                                        style={{ color: "var(--tile-blue-price)" }}
                                    >
                                        ₹{price.toLocaleString("en-IN")}
                                    </div>
                                    {/* Hover shine */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* ── Best Discounts — % Tier Tiles ────────────────── */}
                    <section>
                        <div className="text-center mb-8">
                            <h2 
                                className="text-2xl sm:text-3xl font-extrabold"
                                style={{ color: "var(--text-primary)" }}
                            >
                                Best Discounts
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            {DISCOUNT_TIERS.map((pct) => (
                                <Link
                                    key={pct}
                                    href={`/products?minDiscount=${pct}`}
                                    className="group relative overflow-hidden rounded-xl border transition-all duration-300 p-5 sm:p-7 text-center hover:-translate-y-1 hover:shadow-[0_10px_36px_hsl(12_100%_50%/0.15)] cursor-pointer"
                                    style={{
                                        background: "var(--tile-green-bg)",
                                        borderColor: "var(--tile-green-border)"
                                    }}
                                >
                                    <div 
                                        className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.15em] mb-1"
                                        style={{ color: "var(--tile-green-label)" }}
                                    >
                                        Min.
                                    </div>
                                    <div 
                                        className="text-3xl sm:text-4xl font-extrabold leading-none"
                                        style={{ color: "var(--tile-green-price)" }}
                                    >
                                        {pct}%
                                    </div>
                                    <div 
                                        className="text-sm font-bold mt-1"
                                        style={{ color: "var(--tile-green-label)" }}
                                    >
                                        off
                                    </div>
                                    {/* Hover shine */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* ── Just Added — Products Grid ───────────────────── */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="section-title">
                                <TrendingUp size={16} className="text-[hsl(214_89%_52%)]" />
                                Just Added
                            </h2>
                            <Link
                                href="/products"
                                className="flex items-center gap-1 text-xs text-[hsl(214_89%_55%)] hover:text-[hsl(214_89%_65%)] font-semibold transition-colors"
                            >
                                All deals <ArrowRight size={12} />
                            </Link>
                        </div>

                        {latestProducts.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 stagger-children">
                                {latestProducts.map((product) => (
                                    <div key={product.id} className="animate-fade-in-up">
                                        <ProductCard product={product} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center border-2 border-dashed border-[var(--border)] rounded-xl">
                                <Zap size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
                                <p className="text-[var(--text-muted)] text-sm font-medium">
                                    New deals incoming...
                                </p>
                            </div>
                        )}
                    </section>

                    {/* ── Shop by Categories ───────────────────────────── */}
                    {categories.length > 0 && (
                        <section>
                            <div className="text-center mb-8">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                                    Shop by Categories
                                </h2>
                        </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {categories.map((cat) => {
                                    const cheapest = cat.products[0];
                                    return (
                                        <Link
                                            key={cat.id}
                                            href={`/categories/${cat.slug}`}
                                            className="group flex items-center justify-between bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border)] hover:border-[hsl(214_89%_52%/0.35)] rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] overflow-hidden gap-4"
                                        >
                                            {/* Text info */}
                                            <div className="flex-1 min-w-0">
                                                {cheapest?.price && (
                                                    <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-0.5">
                                                        Starting from
                                                    </div>
                                                )}
                                                {cheapest?.price && (
                                                    <div className="text-xl font-extrabold text-[var(--text-primary)] leading-tight">
                                                        ₹{cheapest.price.toLocaleString("en-IN")}
                                                    </div>
                                                )}
                                                <div
                                                    className={`font-bold group-hover:text-[hsl(214_89%_52%)] transition-colors truncate ${
                                                        cheapest?.price
                                                            ? "text-sm text-[var(--text-secondary)] mt-0.5"
                                                            : "text-base text-[var(--text-primary)]"
                                                    }`}
                                                >
                                                    {cat.name}
                                                </div>
                                                {cat._count.products > 0 && (
                                                    <div className="text-xs text-[var(--text-muted)] mt-1">
                                                        {cat._count.products} deal
                                                        {cat._count.products !== 1 ? "s" : ""} available
                                                    </div>
                                                )}
                                            </div>

                                            {/* Product image or icon */}
                                            <div className="flex-shrink-0">
                                                {cheapest?.image ? (
                                                    <div className="relative w-20 h-20">
                                                        <Image
                                                            src={cheapest.image}
                                                            alt={cat.name}
                                                            fill
                                                            className="object-contain group-hover:scale-105 transition-transform duration-300"
                                                            sizes="80px"
                                                        />
                                                    </div>
                                                ) : (
                                                    <CategoryIcon slug={cat.slug} variant="page" />
                                                )}
                                            </div>

                                            {/* Arrow indicator */}
                                            <ArrowRight
                                                size={16}
                                                className="text-[var(--text-muted)] group-hover:text-[hsl(214_89%_52%)] group-hover:translate-x-1 transition-all flex-shrink-0"
                                            />
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                </div>
            </main>
            <Footer />
        </>
    );
}
