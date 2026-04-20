import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint — returns only non-sensitive branding settings
// Used by client components (Logo, Navbar) to get dynamic site name/logo
export async function GET() {
    try {
        const settings = await prisma.siteSettings.findFirst({ where: { id: "default" } });
        return NextResponse.json({
            siteName: settings?.siteName || "GenzLoots",
            siteTagline: settings?.siteTagline || "Best Amazon, Flipkart & Myntra Deals",
            logoUrl: settings?.logoUrl || null,
            faviconUrl: settings?.faviconUrl || null,
        }, {
            headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
        });
    } catch {
        return NextResponse.json({ siteName: "GenzLoots", logoUrl: null, faviconUrl: null });
    }
}
