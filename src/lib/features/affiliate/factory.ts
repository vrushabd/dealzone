import { AffiliateStrategy, AmazonAffiliateStrategy, FlipkartAffiliateStrategy } from './strategies';

export class AffiliateStrategyFactory {
    static getStrategy(url: string, tags?: { amazon?: string, flipkart?: string }): AffiliateStrategy | null {
        if (url.includes('amazon.in') || url.includes('amazon.com')) {
            return new AmazonAffiliateStrategy(tags?.amazon);
        }
        if (url.includes('flipkart.com')) {
            return new FlipkartAffiliateStrategy(tags?.flipkart);
        }
        return null;
    }
}
