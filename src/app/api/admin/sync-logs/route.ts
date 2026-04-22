import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/sync-logs
 * Returns the last 20 sync events for the history panel.
 */
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const logs = await prisma.syncLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 20,
        });
        return NextResponse.json({ logs });
    } catch (error) {
        console.error("Sync logs fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch sync logs" }, { status: 500 });
    }
}
