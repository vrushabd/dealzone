import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('productId');

        if (!productId) {
            return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
        }

        const history = await prisma.productPriceHistory.findMany({
            where: { productId },
            orderBy: { timestamp: 'asc' },
        });

        // Map timestamp to date for frontend compatibility
        const mappedHistory = history.map((h) => ({
            ...h,
            date: h.timestamp
        }));

        return NextResponse.json(mappedHistory);
    } catch (error: any) {
        console.error('History API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
