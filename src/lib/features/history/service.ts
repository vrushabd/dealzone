import { prisma } from "@/lib/prisma";

type PriceHistoryInput = {
    productId: string;
    price: number;
    platform?: string | null;
    timestamp?: Date;
};

export async function recordPriceHistoryPoint(input: PriceHistoryInput) {
    if (!Number.isFinite(input.price) || input.price <= 0) {
        return null;
    }

    const platform = input.platform || "unknown";
    const timestamp = input.timestamp || new Date();
    const startOfToday = new Date(timestamp);
    startOfToday.setHours(0, 0, 0, 0);

    const latestHistory = await prisma.productPriceHistory.findFirst({
        where: {
            productId: input.productId,
            platform,
        },
        orderBy: { timestamp: "desc" },
    });

    const shouldCreate =
        !latestHistory ||
        latestHistory.price !== input.price ||
        latestHistory.timestamp < startOfToday;

    if (!shouldCreate) {
        return latestHistory;
    }

    return prisma.productPriceHistory.create({
        data: {
            productId: input.productId,
            price: input.price,
            platform,
            timestamp,
        },
    });
}

/**
 * Bulk-insert historical price points (e.g., bootstrapped from Buyhatke).
 * Skips duplicates to avoid cluttering the chart.
 */
export async function bulkInsertHistoryPoints(
    productId: string,
    points: { date: Date; price: number }[],
    platform = "buyhatke_import"
) {
    if (!points.length) return 0;

    const valid = points.filter((p) => p.price > 0 && Number.isFinite(p.price));
    if (!valid.length) return 0;

    const result = await prisma.productPriceHistory.createMany({
        data: valid.map((p) => ({
            productId,
            price: p.price,
            platform,
            timestamp: p.date,
        })),
        skipDuplicates: true,
    });

    return result.count;
}
