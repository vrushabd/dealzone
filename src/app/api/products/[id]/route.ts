import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import slugify from "slugify";
import { inferCategoryIdFromText } from "@/lib/features/products/category";
import { triggerPriceDropAlerts } from "@/lib/features/alerts/service";

const productDetailSelect = {
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
    featured: true,
    categoryId: true,
    cashbackAmazon: true,
    cashbackFlipkart: true,
    seller: true,
    rating: true,
    availability: true,
    createdAt: true,
    updatedAt: true,
    category: { select: { id: true, name: true, slug: true, icon: true } },
    reviews: true,
};

type ProductReviewPayload = {
    rating: number;
    title?: string | null;
    comment: string;
    author?: string | null;
};

// GET single product by id
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id },
            select: productDetailSelect,
        });
        if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(product);
    } catch {
        return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
    }
}

// PUT update product (admin only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;
        const data = await request.json();
        const slug = slugify(data.title, { lower: true, strict: true });
        const categories = await prisma.category.findMany({
            select: { id: true, name: true, slug: true },
        });
        const categoryId = data.categoryId || inferCategoryIdFromText(categories, {
            title: data.title,
            description: data.description,
        });

        // Fetch current price BEFORE update so we can compare
        const oldProduct = await prisma.product.findUnique({
            where: { id },
            select: { price: true },
        });

        const product = await prisma.product.update({
            where: { id },
            data: {
                title: data.title,
                slug,
                description: data.description || null,
                image: data.image || null,
                images: Array.isArray(data.images) ? data.images : [],
                price: data.price ? parseFloat(data.price) : null,
                originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : null,
                discount: data.discount ? parseFloat(data.discount) : null,
                amazonLink: data.amazonLink || null,
                flipkartLink: data.flipkartLink || null,
                featured: !!data.featured,
                categoryId: categoryId || null,
                cashbackAmazon: data.cashbackAmazon ? parseFloat(data.cashbackAmazon) : 0,
                cashbackFlipkart: data.cashbackFlipkart ? parseFloat(data.cashbackFlipkart) : 0,
                seller: data.seller || null,
                rating: data.rating ? parseFloat(data.rating) : null,
                availability: data.availability || "in_stock",
                reviews: data.reviews && Array.isArray(data.reviews) ? {
                    deleteMany: {},
                    create: data.reviews.map((r: ProductReviewPayload) => ({
                        rating: r.rating,
                        title: r.title,
                        comment: r.comment,
                        author: r.author
                    }))
                } : undefined,
                bankOffers: data.bankOffers && Array.isArray(data.bankOffers) ? data.bankOffers : [],
                deliveryInfo: data.deliveryInfo || null,
            },
            select: productDetailSelect,
        });

        // Fire price drop alerts if price changed downward
        const newPrice = data.price ? parseFloat(data.price) : null;
        const oldPriceVal = oldProduct?.price || null;
        if (newPrice && newPrice > 0) {
            // Run alerts in background — don't block the response
            triggerPriceDropAlerts({
                productId: product.id,
                productTitle: product.title,
                productSlug: product.slug,
                productImage: product.image,
                oldPrice: oldPriceVal,
                newPrice,
            }).catch((err) => console.error("Alert trigger error after PUT:", err));
        }

        return NextResponse.json(product);
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Failed to update product";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

// DELETE product (admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;

        // Delete ALL related records first (FK constraints)
        await prisma.$transaction([
            prisma.affiliateClick.deleteMany({ where: { productId: id } }),
            prisma.productPriceHistory.deleteMany({ where: { productId: id } }),
            prisma.trackedProduct.deleteMany({ where: { productId: id } }),
            prisma.priceAlert.deleteMany({ where: { productId: id } }),
            prisma.productReview.deleteMany({ where: { productId: id } }),
            prisma.product.delete({ where: { id } }),
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete product error:", error);
        return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
    }
}
