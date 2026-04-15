import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import slugify from "slugify";

export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            include: { _count: { select: { products: true } } },
            orderBy: { name: "asc" },
        });
        return NextResponse.json(categories);
    } catch {
        return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const data = await request.json();
        let slug = slugify(data.name, { lower: true, strict: true });
        
        // Ensure unique slug
        const existing = await prisma.category.findUnique({ where: { slug } });
        if (existing) {
            slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
        }

        const category = await prisma.category.create({
            data: { name: data.name, slug, icon: data.icon || null },
        });
        return NextResponse.json(category, { status: 201 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Failed to create category";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
        await prisma.category.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }
}
