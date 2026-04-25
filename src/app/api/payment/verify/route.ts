import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { sendPaymentConfirmedEmail } from "@/lib/features/email/orders";

function getUserId(token: { id?: string; sub?: string } | null) {
    return token?.id || token?.sub || null;
}

// POST /api/payment/verify — verify Razorpay signature and mark order as paid
export async function POST(req: NextRequest) {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = await req.json();
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        const userId = getUserId(token);

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!process.env.RAZORPAY_KEY_SECRET) {
            return NextResponse.json({ error: "Razorpay is not configured on the server" }, { status: 500 });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: true,
                user: { select: { id: true, email: true } },
            },
        });

        if (!order || order.userId !== userId) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        if (order.paymentMethod !== "online") {
            return NextResponse.json({ error: "This order does not require online payment" }, { status: 400 });
        }

        if (order.paymentStatus === "paid") {
            return NextResponse.json({ success: true, alreadyPaid: true });
        }

        if (order.razorpayOrderId && order.razorpayOrderId !== razorpayOrderId) {
            return NextResponse.json({ error: "Payment order mismatch" }, { status: 400 });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET;
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest("hex");

        if (expectedSignature !== razorpaySignature) {
            return NextResponse.json({ error: "Payment verification failed — invalid signature" }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: "paid",
                    status: "confirmed",
                    razorpayOrderId,
                    razorpayPaymentId,
                },
            });

            await tx.cartItem.deleteMany({
                where: { userId: order.userId },
            });
        });

        if (order.user.email) {
            await sendPaymentConfirmedEmail({
                userEmail: order.user.email,
                shippingName: order.shippingName,
                orderId: order.id,
                paymentMethod: order.paymentMethod,
                items: order.items.map((item) => ({
                    productTitle: item.productTitle,
                    productImage: item.productImage,
                    quantity: item.quantity,
                    price: item.price,
                })),
                subtotal: order.subtotal,
                shippingFee: order.shippingFee,
                total: order.total,
            });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[payment/verify]", err);
        return NextResponse.json({ error: "Verification error" }, { status: 500 });
    }
}
