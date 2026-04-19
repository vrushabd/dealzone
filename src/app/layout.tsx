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
  SITE_NAME,
  getSiteUrl,
} from "@/lib/seo";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SITE_NAME} – Best Amazon, Flipkart & Myntra Deals`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  category: "shopping",
  keywords: [
    "Amazon deals",
    "Flipkart deals",
    "Myntra deals",
    "price tracker",
    "price drop alerts",
    "coupons",
    "shopping offers",
    "GenzLoots",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: SITE_NAME,
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
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
};

import { prisma } from "@/lib/prisma";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Query global DB config for default theme; if missing, fallback to dark
  let defaultTheme = "dark";
  try {
    const settings = await prisma.siteSettings.findFirst({ where: { id: "default" } });
    if (settings) {
      defaultTheme = settings.defaultTheme;
    }
  } catch (error) {
    console.error("Failed to load site settings:", error);
  }

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="bg-[var(--bg-base)] text-[var(--text-primary)] font-sans antialiased transition-colors duration-300">
        <Providers forcedDefaultTheme={defaultTheme}>{children}</Providers>
        <ChatbotWidget />
        <AnalyticsTracker />
      </body>
    </html>
  );
}
