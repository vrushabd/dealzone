import { parse, type HTMLElement } from 'node-html-parser';

export interface ScrapedProduct {
    title: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    image: string;
    images?: string[];
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

type JsonRecord = Record<string, unknown>;

type StructuredDataProduct = {
    title?: string;
    image?: string;
    images?: string[];
    price?: number;
    originalPrice?: number;
    rating?: number;
    category?: string;
    description?: string;
    availability?: string;
};

type FetchResult = {
    html: string;
    status: number;
    finalUrl: string;
};

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === 'object' && value !== null;
}

function normalizeText(value: string | null | undefined): string {
    return value?.replace(/\s+/g, ' ').trim() || '';
}

function normalizePrice(value: unknown): number | undefined {
    if (typeof value === 'number') {
        return Number.isFinite(value) && value > 0 ? value : undefined;
    }

    if (typeof value === 'string') {
        const normalized = value.replace(/[,₹\s]/g, '');
        const parsed = parseFloat(normalized);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
    }

    return undefined;
}

function normalizeImageSource(value: string): string {
    return value
        .replace(/\\u002F/gi, '/')
        .replace(/\\\//g, '/')
        .replace(/&amp;/gi, '&')
        .trim();
}

function extractImageCandidates(value: string): string[] {
    const normalized = normalizeImageSource(value);
    if (!normalized) return [];

    const absoluteMatches = normalized.match(/https?:\/\/[^\s",]+/gi);
    if (absoluteMatches && absoluteMatches.length > 0) {
        return absoluteMatches.map((candidate) => candidate.replace(/[,)]+$/g, ''));
    }

    const srcsetParts = normalized
        .split(',')
        .map((part) => part.trim().split(/\s+/)[0]?.trim())
        .filter(Boolean) as string[];

    return srcsetParts.length > 0 ? srcsetParts : [normalized];
}

function toAbsoluteImageUrl(value: string, platform: ScrapedProduct['platform']): string {
    const normalized = normalizeImageSource(value);
    if (!normalized) return '';
    if (normalized.startsWith('//')) return `https:${normalized}`;
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) return normalized;

    if (platform === 'amazon') return `https://www.amazon.in${normalized}`;
    if (platform === 'flipkart') return `https://www.flipkart.com${normalized}`;
    if (platform === 'myntra') return `https://www.myntra.com${normalized}`;

    return normalized;
}

function normalizeAvailability(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;

    const cleaned = value.split('/').pop() || value;
    const normalized = normalizeText(
        cleaned
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/[-_]/g, ' ')
    );

    return normalized || undefined;
}

function isGenericSiteTitle(title: string, platform: ScrapedProduct['platform']): boolean {
    const normalized = normalizeText(title).toLowerCase();
    if (!normalized) return true;

    const genericPhrases = [
        'page not found',
        '404',
        'captcha',
        'access denied',
        'robot check',
        'security check',
        'something went wrong',
        'flipkart recaptcha',
    ];

    if (genericPhrases.some((phrase) => normalized.includes(phrase))) {
        return true;
    }

    if (platform === 'flipkart') {
        return normalized.includes('buy products online at best price in india') ||
            normalized.includes('all categories | flipkart.com');
    }

    if (platform === 'amazon') {
        return normalized === 'amazon.in' ||
            normalized.includes('online shopping site in india') ||
            normalized.includes('page not found');
    }

    if (platform === 'myntra') {
        return normalized.includes('online shopping for women, men, kids fashion') ||
            normalized === 'myntra';
    }

    return false;
}

function isMeaningfulTitle(title: string, platform: ScrapedProduct['platform']): boolean {
    const normalized = normalizeText(title);
    if (normalized.length < 4) return false;
    if (!/[a-z]/i.test(normalized)) return false;
    if (isGenericSiteTitle(normalized, platform)) return false;
    return true;
}

function isLikelyProductImage(url: string, platform: ScrapedProduct['platform']): boolean {
    if (!url) return false;

    const normalized = url.toLowerCase();
    if (!normalized.startsWith('http')) return false;
    if (/\s\d+x(?:$|,)/i.test(url)) return false;

    const blockedFragments = [
        '.svg',
        '.gif',
        'placeholder',
        'logo',
        'sprite',
        '/promos/',
        '/icons/',
        '/favicon',
        'blank',
    ];

    if (blockedFragments.some((fragment) => normalized.includes(fragment))) {
        return false;
    }

    if (platform === 'flipkart' && normalized.includes('/www/')) {
        return false;
    }

    try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) return false;

        if (platform === 'flipkart') {
            const validHost = /(^|\.)flixcart\.com$/i.test(parsed.hostname) || /(^|\.)flipkart\.com$/i.test(parsed.hostname);
            if (!validHost) return false;
        }

        if (platform === 'amazon') {
            const validHost = /(^|\.)media-amazon\.com$/i.test(parsed.hostname) || /(^|\.)amazon\.in$/i.test(parsed.hostname);
            if (!validHost) return false;
        }
    } catch {
        return false;
    }

    return true;
}

function dedupeImages(
    images: Array<string | null | undefined>,
    platform: ScrapedProduct['platform']
): string[] {
    const unique = new Set<string>();

    for (const image of images) {
        for (const candidate of extractImageCandidates(image || '')) {
            const absolute = toAbsoluteImageUrl(candidate, platform);
            if (!absolute) continue;

            const upscaled = upscaleImageUrl(absolute, platform);
            if (!isLikelyProductImage(upscaled, platform)) continue;

            unique.add(upscaled);
        }
    }

    return Array.from(unique).slice(0, 8);
}

function titleFromSlug(url: string): string {
    try {
        const parsed = new URL(url);
        const ignoredSegments = new Set([
            'dp',
            'p',
            'gp',
            'product',
            'products',
            'buy',
            'search',
            'shop',
            'browse',
        ]);

        const segments = parsed.pathname
            .split('/')
            .map((segment) => decodeURIComponent(segment))
            .map((segment) => segment.trim())
            .filter(Boolean);

        const candidates = segments.filter((segment) => {
            const lower = segment.toLowerCase();
            if (ignoredSegments.has(lower)) return false;
            if (segment.length < 4) return false;
            if (/^[a-z0-9]{10,15}$/i.test(segment)) return false;
            if (/^itm[a-z0-9]{6,}$/i.test(segment)) return false;
            if (/^b0[a-z0-9]{8,}$/i.test(segment)) return false;
            if (!/[a-z]/i.test(segment)) return false;
            return /[-_]/.test(segment);
        });

        const slug = candidates[candidates.length - 1] || '';
        return normalizeText(
            slug
                .replace(/[-_]+/g, ' ')
                .replace(/\b\w/g, (char) => char.toUpperCase())
        );
    } catch {
        return '';
    }
}

function isLikelyProductUrl(url: string, platform: ScrapedProduct['platform']): boolean {
    try {
        const parsed = new URL(url);
        const pathname = parsed.pathname.toLowerCase();

        if (platform === 'amazon') {
            return pathname.includes('/dp/') ||
                pathname.includes('/gp/product/') ||
                pathname.includes('/gp/aw/d/');
        }

        if (platform === 'flipkart') {
            return pathname.includes('/p/') || parsed.searchParams.has('pid');
        }

        if (platform === 'myntra') {
            const segments = pathname.split('/').filter(Boolean);
            return segments.length >= 2 && !pathname.includes('/shop');
        }

        return false;
    } catch {
        return false;
    }
}

function isBotPage(html: string, title: string): boolean {
    const botPhrases = [
        'are you a human',
        'robot',
        'captcha',
        'access denied',
        'verify you are',
        '403 forbidden',
        'security check',
        'one moment',
        'recaptcha',
    ];
    const combined = (html.slice(0, 4000) + title).toLowerCase();
    return botPhrases.some((phrase) => combined.includes(phrase));
}

function isErrorPage(html: string, title: string, status: number): boolean {
    if (status >= 400) return true;

    const combined = normalizeText(`${title} ${html.slice(0, 2000)}`).toLowerCase();
    return combined.includes('page not found') ||
        combined.includes('we could not find that page') ||
        combined.includes('the page you are looking for');
}

function hasMeaningfulProductData(product: ScrapedProduct | null): boolean {
    if (!product) return false;
    if (!isMeaningfulTitle(product.title, product.platform)) return false;
    return product.price > 0 || Boolean(product.image);
}

function sanitizeScrapedProduct(product: ScrapedProduct | null): ScrapedProduct | null {
    if (!product) return null;

    const title = isMeaningfulTitle(product.title, product.platform)
        ? normalizeText(product.title)
        : '';
    const imageList = dedupeImages(
        [product.image, ...(product.images || [])],
        product.platform
    );
    const image = imageList[0] || '';
    const price = normalizePrice(product.price) || 0;
    const originalPrice = normalizePrice(product.originalPrice);
    const rating = typeof product.rating === 'number' && product.rating > 0 && product.rating <= 5
        ? product.rating
        : undefined;
    const description = normalizeText(product.description);
    const category = normalizeText(product.category);
    const deliveryInfo = normalizeText(product.deliveryInfo);
    const availability = normalizeAvailability(product.availability);
    const reviews = (product.reviews || [])
        .map((review) => ({
            rating: typeof review.rating === 'number' && review.rating > 0 ? review.rating : 5,
            title: normalizeText(review.title) || undefined,
            comment: normalizeText(review.comment),
            author: normalizeText(review.author) || undefined,
        }))
        .filter((review) => review.comment.length > 5)
        .slice(0, 5);
    const bankOffers = Array.from(
        new Set((product.bankOffers || []).map((offer) => normalizeText(offer)).filter(Boolean))
    ).slice(0, 8);

    const normalized: ScrapedProduct = {
        ...product,
        title,
        image,
        images: imageList,
        price,
        originalPrice,
        rating,
        description: description || undefined,
        category: category || undefined,
        deliveryInfo: deliveryInfo || undefined,
        availability,
        reviews,
        bankOffers,
    };

    if (!normalized.discount && normalized.originalPrice && normalized.price > 0 && normalized.originalPrice > normalized.price) {
        normalized.discount = Math.round(((normalized.originalPrice - normalized.price) / normalized.originalPrice) * 100);
    }

    return normalized;
}

function applyStructuredData(
    base: ScrapedProduct | null,
    structured: StructuredDataProduct,
    platform: ScrapedProduct['platform'],
    url: string
): ScrapedProduct | null {
    if (!base && !structured.title && !structured.image && !structured.price) {
        return null;
    }

    const product: ScrapedProduct = {
        title: base?.title || structured.title || '',
        price: base?.price || structured.price || 0,
        originalPrice: base?.originalPrice || structured.originalPrice,
        discount: base?.discount,
        image: base?.image || structured.image || '',
        images: dedupeImages([
            ...(base?.images || []),
            base?.image,
            ...(structured.images || []),
            structured.image,
        ], platform),
        seller: base?.seller,
        rating: base?.rating || structured.rating,
        availability: base?.availability || structured.availability,
        platform,
        url,
        category: base?.category || structured.category,
        description: base?.description || structured.description,
        bankOffers: base?.bankOffers,
        deliveryInfo: base?.deliveryInfo,
        reviews: base?.reviews,
        fromUrl: base?.fromUrl,
    };

    if (!product.image && product.images && product.images.length > 0) {
        product.image = product.images[0];
    }

    return sanitizeScrapedProduct(product);
}

/** Improve image quality by rewriting dimension parameters in URLs */
function upscaleImageUrl(url: string, platform: ScrapedProduct['platform']): string {
    if (!url) return '';
    try {
        if (platform === 'flipkart' && url.includes('rukminim')) {
            const parsed = new URL(url);
            parsed.pathname = parsed.pathname.replace(/\/image\/\d+\/\d+\//, '/image/832/832/');
            parsed.searchParams.set('q', '90');
            return parsed.toString();
        }

        if (platform === 'amazon' && url.includes('media-amazon.com')) {
            return url.replace(/\._[A-Z0-9,]+_\./g, '.');
        }
    } catch {
        return url;
    }

    return url;
}

function parseJsonLd(html: string, platform: ScrapedProduct['platform']): StructuredDataProduct {
    try {
        const matches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];

        for (const match of matches) {
            try {
                const data = JSON.parse(match[1]) as unknown;
                const graph = isRecord(data) ? data['@graph'] : undefined;
                const nodes = Array.isArray(graph) ? graph : [data];
                const product = nodes.find((node): node is JsonRecord => {
                    if (!isRecord(node)) return false;
                    const type = node['@type'];
                    if (Array.isArray(type)) {
                        return type.includes('Product');
                    }
                    return type === 'Product' || type === 'IndividualProduct';
                });

                if (!product) continue;

                const imageValue = product['image'];
                const imageCandidates = Array.isArray(imageValue) ? imageValue : [imageValue];
                const images = dedupeImages(
                    imageCandidates.filter((value): value is string => typeof value === 'string'),
                    platform
                );

                const offer = Array.isArray(product['offers']) ? product['offers'][0] : product['offers'];
                const aggregateRating = isRecord(product['aggregateRating']) ? product['aggregateRating'] : undefined;

                return {
                    title: typeof product['name'] === 'string' ? normalizeText(product['name']) : undefined,
                    image: images[0],
                    images,
                    price: normalizePrice(isRecord(offer) ? offer['price'] : undefined),
                    originalPrice: normalizePrice(
                        isRecord(offer)
                            ? offer['highPrice'] ?? offer['priceSpecification']
                            : undefined
                    ),
                    rating: normalizePrice(aggregateRating?.['ratingValue']),
                    category: typeof product['category'] === 'string' ? normalizeText(product['category']) : undefined,
                    description: typeof product['description'] === 'string' ? normalizeText(product['description']) : undefined,
                    availability: normalizeAvailability(isRecord(offer) ? offer['availability'] : undefined),
                };
            } catch {
                continue;
            }
        }
    } catch {
        return {};
    }

    return {};
}

function parseFlipkartWindowState(html: string): StructuredDataProduct {
    try {
        const match = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]+?\})(?:;\s*(?:window|<\/script>|$))/);
        if (!match) return {};

        const state = JSON.parse(match[1]) as JsonRecord;
        const pageData = isRecord(state.pageData) ? state.pageData : undefined;
        const pageContext = isRecord(pageData?.pageContext) ? pageData.pageContext : undefined;
        const pdpData = isRecord(pageContext?.pdpData) ? pageContext.pdpData : undefined;
        const product = isRecord(pdpData?.product) ? pdpData.product : undefined;
        if (!product) return {};

        const pricing = isRecord(product.pricing) ? product.pricing : undefined;
        const media = isRecord(product.media) ? product.media : undefined;
        const productDescription = isRecord(product.productDescription) ? product.productDescription : undefined;
        const images = Array.isArray(media?.images)
            ? media.images
                .map((image) => isRecord(image) ? image.url : undefined)
                .filter((value): value is string => typeof value === 'string')
            : [];

        return {
            title: typeof productDescription?.completeProductName === 'string'
                ? normalizeText(productDescription.completeProductName)
                : undefined,
            image: images[0],
            images,
            price: normalizePrice(isRecord(pricing?.finalPrice) ? pricing.finalPrice.value : undefined),
            originalPrice: normalizePrice(isRecord(pricing?.mrp) ? pricing.mrp.value : undefined),
        };
    } catch {
        return {};
    }
}

function parseOpenGraph(root: HTMLElement, platform: ScrapedProduct['platform']): { title?: string; image?: string; price?: number } {
    const og = (name: string) =>
        root.querySelector(`meta[property="og:${name}"]`)?.getAttribute('content') ||
        root.querySelector(`meta[name="og:${name}"]`)?.getAttribute('content') || '';

    const title = normalizeText(og('title') || root.querySelector('title')?.text || '');
    const image = toAbsoluteImageUrl(og('image') || '', platform);
    const price = normalizePrice(og('price:amount'));

    return {
        title: isMeaningfulTitle(title, platform) ? title : undefined,
        image: isLikelyProductImage(image, platform) ? image : undefined,
        price,
    };
}

const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const CHROME_MAC_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

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

async function fetchHtml(url: string, headers: Record<string, string>): Promise<FetchResult | null> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        const response = await fetch(url, {
            headers,
            redirect: 'follow',
            signal: controller.signal,
            cache: 'no-store',
        });
        clearTimeout(timeout);

        return {
            html: await response.text(),
            status: response.status,
            finalUrl: response.url,
        };
    } catch {
        return null;
    }
}

export async function scrapeProduct(rawUrl: string): Promise<ScrapedProduct | null> {
    let url: string;
    let hostname: string;

    try {
        const parsed = new URL(rawUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) return null;
        url = parsed.toString();
        hostname = parsed.hostname.toLowerCase();
    } catch {
        return null;
    }

    const allowedHosts = [
        'www.amazon.in',
        'amazon.in',
        'www.flipkart.com',
        'flipkart.com',
        'm.flipkart.com',
        'www.myntra.com',
        'myntra.com',
    ];
    if (!allowedHosts.includes(hostname)) {
        return null;
    }

    const platform: ScrapedProduct['platform'] =
        hostname.includes('amazon') ? 'amazon' :
        hostname.includes('flipkart') ? 'flipkart' :
        hostname.includes('myntra') ? 'myntra' :
        'unknown';

    if (platform === 'unknown' || !isLikelyProductUrl(url, platform)) {
        return null;
    }

    const platformHeaders = platform === 'amazon'
        ? AMAZON_HEADERS
        : platform === 'flipkart'
            ? FLIPKART_HEADERS
            : BASE_HEADERS;

    let result: ScrapedProduct | null = null;
    const desktop = await fetchHtml(url, platformHeaders);

    if (desktop) {
        const root = parse(desktop.html);
        const pageTitle = normalizeText(root.querySelector('title')?.text || '');
        const blockedOrInvalid = isBotPage(desktop.html, pageTitle) ||
            isErrorPage(desktop.html, pageTitle, desktop.status) ||
            isGenericSiteTitle(pageTitle, platform);

        if (!blockedOrInvalid) {
            if (platform === 'amazon') {
                result = parseAmazon(root, url);
            } else if (platform === 'flipkart') {
                result = parseFlipkart(root, url, desktop.html);
            } else if (platform === 'myntra') {
                result = parseMyntra(root, url, desktop.html);
            }

            result = applyStructuredData(result, parseJsonLd(desktop.html, platform), platform, url);

            if (platform === 'flipkart' && (!result?.price || !result?.image || !result?.title)) {
                result = applyStructuredData(result, parseFlipkartWindowState(desktop.html), platform, url);
            }

            if (!result?.price || !result?.image || !result?.title) {
                const og = parseOpenGraph(root, platform);
                result = sanitizeScrapedProduct({
                    title: result?.title || og.title || '',
                    price: result?.price || og.price || 0,
                    originalPrice: result?.originalPrice,
                    discount: result?.discount,
                    image: result?.image || og.image || '',
                    images: result?.images || [],
                    seller: result?.seller,
                    rating: result?.rating,
                    availability: result?.availability,
                    platform,
                    url,
                    category: result?.category,
                    description: result?.description,
                    bankOffers: result?.bankOffers,
                    deliveryInfo: result?.deliveryInfo,
                    reviews: result?.reviews,
                    fromUrl: result?.fromUrl,
                });
            }
        }
    }

    if (platform === 'flipkart' && (!hasMeaningfulProductData(result) || !result?.price || !result?.image)) {
        const mobileUrl = url.replace('www.flipkart.com', 'm.flipkart.com');
        const mobile = await fetchHtml(mobileUrl, MOBILE_HEADERS);

        if (mobile) {
            const root = parse(mobile.html);
            const pageTitle = normalizeText(root.querySelector('title')?.text || '');
            const blockedOrInvalid = isBotPage(mobile.html, pageTitle) ||
                isErrorPage(mobile.html, pageTitle, mobile.status) ||
                isGenericSiteTitle(pageTitle, 'flipkart');

            if (!blockedOrInvalid) {
                result = sanitizeScrapedProduct({
                    ...(result || {
                        title: '',
                        price: 0,
                        image: '',
                        platform: 'flipkart',
                        url,
                    }),
                    ...parseFlipkartMobile(root, url),
                });

                result = applyStructuredData(result, parseJsonLd(mobile.html, 'flipkart'), 'flipkart', url);

                if (!result?.image) {
                    const og = parseOpenGraph(root, 'flipkart');
                    if (og.image) {
                        result = sanitizeScrapedProduct({
                            ...(result || {
                                title: '',
                                price: 0,
                                image: '',
                                platform: 'flipkart',
                                url,
                            }),
                            image: og.image,
                            title: result?.title || og.title || '',
                        });
                    }
                }
            }
        }
    }

    result = sanitizeScrapedProduct(result);
    if (hasMeaningfulProductData(result)) {
        return result;
    }

    const slugTitle = titleFromSlug(url);
    if (!slugTitle) return null;

    return {
        title: slugTitle,
        image: '',
        price: 0,
        originalPrice: result?.originalPrice,
        discount: result?.discount,
        description: result?.description,
        platform,
        url,
        fromUrl: true,
    };
}

function parseAmazon(root: HTMLElement, url: string): ScrapedProduct {
    const title = normalizeText(
        root.querySelector('#productTitle')?.text ||
        root.querySelector('span#productTitle')?.text ||
        root.querySelector('meta[name="title"]')?.getAttribute('content') ||
        ''
    );

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
    for (const selector of priceSelectors) {
        const parsed = normalizePrice(root.querySelector(selector)?.text || '');
        if (parsed) {
            price = parsed;
            break;
        }
    }

    const originalPriceSelectors = [
        '.basisPrice .a-offscreen',
        '.a-text-price .a-offscreen',
        '#listPrice',
        '#priceblock_saleprice',
    ];

    let originalPrice: number | undefined;
    for (const selector of originalPriceSelectors) {
        const parsed = normalizePrice(root.querySelector(selector)?.text || '');
        if (parsed && parsed > price) {
            originalPrice = parsed;
            break;
        }
    }

    const discount = normalizePrice(
        (root.querySelector('.savingsPercentage')?.text ||
        root.querySelector('.reinventPriceSavingsPercentageMargin')?.text || '')
            .replace(/[-%\s]/g, '')
    );

    const imageSelectors = [
        '#landingImage',
        '#imgBlkFront',
        '#main-image',
        '.a-dynamic-image',
    ];

    let image = '';
    for (const selector of imageSelectors) {
        const element = root.querySelector(selector);
        const candidate = element?.getAttribute('data-old-hires') ||
            element?.getAttribute('src') ||
            element?.getAttribute('data-src') ||
            '';
        const absolute = toAbsoluteImageUrl(candidate, 'amazon');
        if (isLikelyProductImage(absolute, 'amazon')) {
            image = upscaleImageUrl(absolute, 'amazon');
            break;
        }
    }

    const galleryImages = dedupeImages([
        image,
        ...root.querySelectorAll('#altImages ul li.item span img, #altImages ul li.a-spacing-small img, #imageBlock_feature_div img')
            .map((element) => element.getAttribute('data-old-hires') || element.getAttribute('src') || ''),
    ], 'amazon');

    const category = normalizeText(
        root.querySelector('#wayfinding-breadcrumbs_container ul li:last-child a')?.text ||
        root.querySelector('#wayfinding-breadcrumbs_container ul li:nth-last-child(2) a')?.text ||
        root.querySelector('#wayfinding-breadcrumbs_container ul li:last-child')?.text ||
        ''
    );

    const rating = normalizePrice(
        (root.querySelector('#acrPopover')?.getAttribute('title') ||
        root.querySelector('span[data-hook="rating-out-of-text"]')?.text ||
        root.querySelector('.a-icon-star span.a-icon-alt')?.text ||
        '').replace(/[^0-9.]/g, '')
    );

    const description = normalizeText(
        Array.from(root.querySelectorAll('#feature-bullets li span.a-list-item'))
            .map((element) => normalizeText(element.text))
            .filter((text) => text.length > 5)
            .join('\n') ||
        root.querySelector('#productDescription p')?.text ||
        ''
    );

    const reviews = root.querySelectorAll('div[data-hook="review"]').slice(0, 5).map((element) => ({
        rating: normalizePrice(element.querySelector('i[data-hook="review-star-rating"] span')?.text || '') || 5,
        title: normalizeText(
            element.querySelector('a[data-hook="review-title"] span:not(.a-icon-alt)')?.text ||
            element.querySelector('a[data-hook="review-title"] span')?.text ||
            ''
        ) || undefined,
        comment: normalizeText(element.querySelector('span[data-hook="review-body"] span')?.text || ''),
        author: normalizeText(element.querySelector('span.a-profile-name')?.text || 'Amazon Customer') || undefined,
    })).filter((review) => review.comment.length > 5);

    const bankOffers = root.querySelectorAll('#bankOffer_feature_div .a-carousel-card span.a-truncate-full, #bankOffer_feature_div .a-section-bank-offer span')
        .map((element) => normalizeText(element.text))
        .filter((text) => text.length > 10);

    const deliveryInfo = normalizeText(
        root.querySelector('#mir-layout-DELIVERY_BLOCK-slot-PRIMARY_DELIVERY_MESSAGE_ID span')?.text ||
        root.querySelector('#deliveryMessageMirId span')?.text ||
        ''
    );

    return {
        title,
        price,
        originalPrice,
        discount,
        image,
        images: galleryImages,
        platform: 'amazon',
        url,
        category,
        rating,
        description,
        reviews,
        bankOffers,
        deliveryInfo,
    };
}

function parseFlipkart(root: HTMLElement, url: string, html?: string): ScrapedProduct {
    const mainContainer = root.querySelector('.aMaAEs') || root.querySelector('.DOjaZg') || root;

    const title = normalizeText(
        mainContainer.querySelector('.VU-Z7x')?.text ||
        mainContainer.querySelector('h1.yhB1nd')?.text ||
        mainContainer.querySelector('.B_NuCI')?.text ||
        mainContainer.querySelector('h1._9E25nV')?.text ||
        mainContainer.querySelector('span.B_NuCI')?.text ||
        mainContainer.querySelector('._2W109w')?.text ||
        root.querySelector('h1')?.text ||
        ''
    );

    const priceSelectors = [
        '.Nx9n0j',
        '._30jeq3',
        '._16Jk6d',
        '.hl05eU',
        '.UOCQB1 .Nx9n0j',
        '[class*="finalPrice"]',
        '.Y1HWO0',
    ];

    let price = 0;
    for (const selector of priceSelectors) {
        const parsed = normalizePrice(mainContainer.querySelector(selector)?.text || '');
        if (parsed && (!price || parsed < price)) {
            price = parsed;
        }
    }

    if (price === 0 && html) {
        const match = html.match(/"(?:finalPrice|price)"\s*:\s*"?(\d+(?:\.\d+)?)/);
        const parsed = normalizePrice(match?.[1]);
        if (parsed) price = parsed;
    }

    const originalPriceSelectors = [
        '.y9H9c2',
        '._3I9_wc',
        '.yRaY8j',
        '.font-extra-light-black',
        '[class*="mrpPrice"]',
    ];

    let originalPrice: number | undefined;
    for (const selector of originalPriceSelectors) {
        const parsed = normalizePrice(mainContainer.querySelector(selector)?.text || '');
        if (parsed && parsed > price) {
            originalPrice = parsed;
            break;
        }
    }

    const discount = normalizePrice(
        (mainContainer.querySelector('.UkUFwK')?.text ||
        mainContainer.querySelector('._3Ay6Sb')?.text ||
        mainContainer.querySelector('span._2Tpdn3')?.text ||
        '').replace(/[%off\s]/gi, '')
    );

    const image = dedupeImages([
        mainContainer.querySelector('._95YkrM img')?.getAttribute('src'),
        mainContainer.querySelector('._396cs4')?.getAttribute('src'),
        mainContainer.querySelector('._2r_T1I')?.getAttribute('src'),
        root.querySelector('img._2r_T1I')?.getAttribute('src'),
        root.querySelector('img[src*="rukminim"]')?.getAttribute('src'),
    ], 'flipkart')[0] || '';

    const images = dedupeImages([
        image,
        ...(html?.match(/"(https:\/\/rukminim[^"]+?\.(?:jpg|jpeg|png|webp)[^"]*)"/g) || [])
            .map((value) => value.replace(/"/g, '')),
    ], 'flipkart');

    let category = '';
    if (html) {
        const categoryMatch = html.match(/"analyticsData"\s*:\s*\{[^}]*"category"\s*:\s*"([^"]+)"/);
        if (categoryMatch) {
            category = normalizeText(categoryMatch[1].replace(/\\/g, ''));
        }

        if (!category) {
            const pathMatch = html.match(/"categoryPath"\s*:\s*"([^"]+)"/);
            if (pathMatch) {
                const parts = pathMatch[1].replace(/\\/g, '').split('>');
                category = normalizeText(parts[parts.length - 1]);
            }
        }
    }

    if (!category) {
        const breadcrumbCandidates = [
            ...root.querySelectorAll('._2whKao'),
            ...root.querySelectorAll('._1HEO9G'),
            ...root.querySelectorAll('a.dvEPBh'),
            ...root.querySelectorAll('.l7Mx8l a'),
        ].map((element) => normalizeText(element.text)).filter(Boolean);

        category = breadcrumbCandidates[breadcrumbCandidates.length - 1] || '';
    }

    const rating = normalizePrice(
        (mainContainer.querySelector('._3LWZlK')?.text ||
        mainContainer.querySelector('.XQDdHH')?.text ||
        mainContainer.querySelector('._2d4LTz')?.text ||
        root.querySelector('div.row-fluid-seo [itemprop="ratingValue"]')?.text ||
        '').replace(/[^0-9.]/g, '')
    );

    const description = normalizeText(
        mainContainer.querySelector('._1mXcCf')?.text ||
        html?.match(/"description":"([^"]+)"/)?.[1]?.replace(/\\n/g, '\n') ||
        ''
    );

    const reviewContainers = root.querySelectorAll('div.t-ZTKy');
    const ratingContainers = root.querySelectorAll('div._3LWZlK');
    const authorContainers = root.querySelectorAll('p._2sc7ZR._2V5EAA');
    const titleContainers = root.querySelectorAll('p._2-N8zT');
    const reviews = Array.from({ length: Math.min(5, reviewContainers.length) }).map((_, index) => ({
        rating: normalizePrice(ratingContainers[index]?.text || '') || 5,
        title: normalizeText(titleContainers[index]?.text || '') || undefined,
        comment: normalizeText(reviewContainers[index]?.text?.replace(/READ MORE$/, '') || ''),
        author: normalizeText(authorContainers[index]?.text || 'Flipkart Customer') || undefined,
    })).filter((review) => review.comment.length > 5);

    const bankOffers = root.querySelectorAll('li._1MaY_A span, ._3ttV92 span')
        .map((element) => normalizeText(element.text))
        .filter((text) => text.length > 15 && (text.includes('Bank Offer') || text.includes('% off')));

    const deliveryInfo = normalizeText(
        mainContainer.querySelector('._3XNo0Z span')?.text ||
        mainContainer.querySelector('.Y8v6Y_')?.text ||
        ''
    );

    return {
        title,
        price,
        originalPrice,
        discount,
        image,
        images,
        rating,
        platform: 'flipkart',
        url,
        category,
        description,
        reviews,
        bankOffers,
        deliveryInfo,
    };
}

function parseFlipkartMobile(root: HTMLElement, url: string): ScrapedProduct {
    const title = normalizeText(
        root.querySelector('.x4eQg')?.text ||
        root.querySelector('h1')?.text ||
        root.querySelector('._9roun')?.text ||
        ''
    );
    const price = normalizePrice(
        root.querySelector('._1vC4OE')?.text ||
        root.querySelector('.Y1HWO0')?.text ||
        root.querySelector('[class*="price"]')?.text ||
        '0'
    ) || 0;
    const image = dedupeImages([
        root.querySelector('._2r_T1I')?.getAttribute('src'),
        root.querySelector('img[src*="rukminim"]')?.getAttribute('src'),
        root.querySelector('img._2amPTt')?.getAttribute('src'),
    ], 'flipkart')[0] || '';

    return { title, price, image, platform: 'flipkart', url };
}

function parseMyntra(root: HTMLElement, url: string, html?: string): ScrapedProduct {
    const title = normalizeText([
        root.querySelector('.pdp-title')?.text,
        root.querySelector('.pdp-name')?.text,
    ].filter(Boolean).join(' '));
    const price = normalizePrice(root.querySelector('.pdp-price strong')?.text || '') || 0;
    const originalPrice = normalizePrice(root.querySelector('.pdp-mrp s')?.text || '');
    const image = dedupeImages([
        root.querySelector('.pdp-main-img')?.getAttribute('src'),
        root.querySelector('img.image-grid-image')?.getAttribute('src'),
        root.querySelector('img[data-testid="pdp-image"]')?.getAttribute('src'),
    ], 'myntra')[0] || '';

    const category = normalizeText(
        root.querySelector('.breadcrumbs-container li:last-child')?.text ||
        root.querySelector('a.breadcrumbs-link:last-child')?.text ||
        ''
    );

    const description = normalizeText(
        root.querySelector('.pdp-product-description-content')?.text ||
        root.querySelector('.index-product-description')?.text ||
        html?.match(/"productDescriptors":\{[\s\S]*?"description":\{"value":"([^"]+)"/)?.[1]?.replace(/\\n/g, '\n') ||
        ''
    );

    return {
        title,
        price,
        originalPrice,
        image,
        platform: 'myntra',
        url,
        category,
        description,
    };
}
