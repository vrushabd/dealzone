import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/orders — all orders for admin
export async function GET(req: NextRequest) {
    const { response } = await requireAdminSession();
    if (response) return response;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const skip = (page - 1) * limit;

    const where = status && status !== "all" ? { status } : {};

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                slug: true,
                                originalUrl: true,
                                amazonLink: true,
                                flipkartLink: true,
                                meeshoLink: true,
                            },
                        },
                    },
                },
                user: { select: { name: true, email: true, phone: true } },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.order.count({ where }),
    ]);

    return NextResponse.json({ orders, total, page, limit });
}
