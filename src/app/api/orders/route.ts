import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { sendOrderPlacedEmail } from "@/lib/features/email/orders";

function getUserId(token: { id?: string; sub?: string } | null) {
    return token?.id || token?.sub || null;
}

function normalizePhone(phone: string) {
    return phone.replace(/\D/g, "");
}

function validateShippingFields(input: {
    shippingName?: string;
    shippingPhone?: string;
    shippingAddress?: string;
    shippingCity?: string;
    shippingState?: string;
    shippingPincode?: string;
}) {
    if (!input.shippingName?.trim() || !input.shippingPhone?.trim() || !input.shippingAddress?.trim() || !input.shippingCity?.trim() || !input.shippingState?.trim() || !input.shippingPincode?.trim()) {
        return "All shipping fields are required";
    }

    if (!/^\d{10}$/.test(normalizePhone(input.shippingPhone))) {
        return "Enter a valid 10-digit phone number";
    }

    if (!/^\d{6}$/.test(input.shippingPincode.trim())) {
        return "Enter a valid 6-digit pincode";
    }

    return null;
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
            paymentMethod,  // "COD" | "online"
            shippingName,
            shippingPhone,
            shippingAddress,
            shippingCity,
            shippingState,
            shippingPincode,
        } = await req.json();

        if (paymentMethod !== "COD" && paymentMethod !== "online") {
            return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
        }

        const shippingError = validateShippingFields({
            shippingName,
            shippingPhone,
            shippingAddress,
            shippingCity,
            shippingState,
            shippingPincode,
        });

        if (shippingError) {
            return NextResponse.json({ error: shippingError }, { status: 400 });
        }

        const cartItems = await prisma.cartItem.findMany({
            where: { userId },
            include: {
                product: {
                    select: {
                        id: true,
                        title: true,
                        image: true,
                        price: true,
                        availability: true,
                    },
                },
            },
        });

        if (cartItems.length === 0) {
            return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
        }

        const invalidCartItem = cartItems.find(
            (item) =>
                !item.product.price ||
                item.product.price <= 0 ||
                item.product.availability === "out_of_stock"
        );

        if (invalidCartItem) {
            return NextResponse.json(
                {
                    error: `"${invalidCartItem.product.title}" is currently unavailable. Please update your cart and try again.`,
                },
                { status: 400 }
            );
        }

        const subtotal = cartItems.reduce(
            (sum, item) => sum + (item.product.price || 0) * item.quantity,
            0
        );
        const shippingFee = paymentMethod === "COD" ? 40 : 0;
        const total = subtotal + shippingFee;

        const order = await prisma.$transaction(async (tx) => {
            const createdOrder = await tx.order.create({
                data: {
                    userId,
                    paymentMethod,
                    paymentStatus: "pending",
                    subtotal,
                    shippingFee,
                    total,
                    shippingName: shippingName.trim(),
                    shippingPhone: normalizePhone(shippingPhone),
                    shippingAddress: shippingAddress.trim(),
                    shippingCity: shippingCity.trim(),
                    shippingState: shippingState.trim(),
                    shippingPincode: shippingPincode.trim(),
                    items: {
                        create: cartItems.map((item) => ({
                            productId: item.productId,
                            productTitle: item.product.title,
                            productImage: item.product.image || null,
                            quantity: item.quantity,
                            price: item.product.price || 0,
                        })),
                    },
                },
                include: {
                    items: true,
                    user: { select: { email: true } },
                },
            });

            await tx.user.update({
                where: { id: userId },
                data: {
                    name: shippingName.trim(),
                    phone: normalizePhone(shippingPhone),
                    address: shippingAddress.trim(),
                    city: shippingCity.trim(),
                    state: shippingState.trim(),
                    pincode: shippingPincode.trim(),
                },
            });

            await tx.cartItem.deleteMany({ where: { userId } });

            return createdOrder;
        });

        if (paymentMethod === "COD" && order.user.email) {
            await sendOrderPlacedEmail({
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

        return NextResponse.json({ order }, { status: 201 });
    } catch (err) {
        console.error("[orders POST]", err);
        return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
    }
}
