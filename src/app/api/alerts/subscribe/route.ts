import { NextResponse } from "next/server";
import { createEmailPriceAlert } from "@/lib/features/alerts/service";

export async function POST(req: Request) {
    try {
        const { email, targetPrice, productId } = await req.json();

        if (!email || !targetPrice || !productId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const result = await createEmailPriceAlert({
            email,
            targetPrice,
            productId,
        });

        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        return NextResponse.json({ success: true, alert: result.alert });
    } catch (error) {
        console.error("Alert subscription error:", error);
        return NextResponse.json({ error: "Failed to set alert" }, { status: 500 });
    }
}
