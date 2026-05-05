import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/products/[id]/rank  { direction: "up" | "down" }
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;
        const { direction } = await request.json();

        const product = await prisma.product.findUnique({ where: { id }, select: { rank: true } });
        if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const newRank = direction === "up"
            ? (product.rank ?? 0) + 1
            : Math.max(0, (product.rank ?? 0) - 1);

        await prisma.product.update({ where: { id }, data: { rank: newRank } });

        return NextResponse.json({ success: true, rank: newRank });
    } catch (error) {
        console.error("Rank update error:", error);
        return NextResponse.json({ error: "Failed to update rank" }, { status: 500 });
    }
}
