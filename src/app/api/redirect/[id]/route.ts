import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const product = await prisma.product.findUnique({
            where: { id },
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const targetUrl = product.originalUrl || product.affiliateUrl || product.amazonLink || product.flipkartLink || product.meeshoLink;

        if (!targetUrl) {
            return NextResponse.json({ error: 'No target link found for this product' }, { status: 404 });
        }

        // Redirect to external link
        return NextResponse.redirect(targetUrl);
    } catch (error) {
        console.error('Redirect API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
