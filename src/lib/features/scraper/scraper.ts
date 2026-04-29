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
    platform: 'amazon' | 'flipkart' | 'meesho' | 'unknown';
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
    reviews?: ScrapedReview[];
};

type ScrapedReview = NonNullable<ScrapedProduct['reviews']>[number];

type FetchResult = {
    html: string;
    status: number;
    finalUrl: string;
};

function inferCategoryFromContent(value: string): string | undefined {
    const normalized = normalizeText(value).toLowerCase();
    if (!normalized) return undefined;

    if (/(mobile|smartphone|smart phone|iphone|oppo|samsung|redmi|realme|oneplus|vivo|pixel)/.test(normalized)) {
        return 'Mobiles';
    }

    if (/(laptop|macbook|notebook|computer)/.test(normalized)) {
        return 'Laptops';
    }

    if (/(shoe|sneaker|shirt|jeans|trouser|cargo|fashion)/.test(normalized)) {
        return 'Fashion';
    }

    if (/(kitchen|air fryer|instant pot|mixer|cooker|home)/.test(normalized)) {
        return 'Home & Kitchen';
    }

    if (/(beauty|makeup|serum|cream|shampoo|skincare)/.test(normalized)) {
        return 'Beauty';
    }

    if (/(gaming|ps5|playstation|xbox|controller)/.test(normalized)) {
        return 'Gaming';
    }

    if (/(book|novel|paperback|hardcover|author)/.test(normalized)) {
        return 'Books';
    }

    return undefined;
}

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === 'object' && value !== null;
}

function normalizeText(value: string | null | undefined): string {
    return value?.replace(/\s+/g, ' ').trim() || '';
}

function normalizeProductTitle(value: string | null | undefined): string {
    const normalized = normalizeText(value);
    if (!normalized) return '';

    return normalizeText(
        normalized
            .replace(/\(\s*[^)]*\.\.\.\s*more\)?$/i, '')
            .replace(/\.\.\.\s*more$/i, '')
            .replace(/\s*\bmore$/i, '')
            .replace(/\s+\(\s*$/g, '')
    );
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

function stripHtml(value: string | null | undefined): string {
    if (!value) return '';
    return normalizeText(value.replace(/<[^>]+>/g, ' '));
}

function extractJsonAssignment(html: string, variableName: string): string | null {
    const start = html.indexOf(variableName);
    if (start === -1) return null;

    const equalsIndex = html.indexOf('=', start);
    if (equalsIndex === -1) return null;

    const firstBrace = html.indexOf('{', equalsIndex);
    if (firstBrace === -1) return null;

    let depth = 0;
    let inString = false;
    let quote = '';
    let escaped = false;

    for (let index = firstBrace; index < html.length; index += 1) {
        const char = html[index];

        if (inString) {
            if (escaped) {
                escaped = false;
                continue;
            }

            if (char === '\\') {
                escaped = true;
                continue;
            }

            if (char === quote) {
                inString = false;
            }

            continue;
        }

        if (char === '"' || char === "'") {
            inString = true;
            quote = char;
            continue;
        }

        if (char === '{') {
            depth += 1;
            continue;
        }

        if (char === '}') {
            depth -= 1;
            if (depth === 0) {
                return html.slice(firstBrace, index + 1);
            }
        }
    }

    return null;
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
    if (platform === 'meesho') return `https://www.meesho.com${normalized}`;

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

    if (platform === 'meesho') {
        return normalized.includes('online shopping') ||
            normalized === 'meesho';
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
        'prod-fk-cms-brand-images',
        '/cms-rpd-img/',
        '/blobio/',
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
    platform: ScrapedProduct['platform'],
    limit = 8
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

    return Array.from(unique).slice(0, limit);
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

        if (platform === 'meesho') {
            const segments = pathname.split('/').filter(Boolean);
            return segments.length >= 2;
        }

        return false;
    } catch {
        return false;
    }
}

function normalizeProductUrl(parsed: URL, platform: ScrapedProduct['platform']): string {
    if (platform === 'amazon') {
        const asinMatch = parsed.pathname.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([a-z0-9]{10})/i);
        if (asinMatch) {
            return `${parsed.origin}/dp/${asinMatch[1].toUpperCase()}`;
        }
    }

    if (platform === 'flipkart') {
        const normalized = new URL(`${parsed.origin}${parsed.pathname}`);
        const pid = parsed.searchParams.get('pid');
        if (pid) {
            normalized.searchParams.set('pid', pid);
        }
        return normalized.toString();
    }

    if (platform === 'meesho') {
        return `${parsed.origin}${parsed.pathname}`;
    }

    return parsed.toString();
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

    const normalizedTitle = normalizeProductTitle(product.title);
    const title = isMeaningfulTitle(normalizedTitle, product.platform)
        ? normalizedTitle
        : '';
    const imageList = dedupeImages(
        [product.image, ...(product.images || [])],
        product.platform,
        4
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
        title: normalizeProductTitle(base?.title || structured.title || ''),
        price: base?.price || structured.price || 0,
        originalPrice: base?.originalPrice || structured.originalPrice,
        discount: base?.discount,
        image: base?.image || structured.image || '',
        images: dedupeImages([
            ...(base?.images || []),
            base?.image,
            ...(structured.images || []),
            structured.image,
        ], platform, 4),
        seller: base?.seller,
        rating: base?.rating || structured.rating,
        availability: base?.availability || structured.availability,
        platform,
        url,
        category: base?.category || structured.category,
        description: base?.description || structured.description,
        bankOffers: base?.bankOffers,
        deliveryInfo: base?.deliveryInfo,
        reviews: (base?.reviews && base.reviews.length > 0) ? base.reviews : structured.reviews,
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
                let nodes: unknown[];
                if (Array.isArray(graph)) {
                    nodes = graph;
                } else if (Array.isArray(data)) {
                    nodes = data;
                } else {
                    nodes = [data];
                }
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

                let reviews: ScrapedReview[] | undefined;
                if (Array.isArray(product['review'])) {
                    reviews = product['review']
                        .filter(isRecord)
                        .map(r => {
                            const rRating = isRecord(r['reviewRating']) ? r['reviewRating'] : undefined;
                            const ratingVal = normalizePrice(rRating?.['ratingValue']) || 5;
                            const authorNode = isRecord(r['author']) ? r['author'] : undefined;
                            const authorName = typeof authorNode?.['name'] === 'string' ? authorNode['name'] : 'Customer';
                            return {
                                rating: ratingVal,
                                title: typeof r['name'] === 'string' ? normalizeText(r['name']) : undefined,
                                comment: typeof r['reviewBody'] === 'string' ? normalizeText(r['reviewBody']) : '',
                                author: normalizeText(authorName)
                            };
                        })
                        .filter(r => r.comment.length > 5)
                        .slice(0, 5);
                }

                return {
                    title: typeof product['name'] === 'string' ? normalizeProductTitle(product['name']) : undefined,
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
                    reviews: reviews && reviews.length > 0 ? reviews : undefined,
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
                ? normalizeProductTitle(productDescription.completeProductName)
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

function parseMeeshoNextData(html: string): Partial<ScrapedProduct> {
    try {
        const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/);
        if (!match) return {};
        const data = JSON.parse(match[1]) as JsonRecord;

        // Traverse common Meesho data paths
        const pageProps = isRecord(data.props) && isRecord(data.props.pageProps) ? data.props.pageProps : null;
        if (!pageProps) return {};

        // Try product from pageData or data.product
        const productData: JsonRecord =
            (isRecord(pageProps.data) && isRecord(pageProps.data.product) ? pageProps.data.product : null) ||
            (isRecord(pageProps.product) ? pageProps.product : null) ||
            (isRecord(pageProps.productDetails) ? pageProps.productDetails : null) ||
            {};

        const name = typeof productData.name === 'string' ? productData.name :
                     typeof productData.product_name === 'string' ? productData.product_name : '';

        const price = normalizePrice(productData.discounted_price ?? productData.price ?? productData.finalPrice ?? 0);
        const originalPrice = normalizePrice(productData.mrp ?? productData.original_price ?? productData.originalPrice);

        // Images — can be array of objects or strings
        const rawImages: string[] = [];
        const imgArr = Array.isArray(productData.images) ? productData.images :
                       Array.isArray(productData.product_images) ? productData.product_images : [];
        for (const img of imgArr) {
            if (typeof img === 'string') rawImages.push(img);
            else if (isRecord(img)) {
                const src = img.url ?? img.src ?? img.image_url ?? img.link;
                if (typeof src === 'string') rawImages.push(src);
            }
        }

        const rating = normalizePrice(productData.rating ?? productData.average_rating ?? productData.ratings_count);
        const description = typeof productData.description === 'string' ? normalizeText(productData.description) :
                           typeof productData.product_description === 'string' ? normalizeText(productData.product_description) : '';

        const category = typeof productData.primary_category_name === 'string' ? productData.primary_category_name :
                        typeof productData.category_name === 'string' ? productData.category_name : '';

        // Reviews
        const reviews: ScrapedReview[] = [];
        const reviewArr = Array.isArray(productData.reviews) ? productData.reviews :
                         Array.isArray(pageProps.reviews) ? pageProps.reviews : [];
        for (const r of reviewArr.slice(0, 5)) {
            if (!isRecord(r)) continue;
            const comment = normalizeText(String(r.review_text ?? r.reviewText ?? r.comment ?? ''));
            if (comment.length > 5) {
                reviews.push({
                    rating: normalizePrice(r.rating) || 5,
                    comment,
                    author: normalizeText(String(r.reviewer_name ?? r.author ?? 'Meesho Customer')) || 'Meesho Customer',
                    title: r.review_title ? normalizeText(String(r.review_title)) : undefined,
                });
            }
        }

        return {
            title: normalizeProductTitle(name),
            price: price || 0,
            originalPrice,
            images: rawImages,
            image: rawImages[0] || '',
            rating: rating && rating > 0 && rating <= 5 ? rating : undefined,
            description: description || undefined,
            category: category || undefined,
            reviews: reviews.length > 0 ? reviews : undefined,
        };
    } catch {
        return {};
    }
}

function parseMeesho(root: HTMLElement, url: string, html?: string): ScrapedProduct {
    // 1. Try __NEXT_DATA__ JSON first (most reliable)
    const nextData = html ? parseMeeshoNextData(html) : {};

    // 2. Regex fallbacks for price
    let price = nextData.price || 0;
    if (!price && html) {
        const priceMatch = html.match(/"discounted_price"\s*:\s*(\d+(?:\.\d+)?)/) ||
                           html.match(/"price"\s*:\s*(\d+(?:\.\d+)?)/) ||
                           html.match(/"finalPrice"\s*:\s*(\d+(?:\.\d+)?)/);
        if (priceMatch) price = normalizePrice(priceMatch[1]) || 0;
    }
    if (!price) {
        const textPrice = root.querySelector('h4')?.text || '';
        if (textPrice.includes('₹')) price = normalizePrice(textPrice) || 0;
    }

    // 3. Original price fallback
    let originalPrice = nextData.originalPrice;
    if (!originalPrice && html) {
        const mrpMatch = html.match(/"mrp"\s*:\s*(\d+(?:\.\d+)?)/) ||
                        html.match(/"original_price"\s*:\s*(\d+(?:\.\d+)?)/);
        if (mrpMatch) originalPrice = normalizePrice(mrpMatch[1]);
    }

    // 4. Title fallback
    let title = nextData.title || '';
    if (!title) {
        title = normalizeProductTitle(
            root.querySelector('h1')?.text ||
            html?.match(/"name"\s*:\s*"([^"]+)"/)?.[1] || ''
        );
    }

    // 5. Images fallback
    let images = nextData.images && nextData.images.length > 0 ? nextData.images : [];
    if (images.length === 0 && html) {
        images = dedupeImages([
            root.querySelector('img[src*="images.meesho.com"]')?.getAttribute('src'),
            ...(html.match(/"(https:\/\/images\.meesho\.com[^"]+)"/g) || []).map(s => s.replace(/"/g, '')),
        ], 'meesho');
    }

    // 6. Rating fallback
    const rating = nextData.rating ||
        normalizePrice(html?.match(/"rating"\s*:\s*(\d+(?:\.\d+)?)/)?.[1]);

    // 7. Reviews fallback
    let reviews: ScrapedReview[] = nextData.reviews || [];
    if (reviews.length === 0 && html) {
        const reviewMatches = html.matchAll(/"reviewText"\s*:\s*"([^"]+)".*?"rating"\s*:\s*(\d+(?:\.\d+)?).*?"author"\s*:\s*"([^"]+)"/g);
        for (const match of reviewMatches) {
            const comment = normalizeText(match[1].replace(/\\n/g, ' ').replace(/\\"/g, '"'));
            if (comment.length > 5) {
                reviews.push({ rating: normalizePrice(match[2]) || 5, comment, author: normalizeText(match[3]) || 'Meesho Customer' });
            }
            if (reviews.length >= 5) break;
        }
    }

    const description = nextData.description ||
        normalizeText(html?.match(/"description"\s*:\s*"([^"]+)"/)?.[1]?.replace(/\\n/g, '\n') || '');

    const category = nextData.category ||
        normalizeText(root.querySelectorAll('.breadcrumb-item').pop()?.text || '');

    return {
        title,
        price,
        originalPrice,
        image: images[0] || '',
        images,
        rating,
        platform: 'meesho',
        url,
        category,
        description,
        reviews,
    };
}

function parseOpenGraph(root: HTMLElement, platform: ScrapedProduct['platform']): { title?: string; image?: string; price?: number } {
    const og = (name: string) =>
        root.querySelector(`meta[property="og:${name}"]`)?.getAttribute('content') ||
        root.querySelector(`meta[name="og:${name}"]`)?.getAttribute('content') || '';

    const title = normalizeProductTitle(og('title') || root.querySelector('title')?.text || '');
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
    for (let attempt = 0; attempt < 2; attempt += 1) {
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

            const result = {
                html: await response.text(),
                status: response.status,
                finalUrl: response.url,
            };

            if (![429, 503, 529].includes(result.status) || attempt === 1) {
                return result;
            }
        } catch {
            if (attempt === 1) {
                return null;
            }
        }

        await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
    }

    return null;
}

/** Fetch Meesho via ScrapingBee (renders JS and bypasses Akamai WAF) */
async function fetchMeeshoViaScrapingBee(url: string): Promise<FetchResult | null> {
    const apiKey = process.env.SCRAPINGBEE_API_KEY;
    if (!apiKey) {
        console.warn('[ScrapingBee] SCRAPINGBEE_API_KEY not set, skipping.');
        return null;
    }

    try {
        const params = new URLSearchParams({
            api_key: apiKey,
            url,
            render_js: 'true',
            premium_proxy: 'true',
            country_code: 'in',
            block_ads: 'true',
            wait: '2000',
        });

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        const response = await fetch(`https://app.scrapingbee.com/api/v1/?${params.toString()}`, {
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
            console.error(`[ScrapingBee] HTTP ${response.status} for ${url}`);
            return null;
        }

        const html = await response.text();
        return { html, status: 200, finalUrl: url };
    } catch (err) {
        console.error('[ScrapingBee] fetch failed:', err);
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
        'www.meesho.com',
        'meesho.com',
    ];
    if (!allowedHosts.includes(hostname)) {
        return null;
    }

    const platform: ScrapedProduct['platform'] =
        hostname.includes('amazon') ? 'amazon' :
        hostname.includes('flipkart') ? 'flipkart' :
        hostname.includes('meesho') ? 'meesho' :
        'unknown';

    url = normalizeProductUrl(new URL(url), platform);

    if (platform === 'unknown' || !isLikelyProductUrl(url, platform)) {
        return null;
    }

    const platformHeaders = platform === 'amazon'
        ? AMAZON_HEADERS
        : platform === 'flipkart'
            ? FLIPKART_HEADERS
            : BASE_HEADERS;

    let result: ScrapedProduct | null = null;

    // For Meesho: always use ScrapingBee (direct fetch is blocked by Akamai WAF)
    if (platform === 'meesho') {
        const sbResult = await fetchMeeshoViaScrapingBee(url);
        if (sbResult) {
            const root = parse(sbResult.html);
            const pageTitle = normalizeText(root.querySelector('title')?.text || '');
            const blockedOrInvalid = isBotPage(sbResult.html, pageTitle) ||
                isErrorPage(sbResult.html, pageTitle, sbResult.status) ||
                isGenericSiteTitle(pageTitle, 'meesho');

            if (!blockedOrInvalid) {
                result = parseMeesho(root, url, sbResult.html);
                result = applyStructuredData(result, parseJsonLd(sbResult.html, 'meesho'), 'meesho', url);
            }
        }

        result = sanitizeScrapedProduct(result);
        if (hasMeaningfulProductData(result)) return result;

        // Fallback: title from URL slug
        const slugTitle = titleFromSlug(url);
        if (!slugTitle) return null;
        return {
            title: slugTitle,
            image: '',
            price: 0,
            originalPrice: result?.originalPrice,
            discount: result?.discount,
            description: result?.description,
            platform: 'meesho',
            url,
            fromUrl: true,
        };
    }

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
            } else if (platform === 'meesho') {
                result = parseMeesho(root, url, desktop.html);
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
        title: normalizeProductTitle(title),
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

    const title = normalizeProductTitle(
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
    ], 'flipkart', 4);

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

    if (!category) {
        category = inferCategoryFromContent(`${title} ${url}`) || '';
    }

    // ── Rating: multi-strategy (Flipkart hashes class names on every build) ─────
    let rating: number | undefined;

    // Strategy 1: stable attribute-based selectors
    const ratingAttrCandidates = [
        root.querySelector('[itemprop="ratingValue"]')?.getAttribute('content'),
        root.querySelector('[itemprop="ratingValue"]')?.text,
        mainContainer.querySelector('[class*="rating"]')?.getAttribute('content'),
    ];
    for (const candidate of ratingAttrCandidates) {
        const parsed = normalizePrice((candidate || '').replace(/[^0-9.]/g, ''));
        if (parsed && parsed >= 1 && parsed <= 5) { rating = parsed; break; }
    }

    // Strategy 2: JSON data embedded in page HTML (most reliable)
    if (!rating && html) {
        const jsonPatterns = [
            /"averageRating"\s*:\s*([\d.]+)/,
            /"ratingValue"\s*:\s*([\d.]+)/,
            /"overallRating"\s*:\s*([\d.]+)/,
            /"productRating"\s*:\s*\{[^}]*"value"\s*:\s*"([\d.]+)"/,
        ];
        for (const pattern of jsonPatterns) {
            const m = html.match(pattern);
            const parsed = normalizePrice(m?.[1] || '');
            if (parsed && parsed >= 1 && parsed <= 5) { rating = parsed; break; }
        }
    }

    // Strategy 3: scan all short text spans/divs for a rating-like float (e.g. "4.3")
    // Minimum 2.5 — real product ratings on Flipkart are never 1.0.
    // Stray values like "1.0" come from version numbers, step indicators, etc.
    if (!rating) {
        for (const el of root.querySelectorAll('span, div')) {
            const text = el.text?.trim();
            if (!text || text.length > 5) continue;
            const val = parseFloat(text);
            // Must look exactly like "X.Y" (one decimal digit, 2.5–5.0 range)
            if (Number.isFinite(val) && val >= 2.5 && val <= 5 && /^[2-5]\.[0-9]$/.test(text)) {
                rating = val;
                break;
            }
        }
    }

    // ── Description ───────────────────────────────────────────────────────────
    const description = normalizeText(
        mainContainer.querySelector('._1mXcCf')?.text ||
        html?.match(/"description":"([^"]+)"/)?.[1]?.replace(/\\n/g, '\n') ||
        html?.match(/"productDescription"\s*:\s*\{[^}]*"value"\s*:\s*"([^"]+)"/)?.[1] ||
        ''
    );

    // ── Reviews: use attribute selectors + fallback to comment paragraphs ─────
    const reviewCommentEls = root.querySelectorAll('[itemprop="reviewBody"], [class*="reviewText"], [class*="review-text"]');
    let reviews: ScrapedReview[] = reviewCommentEls.slice(0, 5).map((el) => ({
        rating: 5,
        comment: normalizeText(el.text?.replace(/READ MORE$/i, '') || ''),
        author: 'Flipkart Customer',
    })).filter((review) => review.comment.length > 10);

    if (reviews.length === 0 && html) {
        const regex = /"reviewText":"([^"]+)".{0,220}?"userRating":([0-9.]+).{0,220}?"userName":"([^"]*)"/g;
        const parsedReviews: ScrapedReview[] = [];

        for (const match of html.matchAll(regex)) {
            const comment = normalizeText(match[1]?.replace(/\\n/g, ' ').replace(/\\"/g, '"'));
            if (comment.length <= 10) continue;

            parsedReviews.push({
                rating: normalizePrice(match[2]) || 5,
                comment,
                author: normalizeText(match[3]?.replace(/\\"/g, '"')) || "Flipkart Customer",
            });

            if (parsedReviews.length >= 5) break;
        }

        if (parsedReviews.length > 0) {
            reviews = parsedReviews;
        }
    }

    // ── Bank offers & delivery ─────────────────────────────────────────────────
    const bankOffers = root.querySelectorAll('li._1MaY_A span, ._3ttV92 span, [class*="bankOffer"] span')
        .map((element) => normalizeText(element.text))
        .filter((text) => text.length > 15 && (text.toLowerCase().includes('bank') || text.includes('% off') || text.toLowerCase().includes('cashback')));

    const deliveryInfo = normalizeText(
        root.querySelector('[class*="delivery"] span')?.text ||
        mainContainer.querySelector('._3XNo0Z span')?.text ||
        mainContainer.querySelector('.Y8v6Y_')?.text ||
        ''
    );

    return {
        title: normalizeProductTitle(title),
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
    const title = normalizeProductTitle(
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
    const windowState = html ? parseMyntraWindowState(html) : {};
    const title = normalizeProductTitle([
        root.querySelector('.pdp-title')?.text,
        root.querySelector('.pdp-name')?.text,
        windowState.title,
    ].filter(Boolean).join(' '));
    const price = normalizePrice(root.querySelector('.pdp-price strong')?.text || '') || windowState.price || 0;
    const originalPrice = normalizePrice(root.querySelector('.pdp-mrp s')?.text || '') || windowState.originalPrice;
    const image = dedupeImages([
        root.querySelector('.pdp-main-img')?.getAttribute('src'),
        root.querySelector('img.image-grid-image')?.getAttribute('src'),
        root.querySelector('img[data-testid="pdp-image"]')?.getAttribute('src'),
        windowState.image,
        ...(windowState.images || []),
    ], 'myntra')[0] || '';

    const category = normalizeText(
        root.querySelector('.breadcrumbs-container li:last-child')?.text ||
        root.querySelector('a.breadcrumbs-link:last-child')?.text ||
        windowState.category ||
        ''
    );

    const description = normalizeText(
        root.querySelector('.pdp-product-description-content')?.text ||
        root.querySelector('.index-product-description')?.text ||
        windowState.description ||
        html?.match(/"productDescriptors":\{[\s\S]*?"description":\{"value":"([^"]+)"/)?.[1]?.replace(/\\n/g, '\n') ||
        ''
    );

    return {
        title,
        price,
        originalPrice,
        image,
        images: windowState.images,
        rating: windowState.rating,
        platform: 'myntra',
        url,
        category,
        description,
        reviews: windowState.reviews,
    };
}
