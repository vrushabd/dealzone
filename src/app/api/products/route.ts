import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
