import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scrapeProduct } from '@/lib/features/scraper/scraper';

/**
 * GET /api/sync
 * Manually or automatically trigger a refresh of all product prices and images.
 * Security: Requires a 'x-sync-secret' header matching the environment variable.
 */
export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('x-sync-secret');
    const secret = process.env.SYNC_SECRET || 'dealzone-sync-key-v1';

    if (authHeader !== secret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const products = await prisma.product.findMany({
            where: {
                OR: [
                    { amazonLink: { not: null } },
                    { flipkartLink: { not: null } },
                    { originalUrl: { not: null } }
                ]
            }
        });

        const results = {
            total: products.length,
            updated: 0,
            failed: 0,
        };

        // We process them sequentially to avoid overwhelming the scraper / getting rate limited
        for (const product of products) {
            const url = product.originalUrl || product.amazonLink || product.flipkartLink;
            if (!url) continue;

            try {
                const scraped = await scrapeProduct(url);
                if (scraped && scraped.price > 0) {
                    const platform = url.includes('amazon') ? 'amazon' : 'flipkart';
                    
                    // Update main product record
                    await prisma.product.update({
                        where: { id: product.id },
                        data: {
                            price: scraped.price,
                            originalPrice: scraped.originalPrice || product.originalPrice,
                            image: scraped.image || product.image,
                            updatedAt: new Date(),
                        }
                    });

                    // Record history for today if not already recorded
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    const existingHistory = await prisma.productPriceHistory.findFirst({
                        where: {
                            productId: product.id,
                            timestamp: { gte: today }
                        }
                    });

                    if (!existingHistory) {
                        await prisma.productPriceHistory.create({
                            data: {
                                productId: product.id,
                                price: scraped.price,
                                platform,
                                timestamp: new Date()
                            }
                        });
                    } else if (existingHistory.price !== scraped.price) {
                        await prisma.productPriceHistory.update({
                            where: { id: existingHistory.id },
                            data: { price: scraped.price }
                        });
                    }

                    results.updated++;
                } else {
                    results.failed++;
                }
            } catch (err) {
                console.error(`Failed to sync product ${product.id}:`, err);
                results.failed++;
            }
            
            // Small delay to be polite to the target servers
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        return NextResponse.json({ 
            success: true, 
            message: `Sync completed: ${results.updated} updated, ${results.failed} failed.`,
            results 
        });

    } catch (error) {
        console.error('Sync API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
