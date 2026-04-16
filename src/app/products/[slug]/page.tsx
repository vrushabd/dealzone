import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import PriceHistoryChart from "@/components/features/PriceHistoryChart";
import BuyAdvice from "@/components/features/BuyAdvice";
import PriceAlertButton from "@/components/features/PriceAlertButton";
import TrackedLink from "@/components/products/TrackedLink";
import { ExternalLink, Tag, ShoppingCart, Star, ShieldCheck } from "lucide-react";

interface Params {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { slug } = await params;
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) return { title: "Product Not Found" };
    return {
        title: product.title,
        description: product.description || `Buy ${product.title} at the best price.`,
        openGraph: {
            title: product.title,
            description: product.description || undefined,
            images: product.image ? [{ url: product.image }] : undefined,
        },
    };
}

export const revalidate = 60;

export default async function ProductDetailPage({ params }: Params) {
    const { slug } = await params;
    const product = await prisma.product.findUnique({
        where: { slug },
        include: { category: true, reviews: { orderBy: { rating: 'desc' }, take: 5 } },
    });

    if (!product) notFound();

    const related = await prisma.product.findMany({
        where: { categoryId: product.categoryId, NOT: { id: product.id } },
        include: { category: true },
        take: 4,
    });

    const discountPct =
        product.discount ||
        (product.originalPrice && product.price
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : null);

    // JSON-LD structured data
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: product.description,
        image: product.image,
        offers: {
            "@type": "Offer",
            priceCurrency: "INR",
            price: product.price,
            availability: "https://schema.org/InStock",
        },
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
                    {/* Image */}
                    <div className="relative">
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-md aspect-square sm:aspect-auto sm:h-[500px] flex items-center justify-center overflow-hidden">
                            {product.image ? (
                                <Image
                                    src={product.image}
                                    alt={product.title}
                                    fill
                                    className="object-contain p-4 sm:p-8"
                                    priority
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                />
                            ) : (
                                <ShoppingCart size={80} className="text-[var(--text-placeholder)]" />
                            )}
                        </div>
                        {discountPct && discountPct > 0 && (
                            <div className="absolute top-4 left-4 bg-[hsl(214_89%_52%)] text-white text-sm font-bold px-3 py-1.5 rounded-full">
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

                        {/* Price & Alert */}
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
                            
                            {(product.price ?? 0) > 0 && (
                                <PriceAlertButton 
                                    productId={product.id} 
                                    currentPrice={product.price!} 
                                    productName={product.title} 
                                />
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
                {(product as any).reviews && (product as any).reviews.length > 0 && (
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">What Buyers Are Saying</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(product as any).reviews.map((review: any) => (
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
                                    <p className="text-sm text-[var(--text-secondary)] italic leading-relaxed flex-1 mb-4">"{review.comment}"</p>
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
