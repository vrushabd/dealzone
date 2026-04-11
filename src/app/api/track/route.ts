import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const { productId, email, targetPrice } = await req.json();

        if (!productId || !email) {
            return NextResponse.json({ error: 'Missing productId or email' }, { status: 400 });
        }

        const tracked = await prisma.trackedProduct.create({
            data: {
                productId,
                email,
                targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
            },
        });

        return NextResponse.json({ success: true, tracked });
    } catch (error) {
        console.error('Track API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
