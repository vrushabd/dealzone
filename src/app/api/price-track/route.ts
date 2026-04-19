import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scrapeProduct } from '@/lib/features/scraper/scraper';
import { recordPriceHistoryPoint, bulkInsertHistoryPoints } from '@/lib/features/history/service';
import { fetchBuyhatkeHistory } from '@/lib/features/buyhatke/importer';

const productForTrackingSelect = {
    id: true,
    title: true,
    slug: true,
    image: true,
    price: true,
    originalPrice: true,
    rating: true,
    originalUrl: true,
    amazonLink: true,
    flipkartLink: true,
    priceHistory: {
        select: { id: true },
        orderBy: { timestamp: 'asc' as const },
    },
};

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();
        if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

        let normalizedUrl = "";
        try {
            const parsed = new URL(url.trim());
            // Remove most tracking params to keep stable product identity.
            ['pid', 'lid', 'marketplace', 'srsltid', 'affid', 'affExtParam1', 'affExtParam2'].forEach((k) =>
                parsed.searchParams.delete(k)
            );
            normalizedUrl = parsed.toString();
        } catch {
            return NextResponse.json({ error: 'Invalid product URL' }, { status: 400 });
        }

        // ── Phase 1: DB lookup (exact URL match only to avoid wrong-product data) ──
        const exactMatch = await prisma.product.findFirst({
            where: { originalUrl: normalizedUrl },
            select: productForTrackingSelect,
        });

        // ── Phase 2: Scrape current price ──────────────────────────────────────────
        const scraped = await scrapeProduct(normalizedUrl);

        // Determine platform from URL
        const platform = normalizedUrl.includes('amazon') ? 'amazon'
                       : normalizedUrl.includes('flipkart') ? 'flipkart'
                       : 'unknown';

        // needsDemoData = scraping returned nothing useful (blocked by anti-bot)
        const needsDemoData = !scraped || scraped.price === 0;

        // Build the "effective" product data for this URL.
        // IMPORTANT: Only fall back to exactMatch DB data if it's the same URL.
        // Never mix in data from a different product to avoid showing wrong details.
        let effectiveTitle    = scraped?.title || normalizedUrl.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Product';
        let effectiveImage    = scraped?.image || null;
        let effectivePrice    = scraped?.price || 0;
        let effectiveOriginal = scraped?.originalPrice || null;
        const effectiveRating = typeof scraped?.rating === 'number' ? scraped.rating : null;

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
        let needsBuyhatkeImport = false;

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
                    ...(effectiveRating ? { rating: effectiveRating } : {}),
                    originalUrl:   normalizedUrl,
                    flipkartLink:  platform === 'flipkart' ? normalizedUrl : null,
                    amazonLink:    platform === 'amazon'   ? normalizedUrl : null,
                    isPublic:      false,
                },
                select: productForTrackingSelect,
            });
            needsBuyhatkeImport = true;
        } else if (product.price === 0 || product.priceHistory.length === 0) {
            // Existing product with unusable state — heal it
            product = await prisma.product.update({
                where: { id: product.id },
                data: {
                    price:         effectivePrice,
                    originalPrice: effectiveOriginal ?? product.originalPrice,
                    // Only update image if scraper returned one (don't overwrite with null)
                    ...(effectiveImage ? { image: effectiveImage } : {}),
                    ...(effectiveRating ? { rating: effectiveRating } : {}),
                },
                select: productForTrackingSelect,
            });
            if (product.priceHistory.length === 0) {
                needsBuyhatkeImport = true;
            }
        } else if (!needsDemoData && effectivePrice > 0) {
            // Live scrape succeeded AND price changed — keep product data fresh
            await prisma.product.update({
                where: { id: product.id },
                data: {
                    price: effectivePrice,
                    ...(effectiveImage ? { image: effectiveImage } : {}),
                    ...(effectiveRating ? { rating: effectiveRating } : {}),
                },
            });
        }

        // ── Phase 3.5: One-time Buyhatke Data Import ──────────────────────────────
        if (needsBuyhatkeImport && product) {
            try {
                const importedPoints = await fetchBuyhatkeHistory(normalizedUrl, platform as any);
                if (importedPoints && importedPoints.length > 0) {
                    await bulkInsertHistoryPoints(product.id, importedPoints, "buyhatke_import");
                }
            } catch (err) {
                console.error("Buyhatke import failed natively, continuing:", err);
            }
        }




        // ── Phase 4: Record today's price point ───────────────────────────────────
        if (product && effectivePrice > 0) {
            await recordPriceHistoryPoint({
                productId: product.id,
                price: effectivePrice,
                platform,
            });
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
                rating:        product!.rating ?? null,
                platform,
                url: normalizedUrl,
            },
            history: history.map((h) => ({
                price: h.price,
                date:  h.timestamp,
            })),
            lowestPrice:  Math.min(effectivePrice, ...history.map((h) => h.price)),
            highestPrice: Math.max(effectivePrice, ...history.map((h) => h.price)),
            category:     scraped?.category || null,
        });

    } catch (error) {
        console.error('Price track error:', error);
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
