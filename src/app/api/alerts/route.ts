import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, phone, targetPrice, productId } = body;

        if (!productId || typeof targetPrice !== 'number' || (!email && !phone)) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const alert = await prisma.priceAlert.create({
            data: {
                productId,
                targetPrice,
                email: email || null,
                phone: phone || null,
                isActive: true
            }
        });

        return NextResponse.json({ success: true, alert });
    } catch (error) {
        console.error("Price Alert Error:", error);
        return NextResponse.json({ error: "Failed to create price alert" }, { status: 500 });
    }
}
