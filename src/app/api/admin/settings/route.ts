import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const settings = await prisma.siteSettings.findFirst({ where: { id: "default" } });
        return NextResponse.json({
            defaultTheme: settings?.defaultTheme || "dark",
            siteName: settings?.siteName || "ZenCult",
            siteTagline: settings?.siteTagline || "Best Amazon, Flipkart & Myntra Deals",
            logoUrl: settings?.logoUrl || "",
            faviconUrl: settings?.faviconUrl || "",
            geminiApiKey: settings?.geminiApiKey || "",
            resendApiKey: settings?.resendApiKey || "",
            scrapingBeeApiKey: settings?.scrapingBeeApiKey || "",
            razorpayKeyId: settings?.razorpayKeyId || "",
            razorpayKeySecret: settings?.razorpayKeySecret || "",
            contactEmail: settings?.contactEmail || "",
            whatsappNumber: settings?.whatsappNumber || "",
            instagramUrl: settings?.instagramUrl || "",
            facebookUrl: settings?.facebookUrl || "",
            twitterUrl: settings?.twitterUrl || "",
            youtubeUrl: settings?.youtubeUrl || "",
            announcementText: settings?.announcementText || "",
            announcementLink: settings?.announcementLink || "",
            shippingFee: settings?.shippingFee ?? 0,
            freeShippingThreshold: settings?.freeShippingThreshold ?? 500,
        });
    } catch (error) {
        console.error("Settings GET error:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const {
            defaultTheme, siteName, siteTagline, logoUrl, faviconUrl,
            geminiApiKey, resendApiKey, scrapingBeeApiKey, razorpayKeyId, razorpayKeySecret,
            contactEmail, whatsappNumber, instagramUrl, facebookUrl, twitterUrl, youtubeUrl,
            announcementText, announcementLink, shippingFee, freeShippingThreshold
        } = await req.json();

        const updateData: Record<string, string | null | undefined> = {};

        if (defaultTheme) {
            if (!["light", "dark"].includes(defaultTheme)) {
                return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
            }
            updateData.defaultTheme = defaultTheme;
        }

        if (siteName !== undefined) updateData.siteName = siteName.trim() || "ZenCult";
        if (siteTagline !== undefined) updateData.siteTagline = siteTagline.trim() || "Best Amazon, Flipkart & Myntra Deals";
        if (logoUrl !== undefined) updateData.logoUrl = logoUrl.trim() || null;
        if (faviconUrl !== undefined) updateData.faviconUrl = faviconUrl.trim() || null;
        if (geminiApiKey !== undefined) updateData.geminiApiKey = geminiApiKey.trim() || null;
        if (resendApiKey !== undefined) updateData.resendApiKey = resendApiKey.trim() || null;
        if (scrapingBeeApiKey !== undefined) updateData.scrapingBeeApiKey = scrapingBeeApiKey.trim() || null;
        if (razorpayKeyId !== undefined) updateData.razorpayKeyId = razorpayKeyId.trim() || null;
        if (razorpayKeySecret !== undefined) updateData.razorpayKeySecret = razorpayKeySecret.trim() || null;
        if (contactEmail !== undefined) updateData.contactEmail = contactEmail.trim() || null;
        if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber.trim() || null;
        if (instagramUrl !== undefined) updateData.instagramUrl = instagramUrl.trim() || null;
        if (facebookUrl !== undefined) updateData.facebookUrl = facebookUrl.trim() || null;
        if (twitterUrl !== undefined) updateData.twitterUrl = twitterUrl.trim() || null;
        if (youtubeUrl !== undefined) updateData.youtubeUrl = youtubeUrl.trim() || null;
        if (announcementText !== undefined) updateData.announcementText = announcementText.trim() || null;
        if (announcementLink !== undefined) updateData.announcementLink = announcementLink.trim() || null;
        if (shippingFee !== undefined) updateData.shippingFee = typeof shippingFee === "number" ? shippingFee : parseFloat(shippingFee);
        if (freeShippingThreshold !== undefined) updateData.freeShippingThreshold = typeof freeShippingThreshold === "number" ? freeShippingThreshold : parseFloat(freeShippingThreshold);

        const settings = await prisma.siteSettings.upsert({
            where: { id: "default" },
            update: updateData,
            create: {
                id: "default",
                defaultTheme: (updateData.defaultTheme as string) || "dark",
                siteName: (updateData.siteName as string) || "ZenCult",
                siteTagline: (updateData.siteTagline as string) || "Best Amazon, Flipkart & Myntra Deals",
                logoUrl: updateData.logoUrl as string | null,
                faviconUrl: updateData.faviconUrl as string | null,
                geminiApiKey: updateData.geminiApiKey as string | null,
                resendApiKey: updateData.resendApiKey as string | null,
                scrapingBeeApiKey: updateData.scrapingBeeApiKey as string | null,
                razorpayKeyId: updateData.razorpayKeyId as string | null,
                razorpayKeySecret: updateData.razorpayKeySecret as string | null,
                contactEmail: updateData.contactEmail as string | null,
                whatsappNumber: updateData.whatsappNumber as string | null,
                instagramUrl: updateData.instagramUrl as string | null,
                facebookUrl: updateData.facebookUrl as string | null,
                twitterUrl: updateData.twitterUrl as string | null,
                youtubeUrl: updateData.youtubeUrl as string | null,
                announcementText: updateData.announcementText as string | null,
                announcementLink: updateData.announcementLink as string | null,
                shippingFee: updateData.shippingFee as number | null,
                freeShippingThreshold: updateData.freeShippingThreshold as number | null,
            },
        });

        return NextResponse.json({ success: true, settings });
    } catch (error) {
        console.error("Settings POST error:", error);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
