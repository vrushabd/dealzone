import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import slugify from "slugify";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search')?.trim() || '';
        const category = searchParams.get('category') || '';
        const featured = searchParams.get('featured') === 'true';

        const where: any = {};
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (category) where.category = { slug: category };
        if (featured) where.featured = true;

        const products = await prisma.product.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                category: true,
                _count: { select: { affiliateClicks: true } }
            }
        });

        const results = products.map(p => ({
            ...p,
            affiliateUrl: `/api/redirect/${p.id}`,
            clickCount: p._count.affiliateClicks
        }));

        return NextResponse.json(results);
    } catch (error) {
        console.error('List Products API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST create product (admin only)
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const data = await request.json();
        const slug = slugify(data.title, { lower: true, strict: true }) + '-' + Date.now();

        const platform = data.amazonLink?.includes('amazon') ? 'amazon' 
                       : data.flipkartLink?.includes('flipkart') ? 'flipkart'
                       : 'unknown';

        const product = await prisma.product.create({
            data: {
                title: data.title,
                slug,
                description: data.description || null,
                image: data.image || null,
                price: data.price ? parseFloat(data.price) : null,
                originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : null,
                discount: data.discount ? parseFloat(data.discount) : null,
                amazonLink: data.amazonLink || null,
                flipkartLink: data.flipkartLink || null,
                featured: data.featured || false,
                categoryId: data.categoryId || null,
                isPublic: true,
                originalUrl: data.amazonLink || data.flipkartLink || null,
            },
            include: { category: true },
        });

        // Seed 15 days of mocked history so the charts and AI are functional immediately
        const basePrice = data.price ? parseFloat(data.price) : 0;
        if (basePrice > 0) {
            const history = buildMockHistory(product.id, basePrice, platform);
            await prisma.productPriceHistory.createMany({ data: history });
            
            // Also add today's entry
            await prisma.productPriceHistory.create({
                data: {
                    productId: product.id,
                    price: basePrice,
                    platform,
                }
            });
        }

        return NextResponse.json(product);
    } catch (error: unknown) {
        console.error('Create product error:', error);
        const msg = error instanceof Error ? error.message : "Failed to create product";
        return NextResponse.json({ error: msg }, { status: 500 });
    } finally {
        console.log(`Product creation attempt finished for slug: ${slug}`);
    }
}

/** Build 15 days of realistic mock price history for a new product */
function buildMockHistory(productId: string, basePrice: number, platform: string) {
    const history: any[] = [];
    const now = new Date();
    // Start ~15% higher and trend down to current price
    let trendPrice = basePrice * 1.15;

    for (let i = 15; i >= 1; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        // Random walk ±3% per day, biased slightly downward
        const change = (Math.random() > 0.45 ? -1 : 1) * (basePrice * 0.03);
        trendPrice = Math.max(basePrice * 0.8, trendPrice + change);

        history.push({
            productId,
            price:     Math.round(trendPrice),
            platform,
            timestamp: date,
        });
    }
    return history;
}

