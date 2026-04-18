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
