import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
