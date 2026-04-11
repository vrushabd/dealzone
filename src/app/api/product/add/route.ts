import { NextRequest, NextResponse } from 'next/server';
import { scrapeProduct } from '@/lib/features/scraper/scraper';
import { AffiliateService } from '@/lib/features/affiliate/service';
import { prisma } from '@/lib/prisma';
import slugify from 'slugify';

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const scraped = await scrapeProduct(url);
        if (!scraped) {
            return NextResponse.json({ error: 'Failed to scrape product data' }, { status: 400 });
        }

        // Generate affiliate link
        let affiliateUrl = undefined;
        try {
            const aff = await AffiliateService.processProductUrl(url);
            if (aff) affiliateUrl = aff.affiliateUrl;
        } catch (e) {
            console.error('Affiliate generation failed:', e);
        }

        const slug = slugify(scraped.title, { lower: true, strict: true });

        const product = await prisma.product.upsert({
            where: { slug },
            update: {
                price: scraped.price,
                originalPrice: scraped.originalPrice,
                discount: scraped.discount,
                image: scraped.image,
                affiliateUrl: affiliateUrl || undefined,
                originalUrl: url,
            },
            create: {
                title: scraped.title,
                slug,
                description: `Best price for ${scraped.title} on ${scraped.platform}`,
                price: scraped.price,
                originalPrice: scraped.originalPrice,
                discount: scraped.discount,
                image: scraped.image,
                category: {
                    connectOrCreate: {
                        where: { slug: "uncategorized" },
                        create: { name: "Uncategorized", slug: "uncategorized" },
                    },
                },
                affiliateUrl: affiliateUrl || undefined,
                originalUrl: url,
            },
        });

        return NextResponse.json({ success: true, product });
    } catch (error) {
        console.error('Add Product Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
