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
    category?: string;
    description?: string;
    bankOffers?: string[];
    deliveryInfo?: string;
    reviews?: { rating: number, title?: string, comment: string, author?: string }[];
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

/** Improve image quality by rewriting dimension parameters in URLs */
function upscaleImageUrl(url: string, platform: string): string {
    if (!url) return '';
    try {
        if (platform === 'flipkart' && url.includes('rukminim')) {
            // Replace /image/160/210/ with /image/832/832/ and set high quality q=90
            return url
                .replace(/\/image\/\d+\/\d+\//, '/image/832/832/')
                .replace(/\?q=\d+/, '?q=90');
        }
        if (platform === 'amazon' && url.includes('media-amazon.com')) {
            // Remove thumbnail markers and target original hi-res masters
            // Marker pattern: ._AC_..._ or ._SY..._ or ._SX..._
            return url.replace(/\._[A-Z0-9,]+_\./g, '.');
        }
    } catch { /* ignore */ }
    return url;
}

/** Check for bot/CAPTCHA page */
function isBotPage(html: string, title: string): boolean {
    const botPhrases = ['are you a human', 'robot', 'captcha', 'access denied', 'verify you are', '403 forbidden', 'security check', 'one moment'];
    const combined = (html.slice(0, 3000) + title).toLowerCase();
    return botPhrases.some(p => combined.includes(p.toLowerCase()));
}

/** Parse JSON-LD structured data — works for both Amazon and Flipkart */
function parseJsonLd(html: string): { title?: string; image?: string; price?: number; originalPrice?: number } {
    try {
        const matches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
        for (const match of matches) {
            try {
                const data = JSON.parse(match[1]);
                const nodes: any[] = Array.isArray(data['@graph'])
                    ? data['@graph']
                    : [data];
                const product = nodes.find((n: any) => n['@type'] === 'Product' || n['@type'] === 'IndividualProduct');
                if (!product) continue;
                const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
                const price = offer?.price ? parseFloat(String(offer.price).replace(/[,₹\s]/g, '')) : 0;
                const image = Array.isArray(product.image) ? product.image[0] : product.image;
                return {
                    title: product.name || '',
                    image: typeof image === 'string' ? image : '',
                    price,
                };
            } catch { /* try next */ }
        }
    } catch { /* ignore */ }
    return {};
}

/** Parse Flipkart's window.__INITIAL_STATE__ embedded JSON */
function parseFlipkartWindowState(html: string): { title?: string; image?: string; price?: number; originalPrice?: number } {
    try {
        // Flipkart embeds full product data in a script tag
        const match = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]+?\})(?:;\s*(?:window|<\/script>|$))/);
        if (!match) return {};
        const state = JSON.parse(match[1]);
        // Traverse common paths where Flipkart stores product data
        const pdp =
            state?.pageData?.pageContext?.pdpData?.product ||
            state?.pageContext?.pdpData?.product ||
            state?.pdpData?.product;
        if (!pdp) return {};
        const price = pdp.pricing?.finalPrice?.value || pdp.pricing?.mrp?.value || 0;
        const originalPrice = pdp.pricing?.mrp?.value || 0;
        const rawImage = pdp.media?.images?.[0]?.url || '';
        const image = rawImage ? (rawImage.startsWith('http') ? rawImage : `https:${rawImage}`) : '';
        const title = pdp.productDescription?.completeProductName || '';
        return { title, image, price, originalPrice };
    } catch { /* ignore */ }
    return {};
}

/** Extract Open Graph / meta tag data — works even on some bot-detection pages */
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

// ────────────────────────────────────────────────────────────────
// HTTP Headers — rotate UAs and use real Chrome to bypass bot checks
// ────────────────────────────────────────────────────────────────
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const CHROME_MAC_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const GOOGLEBOT_UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

const BASE_HEADERS = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-IN,en-US;q=0.9,en;q=0.8,hi;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
};

const AMAZON_HEADERS = {
    ...BASE_HEADERS,
    'User-Agent': CHROME_UA,
    'Referer': 'https://www.google.com/',
    'Host': 'www.amazon.in',
};

const FLIPKART_HEADERS = {
    ...BASE_HEADERS,
    'User-Agent': CHROME_MAC_UA,
    'Referer': 'https://www.google.com/',
    'Host': 'www.flipkart.com',
};

const MOBILE_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-IN,en;q=0.9',
    'Referer': 'https://www.google.com/',
};

async function fetchHtml(url: string, headers: Record<string, string>): Promise<string | null> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout
        const res = await fetch(url, { 
            headers, 
            redirect: 'follow',
            signal: controller.signal,
            cache: 'no-store',
        });
        clearTimeout(timeout);
        if (!res.ok) return null;
        return await res.text();
    } catch { return null; }
}


// ────────────────────────────────────────────────────────────────
// Main Entry Point
// ────────────────────────────────────────────────────────────────
export async function scrapeProduct(url: string): Promise<ScrapedProduct | null> {
    const platform: ScrapedProduct['platform'] =
        url.includes('amazon') ? 'amazon' :
        url.includes('flipkart') ? 'flipkart' :
        url.includes('myntra') ? 'myntra' : 'unknown';

    if (platform === 'unknown') return null;

    const platformHeaders = platform === 'amazon' ? AMAZON_HEADERS :
                            platform === 'flipkart' ? FLIPKART_HEADERS : BASE_HEADERS;

    // ── Strategy 1: Desktop fetch ─────────────────────────────────
    let html = await fetchHtml(url, { ...platformHeaders, 'User-Agent': AMAZON_HEADERS['User-Agent'] });
    let result: ScrapedProduct | null = null;

    if (html) {
        const root = parse(html);
        const pageTitle = root.querySelector('title')?.text || '';

        if (!isBotPage(html, pageTitle)) {
            if (platform === 'amazon')   result = parseAmazon(root, url);
            else if (platform === 'flipkart') result = parseFlipkart(root, url, html);
            else if (platform === 'myntra')   result = parseMyntra(root, url);
        }

        // ── Strategy 2: JSON-LD (most reliable — schema.org markup) ──
        if (!result || result.price === 0 || !result.image) {
            const ld = parseJsonLd(html);
            if (ld.title || ld.image || (ld.price && ld.price > 0)) {
                result = {
                    title:         result?.title  || ld.title  || titleFromSlug(url),
                    image:         result?.image  || ld.image  || '',
                    price:         (result?.price && result.price > 0) ? result.price : (ld.price || 0),
                    originalPrice: result?.originalPrice || ld.originalPrice,
                    platform,
                    url,
                } as ScrapedProduct;
            }
        }

        // ── Strategy 3: Flipkart window.__INITIAL_STATE__ ─────────────
        if (platform === 'flipkart' && (!result || result.price === 0 || !result.image)) {
            const ws = parseFlipkartWindowState(html);
            if (ws.title || ws.image || (ws.price && ws.price > 0)) {
                result = {
                    title:         result?.title || ws.title || titleFromSlug(url),
                    image:         result?.image || ws.image || '',
                    price:         (result?.price && result.price > 0) ? result.price : (ws.price || 0),
                    originalPrice: result?.originalPrice || ws.originalPrice,
                    platform,
                    url,
                } as ScrapedProduct;
            }
        }

        // ── Strategy 4: Open Graph fallback ───────────────────────────
        if (!result || !result.image || result.price === 0) {
            const og = parseOpenGraph(root);
            if (og.image || og.title) {
                result = {
                    ...result,
                    title:  result?.title  || og.title  || titleFromSlug(url),
                    image:  result?.image  || og.image  || '',
                    price:  (result?.price && result.price > 0) ? result.price : (og.price || 0),
                    platform,
                    url,
                } as ScrapedProduct;
            }
        }
    }

    // ── Strategy 5: Mobile URL fallback (Flipkart) ────────────────
    if (platform === 'flipkart' && (!result?.image || result?.price === 0)) {
        const mobileUrl = url.replace('www.flipkart.com', 'm.flipkart.com');
        const mHtml = await fetchHtml(mobileUrl, MOBILE_HEADERS);
        if (mHtml) {
            const mRoot = parse(mHtml);
            if (!isBotPage(mHtml, mRoot.querySelector('title')?.text || '')) {
                const mResult = parseFlipkartMobile(mRoot, url);
                if (mResult.image || mResult.price > 0) {
                    result = {
                        title:         result?.title || mResult.title,
                        image:         mResult.image || result?.image || '',
                        price:         mResult.price || result?.price || 0,
                        originalPrice: mResult.originalPrice || result?.originalPrice,
                        discount:      mResult.discount || result?.discount,
                        platform:      'flipkart',
                        url,
                    };
                }
            }
            // Also attempt OG image from mobile page
            if (!result?.image) {
                const og = parseOpenGraph(parse(mHtml));
                if (og.image) result = { ...result!, image: og.image };
            }
        }
    }

    // ── Strategy 6: URL slug last resort ─────────────────────────
    if (!result || (!result.image && result.price === 0)) {
        const slugTitle = titleFromSlug(url);
        if (!slugTitle) return null;
        return {
            title:         result?.title || slugTitle,
            image:         result?.image || '',
            price:         result?.price || 0,
            originalPrice: result?.originalPrice,
            discount:      result?.discount,
            description:   result?.description,
            platform,
            url,
            fromUrl: true,
        };
    }

    return result;
}

// ────────────────────────────────────────────────────────────────
// Platform Parsers
// ────────────────────────────────────────────────────────────────

function parseAmazon(root: any, url: string): ScrapedProduct {
    const title = (
        root.querySelector('#productTitle')?.text?.trim() ||
        root.querySelector('span#productTitle')?.text?.trim() ||
        root.querySelector('meta[name="title"]')?.getAttribute('content') || ''
    ).trim();

    // Try selectors in order — Amazon frequently shifts class names
    const priceSelectors = [
        '.reinventPricePriceToPayMargin .a-offscreen',
        '#apex_offerDisplay_desktop .a-price .a-offscreen',
        '#corePrice_feature_div .a-offscreen',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '.priceToPay .a-offscreen',
        '.a-price .a-offscreen',
        '.a-price-whole',
    ];
    let price = 0;
    for (const sel of priceSelectors) {
        const raw = root.querySelector(sel)?.text?.replace(/[,₹\s]/g, '');
        if (raw) {
            const p = parseFloat(raw);
            if (p > 0) { price = p; break; }
        }
    }

    const originalPriceSelectors = [
        '.basisPrice .a-offscreen',
        '.a-text-price .a-offscreen',
        '#listPrice',
        '#priceblock_saleprice',
    ];
    let originalPrice: number | undefined;
    for (const sel of originalPriceSelectors) {
        const raw = root.querySelector(sel)?.text?.replace(/[,₹\s]/g, '');
        if (raw) {
            const p = parseFloat(raw);
            if (p > 0 && p > price) { originalPrice = p; break; }
        }
    }

    const discountStr = (
        root.querySelector('.savingsPercentage')?.text ||
        root.querySelector('.reinventPriceSavingsPercentageMargin')?.text || ''
    ).replace(/[-%\s]/g, '');
    const discount = discountStr ? parseFloat(discountStr) : undefined;

    const imageSelectors = [
        '#landingImage',
        '#imgBlkFront',
        '#main-image',
        '.a-dynamic-image'
    ];
    let image = '';
    for (const sel of imageSelectors) {
        const el = root.querySelector(sel);
        const src = el?.getAttribute('src') || el?.getAttribute('data-src') || el?.getAttribute('data-old-hires');
        if (src && !src.includes('gif') && src.startsWith('http')) { image = src; break; }
    }

    if (image && image.includes('media-amazon.com')) {
        image = upscaleImageUrl(image, 'amazon');
    }

    const category = root.querySelector('#wayfinding-breadcrumbs_container ul li:last-child')?.text?.trim() || 
                     root.querySelector('#wayfinding-breadcrumbs_container ul li:nth-last-child(2)')?.text?.trim() || '';

    // Description extraction
    const descriptionLines = Array.from(root.querySelectorAll('#feature-bullets li span.a-list-item'))
        .map((el: any) => el?.text?.trim())
        .filter((t: string) => t && t.length > 5);
    
    let description = descriptionLines.join('\n');
    if (!description) {
        description = root.querySelector('#productDescription p')?.text?.trim() || '';
    }

    const reviews: { rating: number, title?: string, comment: string, author?: string }[] = [];
    try {
        const reviewElements = root.querySelectorAll('div[data-hook="review"]');
        for (const el of reviewElements.slice(0, 5)) {
            const ratingStr = el.querySelector('i[data-hook="review-star-rating"] span')?.text || '';
            const rating = parseFloat(ratingStr) || 5;
            const rTitle = el.querySelector('a[data-hook="review-title"] span:not(.a-icon-alt)')?.text?.trim() || 
                           el.querySelector('a[data-hook="review-title"] span')?.text?.trim() || '';
            const comment = el.querySelector('span[data-hook="review-body"] span')?.text?.trim() || '';
            const author = el.querySelector('span.a-profile-name')?.text?.trim() || 'Amazon Customer';
            if (comment) reviews.push({ rating, title: rTitle, comment, author });
        }
    } catch {}

    const bankOffers: string[] = [];
    try {
        const offerEls = root.querySelectorAll('#bankOffer_feature_div .a-carousel-card span.a-truncate-full, #bankOffer_feature_div .a-section-bank-offer span');
        offerEls.forEach((el: any) => {
            const txt = el.text?.trim();
            if (txt && txt.length > 10 && !bankOffers.includes(txt)) bankOffers.push(txt);
        });
    } catch {}

    const deliveryInfo = root.querySelector('#mir-layout-DELIVERY_BLOCK-slot-PRIMARY_DELIVERY_MESSAGE_ID span')?.text?.trim() || 
                        root.querySelector('#deliveryMessageMirId span')?.text?.trim() || '';

    return { title, price, originalPrice, discount, image, platform: 'amazon', url, category, description, reviews, bankOffers, deliveryInfo };
}

function parseFlipkart(root: any, url: string, html?: string): ScrapedProduct {
    // Scoping to main product container to avoid picking up similar products/ads
    const mainContainer = root.querySelector('.aMaAEs') || root.querySelector('.DOjaZg') || root;
    
    // Title — Flipkart rotates class names frequently
    const title = (
        mainContainer.querySelector('.VU-Z7x')?.text?.trim()  ||
        mainContainer.querySelector('h1.yhB1nd')?.text?.trim() ||
        mainContainer.querySelector('.B_NuCI')?.text?.trim()   ||
        mainContainer.querySelector('h1._9E25nV')?.text?.trim()||
        mainContainer.querySelector('span.B_NuCI')?.text?.trim()||
        mainContainer.querySelector('._2W109w')?.text?.trim() ||
        root.querySelector('h1')?.text?.trim() || ''
    ).trim();

    // Price selectors - Ordered by reliability
    const priceSelectors = [
        '.Nx9n0j', 
        '._30jeq3', 
        '._16Jk6d', 
        '.hl05eU', 
        '.UOCQB1 .Nx9n0j', 
        '[class*="finalPrice"]',
        '.Y1HWO0'
    ];
    
    let price = 0;
    for (const sel of priceSelectors) {
        const raw = mainContainer.querySelector(sel)?.text?.replace(/[,₹\s]/g, '');
        if (raw) {
            const p = parseFloat(raw);
            if (p > 0 && (price === 0 || p < price)) { price = p; }
        }
    }

    if (price === 0 && html) {
        // Regex catch-all for deeply nested or obfuscated raw price strings
        const regexMatch = html.match(/"(?:finalPrice|price)"\s*:\s*"?(\d+(?:\.\d+)?)/);
        if (regexMatch) {
            price = parseFloat(regexMatch[1]);
        }
    }

    // Original / MRP price
    const originalPriceSelectors = [
        '.y9H9c2',
        '._3I9_wc',
        '.yRaY8j',
        '.font-extra-light-black',
        '[class*="mrpPrice"]'
    ];
    
    let originalPrice: number | undefined;
    for (const sel of originalPriceSelectors) {
        const raw = mainContainer.querySelector(sel)?.text?.replace(/[,₹\s]/g, '');
        if (raw) {
            const p = parseFloat(raw);
            if (p > 0 && p > price) { originalPrice = p; break; }
        }
    }

    // Discount
    const discountStr = (
        mainContainer.querySelector('.UkUFwK')?.text  ||
        mainContainer.querySelector('._3Ay6Sb')?.text ||
        mainContainer.querySelector('span._2Tpdn3')?.text || ''
    ).replace(/[%off\s]/g, '');
    const discount = discountStr ? parseFloat(discountStr) : undefined;

    // Sanity check: if price is ridiculously high compared to originalPrice, it's likely wrong
    if (price > 0 && originalPrice && originalPrice > 0 && price > originalPrice) {
        // Assume price is actually the originalPrice and we might be seeing a placeholder
        price = originalPrice;
    }

    // Image — priority order
    let image = (
        mainContainer.querySelector('._95YkrM img')?.getAttribute('src')  ||
        mainContainer.querySelector('._396cs4')?.getAttribute('src')      ||
        mainContainer.querySelector('._2r_T1I')?.getAttribute('src')      ||
        root.querySelector('img._2r_T1I')?.getAttribute('src')   ||
        root.querySelector('img[src*="rukminim"]')?.getAttribute('src') || ''
    );

    // If image is still empty, look in HTML for cloudfront/rukminim URLs
    if (!image && html) {
        const imgMatch = html.match(/https:\/\/[^"']+\.(?:jpg|jpeg|png|webp)\?q=\d+/);
        if (imgMatch) image = imgMatch[0];
    }

    // Upscale image if found
    if (image) image = upscaleImageUrl(image, 'flipkart');

    // Extract category from breadcrumbs
    const cats1 = root.querySelectorAll('._2whKao');
    const cats2 = root.querySelectorAll('._1HEO9G');
    const category = (cats1.length > 0 ? cats1[cats1.length - 1].text?.trim() : null) || 
                     (cats2.length > 0 ? cats2[cats2.length - 1].text?.trim() : null) || '';

    // Description extraction
    let description = mainContainer.querySelector('._1mXcCf')?.text?.trim() || '';
    if (!description && html) {
        const descMatch = html.match(/"description":"([^"]+)"/);
        if (descMatch) description = descMatch[1].replace(/\\n/g, '\n');
    }

    const reviews: { rating: number, title?: string, comment: string, author?: string }[] = [];
    try {
        const reviewContainers = root.querySelectorAll('div.t-ZTKy') || [];
        const ratingContainers = root.querySelectorAll('div._3LWZlK') || [];
        const authorContainers = root.querySelectorAll('p._2sc7ZR._2V5EAA') || [];
        const titleContainers = root.querySelectorAll('p._2-N8zT') || [];
        
        for (let i = 0; i < Math.min(5, reviewContainers.length); i++) {
            const comment = reviewContainers[i]?.text?.trim()?.replace(/READ MORE$/, '') || '';
            const rTitle = titleContainers[i]?.text?.trim() || '';
            const rating = parseFloat(ratingContainers[i]?.text || '5');
            const author = authorContainers[i]?.text?.trim() || 'Flipkart Customer';
            if (comment) reviews.push({ rating, title: rTitle, comment, author });
        }
    } catch {}

    const bankOffers: string[] = [];
    try {
        // Flipkart offers often in <li> with specific classes
        const offerEls = root.querySelectorAll('li._1MaY_A span, ._3ttV92 span');
        offerEls.forEach((el: any) => {
            const txt = el.text?.trim();
            if (txt && txt.length > 15 && (txt.includes('Bank Offer') || txt.includes('% off')) && !bankOffers.includes(txt)) {
                bankOffers.push(txt);
            }
        });
    } catch {}

    const deliveryInfo = mainContainer.querySelector('._3XNo0Z span')?.text?.trim() || 
                        mainContainer.querySelector('.Y8v6Y_')?.text?.trim() || '';

    return {
        title,
        price,
        originalPrice,
        discount,
        image,
        platform: 'flipkart',
        url,
        category,
        description,
        reviews,
        bankOffers,
        deliveryInfo
    };
}

function parseFlipkartMobile(root: any, url: string): ScrapedProduct {
    const title = (
        root.querySelector('.x4eQg')?.text?.trim()  ||
        root.querySelector('h1')?.text?.trim()       ||
        root.querySelector('._9roun')?.text?.trim() || ''
    ).trim();

    const priceStr = (
        root.querySelector('._1vC4OE')?.text    ||
        root.querySelector('.Y1HWO0')?.text     ||
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
        root.querySelector('.pdp-title')?.text?.trim(),
        root.querySelector('.pdp-name')?.text?.trim(),
    ].filter(Boolean).join(' ');
    const priceStr = root.querySelector('.pdp-price strong')?.text?.replace(/[,₹\s]/g, '') || '0';
    const price = parseFloat(priceStr) || 0;
    const originalPriceStr = root.querySelector('.pdp-mrp s')?.text?.replace(/[,₹\s]/g, '') || '';
    const originalPrice = originalPriceStr ? parseFloat(originalPriceStr) : undefined;
    const image = root.querySelector('.pdp-main-img')?.getAttribute('src') || '';
    return { title, price, originalPrice, image, platform: 'myntra', url };
}
