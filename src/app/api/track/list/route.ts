import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
