import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const { response } = await requireAdminSession();
    if (response) return response;

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
