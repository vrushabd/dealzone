import { prisma } from '@/lib/prisma';

export interface PricePrediction {
    productId: string;
    trend: 'down' | 'up' | 'stable';
    predictedPrice: number;
    confidence: number;
    reason: string;
    dataPoints: number;
    minimumRequired: number;
    daysUntilNextDrop?: number;
}

export async function predictPrice(productId: string): Promise<PricePrediction> {
    const history = await prisma.productPriceHistory.findMany({
        where: { productId },
        orderBy: { timestamp: 'asc' },
        take: 30, // Last 30 points
    });

    const minimumRequired = 3;

    if (history.length < 3) {
        return {
            productId,
            trend: 'stable',
            predictedPrice: 0,
            confidence: 0,
            dataPoints: history.length,
            minimumRequired,
            reason: `Insufficient historical data to generate a reliable forecast. We need at least ${minimumRequired} price points.`,
        };
    }

    const prices = history.map((h) => h.price);
    const currentPrice = prices[prices.length - 1];
    const n = prices.length;

    // Simple Linear Regression
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += prices[i];
        sumXY += i * prices[i];
        sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const predictedNext = slope * n + intercept;

    const trend: 'down' | 'up' | 'stable' = slope < -5 ? 'down' : slope > 5 ? 'up' : 'stable';

    let reason = 'Price is currently stable with no significant volatility detected.';
    let daysUntilNextDrop = undefined;

    if (trend === 'down') {
        reason = 'Market momentum suggests a downward correction. Hold for potential savings.';
        daysUntilNextDrop = 3;
    } else if (trend === 'up') {
        reason = 'Upward trend detected. Buy now before further price inflation occurs.';
    } else if (currentPrice < (prices[0] * 0.95)) {
        reason = 'Current price is significantly lower than recent peaks. High value entry point.';
    }

    return {
        productId,
        trend,
        predictedPrice: Math.round(predictedNext),
        confidence: Math.round(Math.min(95, (n / 30) * 100)),
        dataPoints: history.length,
        minimumRequired,
        reason,
        daysUntilNextDrop
    };
}
