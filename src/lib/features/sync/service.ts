import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { scrapeProduct, type ScrapedProduct } from "@/lib/features/scraper/scraper";
import { triggerPriceDropAlerts } from "@/lib/features/alerts/service";
import { recordPriceHistoryPoint } from "@/lib/features/history/service";

type ScrapedReview = NonNullable<ScrapedProduct["reviews"]>[number];

export type ProductSyncResults = {
    total: number;
    updated: number;
    failed: number;
    alertsAttempted: number;
    alertsSent: number;
    alertsFailed: number;
};

export async function runProductSync(triggeredBy: "manual" | "cron" = "manual") {
    const startTime = Date.now();

    const products = await prisma.product.findMany({
        where: {
            OR: [
                { amazonLink: { not: null } },
                { flipkartLink: { not: null } },
                { originalUrl: { not: null } },
            ],
        },
        select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            originalPrice: true,
            image: true,
            amazonLink: true,
            flipkartLink: true,
            originalUrl: true,
        },
    });

    const results: ProductSyncResults = {
        total: products.length,
        updated: 0,
        failed: 0,
        alertsAttempted: 0,
        alertsSent: 0,
        alertsFailed: 0,
    };

    let errorMessage: string | undefined;

    try {
        for (const product of products) {
            const url = product.originalUrl || product.amazonLink || product.flipkartLink;
            if (!url) continue;

            try {
                const scraped = await scrapeProduct(url);
                if (!scraped || scraped.price <= 0) {
                    results.failed++;
                    continue;
                }

                const platform = url.includes("amazon") ? "amazon" : "flipkart";
                const updateData: Prisma.ProductUpdateInput = {
                    price: scraped.price,
                    originalPrice: scraped.originalPrice || product.originalPrice,
                    image: scraped.image || product.image,
                    updatedAt: new Date(),
                };

                if (scraped.description) updateData.description = scraped.description;
                if (scraped.seller) updateData.seller = scraped.seller;
                if (typeof scraped.rating === "number") updateData.rating = scraped.rating;
                if (scraped.reviews && scraped.reviews.length > 0) {
                    updateData.reviews = {
                        deleteMany: {},
                        create: scraped.reviews.map((review: ScrapedReview) => ({
                            rating: review.rating,
                            title: review.title,
                            comment: review.comment,
                            author: review.author,
                        })),
                    };
                }

                await prisma.product.update({
                    where: { id: product.id },
                    data: updateData,
                });

                await recordPriceHistoryPoint({
                    productId: product.id,
                    price: scraped.price,
                    platform,
                });

                const alertResults = await triggerPriceDropAlerts({
                    productId: product.id,
                    productTitle: product.title,
                    productSlug: product.slug,
                    productImage: scraped.image || product.image,
                    oldPrice: product.price,
                    newPrice: scraped.price,
                });

                results.alertsAttempted += alertResults.attempted;
                results.alertsSent += alertResults.sent;
                results.alertsFailed += alertResults.failed;
                results.updated++;
            } catch (error) {
                console.error(`Failed to sync product ${product.id}:`, error);
                results.failed++;
            }

            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    } catch (err) {
        errorMessage = err instanceof Error ? err.message : "Unknown error";
    }

    // Persist sync log
    try {
        await prisma.syncLog.create({
            data: {
                triggeredBy,
                status: errorMessage ? "error" : "success",
                total: results.total,
                updated: results.updated,
                failed: results.failed,
                alertsSent: results.alertsSent,
                errorMessage: errorMessage ?? null,
                durationMs: Date.now() - startTime,
            },
        });
    } catch (logErr) {
        console.error("Failed to write sync log:", logErr);
    }

    return {
        success: true as const,
        message: `Sync completed: ${results.updated} updated, ${results.failed} failed.`,
        results,
    };
}
