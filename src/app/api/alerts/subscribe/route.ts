import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { email, targetPrice, productId } = await req.json();

        if (!email || !targetPrice || !productId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // @ts-ignore - Prisma types may be stale
        const alert = await prisma.priceAlert.create({
            data: {
                email,
                targetPrice: parseFloat(targetPrice),
                productId,
            },
        });

        return NextResponse.json({ success: true, alert });
    } catch (error) {
        console.error("Alert subscription error:", error);
        return NextResponse.json({ error: "Failed to set alert" }, { status: 500 });
    }
}
