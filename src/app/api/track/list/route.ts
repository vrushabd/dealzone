import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const tracked = await prisma.trackedProduct.findMany({
            include: { product: true },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(tracked);
    } catch (error) {
        console.error('List Track API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
