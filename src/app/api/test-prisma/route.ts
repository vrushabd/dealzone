import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    console.log("Testing Prisma via API route...");
    try {
        const products = await prisma.product.findMany({ take: 1 });
        return NextResponse.json({ success: true, count: products.length });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown Prisma error";
        console.error("Prisma API test failed:", message);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
