import { NextRequest, NextResponse } from 'next/server';
import { runProductSync } from '@/lib/features/sync/service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sync
 * Automatically trigger a refresh of all product prices (used by GitHub Actions cron).
 * Security: Requires a 'x-sync-secret' header matching the environment variable.
 */
export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('x-sync-secret');
    const secret = process.env.SYNC_SECRET;

    if (!secret) {
        return NextResponse.json({ error: 'Missing SYNC_SECRET on server.' }, { status: 500 });
    }

    if (authHeader !== secret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        return NextResponse.json(await runProductSync('cron'));
    } catch (error) {
        console.error('Sync API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

