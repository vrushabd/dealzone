import type { Metadata } from "next";

export const SITE_NAME = "GenzLoots";
export const SITE_HANDLE = "@genzloots";
export const DEFAULT_SITE_URL = "https://genzloots.com";
export const DEFAULT_OG_IMAGE = "/og-default.png";
export const DEFAULT_DESCRIPTION =
    "Find verified Amazon, Flipkart, Myntra, and online shopping deals with price history, price drop alerts, coupons, and smart buying advice.";

export function getSiteUrl() {
    return (
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.NEXTAUTH_URL ||
        DEFAULT_SITE_URL
    ).replace(/\/$/, "");
}

export function absoluteUrl(path = "/") {
    if (/^https?:\/\//i.test(path)) return path;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${getSiteUrl()}${normalizedPath}`;
}

export function truncateDescription(value: string | null | undefined, fallback = DEFAULT_DESCRIPTION) {
    const normalized = (value || fallback).replace(/\s+/g, " ").trim();
    if (normalized.length <= 155) return normalized;
    return `${normalized.slice(0, 152).trim()}...`;
}

export function buildMetadata({
    title,
    description,
    path,
    image,
    type = "website",
    noIndex = false,
}: {
    title: string;
    description?: string | null;
    path: string;
    image?: string | null;
    type?: "website" | "article";
    noIndex?: boolean;
}): Metadata {
    const cleanDescription = truncateDescription(description);
    const url = absoluteUrl(path);
    const imageUrl = image ? absoluteUrl(image) : absoluteUrl(DEFAULT_OG_IMAGE);

    return {
        title,
        description: cleanDescription,
        alternates: { canonical: url },
        openGraph: {
            title,
            description: cleanDescription,
            url,
            siteName: SITE_NAME,
            type,
            images: [{ url: imageUrl, width: 1200, height: 630 }],
            locale: "en_IN",
        },
        twitter: {
            card: "summary_large_image",
            site: SITE_HANDLE,
            title,
            description: cleanDescription,
            images: [imageUrl],
        },
        robots: noIndex
            ? { index: false, follow: true, googleBot: { index: false, follow: true } }
            : { index: true, follow: true, googleBot: { index: true, follow: true } },
    };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: absoluteUrl(item.path),
        })),
    };
}

export function jsonLdScript(data: unknown) {
    return {
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
    };
}
