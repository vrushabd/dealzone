import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductGallery from "@/components/products/ProductGallery";
import ProductCard from "@/components/products/ProductCard";
import PriceHistoryChart from "@/components/features/PriceHistoryChart";
import BuyAdvice from "@/components/features/BuyAdvice";
import PriceAlertButton from "@/components/features/PriceAlertButton";
import TrackedLink from "@/components/products/TrackedLink";
import {
    absoluteUrl,
    breadcrumbJsonLd,
    buildMetadata,
    jsonLdScript,
    truncateDescription,
} from "@/lib/seo";
import { ExternalLink, Tag, Star, ShieldCheck, CreditCard, Truck } from "lucide-react";
import type { Prisma } from "@prisma/client";

interface Params {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { slug } = await params;
    const product = await prisma.product.findUnique({
        where: { slug },
        select: {
            title: true,
            slug: true,
            description: true,
            image: true,
            price: true,
            originalPrice: true,
            discount: true,
            category: { select: { name: true } },
        },
    });
    if (!product) return { title: "Product Not Found" };

    const savingsText = product.discount && product.discount > 0
        ? ` Save ${Math.round(product.discount)}% today.`
        : product.originalPrice && product.price && product.originalPrice > product.price
            ? ` Save ₹${Math.round(product.originalPrice - product.price).toLocaleString("en-IN")}.`
            : "";

    return buildMetadata({
        title: `${product.title} Best Price${product.price ? ` ₹${product.price.toLocaleString("en-IN")}` : ""}`,
        description: truncateDescription(
            product.description ||
            `Compare ${product.title} price, offers, price history, buyer rating, and availability on GenzLoots.${savingsText}`
        ),
        path: `/products/${product.slug}`,
        image: product.image,
    });
}

export const revalidate = 60;

const productCardSelect = {
    id: true,
    title: true,
    slug: true,
    description: true,
    image: true,
    price: true,
    originalPrice: true,
    discount: true,
    amazonLink: true,
    flipkartLink: true,
    cashbackAmazon: true,
    cashbackFlipkart: true,
    cashbackPaytm: true,
    cashbackPhonePe: true,
    rating: true,
    category: { select: { name: true, slug: true } },
};

type ProductReview = Prisma.ProductReviewGetPayload<Record<string, never>>;

export default async function ProductDetailPage({ params }: Params) {
    const { slug } = await params;
    const product = await prisma.product.findUnique({
        where: { slug },
        select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            image: true,
            images: true,
            price: true,
            originalPrice: true,
            discount: true,
            amazonLink: true,
            flipkartLink: true,
            myntraLink: true,
            categoryId: true,
            featured: true,
            availability: true,
            seller: true,
            rating: true,
            originalUrl: true,
            cashbackAmazon: true,
            cashbackFlipkart: true,
            cashbackPaytm: true,
            cashbackPhonePe: true,
            bankOffers: true,
            deliveryInfo: true,
            createdAt: true,
            updatedAt: true,
            category: { select: { id: true, name: true, slug: true, icon: true } },
            reviews: { orderBy: { rating: 'desc' }, take: 5 },
        },
    });

    if (!product) notFound();

    const related = await prisma.product.findMany({
        where: { categoryId: product.categoryId, NOT: { id: product.id } },
        select: productCardSelect,
        take: 4,
    });

    const discountPct =
        product.discount ||
        (product.originalPrice && product.price
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : null);

    const productImages = [product.image, ...(product.images || [])]
        .filter((image): image is string => Boolean(image))
        .map((image) => absoluteUrl(image));

    const productJsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: truncateDescription(product.description, `Best price and offers for ${product.title}.`),
        image: productImages.length > 0 ? productImages : undefined,
        category: product.category?.name,
        sku: product.id,
        url: absoluteUrl(`/products/${product.slug}`),
        aggregateRating: typeof product.rating === "number" && product.rating > 0
            ? {
                "@type": "AggregateRating",
                ratingValue: product.rating.toFixed(1),
                bestRating: "5",
                worstRating: "1",
                ratingCount: Math.max(product.reviews.length, 1),
            }
            : undefined,
        review: product.reviews.map((review) => ({
            "@type": "Review",
            reviewRating: {
                "@type": "Rating",
                ratingValue: review.rating,
                bestRating: "5",
                worstRating: "1",
            },
            author: {
                "@type": "Person",
                name: review.author || "Verified Buyer",
            },
            name: review.title || undefined,
            reviewBody: review.comment,
        })),
        offers: product.price && product.price > 0 ? {
            "@type": "Offer",
            url: absoluteUrl(`/products/${product.slug}`),
            priceCurrency: "INR",
            price: product.price,
            availability: product.availability?.toLowerCase().includes("out")
                ? "https://schema.org/OutOfStock"
                : "https://schema.org/InStock",
            seller: product.seller
                ? { "@type": "Organization", name: product.seller }
                : { "@type": "Organization", name: "Merchant partner" },
        } : undefined,
    };

    const breadcrumbJson = breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Deals", path: "/products" },
        ...(product.category ? [{ name: product.category.name, path: `/categories/${product.category.slug}` }] : []),
        { name: product.title, path: `/products/${product.slug}` },
    ]);

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript([productJsonLd, breadcrumbJson])} />
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-8">
                    <Link href="/" className="hover:text-[hsl(214_89%_55%)] transition-colors">Home</Link>
                    <span>/</span>
                    <Link href="/products" className="hover:text-[hsl(214_89%_55%)] transition-colors">Deals</Link>
                    {product.category && (
                        <>
                            <span>/</span>
                            <Link href={`/categories/${product.category.slug}`} className="hover:text-[hsl(214_89%_55%)] transition-colors">
                                {product.category.name}
                            </Link>
                        </>
                    )}
                    <span>/</span>
                    <span className="text-[var(--text-secondary)] line-clamp-1">{product.title}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                    {/* Image Gallery */}
                    <div className="relative">
                        <ProductGallery 
                            images={product.images || []} 
                            title={product.title} 
                            primaryImage={product.image} 
                        />
                        {discountPct && discountPct > 0 && (
                            <div className="absolute top-4 right-4 md:left-4 md:right-auto bg-[hsl(214_89%_52%)] text-white text-sm font-bold px-3 py-1.5 rounded-full z-10 shadow-md pointer-events-none">
                                -{discountPct}% OFF
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-col">
                        {product.category && (
                            <Link href={`/categories/${product.category.slug}`} className="inline-flex items-center gap-1.5 bg-[hsl(214_89%_52%/0.08)] text-[hsl(214_89%_55%)] text-xs font-medium px-3 py-1.5 rounded-full mb-4 w-fit hover:bg-[hsl(214_89%_45%)]/20 transition-colors">
                                <Tag size={12} />
                                {product.category.name}
                            </Link>
                        )}

                        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-snug mb-6">{product.title}</h1>

                        {(typeof product.rating === "number" && product.rating > 0) || product.seller ? (
                            <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
                                {typeof product.rating === "number" && product.rating > 0 && (
                                    <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-amber-700">
                                        <Star size={15} className="fill-current" />
                                        <span className="font-semibold">{product.rating.toFixed(1)} / 5</span>
                                    </div>
                                )}
                                {product.seller && (
                                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1 text-[var(--text-secondary)]">
                                        <ShieldCheck size={15} className="text-[hsl(214_89%_55%)]" />
                                        <span className="font-medium">Seller: {product.seller}</span>
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {/* Price */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 pb-6 border-b border-[var(--border)]">
                            <div className="flex items-baseline gap-3">
                                {(product.price ?? 0) > 0 ? (
                                    <span className="text-4xl font-extrabold text-[hsl(214_89%_55%)]">
                                        ₹{product.price!.toLocaleString("en-IN")}
                                    </span>
                                ) : (
                                    <span className="text-xl font-bold text-[var(--text-muted)]">
                                        Check Store for Price
                                    </span>
                                )}
                                {product.originalPrice && product.originalPrice !== product.price && product.originalPrice > 0 && (
                                    <span className="text-xl text-[var(--text-muted)] line-through">
                                        ₹{product.originalPrice.toLocaleString("en-IN")}
                                    </span>
                                )}
                                {discountPct && discountPct > 0 && (
                                    <span className="text-green-500 font-semibold text-sm">{discountPct}% off</span>
                                )}
                            </div>
                            
                            {product.deliveryInfo && (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-md text-xs font-semibold text-[hsl(214_89%_55%)]">
                                    <Truck size={14} />
                                    {product.deliveryInfo}
                                </div>
                            )}
                        </div>
                        {/* Compare Prices / Buying Options */}
                        {product.amazonLink && product.flipkartLink ? (
                            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-5 mb-8">
                                <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                    <ShieldCheck size={18} className="text-green-500" />
                                    Compare Store Prices
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 rounded-md bg-[var(--bg-base)] border border-[var(--border)]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-yellow-600 text-xs">AMZ</div>
                                            <span className="font-semibold text-[var(--text-primary)]">Amazon</span>
                                        </div>
                                        <TrackedLink productId={product.id} platform="amazon" href={product.amazonLink} className="bg-yellow-500 hover:bg-yellow-400 text-gray-950 text-sm font-bold py-2 px-4 rounded transition-all flex items-center gap-1">
                                            Check Deal <ExternalLink size={14} />
                                        </TrackedLink>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-md bg-[var(--bg-base)] border border-[var(--border)]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white text-xs">FLK</div>
                                            <span className="font-semibold text-[var(--text-primary)]">Flipkart</span>
                                        </div>
                                        <TrackedLink productId={product.id} platform="flipkart" href={product.flipkartLink} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2 px-4 rounded transition-all flex items-center gap-1">
                                            Check Deal <ExternalLink size={14} />
                                        </TrackedLink>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                {product.amazonLink && (
                                    <TrackedLink
                                        productId={product.id}
                                        platform="amazon"
                                        href={product.amazonLink}
                                        className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold py-4 px-6 rounded-md transition-all hover:shadow-lg hover:shadow-yellow-500/20 text-base"
                                    >
                                        <ExternalLink size={18} />
                                        Buy on Amazon
                                    </TrackedLink>
                                )}
                                {product.flipkartLink && (
                                    <TrackedLink
                                        productId={product.id}
                                        platform="flipkart"
                                        href={product.flipkartLink}
                                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-md transition-all hover:shadow-lg hover:shadow-blue-600/20 text-base"
                                    >
                                        <ExternalLink size={18} />
                                        Buy on Flipkart
                                    </TrackedLink>
                                )}
                            </div>
                        )}

                        {(product.price ?? 0) > 0 && (
                            <div className="mb-8">
                                <PriceAlertButton
                                    productId={product.id}
                                    currentPrice={product.price!}
                                    productName={product.title}
                                />
                            </div>
                        )}

                        {/* Special Bank Offers & Coupons */}
                        {product.bankOffers && product.bankOffers.length > 0 && (
                            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-5 mb-8 overflow-hidden relative group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <CreditCard size={100} />
                                </div>
                                <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                    <Tag size={18} className="text-[hsl(214_89%_55%)]" />
                                    Special Offers & Coupons
                                </h3>
                                <div className="space-y-3 relative z-10">
                                    {product.bankOffers.map((offer: string, idx: number) => (
                                        <div key={idx} className="flex gap-3 items-start p-3 bg-[var(--bg-base)] border border-[var(--border)] border-l-4 border-l-[hsl(214_89%_55%)] rounded-r-md">
                                            <CreditCard size={16} className="mt-1 text-[var(--text-secondary)]" />
                                            <p className="text-sm text-[var(--text-primary)] leading-relaxed">{offer}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* AI Buy Advisor */}
                        <BuyAdvice productId={product.id} currentPrice={product.price ?? 0} />

                        {/* Description */}
                        {product.description && (
                            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-md p-5">
                                <h2 className="font-semibold text-[var(--text-secondary)] mb-3">About this product</h2>
                                <p className="text-[var(--text-secondary)]/80 text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
                            </div>
                        )}

                        <p className="text-xs text-[var(--text-muted)] mt-6">
                            * As an affiliate partner, we may earn a commission from purchases made through these links at no extra cost to you.
                        </p>
                    </div>
                </div>

                {/* Customer Reviews Section */}
                {product.reviews.length > 0 && (
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">What Buyers Are Saying</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {product.reviews.map((review: ProductReview) => (
                                <div key={review.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md p-5 flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-1 text-[var(--warning)]">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} size={14} className={i < Math.floor(review.rating) ? "fill-current" : "opacity-30"} />
                                            ))}
                                        </div>
                                        <div className="text-xs text-[var(--text-muted)] font-semibold">{review.rating}/5</div>
                                    </div>
                                    {review.title && <h3 className="font-bold text-[var(--text-primary)] text-sm mb-2">{review.title}</h3>}
                                    <p className="text-sm text-[var(--text-secondary)] italic leading-relaxed flex-1 mb-4">&quot;{review.comment}&quot;</p>
                                    <div className="text-xs text-[var(--text-muted)] mt-auto pt-4 border-t border-[var(--border)] flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-[var(--bg-base)] flex flex-shrink-0 items-center justify-center font-bold text-[10px] text-[var(--text-primary)]">
                                            {review.author?.[0]?.toUpperCase() || 'Buyer'}
                                        </div>
                                        <span className="truncate">{review.author || 'Verified Buyer'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Price History Chart */}
                <section className="mb-12">
                    <PriceHistoryChart productId={product.id} currentPrice={product.price ?? 0} />
                </section>

                {/* Related Products */}
                {related.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Related Deals</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {related.map((p) => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    </section>
                )}
            </main>
            <Footer />
        </>
    );
}
