import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { scrapeProduct } from '@/lib/features/scraper/scraper';
import { AffiliateService } from '@/lib/features/affiliate/service';
import { prisma } from '@/lib/prisma';
import slugify from 'slugify';

export const dynamic = 'force-dynamic';

function isUsableScrape(data: Awaited<ReturnType<typeof scrapeProduct>>): boolean {
    return Boolean(data && !data.fromUrl && data.price > 0 && data.title);
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { amazonUrl, flipkartUrl, url } = await req.json();

        const aUrl = amazonUrl || (url?.includes('amazon') ? url : null);
        const fUrl = flipkartUrl || (url?.includes('flipkart') ? url : null);

        if (!aUrl && !fUrl) {
            return NextResponse.json({ error: 'At least one Amazon or Flipkart URL is required' }, { status: 400 });
        }

        // Concurrently process both
        const [amazonScraped, flipkartScraped] = await Promise.all([
            aUrl ? scrapeProduct(aUrl) : null,
            fUrl ? scrapeProduct(fUrl) : null
        ]);

        let amazonAffiliate = null;
        let flipkartAffiliate = null;

        if (aUrl) {
            amazonAffiliate = await AffiliateService.processProductUrl(aUrl).catch(() => null);
        }
        if (fUrl) {
            flipkartAffiliate = await AffiliateService.processProductUrl(fUrl).catch(() => null);
        }

        const primary = [amazonScraped, flipkartScraped].find(isUsableScrape) || null;
        if (!primary) {
            return NextResponse.json({
                error: 'Failed to scrape a valid product page. Use a direct product URL, not a search or blocked page.'
            }, { status: 422 });
        }

        const prices = [amazonScraped?.price, flipkartScraped?.price].filter(p => p !== undefined && p > 0) as number[];
        const bestPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const originalPrices = [amazonScraped?.originalPrice, flipkartScraped?.originalPrice].filter(p => p !== undefined && p > 0) as number[];
        const bestOriginalPrice = originalPrices.length > 0 ? Math.max(...originalPrices) : undefined;

        // Use scraped rating (prefer Amazon's as it's more stable)
        const rating = amazonScraped?.rating || flipkartScraped?.rating || undefined;

        // Use scraped description
        if (bestPrice <= 0) {
            return NextResponse.json({
                error: 'Could not extract a valid product price from the URL.'
            }, { status: 422 });
        }

        const description = primary.description || `Best price for ${primary.title} on GenzLoots`;

        // Determine category from scraper — use URL-described category or "Uncategorized"
        const scrapedCategory = (primary.category || '').trim();
        const categoryName = scrapedCategory || 'Uncategorized';
        const categorySlug = slugify(categoryName, { lower: true, strict: true }) || 'uncategorized';

        const slug = slugify(primary.title, { lower: true, strict: true });

        // Upsert category first to ensure it exists
        const category = await prisma.category.upsert({
            where: { slug: categorySlug },
            update: {},
            create: { name: categoryName, slug: categorySlug },
        });

        const product = await prisma.product.upsert({
            where: { slug },
            update: {
                price: bestPrice,
                originalPrice: bestOriginalPrice,
                image: primary.image,
                images: primary.images || [],
                rating: rating,
                description: description,
                amazonLink: amazonAffiliate?.affiliateUrl || aUrl || undefined,
                flipkartLink: flipkartAffiliate?.affiliateUrl || fUrl || undefined,
                categoryId: category.id,
            },
            create: {
                title: primary.title,
                slug,
                description,
                price: bestPrice,
                originalPrice: bestOriginalPrice,
                discount: primary.discount,
                image: primary.image,
                images: primary.images || [],
                rating: rating,
                categoryId: category.id,
                amazonLink: amazonAffiliate?.affiliateUrl || aUrl || undefined,
                flipkartLink: flipkartAffiliate?.affiliateUrl || fUrl || undefined,
            },
        });

        // Record price history for graph
        if (amazonScraped && amazonScraped.price > 0) {
            await prisma.productPriceHistory.create({
                data: { productId: product.id, price: amazonScraped.price, platform: 'amazon' }
            });
        }
        if (flipkartScraped && flipkartScraped.price > 0) {
            await prisma.productPriceHistory.create({
                data: { productId: product.id, price: flipkartScraped.price, platform: 'flipkart' }
            });
        }

        return NextResponse.json({ success: true, product });
    } catch (error) {
        console.error('Add Product Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
