import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scrapeProduct } from '@/lib/features/scraper/scraper';

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();
        if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

        // Scrape current price
        const scraped = await scrapeProduct(url);
        if (!scraped || scraped.price === 0) {
            return NextResponse.json({ error: 'Could not fetch price for this URL. Try the direct product page URL.' }, { status: 422 });
        }

        // Find or create product by originalUrl or slug
        const { default: slugify } = await import('slugify');
        const slug = slugify(scraped.title, { lower: true, strict: true });

        let product = await prisma.product.findFirst({
            where: { OR: [{ originalUrl: url }, { slug }] },
            include: { priceHistory: { orderBy: { timestamp: 'asc' } } },
        });

        if (!product) {
            product = await prisma.product.create({
                data: {
                    title: scraped.title,
                    slug: slug + '-' + Date.now(),
                    price: scraped.price,
                    originalPrice: scraped.originalPrice,
                    image: scraped.image || null,
                    originalUrl: url,
                    flipkartLink: scraped.platform === 'flipkart' ? url : null,
                    amazonLink: scraped.platform === 'amazon' ? url : null,
                },
                include: { priceHistory: true },
            });
        }

        // Record today's price entry
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existing = await prisma.productPriceHistory.findFirst({
            where: { productId: product.id, timestamp: { gte: today } },
        });
        if (!existing) {
            await prisma.productPriceHistory.create({
                data: { productId: product.id, price: scraped.price },
            });
        }

        // Return full history
        const history = await prisma.productPriceHistory.findMany({
            where: { productId: product.id },
            orderBy: { timestamp: 'asc' },
        });

        return NextResponse.json({
            product: {
                id: product.id,
                title: scraped.title,
                image: scraped.image,
                price: scraped.price,
                originalPrice: scraped.originalPrice,
                platform: scraped.platform,
                url,
            },
            history: history.map(h => ({
                price: h.price,
                date: h.timestamp,
            })),
            lowestPrice: Math.min(...history.map(h => h.price)),
            highestPrice: Math.max(...history.map(h => h.price)),
        });
    } catch (error) {
        console.error('Price track error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
