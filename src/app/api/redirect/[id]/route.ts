import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AffiliateService } from '@/lib/features/affiliate/service';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const product = await prisma.product.findUnique({
            where: { id },
        });

        if (!product || !product.affiliateUrl) {
            return NextResponse.json({ error: 'Product or affiliate link not found' }, { status: 404 });
        }

        // Track click asynchronously
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';

        await AffiliateService.trackClick(product.id, ip, userAgent);

        // Redirect to affiliate link
        return NextResponse.redirect(product.affiliateUrl);
    } catch (error) {
        console.error('Redirect API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
