import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [products, categories, posts]: [
        Array<{ slug: string; updatedAt: Date; image: string | null }>,
        Array<{ slug: string }>,
        Array<{ slug: string; updatedAt: Date; image: string | null }>
    ] = await Promise.all([
        prisma.product.findMany({ 
            where: { isPublic: true },
            select: { slug: true, updatedAt: true, image: true } 
        }),
        prisma.category.findMany({ select: { slug: true } }),
        prisma.post.findMany({ 
            where: { published: true }, 
            select: { slug: true, updatedAt: true, image: true } 
        }),
    ]).catch(() => [[], [], []]);

    const staticRoutes: MetadataRoute.Sitemap = [
        { url: absoluteUrl("/"),           lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
        { url: absoluteUrl("/products"),   lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
        { url: absoluteUrl("/categories"), lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
        { url: absoluteUrl("/coupons"),    lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
        { url: absoluteUrl("/blog"),       lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },

        { url: absoluteUrl("/contact"),    lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
        { url: absoluteUrl("/disclaimer"), lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
        { url: absoluteUrl("/privacy"),    lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
        { url: absoluteUrl("/terms"),      lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    ];

    const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
        url: absoluteUrl(`/products/${p.slug}`),
        lastModified: p.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.9,
        images: p.image ? [absoluteUrl(p.image)] : undefined,
    }));

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
        url: absoluteUrl(`/categories/${c.slug}`),
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
    }));

    const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
        url: absoluteUrl(`/blog/${p.slug}`),
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
        images: p.image ? [absoluteUrl(p.image)] : undefined,
    }));

    return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...postRoutes];
}
