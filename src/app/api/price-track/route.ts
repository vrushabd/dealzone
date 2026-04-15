import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scrapeProduct } from '@/lib/features/scraper/scraper';

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();
        if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

        // ── Phase 1: DB lookup (exact URL match only to avoid wrong-product data) ──
        const exactMatch = await prisma.product.findFirst({
            where: { originalUrl: url },
            include: { priceHistory: { orderBy: { timestamp: 'asc' } } },
        });

        // ── Phase 2: Scrape current price ──────────────────────────────────────────
        const scraped = await scrapeProduct(url);
        const validScraped = scraped as any;

        // Determine platform from URL
        const platform = url.includes('amazon') ? 'amazon'
                       : url.includes('flipkart') ? 'flipkart'
                       : 'unknown';

        // needsDemoData = scraping returned nothing useful (blocked by anti-bot)
        const needsDemoData = !scraped || scraped.price === 0;

        // Build the "effective" product data for this URL.
        // IMPORTANT: Only fall back to exactMatch DB data if it's the same URL.
        // Never mix in data from a different product to avoid showing wrong details.
        let effectiveTitle    = validScraped?.title   || url.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Product';
        let effectiveImage    = validScraped?.image    || null;
        let effectivePrice    = validScraped?.price    || 0;
        let effectiveOriginal = validScraped?.originalPrice || null;

        if (needsDemoData && exactMatch) {
            // exactMatch IS the same product — safe to use its stored data
            effectiveTitle    = exactMatch.title || effectiveTitle;
            effectiveImage    = exactMatch.image || effectiveImage;
            
            // Only use stored price if valid, never guess or randomize
            const storedPrice = exactMatch.price || 0;
            const storedMRP   = exactMatch.originalPrice || 0;
            
            if (storedPrice > 0) {
                effectivePrice = storedPrice;
            } else {
                effectivePrice = 0; 
            }
            effectiveOriginal = storedMRP || null;
        } else if (needsDemoData) {
            // No DB match and scrape failed — DO NOT synthesize!
            // The scraper was completely blocked or failed to find price data.
            effectivePrice = 0;
        }

        // --- Price Sanity Check ---
        // If we found a price but it exceeds the original price (MRP), it's likely a scraping error
        if (effectivePrice > 0 && effectiveOriginal && effectiveOriginal > 0 && effectivePrice > effectiveOriginal) {
            effectivePrice = effectiveOriginal;
        }

        // --- Block zero price creation ---
        if (effectivePrice === 0 && !exactMatch) {
            return NextResponse.json({ error: 'Could not extract exact product price. The product might be unavailable or protected against scraping.' }, { status: 400 });
        }

        // ── Phase 3: Upsert product record ────────────────────────────────────────
        let product = exactMatch;

        if (!product) {
            const { default: slugify } = await import('slugify');
            const slug = slugify(effectiveTitle || 'product', { lower: true, strict: true }) + '-' + Date.now();

            product = await prisma.product.create({
                data: {
                    title:         effectiveTitle,
                    slug:          slug,
                    price:         effectivePrice,
                    originalPrice: effectiveOriginal,
                    image:         effectiveImage,
                    originalUrl:   url,
                    flipkartLink:  platform === 'flipkart' ? url : null,
                    amazonLink:    platform === 'amazon'   ? url : null,
                    isPublic:      false,
                },
                include: { priceHistory: true },
            });
        } else if (product.price === 0 || product.priceHistory.length === 0) {
            // Existing product with unusable state — heal it
            product = await prisma.product.update({
                where: { id: product.id },
                data: {
                    price:         effectivePrice,
                    originalPrice: effectiveOriginal ?? product.originalPrice,
                    // Only update image if scraper returned one (don't overwrite with null)
                    ...(effectiveImage ? { image: effectiveImage } : {}),
                },
                include: { priceHistory: true },
            });
        } else if (!needsDemoData && effectivePrice > 0) {
            // Live scrape succeeded AND price changed — keep product data fresh
            await prisma.product.update({
                where: { id: product.id },
                data: {
                    price: effectivePrice,
                    ...(effectiveImage ? { image: effectiveImage } : {}),
                },
            });
        }



        // ── Phase 4: Record today's price point ───────────────────────────────────
        if (product && effectivePrice > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const existing = await prisma.productPriceHistory.findFirst({
                where: { productId: product.id, platform, timestamp: { gte: today } },
            });
            if (!existing) {
                await prisma.productPriceHistory.create({
                    data: { productId: product.id, price: effectivePrice, platform },
                });
            } else if (existing.price !== effectivePrice && !needsDemoData) {
                await prisma.productPriceHistory.update({
                    where: { id: existing.id },
                    data: { price: effectivePrice },
                });
            }
        }

        // ── Phase 5: Return response ──────────────────────────────────────────────
        const history = await prisma.productPriceHistory.findMany({
            where: { productId: product!.id },
            orderBy: { timestamp: 'asc' },
        });

        return NextResponse.json({
            product: {
                id:            product!.id,
                title:         product!.title,
                image:         product!.image,
                price:         effectivePrice || product!.price,
                originalPrice: product!.originalPrice,
                platform,
                url,
            },
            history: history.map((h: any) => ({
                price: h.price,
                date:  h.timestamp,
            })),
            lowestPrice:  Math.min(effectivePrice, ...history.map((h: any) => h.price)),
            highestPrice: Math.max(effectivePrice, ...history.map((h: any) => h.price)),
            category:     validScraped?.category || null,
        });

    } catch (error) {
        console.error('Price track error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


