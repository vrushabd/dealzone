import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

function getUserId(token: { id?: string; sub?: string } | null) {
    return token?.id || token?.sub || null;
}

// GET /api/orders — get orders for logged-in user
export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = getUserId(token);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
        where: { userId },
        include: { items: true },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
}

// POST /api/orders — place a new order
export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = getUserId(token);
    if (!userId) {
        return NextResponse.json({ error: "Please login to place an order" }, { status: 401 });
    }

    try {
        const {
            items,          // [{ productId, quantity, price, title, image }]
            paymentMethod,  // "COD" | "online"
            shippingName,
            shippingPhone,
            shippingAddress,
            shippingCity,
            shippingState,
            shippingPincode,
        } = await req.json();

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "No items in order" }, { status: 400 });
        }

        const subtotal = items.reduce((s: number, i: { price: number; quantity: number }) => s + i.price * i.quantity, 0);
        const shippingFee = paymentMethod === "COD" ? 40 : 0;
        const total = subtotal + shippingFee;

        const order = await prisma.order.create({
            data: {
                userId,
                paymentMethod,
                paymentStatus: "pending",
                subtotal,
                shippingFee,
                total,
                shippingName,
                shippingPhone,
                shippingAddress,
                shippingCity,
                shippingState,
                shippingPincode,
                items: {
                    create: items.map((item: { productId: string; quantity: number; price: number; title: string; image?: string }) => ({
                        productId: item.productId,
                        productTitle: item.title,
                        productImage: item.image || null,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                },
            },
            include: { items: true },
        });

        // Clear the cart after placing order
        await prisma.cartItem.deleteMany({ where: { userId } });

        return NextResponse.json({ order }, { status: 201 });
    } catch (err) {
        console.error("[orders POST]", err);
        return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
    }
}
