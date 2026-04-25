import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { razorpay } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";

function getUserId(token: { id?: string; sub?: string } | null) {
    return token?.id || token?.sub || null;
}

// POST /api/payment/create — creates a Razorpay order
export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = getUserId(token);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { orderId } = await req.json();

        if (!orderId) {
            return NextResponse.json({ error: "orderId is required" }, { status: 400 });
        }

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return NextResponse.json(
                { error: "Online payments are not configured yet. Please use COD or add Razorpay keys." },
                { status: 500 }
            );
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                userId: true,
                total: true,
                paymentMethod: true,
                paymentStatus: true,
            },
        });

        if (!order || order.userId !== userId) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        if (order.paymentMethod !== "online") {
            return NextResponse.json({ error: "This order does not require online payment" }, { status: 400 });
        }

        if (order.paymentStatus === "paid") {
            return NextResponse.json({ error: "This order has already been paid" }, { status: 400 });
        }

        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(order.total * 100),
            currency: "INR",
            receipt: orderId,
            notes: {
                orderId,
                userId,
            },
        });

        await prisma.order.update({
            where: { id: order.id },
            data: {
                razorpayOrderId: razorpayOrder.id,
            },
        });

        return NextResponse.json({
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
        });
    } catch (err) {
        console.error("[payment/create]", err);
        return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
    }
}
