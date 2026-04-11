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
    fromUrl?: boolean; // true if data was extracted from URL slug, not actual page
}

/** Extract a human-readable name from a product URL slug */
function titleFromSlug(url: string): string {
    try {
        const path = new URL(url).pathname;
        // Flipkart: /product-name-color-variant/p/ITEMID
        // Amazon:   /product-name/dp/ASIN
        const segments = path.split('/').filter(Boolean);
        // Use the first meaningful segment (not 'dp', 'p', etc.)
        const slug = segments.find(s => s.length > 6 && !/^[A-Z0-9]{6,}$/.test(s)) || segments[0] || '';
        return slug
            .replace(/-/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim();
    } catch {
        return '';
    }
}

/** Check if a page was a bot-detection/CAPTCHA page */
function isBotPage(html: string, title: string): boolean {
    const botPhrases = [
        'are you a human',
        'robot',
        'captcha',
        'Access Denied',
        'verify you are a human',
        'One moment, please',
        'Please Wait',
        '403 Forbidden',
        'security check',
    ];
    const combined = (html.slice(0, 2000) + title).toLowerCase();
    return botPhrases.some(p => combined.includes(p.toLowerCase()));
}

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Upgrade-Insecure-Requests': '1',
};

export async function scrapeProduct(url: string): Promise<ScrapedProduct | null> {
    try {
        const response = await fetch(url, {
            headers: HEADERS,
            redirect: 'follow',
        });

        const html = await response.text();
        const root = parse(html);

        let result: ScrapedProduct | null = null;

        if (url.includes('amazon')) result = parseAmazon(root, url);
        else if (url.includes('flipkart')) result = parseFlipkart(root, url);
        else if (url.includes('myntra')) result = parseMyntra(root, url);

        // Bot detection fallback — extract from URL slug
        if (!result || isBotPage(html, result?.title || '')) {
            const platform: ScrapedProduct['platform'] =
                url.includes('amazon') ? 'amazon' :
                url.includes('flipkart') ? 'flipkart' : 'unknown';

            const slugTitle = titleFromSlug(url);
            if (!slugTitle) return null;

            return {
                title: slugTitle,
                price: 0,
                image: '',
                platform,
                url,
                fromUrl: true,
            };
        }

        return result;
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
    ).replace(/[,₹\s]/g, '');
    const price = parseFloat(priceStr) || 0;

    const originalPriceStr = (
        root.querySelector('.a-text-price .a-offscreen')?.text.trim() ||
        root.querySelector('.basisPrice .a-offscreen')?.text.trim() ||
        ''
    ).replace(/[,₹\s]/g, '');
    const originalPrice = originalPriceStr ? parseFloat(originalPriceStr) : undefined;

    const discountStr = (
        root.querySelector('.savingsPercentage')?.text.trim() ||
        root.querySelector('.reinventPriceSavingsPercentageMargin')?.text.trim() ||
        ''
    ).replace(/[-%\s]/g, '');
    const discount = discountStr ? parseFloat(discountStr) : undefined;

    const image = (
        root.querySelector('#landingImage')?.getAttribute('src') ||
        root.querySelector('#imgAltPlaceholder img')?.getAttribute('src') ||
        ''
    );

    return { title, price, originalPrice, discount, image, platform: 'amazon', url };
}

function parseFlipkart(root: any, url: string): ScrapedProduct {
    const title = (
        root.querySelector('.B_NuCI')?.text.trim() ||
        root.querySelector('.VU-Z7x')?.text.trim() ||
        root.querySelector('h1.yhB1nd')?.text.trim() ||
        root.querySelector('h1')?.text.trim() ||
        'Flipkart Product'
    ).trim();

    const priceStr = (
        root.querySelector('._30jeq3')?.text.trim() ||
        root.querySelector('.Nx9n0j')?.text.trim() ||
        root.querySelector('._16Jk6d')?.text.trim() ||
        '0'
    ).replace(/[,₹\s]/g, '');
    const price = parseFloat(priceStr) || 0;

    const originalPriceStr = (
        root.querySelector('._3I9_wc')?.text.trim() ||
        root.querySelector('.y9H9c2')?.text.trim() ||
        ''
    ).replace(/[,₹\s]/g, '');
    const originalPrice = originalPriceStr ? parseFloat(originalPriceStr) : undefined;

    const discountStr = (
        root.querySelector('._3Ay6Sb')?.text.trim() ||
        root.querySelector('.UkUFwK')?.text.trim() ||
        ''
    ).replace(/[% off\s]/g, '');
    const discount = discountStr ? parseFloat(discountStr) : undefined;

    const image = (
        root.querySelector('._396cs4')?.getAttribute('src') ||
        root.querySelector('._09Y79Z img')?.getAttribute('src') ||
        root.querySelector('.DByo73 img')?.getAttribute('src') ||
        root.querySelector('img._2r_T1I')?.getAttribute('src') ||
        ''
    );

    return { title, price, originalPrice, discount, image, platform: 'flipkart', url };
}

function parseMyntra(root: any, url: string): ScrapedProduct {
    const title = [
        root.querySelector('.pdp-title')?.text.trim(),
        root.querySelector('.pdp-name')?.text.trim(),
    ].filter(Boolean).join(' ');
    const priceStr = root.querySelector('.pdp-price strong')?.text.trim().replace(/[,₹\s]/g, '') || '0';
    const price = parseFloat(priceStr) || 0;
    const originalPriceStr = root.querySelector('.pdp-mrp s')?.text.trim().replace(/[,₹\s]/g, '') || '';
    const originalPrice = originalPriceStr ? parseFloat(originalPriceStr) : undefined;
    const image = root.querySelector('.pdp-main-img')?.getAttribute('src') || '';
    return { title, price, originalPrice, image, platform: 'myntra', url };
}
