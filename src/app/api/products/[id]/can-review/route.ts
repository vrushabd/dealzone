import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/products/[slug]/can-review — returns { canReview: boolean }
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: slug } = await params;
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ canReview: false });
        }

        const product = await prisma.product.findUnique({
            where: { slug },
            select: { id: true },
        });
        if (!product) return NextResponse.json({ canReview: false });

        // Check delivered order
        const deliveredOrder = await prisma.order.findFirst({
            where: {
                userId: session.user.id,
                status: "delivered",
                items: { some: { productId: product.id } },
            },
            select: { id: true },
        });
        if (!deliveredOrder) return NextResponse.json({ canReview: false });

        // Check not already reviewed
        const existing = await prisma.productReview.findFirst({
            where: {
                productId: product.id,
                author: session.user.name || session.user.email || "Verified Buyer",
            },
            select: { id: true },
        });

        return NextResponse.json({ canReview: !existing });
    } catch (err) {
        console.error("[can-review]", err);
        return NextResponse.json({ canReview: false });
    }
}
