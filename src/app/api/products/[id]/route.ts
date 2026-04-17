import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import slugify from "slugify";

// GET single product by id
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id },
            include: { category: true },
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

        const product = await prisma.product.update({
            where: { id },
            data: {
                title: data.title,
                slug,
                description: data.description || null,
                image: data.image || null,
                images: data.images || [],
                price: data.price ? parseFloat(data.price) : null,
                originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : null,
                discount: data.discount ? parseFloat(data.discount) : null,
                amazonLink: data.amazonLink || null,
                flipkartLink: data.flipkartLink || null,
                categoryId: data.categoryId || null,
                cashbackAmazon: data.cashbackAmazon ? parseFloat(data.cashbackAmazon) : 0,
                cashbackFlipkart: data.cashbackFlipkart ? parseFloat(data.cashbackFlipkart) : 0,
                seller: data.seller || null,
                rating: data.rating ? parseFloat(data.rating) : null,
                reviews: data.reviews && Array.isArray(data.reviews) ? {
                    deleteMany: {},
                    create: data.reviews.map((r: any) => ({
                        rating: r.rating,
                        title: r.title,
                        comment: r.comment,
                        author: r.author
                    }))
                } : undefined,
                bankOffers: data.bankOffers && Array.isArray(data.bankOffers) ? data.bankOffers : [],
                deliveryInfo: data.deliveryInfo || null,
            },
            include: { category: true, reviews: true },
        });

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
