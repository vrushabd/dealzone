import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: {
    default: "DealZone – Best Amazon & Flipkart Deals",
    template: "%s | DealZone",
  },
  description:
    "Discover the best deals, discounts and trending products from Amazon & Flipkart. Handpicked deals updated daily.",
  keywords: ["deals", "discounts", "amazon", "flipkart", "affiliate", "offers", "shopping"],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "DealZone",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@dealzone",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="bg-[var(--bg-base)] text-[var(--text-primary)] font-sans antialiased transition-colors duration-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
