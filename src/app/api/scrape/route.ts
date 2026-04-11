import { NextRequest, NextResponse } from 'next/server';
import { scrapeProduct } from '@/lib/features/scraper/scraper';

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();
        if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

        const data = await scrapeProduct(url);
        if (!data) {
            return NextResponse.json({
                error: 'Could not fetch product details. The site may be blocking our request. Please fill in the details manually.'
            }, { status: 422 });
        }

        // Return with a warning flag if we only got data from the URL slug
        return NextResponse.json({
            ...data,
            warning: data.fromUrl
                ? 'Site blocked auto-fetch. Title was extracted from URL — please verify and fill in price & image manually.'
                : null,
        });
    } catch (error) {
        console.error('Scrape API error:', error);
        return NextResponse.json({ error: 'Failed to fetch product data' }, { status: 500 });
    }
}
