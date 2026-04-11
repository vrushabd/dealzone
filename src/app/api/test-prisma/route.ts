import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    console.log("🧪 testing Prisma via API route...");
    try {
        const products = await prisma.product.findMany({ take: 1 });
        return NextResponse.json({ success: true, count: products.length });
    } catch (err: any) {
        console.error("❌ Prisma API test failed:", err.message);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
