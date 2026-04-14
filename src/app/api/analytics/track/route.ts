import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const { url, sessionId } = await req.json();

        if (!url || !sessionId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Keep it super lightweight - fire and forget db insert
        await prisma.pageView.create({
            data: {
                url: url.substring(0, 255), // safety limit
                sessionId: sessionId.substring(0, 100),
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Analytics tracking error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
