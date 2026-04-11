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
    fromUrl?: boolean;
}

/** Extract a human-readable name from a URL slug */
function titleFromSlug(url: string): string {
    try {
        const path = new URL(url).pathname;
        const segments = path.split('/').filter(Boolean);
        const slug = segments.find(s => s.length > 6 && !/^[a-zA-Z0-9]{4,12}$/.test(s) && s !== 'dp' && s !== 'p') || segments[0] || '';
        return slug
            .replace(/-/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim();
    } catch { return ''; }
}

/** Check for bot/CAPTCHA page */
function isBotPage(html: string, title: string): boolean {
    const botPhrases = ['are you a human', 'robot', 'captcha', 'access denied', 'verify you are', '403 forbidden', 'security check', 'one moment'];
    const combined = (html.slice(0, 3000) + title).toLowerCase();
    return botPhrases.some(p => combined.includes(p.toLowerCase()));
}

/** Extract Open Graph / meta tag data — works even on many bot-detection pages */
function parseOpenGraph(root: any): { title?: string; image?: string; price?: number } {
    const og = (name: string) =>
        root.querySelector(`meta[property="og:${name}"]`)?.getAttribute('content') ||
        root.querySelector(`meta[name="og:${name}"]`)?.getAttribute('content') || '';

    const title = og('title') || root.querySelector('title')?.text?.trim() || '';
    const image = og('image') || '';
    const priceStr = og('price:amount') || '';
    const price = priceStr ? parseFloat(priceStr) : 0;
    return { title: title || undefined, image: image || undefined, price };
}

const DESKTOP_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Upgrade-Insecure-Requests': '1',
    'sec-ch-ua': '"Google Chrome";v="124", "Not:A-Brand";v="8"',
    'sec-ch-ua-mobile': '?0',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
};

const MOBILE_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-IN,en;q=0.9',
};

async function fetchHtml(url: string, headers: Record<string, string>): Promise<string | null> {
    try {
        const res = await fetch(url, { headers, redirect: 'follow' });
        if (!res.ok) return null;
        return await res.text();
    } catch { return null; }
}

export async function scrapeProduct(url: string): Promise<ScrapedProduct | null> {
    const platform: ScrapedProduct['platform'] =
        url.includes('amazon') ? 'amazon' :
        url.includes('flipkart') ? 'flipkart' :
        url.includes('myntra') ? 'myntra' : 'unknown';

    if (platform === 'unknown') return null;

    // ── Strategy 1: Desktop fetch ─────────────────────────────
    let html = await fetchHtml(url, DESKTOP_HEADERS);
    let result: ScrapedProduct | null = null;

    if (html) {
        const root = parse(html);
        if (!isBotPage(html, root.querySelector('title')?.text || '')) {
            if (platform === 'amazon') result = parseAmazon(root, url);
            else if (platform === 'flipkart') result = parseFlipkart(root, url);
            else if (platform === 'myntra') result = parseMyntra(root, url);
        }

        // ── Strategy 2: Open Graph fallback ──────────────────
        if (!result || !result.image || result.price === 0) {
            const og = parseOpenGraph(root);
            if (og.image || og.title) {
                result = {
                    ...result,
                    title: result?.title || og.title || titleFromSlug(url),
                    image: result?.image || og.image || '',
                    price: (result?.price && result.price > 0) ? result.price : (og.price || 0),
                    platform,
                    url,
                } as ScrapedProduct;
            }
        }
    }

    // ── Strategy 3: Mobile URL fallback (Flipkart) ────────────
    if (platform === 'flipkart' && (!result?.image || result?.price === 0)) {
        const mobileUrl = url.replace('www.flipkart.com', 'm.flipkart.com');
        const mHtml = await fetchHtml(mobileUrl, MOBILE_HEADERS);
        if (mHtml) {
            const mRoot = parse(mHtml);
            if (!isBotPage(mHtml, mRoot.querySelector('title')?.text || '')) {
                const mResult = parseFlipkartMobile(mRoot, url);
                if (mResult.image || mResult.price > 0) {
                    result = {
                        title: result?.title || mResult.title,
                        image: mResult.image || result?.image || '',
                        price: mResult.price || result?.price || 0,
                        originalPrice: mResult.originalPrice || result?.originalPrice,
                        discount: mResult.discount || result?.discount,
                        platform: 'flipkart',
                        url,
                    };
                }
            }
            // Also try OG from mobile
            if (!result?.image) {
                const og = parseOpenGraph(parse(mHtml));
                if (og.image) result = { ...result!, image: og.image };
            }
        }
    }

    // ── Strategy 4: URL slug fallback ─────────────────────────
    if (!result || (!result.image && result.price === 0)) {
        const slugTitle = titleFromSlug(url);
        if (!slugTitle) return null;
        return {
            title: result?.title || slugTitle,
            image: result?.image || '',
            price: result?.price || 0,
            originalPrice: result?.originalPrice,
            discount: result?.discount,
            platform,
            url,
            fromUrl: true,
        };
    }

    return result;
}

function parseAmazon(root: any, url: string): ScrapedProduct {
    const title = (
        root.querySelector('#productTitle')?.text.trim() ||
        root.querySelector('meta[name="title"]')?.getAttribute('content') || ''
    ).trim();

    const priceStr = (
        root.querySelector('.a-price-whole')?.text ||
        root.querySelector('.a-offscreen')?.text || '0'
    ).replace(/[,₹\s]/g, '');
    const price = parseFloat(priceStr) || 0;

    const originalPriceStr = (
        root.querySelector('.a-text-price .a-offscreen')?.text ||
        root.querySelector('.basisPrice .a-offscreen')?.text || ''
    ).replace(/[,₹\s]/g, '');
    const originalPrice = originalPriceStr ? parseFloat(originalPriceStr) : undefined;

    const discountStr = (
        root.querySelector('.savingsPercentage')?.text ||
        root.querySelector('.reinventPriceSavingsPercentageMargin')?.text || ''
    ).replace(/[-%\s]/g, '');
    const discount = discountStr ? parseFloat(discountStr) : undefined;

    const image = (
        root.querySelector('#landingImage')?.getAttribute('src') ||
        root.querySelector('#imgAltPlaceholder img')?.getAttribute('src') || ''
    );

    return { title, price, originalPrice, discount, image, platform: 'amazon', url };
}

function parseFlipkart(root: any, url: string): ScrapedProduct {
    const title = (
        root.querySelector('.B_NuCI')?.text.trim() ||
        root.querySelector('.VU-Z7x')?.text.trim() ||
        root.querySelector('h1.yhB1nd')?.text.trim() ||
        root.querySelector('h1')?.text.trim() || ''
    ).trim();

    const priceStr = (
        root.querySelector('._30jeq3')?.text ||
        root.querySelector('.Nx9n0j')?.text ||
        root.querySelector('._16Jk6d')?.text || '0'
    ).replace(/[,₹\s]/g, '');
    const price = parseFloat(priceStr) || 0;

    const originalPriceStr = (
        root.querySelector('._3I9_wc')?.text ||
        root.querySelector('.y9H9c2')?.text || ''
    ).replace(/[,₹\s]/g, '');
    const originalPrice = originalPriceStr ? parseFloat(originalPriceStr) : undefined;

    const discountStr = (
        root.querySelector('._3Ay6Sb')?.text ||
        root.querySelector('.UkUFwK')?.text || ''
    ).replace(/[%off \s]/g, '');
    const discount = discountStr ? parseFloat(discountStr) : undefined;

    // Try multiple image selectors
    const image = (
        root.querySelector('._396cs4')?.getAttribute('src') ||
        root.querySelector('._2r_T1I')?.getAttribute('src') ||
        root.querySelector('img._2r_T1I')?.getAttribute('src') ||
        root.querySelector('._09Y79Z img')?.getAttribute('src') ||
        root.querySelector('.DByo73 img')?.getAttribute('src') ||
        root.querySelector('img[src*="rukminim"]')?.getAttribute('src') || ''
    );

    return { title, price, originalPrice, discount, image, platform: 'flipkart', url };
}

function parseFlipkartMobile(root: any, url: string): ScrapedProduct {
    const title = (
        root.querySelector('.x4eQg')?.text.trim() ||
        root.querySelector('h1')?.text.trim() ||
        root.querySelector('._9roun')?.text.trim() || ''
    ).trim();

    const priceStr = (
        root.querySelector('._1vC4OE')?.text ||
        root.querySelector('.Y1HWO0')?.text ||
        root.querySelector('[class*="price"]')?.text || '0'
    ).replace(/[,₹\s]/g, '');
    const price = parseFloat(priceStr) || 0;

    const image = (
        root.querySelector('._2r_T1I')?.getAttribute('src') ||
        root.querySelector('img[src*="rukminim"]')?.getAttribute('src') ||
        root.querySelector('img._2amPTt')?.getAttribute('src') || ''
    );

    return { title, price, image, platform: 'flipkart', url };
}

function parseMyntra(root: any, url: string): ScrapedProduct {
    const title = [
        root.querySelector('.pdp-title')?.text.trim(),
        root.querySelector('.pdp-name')?.text.trim(),
    ].filter(Boolean).join(' ');
    const priceStr = root.querySelector('.pdp-price strong')?.text.replace(/[,₹\s]/g, '') || '0';
    const price = parseFloat(priceStr) || 0;
    const originalPriceStr = root.querySelector('.pdp-mrp s')?.text.replace(/[,₹\s]/g, '') || '';
    const originalPrice = originalPriceStr ? parseFloat(originalPriceStr) : undefined;
    const image = root.querySelector('.pdp-main-img')?.getAttribute('src') || '';
    return { title, price, originalPrice, image, platform: 'myntra', url };
}
