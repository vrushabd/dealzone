import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { productId, platform, sessionId } = await req.json();

        if (!productId) {
            return NextResponse.json({ error: "Missing productId" }, { status: 400 });
        }

        // Use the IP/UserAgent from headers for better tracking
        const ip = req.headers.get("x-forwarded-for") || "unknown";
        const userAgent = req.headers.get("user-agent") || "unknown";

        await prisma.affiliateClick.create({
            data: {
                productId,
                platform: platform || "unknown",
                sessionId: sessionId || "unknown",
                ip,
                userAgent,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Click Tracking Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
