import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('productId');

        if (!productId) {
            return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
        }

        // Use the correct accessor based on Prisma Client generation
        const historyModel = (prisma as any).productPriceHistory || (prisma as any).productpricehistory;

        if (!historyModel) {
            throw new Error('ProductPriceHistory model not found in Prisma');
        }

        const history = await historyModel.findMany({
            where: { productId },
            orderBy: { timestamp: 'asc' },
        });

        // Map timestamp to date for frontend compatibility
        const mappedHistory = history.map((h: any) => ({
            ...h,
            date: h.timestamp
        }));

        return NextResponse.json(mappedHistory);
    } catch (error: any) {
        console.error('History API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
