import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// POST /api/payment/verify — verify Razorpay signature and mark order as paid
export async function POST(req: NextRequest) {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = await req.json();

        const secret = process.env.RAZORPAY_KEY_SECRET || "placeholder_secret";
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest("hex");

        if (expectedSignature !== razorpaySignature) {
            return NextResponse.json({ error: "Payment verification failed — invalid signature" }, { status: 400 });
        }

        // Mark order as paid
        await prisma.order.update({
            where: { id: orderId },
            data: {
                paymentStatus: "paid",
                status: "confirmed",
                razorpayOrderId,
                razorpayPaymentId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[payment/verify]", err);
        return NextResponse.json({ error: "Verification error" }, { status: 500 });
    }
}
