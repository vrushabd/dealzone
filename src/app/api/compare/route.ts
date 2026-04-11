import { NextRequest, NextResponse } from 'next/server';
import { scrapeProduct } from '@/lib/features/scraper/scraper';
import { AffiliateService } from '@/lib/features/affiliate/service';
import { prisma } from '@/lib/prisma';
import slugify from 'slugify';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const { urls } = await req.json();

        if (!urls || !Array.isArray(urls)) {
            return NextResponse.json({ error: 'Invalid URLs' }, { status: 400 });
        }

        const results = await Promise.all(
            urls.map(async (url) => {
                if (!url) return null;

                try {
                    const scraped = await scrapeProduct(url);
                    if (!scraped) {
                        console.warn(`Scraping failed for: ${url}`);
                        return null;
                    }

                    // Create a robust unique slug
                    const urlHash = crypto.createHash('md5').update(url).digest('hex').slice(0, 8);
                    const baseSlug = slugify(scraped.title, { lower: true, strict: true, trim: true }) || 'product';
                    const slug = `${baseSlug.slice(0, 100)}-${scraped.platform}-${urlHash}`;

                    // Process Affiliate Link
                    let affiliateUrl = undefined;
                    try {
                        const aff = await AffiliateService.processProductUrl(url);
                        if (aff) affiliateUrl = aff.affiliateUrl;
                    } catch (e) {
                        console.error('Affiliate generation failed:', e);
                    }

                    const product = await prisma.product.upsert({
                        where: { slug },
                        update: {
                            price: scraped.price,
                            originalPrice: scraped.originalPrice,
                            discount: scraped.discount,
                            image: scraped.image,
                            availability: scraped.availability,
                            affiliateUrl: affiliateUrl || undefined,
                            originalUrl: url,
                        },
                        create: {
                            title: scraped.title,
                            slug,
                            description: `Best price for ${scraped.title} on ${scraped.platform}`,
                            price: scraped.price,
                            originalPrice: scraped.originalPrice,
                            discount: scraped.discount,
                            image: scraped.image,
                            category: {
                                connectOrCreate: {
                                    where: { slug: 'compare' },
                                    create: { name: 'Compare', slug: 'compare' }
                                }
                            },
                            availability: scraped.availability,
                            affiliateUrl: affiliateUrl || undefined,
                            originalUrl: url,
                        },
                    });

                    // Track price history
                    if (scraped.price > 0) {
                        try {
                            const historyAccessor = (prisma as any).productPriceHistory || (prisma as any).productpricehistory;
                            if (historyAccessor) {
                                await historyAccessor.create({
                                    data: {
                                        productId: product.id,
                                        price: scraped.price,
                                    },
                                });
                            }
                        } catch (historyError) {
                            console.error('History tracking skipped:', historyError);
                        }
                    }

                    return { ...scraped, dbId: product.id };
                } catch (innerError) {
                    console.error(`Error processing product ${url}:`, innerError);
                    return null;
                }
            })
        );

        const validResults = results.filter(Boolean);
        if (validResults.length === 0 && urls.length > 0) {
            // If we have URLs but no results, it might be a general scraper block or invalid links
            // But let's return an empty array rather than 500 to keep the UI stable
        }

        return NextResponse.json(validResults);
    } catch (error: any) {
        console.error('Global Compare Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
