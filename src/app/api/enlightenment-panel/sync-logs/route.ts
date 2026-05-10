import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/sync-logs
 * Returns the last 20 sync events for the history panel.
 */
export async function GET() {
    const { response } = await requireAdminSession();
    if (response) return response;

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
