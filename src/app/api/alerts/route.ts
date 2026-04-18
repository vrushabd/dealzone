import { NextRequest, NextResponse } from "next/server";
import { createEmailPriceAlert } from "@/lib/features/alerts/service";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, phone, targetPrice, productId } = body;

        if (phone && !email) {
            return NextResponse.json(
                { error: "SMS alerts are not enabled yet. Please use email alerts." },
                { status: 501 }
            );
        }

        if (!productId || !targetPrice || !email) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const result = await createEmailPriceAlert({
            email,
            productId,
            targetPrice,
        });

        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        return NextResponse.json({ success: true, alert: result.alert });
    } catch (error) {
        console.error("Price Alert Error:", error);
        return NextResponse.json({ error: "Failed to create price alert" }, { status: 500 });
    }
}
