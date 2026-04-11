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
import { ExternalLink, Tag, ShoppingCart } from "lucide-react";

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
        include: { category: true },
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
                    <Link href="/" className="hover:text-orange-400 transition-colors">Home</Link>
                    <span>/</span>
                    <Link href="/products" className="hover:text-orange-400 transition-colors">Deals</Link>
                    {product.category && (
                        <>
                            <span>/</span>
                            <Link href={`/categories/${product.category.slug}`} className="hover:text-orange-400 transition-colors">
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
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl aspect-square sm:aspect-auto sm:h-[500px] flex items-center justify-center overflow-hidden">
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
                            <div className="absolute top-4 left-4 bg-orange-500 text-white text-sm font-bold px-3 py-1.5 rounded-full">
                                -{discountPct}% OFF
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-col">
                        {product.category && (
                            <Link href={`/categories/${product.category.slug}`} className="inline-flex items-center gap-1.5 bg-orange-500/10 text-orange-400 text-xs font-medium px-3 py-1.5 rounded-full mb-4 w-fit hover:bg-orange-500/20 transition-colors">
                                <Tag size={12} />
                                {product.category.name}
                            </Link>
                        )}

                        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-snug mb-6">{product.title}</h1>

                        {/* Price */}
                        <div className="flex items-baseline gap-3 mb-6">
                            {product.price && (
                                <span className="text-4xl font-extrabold text-orange-400">
                                    ₹{product.price.toLocaleString("en-IN")}
                                </span>
                            )}
                            {product.originalPrice && product.originalPrice !== product.price && (
                                <span className="text-xl text-[var(--text-muted)] line-through">
                                    ₹{product.originalPrice.toLocaleString("en-IN")}
                                </span>
                            )}
                            {discountPct && discountPct > 0 && (
                                <span className="text-green-500 font-semibold text-sm">{discountPct}% off</span>
                            )}
                        </div>

                        {/* Affiliate Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            {product.amazonLink && (
                                <a
                                    href={product.amazonLink}
                                    target="_blank"
                                    rel="noopener noreferrer sponsored"
                                    className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold py-4 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-yellow-500/20 text-base"
                                >
                                    <ExternalLink size={18} />
                                    Buy on Amazon
                                </a>
                            )}
                            {product.flipkartLink && (
                                <a
                                    href={product.flipkartLink}
                                    target="_blank"
                                    rel="noopener noreferrer sponsored"
                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/20 text-base"
                                >
                                    <ExternalLink size={18} />
                                    Buy on Flipkart
                                </a>
                            )}
                        </div>

                        {/* AI Buy Advisor */}
                        <BuyAdvice productId={product.id} currentPrice={product.price} />

                        {/* Description */}
                        {product.description && (
                            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5">
                                <h2 className="font-semibold text-[var(--text-secondary)] mb-3">About this product</h2>
                                <p className="text-[var(--text-secondary)]/80 text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
                            </div>
                        )}

                        <p className="text-xs text-[var(--text-muted)] mt-6">
                            * As an affiliate partner, we may earn a commission from purchases made through these links at no extra cost to you.
                        </p>
                    </div>
                </div>

                {/* Price History Chart */}
                <section className="mb-12">
                    <PriceHistoryChart productId={product.id} currentPrice={product.price} />
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
