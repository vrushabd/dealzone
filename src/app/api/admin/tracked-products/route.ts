import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const products = await prisma.product.findMany({
            where: {
                isPublic: false,
                originalUrl: { not: null },
            },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                slug: true,
                image: true,
                price: true,
                originalPrice: true,
                originalUrl: true,
                amazonLink: true,
                flipkartLink: true,
                rating: true,
                createdAt: true,
                category: { select: { name: true } },
                priceHistory: {
                    orderBy: { timestamp: "asc" },
                    select: { price: true, timestamp: true, platform: true },
                },
            },
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error("Tracked products error:", error);
        return NextResponse.json({ error: "Failed to load tracked products" }, { status: 500 });
    }
}
