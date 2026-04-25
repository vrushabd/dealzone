import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
    params: Promise<{ id: string }>;
}

function getUserId(token: { id?: string; sub?: string } | null) {
    return token?.id || token?.sub || null;
}

// GET /api/orders/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = getUserId(token);
    const adminSession = await getServerSession(authOptions);

    if (!userId && !adminSession?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
        where: { id },
        include: { items: true, user: { select: { name: true, email: true, phone: true } } },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Regular users can only see their own orders
    if (userId && !adminSession?.user && order.userId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ order });
}

// PATCH /api/orders/[id] — admin only: update status or note
export async function PATCH(req: NextRequest, { params }: RouteParams) {
    const { id } = await params;
    const adminSession = await getServerSession(authOptions);
    if (!adminSession?.user) {
        return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const { status, adminNote, paymentStatus } = await req.json();

    const updated = await prisma.order.update({
        where: { id },
        data: {
            ...(status && { status }),
            ...(adminNote !== undefined && { adminNote }),
            ...(paymentStatus && { paymentStatus }),
        },
        include: { items: true },
    });

    return NextResponse.json({ order: updated });
}
