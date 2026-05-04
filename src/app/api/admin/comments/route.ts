import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const { response } = await requireAdminSession();
    if (response) return response;

    try {
        const reviews = await prisma.productReview.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                product: {
                    select: { id: true, title: true, slug: true, image: true },
                },
            },
        });
        return NextResponse.json({ reviews });
    } catch (err) {
        console.error("[GET /api/admin/comments]", err);
        return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }
}
