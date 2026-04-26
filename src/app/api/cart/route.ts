import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

function getUserId(token: { id?: string; sub?: string } | null) {
    return token?.id || token?.sub || null;
}

// GET /api/cart — return cart items for the logged-in user
export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = getUserId(token);
    if (!userId) {
        return NextResponse.json({ items: [] });
    }

    const items = await prisma.cartItem.findMany({
        where: { userId },
        include: {
            product: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    image: true,
                    price: true,
                    originalPrice: true,
                    discount: true,
                    availability: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ items });
}

// POST /api/cart — add or update quantity
export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = getUserId(token);
    if (!userId) {
        return NextResponse.json({ error: "Please login to add items to cart" }, { status: 401 });
    }

    if (token?.role === "admin") {
        return NextResponse.json({ error: "Admins cannot add items to cart. Please login as a regular user." }, { status: 403 });
    }

    const { productId, quantity = 1, mode = "set" } = await req.json();
    if (!productId) {
        return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
        return NextResponse.json({ error: "quantity must be a positive integer" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, availability: true },
    });

    if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.availability === "out_of_stock") {
        return NextResponse.json({ error: "This product is currently out of stock" }, { status: 400 });
    }

    const existing = await prisma.cartItem.findUnique({
        where: { userId_productId: { userId, productId } },
    });

    const nextQuantity = mode === "increment"
        ? (existing?.quantity || 0) + quantity
        : quantity;

    try {
        const item = await prisma.cartItem.upsert({
            where: { userId_productId: { userId, productId } },
            update: { quantity: nextQuantity },
            create: { userId, productId, quantity: nextQuantity },
            include: {
                product: { select: { title: true, price: true, image: true } },
            },
        });
        return NextResponse.json({ item });
    } catch (error: any) {
        console.error("Cart API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

// DELETE /api/cart — remove item (body: { productId }) or clear all (body: { clear: true })
export async function DELETE(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = getUserId(token);
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, clear } = await req.json();

    if (clear) {
        await prisma.cartItem.deleteMany({ where: { userId } });
        return NextResponse.json({ message: "Cart cleared" });
    }

    if (!productId) {
        return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    await prisma.cartItem.delete({
        where: { userId_productId: { userId, productId } },
    });

    return NextResponse.json({ message: "Item removed" });
}
