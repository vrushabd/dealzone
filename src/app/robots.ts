import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/enlightenment-panel/",
                    "/admin/",
                    "/api/",
                    "/checkout",
                    "/cart",
                    "/orders",
                    "/profile",
                ],
            },
            {
                userAgent: "Googlebot",
                allow: ["/", "/products/", "/categories/", "/blog/", "/coupons"],
                disallow: ["/enlightenment-panel/", "/admin/", "/api/"],
            },
        ],
        sitemap: absoluteUrl("/sitemap.xml"),
        host: absoluteUrl("/"),
    };
}
