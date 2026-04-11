import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE = process.env.NEXTAUTH_URL || "https://dealzone.onrender.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [products, categories, posts] = await Promise.all([
        prisma.product.findMany({ select: { slug: true, updatedAt: true } }),
        prisma.category.findMany({ select: { slug: true } }),          // Category has no updatedAt
        prisma.post.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    ]).catch(() => [[], [], []]);

    const staticRoutes: MetadataRoute.Sitemap = [
        { url: `${BASE}/`,           lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
        { url: `${BASE}/products`,   lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
        { url: `${BASE}/categories`, lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
        { url: `${BASE}/coupons`,    lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
        { url: `${BASE}/blog`,       lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
        { url: `${BASE}/compare`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ];

    const productRoutes: MetadataRoute.Sitemap = (products as any[]).map((p) => ({
        url: `${BASE}/products/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.9,
    }));

    const categoryRoutes: MetadataRoute.Sitemap = (categories as any[]).map((c) => ({
        url: `${BASE}/categories/${c.slug}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
    }));

    const postRoutes: MetadataRoute.Sitemap = (posts as any[]).map((p) => ({
        url: `${BASE}/blog/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
    }));

    return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...postRoutes];
}
