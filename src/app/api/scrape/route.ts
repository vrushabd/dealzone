import { NextRequest, NextResponse } from 'next/server';
import { scrapeProduct } from '@/lib/features/scraper/scraper';

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();
        if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

        const data = await scrapeProduct(url);
        if (!data) {
            return NextResponse.json({ error: 'Could not scrape product details from this URL. Try copying the product page URL directly.' }, { status: 422 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Scrape API error:', error);
        return NextResponse.json({ error: 'Failed to fetch product data' }, { status: 500 });
    }
}
