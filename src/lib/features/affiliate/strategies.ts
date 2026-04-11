export interface AffiliateStrategy {
    platform: string;
    generateAffiliateLink(url: string): string | null;
    extractProductId(url: string): string | null;
}

export class AmazonAffiliateStrategy implements AffiliateStrategy {
    platform = 'amazon';
    private tag = process.env.AMAZON_AFFILIATE_TAG || 'mytag-21';

    extractProductId(url: string): string | null {
        const match = url.match(/\/dp\/([A-Z0-9]{10})/) || url.match(/\/gp\/product\/([A-Z0-9]{10})/);
        return match ? match[1] : null;
    }

    generateAffiliateLink(url: string): string | null {
        const asin = this.extractProductId(url);
        if (!asin) return null;

        // Clean URL to canonical /dp/ASIN format
        const baseUrl = `https://www.amazon.in/dp/${asin}`;
        const separator = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${separator}tag=${this.tag}`;
    }
}

export class FlipkartAffiliateStrategy implements AffiliateStrategy {
    platform = 'flipkart';
    private affid = process.env.FLIPKART_AFFILIATE_ID || 'myid';

    extractProductId(url: string): string | null {
        const urlObj = new URL(url);
        const pid = urlObj.searchParams.get('pid');
        if (pid) return pid;

        const match = url.match(/\/p\/([a-zA-Z0-9]+)/);
        return match ? match[1] : null;
    }

    generateAffiliateLink(url: string): string | null {
        const pid = this.extractProductId(url);
        if (!pid) return null;

        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}affid=${this.affid}`;
    }
}
