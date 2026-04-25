import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { razorpay } from "@/lib/razorpay";

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
        const { amount, orderId } = await req.json();

        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(amount * 100), // convert to paise
            currency: "INR",
            receipt: orderId,
            notes: {
                orderId,
                userId,
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
