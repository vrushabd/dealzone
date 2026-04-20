import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const settings = await prisma.siteSettings.findFirst({ where: { id: "default" } });
        return NextResponse.json({ 
            defaultTheme: settings?.defaultTheme || "dark",
            siteName: settings?.siteName || "GenzLoots",
            logoUrl: settings?.logoUrl || "",
            faviconUrl: settings?.faviconUrl || "",
            geminiApiKey: settings?.geminiApiKey || "",
            amazonAffiliateTag: settings?.amazonAffiliateTag || "",
            flipkartAffiliateId: settings?.flipkartAffiliateId || "",
            resendApiKey: settings?.resendApiKey || "",
        });
    } catch (error) {
        console.error("Settings GET error:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { defaultTheme, siteName, logoUrl, faviconUrl, geminiApiKey, amazonAffiliateTag, flipkartAffiliateId, resendApiKey } = await req.json();

        const updateData: { 
            defaultTheme?: string;
            siteName?: string;
            logoUrl?: string | null;
            faviconUrl?: string | null;
            geminiApiKey?: string;
            amazonAffiliateTag?: string;
            flipkartAffiliateId?: string;
            resendApiKey?: string;
        } = {};

        if (defaultTheme) {
            if (!["light", "dark"].includes(defaultTheme)) {
                return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
            }
            updateData.defaultTheme = defaultTheme;
        }

        if (siteName !== undefined) updateData.siteName = siteName.trim() || "GenzLoots";
        if (logoUrl !== undefined) updateData.logoUrl = logoUrl.trim() || null;
        if (faviconUrl !== undefined) updateData.faviconUrl = faviconUrl.trim() || null;
        if (geminiApiKey !== undefined) updateData.geminiApiKey = geminiApiKey;
        if (amazonAffiliateTag !== undefined) updateData.amazonAffiliateTag = amazonAffiliateTag;
        if (flipkartAffiliateId !== undefined) updateData.flipkartAffiliateId = flipkartAffiliateId;
        if (resendApiKey !== undefined) updateData.resendApiKey = resendApiKey;

        const settings = await prisma.siteSettings.upsert({
            where: { id: "default" },
            update: updateData,
            create: { 
                id: "default", 
                defaultTheme: updateData.defaultTheme || "dark",
                siteName: updateData.siteName || "GenzLoots",
                logoUrl: updateData.logoUrl || null,
                faviconUrl: updateData.faviconUrl || null,
                geminiApiKey: updateData.geminiApiKey || null,
                amazonAffiliateTag: updateData.amazonAffiliateTag || null,
                flipkartAffiliateId: updateData.flipkartAffiliateId || null,
                resendApiKey: updateData.resendApiKey || null,
            },
        });

        return NextResponse.json({ success: true, settings });
    } catch (error) {
        console.error("Settings POST error:", error);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
