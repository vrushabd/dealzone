import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import slugify from "slugify";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search')?.trim() || '';
        const category = searchParams.get('category') || '';
        const featured = searchParams.get('featured') === 'true';

        const where: any = {};
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (category) where.category = { slug: category };
        if (featured) where.featured = true;

        const products = await prisma.product.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                category: true,
                _count: { select: { affiliateClicks: true } }
            }
        });

        const results = products.map(p => ({
            ...p,
            affiliateUrl: `/api/redirect/${p.id}`,
            clickCount: p._count.affiliateClicks
        }));

        return NextResponse.json(results);
    } catch (error) {
        console.error('List Products API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST create product (admin only)
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const data = await request.json();
        const slug = slugify(data.title, { lower: true, strict: true }) + '-' + Date.now();

        const product = await prisma.product.create({
            data: {
                title: data.title,
                slug,
                description: data.description || null,
                image: data.image || null,
                price: data.price ? parseFloat(data.price) : null,
                originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : null,
                discount: data.discount ? parseFloat(data.discount) : null,
                amazonLink: data.amazonLink || null,
                flipkartLink: data.flipkartLink || null,
                featured: data.featured || false,
                categoryId: data.categoryId || null,
                isPublic: true,
            },
            include: { category: true },
        });

        return NextResponse.json(product);
    } catch (error: unknown) {
        console.error('Create product error:', error);
        const msg = error instanceof Error ? error.message : "Failed to create product";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
