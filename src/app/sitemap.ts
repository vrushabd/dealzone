import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE = process.env.NEXTAUTH_URL || "https://dealzone.onrender.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [products, categories, posts]: [
        Array<{ slug: string; updatedAt: Date }>,
        Array<{ slug: string }>,
        Array<{ slug: string; updatedAt: Date }>
    ] = await Promise.all([
        prisma.product.findMany({ 
            where: { isPublic: true },
            select: { slug: true, updatedAt: true } 
        }),
        prisma.category.findMany({ select: { slug: true } }),
        prisma.post.findMany({ 
            where: { published: true }, 
            select: { slug: true, updatedAt: true } 
        }),
    ]).catch(() => [[], [], []]);

    const staticRoutes: MetadataRoute.Sitemap = [
        { url: `${BASE}/`,           lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
        { url: `${BASE}/products`,   lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
        { url: `${BASE}/categories`, lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
        { url: `${BASE}/coupons`,    lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
        { url: `${BASE}/blog`,       lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
        { url: `${BASE}/compare`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
        { url: `${BASE}/contact`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
        { url: `${BASE}/disclaimer`, lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
        { url: `${BASE}/privacy`,    lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
        { url: `${BASE}/terms`,      lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    ];

    const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
        url: `${BASE}/products/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.9,
    }));

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
        url: `${BASE}/categories/${c.slug}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
    }));

    const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
        url: `${BASE}/blog/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
    }));

    return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...postRoutes];
}
