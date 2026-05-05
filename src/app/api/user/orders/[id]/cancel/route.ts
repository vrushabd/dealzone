import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const order = await prisma.order.findUnique({
            where: { id },
        });

        if (!order || order.userId !== session.user.id) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        if (order.status === "cancelled" || order.status === "delivered") {
            return NextResponse.json({ error: "Cannot cancel this order" }, { status: 400 });
        }

        await prisma.order.update({
            where: { id },
            data: { cancelRequested: true },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Cancel order error:", error);
        return NextResponse.json(
            { error: "Failed to request cancellation" },
            { status: 500 }
        );
    }
}
