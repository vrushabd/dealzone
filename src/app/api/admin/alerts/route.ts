import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status"); // "pending" | "sent" | "all"

        const where: Record<string, unknown> = {};
        if (status === "pending") where.isActive = true;
        if (status === "sent") where.isActive = false;

        const alerts = await prisma.priceAlert.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 100,
            select: {
                id: true,
                email: true,
                targetPrice: true,
                isActive: true,
                emailSentAt: true,
                createdAt: true,
                product: {
                    select: { id: true, title: true, slug: true, price: true, image: true },
                },
            },
        });

        return NextResponse.json({ alerts });
    } catch (error) {
        console.error("Alerts admin GET error:", error);
        return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await req.json();
        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
        await prisma.priceAlert.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Alert delete error:", error);
        return NextResponse.json({ error: "Failed to delete alert" }, { status: 500 });
    }
}
