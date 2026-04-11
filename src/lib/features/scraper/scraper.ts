import { parse } from 'node-html-parser';

export interface ScrapedProduct {
    title: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    image: string;
    seller?: string;
    rating?: number;
    availability?: string;
    platform: 'amazon' | 'flipkart' | 'myntra' | 'unknown';
    url: string;
}

export async function scrapeProduct(url: string): Promise<ScrapedProduct | null> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        const html = await response.text();
        const root = parse(html);

        if (url.includes('amazon')) return parseAmazon(root, url);
        if (url.includes('flipkart')) return parseFlipkart(root, url);
        if (url.includes('myntra')) return parseMyntra(root, url);

        return null;
    } catch (error) {
        console.error('Scraping error:', error);
        return null;
    }
}

function parseAmazon(root: any, url: string): ScrapedProduct {
    const title = (
        root.querySelector('#productTitle')?.text.trim() ||
        root.querySelector('meta[name="title"]')?.getAttribute('content') ||
        'Amazon Product'
    ).trim();

    const priceStr = (
        root.querySelector('.a-price-whole')?.text.trim() ||
        root.querySelector('.a-offscreen')?.text.trim() ||
        '0'
    ).replace(/[,₹]/g, '');
    const price = parseFloat(priceStr);

    const originalPriceStr = (
        root.querySelector('.a-text-price .a-offscreen')?.text.trim() ||
        root.querySelector('.basisPrice .a-offscreen')?.text.trim() ||
        ''
    ).replace(/[,₹]/g, '');
    const originalPrice = originalPriceStr ? parseFloat(originalPriceStr) : undefined;

    const discountStr = (
        root.querySelector('.savingsPercentage')?.text.trim() ||
        root.querySelector('.reinventPriceSavingsPercentageMargin')?.text.trim() ||
        ''
    ).replace(/[-%]/g, '');
    const discount = discountStr ? parseFloat(discountStr) : undefined;

    const image = (
        root.querySelector('#landingImage')?.getAttribute('src') ||
        root.querySelector('#imgAltPlaceholder img')?.getAttribute('src') ||
        ''
    );
    const seller = (
        root.querySelector('#merchantInfoID')?.text.trim() ||
        root.querySelector('#vse-video-ads-vse-seller-name')?.text.trim() ||
        'Amazon Seller'
    );
    const ratingStr = root.querySelector('.a-icon-alt')?.text.trim().split(' ')[0] || '';
    const rating = ratingStr ? parseFloat(ratingStr) : undefined;

    const availability = root.querySelector('#availability')?.text.trim() || 'In Stock';

    return { title, price, originalPrice, discount, image, seller, rating, availability, platform: 'amazon', url };
}

function parseFlipkart(root: any, url: string): ScrapedProduct {
    const title = (
        root.querySelector('.B_NuCI')?.text.trim() ||
        root.querySelector('.VU-Z7x')?.text.trim() ||
        root.querySelector('h1')?.text.trim() ||
        'Flipkart Product'
    ).trim();

    const priceStr = (
        root.querySelector('._30jeq3')?.text.trim() ||
        root.querySelector('.Nx9n0j')?.text.trim() ||
        '0'
    ).replace(/[,₹]/g, '');
    const price = parseFloat(priceStr);

    const originalPriceStr = (
        root.querySelector('._3I9_wc')?.text.trim() ||
        root.querySelector('.y9H9c2')?.text.trim() ||
        ''
    ).replace(/[,₹]/g, '');
    const originalPrice = originalPriceStr ? parseFloat(originalPriceStr) : undefined;

    const discountStr = (
        root.querySelector('._3Ay6Sb')?.text.trim() ||
        root.querySelector('.UkUFwK')?.text.trim() ||
        ''
    ).replace(/[% off]/g, '');
    const discount = discountStr ? parseFloat(discountStr) : undefined;

    const image = (
        root.querySelector('._396cs4')?.getAttribute('src') ||
        root.querySelector('._09Y79Z img')?.getAttribute('src') ||
        root.querySelector('.DByo73 img')?.getAttribute('src') ||
        ''
    );
    const seller = root.querySelector('#sellerName')?.text.trim() || 'Flipkart Seller';
    const ratingStr = root.querySelector('._3LWZlK')?.text.trim() || root.querySelector('.XQD_9y')?.text.trim() || '';
    const rating = ratingStr ? parseFloat(ratingStr) : undefined;

    const availability = root.querySelector('._163n9M')?.text.trim() || 'In Stock';

    return { title, price, originalPrice, discount, image, seller, rating, availability, platform: 'flipkart', url };
}

function parseMyntra(root: any, url: string): ScrapedProduct {
    // Myntra often uses JSON-LD or script tags for data, but let's try basic selectors first
    const title = root.querySelector('.pdp-title')?.text.trim() + ' ' + root.querySelector('.pdp-name')?.text.trim();
    const priceStr = root.querySelector('.pdp-price strong')?.text.trim().replace(/[,₹]/g, '') || '0';
    const price = parseFloat(priceStr);

    const originalPriceStr = root.querySelector('.pdp-mrp s')?.text.trim().replace(/[,₹]/g, '') || '';
    const originalPrice = originalPriceStr ? parseFloat(originalPriceStr) : undefined;

    const discountStr = root.querySelector('.pdp-discount')?.text.trim().replace(/[(% OFF)]/g, '') || '';
    const discount = discountStr ? parseFloat(discountStr) : undefined;

    const image = root.querySelector('.pdp-main-img')?.getAttribute('src') || '';

    return { title, price, originalPrice, discount, image, platform: 'myntra', url };
}
