import { AffiliateStrategy, AmazonAffiliateStrategy, FlipkartAffiliateStrategy } from './strategies';

export class AffiliateStrategyFactory {
    static getStrategy(url: string): AffiliateStrategy | null {
        if (url.includes('amazon.in') || url.includes('amazon.com')) {
            return new AmazonAffiliateStrategy();
        }
        if (url.includes('flipkart.com')) {
            return new FlipkartAffiliateStrategy();
        }
        return null;
    }
}
