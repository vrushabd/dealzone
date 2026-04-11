import { NextRequest, NextResponse } from 'next/server';
import { predictPrice } from '@/lib/ai/prediction';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('productId');

        if (!productId) {
            return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
        }

        const prediction = await predictPrice(productId);
        return NextResponse.json(prediction);
    } catch (error) {
        console.error('Prediction API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
