import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AnalyticsTracker } from "@/components/layout/AnalyticsTracker";
import { Analytics } from "@vercel/analytics/react";
import ChatbotWidget from "@/components/chat/ChatbotWidget";
import AnnouncementBanner from "@/components/layout/AnnouncementBanner";
import { DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, SITE_HANDLE, getSiteUrl } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { cache } from "react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", preload: false });

// Cached so it only runs once per request even when called from generateMetadata + RootLayout
const getSettings = cache(async () => {
    try {
        return await prisma.siteSettings.findFirst({ where: { id: "default" } });
    } catch {
        return null;
    }
});

// ── Dynamic metadata (title/favicon from DB) ──────────────────────────────────
export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSettings();
    const siteName = settings?.siteName || "ZenCult";
    const siteTagline = settings?.siteTagline || "Best Amazon, Flipkart & Myntra Deals";
    const faviconUrl = settings?.faviconUrl || null;
    const favicon = faviconUrl || "/favicon.svg";
    const siteUrl = getSiteUrl();

    return {
        metadataBase: new URL(siteUrl),
        title: {
            default: `${siteName} – ${siteTagline}`,
            template: `%s | ${siteName}`,
        },
        description: DEFAULT_DESCRIPTION,
        applicationName: siteName,
        category: "shopping",
        keywords: [
            "Amazon deals India", "Flipkart offers", "Meesho deals", "Myntra sale",
            "best online deals", "price tracker India", "price drop alerts",
            "discount coupons", "cashback offers", "shopping deals today",
            "buy online India", "cheapest price", "deal finder India",
            siteName,
        ],
        alternates: { canonical: "/" },
        openGraph: {
            type: "website",
            locale: "en_IN",
            siteName,
            description: DEFAULT_DESCRIPTION,
            images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: `${siteName} – ${siteTagline}` }],
        },
        twitter: {
            card: "summary_large_image",
            site: SITE_HANDLE,
            description: DEFAULT_DESCRIPTION,
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                "max-image-preview": "large",
                "max-snippet": -1,
                "max-video-preview": -1,
            },
        },
        icons: {
            icon: [{ url: favicon, type: faviconUrl ? "image/png" : "image/svg+xml" }],
            apple: favicon,
        },
        other: {
            "google-site-verification": process.env.GOOGLE_SITE_VERIFICATION || "",
        },
    };
}

// ── Root Layout ───────────────────────────────────────────────────────────────
export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const settings = await getSettings();
    const defaultTheme = settings?.defaultTheme || "dark";
    const faviconUrl = settings?.faviconUrl || null;
    const favicon = faviconUrl || "/favicon.svg";

    return (
        <html lang="en" className={inter.variable} suppressHydrationWarning>
            <head>
                <link rel="icon" href={favicon} />
            </head>
            <body className="bg-[var(--bg-base)] text-[var(--text-primary)] font-sans antialiased transition-colors duration-300">
                <AnnouncementBanner />
                <Providers forcedDefaultTheme={defaultTheme}>{children}</Providers>
                <ChatbotWidget />
                <AnalyticsTracker />
                <Analytics />
            </body>
        </html>
    );
}

// Layout is dynamic because it reads from DB on each request
export const dynamic = "force-dynamic";
