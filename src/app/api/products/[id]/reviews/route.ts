import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST — submit a public review for a product by slug
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: slug } = await params;
        const { author, rating, title, comment } = await req.json();

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

        const review = await prisma.productReview.create({
            data: {
                productId: product.id,
                author: author?.trim() || "Anonymous",
                rating: Number(rating),
                title: title?.trim() || null,
                comment: comment.trim(),
            },
        });

        return NextResponse.json({ review }, { status: 201 });
    } catch (err) {
        console.error("[review]", err);
        return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
    }
}
