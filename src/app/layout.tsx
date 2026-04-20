import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AnalyticsTracker } from "@/components/layout/AnalyticsTracker";
import ChatbotWidget from "@/components/chat/ChatbotWidget";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  SITE_HANDLE,
  getSiteUrl,
} from "@/lib/seo";
import { prisma } from "@/lib/prisma";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let defaultTheme = "dark";
  let siteName = "GenzLoots";
  let faviconUrl: string | null = null;

  try {
    const settings = await prisma.siteSettings.findFirst({ where: { id: "default" } });
    if (settings) {
      defaultTheme = settings.defaultTheme;
      siteName = settings.siteName || "GenzLoots";
      faviconUrl = settings.faviconUrl || null;
    }
  } catch (error) {
    console.error("Failed to load site settings:", error);
  }

  const siteUrl = getSiteUrl();
  const favicon = faviconUrl || "/favicon.svg";

  // Generate metadata dynamically so title/favicon reflect admin settings
  const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${siteName} – Best Amazon, Flipkart & Myntra Deals`,
      template: `%s | ${siteName}`,
    },
    description: DEFAULT_DESCRIPTION,
    applicationName: siteName,
    category: "shopping",
    keywords: [
      "Amazon deals", "Flipkart deals", "Myntra deals",
      "price tracker", "price drop alerts", "coupons", "shopping offers", siteName,
    ],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "en_IN",
      siteName,
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      site: SITE_HANDLE,
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
  };

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Dynamic metadata must be rendered via generateMetadata in RSC — 
            for the favicon especially we inject a link tag directly */}
        <link rel="icon" href={favicon} />
        <title>{siteName} – Best Amazon, Flipkart &amp; Myntra Deals</title>
        <meta name="application-name" content={siteName} />
      </head>
      <body className="bg-[var(--bg-base)] text-[var(--text-primary)] font-sans antialiased transition-colors duration-300">
        <Providers forcedDefaultTheme={defaultTheme}>{children}</Providers>
        <ChatbotWidget />
        <AnalyticsTracker />
      </body>
    </html>
  );
}

// Suppress the static export warning — layout is intentionally dynamic
export const dynamic = "force-dynamic";

// Keep metadata export for pages that don't override it
export { metadata };
