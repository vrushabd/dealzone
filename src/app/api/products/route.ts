import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { affiliateClicks: true }
                }
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
