import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — submit a review; only users with a delivered order for this product may review
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: slug } = await params;
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "You must be logged in to write a review" }, { status: 401 });
        }

        const { rating, comment } = await req.json();

        if (!comment?.trim()) {
            return NextResponse.json({ error: "Comment is required" }, { status: 400 });
        }
        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
        }

        const product = await prisma.product.findUnique({
            where: { slug },
            select: { id: true },
        });
        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Only allow review if user has a DELIVERED order containing this product
        const deliveredOrder = await prisma.order.findFirst({
            where: {
                userId: session.user.id,
                status: "delivered",
                items: {
                    some: { productId: product.id },
                },
            },
            select: { id: true },
        });

        if (!deliveredOrder) {
            return NextResponse.json(
                { error: "You can only review products you have received" },
                { status: 403 }
            );
        }

        // Prevent duplicate reviews
        const existing = await prisma.productReview.findFirst({
            where: { productId: product.id, author: session.user.name || session.user.email || "Customer" },
            select: { id: true },
        });
        if (existing) {
            return NextResponse.json({ error: "You have already reviewed this product" }, { status: 409 });
        }

        const review = await prisma.productReview.create({
            data: {
                productId: product.id,
                author: session.user.name || session.user.email || "Verified Buyer",
                rating: Number(rating),
                title: null,
                comment: comment.trim(),
            },
        });

        return NextResponse.json({ review }, { status: 201 });
    } catch (err) {
        console.error("[review]", err);
        return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
    }
}
