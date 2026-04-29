import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint — returns only non-sensitive branding settings
// Used by client components (Logo, Navbar) to get dynamic site name/logo
export async function GET() {
    try {
        const settings = await prisma.siteSettings.findFirst({ where: { id: "default" } });
        return NextResponse.json({
            siteName: settings?.siteName || "ZenCult",
            siteTagline: settings?.siteTagline || "Best Amazon, Flipkart & Myntra Deals",
            logoUrl: settings?.logoUrl || null,
            faviconUrl: settings?.faviconUrl || null,
            contactEmail: settings?.contactEmail || null,
            whatsappNumber: settings?.whatsappNumber || null,
            instagramUrl: settings?.instagramUrl || null,
            facebookUrl: settings?.facebookUrl || null,
            twitterUrl: settings?.twitterUrl || null,
            youtubeUrl: settings?.youtubeUrl || null,
            announcementText: settings?.announcementText || null,
            announcementLink: settings?.announcementLink || null,
            shippingFee: settings?.shippingFee ?? 0,
            freeShippingThreshold: settings?.freeShippingThreshold ?? 500,
        }, {
            headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
        });
    } catch {
        return NextResponse.json({ siteName: "ZenCult", logoUrl: null, faviconUrl: null });
    }
}
