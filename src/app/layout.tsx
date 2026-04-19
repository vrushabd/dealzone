import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AnalyticsTracker } from "@/components/layout/AnalyticsTracker";
import ChatbotWidget from "@/components/chat/ChatbotWidget";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: {
    default: "GenzLoots – Best Amazon & Flipkart Deals",
    template: "%s | GenzLoots",
  },
  description:
    "Discover the best deals, discounts and trending products from Amazon & Flipkart. Handpicked deals updated daily.",
  keywords: ["deals", "discounts", "amazon", "flipkart", "affiliate", "offers", "shopping"],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "GenzLoots",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@genzloots",
  },
  robots: { index: true, follow: true },
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
