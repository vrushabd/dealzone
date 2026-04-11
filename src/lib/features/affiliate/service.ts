import { prisma } from '@/lib/prisma';
import { AffiliateStrategyFactory } from './factory';

export class AffiliateService {
    static async processProductUrl(url: string) {
        const strategy = AffiliateStrategyFactory.getStrategy(url);

        if (!strategy) {
            throw new Error('Platform not supported');
        }

        const productId = strategy.extractProductId(url);
        if (!productId) {
            throw new Error('Invalid URL: Could not extract product ID');
        }

        const affiliateUrl = strategy.generateAffiliateLink(url);
        if (!affiliateUrl) {
            throw new Error('Failed to generate affiliate link');
        }

        console.log(`[AffiliateService] Platform detected: ${strategy.platform}`);
        console.log(`[AffiliateService] Affiliate link generated: ${affiliateUrl}`);

        return {
            platform: strategy.platform,
            productId,
            affiliateUrl,
            originalUrl: url
        };
    }

    static async trackClick(productId: string, ip?: string, userAgent?: string) {
        return await prisma.affiliateClick.create({
            data: {
                productId,
                ip,
                userAgent,
            },
        });
    }
}
